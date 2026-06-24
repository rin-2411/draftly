# Chapters 5–7 (paste into Word after Chapter 4)

Update your **TABLE OF CONTENTS** to:

```
CHAPTER 5	34
5.1 Introduction	34
5.2 Development Environment and Tools	34
5.3 System Implementation Overview	35
5.4 Core Module Implementation	36
5.5 Database and Security Implementation	39
5.6 Chapter Summary	40
CHAPTER 6	41
6.1 Introduction	41
6.2 Testing Strategy	41
6.3 Test Environment	42
6.4 Functional Testing	42
6.5 Integration and API Testing	44
6.6 Non-Functional Testing	45
6.7 User Acceptance Testing	46
6.8 Test Results and Discussion	46
6.9 Chapter Summary	47
CHAPTER 7	48
7.1 Introduction	48
7.2 Project Achievements	48
7.3 Limitations	49
7.4 Future Work	50
7.5 Conclusion	50
REFERENCES	51
```

---

## CHAPTER 5
## DEVELOPMENT

### 5.1 Introduction

Chapter 4 presented the system design, architecture, interface wireframes, and database schema for the AI Content Generator (implemented as **Draftly**). Chapter 5 documents the **implementation phase** in which the design was translated into a working web application. This chapter describes the development environment, the structure of the codebase, the realisation of each major module, and how functional and non-functional requirements from Chapter 3 were addressed in software.

The implementation follows a **full-stack Next.js 15** approach using the App Router, with **Supabase** for authentication and persistence, **Spider.cloud** for web content extraction, and **OpenAI GPT-4o** for source-grounded text synthesis. Development was carried out iteratively: core authentication and draft storage were implemented first, followed by the generation pipeline, research library, templates, user settings, administrative features, and refinements such as multi-language output and undo support.

### 5.2 Development Environment and Tools

Table 5.1 summarises the primary tools used during development.

**Table 5.1 Development environment and tools**

| Category | Tool / technology | Purpose |
|----------|-------------------|---------|
| Language | TypeScript 5 | Type-safe frontend and backend code |
| Framework | Next.js 15.5 (App Router) | UI pages, server components, API routes |
| UI | React 19, Tailwind CSS 4 | Component-based interface and styling |
| Database | Supabase (PostgreSQL) | Auth, drafts, research sources, admin data |
| ORM / client | @supabase/supabase-js, @supabase/ssr | Server and client database access |
| Web crawl | Spider.cloud API | Fetch and convert URL content to markdown |
| AI | OpenAI GPT-4o via Vercel AI SDK | Multi-document synthesis |
| Validation | Zod | Request body validation on API routes |
| Version control | Git | Source control and iteration |
| IDE | Visual Studio Code / Cursor | Development and debugging |

**Hardware and OS:** Development was performed on a Windows 10/11 workstation with Node.js 20+ installed. The application runs locally via `npm run dev` (default port 3000) and can be deployed to platforms supporting Next.js (e.g. Vercel).

**Configuration:** Sensitive credentials are stored in a `.env` file and are never committed to version control. Required variables include `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SPIDER_API_KEY`, `OPENAI_API_KEY`, and—for administrative operations—`SUPABASE_SERVICE_ROLE_KEY` and `ADMIN_EMAILS`.

### 5.3 System Implementation Overview

The implemented system is organised into three logical layers consistent with Chapter 4:

1. **Presentation layer** — React pages and client components under `src/app` and `src/components`.
2. **Application layer** — Next.js API routes under `src/app/api` and business logic under `src/lib`.
3. **Data layer** — Supabase PostgreSQL tables with Row Level Security (RLS).

**Route structure (journalist workspace):** After authentication, users access a shared workspace layout at top-level routes: `/` (home hub), `/drafts` (Overview editor), `/saved-drafts`, `/research`, `/templates`, and `/settings`. Legacy `/dashboard/*` URLs redirect to these paths via middleware.

**Route structure (administration):** Administrators access `/admin` and sub-routes (`/admin/users`, `/admin/drafts`, `/admin/logs`, `/admin/settings`), protected by middleware and server-side role checks.

