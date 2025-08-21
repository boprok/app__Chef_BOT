// Chef Bot API Service
const API_BASE_URL = 'https://app-chef-bot-api.onrender.com';  // Always use Render for now
const FALLBACK_URL = 'https://app-chef-bot-api.onrender.com';  // Same as primary

class ChefBotAPI {
  constructor() {
    this.baseURL = API_BASE_URL;
    this.fallbackURL = FALLBACK_URL;
    this.token = null;
  }

  setToken(token) {
    this.token = token;
  }

  async requestWithFallback(endpoint, options = {}, retries = 2) {
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        // Try primary URL first
        console.log(`🔄 Attempt ${attempt + 1}/${retries + 1} - Primary URL`);
        return await this.makeRequest(this.baseURL + endpoint, options);
      } catch (error) {
        console.log(`❌ Primary URL failed (attempt ${attempt + 1}): ${error.message}`);
        
        if (attempt < retries) {
          console.log('🔄 Retrying in 2 seconds...');
          await new Promise(resolve => setTimeout(resolve, 2000));
          continue;
        }
        
        // Last attempt - try fallback
        console.log('🔄 Primary URL exhausted, trying fallback...');
        try {
          return await this.makeRequest(this.fallbackURL + endpoint, options);
        } catch (fallbackError) {
          console.error('❌ Both URLs failed after all retries');
          throw error; // Throw original error
        }
      }
    }
  }

  async makeRequest(url, options = {}) {
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...(this.token && { Authorization: `Bearer ${this.token}` }),
        ...options.headers,
      },
      ...options,
    };

    console.log(`🔗 API Request: ${url}`); // Debug logging

    // Add timeout to prevent hanging requests
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout for tunnel mode
    
    const response = await fetch(url, {
      ...config,
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);
    
    console.log(`✅ API Response: ${response.status}`); // Debug logging
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ API Error: ${response.status} - ${errorText}`);
      throw new Error(`API Error: ${response.status} - ${errorText}`);
    }

    return response.json();
  }

  async request(endpoint, options = {}) {
    try {
      return await this.requestWithFallback(endpoint, options);
    } catch (error) {
      if (error.name === 'AbortError') {
        console.error('❌ API Request timed out after 30 seconds');
        throw new Error('Request timed out. Please check your connection.');
      }
      console.error('❌ API Request failed:', error);
      throw error;
    }
  }

  // Health check
  async health() {
    return this.request('/api/health');
  }

  // Authentication
  async signup(email, password) {
    return this.request('/api/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  async login(email, password) {
    return this.request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  async getProfile() {
    return this.request('/api/auth/me');
  }

  // Recipe analysis
  async analyzeImage(imageUri, prompt = '') {
    const formData = new FormData();
    formData.append('file', {
      uri: imageUri,
      type: 'image/jpeg',
      name: 'fridge.jpg',
    });
    formData.append('prompt', prompt);

    const response = await fetch(`${this.baseURL}/api/analyze`, {
      method: 'POST',
      headers: {
        ...(this.token && { Authorization: `Bearer ${this.token}` }),
        'Content-Type': 'multipart/form-data',
      },
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Analysis failed: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    return result;
  }
}

// Export a singleton instance
export const api = new ChefBotAPI();

// Helper functions for easier usage
export const authAPI = {
  login: (email, password) => api.login(email, password),
  signup: (email, password) => api.signup(email, password),
  getProfile: () => api.getProfile(),
  setToken: (token) => api.setToken(token),
};

export const recipeAPI = {
  analyzeImage: (imageUri, prompt) => api.analyzeImage(imageUri, prompt),
};

export default api;
