// screens/ModernAlbumsScreen.tsx
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as MediaLibrary from 'expo-media-library';
import React, { useEffect, useState } from 'react';
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';

export default function ModernAlbumsScreen() {
  const [albums, setAlbums] = useState<MediaLibrary.Album[]>([]);
  const router = useRouter();

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    try {
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== 'granted') return;
      const list = await MediaLibrary.getAlbumsAsync({ mediaType: 'audio' as any } as any);
      // Some platforms don't return assetCount for audio; compute counts per album id via additional calls would be heavy.
      // We'll display without counts, or fall back to 0.
      setAlbums(list as any);
    } catch (e) {
      console.error('Load albums failed', e);
      setAlbums([]);
    }
  };

  return (
    <LinearGradient colors={['#0F0F23', '#1A1A2E', '#16213E']} style={styles.container}>
      <View style={styles.header}>
        <LinearGradient colors={['#8B5CF6', '#A855F7']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.titleGradient}>
          <Text style={styles.title}>Albums</Text>
        </LinearGradient>
      </View>
      <FlatList
        data={albums}
        keyExtractor={(a) => `${a.id}`}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.albumRow}
            onPress={() => router.push({ pathname: '/album/[id]', params: { id: item.id, title: item.title } } as any)}
          >
            <LinearGradient colors={['#8B5CF6', '#A855F7']} style={styles.albumIcon}>
              <Ionicons name="albums" size={22} color="white" />
            </LinearGradient>
            <View style={{ flex: 1 }}>
              <Text style={styles.albumTitle} numberOfLines={1}>{item.title || 'Unknown Album'}</Text>
              <Text style={styles.albumSub} numberOfLines={1}>{item.assetCount ?? ''}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
          </TouchableOpacity>
        )}
        ListEmptyComponent={<Text style={styles.empty}>No albums found.</Text>}
        showsVerticalScrollIndicator={false}
      />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingTop: 60, paddingHorizontal: 16, paddingBottom: 16 },
  titleGradient: { paddingVertical: 8, paddingHorizontal: 16, borderRadius: 12, alignSelf: 'flex-start' },
  title: { fontSize: 28, fontWeight: 'bold', color: 'white' },
  list: { paddingHorizontal: 16, paddingBottom: 100 },
  albumRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  albumIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  albumTitle: { color: 'white', fontSize: 16, fontWeight: '600' },
  albumSub: { color: '#9CA3AF', fontSize: 12, marginTop: 2 },
  empty: { textAlign: 'center', color: '#9CA3AF', marginTop: 40 },
});
