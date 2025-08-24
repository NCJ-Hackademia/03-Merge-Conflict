const https = require('https');

class GeminiService {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.baseURL = 'generativelanguage.googleapis.com';
    this.model = 'gemini-2.5-flash';
  }

  async initialize() {
    if (!this.apiKey) {
      throw new Error("Gemini API key is required");
    }

    // Test the API key with a simple request
    try {
      await this.testConnection();
      console.log("✅ Gemini Service initialized");
    } catch (error) {
      throw new Error(`Gemini API key validation failed: ${error.message}`);
    }
  }

  async testConnection() {
    const testResponse = await this.generateWithContext("System", "Say 'Hello' to test the connection");
    if (!testResponse || testResponse.length < 1) {
      throw new Error("Invalid API response during test");
    }
  }

  async generateWithContext(systemPrompt, userPrompt) {
    const prompt = `${systemPrompt}\n\nUser: ${userPrompt}\nAssistant:`;

    const requestBody = {
      contents: [{
        parts: [{
          text: prompt
        }]
      }],
      generationConfig: {
        temperature: 0.2,
      }
    };

    try {
      const response = await this.makeRequest(`/v1/models/${this.model}:generateContent`, requestBody);

      // ✅ Safe response parsing with proper error handling
      return this.safeParseResponse(response);

    } catch (error) {
      throw new Error(`Gemini API error: ${error.message}`);
    }
  }

  // ✅ New method: Safe response parsing
  safeParseResponse(response) {
    try {
      // Check if response exists
      if (!response) {
        throw new Error("No response received from API");
      }

      // Check for API error in response
      if (response.error) {
        throw new Error(`API Error: ${response.error.message || 'Unknown error'}`);
      }

      // Check candidates array
      if (!response.candidates || !Array.isArray(response.candidates) || response.candidates.length === 0) {
        throw new Error("No candidates in response");
      }

      const candidate = response.candidates[0];

      // Check finish reason
      if (candidate.finishReason && candidate.finishReason !== 'STOP') {
        if (candidate.finishReason === 'SAFETY') {
          throw new Error("Response blocked due to safety filters");
        } else if (candidate.finishReason === 'OTHER') {
          throw new Error("Response generation stopped unexpectedly");
        } else {
          throw new Error(`Response stopped: ${candidate.finishReason}`);
        }
      }

      // Check content structure
      if (!candidate.content) {
        throw new Error("No content in candidate");
      }

      if (!candidate.content.parts || !Array.isArray(candidate.content.parts) || candidate.content.parts.length === 0) {
        throw new Error("Response content missing 'parts'");
      }

      const textPart = candidate.content.parts[0];

      // Check if parts contain text
      if (!textPart || typeof textPart.text !== 'string') {
        throw new Error("No valid text content in response parts");
      }

      return textPart.text;

    } catch (error) {
      // If it's already our custom error, re-throw
      if (error.message.includes('API Error:') ||
        error.message.includes('No candidates') ||
        error.message.includes('Response blocked')) {
        throw error;
      }
      // For unexpected errors, wrap them
      throw new Error(`Error parsing response: ${error.message}`);
    }
  }

  async makeRequest(endpoint, body) {
    return new Promise((resolve, reject) => {
      const options = {
        hostname: this.baseURL,
        path: `${endpoint}?key=${this.apiKey}`,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      };

      const req = https.request(options, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try {
            const result = JSON.parse(data);

            // ✅ Check for HTTP error status
            if (res.statusCode >= 400) {
              const errorMsg = result.error?.message || `HTTP ${res.statusCode}`;
              reject(new Error(errorMsg));
            } else {
              resolve(result);
            }
          } catch (e) {
            reject(new Error(`Invalid JSON response: ${data}`));
          }
        });
      });

      req.on('error', (error) => {
        reject(new Error(`Network error: ${error.message}`));
      });

      // ✅ Add timeout handling
      req.setTimeout(30000, () => {
        req.destroy();
        reject(new Error('Request timeout'));
      });

      req.write(JSON.stringify(body));
      req.end();
    });
  }
}

module.exports = GeminiService;
