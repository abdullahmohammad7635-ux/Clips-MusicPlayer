// screens/LibraryScreen.tsx
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useEffect, useState } from 'react';
import { Button, FlatList, Text, TextInput, TouchableOpacity, View } from 'react-native';

interface Playlist {
  name: string;
  songs: any[];
}

export default function LibraryScreen() {
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [playlistName, setPlaylistName] = useState('');

  useEffect(() => {
    loadPlaylists();
  }, []);

  async function loadPlaylists() {
    const data = await AsyncStorage.getItem('playlists');
    if (data) setPlaylists(JSON.parse(data));
  }

  async function createPlaylist() {
    const newList = [...playlists, { name: playlistName, songs: [] }];
    await AsyncStorage.setItem('playlists', JSON.stringify(newList));
    setPlaylistName('');
    setPlaylists(newList);
  }

  return (
    <View style={{ flex: 1, padding: 16 }}>
      <Text style={{ fontSize: 24, marginBottom: 20, textAlign: 'center' }}>
        Your Playlists
      </Text>
      
      <View style={{ marginBottom: 20 }}>
        <TextInput
          placeholder="New Playlist Name"
          value={playlistName}
          onChangeText={setPlaylistName}
          style={{ 
            borderWidth: 1, 
            borderColor: '#ccc',
            marginBottom: 10, 
            padding: 12,
            borderRadius: 8,
            fontSize: 16
          }}
        />
        <Button 
          title="Create Playlist" 
          onPress={createPlaylist}
          disabled={!playlistName.trim()}
        />
      </View>
      
      {playlists.length === 0 ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text style={{ fontSize: 16, opacity: 0.6, textAlign: 'center' }}>
            No playlists yet. Create your first playlist above!
          </Text>
        </View>
      ) : (
        <FlatList
          data={playlists}
          keyExtractor={(item) => item.name}
          renderItem={({ item }) => (
            <TouchableOpacity style={{
              padding: 16,
              borderBottomWidth: 1,
              borderBottomColor: '#e0e0e0'
            }}>
              <Text style={{ fontSize: 16 }}>{item.name}</Text>
              <Text style={{ fontSize: 12, opacity: 0.6, marginTop: 4 }}>
                {item.songs.length} songs
              </Text>
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
}
