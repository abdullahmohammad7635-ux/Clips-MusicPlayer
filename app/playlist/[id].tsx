import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import * as MediaLibrary from 'expo-media-library';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { ActionSheetIOS, Alert, Modal, Platform, SectionList, Share, StyleSheet, Text, TouchableOpacity, View, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function PlaylistDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [playlist, setPlaylist] = useState<any | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [sections, setSections] = useState<Array<{ id: string; title: string; coverUri?: string; data: MediaLibrary.Asset[] }>>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const load = useCallback(async () => {
    try {
      const raw = await AsyncStorage.getItem('playlists');
      const lists = raw ? JSON.parse(raw) : [];
      const found = lists.find((p: any) => p.id === id);
      setPlaylist(found || null);
    } catch {
      setPlaylist(null);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const removeSong = async (songId: string) => {
    try {
      const raw = await AsyncStorage.getItem('playlists');
      const lists = raw ? JSON.parse(raw) : [];
      const idx = lists.findIndex((p: any) => p.id === id);
      if (idx >= 0) {
        lists[idx].songs = (lists[idx].songs || []).filter((s: any) => s.id !== songId);
        await AsyncStorage.setItem('playlists', JSON.stringify(lists));
        setPlaylist(lists[idx]);
      }
    } catch {}
  };

  if (!playlist) {
    return (
      <LinearGradient colors={['#0F0F23', '#1A1A2E', '#16213E']} style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.headerButton} onPress={() => router.back()}>
            <Text style={styles.headerButtonText}>Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Playlist</Text>
          <View style={styles.headerButton} />
        </View>
        <View style={styles.center}>
          <Text style={styles.empty}>Playlist not found.</Text>
        </View>
      </LinearGradient>
    );
  }

  const openPicker = async () => {
    try {
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== 'granted') return;
      const albums = await MediaLibrary.getAlbumsAsync({ mediaType: 'audio' as any } as any);
      const built: Array<{ id: string; title: string; coverUri?: string; data: MediaLibrary.Asset[] }> = [];
      for (const alb of albums) {
        // fetch songs in album
        const pageSize = 300;
        let after: string | undefined = undefined;
        let all: MediaLibrary.Asset[] = [];
        while (true) {
          const resp = await MediaLibrary.getAssetsAsync({ album: alb.id as any, mediaType: 'audio' as any, first: pageSize, after } as any);
          all = all.concat(resp.assets);
          if (!(resp as any).hasNextPage || !(resp as any).endCursor) break;
          after = (resp as any).endCursor;
        }
        if (all.length === 0) continue;
        const coverUri = Platform.OS === 'android' ? `content://media/external/audio/albumart/${alb.id}` : undefined;
        built.push({ id: String(alb.id), title: alb.title || 'Unknown Album', coverUri, data: all });
      }
      setSections(built);
      setSelectedIds(new Set());
      setPickerOpen(true);
    } catch (e) { console.error('Open picker failed', e); }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const addSelectedToPlaylist = async () => {
    try {
      const raw = await AsyncStorage.getItem('playlists');
      const lists = raw ? JSON.parse(raw) : [];
      const idx = lists.findIndex((p: any) => p.id === id);
      if (idx >= 0) {
        const add: MediaLibrary.Asset[] = [];
        for (const sec of sections) {
          for (const s of sec.data) if (selectedIds.has(s.id)) add.push(s);
        }
        const existing: any[] = lists[idx].songs || [];
        const merged = [...existing];
        for (const s of add) {
          if (!merged.find((m: any) => m.id === s.id)) merged.push(s);
        }
        lists[idx].songs = merged;
        await AsyncStorage.setItem('playlists', JSON.stringify(lists));
        setPlaylist(lists[idx]);
      }
      setPickerOpen(false);
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch (e) { console.error('Add selected failed', e); }
  };

  return (
    <LinearGradient colors={['#0F0F23', '#1A1A2E', '#16213E']} style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerButton} onPress={() => router.back()}>
          <Text style={styles.headerButtonText}>Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{playlist.name}</Text>
        <TouchableOpacity style={styles.headerButton} onPress={openPicker}>
          <Text style={styles.headerAddText}>Add Songs</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={playlist.songs || []}
        keyExtractor={(item: any) => item.id}
        contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
        renderItem={({ item }: any) => (
          <View style={styles.songRow}>
            <TouchableOpacity 
              style={styles.songMain}
              onPress={() => router.push({ pathname: '/player', params: { songUri: item.uri, songTitle: item.filename, songId: item.id, songDuration: (item as any).duration?.toString?.() || '0', songMediaType: (item as any).mediaType, queueIds: JSON.stringify((playlist.songs || []).map((s: any) => s.id)), queueIndex: (playlist.songs || []).findIndex((s: any) => s.id === item.id) } } as any)}
              onLongPress={async () => {
                await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                const actions = ['Play', 'Share', 'Remove', 'Cancel'];
                const play = () => router.push({ pathname: '/player', params: { song: item } } as any);
                const share = async () => { try { await Share.share({ message: `${item.filename}\n\n${item.uri}` }); } catch {} };
                const remove = () => removeSong(item.id);
                if (Platform.OS === 'ios') {
                  ActionSheetIOS.showActionSheetWithOptions(
                    { options: actions, cancelButtonIndex: 3, destructiveButtonIndex: 2, userInterfaceStyle: 'dark' },
                    (idx) => { if (idx === 0) play(); if (idx === 1) share(); if (idx === 2) remove(); }
                  );
                } else {
                  Alert.alert(item.filename, undefined, [
                    { text: 'Play', onPress: play },
                    { text: 'Share', onPress: share },
                    { text: 'Remove', style: 'destructive', onPress: remove },
                    { text: 'Cancel', style: 'cancel' },
                  ]);
                }
              }}
              delayLongPress={250}
            >
              <Text style={styles.songTitle} numberOfLines={1}>{item.filename}</Text>
              <Text style={styles.songSub} numberOfLines={1}>Unknown Artist</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.removeBtn} onPress={() => removeSong(item.id)}>
              <Text style={styles.removeText}>Remove</Text>
            </TouchableOpacity>
          </View>
        )}
        ListEmptyComponent={<Text style={styles.empty}>No songs in this playlist.</Text>}
      />

      {/* Add Songs Modal */}
      <Modal visible={pickerOpen} transparent animationType="fade" onRequestClose={() => setPickerOpen(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <LinearGradient colors={['#1A1A2E', '#16213E']} style={styles.modalGradient}>
              <Text style={styles.modalTitle}>Add songs to {playlist.name}</Text>
              <SectionList
                sections={sections}
                keyExtractor={(item) => item.id}
                style={{ maxHeight: 480 }}
                renderSectionHeader={({ section }) => (
                  <View style={styles.sectionHeader}>
                    {section.coverUri ? (
                      <Image source={{ uri: section.coverUri }} style={styles.albumThumb} contentFit="cover" />
                    ) : (
                      <View style={[styles.albumThumb, { backgroundColor: 'rgba(255,255,255,0.08)', alignItems: 'center', justifyContent: 'center' }]}>
                        <Ionicons name="musical-notes" size={16} color="#9CA3AF" />
                      </View>
                    )}
                    <Text style={styles.sectionTitle} numberOfLines={1}>{section.title}</Text>
                  </View>
                )}
                renderItem={({ item }) => (
                  <TouchableOpacity style={styles.pickRow} onPress={() => toggleSelect(item.id)}>
                    <View style={[styles.checkbox, selectedIds.has(item.id) && styles.checkboxOn]} />
                    <Text style={styles.pickTitle} numberOfLines={1}>{item.filename || 'Unknown'}</Text>
                  </TouchableOpacity>
                )}
              />
              <View style={styles.modalButtons}>
                <TouchableOpacity style={styles.modalCancelButton} onPress={() => setPickerOpen(false)}>
                  <Text style={styles.modalCancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.modalCreateButton} onPress={addSelectedToPlaylist}>
                  <LinearGradient colors={['#8B5CF6', '#A855F7']} style={styles.modalCreateGradient}>
                    <Text style={styles.modalCreateText}>Add Selected</Text>
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
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  headerButton: { padding: 8, minWidth: 60 },
  headerButtonText: { color: 'white', fontSize: 16 },
  headerTitle: { color: 'white', fontSize: 18, fontWeight: '600' },
  headerAddText: { color: '#8B5CF6', fontWeight: '700' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  empty: { color: '#9CA3AF', textAlign: 'center', marginTop: 40 },
  songRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)'
  },
  songMain: { flex: 1 },
  songTitle: { color: 'white', fontSize: 16, fontWeight: '600' },
  songSub: { color: '#9CA3AF', marginTop: 2 },
  removeBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, backgroundColor: 'rgba(239,68,68,0.15)' },
  removeText: { color: '#EF4444', fontWeight: '600' },
  // modal styles
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', alignItems: 'center', paddingHorizontal: 20 },
  modalContent: { width: '100%', maxWidth: 420, borderRadius: 20, overflow: 'hidden' },
  modalGradient: { padding: 16 },
  modalTitle: { color: 'white', fontSize: 18, fontWeight: '700', textAlign: 'center', marginBottom: 10 },
  pickRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10 },
  checkbox: { width: 18, height: 18, borderRadius: 4, borderWidth: 1, borderColor: 'rgba(255,255,255,0.4)' },
  checkboxOn: { backgroundColor: '#8B5CF6', borderColor: '#8B5CF6' },
  pickTitle: { color: 'white', flex: 1 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingTop: 10 },
  albumThumb: { width: 28, height: 28, borderRadius: 6 },
  sectionTitle: { color: 'white', fontWeight: '700', flex: 1 },
  modalButtons: { flexDirection: 'row', gap: 12, marginTop: 12 },
  modalCancelButton: { flex: 1, paddingVertical: 12, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)', alignItems: 'center' },
  modalCancelText: { color: '#9CA3AF', fontSize: 16, fontWeight: '600' },
  modalCreateButton: { flex: 1, borderRadius: 12, overflow: 'hidden' },
  modalCreateGradient: { paddingVertical: 12, alignItems: 'center' },
  modalCreateText: { color: 'white', fontSize: 16, fontWeight: 'bold' },
});
