// screens/ModernHomeScreen.tsx
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import * as MediaLibrary from 'expo-media-library';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Dimensions,
    FlatList,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
    Platform,
    Alert,
    ActionSheetIOS,
    Share,
} from 'react-native';

const { width } = Dimensions.get('window');

interface HomeScreenProps {
  navigation: {
    navigate: (screen: string, params?: any) => void;
  };
}

interface SongCardProps {
  song: MediaLibrary.Asset;
  onPlay: () => void;
}

const SongCard: React.FC<SongCardProps & { onAddToPlaylist: () => void; onLongPress: () => void }> = ({ song, onPlay, onAddToPlaylist, onLongPress }) => {
  const formatDuration = (duration: number) => {
    if (!duration) return 'Unknown';
    const mins = Math.floor(duration / 60);
    const secs = Math.floor(duration % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <TouchableOpacity style={styles.songCard} onPress={onPlay} onLongPress={onLongPress} delayLongPress={250}>
      <View style={styles.songImageContainer}>
        <LinearGradient
          colors={['#8B5CF6', '#A855F7', '#C084FC']}
          style={styles.songImageGradient}
        >
          <Ionicons name="musical-notes" size={24} color="white" />
        </LinearGradient>
        <TouchableOpacity style={styles.playButton} onPress={onPlay}>
          <Ionicons name="play" size={16} color="white" />
        </TouchableOpacity>
      </View>
      
      <View style={styles.songInfo}>
        <Text style={styles.songTitle} numberOfLines={1}>
          {song.filename}
        </Text>
        <Text style={styles.songArtist} numberOfLines={1}>
          Unknown Artist
        </Text>
      </View>
      
      <Text style={styles.songDuration}>
        {formatDuration(song.duration)}
      </Text>
      
      <TouchableOpacity style={styles.moreButton} onPress={onAddToPlaylist}>
        <Ionicons name="add-circle-outline" size={20} color="#9CA3AF" />
      </TouchableOpacity>
    </TouchableOpacity>
  );
};

export default function ModernHomeScreen({ navigation }: HomeScreenProps) {
  const [songs, setSongs] = useState<MediaLibrary.Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadSongs();
  }, []);

  const loadSongs = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status === 'granted') {
        const pageSize = 300;
        let after: string | undefined = undefined;
        let all: MediaLibrary.Asset[] = [];
        while (true) {
          const resp = await MediaLibrary.getAssetsAsync({
            mediaType: 'audio' as any,
            first: pageSize,
            after,
            sortBy: MediaLibrary.SortBy.creationTime as any,
          } as any);
          all = all.concat(resp.assets);
          if (!(resp as any).hasNextPage || !(resp as any).endCursor) break;
          after = (resp as any).endCursor;
        }
        setSongs(all);
        if (all.length === 0) {
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

  const filteredSongs = songs.filter(song => {
    const name = (song?.filename ?? '').toString().toLowerCase();
    const q = (searchQuery ?? '').toString().toLowerCase();
    return name.includes(q);
  });

  const playSong = (song: MediaLibrary.Asset) => {
    console.log('ModernHomeScreen - Selected song:', song);
    navigation.navigate('Player', { song });
  };

  const addToPlaylist = async (song: MediaLibrary.Asset) => {
    try {
      const raw = await AsyncStorage.getItem('playlists');
      const lists = raw ? JSON.parse(raw) : [];
      if (lists.length === 0) {
        const defaultList = { id: Date.now().toString(), name: 'My Playlist', songs: [song], createdAt: new Date() };
        await AsyncStorage.setItem('playlists', JSON.stringify([defaultList]));
      } else {
        lists[0].songs = lists[0].songs || [];
        // prevent duplicates by id
        if (!lists[0].songs.find((s: any) => s.id === song.id)) {
          lists[0].songs.push(song);
        }
        await AsyncStorage.setItem('playlists', JSON.stringify(lists));
      }
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch (err) {
      console.error('Add to playlist failed', err);
    }
  };

  const longPressSong = async (song: MediaLibrary.Asset) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const actions = ['Play', 'Add to Playlist', 'Share', 'Cancel'];
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        { options: actions, cancelButtonIndex: 3, userInterfaceStyle: 'dark' },
        async (idx) => {
          if (idx === 0) playSong(song);
          if (idx === 1) addToPlaylist(song);
          if (idx === 2) try { await Share.share({ message: `${song.filename}\n\n${song.uri}` }); } catch {}
        }
      );
    } else {
      Alert.alert(song.filename, undefined, [
        { text: 'Play', onPress: () => playSong(song) },
        { text: 'Add to Playlist', onPress: () => addToPlaylist(song) },
        { text: 'Share', onPress: async () => { try { await Share.share({ message: `${song.filename}\n\n${song.uri}` }); } catch {} } },
        { text: 'Cancel', style: 'cancel' },
      ]);
    }
  };

  if (loading) {
    return (
      <LinearGradient colors={['#0F0F23', '#1A1A2E', '#16213E']} style={styles.container}>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#8B5CF6" />
          <Text style={styles.loadingText}>Loading your music...</Text>
        </View>
      </LinearGradient>
    );
  }

  if (error) {
    return (
      <LinearGradient colors={['#0F0F23', '#1A1A2E', '#16213E']} style={styles.container}>
        <View style={styles.centerContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={loadSongs}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={['#0F0F23', '#1A1A2E', '#16213E']} style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <LinearGradient
          colors={['#8B5CF6', '#A855F7']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.titleGradient}
        >
          <Text style={styles.title}>My Library</Text>
        </LinearGradient>
        
        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#9CA3AF" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search songs, artists..."
            placeholderTextColor="#9CA3AF"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      {/* Songs List */}
      <FlatList
        data={filteredSongs}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <SongCard 
            song={item} 
            onPlay={() => playSong(item)} 
            onAddToPlaylist={() => addToPlaylist(item)} 
            onLongPress={() => longPressSong(item)}
          />
        )}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.songsList}
      />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  titleGradient: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    color: 'white',
    fontSize: 16,
  },
  songsList: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  songCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  songImageContainer: {
    position: 'relative',
    marginRight: 16,
  },
  songImageGradient: {
    width: 56,
    height: 56,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playButton: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    opacity: 0,
  },
  songInfo: {
    flex: 1,
    marginRight: 12,
  },
  songTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
    marginBottom: 4,
  },
  songArtist: {
    fontSize: 14,
    color: '#9CA3AF',
  },
  songDuration: {
    fontSize: 14,
    color: '#9CA3AF',
    marginRight: 12,
  },
  moreButton: {
    padding: 8,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#9CA3AF',
  },
  errorText: {
    fontSize: 16,
    color: '#9CA3AF',
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#8B5CF6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
