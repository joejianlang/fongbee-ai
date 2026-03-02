-- ============================================================
-- Migration: Add 'address' value to FormFieldType enum
-- ============================================================
-- Run this in Supabase SQL Editor ONCE before deploying code
-- that uses the new 'address' field type.
--
-- Background: PostgreSQL enums cannot be modified by a plain
-- ALTER TABLE; you must use ALTER TYPE ... ADD VALUE instead.
-- Prisma's migration system cannot do this automatically for
-- Supabase (transaction-mode connection pooler), so we do it
-- manually here.
-- ============================================================

-- Check if value already exists to make this idempotent
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_enum e
    JOIN pg_type t ON t.oid = e.enumtypid
    WHERE t.typname = 'FormFieldType'
      AND e.enumlabel = 'address'
  ) THEN
    ALTER TYPE "FormFieldType" ADD VALUE 'address';
    RAISE NOTICE 'Added address to FormFieldType enum.';
  ELSE
    RAISE NOTICE 'address already exists in FormFieldType enum, skipping.';
  END IF;
END
$$;
