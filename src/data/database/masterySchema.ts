// Add these tables to your existing schema.ts file

export const MASTERY_TABLES = [
  `CREATE TABLE IF NOT EXISTS topic_proficiency (
    topic_id TEXT NOT NULL,
    device_guid TEXT NOT NULL,
    proficiency REAL NOT NULL DEFAULT 0.5,
    confidence REAL NOT NULL DEFAULT 0.0,
    total_attempts INTEGER NOT NULL DEFAULT 0,
    correct_attempts INTEGER NOT NULL DEFAULT 0,
    last_practiced INTEGER NOT NULL,
    consecutive_correct INTEGER NOT NULL DEFAULT 0,
    consecutive_incorrect INTEGER NOT NULL DEFAULT 0,
    average_time_spent INTEGER NOT NULL DEFAULT 0,
    difficulty_breakdown TEXT NOT NULL DEFAULT '{}',
    trend TEXT NOT NULL DEFAULT 'unknown',
    needs_review INTEGER NOT NULL DEFAULT 1,
    next_review_date INTEGER NOT NULL,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL,
    PRIMARY KEY (topic_id, device_guid)
  );`,

  `CREATE TABLE IF NOT EXISTS learning_session (
    id TEXT PRIMARY KEY,
    device_guid TEXT NOT NULL,
    start_time INTEGER NOT NULL,
    end_time INTEGER,
    topics_studied TEXT NOT NULL, -- JSON array
    questions_answered INTEGER NOT NULL DEFAULT 0,
    correct_answers INTEGER NOT NULL DEFAULT 0,
    time_spent INTEGER NOT NULL DEFAULT 0,
    proficiency_changes TEXT NOT NULL DEFAULT '{}', -- JSON object
    weak_areas_improved TEXT NOT NULL DEFAULT '[]', -- JSON array
    recommendation_followed TEXT,
    session_type TEXT NOT NULL DEFAULT 'practice', -- 'practice'|'exam'|'review'
    created_at INTEGER NOT NULL
  );`,

  `CREATE TABLE IF NOT EXISTS mastery_goal (
    id TEXT PRIMARY KEY,
    device_guid TEXT NOT NULL,
    topic_id TEXT NOT NULL,
    target_proficiency REAL NOT NULL,
    target_date INTEGER NOT NULL,
    status TEXT NOT NULL DEFAULT 'active',
    progress REAL NOT NULL DEFAULT 0.0,
    estimated_completion_date INTEGER NOT NULL,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
  );`,

  `CREATE TABLE IF NOT EXISTS practice_recommendation (
    id TEXT PRIMARY KEY,
    device_guid TEXT NOT NULL,
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    topic_ids TEXT NOT NULL, -- JSON array
    question_count INTEGER NOT NULL,
    estimated_duration INTEGER NOT NULL,
    difficulty TEXT NOT NULL,
    priority INTEGER NOT NULL,
    reasoning TEXT NOT NULL,
    expected_impact TEXT NOT NULL, -- JSON object
    created_at INTEGER NOT NULL,
    expires_at INTEGER NOT NULL,
    used INTEGER NOT NULL DEFAULT 0 -- 0 = not used, 1 = used
  );`,

  `CREATE TABLE IF NOT EXISTS question_performance (
    question_id TEXT NOT NULL,
    device_guid TEXT NOT NULL,
    topic_id TEXT NOT NULL,
    is_correct INTEGER NOT NULL,
    time_spent_ms INTEGER NOT NULL,
    difficulty TEXT NOT NULL,
    attempt_date INTEGER NOT NULL,
    session_id TEXT,
    proficiency_before REAL,
    proficiency_after REAL,
    PRIMARY KEY (question_id, device_guid, attempt_date)
  );`
];

export const MASTERY_INDEXES = [
  'CREATE INDEX IF NOT EXISTS idx_topic_proficiency_device ON topic_proficiency(device_guid);',
  'CREATE INDEX IF NOT EXISTS idx_topic_proficiency_topic ON topic_proficiency(topic_id);',
  'CREATE INDEX IF NOT EXISTS idx_topic_proficiency_last_practiced ON topic_proficiency(last_practiced);',
  'CREATE INDEX IF NOT EXISTS idx_topic_proficiency_needs_review ON topic_proficiency(needs_review);',
  'CREATE INDEX IF NOT EXISTS idx_topic_proficiency_next_review ON topic_proficiency(next_review_date);',
  
  'CREATE INDEX IF NOT EXISTS idx_learning_session_device ON learning_session(device_guid);',
  'CREATE INDEX IF NOT EXISTS idx_learning_session_start_time ON learning_session(start_time);',
  'CREATE INDEX IF NOT EXISTS idx_learning_session_type ON learning_session(session_type);',
  
  'CREATE INDEX IF NOT EXISTS idx_mastery_goal_device ON mastery_goal(device_guid);',
  'CREATE INDEX IF NOT EXISTS idx_mastery_goal_topic ON mastery_goal(topic_id);',
  'CREATE INDEX IF NOT EXISTS idx_mastery_goal_status ON mastery_goal(status);',
  'CREATE INDEX IF NOT EXISTS idx_mastery_goal_target_date ON mastery_goal(target_date);',
  
  'CREATE INDEX IF NOT EXISTS idx_practice_recommendation_device ON practice_recommendation(device_guid);',
  'CREATE INDEX IF NOT EXISTS idx_practice_recommendation_priority ON practice_recommendation(priority);',
  'CREATE INDEX IF NOT EXISTS idx_practice_recommendation_expires ON practice_recommendation(expires_at);',
  'CREATE INDEX IF NOT EXISTS idx_practice_recommendation_used ON practice_recommendation(used);',
  
  'CREATE INDEX IF NOT EXISTS idx_question_performance_device ON question_performance(device_guid);',
  'CREATE INDEX IF NOT EXISTS idx_question_performance_topic ON question_performance(topic_id);',
  'CREATE INDEX IF NOT EXISTS idx_question_performance_question ON question_performance(question_id);',
  'CREATE INDEX IF NOT EXISTS idx_question_performance_date ON question_performance(attempt_date);',
  'CREATE INDEX IF NOT EXISTS idx_question_performance_session ON question_performance(session_id);'
];