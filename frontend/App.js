import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  Platform,
  Image,
} from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { supabase } from './supabase'; // Make sure this import points to your supabase.js file
//import config from './config';


const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';

const App = () => {
  const [audioFile, setAudioFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState('');
  const [transcription, setTranscription] = useState('');
  const [error, setError] = useState('');
  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null);

  useEffect(() => {
    // Check for existing session
    supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
      console.log('Current session:', currentSession);
      setSession(currentSession);
      setUser(currentSession?.user ?? null);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, currentSession) => {
      console.log('Auth state changed:', _event);
      setSession(currentSession);
      setUser(currentSession?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogin = async () => {
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: process.env.EXPO_PUBLIC_AUTH_CALLBACK_URL
        }
      });
  
      if (error) {
        console.error('Login error:', error);
        setError(error.message);
      } else {
        console.log('Login successful:', data);
      }
    } catch (error) {
      console.error('Error:', error.message);
      setError(error.message);
    }
  };

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      setSession(null);
      setUser(null);
    } catch (error) {
      console.error('Error:', error.message);
      setError(error.message);
    }
  };

  const pickAudio = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'audio/*',
        copyToCacheDirectory: true
      });
      
      if (result.assets && result.assets[0]) {
        setAudioFile(result.assets[0]);
        setSummary('');
        setTranscription('');
        setError('');
      }
    } catch (err) {
      console.error('Error picking audio:', err);
      setError('Failed to pick audio file');
    }
  };

  const uploadAndSummarize = async () => {
    if (!audioFile) {
      setError('Please select an audio file first');
      return;
    }
    
    if (!session) {
      setError('Please login first');
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      console.log('Starting upload process');
      const formData = new FormData();
      
      if (Platform.OS === 'web') {
        const response = await fetch(audioFile.uri);
        const blob = await response.blob();
        formData.append('audio', blob, audioFile.name);
      } else {
        formData.append('audio', {
          uri: audioFile.uri,
          type: audioFile.mimeType || 'audio/mpeg',
          name: audioFile.name
        });
      }

      console.log('Sending request to:', `${API_URL}/api/summarize`);
      console.log('Session token:', session.access_token);

      const response = await fetch(`${API_URL}/api/summarize`, {
        method: 'POST',
        body: formData,
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      console.log('Response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error response:', errorText);
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('Response data:', data);
      
      setSummary(data.summary || '');
      setTranscription(data.transcription || '');

    } catch (error) {
      console.error('Upload error:', error);
      setError(error.message || 'Failed to upload and summarize audio');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Voice Notes Summary</Text>
        
        {/* Auth Section */}
        <View style={styles.authContainer}>
          {user ? (
            <View style={styles.userInfo}>
              {user.user_metadata?.avatar_url && (
                <Image 
                  source={{ uri: user.user_metadata.avatar_url }}
                  style={styles.userPicture}
                />
              )}
              <Text style={styles.userName}>
                {user.user_metadata?.full_name || user.email}
              </Text>
              <TouchableOpacity 
                style={styles.authButton} 
                onPress={handleLogout}
              >
                <Text style={styles.authButtonText}>Logout</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity 
              style={styles.authButton} 
              onPress={handleLogin}
            >
              <Text style={styles.authButtonText}>Sign in with Google</Text>
            </TouchableOpacity>
          )}
        </View>

        {error ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        <View style={styles.uploadArea}>
          {!audioFile ? (
            <TouchableOpacity 
              style={styles.uploadButton} 
              onPress={pickAudio}
            >
              <View style={styles.uploadIconContainer}>
                <Text style={styles.uploadIcon}>🎙️</Text>
              </View>
              <Text style={styles.uploadButtonText}>Select Audio File</Text>
              <Text style={styles.uploadSubText}>Tap to browse your files</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.filePreview}>
              <Text style={styles.fileName} numberOfLines={1}>
                Selected: {audioFile.name}
              </Text>
              <View style={styles.buttonGroup}>
                <TouchableOpacity 
                  style={styles.actionButton} 
                  onPress={() => setAudioFile(null)}
                >
                  <Text style={styles.actionButtonText}>Change File</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[
                    styles.actionButton, 
                    styles.primaryButton,
                    !session && styles.disabledButton
                  ]} 
                  onPress={uploadAndSummarize}
                  disabled={loading || !session}
                >
                  <Text style={[styles.actionButtonText, styles.primaryButtonText]}>
                    {loading ? 'Processing...' : 'Summarize'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>

        {loading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#0066CC" />
            <Text style={styles.loadingText}>Processing your audio file...</Text>
          </View>
        )}

        {summary ? (
          <View style={styles.resultContainer}>
            <View style={styles.summaryContainer}>
              <Text style={styles.sectionTitle}>Summary</Text>
              <Text style={styles.summaryText}>{summary}</Text>
            </View>
            
            {transcription ? (
              <View style={styles.transcriptionContainer}>
                <Text style={styles.sectionTitle}>Transcription</Text>
                <Text style={styles.transcriptionText}>{transcription}</Text>
              </View>
            ) : null}
          </View>
        ) : null}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingTop: Platform.OS === 'web' ? 20 : 0,
  },
  errorContainer: {
    backgroundColor: '#ffebee',
    padding: 10,
    borderRadius: 4,
    marginBottom: 20,
  },
  errorText: {
    color: '#c62828',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginVertical: 24,
    color: '#1a1a1a',
  },
  uploadArea: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 24,
    boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.1)',
  },
  uploadButton: {
    borderWidth: 2,
    borderColor: '#0066CC',
    borderStyle: 'dashed',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadIconContainer: {
    marginBottom: 16,
  },
  uploadIcon: {
    fontSize: 48,
  },
  uploadButtonText: {
    fontSize: 20,
    color: '#0066CC',
    fontWeight: '600',
    marginBottom: 8,
  },
  uploadSubText: {
    fontSize: 14,
    color: '#666666',
  },
  filePreview: {
    padding: 12,
  },
  fileName: {
    fontSize: 16,
    color: '#333333',
    marginBottom: 16,
  },
  buttonGroup: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#0066CC',
    alignItems: 'center',
  },
  primaryButton: {
    backgroundColor: '#0066CC',
  },
  actionButtonText: {
    fontSize: 16,
    color: '#0066CC',
    fontWeight: '500',
  },
  primaryButtonText: {
    color: '#ffffff',
  },
  loadingContainer: {
    marginTop: 24,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666666',
  },
  resultContainer: {
    marginTop: 24,
    gap: 20,
  },
  summaryContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.1)',
  },
  transcriptionContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.1)',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#1a1a1a',
  },
  summaryText: {
    fontSize: 16,
    lineHeight: 24,
    color: '#333333',
  },
  transcriptionText: {
    fontSize: 14,
    lineHeight: 22,
    color: '#666666',
  },
  disabledButton: {
    opacity: 0.5,
  },
});

export default App;