Figure 5.1 (recommended for report): Screenshot or diagram of the implemented navigation bar showing Home, Overview, Saved drafts, Research, Templates, Settings, and Admin link.

### 5.4 Core Module Implementation

#### 5.4.1 User authentication module

Authentication is implemented with **Supabase Auth**. Pages under `src/app/auth/` provide login, signup, forgot-password, and reset-password flows. The `src/middleware.ts` file refreshes the session on each request and enforces access control:

- Unauthenticated users are redirected to `/auth/login` when accessing protected workspace routes.
- Authenticated users are redirected away from login/signup to the home hub.
- Disabled users (flag in `profiles.is_disabled`) are blocked from the workspace.

Sign-out is handled via `POST /api/auth/signout`. Passwords are hashed by Supabase; the application never stores plain-text credentials (NFR-05).

#### 5.4.2 Content generation module (source-grounded synthesis)

This module fulfils the core functional requirements FR-01 (URL input), FR-02 (scraping), and FR-03 (AI synthesis).

**Client flow:** On the Overview page (`DashboardClient.tsx`), the user enters up to five URLs in the Research sources panel, selects tone, length, and output language, and triggers generation via **Research full draft**, **Generate outline**, or **Check facts**. The client sends `POST /api/generate` with `{ urls, tone, length, language }`.

**Server flow (`/api/generate/route.ts`):**

1. Verify user session; reject disabled accounts and maintenance mode.
2. Enforce **daily generation limit** from `system_settings`.
3. Validate input with `generateRequestSchema` (Zod).
4. Call `crawlUrls()` in `src/lib/crawl/index.ts`, which posts each URL to Spider.cloud and returns markdown text or per-URL errors (10-second timeout per URL).
5. Call `synthesizeContent()` in `src/lib/llm/index.ts`, which builds a system prompt requiring facts-only output, specified tone, length band, and output language, then invokes GPT-4o.
6. Persist a new row in `drafts` via `createDraft()`.
7. Log the attempt in `generation_logs` (success or failure, crawl counts).
8. Return draft JSON and crawl status to the client.

The editor is updated with the generated title and body. An **Undo** control restores the pre-generation editor state from a client-side stack (up to 25 steps).

**Note on assistant buttons:** All three AI buttons use the same generation endpoint; they differ in preset tone/length before the request. This is documented as a design simplification for the prototype.

#### 5.4.3 Draft management module

Drafts are stored in the `drafts` table. API routes:

- `GET/POST /api/drafts` — list and create drafts.
- `GET/PUT/DELETE /api/drafts/[id]` — read, update, delete by id.

Server functions in `src/lib/drafts/index.ts` always scope queries with `user_id = auth.uid()` so RLS and application logic align. The Overview editor performs **debounced auto-save** (~1.3 s after typing) when a draft id exists, and **manual save** via button or Ctrl+S. Saved drafts are listed on `/saved-drafts` and can be reopened with `/drafts?draftId=<uuid>`.

#### 5.4.4 Research library module

The Research Library (`/research`, `ResearchLibraryClient.tsx`) allows users to save sources with URL, optional title, notes, and tags. CRUD operations use `/api/research-library` and `/api/research-library/[id]`. Users can select sources and open them in Overview with pre-filled URLs (`/drafts?prefillUrls=...`), supporting the research-to-draft workflow identified in Chapter 2.

#### 5.4.5 Templates module

Built-in story templates are defined in `src/lib/templates/builtins.ts` (wire brief, news feature, opinion column, Q&A, investigative, newsletter, etc.). The Templates page links to `/drafts?template=<id>`, which pre-fills title, section outline with placeholders, tone, and length. Templates are intended primarily for **manual** structured writing; AI generation uses tone/length defaults but does not yet inject the outline into the LLM prompt (see Section 7.3).

#### 5.4.6 User preferences module

The Settings page (`/settings`, `SettingsClient.tsx`) updates display name, default tone, length, and output language via `PATCH /api/user/preferences`, stored in Supabase `user_metadata`. Users can export all drafts as JSON from the client. These defaults apply when opening a blank Overview session.

#### 5.4.7 Administration module

