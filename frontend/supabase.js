import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

// Custom storage for web
const webStorage = {
  getItem: (key) => {
    return Promise.resolve(localStorage.getItem(key));
  },
  setItem: (key, value) => {
    localStorage.setItem(key, value);
    return Promise.resolve();
  },
  removeItem: (key) => {
    localStorage.removeItem(key);
    return Promise.resolve();
  },
};

// Custom storage implementation that uses SecureStore for native and localStorage for web
const storage = Platform.OS === 'web' ? webStorage : {
  getItem: (key) => SecureStore.getItemAsync(key),
  setItem: (key, value) => SecureStore.setItemAsync(key, value),
  removeItem: (key) => SecureStore.deleteItemAsync(key),
};

// Make sure your URL starts with https:// and ends with .supabase.co
const supabaseUrl = 'https://xvbebkmnoxrmfvjccamf.supabase.co';
// Your anon key should start with 'eyJ...'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh2YmVia21ub3hybWZ2amNjYW1mIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzE5MDE1NzQsImV4cCI6MjA0NzQ3NzU3NH0.zxZXRm9VHzum4PYPvxNihlQ1ZkfmLRLe7BOe8VfIbN0';

// Log the configuration for debugging
console.log('Supabase URL:', supabaseUrl);
console.log('Supabase key exists:', !!supabaseAnonKey);

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: storage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  },
});