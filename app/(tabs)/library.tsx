import ModernPlaylistScreen from '@/screens/ModernPlaylistScreen';
import React from 'react';
import { StyleSheet, View } from 'react-native';

export default function LibraryWrapper() {
  return (
    <View style={styles.container}>
      {(() => {
        const Comp = (ModernPlaylistScreen as any)?.default ?? ModernPlaylistScreen;
        return <Comp />;
      })()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
});
