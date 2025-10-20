// screens/HomeScreen.tsx
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as MediaLibrary from 'expo-media-library';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Button, FlatList, Share, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface HomeScreenProps {
  navigation: {
    navigate: (screen: string, params?: any) => void;
  };
}

export default function HomeScreen({ navigation }: HomeScreenProps) {
  const [songs, setSongs] = useState<MediaLibrary.Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadSongs();
  }, []);

  const loadSongs = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status === 'granted') {
        const media = await MediaLibrary.getAssetsAsync({
          mediaType: 'audio',
          first: 100,
        });
        setSongs(media.assets);
        
        if (media.assets.length === 0) {
          setError('No music files found on your device');
        }
      } else {
        setError('Permission denied. Please grant media library access to view your music.');
      }
    } catch (err) {
      console.error('Error loading songs:', err);
      setError('Failed to load music library. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (duration: number) => {
    if (!duration) return 'Unknown';
    const mins = Math.floor(duration / 60);
    const secs = Math.floor(duration % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading your music...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={loadSongs}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Your Music ({songs.length} songs)</Text>
      <FlatList
        data={songs}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity 
            style={styles.songItem}
            onPress={() => {
              console.log('HomeScreen - Selected song:', item);
              navigation.navigate('Player', { song: item });
            }}
          >
            <Text style={styles.songTitle}>{item.filename}</Text>
            <Text style={styles.songDuration}>
              {formatDuration(item.duration)}
            </Text>
            <View style={{ marginTop: 8, flexDirection: 'row', gap: 8 }}>
              <Button title="Share" onPress={async () => {
                try {
                  await Share.share({ message: `${item.filename}\n\n${item.uri}` });
                } catch (e) {
                  console.error('Share failed', e);
                }
              }} />
                <Button title="Add to Playlist" onPress={async () => {
                  try {
                    const raw = await AsyncStorage.getItem('playlists');
                    const lists = raw ? JSON.parse(raw) : [];
                    if (lists.length === 0) {
                      const defaultList = { name: 'My Playlist', songs: [item] };
                      await AsyncStorage.setItem('playlists', JSON.stringify([defaultList]));
                      Alert.alert('Playlist created', 'Added to My Playlist');
                    } else {
                      lists[0].songs = lists[0].songs || [];
                      lists[0].songs.push(item);
                      await AsyncStorage.setItem('playlists', JSON.stringify(lists));
                      Alert.alert('Added', `Added to ${lists[0].name}`);
                    }
                  } catch (err) {
                    console.error('Add to playlist failed', err);
                    Alert.alert('Error', 'Failed to add to playlist');
                  }
                }} />
            </View>
          </TouchableOpacity>
        )}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f5f5f5',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#333',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  errorText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  songItem: {
    backgroundColor: 'white',
    padding: 16,
    marginBottom: 8,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  songTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 4,
  },
  songDuration: {
    fontSize: 12,
    color: '#666',
  },
});
