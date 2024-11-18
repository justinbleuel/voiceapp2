// src/hooks/useAuth.js
import { makeRedirectUri, useAuthRequest, useAutoDiscovery } from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

WebBrowser.maybeCompleteAuthSession();

// Add your API URL here
const API_URL = 'http://localhost:3000'

const useAuth = () => {
  const [user, setUser] = useState(null);  // Make sure this is defined
  const [loading, setLoading] = useState(true);

  const discovery = useAutoDiscovery('https://accounts.google.com');

  console.log('Discovery:', discovery); // Debug log

  const redirectUri = makeRedirectUri({
    scheme: 'voiceapp',
    path: 'auth',
    preferLocalhost: true,
  });
  console.log('Redirect URI:', redirectUri); // Debug log


  const [request, response, promptAsync] = useAuthRequest(
    {
      clientId: '390124815903-enp2spilasl8c1p3nmomahqr2lqavjsi.apps.googleusercontent.com', // Replace with your actual client ID
      scopes: ['openid', 'profile', 'email'],
      responseType: 'token id_token',
      redirectUri: redirectUri,
    },
    discovery
  );

  useEffect(() => {
    console.log('Checking auth...'); // Debug log
    checkAuth();
  }, []);

  useEffect(() => {
    console.log('Auth response:', response); // Debug log
    if (response?.type === 'success') {
      handleAuthResponse();
    }
  }, [response]);

  const checkAuth = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const userData = await AsyncStorage.getItem('user');
      if (token && userData) {
        setUser(JSON.parse(userData));
      }
    } catch (error) {
      console.error('Error checking auth:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAuthResponse = async () => {
    if (response?.type === 'success') {
      setLoading(true);
      try {
        const { access_token } = response.params;

        // Exchange Google token for JWT with your backend
        const apiResponse = await fetch(`${API_URL}/api/auth/google`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ access_token }),
        });

        const data = await apiResponse.json();
        if (!apiResponse.ok) throw new Error(data.error);

        // Store auth data
        await AsyncStorage.setItem('token', data.token);
        await AsyncStorage.setItem('user', JSON.stringify(data.user));
        setUser(data.user);
      } catch (error) {
        console.error('Auth error:', error);
      } finally {
        setLoading(false);
      }
    }
  };

  const login = async () => {
    console.log('Login pressed'); // Debug log
    try {
      await promptAsync({ useProxy: true });
      console.log('Prompt result:', result); // Debug log
    } catch (error) {
      console.error('Login error:', error);
    }
  };

  const logout = async () => {
    try {
      await AsyncStorage.removeItem('token');
      await AsyncStorage.removeItem('user');
      setUser(null);
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  return {
    user,
    loading,
    login,
    logout,
  };
};

export default useAuth;