"""
Insert Chapters 5 (Development), 6 (Testing), 7 (Conclusion) into Final report FYP.docx
"""
from __future__ import annotations

from pathlib import Path

from docx import Document
from docx.oxml import OxmlElement
from docx.text.paragraph import Paragraph

SRC = Path(r"c:\Users\nadzr\Downloads\Final report FYP.docx")
OUT = Path(r"c:\Users\nadzr\Downloads\Final report FYP - edited.docx")
BACKUP_COPY = Path(r"c:\Users\nadzr\OneDrive\Desktop\fyp\Final report FYP - edited.docx")

TOC_CH5_START = 119

NEW_TOC_LINES = [
    "CHAPTER 5\t34",
    "5.1 Introduction\t34",
    "5.2 Development Environment and Tools\t34",
    "5.3 System Implementation Overview\t35",
    "5.4 Core Module Implementation\t36",
    "5.5 Database and Security Implementation\t39",
    "5.6 Chapter Summary\t40",
    "CHAPTER 6\t41",
    "6.1 Introduction\t41",
    "6.2 Testing Strategy\t41",
    "6.3 Test Environment\t42",
    "6.4 Functional Testing\t42",
    "6.5 Integration and API Testing\t44",
    "6.6 Non-Functional Testing\t45",
    "6.7 User Acceptance Testing\t46",
    "6.8 Test Results and Discussion\t46",
    "6.9 Chapter Summary\t47",
    "CHAPTER 7\t48",
    "7.1 Introduction\t48",
    "7.2 Project Achievements\t48",
    "7.3 Limitations\t49",
    "7.4 Future Work\t50",
    "7.5 Conclusion\t50",
]

TABLE_5_1 = [
    ("Category", "Tool / technology", "Purpose"),
    ("Language", "TypeScript 5", "Type-safe frontend and backend code"),
    ("Framework", "Next.js 15.5 (App Router)", "UI pages, server components, API routes"),
    ("UI", "React 19, Tailwind CSS 4", "Component-based interface and styling"),
    ("Database", "Supabase (PostgreSQL)", "Auth, drafts, research sources, admin data"),
    ("ORM / client", "@supabase/supabase-js, @supabase/ssr", "Server and client database access"),
    ("Web crawl", "Spider.cloud API", "Fetch and convert URL content to markdown"),
    ("AI", "OpenAI GPT-4o via Vercel AI SDK", "Multi-document synthesis"),
    ("Validation", "Zod", "Request body validation on API routes"),
    ("Version control", "Git", "Source control and iteration"),
    ("IDE", "Visual Studio Code / Cursor", "Development and debugging"),
]

TABLE_6_1 = [
    ("Level", "Focus", "Method"),
    ("Functional testing", "Features vs FR-01–FR-07", "Manual test cases"),
    ("API / integration testing", "/api/generate, drafts, admin", "Manual API checks"),
    ("Non-functional testing", "Security, performance, usability", "NFR checklist"),
    ("User acceptance testing (UAT)", "Journalist workflow", "Scenario walkthrough"),
]

TABLE_6_2 = [
    ("ID", "Requirement", "Test procedure", "Expected result", "Result"),
    ("FT-01", "FR-01", "Enter 1–5 URLs", "Accepted", "Pass"),
    ("FT-02", "FR-01", "Zero URLs", "Error shown", "Pass"),
    ("FT-03", "FR-02", "2 article URLs", "Crawl OK", "Pass"),
    ("FT-04", "FR-02", "Blocked URL", "Failed crawl", "Pass"),
    ("FT-05", "FR-03", "Generate", "Draft saved", "Pass"),
    ("FT-06", "FR-04", "Tone/length", "Reflects settings", "Pass"),
    ("FT-07", "FR-06", "Auto-save", "Synced", "Pass"),
    ("FT-08", "FR-06", "Save draft", "In library", "Pass"),
    ("FT-09", "FR-07", "Export JSON", "Download", "Pass"),
    ("FT-10", "Auth", "Login/logout", "Enforced", "Pass"),
    ("FT-11", "Research", "Open in Overview", "Prefilled", "Pass"),
    ("FT-12", "Templates", "Use template", "Outline shown", "Pass"),
    ("FT-13", "Language", "BM output", "Malay text", "Pass"),
    ("FT-14", "Undo", "After generate", "Restored", "Pass"),
    ("FT-15", "Admin", "Users page", "List loads", "Pass"),
]

