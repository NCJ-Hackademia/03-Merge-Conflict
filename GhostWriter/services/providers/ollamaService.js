
const http = require('http');
const { spawnSync } = require('child_process');

class OllamaService {
  constructor() {
    this.OLLAMA_HOST = process.env.OLLAMA_HOST || "http://127.0.0.1:11434";
    this.EMBEDDING_MODEL = "nomic-embed-text";
    this.DEFAULT_MODEL = "phi3:mini";
  }

  async initialize() {
    // Check if Ollama is available
    const ollamaCheck = this.checkOllama();
    if (!ollamaCheck) {
      throw new Error("Ollama not found. Please install Ollama first.");
    }

    console.log("✅ Ollama Service initialized");
  }

  checkOllama() {
    try {
      const result = spawnSync("ollama", ["--version"], { encoding: "utf8" });
      return result.status === 0;
    } catch (error) {
      return false;
    }
  }

  async embedText(text) {
    const response = await this.httpJson({
      method: "POST",
      path: "/api/embeddings",
      body: { model: this.EMBEDDING_MODEL, prompt: text }
    });

    if (!response || !response.embedding) {
      throw new Error("No embedding returned from Ollama");
    }

    return response.embedding;
  }

  async generateWithContext(systemPrompt, userPrompt) {
    const response = await this.httpJson({
      method: "POST",
      path: "/api/generate",
      body: {
        model: this.DEFAULT_MODEL,
        system: systemPrompt,
        prompt: userPrompt,
        stream: false,
        options: { temperature: 0.2 }
      }
    });

    if (!response || !response.response) {
      throw new Error("No response from LLM");
    }

    return response.response;
  }

  async getAvailableModels() {
    try {
      const result = spawnSync("ollama", ["list"], { encoding: "utf8" });
      if (result.status === 0) {
        return result.stdout.split('\n').slice(1).filter(line => line.trim());
      }
      return [];
    } catch (error) {
      return [];
    }
  }

  httpJson({ method, path, body }) {
    const url = new URL(this.OLLAMA_HOST);
    const opts = {
      method,
      hostname: url.hostname,
      port: url.port,
      path,
      headers: { "Content-Type": "application/json" },
    };

    return new Promise((resolve, reject) => {
      const req = http.request(opts, (res) => {
        let data = "";
        res.on("data", (chunk) => (data += chunk));
        res.on("end", () => {
          try {
            resolve(JSON.parse(data));
          } catch (e) {
            const parts = data.trim().split(/\n+/);
            const last = parts[parts.length - 1];
            try {
              resolve(JSON.parse(last));
            } catch {
              reject(new Error(data));
            }
          }
        });
      });
      req.on("error", reject);
      if (body) req.write(JSON.stringify(body));
      req.end();
    });
  }
}

module.exports = OllamaService;
