// Environment and configuration constants

export const config = {
  // API Configuration
  apiUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1',

  // Feature flags
  mockMode: process.env.NEXT_PUBLIC_MOCK_MODE === 'true' || false,

  // App Configuration
  app: {
    name: 'Zentracker',
    version: '0.1.0',
  },

  // Timer Configuration
  timer: {
    updateInterval: 1000, // Update timer every 1 second
    maxDescriptionLength: 500,
  },

  // UI Configuration
  ui: {
    defaultProjectColor: '#3B82F6',
    itemsPerPage: 20,
    recentEntriesLimit: 5,
  },
} as const;

// Environment checks
export const isDevelopment = process.env.NODE_ENV === 'development';
export const isProduction = process.env.NODE_ENV === 'production';