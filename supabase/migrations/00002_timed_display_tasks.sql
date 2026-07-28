-- Migration: Add task_type and timed_display_seconds to tasks table
-- Description: Adds columns to support timed display (impression) tasks.

alter table public.tasks
  add column task_type text not null default 'standard' check (task_type in ('standard', 'timed_impression')),
  add column timed_display_seconds integer check (timed_display_seconds > 0);

-- Table-level constraint to ensure timed_display_seconds is set when task_type is 'timed_impression'
alter table public.tasks
  add constraint check_timed_display_seconds check (
    (task_type = 'standard' and timed_display_seconds is null) or
    (task_type = 'timed_impression' and timed_display_seconds is not null)
  );
