import ModernPlayerScreen from '@/screens/ModernPlayerScreen';
import { useLocalSearchParams } from 'expo-router';
import React from 'react';
import { StyleSheet, View } from 'react-native';

export default function PlayerWrapper() {
  // expo-router passes params via search params; we also support route params from navigation shim
  const params = useLocalSearchParams();
  
  // Handle both old format (song object) and new format (individual params)
  let song = (params as any).song as any;
  
  if (!song && (params as any).songUri) {
    // Convert individual params to song object
    song = {
      uri: (params as any).songUri,
      filename: (params as any).songTitle || 'Unknown Song',
      id: (params as any).songId || 'unknown',
      duration: parseFloat((params as any).songDuration as any) || 0,
      mediaType: (params as any).songMediaType || 'audio'
    };
  }

  // Optional playlist queue context
  let queueIds: string[] | undefined;
  let queueIndex: number | undefined;
  const rawQueue = (params as any).queueIds as any;
  if (rawQueue) {
    try {
      queueIds = JSON.parse(rawQueue);
    } catch {}
  }
  if ((params as any).queueIndex != null) {
    const n = parseInt((params as any).queueIndex as any, 10);
    if (!Number.isNaN(n)) queueIndex = n;
  }

  return (
    <View style={styles.container}>
      {(() => {
        const Comp = (ModernPlayerScreen as any)?.default ?? ModernPlayerScreen;
        return <Comp route={{ params: { song, queueIds, queueIndex } } as any} />;
      })()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
});
