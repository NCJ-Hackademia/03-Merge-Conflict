import { useEffect, useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useNotification } from "@/components/ui/notification";

// Updated interface to match ModelManager response
interface ModelConfig {
  llmProvider: string;
  embeddingProvider: string;
  ollamaModel: string;
  ollamaEmbeddingModel?: string;
  geminiApiKey: string | null;
  huggingfaceApiKey: string | null;
  openaiApiKey?: string | null;
  maskedKeys?: {
    gemini?: string | null;
    huggingface?: string | null;
    openai?: string | null;
  };
  configured?: {
    ollama: boolean;
    gemini: boolean;
  };
}

interface OllamaModel {
  name: string;
  size: string;
  modified: string;
  digest?: string;
  details?: {
    format: string;
    family: string;
    families: string[];
    parameter_size: string;
    quantization_level: string;
  };
}

const PROVIDERS = [
  { id: "ollama", label: "Ollama (Local)" },
  { id: "gemini", label: "Google Gemini" },
];

// Popular model categories
const RECOMMENDED_MODELS = {
  llm: [
    { name: 'phi3:mini', description: 'Lightweight, fast (3.8B params)' },
    { name: 'phi3:medium', description: 'Balanced performance (14B params)' },
    { name: 'gemma:2b', description: 'Google\'s efficient model (2B params)' },
    { name: 'gemma:7b', description: 'Google\'s larger model (7B params)' },
    { name: 'llama3:8b', description: 'Meta\'s powerful model (8B params)' },
    { name: 'llama3:70b', description: 'Meta\'s large model (70B params)' },
    { name: 'mistral:7b', description: 'Mistral AI model (7B params)' },
    { name: 'codellama:7b', description: 'Code-specialized model (7B params)' },
    { name: 'codellama:13b', description: 'Larger code model (13B params)' },
    { name: 'neural-chat:7b', description: 'Conversation optimized' },
  ],
  embedding: [
    { name: 'nomic-embed-text', description: 'Best general embeddings' },
    { name: 'all-minilm', description: 'Lightweight, fast embeddings' },
    { name: 'mxbai-embed-large', description: 'High-quality embeddings' },
    { name: 'snowflake-arctic-embed', description: 'Advanced embeddings' },
  ]
};

// Input Modal Component with improved dark theme
function InputModal({
  isOpen,
  onClose,
  onSubmit,
  title,
  message,
  placeholder = "",
  defaultValue = ""
}: {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (value: string) => void;
  title: string;
  message: string;
  placeholder?: string;
  defaultValue?: string;
}) {
  const [inputValue, setInputValue] = useState(defaultValue);

  useEffect(() => {
    if (isOpen) {
      setInputValue(defaultValue);
    }
  }, [isOpen, defaultValue]);

  if (!isOpen) return null;

  const handleSubmit = () => {
    if (inputValue.trim()) {
      onSubmit(inputValue.trim());
    }
    onClose();
    setInputValue("");
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[9999] backdrop-blur-sm">
      <div className="bg-gray-900 border border-gray-700 rounded-lg p-6 w-96 max-w-[90vw] shadow-2xl">
        <h3 className="text-lg font-semibold mb-2 text-gray-100">{title}</h3>
        <p className="text-sm text-gray-300 mb-4 whitespace-pre-line">{message}</p>
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder={placeholder}
          className="w-full p-3 bg-gray-800 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 mb-4 text-gray-100 placeholder-gray-400"
          onKeyPress={(e) => {
            if (e.key === 'Enter') handleSubmit();
            if (e.key === 'Escape') onClose();
          }}
          autoFocus
        />
        <div className="flex gap-2 justify-end">
          <Button variant="outline" onClick={onClose} className="border-gray-600 text-gray-300 hover:bg-gray-800">
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!inputValue.trim()} className="bg-blue-600 hover:bg-blue-700 text-white">
            Submit
          </Button>
        </div>
      </div>
    </div>
  );
}

