const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // ✅ NEW: Enhanced RAG operations (what your frontend needs)
  searchRAG: (searchParams) => ipcRenderer.invoke('rag:search', searchParams),
  getProjects: () => ipcRenderer.invoke('rag:get-projects'),
  ingestCommit: (commitData) => ipcRenderer.invoke('rag:ingest-commit', commitData),

  // Legacy RAG operations (keep for backward compatibility)
  ingestDocument: (text, metadata) => ipcRenderer.invoke('rag:ingest', { text, metadata }),
  queryRAG: (query, k) => ipcRenderer.invoke('rag:query', { query, k }),
  bulkIngest: (count) => ipcRenderer.invoke('rag:bulk-ingest', { count }),

  // Model management
  getModelConfig: () => ipcRenderer.invoke('model:get-config'),
  setLLMProvider: (provider, options) => ipcRenderer.invoke('model:set-llm-provider', { provider, options }),
  setEmbeddingProvider: (provider, apiKey) => ipcRenderer.invoke('model:set-embedding-provider', { provider, apiKey }),
  checkOllama: () => ipcRenderer.invoke('model:check-ollama'),
  installOllamaModel: (model) => ipcRenderer.invoke('model:install-ollama-model', { model }),

  // Ollama operations
  listModels: () => ipcRenderer.invoke('ollama:list-models'),
  pullOllamaModel: (modelName) => ipcRenderer.invoke('ollama:pull-model', { modelName }),
  listOllamaModelsDetailed: () => ipcRenderer.invoke('ollama:list-models-detailed'),

  // ✅ NEW: Debug methods
  debugDocs: () => ipcRenderer.invoke('rag:debug-docs'),
});
