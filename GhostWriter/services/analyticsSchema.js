// Analytics Database Schema for GhostWriter
// This file contains SQL statements to create tables for analytics data

const ANALYTICS_SCHEMA = `
-- Code Health Metrics Table
CREATE TABLE IF NOT EXISTS code_metrics (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  document_id TEXT NOT NULL,
  project_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_type TEXT NOT NULL,
  author TEXT NOT NULL,
  commit_hash TEXT,
  commit_date DATETIME NOT NULL,
  
  -- Code Health Metrics
  cyclomatic_complexity INTEGER DEFAULT 0,
  cognitive_complexity INTEGER DEFAULT 0,
  lines_of_code INTEGER DEFAULT 0,
  comment_ratio REAL DEFAULT 0,
  function_count INTEGER DEFAULT 0,
  class_count INTEGER DEFAULT 0,
  method_count INTEGER DEFAULT 0,
  variable_count INTEGER DEFAULT 0,
  import_count INTEGER DEFAULT 0,
  
  -- Quality Metrics
  maintainability_index REAL DEFAULT 0,
  technical_debt_ratio REAL DEFAULT 0,
  code_smells_count INTEGER DEFAULT 0,
  duplication_ratio REAL DEFAULT 0,
  
  -- Performance Metrics
  execution_time_ms INTEGER DEFAULT 0,
  memory_usage_mb REAL DEFAULT 0,
  
  -- Security Metrics
  security_vulnerabilities INTEGER DEFAULT 0,
  security_score REAL DEFAULT 0,
  
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (document_id) REFERENCES documents(id)
);

-- Technology Stack Analysis Table
CREATE TABLE IF NOT EXISTS tech_stack_analysis (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  project_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_type TEXT NOT NULL,
  
  -- Technology Detection
  framework TEXT,
  language TEXT NOT NULL,
  libraries TEXT, -- JSON array
  build_tools TEXT, -- JSON array
  databases TEXT, -- JSON array
  cloud_services TEXT, -- JSON array
  
  -- Version Information
  framework_version TEXT,
  language_version TEXT,
  
  -- Usage Metrics
  usage_frequency INTEGER DEFAULT 0,
  last_used DATETIME,
  
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Code Evolution Tracking Table
CREATE TABLE IF NOT EXISTS code_evolution (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  project_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  commit_hash TEXT NOT NULL,
  commit_date DATETIME NOT NULL,
  author TEXT NOT NULL,
  
  -- Evolution Metrics
  lines_added INTEGER DEFAULT 0,
  lines_deleted INTEGER DEFAULT 0,
  lines_modified INTEGER DEFAULT 0,
  files_changed INTEGER DEFAULT 0,
  
  -- Complexity Changes
  complexity_delta REAL DEFAULT 0,
  maintainability_delta REAL DEFAULT 0,
  
  -- Change Patterns
  change_type TEXT, -- 'feature', 'bugfix', 'refactor', 'docs', 'test'
  impact_level TEXT, -- 'low', 'medium', 'high', 'critical'
  
  -- Time-based Analysis
  time_since_last_change INTEGER, -- in hours
  change_frequency REAL, -- changes per day
  
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Project Analytics Summary Table
CREATE TABLE IF NOT EXISTS project_analytics (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  project_name TEXT NOT NULL,
  analysis_date DATE NOT NULL,
  
  -- Overall Health
  overall_health_score REAL DEFAULT 0,
  code_quality_score REAL DEFAULT 0,
  maintainability_score REAL DEFAULT 0,
  performance_score REAL DEFAULT 0,
  security_score REAL DEFAULT 0,
  
  -- Size Metrics
  total_files INTEGER DEFAULT 0,
  total_lines INTEGER DEFAULT 0,
  total_functions INTEGER DEFAULT 0,
  total_classes INTEGER DEFAULT 0,
  
  -- Complexity Metrics
  avg_complexity REAL DEFAULT 0,
  max_complexity INTEGER DEFAULT 0,
  complexity_distribution TEXT, -- JSON object
  
  -- Technology Stack
  primary_language TEXT,
  frameworks TEXT, -- JSON array
  libraries_count INTEGER DEFAULT 0,
  
  -- Team Metrics
  active_contributors INTEGER DEFAULT 0,
  commit_frequency REAL DEFAULT 0,
  
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(project_name, analysis_date)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_code_metrics_project ON code_metrics (project_name);
CREATE INDEX IF NOT EXISTS idx_code_metrics_date ON code_metrics (commit_date);
CREATE INDEX IF NOT EXISTS idx_tech_stack_project ON tech_stack_analysis (project_name);
CREATE INDEX IF NOT EXISTS idx_evolution_project ON code_evolution (project_name, commit_date);
CREATE INDEX IF NOT EXISTS idx_project_analytics_date ON project_analytics (analysis_date);
`;

module.exports = ANALYTICS_SCHEMA;
