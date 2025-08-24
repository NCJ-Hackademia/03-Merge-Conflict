const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');
const ModelManager = require('./modelManager');

class RAGService {
  constructor() {
    const os = require('os');
    this.APP_DIR = path.join(os.homedir(), '.ghostwriter');
    this.DB_PATH = path.join(this.APP_DIR, "rag.sqlite");
    this.db = null;
    this.modelManager = new ModelManager();
  }

  async initialize() {
    this.ensureAppDir();
    this.db = this.ensureDb();
    await this.modelManager.initialize();
    console.log("✅ RAG Service initialized");
  }

  ensureAppDir() {
    if (!fs.existsSync(this.APP_DIR)) {
      fs.mkdirSync(this.APP_DIR, { recursive: true });
    }
  }

  ensureDb() {
    const db = new Database(this.DB_PATH);
    db.exec(`
      PRAGMA journal_mode=WAL;
      CREATE TABLE IF NOT EXISTS documents (
        id TEXT PRIMARY KEY,
        text TEXT NOT NULL,
        metadata TEXT NOT NULL,
        embedding TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX IF NOT EXISTS idx_meta ON documents (id);
      CREATE INDEX IF NOT EXISTS idx_project ON documents (json_extract(metadata, '$.project_name'));
      CREATE INDEX IF NOT EXISTS idx_file_path ON documents (json_extract(metadata, '$.file_path'));
    `);
    return db;
  }

  // ✅ UPDATED: Clean ingestion - store only code content
  async ingestCommit(commitData) {
    const { projectName, metadata, files } = commitData;
    const results = [];

    console.log(`📦 Ingesting commit from ${projectName}: ${files.length} files`);

    for (const file of files) {
      try {
        // Create comprehensive metadata for each file
        const fileMetadata = {
          project_name: projectName,
          file_path: file.path,
          author: metadata.author,
          commit_message: metadata['commit-message'],
          commit_date: metadata.date,
          ingested_at: new Date().toISOString(),
          file_type: this.getFileType(file.path),
          commit_hash: metadata.hash || null
        };

        // ✅ NEW: Clean content - store ONLY the code without metadata headers
        const cleanContent = this.cleanFileContent(file.content, file.path);

        // Skip empty files
        if (!cleanContent || cleanContent.trim().length === 0) {
          console.log(`  ⏭️  ${file.path} (empty, skipped)`);
          continue;
        }

        // ✅ CHANGED: Store clean content directly (no context headers)
        const result = await this.ingestDocument(cleanContent, fileMetadata);

        results.push({
          file_path: file.path,
          document_id: result.id,
          status: 'success',
          content_length: cleanContent.length
        });

        console.log(`  ✅ ${file.path} (${cleanContent.length} chars)`);

      } catch (error) {
        console.error(`  ❌ ${file.path}: ${error.message}`);
        results.push({
          file_path: file.path,
          status: 'error',
          error: error.message
        });
      }
    }

    const successCount = results.filter(r => r.status === 'success').length;
    const failCount = results.filter(r => r.status === 'error').length;

    console.log(`📊 Commit ingestion complete: ${successCount} success, ${failCount} failed`);

    return {
      project_name: projectName,
      commit_metadata: metadata,
      total_files: files.length,
      successful: successCount,
      failed: failCount,
      results: results
    };
  }

  // ✅ ENHANCED: Better file content cleaning
  cleanFileContent(content, filePath) {
    if (!content || typeof content !== 'string') {
      return '';
    }

    // Normalize line endings and basic cleanup
    let cleaned = content
      .replace(/\r\n/g, '\n')  // Windows to Unix line endings
      .replace(/\r/g, '\n')    // Mac to Unix line endings  
      .replace(/\t/g, '  ')    // Tabs to spaces
      .trim();

    // Remove excessive empty lines (more than 2 consecutive)
    cleaned = cleaned.replace(/\n\s*\n\s*\n+/g, '\n\n');

    // File type specific cleaning
    const fileExt = path.extname(filePath).toLowerCase();

    if (['.json'].includes(fileExt)) {
      // Pretty format JSON files
      try {
        const parsed = JSON.parse(cleaned);
        return JSON.stringify(parsed, null, 2);
      } catch (e) {
        // Return as-is if not valid JSON
        return cleaned;
      }
    }

    return cleaned;
  }