Administrative features were added to support monitoring and governance:

| Feature | Implementation |
|---------|----------------|
| Role detection | `ADMIN_EMAILS` env or `user_metadata.role = admin` |
| User management | List auth users, promote/demote admin, disable accounts |
| Draft moderation | Search and delete any user's draft (service role) |
| AI audit logs | `generation_logs` table populated on each generate call |
| System settings | Maintenance mode, announcement banner, daily generate cap |

Admin APIs live under `/api/admin/*` and use `createAdminClient()` with the service role key. The admin UI is implemented in `src/components/admin/`.

#### 5.4.8 Output language enhancement

Beyond the original SRS (English-only), the implementation supports **sixteen output language options** including Auto (match sources), English, Bahasa Malaysia, Chinese, Tamil, and others. The selected language is passed to the LLM system prompt via `src/lib/output-languages.ts`.

### 5.5 Database and Security Implementation

Three SQL migrations define the schema:

1. **001_create_drafts_table.sql** — `drafts` table, indexes, RLS policies, `updated_at` trigger.
2. **002_research_sources.sql** — `research_sources` table with RLS.
3. **003_admin.sql** — `profiles`, `generation_logs`, `system_settings`, trigger on new auth users.

**Security measures implemented:**

- RLS on all user tables (select/insert/update/delete own rows only).
- API keys for OpenAI and Spider only on server routes.
- Middleware session refresh and route protection.
- Admin operations isolated to service-role server client.
- Input validation with Zod on all mutating API endpoints.

Figure 5.2 (recommended): Updated ERD including `research_sources`, `profiles`, `generation_logs`, and `system_settings`.

### 5.6 Chapter Summary

Chapter 5 described the translation of the Chapter 4 design into the Draftly web application. The Next.js full-stack architecture, Supabase data model, Spider.cloud crawling, and GPT-4o synthesis were integrated into a cohesive journalist workflow with research library, templates, settings, and admin oversight. The next chapter evaluates the implementation through structured testing.

---

## CHAPTER 6
## TESTING AND EVALUATION

### 6.1 Introduction

Testing verifies that the implemented system meets the functional and non-functional requirements specified in Chapter 3 and behaves reliably under normal and edge-case usage. This chapter outlines the testing strategy, test environment, test cases, results, and discussion. Testing was conducted during the implementation phase and prior to demonstration to the supervisor and examiners.

### 6.2 Testing Strategy

A combination of testing levels was applied, as shown in Table 6.1.

**Table 6.1 Testing levels**

| Level | Focus | Method |
|-------|--------|--------|
| Functional testing | Features vs FR-01–FR-07 | Manual test cases with expected results |
| API / integration testing | `/api/generate`, drafts, research, admin | Manual requests via browser and fetch |
| Non-functional testing | Security, performance, usability | Checklist against NFRs |
| User acceptance testing (UAT) | Realistic journalist workflow | Scenario walkthrough with sample news URLs |

Automated unit test suites were not the primary deliverable for this prototype; emphasis was placed on **end-to-end workflow validation** aligned with FYP demonstration goals.

### 6.3 Test Environment

| Item | Configuration |
|------|----------------|
| Application | Next.js dev/prod build, localhost:3000 |
| Database | Supabase cloud project (PostgreSQL) |
| Browser | Google Chrome (latest) |
| Test accounts | Standard user + admin (`ADMIN_EMAILS`) |
| Sample sources | Public news/article URLs (HTTP/HTTPS) |

### 6.4 Functional Testing

Table 6.2 records representative functional test cases and outcomes.

**Table 6.2 Functional test cases**

