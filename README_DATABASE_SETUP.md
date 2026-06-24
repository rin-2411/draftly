# Database Setup Instructions

## Supabase Migration

To set up the database schema, you need to run the SQL migration file in your Supabase project.

### Steps:

1. **Access Supabase Dashboard**
   - Go to https://supabase.com/dashboard
   - Select your project (or create a new one)

2. **Run the Migrations**
   - Navigate to the SQL Editor in your Supabase dashboard
   - Run `supabase/migrations/001_create_drafts_table.sql` first (creates `drafts`).
   - Then run `supabase/migrations/002_research_sources.sql` (creates `research_sources` for the Research Library).
   - Then run `supabase/migrations/003_admin.sql` (profiles, generation logs, system settings).

3. **Verify the Setup**
   - Go to Table Editor in Supabase dashboard
   - You should see the `drafts` table created
   - Check that Row Level Security (RLS) is enabled
   - Verify the policies are created correctly

### Environment Variables

Make sure your `.env` file contains:
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
ADMIN_EMAILS=you@example.com
```

`SUPABASE_SERVICE_ROLE_KEY` and `ADMIN_EMAILS` are required for the admin panel (`/admin`). Comma-separate multiple admin emails in `ADMIN_EMAILS`.

### What the migrations create

- **`research_sources` table** (migration `002_research_sources.sql`): saved URLs per user with optional title, notes, and tags; RLS mirrors `drafts`.

- **drafts table** (`001`) with the following columns:
  - `id` (UUID, primary key)
  - `user_id` (UUID, foreign key to auth.users)
  - `title` (text, nullable)
  - `content` (text, required)
  - `source_urls` (text array, required)
  - `tone` (text, nullable)
  - `length` (text, nullable)
  - `created_at` (timestamp)
  - `updated_at` (timestamp)

- **Indexes** for performance:
  - Index on `user_id` for faster user queries
  - Index on `created_at` for chronological sorting

- **Row Level Security (RLS)** policies:
  - Users can only view their own drafts
  - Users can only insert their own drafts
  - Users can only update their own drafts
  - Users can only delete their own drafts

- **Automatic timestamp update** trigger:
  - `updated_at` is automatically updated when a draft is modified

### Testing the Setup

After running the migration, you can test by:
1. Creating a user account through the signup page
2. The user should be able to create drafts that are automatically linked to their user_id
3. Users should only see their own drafts in queries
