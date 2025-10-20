// screens/PlayScreen.tsx
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAudioPlayer } from 'expo-audio';
import * as MediaLibrary from 'expo-media-library';
import React, { useEffect, useState } from 'react';
import { Alert, Button, Share, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface PlayerScreenProps {
  route: {
    params: {
      song: MediaLibrary.Asset | null;
    };
  };
}

export default function PlayerScreen({ route }: PlayerScreenProps) {
  const { song } = route.params;
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  
  const player = useAudioPlayer(song?.uri || '', {
    updateInterval: 100
  });

  useEffect(() => {
    if (!player.isLoaded) return;

    setIsPlaying(player.playing);
    setCurrentTime(player.currentTime || 0);
    setDuration(player.duration || 0);
  });

  const playSound = async () => {
    if (!song || !song.uri) {
      Alert.alert('Error', 'No song selected or invalid song data');
      return;
    }

    try {
      setIsLoading(true);
      console.log('Attempting to play:', song.uri);
      console.log('Song details:', {
        filename: song.filename,
        uri: song.uri,
        duration: song.duration,
        mediaType: song.mediaType
      });
      
      await player.play();
      console.log('Play command executed successfully');
    } catch (error: any) {
      console.error('Error playing sound:', error);
      Alert.alert('Error', `Failed to play the selected song: ${error?.message || 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const seekForward = () => {
    if (!player.isLoaded) return;
    const cur = player.currentTime || currentTime || 0;
    const target = Math.min((player.duration || duration || 0), cur + 10);
    player.seekTo(target);
    setCurrentTime(target);
  };

  const seekBackward = () => {
    if (!player.isLoaded) return;
    const cur = player.currentTime || currentTime || 0;
    const target = Math.max(0, cur - 10);
    player.seekTo(target);
    setCurrentTime(target);
  };

  const pauseSound = () => {
    player.pause();
  };

  const resumeSound = () => {
    player.play();
  };

  const stopSound = () => {
    player.pause();
    player.seekTo(0);
  };

  const [isFavorite, setIsFavorite] = useState(false);

  useEffect(() => {
    (async () => {
      if (!song) return;
      const raw = await AsyncStorage.getItem('favorites');
      const list = raw ? JSON.parse(raw) : [];
      setIsFavorite(list.some((s: any) => s.id === song.id));
    })();
  }, [song]);

  async function toggleFavorite() {
    if (!song) return;
    const raw = await AsyncStorage.getItem('favorites');
    const list = raw ? JSON.parse(raw) : [];
    const exists = list.find((s: any) => s.id === song.id);
    let newList;
    if (exists) {
      newList = list.filter((s: any) => s.id !== song.id);
      setIsFavorite(false);
    } else {
      newList = [song, ...list];
      setIsFavorite(true);
    }
    await AsyncStorage.setItem('favorites', JSON.stringify(newList));
  }

  async function onShare() {
    try {
      if (!song) {
        Alert.alert('Nothing to share');
        return;
      }
      const message = `${song.filename}\n\n${song.uri}`;
      await Share.share({ message });
    } catch (error: any) {
      Alert.alert('Share failed', error?.message || String(error));
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!song) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>No song selected</Text>
        <Text style={styles.uriText}>
          Debug: Check console for navigation parameters
        </Text>
      </View>
    );
  }

  if (!song.uri) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Invalid song data - missing URI</Text>
        <Text style={styles.uriText}>
          Song data: {JSON.stringify(song, null, 2)}
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.songTitle}>
        {song.filename || 'Unknown Song'}
      </Text>
      
      <View style={styles.timeContainer}>
        <Text style={styles.timeText}>{formatTime(currentTime)}</Text>
        <Text style={styles.timeText}>/</Text>
        <Text style={styles.timeText}>{formatTime(duration)}</Text>
      </View>

      <Text style={styles.statusText}>{isLoading ? 'Loading...' : isPlaying ? 'Playing' : 'Paused'}</Text>
      
      <View style={styles.controlsContainer}>
        <Button 
          title={isLoading ? "Loading..." : "Play"} 
          onPress={playSound}
          disabled={isLoading}
        />
        
        {isPlaying ? (
          <Button title="Pause" onPress={pauseSound} />
        ) : (
          <Button title="Resume" onPress={resumeSound} disabled={!song.uri} />
        )}
        
        <Button title="Stop" onPress={stopSound} disabled={!song.uri} />
      </View>
      <View style={styles.seekContainer}>
        <TouchableOpacity onPress={seekBackward} style={styles.seekButton}>
          <Ionicons name="play-back" size={28} color="#333" />
        </TouchableOpacity>
        <TouchableOpacity onPress={seekForward} style={styles.seekButton}>
          <Ionicons name="play-forward" size={28} color="#333" />
        </TouchableOpacity>
      </View>
      <View style={styles.actionsContainer}>
        <TouchableOpacity onPress={toggleFavorite} style={styles.iconButton}>
          <Ionicons name={isFavorite ? 'heart' : 'heart-outline'} size={28} color={isFavorite ? '#e0245e' : '#333'} />
        </TouchableOpacity>
        <TouchableOpacity onPress={onShare} style={styles.iconButton}>
          <Ionicons name="share-social" size={24} color="#333" />
        </TouchableOpacity>
      </View>
      
      {song.uri && (
        <Text style={styles.uriText}>
          URI: {song.uri.substring(0, 50)}...
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  songTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
    color: '#333',
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 30,
  },
  timeText: {
    fontSize: 16,
    color: '#666',
    marginHorizontal: 5,
  },
  controlsContainer: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
  errorText: {
    fontSize: 18,
    color: '#666',
  },
  uriText: {
    fontSize: 10,
    color: '#999',
    textAlign: 'center',
    marginTop: 20,
  },
  actionsContainer: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 10,
  },
  iconButton: {
    padding: 8,
    marginHorizontal: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusText: {
    fontSize: 14,
    color: '#444',
    marginBottom: 8,
  },
  seekContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '60%',
    marginTop: 12,
  },
  seekButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(0,0,0,0.03)',
  },
});