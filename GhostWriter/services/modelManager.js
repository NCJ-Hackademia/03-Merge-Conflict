const OllamaService = require('./providers/ollamaService');
const GeminiService = require('./providers/geminiService');
const EmbeddingService = require('./providers/embeddingService');
const fs = require('fs');
const path = require('path');
const { app } = require('electron');

class ModelManager {
  constructor() {
    // ✅ Use Electron's userData directory for config storage
    this.configDir = app.getPath('userData');
    this.configPath = path.join(this.configDir, 'ghostwriter-config.json');
    this.config = this.loadConfig();
    this.llmService = null;
    this.embeddingService = null;
  }

  loadConfig() {
    try {
      // Ensure config directory exists
      if (!fs.existsSync(this.configDir)) {
        fs.mkdirSync(this.configDir, { recursive: true });
      }

      // Load existing config or create default
      if (fs.existsSync(this.configPath)) {
        const configData = fs.readFileSync(this.configPath, 'utf8');
        const config = JSON.parse(configData);
        console.log('✅ Loaded existing configuration');
        return config;
      }
    } catch (error) {
      console.warn('Failed to load config:', error.message);
    }

    // Return default configuration
    console.log('📝 Creating new configuration file');
    return {
      llmProvider: 'ollama',
      embeddingProvider: 'ollama',
      ollamaModel: 'phi3:mini',
      geminiApiKey: null,
      huggingfaceApiKey: null,
      openaiApiKey: null,
      // ✅ Track when API keys were last updated
      lastUpdated: new Date().toISOString(),
      version: '1.0.0'
    };
  }

  saveConfig() {
    try {
      // Update timestamp
      this.config.lastUpdated = new Date().toISOString();

      // Save to file with pretty formatting
      fs.writeFileSync(this.configPath, JSON.stringify(this.config, null, 2));
      console.log('💾 Configuration saved successfully');
    } catch (error) {
      console.error('Failed to save config:', error.message);
    }
  }

  async initialize() {
    try {
      await this.initializeLLM();
      await this.initializeEmbedding();
      console.log('✅ Model Manager initialized');
    } catch (error) {
      console.error('Model Manager initialization failed:', error.message);
      throw error;
    }
  }

  async initializeLLM() {
    try {
      switch (this.config.llmProvider) {
        case 'ollama':
          this.llmService = new OllamaService();
          await this.llmService.initialize();
          break;
        case 'gemini':
          if (!this.config.geminiApiKey) {
            console.warn('⚠️ Gemini selected but no API key found');
            // Fall back to Ollama if no API key
            this.config.llmProvider = 'ollama';
            this.saveConfig();
            return await this.initializeLLM();
          }
          this.llmService = new GeminiService(this.config.geminiApiKey);
          await this.llmService.initialize();
          break;
        default:
          throw new Error(`Unsupported LLM provider: ${this.config.llmProvider}`);
      }
      console.log(`✅ LLM initialized: ${this.config.llmProvider}`);
    } catch (error) {
      console.error(`Failed to initialize LLM (${this.config.llmProvider}):`, error.message);
      throw error;
    }
  }

  async initializeEmbedding() {
    try {
      // ✅ Determine embedding provider and API key
      let apiKey = null;
      if (this.config.embeddingProvider === 'huggingface') {
        apiKey = this.config.huggingfaceApiKey;
      } else if (this.config.embeddingProvider === 'openai') {
        apiKey = this.config.openaiApiKey;
      }

      this.embeddingService = new EmbeddingService({
        provider: this.config.embeddingProvider,
        huggingfaceApiKey: this.config.huggingfaceApiKey,
        openaiApiKey: this.config.openaiApiKey
      });

      await this.embeddingService.initialize();
      console.log(`✅ Embedding initialized: ${this.config.embeddingProvider}`);
    } catch (error) {
      console.error(`Failed to initialize embedding service:`, error.message);
      throw error;
    }
  }

