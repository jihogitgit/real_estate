-- Add total_units column to properties
ALTER TABLE properties ADD COLUMN IF NOT EXISTS total_units integer;