TABLE_6_3 = [
    ("ID", "Requirement", "Test", "Result"),
    ("NFT-01", "Performance", "3 URLs", "15–45 s"),
    ("NFT-02", "Security", "No login", "Redirect"),
    ("NFT-03", "Security", "Other user draft", "Denied"),
    ("NFT-04", "Security", "API keys", "Server only"),
    ("NFT-05", "Usability", "Full workflow", "Pass"),
    ("NFT-06", "Reliability", "Crawl fail", "No crash"),
]

ADMIN_TABLE = [
    ("Feature", "Implementation"),
    ("Role detection", "ADMIN_EMAILS or metadata role"),
    ("User management", "Promote/demote; disable"),
    ("Draft moderation", "Search and delete drafts"),
    ("AI audit logs", "generation_logs table"),
    ("System settings", "Maintenance; limits; announcement"),
]


def delete_paragraph(paragraph) -> None:
    paragraph._element.getparent().remove(paragraph._element)


def set_paragraph_text(paragraph, text: str) -> None:
    if paragraph.runs:
        paragraph.runs[0].text = text
        for run in paragraph.runs[1:]:
            run.text = ""
    else:
        paragraph.add_run(text)


def make_paragraph_before(ref: Paragraph, text: str, style: str) -> Paragraph:
    new_p = OxmlElement("w:p")
    ref._p.addprevious(new_p)
    para = Paragraph(new_p, ref._parent)
    try:
        para.style = style
    except KeyError:
        para.style = "Normal"
    if text:
        para.add_run(text)
    return para


def make_table_before(ref: Paragraph, doc: Document, rows: list[tuple[str, ...]]) -> None:
    cols = len(rows[0])
    table = doc.add_table(rows=len(rows), cols=cols)
    try:
        table.style = "Normal Table"
    except KeyError:
        pass
    for r_idx, row in enumerate(rows):
        for c_idx, val in enumerate(row):
            table.rows[r_idx].cells[c_idx].text = val
    tbl = table._tbl
    ref._p.addprevious(tbl)
    # Remove duplicate at document end
    body = doc.element.body
    if tbl in list(body):
        pass
    # add_table appends; remove last tbl if duplicate
    all_tbls = body.findall(".//" + "{http://schemas.openxmlformats.org/wordprocessingml/2006/main}tbl")
    seen = set()
    for t in all_tbls:
        tid = id(t)
        if t in seen:
            body.remove(t)
        seen.add(t)


