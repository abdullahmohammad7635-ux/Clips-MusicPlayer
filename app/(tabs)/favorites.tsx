import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { ActionSheetIOS, Alert, FlatList, Platform, Share, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function FavoritesWrapper() {
  const [favorites, setFavorites] = useState<any[]>([]);
  const router = useRouter();

  useEffect(() => {
    loadFavorites();
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadFavorites();
    }, [])
  );

  async function loadFavorites() {
    const raw = await AsyncStorage.getItem('favorites');
    if (!raw) return setFavorites([]);
    try {
      setFavorites(JSON.parse(raw));
    } catch {
      setFavorites([]);
    }
  }

  async function removeFromFavorites(id: string) {
    try {
      const updated = favorites.filter((f) => f.id !== id);
      await AsyncStorage.setItem('favorites', JSON.stringify(updated));
      setFavorites(updated);
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (e) {
      console.error('Failed to remove favorite', e);
    }
  }

  const longPressFavorite = async (item: any) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const actions = ['Play', 'Share', 'Remove', 'Cancel'];
    const play = () => router.push({ pathname: '/player', params: { song: item } } as any);
    const share = async () => { try { await Share.share({ message: `${item.filename}\n\n${item.uri}` }); } catch {} };
    const remove = () => removeFromFavorites(item.id);
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
  };

  return (
    <LinearGradient colors={['#0F0F23', '#1A1A2E', '#16213E']} style={styles.container}>
      <View style={styles.header}>
        <LinearGradient colors={['#8B5CF6', '#A855F7']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.titleGradient}>
          <Text style={styles.title}>Favorites</Text>
        </LinearGradient>
      </View>
      <FlatList
        data={favorites}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.itemRow}
            onPress={() => router.push({ pathname: '/player', params: { song: item } } as any)}
            onLongPress={() => longPressFavorite(item)}
            delayLongPress={250}
          >
            <View style={styles.itemLeft}>
              <LinearGradient colors={['#8B5CF6', '#A855F7']} style={styles.itemIcon}>
                <Ionicons name="heart" size={18} color="white" />
              </LinearGradient>
              <View style={{ flex: 1 }}>
                <Text style={styles.itemText} numberOfLines={1}>{item.filename}</Text>
                <Text style={styles.itemSub} numberOfLines={1}>Unknown Artist</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
          </TouchableOpacity>
        )}
        ListEmptyComponent={<Text style={styles.empty}>No favorites yet.</Text>}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 100 }}
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
  itemRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  itemLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  itemIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  itemText: { fontSize: 16, color: 'white', fontWeight: '600' },
  itemSub: { fontSize: 12, color: '#9CA3AF', marginTop: 2 },
  empty: { textAlign: 'center', marginTop: 50, color: '#9CA3AF' },
});
