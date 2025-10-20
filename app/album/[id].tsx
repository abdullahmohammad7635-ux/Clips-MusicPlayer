import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import * as MediaLibrary from 'expo-media-library';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { ActionSheetIOS, Alert, FlatList, Platform, Share, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function AlbumDetailScreen() {
  const { id, title } = useLocalSearchParams<{ id: string; title?: string }>();
  const router = useRouter();
  const [songs, setSongs] = useState<MediaLibrary.Asset[]>([]);

  const load = useCallback(async () => {
    try {
      const pageSize = 300;
      let after: string | undefined = undefined;
      let all: MediaLibrary.Asset[] = [];
      while (true) {
        const resp = await MediaLibrary.getAssetsAsync({
          album: id as any,
          mediaType: 'audio' as any,
          first: pageSize,
          after,
        } as any);
        all = all.concat(resp.assets);
        if (!(resp as any).hasNextPage || !(resp as any).endCursor) break;
        after = (resp as any).endCursor;
      }
      setSongs(all);
    } catch (e) {
      console.error('Load album failed', e);
      setSongs([]);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const addToPlaylist = async (song: MediaLibrary.Asset) => {
    try {
      const raw = await AsyncStorage.getItem('playlists');
      const lists = raw ? JSON.parse(raw) : [];
      if (lists.length === 0) {
        const def = { id: Date.now().toString(), name: 'My Playlist', songs: [song], createdAt: new Date() };
        await AsyncStorage.setItem('playlists', JSON.stringify([def]));
      } else {
        lists[0].songs = lists[0].songs || [];
        if (!lists[0].songs.find((s: any) => s.id === song.id)) lists[0].songs.push(song);
        await AsyncStorage.setItem('playlists', JSON.stringify(lists));
      }
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch {}
  };

  const longPressSong = async (song: MediaLibrary.Asset) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const play = () => router.push({ pathname: '/player', params: { song } } as any);
    const add = () => addToPlaylist(song);
    const share = async () => { try { await Share.share({ message: `${song.filename}\n\n${song.uri}` }); } catch {} };
    const options = ['Play', 'Add to Playlist', 'Share', 'Cancel'];
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        { options, cancelButtonIndex: 3, userInterfaceStyle: 'dark' },
        (i) => { if (i === 0) play(); if (i === 1) add(); if (i === 2) share(); }
      );
    } else {
      Alert.alert(song.filename, undefined, [
        { text: 'Play', onPress: play },
        { text: 'Add to Playlist', onPress: add },
        { text: 'Share', onPress: share },
        { text: 'Cancel', style: 'cancel' },
      ]);
    }
  };

  return (
    <LinearGradient colors={['#0F0F23', '#1A1A2E', '#16213E']} style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerButton} onPress={() => router.back()}>
          <Text style={styles.headerButtonText}>Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>{title || 'Album'}</Text>
        <View style={styles.headerButton} />
      </View>

      <FlatList
        data={songs}
        keyExtractor={(i) => i.id}
        contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.songRow}
            onPress={() => router.push({ pathname: '/player', params: { song: item } } as any)}
            onLongPress={() => longPressSong(item)}
            delayLongPress={250}
          >
            <View style={{ flex: 1 }}>
              <Text style={styles.songTitle} numberOfLines={1}>{item.filename}</Text>
              <Text style={styles.songSub} numberOfLines={1}>Unknown Artist</Text>
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={<Text style={styles.empty}>No songs in this album.</Text>}
        showsVerticalScrollIndicator={false}
      />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 60, paddingHorizontal: 16, paddingBottom: 16 },
  headerButton: { padding: 8, minWidth: 60 },
  headerButtonText: { color: 'white', fontSize: 16 },
  headerTitle: { color: 'white', fontSize: 18, fontWeight: '600', flex: 1, textAlign: 'center' },
  songRow: { backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  songTitle: { color: 'white', fontSize: 16, fontWeight: '600' },
  songSub: { color: '#9CA3AF', marginTop: 2, fontSize: 12 },
  empty: { textAlign: 'center', color: '#9CA3AF', marginTop: 40 },
});
