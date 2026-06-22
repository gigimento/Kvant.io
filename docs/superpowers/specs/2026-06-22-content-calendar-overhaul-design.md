# Content Calendar Overhaul — Design Spec

## Overview
Transform the basic content calendar into a full-featured content planning hub with Kanban workflow, multi-platform support, AI caption generation, approval workflow, and user assignments.

## Status
Approved by user on 2026-06-22.

---

## 1. Database Schema

### 1.1 `content_calendar` — new columns (migration 016)

```sql
ALTER TABLE content_calendar
  ADD COLUMN platform TEXT[],                              -- ['instagram', 'tiktok', 'facebook', 'youtube']
  ADD COLUMN content_type TEXT,                            -- 'blog', 'social_post', 'video', 'carousel'
  ADD COLUMN scheduled_time TIME,                          -- specific time of day
  ADD COLUMN assigned_to UUID REFERENCES auth.users(id),   -- who is responsible
  ADD COLUMN media_urls JSONB DEFAULT '[]'::jsonb,         -- media attachments
  ADD COLUMN ai_generated BOOLEAN DEFAULT false,
  ADD COLUMN ai_caption TEXT,                              -- AI-generated caption (editable by user)
  ADD COLUMN evergreen_config JSONB;                       -- { enabled: bool, interval_days: int }
```

### 1.2 Status values

Change CHECK constraint to: `'draft', 'review', 'approved', 'scheduled', 'published'`

### 1.3 New indexes

```sql
CREATE INDEX idx_calendar_status ON content_calendar(user_id, status);
CREATE INDEX idx_calendar_assigned ON content_calendar(user_id, assigned_to);
```

### 1.4 `calendar_comments` table (migration 016)

```sql
CREATE TABLE calendar_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entry_id UUID NOT NULL REFERENCES content_calendar(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  comment TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE calendar_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read comments on their entries"
  ON calendar_comments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM content_calendar
      WHERE content_calendar.id = calendar_comments.entry_id
      AND content_calendar.user_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM content_calendar
      WHERE content_calendar.id = calendar_comments.entry_id
      AND content_calendar.assigned_to = auth.uid()
    )
  );

CREATE POLICY "Users can insert own comments"
  ON calendar_comments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own comments"
  ON calendar_comments FOR DELETE
  USING (auth.uid() = user_id);

CREATE INDEX idx_calendar_comments_entry ON calendar_comments(entry_id);
```

---

## 2. API Endpoints

### 2.1 Existing — extended

| Method | Route | Changes |
|--------|-------|---------|
| `GET` | `/api/content-calendar` | New query params: `status` (comma-sep), `platform` (comma-sep), `assigned_to` |
| `POST` | `/api/content-calendar` | Body expanded with `platform`, `content_type`, `scheduled_time`, `assigned_to`, `media_urls`, `ai_caption`, `evergreen_config` |
| `PATCH` | `/api/content-calendar/[id]` | Same expanded fields, validates new CHECK constraint |
| `DELETE` | `/api/content-calendar/[id]` | Unchanged |

### 2.2 New endpoints

| Method | Route | Purpose |
|--------|-------|---------|
| `POST` | `/api/content-calendar/ai-fill` | Generate AI caption from brief. Body: `{ brief_id, platform, content_type }`. Returns `{ caption, hashtags[], suggestions[] }` |
| `POST` | `/api/content-calendar/bulk` | Create multiple entries at once. Body: `{ entries: [...] }` |
| `POST` | `/api/content-calendar/[id]/comments` | Add comment. Body: `{ comment }` |
| `GET` | `/api/content-calendar/[id]/comments` | List comments for an entry |
| `GET` | `/api/users` | List available users for assignment (filtered to app users) |

---

## 3. UI

### 3.1 View tabs (top of page)
- **Calendar** — default
- **Kanban** — pipeline view

