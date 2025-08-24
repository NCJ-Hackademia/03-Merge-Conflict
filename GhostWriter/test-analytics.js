const axios = require('axios');

const BASE_URL = 'http://localhost:3001';

// Sample code files for testing analytics
const sampleFiles = [
  {
    path: 'src/components/Button.jsx',
    content: `
import React from 'react';
import './Button.css';

// Button component with multiple props
function Button({ 
  children, 
  variant = 'primary', 
  size = 'medium', 
  disabled = false,
  onClick,
  className = ''
}) {
  // Complex logic with multiple conditions
  const getButtonClasses = () => {
    const baseClasses = 'button';
    const variantClasses = {
      primary: 'button--primary',
      secondary: 'button--secondary',
      danger: 'button--danger'
    };
    const sizeClasses = {
      small: 'button--small',
      medium: 'button--medium',
      large: 'button--large'
    };
    
    return [
      baseClasses,
      variantClasses[variant],
      sizeClasses[size],
      disabled ? 'button--disabled' : '',
      className
    ].filter(Boolean).join(' ');
  };

  const handleClick = (event) => {
    if (disabled) return;
    if (onClick) onClick(event);
  };

  return (
    <button
      className={getButtonClasses()}
      disabled={disabled}
      onClick={handleClick}
    >
      {children}
    </button>
  );
}

export default Button;
    `
  },
  {
    path: 'src/services/api.js',
    content: `
import axios from 'axios';

// API service with security considerations
class ApiService {
  constructor() {
    this.baseURL = process.env.REACT_APP_API_URL || 'http://localhost:3000';
    this.client = axios.create({
      baseURL: this.baseURL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }

  // Authentication methods
  async login(credentials) {
    try {
      const response = await this.client.post('/auth/login', credentials);
      return response.data;
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  }

  // Data fetching with error handling
  async getData(endpoint, params = {}) {
    try {
      const response = await this.client.get(endpoint, { params });
      return response.data;
    } catch (error) {
      console.error('Data fetch failed:', error);
      throw error;
    }
  }

  // Secure data posting
  async postData(endpoint, data) {
    try {
      const response = await this.client.post(endpoint, data);
      return response.data;
    } catch (error) {
      console.error('Data post failed:', error);
      throw error;
    }
  }
}

export default new ApiService();
    `
  },
  {
    path: 'src/utils/helpers.js',
    content: `
// Utility functions with various complexity levels

// Simple utility function
export const formatDate = (date) => {
  return new Date(date).toLocaleDateString();
};

// Medium complexity function
export const calculateDiscount = (price, discountPercent, isMember = false) => {
  let finalDiscount = discountPercent;
  
  if (isMember) {
    finalDiscount += 10; // Member bonus
  }
  
  if (price > 100) {
    finalDiscount += 5; // High value bonus
  }
  
  const discountAmount = (price * finalDiscount) / 100;
  return Math.max(0, price - discountAmount);
};

// Complex function with multiple conditions
export const validateForm = (formData) => {
  const errors = {};
  
  // Email validation
  if (!formData.email) {
    errors.email = 'Email is required';
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
    errors.email = 'Invalid email format';
  }
  
  // Password validation
  if (!formData.password) {
    errors.password = 'Password is required';
  } else if (formData.password.length < 8) {
    errors.password = 'Password must be at least 8 characters';
  } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
    errors.password = 'Password must contain uppercase, lowercase, and number';
  }
  
  // Age validation
  if (formData.age) {
    const age = parseInt(formData.age);
    if (isNaN(age) || age < 0 || age > 150) {
      errors.age = 'Invalid age';
    }
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

// Function with potential security issues (for testing)
export const processUserInput = (input) => {
  // This is intentionally vulnerable for testing
  return eval(input); // Security vulnerability for testing
};
    `
  }
];

async function testAnalytics() {
  console.log('🧪 Testing Analytics Features...\n');

  try {
    // Step 1: Ingest sample code
    console.log('📥 Step 1: Ingesting sample code...');
    
    const commitData = {
      projectName: 'test-analytics-project',
      metadata: {
        hash: 'abc123',
        author: 'Test Developer',
        date: new Date().toISOString(),
        'commit-message': 'feat: Add sample components and utilities'
      },
      files: sampleFiles
    };

    const ingestResponse = await axios.post(`${BASE_URL}/ingest-commit`, commitData);
    
    if (ingestResponse.data.success) {
      console.log('✅ Code ingested successfully!');
    } else {
      console.log('❌ Failed to ingest code:', ingestResponse.data.error);
      return;
    }

    // Step 2: Test Analytics Endpoints
    console.log('\n📊 Step 2: Testing Analytics Endpoints...');

    // Test Health Metrics
    console.log('\n🔍 Testing Health Metrics...');
    const healthResponse = await axios.get(`${BASE_URL}/analytics/health/test-analytics-project?days=30`);
    if (healthResponse.data.success) {
      console.log('✅ Health Metrics:', healthResponse.data.data);
    }

    // Test Tech Stack
    console.log('\n🔍 Testing Tech Stack Analysis...');
    const techStackResponse = await axios.get(`${BASE_URL}/analytics/tech-stack/test-analytics-project`);
    if (techStackResponse.data.success) {
      console.log('✅ Tech Stack:', techStackResponse.data.data);
    }

    // Test Evolution Trends
    console.log('\n🔍 Testing Evolution Trends...');
    const evolutionResponse = await axios.get(`${BASE_URL}/analytics/evolution/test-analytics-project?days=90`);
    if (evolutionResponse.data.success) {
      console.log('✅ Evolution Trends:', evolutionResponse.data.data);
    }

    // Test Full Analytics Summary
    console.log('\n🔍 Testing Full Analytics Summary...');
    const summaryResponse = await axios.get(`${BASE_URL}/analytics/summary/test-analytics-project`);
    if (summaryResponse.data.success) {
      console.log('✅ Analytics Summary:', summaryResponse.data.data);
    }

    console.log('\n🎉 Analytics testing completed!');
    console.log('\n📋 Next Steps:');
    console.log('1. Open the GhostWriter app');
    console.log('2. Navigate to "📊 Analytics"');
    console.log('3. Select "test-analytics-project" from the dropdown');
    console.log('4. View the comprehensive analytics dashboard');

  } catch (error) {
    console.error('❌ Error during testing:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
    }
  }
}

// Run the test
testAnalytics();
