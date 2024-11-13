import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  Alert,
  Platform,
  ScrollView,
} from 'react-native';
import * as DocumentPicker from 'expo-document-picker';

const API_URL = const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';

export default function App() {
  const [audioFile, setAudioFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState('');
  const [transcription, setTranscription] = useState('');

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
      }
    } catch (err) {
      console.error('Error picking audio:', err);
      Alert.alert('Error', 'Failed to pick audio file');
    }
  };

  const uploadAndSummarize = async () => {
    if (!audioFile) return;

    setLoading(true);
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

      const response = await fetch(`${API_URL}/api/summarize`, {
        method: 'POST',
        body: formData,
        headers: {
          'Accept': 'application/json',
        },
      });

      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }

      setSummary(data.summary || '');
      setTranscription(data.transcription || '');

    } catch (error) {
      console.error('Upload error:', error);
      Alert.alert('Error', error.message || 'Failed to upload and summarize audio');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.content}>
          <Text style={styles.title}>Voice Notes Summary</Text>
          
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

          {summary && (
            <View style={styles.resultContainer}>
              <View style={styles.summaryContainer}>
                <Text style={styles.sectionTitle}>Summary</Text>
                <Text style={styles.summaryText}>{summary}</Text>
              </View>
              
              {transcription && (
                <View style={styles.transcriptionContainer}>
                  <Text style={styles.sectionTitle}>Transcription</Text>
                  <Text style={styles.transcriptionText}>{transcription}</Text>
                </View>
              )}
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

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