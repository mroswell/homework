---
layout: dashboard
title: Instructor Dashboard
---

## Quick Reference: Adding Tasks

To add a new task to a lesson:

**1. Add to the database** (in Supabase SQL Editor):

```sql
INSERT INTO tasks (id, page_slug, title, url, display_order) VALUES
('new-task-id', 'homework-2', 'Task description', 'https://example.com', 6);
```

**2. Add to your markdown file** (in the `tasks:` section):

```yaml
  - id: new-task-id
    text: Task description
    url: https://example.com
    link_text: Example Link
```

The `id` in your markdown must exactly match the `id` in your database. Existing student progress is preserved when you add new tasks.