// Model Selection Modal Component with improved dark theme and scrollbar
function ModelSelectionModal({
  isOpen,
  onClose,
  onSelect,
  title,
  models,
  currentModel,
  loading,
  onPullModel,
  modelType
}: {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (model: string) => void;
  title: string;
  models: OllamaModel[];
  currentModel?: string;
  loading: boolean;
  onPullModel: (modelName: string) => void;
  modelType: 'llm' | 'embedding';
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'installed' | 'recommended'>('installed');
  const [pullModelName, setPullModelName] = useState('');
  const [showPullInput, setShowPullInput] = useState(false);

  const filteredModels = models.filter(model =>
    model.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const recommendedModels = RECOMMENDED_MODELS[modelType];

  if (!isOpen) return null;

  const handlePullModel = async (modelName: string) => {
    if (modelName.trim()) {
      await onPullModel(modelName.trim());
      setPullModelName('');
      setShowPullInput(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[9999] backdrop-blur-sm">
      <div className="bg-gray-900 border border-gray-700 rounded-lg w-[700px] max-w-[90vw] max-h-[85vh] shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <h2 className="text-xl font-semibold text-gray-100">{title}</h2>
          <Button variant="ghost" size="sm" onClick={onClose} className="text-gray-400 hover:text-gray-200 hover:bg-gray-800">
            ✕
          </Button>
        </div>

        {/* Search and Tabs */}
        <div className="p-4 border-b border-gray-700">
          <input
            type="text"
            placeholder={`Search ${modelType} models...`}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full p-3 bg-gray-800 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 mb-3 text-gray-100 placeholder-gray-400"
          />

          <div className="flex gap-2">
            <button
              onClick={() => setSelectedCategory('installed')}
              className={`px-4 py-2 rounded-md text-sm transition-colors font-medium ${selectedCategory === 'installed'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-800 text-gray-300 hover:bg-gray-700 border border-gray-600'
                }`}
            >
              📦 Installed ({filteredModels.length})
            </button>
            <button
              onClick={() => setSelectedCategory('recommended')}
              className={`px-4 py-2 rounded-md text-sm transition-colors font-medium ${selectedCategory === 'recommended'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-800 text-gray-300 hover:bg-gray-700 border border-gray-600'
                }`}
            >
              ⭐ Recommended ({recommendedModels.length})
            </button>
          </div>
        </div>

        {/* Content with visible scrollbar */}
        <div className="flex-1 overflow-y-auto p-4 scrollbar-thin scrollbar-track-gray-800 scrollbar-thumb-gray-600 scrollbar-thumb-rounded-full">
          {selectedCategory === 'installed' ? (
            <div className="space-y-2">
              {filteredModels.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  <div className="text-lg mb-2">📦</div>
                  <p>No {modelType} models found</p>
                  <p className="text-sm mt-1">
                    {searchTerm ? 'Try a different search term' : 'Pull a model to get started'}
                  </p>
                </div>
              ) : (
                filteredModels.map((model) => (
                  <div
                    key={model.name}
                    onClick={() => onSelect(model.name)}
                    className={`p-4 border rounded-lg cursor-pointer transition-colors ${currentModel === model.name
                      ? 'bg-blue-900/30 border-blue-500 text-blue-100'
                      : 'border-gray-700 hover:bg-gray-800 text-gray-200'
                      }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{model.name}</span>
                          {currentModel === model.name && (
                            <span className="text-xs bg-blue-600 text-white px-2 py-1 rounded-full">
                              Current
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-gray-400 mt-1">
                          Size: {model.size} • Modified: {new Date(model.modified).toLocaleDateString()}
                        </div>
                      </div>
                      {currentModel === model.name && (
                        <div className="text-green-400 text-xl">✓</div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {recommendedModels.map((model) => {
                const isInstalled = models.some(m => m.name === model.name);
                return (
                  <div
                    key={model.name}
                    className="p-4 border border-gray-700 rounded-lg hover:bg-gray-800 transition-colors text-gray-200"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{model.name}</span>
                          {isInstalled ? (
                            <span className="text-xs bg-green-600 text-white px-2 py-1 rounded-full">
                              Installed
                            </span>
                          ) : (
                            <span className="text-xs bg-gray-600 text-gray-200 px-2 py-1 rounded-full">
                              Available
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-400 mt-1">{model.description}</p>
                      </div>
                      <div className="flex gap-2">
                        {isInstalled ? (
                          <Button
                            size="sm"
                            onClick={() => onSelect(model.name)}
                            disabled={loading}
                            className="bg-blue-600 hover:bg-blue-700 text-white"
                          >
                            Select
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handlePullModel(model.name)}
                            disabled={loading}
                            className="border-gray-600 text-gray-300 hover:bg-gray-800"
                          >
                            {loading ? '⏳' : '⬇️'} Pull
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer - Pull Custom Model with improved styling */}
        <div className="border-t border-gray-700 p-4 bg-gray-800/50">
          <div className="flex items-center justify-between mb-3">
            <span className="font-medium text-sm text-gray-200">🔽 Pull Custom Model</span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowPullInput(!showPullInput)}
              disabled={loading}
              className="border-gray-600 text-gray-300 hover:bg-gray-700"
            >
              {showPullInput ? 'Cancel' : '+ Custom Model'}
            </Button>
          </div>

          {showPullInput && (
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="e.g., phi3:mini, llama3:8b"
                value={pullModelName}
                onChange={(e) => setPullModelName(e.target.value)}
                className="flex-1 p-3 bg-gray-800 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-100 placeholder-gray-400"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') handlePullModel(pullModelName);
                }}
              />
              <Button
                onClick={() => handlePullModel(pullModelName)}
                disabled={!pullModelName.trim() || loading}
                size="sm"
                className="bg-blue-600 hover:bg-blue-700 text-white min-w-[80px]"
              >
                {loading ? '⏳' : '⬇️'} Pull
              </Button>
            </div>
          )}

          <div className="text-xs text-gray-400 mt-2">
            Visit <a href="https://ollama.ai/library" target="_blank" rel="noopener noreferrer" className="text-blue-400 underline hover:text-blue-300">ollama.ai/library</a> for more models
          </div>
        </div>

        {loading && (
          <div className="absolute inset-0 bg-gray-900/90 flex items-center justify-center backdrop-blur-sm">
            <div className="text-center text-gray-100">
              <div className="text-2xl mb-2">⏳</div>
              <p className="font-medium">Pulling model...</p>
              <p className="text-sm text-gray-400">This may take several minutes</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function ModelSelector({ className }: { className?: string }) {
  const [config, setConfig] = useState<ModelConfig | null>(null);
  const [isConfiguring, setIsConfiguring] = useState(false);
  const [loading, setLoading] = useState(false);
  const { showSuccess, showError, showInfo } = useNotification();
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Modal states
  const [showModelInput, setShowModelInput] = useState(false);
  const [showApiKeyInput, setShowApiKeyInput] = useState(false);

  useEffect(() => {
    loadConfig();
  }, []);

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsConfiguring(false);
      }
    };

    if (isConfiguring) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isConfiguring]);

  const loadConfig = async () => {
    try {
      const result = await window.electronAPI.getModelConfig();
      if (result.success && result.data) {
        setConfig(result.data);
      } else {
        console.warn('No model config data received:', result.error);
        setConfig(null);
      }
    } catch (error) {
      console.error('Failed to load model config:', error);
      setConfig(null);
    }
  };

  const handleProviderChange = async (provider: string) => {
    if (provider === config?.llmProvider || loading) return;

    setLoading(true);

    try {
      if (provider === 'ollama') {
        await handleOllamaSetup();
      } else if (provider === 'gemini') {
        // Check if already configured using persistent storage
        if (config?.configured?.gemini) {
          // Already configured, just switch using stored API key
          const result = await window.electronAPI.setLLMProvider('gemini', {});
          if (result.success) {
            await loadConfig();
            showSuccess("Switched to Gemini (using saved API key)");
          } else {
            showError(`Failed to switch: ${result.error}`);
          }
        } else {
          // Not configured, show input modal
          setShowApiKeyInput(true);
        }
      }
    } catch (error) {
      console.error('Provider setup error:', error);
      showError(`Setup failed: ${error}`);
    } finally {
      setLoading(false);
      setIsConfiguring(false);
    }
  };

  const handleOllamaSetup = async () => {
    const ollamaStatus = await window.electronAPI.checkOllama();

    if (!ollamaStatus.success || !ollamaStatus.data?.installed) {
      const confirmed = window.confirm(
        "Ollama is not installed. Would you like to download it from the official website?"
      );
      if (confirmed) {
        window.open('https://ollama.com', '_blank');
      }
      return;
    }

    const availableModels = ollamaStatus.data?.models || [];

    if (availableModels.length === 0) {
      setShowModelInput(true);
      return;
    }

    // Configure with first available model
    await configureOllamaProvider(availableModels[0] || 'phi3:mini');
  };

  const handleModelInstall = async (modelName: string) => {
    if (!modelName) return;

    showInfo("Installing model... This may take a few minutes. Please wait.", 3000);
    const result = await window.electronAPI.installOllamaModel(modelName);

    if (result.success) {
      showSuccess("Model installed successfully!");
      await configureOllamaProvider(modelName);
    } else {
      showError(`Failed to install model: ${result.error}`);
    }
  };

  const configureOllamaProvider = async (modelName: string) => {
    const result = await window.electronAPI.setLLMProvider('ollama', {
      model: modelName
    });

    if (result.success) {
      await loadConfig();
      showSuccess(`Ollama configured successfully! Using model: ${modelName}`);
    } else {
      showError(`Failed to configure Ollama: ${result.error}`);
    }
  };

  const handleApiKeySubmit = async (apiKey: string) => {
    if (!apiKey) return;

    if (apiKey.toLowerCase().includes('get-key') || apiKey.toLowerCase().includes('help')) {
      window.open('https://makersuite.google.com/app/apikey', '_blank');
      return;
    }

    // Basic validation
    if (!apiKey.startsWith('AI') || apiKey.length < 30) {
      showError('Invalid API key format. Gemini keys should start with "AI" and be longer.');
      return;
    }

    const result = await window.electronAPI.setLLMProvider('gemini', {
      apiKey: apiKey
    });

    if (result.success) {
      await loadConfig();
      showSuccess("Gemini configured successfully!");
    } else {
      showError(`Failed to configure Gemini: ${result.error}`);
    }
  };

  if (!config) {
    return <div className="text-sm text-gray-400">Loading...</div>;
  }

  const currentProvider = PROVIDERS.find(p => p.id === config.llmProvider);

  return (
    <>
      <div className={cn("relative inline-flex items-center gap-2 text-sm", className)}>
        <span className="text-gray-400 hidden sm:inline">Model</span>

        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-200">
            {currentProvider?.icon} {currentProvider?.label}
            {/* Show API key status for Gemini */}
            {config.llmProvider === 'gemini' && config.maskedKeys?.gemini && (
              <span className="text-xs text-green-400 ml-1">✓</span>
            )}
          </span>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsConfiguring(!isConfiguring)}
            disabled={loading}
            className="h-8 w-8 p-0 border-gray-600 text-gray-300 hover:bg-gray-800 hover:text-gray-200"
          >
            {loading ? "⏳" : isConfiguring ? "✕" : "⚙️"}
          </Button>
        </div>

        {isConfiguring && (
          <>
            <div
              className="fixed inset-0 z-40"
            />

            <div ref={dropdownRef} className="absolute top-full right-0 mt-2 bg-gray-900 border border-gray-700 rounded-lg shadow-2xl p-4 min-w-[280px] z-50">
              <h3 className="font-medium mb-3 text-center text-gray-100">Select AI Provider</h3>
              <div className="space-y-2">
                {PROVIDERS.map((provider) => (
                  <Button
                    key={provider.id}
                    className={`w-full justify-start transition-colors ${config.llmProvider === provider.id
                      ? 'bg-blue-600 hover:bg-blue-700 text-white hover:text-white'
                      : 'bg-gray-800 text-gray-200 hover:bg-gray-700 hover:text-white border border-gray-600'
                      }`}
                    onClick={() => handleProviderChange(provider.id)}
                    disabled={loading}
                  >
                    <span className="mr-2">{provider.icon}</span>
                    {provider.label}
                    {config.llmProvider === provider.id && (
                      <span className="ml-auto">✓</span>
                    )}
                  </Button>
                ))}
              </div>

              <div className="mt-3 pt-3 border-t border-gray-700 text-xs text-gray-400 text-center">
                <div className="mb-1">Current: <span className="text-blue-400 font-medium">{config.llmProvider.toUpperCase()}</span></div>
                {config.llmProvider === 'ollama' && config.ollamaModel && (
                  <div className="text-gray-300">Model: <span className="text-green-400">{config.ollamaModel}</span></div>
                )}
                {config.llmProvider === 'gemini' && config.maskedKeys?.gemini && (
                  <div className="text-gray-300">Key: <span className="text-green-400 font-mono text-xs">{config.maskedKeys.gemini}</span></div>
                )}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Model Installation Input Modal */}
      <InputModal
        isOpen={showModelInput}
        onClose={() => setShowModelInput(false)}
        onSubmit={handleModelInstall}
        title="Install Ollama Model"
        message={`No models found. Which model would you like to install?

Recommended:
• phi3:mini (lightweight, fast)
• gemma:2b (efficient, good quality)  
• llama3:8b (high quality, larger)

Enter model name:`}
        placeholder="e.g., phi3:mini"
      />

      {/* API Key Input Modal */}
      <InputModal
        isOpen={showApiKeyInput}
        onClose={() => setShowApiKeyInput(false)}
        onSubmit={handleApiKeySubmit}
        title="Enter Gemini API Key"
        message={`Enter your Gemini API key:

Don't have one? Get it free from:
https://makersuite.google.com/app/apikey

The key should start with "AI..." and be about 40 characters long.

Type 'get-key' to open the API key page.`}
        placeholder="AIzaSy..."
      />
    </>
  );
}

export default ModelSelector;