  // ✅ REMOVED: No more contextual text creation - store clean code only
  // The createContextualText method is no longer needed

  // Helper: Determine file type (unchanged)
  getFileType(filePath) {
    const ext = path.extname(filePath).toLowerCase();
    const basename = path.basename(filePath).toLowerCase();

    // Code files
    if (['.js', '.jsx', '.ts', '.tsx'].includes(ext)) return 'javascript';
    if (['.py'].includes(ext)) return 'python';
    if (['.java'].includes(ext)) return 'java';
    if (['.cpp', '.cc', '.cxx', '.c++'].includes(ext)) return 'cpp';
    if (['.c', '.h'].includes(ext)) return 'c';
    if (['.cs'].includes(ext)) return 'csharp';
    if (['.php'].includes(ext)) return 'php';
    if (['.rb'].includes(ext)) return 'ruby';
    if (['.go'].includes(ext)) return 'go';
    if (['.rs'].includes(ext)) return 'rust';
    if (['.kt'].includes(ext)) return 'kotlin';
    if (['.swift'].includes(ext)) return 'swift';

    // Web files
    if (['.html', '.htm'].includes(ext)) return 'html';
    if (['.css', '.scss', '.sass', '.less'].includes(ext)) return 'css';
    if (['.vue'].includes(ext)) return 'vue';

    // Config files
    if (['.json'].includes(ext)) return 'json';
    if (['.yaml', '.yml'].includes(ext)) return 'yaml';
    if (['.xml'].includes(ext)) return 'xml';
    if (['.toml'].includes(ext)) return 'toml';
    if (['.ini'].includes(ext)) return 'ini';

    // Documentation
    if (['.md', '.markdown'].includes(ext)) return 'markdown';
    if (['.txt'].includes(ext)) return 'text';
    if (['.rst'].includes(ext)) return 'rst';

    // Special files
    if (['package.json'].includes(basename)) return 'package-config';
    if (['dockerfile'].includes(basename)) return 'docker';
    if (['.env', '.env.example'].includes(basename)) return 'environment';
    if (['makefile'].includes(basename)) return 'makefile';
    if (['.sh', '.bash'].includes(ext)) return 'bash';

    return 'unknown';
  }

  // ✅ UPDATED: Modified ingestDocument - no more context headers
  async ingestDocument(text, metadata) {
    const id = `doc-${Date.now()}-${Math.random().toString(36).slice(2)}`;

    // ✅ CHANGED: Create embedding from clean text + metadata (no headers)
    const embeddingText = text + '\n' + JSON.stringify(metadata);
    const embeddingService = this.modelManager.getEmbeddingService();
    const embedding = await embeddingService.embedText(embeddingText);

    // Store in database
    const stmt = this.db.prepare(`
      INSERT INTO documents (id, text, metadata, embedding)
      VALUES (@id, @text, @metadata, @embedding)
      ON CONFLICT(id) DO UPDATE SET
        text=excluded.text,
        metadata=excluded.metadata,
        embedding=excluded.embedding
    `);

    stmt.run({
      id,
      text, // ✅ CHANGED: Store clean content directly
      metadata: JSON.stringify(metadata),
      embedding: JSON.stringify(embedding),
    });

    return { id, status: 'ingested' };
  }

