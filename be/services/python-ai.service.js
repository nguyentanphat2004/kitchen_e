// services/python-ai.service.js
const axios = require('axios');
const config = require('../config/default');

class PythonAIService {
  constructor() {
    this.baseURL = config.pythonAIServiceURL;
    this.client = axios.create({
      baseURL: this.baseURL,
      timeout: 30000, // 30 seconds
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }

  /**
   * Convert speech to text
   * @param {String} audioBase64 - Base64 encoded audio data
   * @param {String} userId - User ID (optional)
   * @returns {Promise<Object>} Text from speech
   */
  async speechToText(audioBase64, userId = null) {
    try {
      const response = await this.client.post('/ai/speech-to-text', {
        audio_base64: audioBase64,
        user_id: userId
      });
      return response.data;
    } catch (error) {
      console.error('Error in speechToText:', error.response?.data || error.message);
      throw new Error('Speech recognition failed: ' + (error.response?.data?.message || error.message));
    }
  }

  /**
   * Get product recommendations based on cooking style preferences
   * @param {Object} preferences - User cooking preferences 
   * @returns {Promise<Array>} Product recommendations
   */
  async getCookingStyleRecommendations(preferences) {
    try {
      const response = await this.client.post('/ai/cooking-style-recommendations', preferences);
      return response.data;
    } catch (error) {
      console.error('Error in getCookingStyleRecommendations:', error.response?.data || error.message);
      throw new Error('Failed to get recommendations: ' + (error.response?.data?.message || error.message));
    }
  }

  /**
   * Authenticate a user using face recognition
   * @param {String} imageBase64 - Base64 encoded image
   * @param {String} userId - User ID
   * @returns {Promise<Object>} Authentication result
   */
  async authenticateFace(imageBase64, userId) {
    try {
      const response = await this.client.post('/ai/face-authentication', {
        image_base64: imageBase64,
        user_id: userId
      });
      return response.data;
    } catch (error) {
      console.error('Error in authenticateFace:', error.response?.data || error.message);
      throw new Error('Face authentication failed: ' + (error.response?.data?.message || error.message));
    }
  }

  /**
   * Get recipe recommendations based on selected products
   * @param {Array} productIds - Array of product IDs
   * @returns {Promise<Array>} Recipe recommendations
   */
  async getRecipeRecommendations(productIds) {
    try {
      const response = await this.client.post('/ai/recipe-recommendations', { product_ids: productIds });
      return response.data;
    } catch (error) {
      console.error('Error in getRecipeRecommendations:', error.response?.data || error.message);
      throw new Error('Failed to get recipe recommendations: ' + (error.response?.data?.message || error.message));
    }
  }

  /**
   * Chat with AI assistant
   * @param {String} query - User query
   * @param {String} userId - User ID (optional)
   * @returns {Promise<Object>} Assistant response
   */
  async chatWithAssistant(query, userId = null) {
    try {
      const response = await this.client.post('/ai/chat-assistant', {
        query,
        user_id: userId
      });
      return response.data;
    } catch (error) {
      console.error('Error in chatWithAssistant:', error.response?.data || error.message);
      throw new Error('Chat assistant failed: ' + (error.response?.data?.message || error.message));
    }
  }

  /**
   * Analyze user behavior for personalized recommendations
   * @param {String} userId - User ID
   * @returns {Promise<Object>} User insights
   */
  async analyzeUserBehavior(userId) {
    try {
      const response = await this.client.post('/ai/user-behavior-analysis', { user_id: userId });
      return response.data;
    } catch (error) {
      console.error('Error in analyzeUserBehavior:', error.response?.data || error.message);
      throw new Error('User behavior analysis failed: ' + (error.response?.data?.message || error.message));
    }
  }

  /**
   * Health check for Python AI service
   * @returns {Promise<Boolean>} True if service is healthy
   */
  async healthCheck() {
    try {
      const response = await this.client.get('/health');
      return response.status === 200;
    } catch (error) {
      console.error('Python AI Service health check failed:', error.message);
      return false;
    }
  }
}

module.exports = new PythonAIService();