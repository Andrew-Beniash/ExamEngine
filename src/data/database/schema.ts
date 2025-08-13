export const DATABASE_NAME = 'exam_engine.db';
export const DATABASE_VERSION = 1;

export const CREATE_TABLES = [
  `CREATE TABLE IF NOT EXISTS question (
    id TEXT PRIMARY KEY,
    type TEXT NOT NULL CHECK (type IN ('single', 'multi', 'scenario', 'order')),
    stem TEXT NOT NULL,
    topic_ids TEXT NOT NULL,
    choices TEXT,
    correct TEXT,
    correct_order TEXT,
    difficulty TEXT NOT NULL CHECK (difficulty IN ('easy', 'med', 'hard')),
    explanation TEXT,
    exhibits TEXT,
    pack_id TEXT NOT NULL
  );`,
  
  `CREATE TABLE IF NOT EXISTS exam_template (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    duration_minutes INTEGER NOT NULL,
    sections TEXT NOT NULL,
    calculator_rules TEXT,
    pack_id TEXT NOT NULL
  );`,
  
  `CREATE TABLE IF NOT EXISTS attempt (
    id TEXT PRIMARY KEY,
    template_id TEXT,
    pack_id TEXT NOT NULL,
    started_at INTEGER NOT NULL,
    ended_at INTEGER,
    score REAL,
    summary TEXT,
    device_guid TEXT NOT NULL
  );`,
  
  `CREATE TABLE IF NOT EXISTS attempt_item (
    attempt_id TEXT NOT NULL,
    question_id TEXT NOT NULL,
    given TEXT,
    correct INTEGER NOT NULL CHECK (correct IN (0, 1)),
    time_spent_ms INTEGER NOT NULL,
    PRIMARY KEY (attempt_id, question_id),
    FOREIGN KEY (attempt_id) REFERENCES attempt(id),
    FOREIGN KEY (question_id) REFERENCES question(id)
  );`,
  
  `CREATE TABLE IF NOT EXISTS tip (
    id TEXT PRIMARY KEY,
    topic_ids TEXT NOT NULL,
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    pack_id TEXT NOT NULL
  );`,
  
  `CREATE TABLE IF NOT EXISTS pack (
    id TEXT PRIMARY KEY,
    version TEXT NOT NULL,
    sha256 TEXT NOT NULL,
    signature TEXT NOT NULL,
    installed_at INTEGER NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('active', 'disabled', 'updating'))
  );`
];

export const CREATE_INDEXES = [
  'CREATE INDEX IF NOT EXISTS idx_question_topic_ids ON question(topic_ids);',
  'CREATE INDEX IF NOT EXISTS idx_question_pack_id ON question(pack_id);',
  'CREATE INDEX IF NOT EXISTS idx_question_difficulty ON question(difficulty);',
  'CREATE INDEX IF NOT EXISTS idx_attempt_started_at ON attempt(started_at);',
  'CREATE INDEX IF NOT EXISTS idx_attempt_device_guid ON attempt(device_guid);',
  'CREATE INDEX IF NOT EXISTS idx_tip_topic_ids ON tip(topic_ids);',
  'CREATE INDEX IF NOT EXISTS idx_pack_status ON pack(status);'
];
