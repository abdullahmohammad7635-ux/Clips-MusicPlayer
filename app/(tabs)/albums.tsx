import ModernAlbumsScreen from '@/screens/ModernAlbumsScreen';
import React from 'react';
import { StyleSheet, View } from 'react-native';

export default function AlbumsWrapper() {
  return (
    <View style={styles.container}>
      {(() => {
        const Comp = (ModernAlbumsScreen as any)?.default ?? ModernAlbumsScreen;
        return <Comp />;
      })()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
});
