-- Initial schema for team26
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS teams (
  id uuid PRIMARY KEY,
  team_name text NOT NULL,
  owner_id uuid NOT NULL REFERENCES users(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS team_members (
  team_id uuid NOT NULL REFERENCES teams(id),
  user_id uuid NOT NULL REFERENCES users(id),
  joined_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (team_id, user_id)
);

CREATE TABLE IF NOT EXISTS team_tags (
  id uuid PRIMARY KEY,
  team_id uuid NOT NULL REFERENCES teams(id),
  tag text UNIQUE NOT NULL,
  created_user_id uuid NOT NULL REFERENCES users(id),
  limited_until timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
