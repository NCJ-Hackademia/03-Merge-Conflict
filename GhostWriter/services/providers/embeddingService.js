
const https = require('https');

class EmbeddingService {
  constructor(config = {}) {
    this.provider = config.provider || 'ollama';
    this.config = config;
  }

  async initialize() {
    switch (this.provider) {
      case 'ollama':
        this.ollamaService = require('./ollamaService');
        break;
      case 'huggingface':
        // Free alternative for embeddings
        this.apiKey = this.config.huggingfaceApiKey;
        break;
      case 'openai':
        this.apiKey = this.config.openaiApiKey;
        break;
      default:
        throw new Error(`Unsupported embedding provider: ${this.provider}`);
    }
    console.log(`✅ Embedding service initialized with ${this.provider}`);
  }

  async embedText(text) {
    switch (this.provider) {
      case 'ollama':
        return await this.embedWithOllama(text);
      case 'huggingface':
        return await this.embedWithHuggingFace(text);
      case 'openai':
        return await this.embedWithOpenAI(text);
      default:
        throw new Error(`Unsupported embedding provider: ${this.provider}`);
    }
  }

  async embedWithOllama(text) {
    const ollamaService = new (require('./ollamaService'))();
    return await ollamaService.embedText(text);
  }

  async embedWithHuggingFace(text) {
    // Using sentence-transformers/all-MiniLM-L6-v2 (free)
    const response = await this.httpRequest({
      hostname: 'api-inference.huggingface.co',
      path: '/pipeline/feature-extraction/sentence-transformers/all-MiniLM-L6-v2',
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      }
    }, JSON.stringify({ inputs: text }));

    return Array.isArray(response) ? response[0] : response;
  }

  async embedWithOpenAI(text) {
    const response = await this.httpRequest({
      hostname: 'api.openai.com',
      path: '/v1/embeddings',
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      }
    }, JSON.stringify({
      model: 'text-embedding-ada-002',
      input: text
    }));

    return response.data[0].embedding;
  }

  httpRequest(options, body) {
    return new Promise((resolve, reject) => {
      const req = https.request(options, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try {
            resolve(JSON.parse(data));
          } catch (e) {
            reject(new Error(`Invalid response: ${data}`));
          }
        });
      });
      req.on('error', reject);
      if (body) req.write(body);
      req.end();
    });
  }
}

module.exports = EmbeddingService;
