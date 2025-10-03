PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS teams (
  team_id    INTEGER PRIMARY KEY AUTOINCREMENT,
  team_name  TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS agents (
  agent_id    INTEGER PRIMARY KEY AUTOINCREMENT,
  agent_code  TEXT NOT NULL UNIQUE,
  agent_name  TEXT NOT NULL,
  team_id     INTEGER NOT NULL,
  role        TEXT NOT NULL DEFAULT 'agent',   -- 'agent' | 'supervisor'
  email       TEXT,
  phone       TEXT,
  hire_date   TEXT,
  is_active   INTEGER NOT NULL DEFAULT 1,
  FOREIGN KEY (team_id) REFERENCES teams(team_id)
);

-- seed teams
INSERT OR IGNORE INTO teams (team_id, team_name) VALUES
  (1, 'Inbound A'),
  (2, 'Inbound B');

-- seed agents
INSERT OR IGNORE INTO agents (agent_code, agent_name, team_id, role, email, phone)
VALUES
  ('AG001','Alice',1,'agent','alice@example.com','081-000-0001'),
  ('AG002','Bob',1,'agent','bob@example.com','081-000-0002'),
  ('SP001','Sopon',1,'supervisor','sp@example.com','081-000-0099');
