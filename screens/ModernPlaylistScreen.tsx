// screens/ModernPlaylistScreen.tsx
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    Alert,
    FlatList,
    Modal,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';

interface Playlist {
  id: string;
  name: string;
  songs: any[];
  createdAt: Date;
}

interface PlaylistCardProps {
  playlist: Playlist;
  onPress: () => void;
  onDelete: () => void;
}

const PlaylistCard: React.FC<PlaylistCardProps> = ({ playlist, onPress, onDelete }) => {
  return (
    <TouchableOpacity style={styles.playlistCard} onPress={onPress}>
      <LinearGradient
        colors={['#8B5CF6', '#A855F7']}
        style={styles.playlistIcon}
      >
        <Ionicons name="musical-notes" size={24} color="white" />
      </LinearGradient>
      
      <View style={styles.playlistInfo}>
        <Text style={styles.playlistName} numberOfLines={1}>
          {playlist.name}
        </Text>
        <Text style={styles.playlistCount}>
          {playlist.songs.length} songs
        </Text>
      </View>
      
      <TouchableOpacity style={styles.deleteButton} onPress={onDelete}>
        <Ionicons name="trash-outline" size={20} color="#EF4444" />
      </TouchableOpacity>
    </TouchableOpacity>
  );
};

export default function ModernPlaylistScreen() {
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [playlistName, setPlaylistName] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const router = useRouter();

  useEffect(() => {
    loadPlaylists();
  }, []);

  const loadPlaylists = async () => {
    try {
      const data = await AsyncStorage.getItem('playlists');
      if (data) {
        const parsedPlaylists = JSON.parse(data).map((p: any) => ({
          ...p,
          createdAt: new Date(p.createdAt)
        }));
        setPlaylists(parsedPlaylists);
      }
    } catch (error) {
      console.error('Error loading playlists:', error);
    }
  };

  const createPlaylist = async () => {
    if (!playlistName.trim()) {
      Alert.alert('Error', 'Please enter a playlist name');
      return;
    }

    try {
      const newPlaylist: Playlist = {
        id: Date.now().toString(),
        name: playlistName.trim(),
        songs: [],
        createdAt: new Date()
      };

      const updatedPlaylists = [...playlists, newPlaylist];
      await AsyncStorage.setItem('playlists', JSON.stringify(updatedPlaylists));
      setPlaylists(updatedPlaylists);
      setPlaylistName('');
      setShowCreateModal(false);
      
      Alert.alert('Success', 'Playlist created successfully!');
    } catch (error) {
      console.error('Error creating playlist:', error);
      Alert.alert('Error', 'Failed to create playlist');
    }
  };

  const deletePlaylist = async (playlistId: string) => {
    Alert.alert(
      'Delete Playlist',
      'Are you sure you want to delete this playlist?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const updatedPlaylists = playlists.filter(p => p.id !== playlistId);
              await AsyncStorage.setItem('playlists', JSON.stringify(updatedPlaylists));
              setPlaylists(updatedPlaylists);
            } catch (error) {
              console.error('Error deleting playlist:', error);
              Alert.alert('Error', 'Failed to delete playlist');
            }
          }
        }
      ]
    );
  };

  const openPlaylist = (playlist: Playlist) => {
    router.push({ pathname: '/playlist/[id]', params: { id: playlist.id } } as any);
  };

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
          <Text style={styles.title}>Playlists</Text>
        </LinearGradient>
        
        <TouchableOpacity 
          style={styles.createButton}
          onPress={() => setShowCreateModal(true)}
        >
          <LinearGradient
            colors={['#8B5CF6', '#A855F7']}
            style={styles.createButtonGradient}
          >
            <Ionicons name="add" size={24} color="white" />
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {/* Playlists List */}
      {playlists.length === 0 ? (
        <View style={styles.emptyContainer}>
          <LinearGradient
            colors={['#8B5CF6', '#A855F7']}
            style={styles.emptyIcon}
          >
            <Ionicons name="musical-notes" size={48} color="white" />
          </LinearGradient>
          <Text style={styles.emptyTitle}>No Playlists Yet</Text>
          <Text style={styles.emptySubtitle}>
            Create your first playlist to organize your music
          </Text>
          <TouchableOpacity 
            style={styles.emptyButton}
            onPress={() => setShowCreateModal(true)}
          >
            <LinearGradient
              colors={['#8B5CF6', '#A855F7']}
              style={styles.emptyButtonGradient}
            >
              <Text style={styles.emptyButtonText}>Create Playlist</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={playlists}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <PlaylistCard
              playlist={item}
              onPress={() => openPlaylist(item)}
              onDelete={() => deletePlaylist(item.id)}
            />
          )}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.playlistsList}
        />
      )}

      {/* Create Playlist Modal */}
      <Modal
        visible={showCreateModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowCreateModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <LinearGradient
              colors={['#1A1A2E', '#16213E']}
              style={styles.modalGradient}
            >
              <Text style={styles.modalTitle}>Create New Playlist</Text>
              
              <TextInput
                style={styles.modalInput}
                placeholder="Enter playlist name"
                placeholderTextColor="#9CA3AF"
                value={playlistName}
                onChangeText={setPlaylistName}
                autoFocus
              />
              
              <View style={styles.modalButtons}>
                <TouchableOpacity 
                  style={styles.modalCancelButton}
                  onPress={() => {
                    setShowCreateModal(false);
                    setPlaylistName('');
                  }}
                >
                  <Text style={styles.modalCancelText}>Cancel</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={styles.modalCreateButton}
                  onPress={createPlaylist}
                >
                  <LinearGradient
                    colors={['#8B5CF6', '#A855F7']}
                    style={styles.modalCreateGradient}
                  >
                    <Text style={styles.modalCreateText}>Create</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </LinearGradient>
          </View>
        </View>
      </Modal>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  titleGradient: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
  },
  createButton: {
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  createButtonGradient: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playlistsList: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  playlistCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  playlistIcon: {
    width: 56,
    height: 56,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  playlistInfo: {
    flex: 1,
  },
  playlistName: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
    marginBottom: 4,
  },
  playlistCount: {
    fontSize: 14,
    color: '#9CA3AF',
  },
  deleteButton: {
    padding: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyIcon: {
    width: 96,
    height: 96,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#9CA3AF',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
  },
  emptyButton: {
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  emptyButtonGradient: {
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
  },
  emptyButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  modalContent: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 20,
    overflow: 'hidden',
  },
  modalGradient: {
    padding: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 20,
    textAlign: 'center',
  },
  modalInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: 'white',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalCancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
  },
  modalCancelText: {
    color: '#9CA3AF',
    fontSize: 16,
    fontWeight: '600',
  },
  modalCreateButton: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  modalCreateGradient: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  modalCreateText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
