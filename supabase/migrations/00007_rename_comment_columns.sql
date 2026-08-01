-- Migration: Rename submission_comments columns to match frontend conventions
-- The original migration (00004_backlog_features.sql) created the table with
-- `message_text` and `sender_id`, but the entire frontend codebase references
-- `comment_text` and `user_id`. Renaming here to align.

alter table public.submission_comments
  rename column message_text to comment_text;

alter table public.submission_comments
  rename column sender_id to user_id;