  // ✅ UPDATED: Enhanced search that returns clean code
  async searchAndGenerate(query, k = 5, projectName = null) {
    // Generate query embedding
    const embeddingService = this.modelManager.getEmbeddingService();
    const queryEmbedding = await embeddingService.embedText(query);

    // Find similar documents, optionally filtered by project
    let docs = this.allDocs();

    if (projectName) {
      docs = docs.filter(d => d.metadata.project_name === projectName);
      console.log(`🔍 Searching in project: ${projectName} (${docs.length} documents)`);
    }

    const scored = docs.map(d => ({
      ...d,
      score: this.cosine(queryEmbedding, d.embedding)
    }));
    scored.sort((a, b) => b.score - a.score);
    const topResults = scored.slice(0, k);

    // ✅ UPDATED: Enhanced context generation with clean separation
    const context = topResults.map((hit, i) =>
      `# Result ${i + 1} (Relevance: ${(hit.score * 100).toFixed(1)}%)
📁 File: ${hit.metadata.file_path}
👤 Author: ${hit.metadata.author || 'Unknown'}
📅 Date: ${hit.metadata.commit_date}
💬 Commit: ${hit.metadata.commit_message}

CODE/CONTENT:
${hit.text}`  // ✅ CHANGED: Direct clean text, no header removal needed
    ).join("\n\n" + "=".repeat(80) + "\n\n");

    // Enhanced system prompt
    const systemPrompt = `You are GhostWriter, an AI code assistant that helps developers understand their codebase.

You have access to code from git commits with file paths, authors, and commit messages.
Answer questions about code, explain functionality, suggest improvements, or help debug issues.

Guidelines:
- Reference specific files and line numbers when possible
- Include file paths in your answers
- Mention the author/commit context when relevant
- Format code examples clearly
- Be concise but thorough
- Focus on explaining functionality and relationships between code files`;

    const userPrompt = `Question: ${query}

Relevant code/files:
${context}

Please provide a helpful answer based on the code above.`;

    const llmService = this.modelManager.getLLMService();
    const answer = await llmService.generateWithContext(systemPrompt, userPrompt);

    return {
      query,
      answer,
      project: projectName,
      sources: topResults.map(r => ({
        file_path: r.metadata.file_path,
        author: r.metadata.author,
        commit_message: r.metadata.commit_message,
        commit_date: r.metadata.commit_date,
        relevance_score: (r.score * 100).toFixed(1) + '%',
        preview: r.text // ✅ CHANGED: Return full clean text as preview
      }))
    };
  }

  // ✅ Get projects list (unchanged)
  async getProjects() {
    const docs = this.allDocs();
    const projects = [...new Set(docs.map(d => d.metadata.project_name))];

    return projects.map(projectName => {
      const projectDocs = docs.filter(d => d.metadata.project_name === projectName);
      const latestDoc = projectDocs.sort((a, b) =>
        new Date(b.metadata.commit_date) - new Date(a.metadata.commit_date)
      )[0];

      return {
        name: projectName,
        documents: projectDocs.length,
        last_updated: latestDoc ? latestDoc.metadata.commit_date : null,
        authors: [...new Set(projectDocs.map(d => d.metadata.author).filter(a => a))]
      };
    });
  }

  // Helper methods (unchanged)
  getModelManager() {
    return this.modelManager;
  }

  allDocs() {
    const rows = this.db.prepare(`SELECT id, text, metadata, embedding FROM documents`).all();
    return rows.map(r => ({
      id: r.id,
      text: r.text,
      metadata: JSON.parse(r.metadata),
      embedding: JSON.parse(r.embedding),
    }));
  }

  cosine(a, b) {
    if (!a || !b || a.length !== b.length) return -1;
    let dot = 0, na = 0, nb = 0;
    for (let i = 0; i < a.length; i++) {
      dot += a[i] * b[i];
      na += a[i] * a[i];
      nb += b[i] * b[i];
    }
    return dot / (Math.sqrt(na) * Math.sqrt(nb) + 1e-8);
  }

  // Legacy method for backward compatibility
  async bulkIngestDemo(count = 10) {
    const results = [];

    for (let i = 0; i < count; i++) {
      const text = `// Demo function ${i}
function demoFunction${i}(input) {
  // This function multiplies input by ${i + 1}
  return input * ${i + 1};
}`;

      const metadata = {
        project_name: 'demo-project',
        file_path: `src/demo/file${i}.js`,
        author: ["Alice", "Bob", "Charlie"][i % 3],
        commit_date: new Date().toISOString().split('T')[0],
        commit_message: `Add demo function ${i}`,
        file_type: 'javascript'
      };

      const result = await this.ingestDocument(text, metadata);
      results.push(result);
    }

    return { ingested: results.length, results };
  }
}

module.exports = RAGService;
