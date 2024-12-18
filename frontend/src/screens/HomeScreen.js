// src/screens/HomeScreen.js
import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  Platform,
} from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import useAuth from '../hooks/useAuth';

const HomeScreen = () => {  // Changed from App to HomeScreen
  const [audioFile, setAudioFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState('');
  const [transcription, setTranscription] = useState('');
  const [error, setError] = useState('');
  const { logout } = useAuth();  // Add authentication hook

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
    if (!audioFile) return;

    setLoading(true);
    setError('');
    
    try {
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

      const API_URL = process.env.NODE_ENV === 'development' 
        ? 'http://localhost:3000' 
        : 'https://voiceapp2-production.up.railway.app';

      console.log('Sending request to:', `${API_URL}/api/summarize`);

      const response = await fetch(`${API_URL}/api/summarize`, {
        method: 'POST',
        body: formData,
        headers: {
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
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
        {/* Add header with logout */}
        <View style={styles.header}>
          <Text style={styles.title}>Voice Notes Summary</Text>
          <TouchableOpacity onPress={logout} style={styles.logoutButton}>
            <Text style={styles.logoutButtonText}>Logout</Text>
          </TouchableOpacity>
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
                  style={[styles.actionButton, styles.primaryButton]} 
                  onPress={uploadAndSummarize}
                  disabled={loading}
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
  content: {
    padding: 20,
    paddingTop: Platform.OS === 'web' ? 20 : 0,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  logoutButton: {
    padding: 8,
  },
  logoutButtonText: {
    color: '#0066CC',
    fontSize: 16,
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
    color: '#1a1a1a',
  },
  uploadArea: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
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
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  transcriptionContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
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
});

export default HomeScreen;