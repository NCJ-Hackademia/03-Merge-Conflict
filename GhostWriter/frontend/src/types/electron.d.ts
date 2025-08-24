export interface ElectronAPI {
  // RAG operations
  ingestDocument: (text: string, metadata: any) => Promise<{
    success: boolean;
    data?: any;
    error?: string;
  }>;
  queryRAG: (query: string, k?: number) => Promise<{
    success: boolean;
    data?: any;
    error?: string;
  }>;
  bulkIngest: (count: number) => Promise<{
    success: boolean;
    data?: any;
    error?: string;
  }>;

  // Model management
  getModelConfig: () => Promise<{
    success: boolean;
    data?: {
      llmProvider: string;
      embeddingProvider: string;
      ollamaModel: string;
      geminiApiKey: string | null;
      huggingfaceApiKey: string | null;
      openaiApiKey?: string | null;
    };
    error?: string;
  }>;

  setLLMProvider: (provider: string, options?: {
    apiKey?: string;
    model?: string;
  }) => Promise<{
    success: boolean;
    error?: string;
  }>;

  setEmbeddingProvider: (provider: string, apiKey?: string) => Promise<{
    success: boolean;
    error?: string;
  }>;

  checkOllama: () => Promise<{
    success: boolean;
    data?: {
      installed: boolean;
      models: string[];
      error?: string;
    };
    error?: string;
  }>;

  installOllamaModel: (model: string) => Promise<{
    success: boolean;
    error?: string;
  }>;

  pullOllamaModel: (modelName: string) => Promise<{
    success: boolean;
    error?: string;
  }>;

  listOllamaModelsDetailed: () => Promise<{
    success: boolean;
    data?: Array<{
      name: string;
      size: string;
      modified: string;
    }>;
    error?: string;
  }>;
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}