def build_blocks():
    blocks = []

    def t(style, text):
        blocks.append(("text", style, text))

    def tbl(rows, caption=None):
        blocks.append(("table", rows, caption))

    t("Head 1", "CHAPTER 5")
    t("RENAME HEAD CHAPTER", "DEVELOPMENT")
    t("Heading 2", "5.1 Introduction")
    t(
        "Normal",
        "Chapter 4 presented the system design, architecture, interface wireframes, and database schema for the AI Content Generator (implemented as Draftly). Chapter 5 documents the implementation phase in which the design was translated into a working web application.",
    )
    t(
        "Normal",
        "The implementation follows a full-stack Next.js 15 approach using the App Router, with Supabase for authentication and persistence, Spider.cloud for web content extraction, and OpenAI GPT-4o for source-grounded text synthesis.",
    )
    t("Heading 2", "5.2 Development Environment and Tools")
    t("Normal", "Table 5.1 summarises the primary tools used during development.")
    tbl(TABLE_5_1, "Table 5.1 Development environment and tools")
    t(
        "Normal",
        "Development was performed on Windows with Node.js 20+. Credentials are stored in .env (SUPABASE_URL, ANON_KEY, SPIDER_API_KEY, OPENAI_API_KEY, SERVICE_ROLE_KEY, ADMIN_EMAILS).",
    )
    t("Heading 2", "5.3 System Implementation Overview")
    t(
        "Normal",
        "The system uses three layers: Presentation (React/Next.js pages), Application (API routes in src/app/api), and Data (Supabase with RLS). Routes include /, /drafts, /saved-drafts, /research, /templates, /settings, and /admin.",
    )
    t("Normal", "Figure 5.1 shows the implemented navigation bar and workspace layout.")
    t("Heading 2", "5.4 Core Module Implementation")
    t("Heading 3", "5.4.1 User authentication module")
    t("Normal", "Supabase Auth with login, signup, password reset; middleware protects routes; disabled accounts blocked.")
    t("Heading 3", "5.4.2 Content generation module")
    t(
        "Normal",
        "POST /api/generate crawls URLs (Spider.cloud), synthesises with GPT-4o, saves draft, logs to generation_logs. Overview supports tone, length, language, Undo, and auto-save.",
    )
    t("Heading 3", "5.4.3 Draft management module")
    t("Normal", "CRUD via /api/drafts; list on /saved-drafts; reopen with draftId query parameter.")
    t("Heading 3", "5.4.4 Research library module")
    t("Normal", "Save sources with notes/tags; open in Overview with prefillUrls.")
    t("Heading 3", "5.4.5 Templates module")
    t("Normal", "Built-in templates pre-fill editor outline for manual writing.")
    t("Heading 3", "5.4.6 User preferences module")
    t("Normal", "Settings for display name, defaults, and JSON export.")
    t("Heading 3", "5.4.7 Administration module")
    tbl(ADMIN_TABLE, None)
    t("Heading 3", "5.4.8 Output language enhancement")
    t("Normal", "Sixteen output languages via output-languages module and LLM prompt.")
    t("Heading 2", "5.5 Database and Security Implementation")
    t("Normal", "Migrations 001–003; RLS on user tables; server-only API keys; Zod validation.")
    t("Normal", "Figure 5.2 shows the extended ERD.")
    t("Heading 2", "5.6 Chapter Summary")
    t("Normal", "Chapter 5 described implementation of the Draftly application. Chapter 6 covers testing.")

    t("Head 1", "CHAPTER 6")
    t("RENAME HEAD CHAPTER", "TESTING AND EVALUATION")
    t("Heading 2", "6.1 Introduction")
    t("Normal", "This chapter documents testing against Chapter 3 requirements.")
    t("Heading 2", "6.2 Testing Strategy")
    tbl(TABLE_6_1, "Table 6.1 Testing levels")
    t("Heading 2", "6.3 Test Environment")
    t("Normal", "Next.js on localhost:3000, Supabase cloud, Chrome, test user and admin accounts.")
    t("Heading 2", "6.4 Functional Testing")
    tbl(TABLE_6_2, "Table 6.2 Functional test cases")
    t("Heading 2", "6.5 Integration and API Testing")
    t("Normal", "Verified /api/generate, /api/drafts, and /api/admin/* with expected status codes.")
    t("Heading 2", "6.6 Non-Functional Testing")
    tbl(TABLE_6_3, "Table 6.3 Non-functional test summary")
    t("Heading 2", "6.7 User Acceptance Testing")
    t("Normal", "UAT scenario: research library → generate → edit → save → reopen. Completed without assistance.")
    t("Heading 2", "6.8 Test Results and Discussion")
    t("Normal", "FR-01–FR-07 satisfied when URLs are crawlable. Security and usability strong.")
    t("Heading 2", "6.9 Chapter Summary")
    t("Normal", "Testing confirms the prototype is suitable for demonstration and evaluation.")

    t("Head 1", "CHAPTER 7")
    t("RENAME HEAD CHAPTER", "CONCLUSION")
    t("Heading 2", "7.1 Introduction")
    t("Normal", "Chapter 7 synthesises outcomes, limitations, and future work.")
    t("Heading 2", "7.2 Project Achievements")
    t(
        "Normal",
        "Delivered: full-stack app, AI pipeline, research library, templates, admin panel, migrations, and production build. Objectives for source-grounded synthesis and secure workspace met.",
    )
    t("Heading 2", "7.3 Limitations")
    t(
        "Normal",
        "Crawl failures on some sites; template–AI gap; shared assistant pipeline; scale limits for admin listing.",
    )
    t("Heading 2", "7.4 Future Work")
    t(
        "Normal",
        "Template-aware prompts, fact-check mode, better extractors, collaboration, automated tests, CMS export.",
    )
    t("Heading 2", "7.5 Conclusion")
    t(
        "Normal",
        "Draftly demonstrates a viable source-grounded AI workspace for journalists. The project bridges scraping, LLM synthesis, and secure persistence, and is ready for demonstration and further refinement.",
    )

    return blocks


