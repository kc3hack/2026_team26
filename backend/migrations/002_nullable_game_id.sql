-- Make game_id nullable in fatigue_logs
ALTER TABLE fatigue_logs ALTER COLUMN game_id DROP NOT NULL;
-- no need to change FK; nullable references are allowed
