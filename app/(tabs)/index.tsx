import ModernHomeScreen from '@/screens/ModernHomeScreen';
import { useRouter } from 'expo-router';
import React from 'react';
import { StyleSheet, View } from 'react-native';

export default function IndexWrapper() {
  const router = useRouter();

  // Minimal navigation shim for existing screens expecting `navigation.navigate(name, params)`
  const navigation = {
    navigate: (name: string, params?: any) => {
      // Map Player -> /player and Library -> /library
      if (name === 'Player' || name === 'Play') {
        // Extract song properties for proper serialization
        const song = params?.song;
        if (song) {
          (router as any).push({
            pathname: '/player',
            params: {
              songUri: song.uri,
              songTitle: song.filename,
              songId: song.id,
              songDuration: song.duration?.toString() || '0',
              songMediaType: song.mediaType
            }
          });
        } else {
          (router as any).push('/player');
        }
      } else if (name === 'Library') {
        (router as any).push('/library');
      } else {
        (router as any).push(`/${name.toLowerCase()}`);
      }
    },
  } as any;

  return (
    <View style={styles.container}>
      {/* Support both `module.default` and direct component export */}
      {(() => {
        const Comp = (ModernHomeScreen as any)?.default ?? ModernHomeScreen;
        return <Comp navigation={navigation} />;
      })()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
});