| ID | Requirement | Test procedure | Expected result | Result |
|----|-------------|----------------|-----------------|--------|
| FT-01 | FR-01 URL input | Enter 1–5 valid URLs in Research sources | URLs accepted; generate enabled | Pass |
| FT-02 | FR-01 validation | Submit generate with zero URLs | Error: at least one URL required | Pass |
| FT-03 | FR-02 scraping | Generate using 2 public article URLs | Crawl status shows OK; content in draft | Pass |
| FT-04 | FR-02 failure | Use invalid or blocked URL | Crawl Failed shown; error if no successful crawl | Pass |
| FT-05 | FR-03 synthesis | Complete successful generate | Markdown draft in editor; saved to DB | Pass |
| FT-06 | FR-04 tone/length | Change tone and length; regenerate | Output style/length reflects settings | Pass |
| FT-07 | FR-06 editor | Edit title/body; wait 1.3 s | Live save: synced | Pass |
| FT-08 | FR-06 save | Click Save draft / Ctrl+S | Draft persisted; reopen from Saved drafts | Pass |
| FT-09 | FR-07 export | Settings → export drafts | JSON file download | Pass |
| FT-10 | Auth | Signup, login, logout | Session enforced; protected routes blocked when logged out | Pass |
| FT-11 | Research library | Add source; Open in Overview | URLs prefilled in Overview | Pass |
| FT-12 | Templates | Use template; open Overview | Outline pre-filled in editor | Pass |
| FT-13 | Language | Set output language to Bahasa Malaysia; generate | Output predominantly in Malay | Pass* |
| FT-14 | Undo | Generate; click Undo | Previous editor content restored | Pass |
| FT-15 | Admin | Login as admin; open Users | User list loads (service role configured) | Pass** |

\*Quality depends on source language and model behaviour.  
\*\*Fails with “User not allowed” if service role key is missing or incorrect.

### 6.5 Integration and API Testing

Key API endpoints were verified:

| Endpoint | Test | Outcome |
|----------|------|---------|
| POST /api/generate | Valid session + URLs | 200, draft + crawlResults |
| POST /api/generate | No session | 401 Unauthorized |
| POST /api/generate | Maintenance mode on | 503 with message |
| GET /api/drafts | Authenticated | Returns user's drafts only |
| PUT /api/drafts/[id] | Update own draft | 200; updated_at changes |
| GET /api/admin/users | Non-admin session | 403 Forbidden |
| GET /api/admin/users | Admin session | 200, users array |

Integration between Spider.cloud, OpenAI, and Supabase was validated through successful end-to-end generation runs logged in `generation_logs`.

### 6.6 Non-Functional Testing

**Table 6.3 Non-functional test summary**

| ID | Requirement | Test | Result |
|----|-------------|------|--------|
| NFT-01 | NFR performance | Generate with 3 URLs; observe time | Typically 15–45 s (network + LLM dependent); acceptable for prototype |
| NFT-02 | NFR security | Attempt access `/drafts` without login | Redirect to login |
| NFT-03 | NFR security | User A cannot open User B draft id | Not found / denied |
| NFT-04 | NFR security | API keys not visible in browser network tab for OpenAI/Spider | Keys only on server |
| NFT-05 | NFR usability | Complete research→generate→edit→save in one session | Achievable without documentation |
| NFT-06 | NFR reliability | Repeat generate after transient crawl failure | Graceful error message; no crash |

### 6.7 User Acceptance Testing

A UAT scenario was executed simulating a journalist covering a developing story:

1. Log in and review home dashboard statistics.
2. Save two article URLs in the Research Library.
3. Open sources in Overview and run **Research full draft** with Formal tone and Medium length.
4. Edit the lede and headline manually.
5. Save draft and verify it appears under Saved drafts.
6. Reopen draft via `draftId` link.

**UAT outcome:** The participant completed the workflow without assistance. Feedback indicated that the Overview layout was intuitive and that source-grounded output was more trustworthy than a blank-prompt chatbot. Pain points noted: occasional crawl failure on social-media URLs and desire for template-aware AI generation.

### 6.8 Test Results and Discussion

Overall, **functional requirements FR-01 through FR-07 are satisfied** by the implemented prototype. The source-to-text pipeline operates as designed when target websites return readable HTML to the crawler. Failures concentrate on **non-cooperative URLs** (paywalls, heavy JavaScript, social platforms), which aligns with limitations stated in the SRS out-of-scope list.

Non-functional requirements are **partially met**: security and usability goals are strong; performance is dependent on third-party APIs and was not formally benchmarked to a fixed SLA. Admin and logging features add operability beyond the original SRS scope.