  // ✅ Enhanced configuration methods with persistence
  async setLLMProvider(provider, options = {}) {
    console.log(`🔄 Switching LLM provider to: ${provider}`);

    const previousProvider = this.config.llmProvider;
    this.config.llmProvider = provider;

    // Save API keys if provided
    if (provider === 'gemini' && options.apiKey) {
      this.config.geminiApiKey = options.apiKey;
      console.log('🔑 Gemini API key saved');
    }
    if (provider === 'ollama' && options.model) {
      this.config.ollamaModel = options.model;
      console.log(`🦙 Ollama model set to: ${options.model}`);
    }

    // ✅ Save config immediately
    this.saveConfig();

    try {
      await this.initializeLLM();
      console.log(`✅ Successfully switched to ${provider}`);
    } catch (error) {
      // ✅ Rollback on failure
      console.error(`❌ Failed to switch to ${provider}, rolling back to ${previousProvider}`);
      this.config.llmProvider = previousProvider;
      this.saveConfig();
      await this.initializeLLM();
      throw error;
    }
  }

  async setEmbeddingProvider(provider, apiKey = null) {
    console.log(`🔄 Switching embedding provider to: ${provider}`);

    this.config.embeddingProvider = provider;

    // ✅ Save API key if provided
    if (apiKey) {
      if (provider === 'huggingface') {
        this.config.huggingfaceApiKey = apiKey;
        console.log('🔑 HuggingFace API key saved');
      } else if (provider === 'openai') {
        this.config.openaiApiKey = apiKey;
        console.log('🔑 OpenAI API key saved');
      }
    }

    this.saveConfig();
    await this.initializeEmbedding();
  }

  // ✅ Check if provider is already configured
  isProviderConfigured(provider) {
    switch (provider) {
      case 'ollama':
        return true; // Ollama doesn't need API key
      case 'gemini':
        return !!this.config.geminiApiKey;
      default:
        return false;
    }
  }

  // ✅ Get masked API key for display
  getMaskedApiKey(provider) {
    let key = null;
    switch (provider) {
      case 'gemini':
        key = this.config.geminiApiKey;
        break;
      case 'huggingface':
        key = this.config.huggingfaceApiKey;
        break;
      case 'openai':
        key = this.config.openaiApiKey;
        break;
    }

    if (!key) return null;

    // Show first 8 and last 4 characters
    if (key.length > 12) {
      return key.substring(0, 8) + '...' + key.substring(key.length - 4);
    }
    return key.substring(0, 4) + '...';
  }

  // ✅ Service getters with validation
  getLLMService() {
    if (!this.llmService) {
      throw new Error('LLM service not initialized');
    }
    return this.llmService;
  }

  getEmbeddingService() {
    if (!this.embeddingService) {
      throw new Error('Embedding service not initialized');
    }
    return this.embeddingService;
  }

  // Status checks
  async checkOllamaStatus() {
    try {
      const ollama = new OllamaService();
      return {
        installed: ollama.checkOllama(),
        models: await ollama.getAvailableModels()
      };
    } catch (error) {
      return {
        installed: false,
        models: [],
        error: error.message
      };
    }
  }

  // ✅ Enhanced config getter with additional info
  getConfig() {
    return {
      ...this.config,
      // Add masked API keys for display
      maskedKeys: {
        gemini: this.getMaskedApiKey('gemini'),
        huggingface: this.getMaskedApiKey('huggingface'),
        openai: this.getMaskedApiKey('openai')
      },
      // Add provider status
      configured: {
        ollama: this.isProviderConfigured('ollama'),
        gemini: this.isProviderConfigured('gemini')
      }
    };
  }

  // ✅ Clear sensitive data (for debugging/reset)
  clearApiKeys() {
    this.config.geminiApiKey = null;
    this.config.huggingfaceApiKey = null;
    this.config.openaiApiKey = null;
    this.saveConfig();
    console.log('🧹 All API keys cleared');
  }
}

module.exports = ModelManager;
