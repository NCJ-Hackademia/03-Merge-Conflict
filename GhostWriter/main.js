const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("path");
const RAGService = require("./services/ragService");
const express = require('express');

let mainWindow;
let ragService;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  if (process.env.NODE_ENV === "development") {
    mainWindow.loadURL("http://localhost:5173");
    if (process.env.ELECTRON_OPEN_DEVTOOLS === "1") {
      mainWindow.webContents.openDevTools();
    }
  } else {
    mainWindow.loadFile(path.join(__dirname, "frontend/dist/index.html"));
  }
}

// HTTP Server for CLI communication
function setupCLIServer() {
  const app = express();
  app.use(express.json());

  app.use(express.json({ limit: '200mb', parameterLimit: 100000 })); // Increase limit for large commits
  // Health check endpoint


  // ✅ NEW: Bulk commit ingestion endpoint
  app.post('/ingest-commit', async (req, res) => {
    try {
      console.log('📥 Received bulk commit ingestion request');

      const commitData = req.body;

      // Validate the commit data structure
      if (!commitData || !commitData.projectName || !commitData.files) {
        return res.status(400).json({
          success: false,
          error: 'Invalid commit data structure. Expected: {projectName, metadata, files}'
        });
      }

      if (!Array.isArray(commitData.files)) {
        return res.status(400).json({
          success: false,
          error: 'Files must be an array'
        });
      }

      // Perform bulk ingestion
      const result = await ragService.ingestCommit(commitData);

      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      console.error('❌ Bulk ingestion error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });

  // ✅ NEW: Get projects list
  app.get('/projects', async (req, res) => {
    try {
      const projects = await ragService.getProjects();
      res.json({
        success: true,
        data: projects
      });
    } catch (error) {
      console.error('❌ Get projects error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });

  // ✅ UPDATED: Enhanced search with project filter
  app.post('/search', async (req, res) => {
    try {
      const { query, k = 5, projectName = null } = req.body;

      if (!query) {
        return res.status(400).json({
          success: false,
          error: 'Query is required'
        });
      }

      const result = await ragService.searchAndGenerate(query, k, projectName);
      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      console.error('❌ Search error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });

  // Legacy endpoints (keep for backward compatibility)
  app.post('/ingest', async (req, res) => {
    try {
      const { text, metadata } = req.body;

      if (!text) {
        return res.status(400).json({
          success: false,
          error: 'Text is required'
        });
      }

      const result = await ragService.ingestDocument(text, metadata || {});
      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      console.error('❌ Ingestion error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });

  // Health check endpoint
  app.get('/health', (req, res) => {
    res.json({
      success: true,
      status: 'healthy',
      timestamp: new Date().toISOString()
    });
  });
  // CLI endpoints


  app.post('/query', async (req, res) => {
    try {
      const result = await ragService.searchAndGenerate(req.body.query, req.body.k);
      res.json({ success: true, data: result });
    } catch (error) {
      res.json({ success: false, error: error.message });
    }
  });



  const server = app.listen(3001, () => {
    console.log('🌐 CLI server ready on port 3001');
  });

  return server;
}

// Initialize services when app is ready
app.whenReady().then(async () => {
  createWindow();

  try {
    // Initialize RAG service (includes ModelManager)
    ragService = new RAGService();
    await ragService.initialize();

    // Setup CLI HTTP server
    setupCLIServer();

    console.log("✅ Electron app, RAG service, and CLI server initialized");
  } catch (error) {
    console.error("❌ Failed to initialize services:", error);
    // Show error dialog to user
    const { dialog } = require('electron');
    dialog.showErrorBox('Initialization Error',
      `Failed to initialize GhostWriter services: ${error.message}\n\nCheck if Ollama is installed or configure a different provider.`);
  }
});



ipcMain.handle('rag:query', async (event, { query, k = 5 }) => {
  try {
    const results = await ragService.searchAndGenerate(query, k);
    return { success: true, data: results };
  } catch (error) {
    console.error('Query error:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('rag:bulk-ingest', async (event, { count = 10 }) => {
  try {
    const result = await ragService.bulkIngestDemo(count);
    return { success: true, data: result };
  } catch (error) {
    console.error('Bulk ingest error:', error);
    return { success: false, error: error.message };
  }
});

// Model management IPC handlers
ipcMain.handle('model:get-config', async () => {
  try {
    const config = ragService.getModelManager().getConfig();
    return { success: true, data: config };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('model:set-llm-provider', async (event, { provider, options }) => {
  try {
    await ragService.getModelManager().setLLMProvider(provider, options);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('model:set-embedding-provider', async (event, { provider, apiKey }) => {
  try {
    await ragService.getModelManager().setEmbeddingProvider(provider, apiKey);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('model:check-ollama', async () => {
  try {
    const status = await ragService.getModelManager().checkOllamaStatus();
    return { success: true, data: status };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('model:install-ollama-model', async (event, { model }) => {
  try {
    const OllamaService = require('./services/providers/ollamaService');
    const ollama = new OllamaService();
    await ollama.pullModel(model);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// Add these new IPC handlers
ipcMain.handle('ollama:pull-model', async (event, { modelName }) => {
  try {
    const { spawnSync } = require('child_process');
    const result = spawnSync('ollama', ['pull', modelName], {
      encoding: 'utf8',
      timeout: 300000 // 5 minute timeout
    });

    if (result.status === 0) {
      return { success: true };
    } else {
      return { success: false, error: result.stderr || 'Failed to pull model' };
    }
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('ollama:list-models-detailed', async () => {
  try {
    const { spawnSync } = require('child_process');
    const result = spawnSync('ollama', ['list'], { encoding: 'utf8' });

    if (result.status === 0) {
      const lines = result.stdout.split('\n').slice(1).filter(line => line.trim());
      const models = lines.map(line => {
        const parts = line.trim().split(/\s+/);
        return {
          name: parts[0] || 'unknown',
          size: parts[11] || 'unknown',
          modified: parts || 'unknown'
        };
      });
      return { success: true, data: models };
    }

    return { success: false, error: 'Failed to list models' };
  } catch (error) {
    return { success: false, error: error.message };
  }
});
ipcMain.handle('rag:ingest-commit', async (event, commitData) => {
  try {
    console.log('📥 Received bulk commit ingestion request');

    // Validate the commit data structure
    if (!commitData || !commitData.projectName || !commitData.files) {
      return {
        success: false,
        error: 'Invalid commit data structure. Expected: {projectName, metadata, files}'
      };
    }

    if (!Array.isArray(commitData.files)) {
      return {
        success: false,
        error: 'Files must be an array'
      };
    }

    // Perform bulk ingestion
    const result = await ragService.ingestCommit(commitData);

    return {
      success: true,
      data: result
    };
  } catch (error) {
    console.error('❌ Bulk ingestion error:', error);
    return {
      success: false,
      error: error.message
    };
  }
});

// ✅ NEW: Get projects list
ipcMain.handle('rag:get-projects', async (event) => {
  try {
    const projects = await ragService.getProjects();
    return {
      success: true,
      data: projects
    };
  } catch (error) {
    console.error('❌ Get projects error:', error);
    return {
      success: false,
      error: error.message
    };
  }
});

// ✅ UPDATED: Enhanced search with project filter
ipcMain.handle('rag:search', async (event, { query, k = 5, projectName = null }) => {
  try {
    const result = await ragService.searchAndGenerate(query, k, projectName);
    return {
      success: true,
      data: result
    };
  } catch (error) {
    console.error('❌ Search error:', error);
    return {
      success: false,
      error: error.message
    };
  }
});

// Legacy single document ingestion (keep for backward compatibility)
ipcMain.handle('rag:ingest', async (event, { text, metadata }) => {
  try {
    const result = await ragService.ingestDocument(text, metadata);
    return {
      success: true,
      data: result
    };
  } catch (error) {
    console.error('❌ Ingestion error:', error);
    return {
      success: false,
      error: error.message
    };
  }
});

// Demo data ingestion
ipcMain.handle('rag:ingest-demo', async (event, count = 10) => {
  try {
    const result = await ragService.bulkIngestDemo(count);
    return {
      success: true,
      data: result
    };
  } catch (error) {
    console.error('❌ Demo ingestion error:', error);
    return {
      success: false,
      error: error.message
    };
  }
});

// Get model manager
ipcMain.handle('rag:get-model-manager', async (event) => {
  try {
    const modelManager = ragService.getModelManager();
    return {
      success: true,
      data: {
        llmProvider: modelManager.config.llmProvider,
        embeddingProvider: modelManager.config.embeddingProvider,
        // Add other relevant model manager info
      }
    };
  } catch (error) {
    console.error('❌ Get model manager error:', error);
    return {
      success: false,
      error: error.message
    };
  }
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