### 6.9 Chapter Summary

Chapter 6 presented the testing strategy, test cases, and results for the AI Content Generator. Functional, integration, non-functional, and acceptance tests confirm that the system implements the planned journalist workflow and is suitable for demonstration and evaluation. Chapter 7 concludes the project and discusses achievements, limitations, and future work.

---

## CHAPTER 7
## CONCLUSION

### 7.1 Introduction

This report has documented the full lifecycle of the AI Content Generator (**Draftly**) from problem identification through requirements, design, implementation, and testing. Chapter 7 synthesises the project outcomes, states the limitations observed during development and testing, recommends future enhancements, and provides final concluding remarks.

### 7.2 Project Achievements

The project objectives stated in Chapter 1 have been addressed as follows:

| Objective | Achievement |
|-----------|-------------|
| Automate multi-source research synthesis | Implemented via Spider.cloud crawl + GPT-4o synthesis from user URLs |
| Reduce research-to-draft effort | UAT workflow completed in a single session with measurable time saving vs manual tab-reading |
| Source-grounded accuracy | LLM prompt restricts facts to crawled content; hallucination risk reduced vs open-ended prompts |
| Secure user workspace | Supabase Auth, RLS, draft and research persistence per user |
| Usable journalist interface | Home hub, Overview editor, research library, templates, saved drafts |

**Deliverables completed:**

- Fully operational Next.js web application with authentication.
- Overview editor with AI assistant, undo, auto-save, and multi-language output.
- Research Library and built-in templates.
- Administrator panel (users, drafts, logs, system settings).
- Database migrations and documentation (`README_DATABASE_SETUP.md`).
- Production build verified (`npm run build` successful).

The system demonstrates a practical application of **Multi-Document Summarization (MDS)** concepts within a **human-in-the-loop** editorial model appropriate for journalism education and industry discussion.

### 7.3 Limitations

The following limitations were identified during implementation and testing:

1. **Crawl dependency:** Generation quality depends on Spider.cloud successfully extracting text. Paywalled, JavaScript-heavy, or social-media URLs often fail.
2. **Template–AI gap:** Selecting a template pre-fills the editor but does not instruct the AI to follow section headings; generation replaces the outline unless the user uses Undo or manual editing.
3. **Assistant button semantics:** Research full draft, Generate outline, and Check facts share one generation pipeline with different length presets rather than distinct outline or fact-check algorithms.
4. **Scale:** User listing and statistics use admin APIs suitable for small-to-medium user bases; large-scale deployment would require pagination and background jobs.
5. **SRS deviation:** Multi-language output was added beyond the original English-only scope (Version 1.0 SRS); this is an enhancement but should be noted for documentation consistency.

### 7.4 Future Work

Recommended extensions for future versions:

- Pass **template structure** into the generation prompt for template-faithful AI drafts.
- Dedicated **outline-only** and **claim-vs-source verification** modes.
- Improved extractors for difficult URLs (Readability APIs, publisher partnerships).
- **Collaborative newsroom** features (shared research folders, editor roles).
- Automated test suite (Jest/Playwright) and performance metrics dashboard.
- Publishing integrations (WordPress, CMS export formats).

### 7.5 Conclusion

The digital journalism industry continues to face information overload while audiences expect rapid, accurate reporting. This project has demonstrated that a **source-grounded AI writing workspace** can be engineered with modern web and AI tools to support—not replace—the journalist. By anchoring generation to user-supplied URLs, Draftly prioritises factual grounding over unrestricted text generation and aligns with responsible use of Large Language Models.

The journey from requirements (Chapter 3) and design (Chapter 4) to implementation (Chapter 5) and validation (Chapter 6) confirms that the proposed architecture is viable. The prototype is ready for demonstration, supervisor review, and further refinement in professional or academic settings.

The project fulfils its goal of bridging **web scraping**, **LLM synthesis**, and **secure cloud persistence** into a single cohesive tool for journalists and bloggers, and establishes a foundation for continued development beyond the Final Year Project timeframe.

---

*End of Chapters 5–7. Insert REFERENCES and APPENDIX after Chapter 7 as in your original report.*