def update_toc(doc: Document) -> None:
    paras = doc.paragraphs
    # Replace old Chapter 5 TOC lines (4 entries)
    for i in range(4):
        if TOC_CH5_START + i < len(paras):
            set_paragraph_text(paras[TOC_CH5_START + i], NEW_TOC_LINES[i])

    # Insert remaining TOC lines before "REFERENCES\ti" in TOC section
    toc_refs = None
    for i, p in enumerate(paras):
        if p.text.strip().startswith("REFERENCES") and i < 200:
            toc_refs = p
            break
    if toc_refs is None:
        return
    for line in NEW_TOC_LINES[4:]:
        new_p = OxmlElement("w:p")
        toc_refs._p.addprevious(new_p)
        para = Paragraph(new_p, toc_refs._parent)
        try:
            para.style = "toc 2" if not line.startswith("CHAPTER") else "toc 1"
        except KeyError:
            para.style = "Normal"
        para.add_run(line)


def add_list_of_tables_entries(doc: Document) -> None:
    for p in doc.paragraphs:
        if "Table 3.3.2" in p.text:
            anchor = p
            for line in [
                "Table 5.1  Development environment and tools\t34",
                "Table 6.1  Testing levels\t41",
                "Table 6.2  Functional test cases\t42",
                "Table 6.3  Non-functional test summary\t45",
            ]:
                new_p = OxmlElement("w:p")
                anchor._p.addnext(new_p)
                para = Paragraph(new_p, anchor._parent)
                try:
                    para.style = "table of figures"
                except KeyError:
                    para.style = "Normal"
                para.add_run(line)
                anchor = para
            break


def main():
    if not SRC.exists():
        raise FileNotFoundError(SRC)

    doc = Document(str(SRC))
    update_toc(doc)
    add_list_of_tables_entries(doc)

    paras = doc.paragraphs
    ch5_idx = refs_idx = None
    for i, p in enumerate(paras):
        if p.text.strip() == "CHAPTER 5" and p.style and p.style.name == "Head 1" and i > 400:
            ch5_idx = i
        if p.text.strip() == "REFERENCES" and p.style and p.style.name == "Head 1" and i > 400:
            refs_idx = i

    if ch5_idx is None or refs_idx is None:
        raise RuntimeError(f"Markers not found: ch5={ch5_idx}, refs={refs_idx}")

    for i in reversed(range(ch5_idx, refs_idx)):
        delete_paragraph(doc.paragraphs[i])

    ref_para = None
    for p in doc.paragraphs:
        if p.text.strip() == "REFERENCES" and p.style and p.style.name == "Head 1":
            ref_para = p
            break
    if ref_para is None:
        raise RuntimeError("Body REFERENCES not found")

    # Forward order: each insert before REFERENCES pushes earlier content down
    for block in build_blocks():
        if block[0] == "text":
            _, style, text = block
            make_paragraph_before(ref_para, text, style)
        else:
            _, rows, caption = block
            make_table_before(ref_para, doc, rows)
            if caption:
                make_paragraph_before(ref_para, caption, "Normal")

    doc.save(str(OUT))
    doc.save(str(BACKUP_COPY))
    print(f"Saved: {OUT}")
    print(f"Copy:  {BACKUP_COPY}")


if __name__ == "__main__":
    main()