### 3.2 Calendar tab
- Existing month grid, extended:
  - Entry shows platform dots (Instagram pink `#E1306C`, TikTok cyan `#00F2EA`, Facebook blue `#1877F2`, YouTube red `#FF0000`)
  - Content type badge (small)
  - Assignment avatar (small, top-right corner)
- Click day → **EntryForm** (modal/panel):
  - Title (required)
  - Platform: multi-select checkboxes with icons
  - Content type: dropdown (blog, social_post, video, carousel)
  - Date + Time picker
  - Assigned to: dropdown of users
  - Status: select (draft/review/approved/scheduled/published)
  - Media URLs: list of text inputs (add/remove)
  - AI Caption: textarea (generated or manual)
  - Evergreen toggle + interval days
  - Save / Cancel
- Content briefs sidebar: drag brief onto a day → opens EntryForm with AI caption pre-filled

### 3.3 Kanban tab
- 5 columns: Draft | Review | Approved | Scheduled | Published
- Each column shows cards sorted by due date
- Card content: title, platform icons, content type badge, assignee avatar, date
- Drag card between columns → `PATCH` with new status
- Click card → same EntryForm modal for editing

### 3.4 Comments panel
- Bottom section of EntryForm modal
- Shows existing comments (avatar + name + text + timestamp)
- Add comment input field

### 3.5 AI integration
- In content briefs page: "Generate Post" button (replaces "Schedule to Calendar")
- Calls `POST /api/content-calendar/ai-fill` with `{ brief_id, platform, content_type }`
- Opens modal showing generated caption + hashtags
- User can edit caption before scheduling
- On save, creates calendar entry with `ai_generated: true`

### 3.6 Color scheme
- Platform colors: Instagram = `#E1306C`, TikTok = `#00F2EA`, Facebook = `#1877F2`, YouTube = `#FF0000`
- Status colors: Draft = yellow, Review = orange, Approved = blue, Scheduled = purple, Published = green
- Rest follows existing app palette (primary `#27262E`, accent `#E19C63`, secondary `#8BA5BE`)

---

## 4. Data Flow

### 4.1 AI caption generation
```
Brief generate route → POST /api/content-calendar/ai-fill
  → fetch brief from DB
  → build prompt with brief content + platform + content_type
  → askLLMWithSystem(system, prompt, "fast")
  → parse response → return { caption, hashtags, suggestions }
```

### 4.2 Kanban drag-and-drop
```
User drags card → onDrop event
  → PATCH /api/content-calendar/[id] { status: "new_status" }
  → optimistic UI update
  → on error: revert
```

### 4.3 Bulk scheduling
```
POST /api/content-calendar/bulk
  → validate each entry
  → insert all in a single query
  → return created entries
```

---

## 5. Files to Create / Modify

### Migration
- `supabase/migrations/016_content_calendar_overhaul.sql`

### New files
- `src/app/api/content-calendar/ai-fill/route.ts` — AI caption generation
- `src/app/api/content-calendar/bulk/route.ts` — bulk scheduling
- `src/app/api/content-calendar/[id]/comments/route.ts` — comments CRUD
- `src/app/api/users/route.ts` — user list for assignment
- `src/components/calendar/entry-form.tsx` — add/edit modal form
- `src/components/calendar/kanban-view.tsx` — Kanban board
- `src/components/calendar/kanban-card.tsx` — individual Kanban card
- `src/components/calendar/comments-panel.tsx` — comments section
- `src/components/calendar/ai-fill-modal.tsx` — AI caption review modal

### Modified files
- `src/app/api/content-calendar/route.ts` — extended filters + fields
- `src/app/api/content-calendar/[id]/route.ts` — extended fields
- `src/components/calendar/content-calendar.tsx` — tabs + platform dots + assignee display
- `src/app/dashboard/content-briefs/page.tsx` — AI Generate Post button
- `src/app/dashboard/content-calendar/page.tsx` — layout adjustments
- `src/lib/features.ts` — no changes (feature slug remains `content-calendar`)
