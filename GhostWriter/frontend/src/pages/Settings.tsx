import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useNotification } from '@/components/ui/notification';

// Updated interface to match ModelManager response
interface ModelConfig {
  llmProvider: string;
  embeddingProvider: string;
  ollamaModel: string;
  ollamaEmbeddingModel?: string; // ✅ Separate embedding model
  geminiApiKey: string | null;
  huggingfaceApiKey: string | null;
  openaiApiKey?: string | null;
  lastUpdated?: string;
  version?: string;
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

// Input Modal Component
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
           <Button onClick={onClose} className="border border-gray-600 text-gray-300 hover:bg-gray-800 hover:text-white transition-colors">
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

// Model Selection Modal Component
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
  const [showPullInput, setShowPullInput] = useState(false);

  // Recommended models based on type
  const recommendedModels = modelType === 'llm'
    ? ['phi3:mini', 'gemma:2b', 'llama3:8b', 'mistral:7b', 'codellama:7b']
    : ['nomic-embed-text', 'all-minilm', 'mxbai-embed-large'];

  if (!isOpen) return null;

  const handlePullModel = (modelName: string) => {
    onPullModel(modelName);
    setShowPullInput(false);
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[9999] backdrop-blur-sm">
      <div className="bg-gray-900 border border-gray-700 rounded-lg p-6 w-[600px] max-w-[90vw] max-h-[80vh] shadow-2xl overflow-hidden flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-100">{title}</h3>
                     <Button size="sm" onClick={onClose} className="text-gray-400 hover:text-gray-200 hover:bg-gray-800 transition-colors">✕</Button>
        </div>

        {/* Available Models */}
        <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-track-gray-800 scrollbar-thumb-gray-600">
          <h4 className="font-medium text-sm mb-3 text-gray-200">📦 Available Models ({models.length})</h4>

          {models.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <p>No {modelType} models found</p>
              <p className="text-sm mt-2">Pull a model to get started</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {models.map((model) => (
                <div
                  key={model.name}
                  className={`flex items-center justify-between p-3 border rounded-lg cursor-pointer transition-colors ${
                    currentModel === model.name 
                      ? 'bg-blue-900/30 border-blue-500 text-blue-100' 
                      : 'border-gray-700 hover:bg-gray-800 text-gray-200'
                  }`}
                  onClick={() => onSelect(model.name)}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{model.name}</span>
                      {currentModel === model.name && (
                        <span className="text-xs bg-blue-600 text-white px-2 py-1 rounded">Current</span>
                      )}
                    </div>
                    <div className="text-xs text-gray-400 mt-1">
                      Size: {model.size} • Modified: {new Date(model.modified).toLocaleDateString()}
                    </div>
                  </div>
                  {currentModel === model.name && (
                    <span className="text-green-400">✓</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Pull New Model Section */}
        <div className="border-t border-gray-700 pt-4 mt-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-medium text-sm text-gray-200">🔽 Pull New Model</h4>
                         <Button
               size="sm"
               onClick={() => setShowPullInput(!showPullInput)}
               disabled={loading}
               className="border border-gray-600 text-gray-300 hover:bg-gray-800 hover:text-white transition-colors"
             >
               {showPullInput ? 'Cancel' : '+ Pull Model'}
             </Button>
          </div>

          {showPullInput && (
            <div className="space-y-3">
              <div className="text-xs text-gray-400">
                <p className="font-medium mb-2">Recommended {modelType} models:</p>
                <div className="flex flex-wrap gap-1">
                  {recommendedModels.map((model) => (
                    <button
                      key={model}
                      onClick={() => handlePullModel(model)}
                      className="px-2 py-1 bg-gray-700 hover:bg-gray-600 rounded text-xs text-gray-200 border border-gray-600"
                      disabled={loading}
                    >
                      {model}
                    </button>
                  ))}
                </div>
              </div>

              <InputModal
                isOpen={showPullInput}
                onClose={() => setShowPullInput(false)}
                onSubmit={handlePullModel}
                title={`Pull New ${modelType === 'llm' ? 'LLM' : 'Embedding'} Model`}
                message={`Enter the name of the Ollama model you want to pull:

Examples:
${recommendedModels.map(m => `• ${m}`).join('\n')}

Visit https://ollama.ai/library for more models.`}
                placeholder="e.g., phi3:mini"
              />
            </div>
          )}
        </div>

        {loading && (
          <div className="flex items-center justify-center py-4 text-blue-400">
            <span className="mr-2">⏳</span>
            Pulling model... This may take several minutes.
          </div>
        )}
      </div>
    </div>
  );
}

function Settings() {
  const [config, setConfig] = useState<ModelConfig | null>(null);
  const [systemStatus, setSystemStatus] = useState({
    ollama: 'checking...',
    database: 'checking...',
    models: 'checking...'
  });
  const [loading, setLoading] = useState(false);
  const [ollamaModels, setOllamaModels] = useState<OllamaModel[]>([]);
  const { showSuccess, showError, showInfo } = useNotification();

  // Modal states
  const [showApiKeyInput, setShowApiKeyInput] = useState(false);
  const [showEmbeddingInput, setShowEmbeddingInput] = useState(false);
  const [showLLMModelSelector, setShowLLMModelSelector] = useState(false);
  const [showEmbeddingModelSelector, setShowEmbeddingModelSelector] = useState(false);
  const [embedProvider, setEmbedProvider] = useState<'huggingface' | 'openai'>('huggingface');
  const [modelPullLoading, setModelPullLoading] = useState(false);

  useEffect(() => {
    loadConfig();
    checkSystemStatus();
    loadOllamaModels();
  }, []);

  const loadConfig = async () => {
    try {
      const result = await window.electronAPI.getModelConfig();
      if (result.success && result.data) {
        setConfig(result.data);
      } else {
        console.error('Failed to load config:', result.error);
        setConfig(null);
      }
    } catch (error) {
      console.error('Failed to load config:', error);
      setConfig(null);
    }
  };



  const loadOllamaModels = async () => {
    try {
      const result = await window.electronAPI.listOllamaModelsDetailed();
      if (result.success && result.data) {
        // ✅ Map to OllamaModel structure (not { label, value })
        const mappedModels: OllamaModel[] = result.data.map(model => ({
          name: model.name,        // ✅ Use name, not label/value
          size: model.size,
          modified: model.modified,
          digest: undefined,
          details: undefined
        }));
        setOllamaModels(mappedModels);
      }
    } catch (error) {
      console.error('Failed to load Ollama models:', error);
      setOllamaModels([]);
    }
  };


  const checkSystemStatus = async () => {
    try {
      const ollamaStatus = await window.electronAPI.checkOllama();

      setSystemStatus({
        ollama: ollamaStatus.success && ollamaStatus.data?.installed ?
          `✅ Installed (${ollamaStatus.data.models.length} models)` :
          '❌ Not installed',
        database: '✅ SQLite connected',
        models: config ? `✅ Using ${config.llmProvider.toUpperCase()}` : 'Loading...'
      });
    } catch (error) {
      console.error('Error checking system status:', error);
      setSystemStatus({
        ollama: '❌ Error checking',
        database: '✅ SQLite connected',
        models: '❌ Error checking'
      });
    }
  };

  const setupEmbeddingProvider = (provider: 'huggingface' | 'openai') => {
    setEmbedProvider(provider);
    setShowEmbeddingInput(true);
  };

  const handleApiKeySubmit = async (apiKey: string) => {
    if (!apiKey) return;

    setLoading(true);
    try {
      const result = await window.electronAPI.setLLMProvider('gemini', { apiKey });
      if (result.success) {
        showSuccess("Gemini API key updated!");
        await loadConfig();
      } else {
        showError(`Failed: ${result.error}`);
      }
    } catch (error) {
      showError(`Error: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const handleEmbeddingKeySubmit = async (apiKey: string) => {
    if (!apiKey) return;

    setLoading(true);
    try {
      const result = await window.electronAPI.setEmbeddingProvider(embedProvider, apiKey);
      if (result.success) {
        showSuccess(`${embedProvider === 'huggingface' ? 'HuggingFace' : 'OpenAI'} embedding configured!`);
        await loadConfig();
      } else {
        showError(`Failed: ${result.error}`);
      }
    } catch (error) {
      showError(`Error: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const handleModelSelect = async (modelName: string, type: 'llm' | 'embedding') => {
    setLoading(true);
    try {
      if (type === 'llm') {
        const result = await window.electronAPI.setLLMProvider('ollama', { model: modelName });
        if (result.success) {
          showSuccess(`LLM model set to ${modelName}`);
          await loadConfig();
          setShowLLMModelSelector(false);
        } else {
          showError(`Failed: ${result.error}`);
        }
      } else {
        const result = await window.electronAPI.setEmbeddingProvider('ollama', modelName);
        if (result.success) {
          showSuccess(`Embedding model set to ${modelName}`);
          await loadConfig();
          setShowEmbeddingModelSelector(false);
        } else {
          showError(`Failed: ${result.error}`);
        }
      }
    } catch (error) {
      showError(`Error: ${error}`);
    } finally {
      setLoading(false);
    }
  };
  const handlePullModel = async (modelName: string) => {
    if (!modelName.trim()) return;

    setModelPullLoading(true);
    try {
      const result = await window.electronAPI.pullOllamaModel(modelName.trim());
      if (result.success) {
        showSuccess(`Model ${modelName} pulled successfully!`);
        await loadOllamaModels(); // Refresh model list
      } else {
        showError(`Failed to pull model: ${result.error}`);
      }
    } catch (error) {
      showError(`Error pulling model: ${error}`);
    } finally {
      setModelPullLoading(false);
    }
  };


  const resetConfiguration = async () => {
    if (!window.confirm("Are you sure you want to reset all AI configurations?")) return;

    setLoading(true);
    try {
      await window.electronAPI.setLLMProvider('ollama', { model: 'phi3:mini' });
      await window.electronAPI.setEmbeddingProvider('ollama');
      await loadConfig();
      await checkSystemStatus();
      showSuccess("Configuration reset to defaults!");
    } catch (error) {
      showError(`Error resetting: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="p-6 max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6 text-gray-100">⚙️ Settings & Configuration</h1>

        {/* System Status */}
        <Card className="mb-6 bg-gray-800/50 border-gray-700">
          <CardHeader>
            <CardTitle className="flex items-center justify-between text-gray-100">
              System Status
                               <Button
                   size="sm"
                   onClick={() => {
                     checkSystemStatus();
                     loadOllamaModels();
                   }}
                   disabled={loading}
                   className="border border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white transition-colors"
                 >
                   {loading ? '⏳' : '🔄'} Refresh
                 </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="font-medium text-gray-200">Ollama:</span>
                <span className="text-sm text-gray-300">{systemStatus.ollama}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-medium text-gray-200">Database:</span>
                <span className="text-sm text-gray-300">{systemStatus.database}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-medium text-gray-200">Current Model:</span>
                <span className="text-sm text-gray-300">{systemStatus.models}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* LLM Configuration */}
        {config && (
          <Card className="mb-6 bg-gray-800/50 border-gray-700">
            <CardHeader>
              <CardTitle className="text-gray-100">🤖 LLM Configuration</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="font-medium text-sm text-gray-200">LLM Provider:</label>
                    <p className="text-sm text-gray-300">
                      {config.llmProvider === 'ollama' ? '🦙 Ollama (Local)' : '✨ Google Gemini'}
                    </p>
                  </div>

                  {config.llmProvider === 'ollama' && (
                    <div>
                      <label className="font-medium text-sm text-gray-200">Current LLM Model:</label>
                      <div className="flex items-center gap-2">
                        <p className="text-sm text-gray-300">{config.ollamaModel}</p>
                                                 <Button
                           size="sm"
                           onClick={() => setShowLLMModelSelector(true)}
                           disabled={loading}
                           className="border border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white transition-colors"
                         >
                           Change Model
                         </Button>
                      </div>
                    </div>
                  )}
                </div>

                {config.llmProvider === 'gemini' && (
                  <div>
                    <label className="font-medium text-sm text-gray-200">Gemini API Key:</label>
                    <div className="flex items-center gap-2">
                      <p className="text-sm text-gray-300">
                        {config.maskedKeys?.gemini ?
                          `🔑 ${config.maskedKeys.gemini}` :
                          '❌ Not configured'
                        }
                      </p>
                                             <Button
                         size="sm"
                         onClick={() => setShowApiKeyInput(true)}
                         disabled={loading}
                         className="border border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white transition-colors"
                       >
                         {config.maskedKeys?.gemini ? 'Update' : 'Add'} Key
                       </Button>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Embedding Configuration */}
        {config && (
          <Card className="mb-6 bg-gray-800/50 border-gray-700">
            <CardHeader>
              <CardTitle className="text-gray-100">🔍 Embedding Configuration</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="font-medium text-sm text-gray-200">Embedding Provider:</label>
                    <p className="text-sm text-gray-300">
                      {config.embeddingProvider === 'ollama' ? '🦙 Ollama' :
                        config.embeddingProvider === 'huggingface' ? '🤗 HuggingFace' :
                          config.embeddingProvider === 'openai' ? '🤖 OpenAI' : config.embeddingProvider}
                    </p>
                  </div>

                  {config.embeddingProvider === 'ollama' && (
                    <div>
                      <label className="font-medium text-sm text-gray-200">Current Embedding Model:</label>
                      <div className="flex items-center gap-2">
                        <p className="text-sm text-gray-300">
                          {config.ollamaEmbeddingModel || 'nomic-embed-text'}
                        </p>
                                                 <Button
                           size="sm"
                           onClick={() => setShowEmbeddingModelSelector(true)}
                           disabled={loading}
                           className="border border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white transition-colors"
                         >
                           Change Model
                         </Button>
                      </div>
                    </div>
                  )}
                </div>

                <div className="pt-2 border-t border-gray-700">
                  <div className="flex flex-wrap gap-2">
                                         <Button
                       size="sm"
                       onClick={() => setupEmbeddingProvider('huggingface')}
                       disabled={loading}
                       className="border border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white transition-colors"
                     >
                       {loading ? '⏳' : '🤗'} HuggingFace Embeddings
                     </Button>

                                         <Button
                       size="sm"
                       onClick={() => setupEmbeddingProvider('openai')}
                       disabled={loading}
                       className="border border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white transition-colors"
                     >
                       {loading ? '⏳' : '🤖'} OpenAI Embeddings
                     </Button>

                                         <Button
                       size="sm"
                       onClick={resetConfiguration}
                       disabled={loading}
                       className="border border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white transition-colors"
                     >
                       🔄 Reset Config
                     </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Configuration File Info */}
        {config && (
          <Card className="mb-6 bg-gray-800/50 border-gray-700">
            <CardHeader>
              <CardTitle className="text-gray-100">📄 Configuration File</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="font-medium text-gray-200">Location:</span>
                  <code className="ml-2 text-xs bg-gray-700 text-gray-200 px-2 py-1 rounded border border-gray-600">
                    userData/ghostwriter-config.json
                  </code>
                </div>
                <div>
                  <span className="font-medium text-gray-200">Last Updated:</span>
                  <span className="ml-2 text-gray-300">
                    {config.lastUpdated ? new Date(config.lastUpdated).toLocaleString() : 'Never'}
                  </span>
                </div>
                <div>
                  <span className="font-medium text-gray-200">Available Models:</span>
                  <span className="ml-2 text-gray-300">{ollamaModels.length} Ollama models</span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Quick Actions */}
        <Card className="bg-gray-800/50 border-gray-700">
          <CardHeader>
            <CardTitle className="text-gray-100">🔗 Quick Links</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                             <Button
                 className="justify-start border border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white transition-colors"
                 onClick={() => window.open('https://ollama.com', '_blank')}
               >
                 📥 Download Ollama
               </Button>
               <Button
                 className="justify-start border border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white transition-colors"
                 onClick={() => window.open('https://ollama.ai/library', '_blank')}
               >
                 📚 Ollama Model Library
               </Button>
               <Button
                 className="justify-start border border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white transition-colors"
                 onClick={() => window.open('https://makersuite.google.com/app/apikey', '_blank')}
               >
                 🔑 Get Gemini API Key
               </Button>
               <Button
                 className="justify-start border border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white transition-colors"
                 onClick={() => window.open('https://huggingface.co/settings/tokens', '_blank')}
               >
                 🤗 Get HuggingFace Token
               </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* API Key Input Modal */}
      <InputModal
        isOpen={showApiKeyInput}
        onClose={() => setShowApiKeyInput(false)}
        onSubmit={handleApiKeySubmit}
        title="Update Gemini API Key"
        message={`Enter your Gemini API key:

Don't have one? Get it free from:
https://makersuite.google.com/app/apikey

The key should start with "AI..." and be about 40 characters long.`}
        placeholder="AIzaSy..."
      />

      {/* Embedding Provider Input Modal */}
      <InputModal
        isOpen={showEmbeddingInput}
        onClose={() => setShowEmbeddingInput(false)}
        onSubmit={handleEmbeddingKeySubmit}
        title={`Configure ${embedProvider === 'huggingface' ? 'HuggingFace' : 'OpenAI'} Embeddings`}
        message={embedProvider === 'huggingface' ?
          `Enter your HuggingFace API key:

Get it free from:
https://huggingface.co/settings/tokens

This will enable free embedding generation.` :
          `Enter your OpenAI API key:

Get it from:
https://platform.openai.com/api-keys

Note: OpenAI embeddings are paid per usage.`
        }
        placeholder={embedProvider === 'huggingface' ? 'hf_...' : 'sk-...'}
      />

      {/* LLM Model Selection Modal */}
      <ModelSelectionModal
        isOpen={showLLMModelSelector}
        onClose={() => setShowLLMModelSelector(false)}
        onSelect={(model) => handleModelSelect(model, 'llm')}
        title="Select LLM Model"
        models={ollamaModels}
        currentModel={config?.ollamaModel}
        loading={modelPullLoading}
        onPullModel={handlePullModel}
        modelType="llm"
      />

      {/* Embedding Model Selection Modal */}
      <ModelSelectionModal
        isOpen={showEmbeddingModelSelector}
        onClose={() => setShowEmbeddingModelSelector(false)}
        onSelect={(model) => handleModelSelect(model, 'embedding')}
        title="Select Embedding Model"
        models={ollamaModels.filter(m => m.name.includes('embed') || m.name.includes('nomic') || m.name.includes('minilm'))}
        currentModel={config?.ollamaEmbeddingModel || 'nomic-embed-text'}
        loading={modelPullLoading}
        onPullModel={handlePullModel}
        modelType="embedding"
      />
    </>
  );
}

export default Settings;
