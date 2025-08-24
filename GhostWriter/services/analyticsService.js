const ANALYTICS_SCHEMA = require('./analyticsSchema');

class AnalyticsService {
  constructor(db) {
    this.db = db;
    this.initializeTables();
  }

  initializeTables() {
    this.db.exec(ANALYTICS_SCHEMA);
    console.log("✅ Analytics tables initialized");
  }

  async analyzeCodeHealth(documentId, content, metadata) {
    const metrics = this.calculateCodeMetrics(content, metadata);
    
    const stmt = this.db.prepare(`
      INSERT INTO code_metrics (
        document_id, project_name, file_path, file_type, author, 
        commit_hash, commit_date, cyclomatic_complexity, cognitive_complexity,
        lines_of_code, comment_ratio, function_count, class_count, method_count,
        variable_count, import_count, maintainability_index, technical_debt_ratio,
        code_smells_count, duplication_ratio, security_score
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      documentId, metadata.project_name, metadata.file_path, this.getFileType(metadata.file_path),
      metadata.author, metadata.commit_hash, metadata.commit_date, metrics.cyclomaticComplexity,
      metrics.cognitiveComplexity, metrics.linesOfCode, metrics.commentRatio, metrics.functionCount,
      metrics.classCount, metrics.methodCount, metrics.variableCount, metrics.importCount,
      metrics.maintainabilityIndex, metrics.technicalDebtRatio, metrics.codeSmellsCount,
      metrics.duplicationRatio, metrics.securityScore
    );

    return metrics;
  }

  calculateCodeMetrics(content, metadata) {
    const lines = content.split('\n');
    const linesOfCode = lines.length;
    
    const commentLines = lines.filter(line => 
      line.trim().startsWith('//') || line.trim().startsWith('/*') || 
      line.trim().startsWith('*') || line.trim().startsWith('#')
    ).length;
    
    const commentRatio = linesOfCode > 0 ? commentLines / linesOfCode : 0;
    const functionCount = (content.match(/function\s+\w+|=>\s*{|class\s+\w+/g) || []).length;
    const classCount = (content.match(/class\s+\w+/g) || []).length;
    const importCount = (content.match(/import\s+|require\s*\(/g) || []).length;
    
    const complexityKeywords = ['if', 'else', 'for', 'while', 'switch', 'case', 'catch', '&&', '||'];
    const cyclomaticComplexity = complexityKeywords.reduce((sum, keyword) => {
      const regex = new RegExp(`\\b${keyword}\\b`, 'g');
      return sum + (content.match(regex) || []).length;
    }, 1);

    const maintainabilityIndex = Math.max(0, 171 - 5.2 * Math.log(cyclomaticComplexity) - 0.23 * Math.log(linesOfCode) - 16.2 * Math.log(commentRatio + 0.1));

    return {
      linesOfCode, commentRatio, functionCount, classCount,
      methodCount: Math.max(0, functionCount - classCount),
      variableCount: (content.match(/const\s+|let\s+|var\s+/g) || []).length,
      importCount, cyclomaticComplexity, cognitiveComplexity: Math.floor(cyclomaticComplexity * 0.8),
      maintainabilityIndex, technicalDebtRatio: Math.max(0, 100 - maintainabilityIndex) / 100,
      codeSmellsCount: this.detectCodeSmells(content), duplicationRatio: 0,
      securityScore: this.calculateSecurityScore(content)
    };
  }

  detectCodeSmells(content) {
    const smells = [];
    const functions = content.match(/function\s+\w+\s*\([^)]*\)\s*\{[\s\S]*?\}/g) || [];
    functions.forEach(func => {
      if (func.split('\n').length > 20) smells.push('long_function');
    });
    
    const magicNumbers = content.match(/\b\d{3,}\b/g) || [];
    if (magicNumbers.length > 5) smells.push('magic_numbers');
    
    return smells.length;
  }

  calculateSecurityScore(content) {
    let score = 100;
    const vulnerabilities = [
      { pattern: /eval\s*\(/, penalty: 20 },
      { pattern: /innerHTML\s*=/, penalty: 15 },
      { pattern: /document\.write/, penalty: 15 },
      { pattern: /sql\s*\+/, penalty: 10 },
      { pattern: /password\s*=/, penalty: 5 }
    ];
    
    vulnerabilities.forEach(vuln => {
      if (content.match(vuln.pattern)) score -= vuln.penalty;
    });
    
    return Math.max(0, score);
  }

  async analyzeTechStack(documentId, content, metadata) {
    const techStack = this.detectTechnologies(content, metadata);
    
    const stmt = this.db.prepare(`
      INSERT INTO tech_stack_analysis (
        project_name, file_path, file_type, framework, language, 
        libraries, build_tools, databases, cloud_services,
        framework_version, language_version, usage_frequency
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      metadata.project_name, metadata.file_path, this.getFileType(metadata.file_path),
      techStack.framework, techStack.language, JSON.stringify(techStack.libraries),
      JSON.stringify(techStack.buildTools), JSON.stringify(techStack.databases),
      JSON.stringify(techStack.cloudServices), techStack.frameworkVersion,
      techStack.languageVersion, 1
    );

    return techStack;
  }

  detectTechnologies(content, metadata) {
    const filePath = metadata.file_path.toLowerCase();
    const contentLower = content.toLowerCase();
    
    const languageMap = {
      '.js': 'JavaScript', '.ts': 'TypeScript', '.jsx': 'React JSX', '.tsx': 'React TSX',
      '.py': 'Python', '.java': 'Java', '.cpp': 'C++', '.c': 'C', '.cs': 'C#',
      '.php': 'PHP', '.rb': 'Ruby', '.go': 'Go', '.rs': 'Rust'
    };
    
    const language = this.getLanguageFromExtension(filePath, languageMap);
    
    const frameworks = {
      'react': contentLower.includes('react') || contentLower.includes('jsx'),
      'vue': contentLower.includes('vue') || contentLower.includes('vuex'),
      'angular': contentLower.includes('angular') || contentLower.includes('@angular'),
      'express': contentLower.includes('express') || contentLower.includes('app.get'),
      'django': contentLower.includes('django') || contentLower.includes('from django'),
      'flask': contentLower.includes('flask') || contentLower.includes('from flask')
    };
    
    const detectedFrameworks = Object.keys(frameworks).filter(fw => frameworks[fw]);
    const primaryFramework = detectedFrameworks[0] || null;
    
    return {
      language, framework: primaryFramework, frameworkVersion: null, languageVersion: null,
      libraries: this.detectLibraries(content), buildTools: this.detectBuildTools(content, filePath),
      databases: this.detectDatabases(content), cloudServices: this.detectCloudServices(content)
    };
  }

  detectLibraries(content) {
    const libraries = [];
    const contentLower = content.toLowerCase();
    
    const libraryPatterns = {
      'lodash': /lodash|_\./, 'moment': /moment/, 'axios': /axios/, 'jquery': /jquery|\$/,
      'bootstrap': /bootstrap/, 'tailwind': /tailwind/, 'react-router': /react-router/,
      'redux': /redux/, 'prisma': /prisma/, 'mongoose': /mongoose/, 'jest': /jest/
    };
    
    Object.entries(libraryPatterns).forEach(([lib, pattern]) => {
      if (pattern.test(contentLower)) libraries.push(lib);
    });
    
    return libraries;
  }

  detectBuildTools(content, filePath) {
    const tools = [];
    if (filePath.includes('package.json')) tools.push('npm');
    if (filePath.includes('yarn.lock')) tools.push('yarn');
    if (filePath.includes('webpack')) tools.push('webpack');
    if (filePath.includes('vite')) tools.push('vite');
    if (filePath.includes('tsconfig')) tools.push('typescript');
    return tools;
  }

  detectDatabases(content) {
    const databases = [];
    const contentLower = content.toLowerCase();
    if (contentLower.includes('mysql')) databases.push('mysql');
    if (contentLower.includes('postgresql') || contentLower.includes('postgres')) databases.push('postgresql');
    if (contentLower.includes('mongodb')) databases.push('mongodb');
    if (contentLower.includes('redis')) databases.push('redis');
    if (contentLower.includes('sqlite')) databases.push('sqlite');
    return databases;
  }

  detectCloudServices(content) {
    const services = [];
    const contentLower = content.toLowerCase();
    if (contentLower.includes('aws') || contentLower.includes('amazon')) services.push('aws');
    if (contentLower.includes('azure')) services.push('azure');
    if (contentLower.includes('gcp') || contentLower.includes('google cloud')) services.push('gcp');
    if (contentLower.includes('vercel')) services.push('vercel');
    if (contentLower.includes('firebase')) services.push('firebase');
    return services;
  }

  async trackCodeEvolution(commitData) {
    const { projectName, metadata, files } = commitData;
    
    for (const file of files) {
      const stmt = this.db.prepare(`
        INSERT INTO code_evolution (
          project_name, file_path, commit_hash, commit_date, author,
          lines_added, lines_deleted, lines_modified, files_changed,
          change_type, impact_level, time_since_last_change
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      const changeType = this.determineChangeType(metadata['commit-message']);
      const impactLevel = this.calculateImpactLevel(file.content.length);
      
      stmt.run(
        projectName, file.path, metadata.hash, metadata.date, metadata.author,
        file.content.split('\n').length, 0, file.content.split('\n').length, files.length,
        changeType, impactLevel, this.calculateTimeSinceLastChange(projectName, file.path, metadata.date)
      );
    }
  }

  determineChangeType(commitMessage) {
    const message = commitMessage.toLowerCase();
    if (message.includes('feat') || message.includes('add')) return 'feature';
    if (message.includes('fix') || message.includes('bug')) return 'bugfix';
    if (message.includes('refactor')) return 'refactor';
    if (message.includes('doc') || message.includes('readme')) return 'docs';
    if (message.includes('test')) return 'test';
    return 'other';
  }

  calculateImpactLevel(contentLength) {
    if (contentLength > 1000) return 'critical';
    if (contentLength > 500) return 'high';
    if (contentLength > 100) return 'medium';
    return 'low';
  }

  async getProjectHealthMetrics(projectName, days = 30) {
    const stmt = this.db.prepare(`
      SELECT 
        AVG(maintainability_index) as avg_maintainability,
        AVG(cyclomatic_complexity) as avg_complexity,
        AVG(security_score) as avg_security,
        AVG(comment_ratio) as avg_comments,
        COUNT(*) as total_files,
        SUM(lines_of_code) as total_lines
      FROM code_metrics 
      WHERE project_name = ? 
      AND commit_date >= datetime('now', '-${days} days')
    `);
    
    return stmt.get(projectName);
  }

  async getTechStackSummary(projectName) {
    const stmt = this.db.prepare(`
      SELECT 
        language,
        framework,
        COUNT(*) as file_count,
        GROUP_CONCAT(DISTINCT libraries) as all_libraries
      FROM tech_stack_analysis 
      WHERE project_name = ?
      GROUP BY language, framework
      ORDER BY file_count DESC
    `);
    
    return stmt.all(projectName);
  }

  async getEvolutionTrends(projectName, days = 90) {
    const stmt = this.db.prepare(`
      SELECT 
        DATE(commit_date) as date,
        SUM(lines_added) as lines_added,
        SUM(lines_deleted) as lines_deleted,
        COUNT(*) as commits,
        AVG(complexity_delta) as avg_complexity_change
      FROM code_evolution 
      WHERE project_name = ? 
      AND commit_date >= datetime('now', '-${days} days')
      GROUP BY DATE(commit_date)
      ORDER BY date
    `);
    
    return stmt.all(projectName);
  }

  async generateProjectAnalytics(projectName) {
    const healthMetrics = await this.getProjectHealthMetrics(projectName);
    const techStack = await this.getTechStackSummary(projectName);
    const evolution = await this.getEvolutionTrends(projectName);
    
    const overallHealthScore = (
      (healthMetrics.avg_maintainability || 0) * 0.4 +
      Math.max(0, 100 - (healthMetrics.avg_complexity || 0) * 2) * 0.3 +
      (healthMetrics.avg_security || 0) * 0.3
    );
    
    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO project_analytics (
        project_name, analysis_date, overall_health_score, code_quality_score,
        maintainability_score, performance_score, security_score,
        total_files, total_lines, total_functions, total_classes,
        avg_complexity, max_complexity, primary_language, frameworks,
        libraries_count, active_contributors, commit_frequency
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    stmt.run(
      projectName, new Date().toISOString().split('T')[0], overallHealthScore,
      healthMetrics.avg_maintainability || 0, healthMetrics.avg_maintainability || 0,
      85, healthMetrics.avg_security || 0, healthMetrics.total_files || 0,
      healthMetrics.total_lines || 0, Math.floor((healthMetrics.total_lines || 0) / 20),
      Math.floor((healthMetrics.total_lines || 0) / 100), healthMetrics.avg_complexity || 0,
      (healthMetrics.avg_complexity || 0) * 3, techStack[0]?.language || 'Unknown',
      JSON.stringify(techStack.map(ts => ts.framework).filter(Boolean)),
      techStack.reduce((sum, ts) => sum + (ts.all_libraries ? ts.all_libraries.split(',').length : 0), 0),
      evolution.length > 0 ? new Set(evolution.map(e => e.author)).size : 0,
      evolution.length / 90
    );
    
    return { healthMetrics, techStack, evolution, overallHealthScore };
  }

  getFileType(filePath) {
    return filePath.split('.').pop()?.toLowerCase() || 'unknown';
  }

  getLanguageFromExtension(filePath, languageMap) {
    const ext = '.' + this.getFileType(filePath);
    return languageMap[ext] || 'Unknown';
  }

  calculateTimeSinceLastChange(projectName, filePath, currentDate) {
    const stmt = this.db.prepare(`
      SELECT MAX(commit_date) as last_change
      FROM code_evolution 
      WHERE project_name = ? AND file_path = ?
    `);
    
    const result = stmt.get(projectName, filePath);
    if (result.last_change) {
      const lastChange = new Date(result.last_change);
      const current = new Date(currentDate);
      return (current - lastChange) / (1000 * 60 * 60);
    }
    return null;
  }
}

module.exports = AnalyticsService;
