// screens/ModernPlayerScreen.tsx
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAudioPlayer } from 'expo-audio';
import { LinearGradient } from 'expo-linear-gradient';
import * as MediaLibrary from 'expo-media-library';
import React, { useEffect, useRef, useState } from 'react';
import {
    Alert,
    Animated,
    Dimensions,
    GestureResponderEvent,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import Svg, { Circle, Defs, Stop, LinearGradient as SvgLinearGradient } from 'react-native-svg';
import { Share } from 'react-native';
import { useRouter } from 'expo-router';

const { width, height } = Dimensions.get('window');

interface PlayerScreenProps {
  route: {
    params: {
      song: MediaLibrary.Asset | null;
      queueIds?: string[];
      queueIndex?: number;
    };
  };
}

// Audio Visualization Component
const AudioVisualizer: React.FC<{ isPlaying: boolean }> = ({ isPlaying }) => {
  const [bars] = useState(() => 
    Array.from({ length: 20 }, (_, i) => new Animated.Value(0.3))
  );

  useEffect(() => {
    if (isPlaying) {
      const animations = bars.map((bar, index) => 
        Animated.loop(
          Animated.sequence([
            Animated.timing(bar, {
              toValue: Math.random() * 0.8 + 0.2,
              duration: 200 + Math.random() * 300,
              useNativeDriver: false,
            }),
            Animated.timing(bar, {
              toValue: 0.3,
              duration: 200 + Math.random() * 300,
              useNativeDriver: false,
            }),
          ])
        )
      );
      
      animations.forEach(anim => anim.start());
      
      return () => {
        animations.forEach(anim => anim.stop());
      };
    } else {
      bars.forEach(bar => bar.setValue(0.3));
    }
  }, [isPlaying, bars]);

  return (
    <View style={styles.visualizerContainer}>
      {bars.map((bar, index) => (
        <Animated.View
          key={index}
          style={[
            styles.visualizerBar,
            {
              height: bar.interpolate({
                inputRange: [0, 1],
                outputRange: [4, 40],
              }),
              backgroundColor: `hsl(${280 + index * 5}, 70%, 60%)`,
            },
          ]}
        />
      ))}
    </View>
  );
};

// Progress Circle Component
const ProgressCircle: React.FC<{ 
  progress: number; 
  size: number; 
  strokeWidth: number;
  onSeek: (progress: number) => void;
}> = ({ progress, size, strokeWidth, onSeek }) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDasharray = circumference;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <Svg width={size} height={size} style={styles.progressCircle}>
      <Defs>
        <SvgLinearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor="#8B5CF6" />
          <Stop offset="100%" stopColor="#A855F7" />
        </SvgLinearGradient>
      </Defs>
      
      {/* Background circle */}
      <Circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        stroke="rgba(255, 255, 255, 0.1)"
        strokeWidth={strokeWidth}
        fill="none"
      />
      
      {/* Progress circle */}
      <Circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        stroke="url(#progressGradient)"
        strokeWidth={strokeWidth}
        fill="none"
        strokeDasharray={strokeDasharray}
        strokeDashoffset={strokeDashoffset}
        strokeLinecap="round"
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
      />
    </Svg>
  );
};

export default function ModernPlayerScreen({ route }: PlayerScreenProps) {
  const router = useRouter();
  const initialSong = route.params.song;
  const initialQueueIds = route.params.queueIds;
  const initialQueueIndex = route.params.queueIndex ?? 0;
  const [currentSong, setCurrentSong] = useState<MediaLibrary.Asset | null>(initialSong ?? null);
  const [queueIds, setQueueIds] = useState<string[] | undefined>(initialQueueIds);
  const [currentIndex, setCurrentIndex] = useState<number>(initialQueueIndex);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isFavorite, setIsFavorite] = useState(false);
  const [seeking, setSeeking] = useState(false);
  const [shuffle, setShuffle] = useState(false);
  const [repeat, setRepeat] = useState<'off' | 'one' | 'all'>('off');
  const seekWidthRef = useRef(0);
  
  const player = useAudioPlayer(currentSong?.uri || '', {
    updateInterval: 100
  });

  useEffect(() => {
    if (!player.isLoaded) return;

    setIsPlaying(player.playing);
    setCurrentTime(player.currentTime || 0);
    setDuration(player.duration || 0);
    if (!seeking) {
      setProgress(((player.currentTime || 0) / (player.duration || 1)) * 100);
    }
  });

  useEffect(() => {
    // initialize favorite state for this song
    const checkFavorite = async () => {
    if (!currentSong) return;
      try {
        const raw = await AsyncStorage.getItem('favorites');
        const list = raw ? JSON.parse(raw) : [];
        setIsFavorite(!!list.find((it: any) => it.id === currentSong.id));
      } catch {
        setIsFavorite(false);
      }
    };
    checkFavorite();
  }, [currentSong?.id]);

  const playSound = async () => {
    if (!currentSong || !currentSong.uri) {
      Alert.alert('Error', 'No song selected or invalid song data');
      return;
    }

    try {
      setIsLoading(true);
      console.log('Attempting to play:', currentSong.uri);
      
      await player.play();
      console.log('Play command executed successfully');
    } catch (error: any) {
      console.error('Error playing sound:', error);
      Alert.alert('Error', `Failed to play the selected song: ${error?.message || 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const pauseSound = () => {
    player.pause();
  };

  const resumeSound = () => {
    player.play();
  };

  const stopSound = () => {
    player.pause();
    player.seekTo(0);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const onSeekGrant = (e: GestureResponderEvent) => {
    setSeeking(true);
    onSeekMove(e);
  };

  const onSeekMove = (e: GestureResponderEvent) => {
    const w = seekWidthRef.current || 1;
    const x = Math.max(0, Math.min(e.nativeEvent.locationX, w));
    const p = (x / w) * 100;
    setProgress(p);
    const newTime = (p / 100) * (duration || 0);
    setCurrentTime(newTime);
  };

  const onSeekRelease = async (e: GestureResponderEvent) => {
    const w = seekWidthRef.current || 1;
    const x = Math.max(0, Math.min(e.nativeEvent.locationX, w));
    const p = (x / w) * 100;
    const newTime = (p / 100) * (duration || 0);
    try {
      await player.seekTo(newTime);
    } finally {
      setSeeking(false);
    }
  };

  const toggleFavorite = async () => {
    if (!currentSong) return;
    try {
      const raw = await AsyncStorage.getItem('favorites');
      const list = raw ? JSON.parse(raw) : [];
      const exists = list.find((it: any) => it.id === currentSong.id);
      let updated;
      if (exists) {
        updated = list.filter((it: any) => it.id !== currentSong.id);
        setIsFavorite(false);
      } else {
        updated = [...list, currentSong];
        setIsFavorite(true);
      }
      await AsyncStorage.setItem('favorites', JSON.stringify(updated));
    } catch (e) {
      console.error('Favorite toggle failed', e);
    }
  };

  if (!currentSong) {
    return (
      <LinearGradient colors={['#0F0F23', '#1A1A2E', '#16213E']} style={styles.container}>
        <View style={styles.centerContainer}>
          <Text style={styles.errorText}>No song selected</Text>
        </View>
      </LinearGradient>
    );
  }

  if (!currentSong.uri) {
    return (
      <LinearGradient colors={['#0F0F23', '#1A1A2E', '#16213E']} style={styles.container}>
        <View style={styles.centerContainer}>
          <Text style={styles.errorText}>Invalid song data - missing URI</Text>
        </View>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={['#0F0F23', '#1A1A2E', '#16213E']} style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerButton} onPress={() => router.back()}>
          <Ionicons name="chevron-down" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Now Playing</Text>
        <TouchableOpacity 
          style={styles.headerButton}
          onPress={async () => {
            try {
              await Share.share({ message: `${currentSong.filename}\n\n${currentSong.uri}` });
            } catch (e) {
              console.error('Share failed', e);
            }
          }}
        >
          <Ionicons name="ellipsis-horizontal" size={24} color="white" />
        </TouchableOpacity>
      </View>

      {/* Album Art with Visualizer */}
      <View style={styles.albumContainer}>
        <View style={styles.albumArtContainer}>
          <LinearGradient
            colors={['#8B5CF6', '#A855F7', '#C084FC']}
            style={styles.albumArtGradient}
          >
            <Ionicons name="musical-notes" size={80} color="white" />
          </LinearGradient>
          
          {/* Progress Circle */}
          <View style={styles.progressContainer}>
            <ProgressCircle 
              progress={progress} 
              size={280} 
              strokeWidth={4}
              onSeek={(newProgress) => {
                const newTime = (newProgress / 100) * duration;
                player.seekTo(newTime);
              }}
            />
          </View>
        </View>
        
        {/* Audio Visualizer */}
        <View style={styles.visualizerWrapper}>
          <AudioVisualizer isPlaying={isPlaying} />
        </View>
      </View>

      {/* Song Info */}
      <View style={styles.songInfo}>
        <Text style={styles.songTitle} numberOfLines={1}>
          {currentSong.filename}
        </Text>
        <Text style={styles.songArtist} numberOfLines={1}>
          Unknown Artist
        </Text>
      </View>

      {/* Controls */}
      <View style={styles.controls}>
        {/* Seek Bar */}
        <View 
          style={styles.seekBarContainer}
          onStartShouldSetResponder={() => true}
          onResponderGrant={onSeekGrant}
          onResponderMove={onSeekMove}
          onResponderRelease={onSeekRelease}
          onLayout={(e) => { seekWidthRef.current = e.nativeEvent.layout.width; }}
        >
          <View style={styles.seekBarTrack} />
          <View style={[styles.seekBarFill, { width: `${progress}%` }]} />
          <View style={[
            styles.seekBarThumb,
            { transform: [{ translateX: Math.max(0, ((progress / 100) * (seekWidthRef.current || 0)) - 8) }] }
          ]} />
        </View>

        {/* Time Display */}
        <View style={styles.timeContainer}>
          <Text style={styles.timeText}>{formatTime(currentTime)}</Text>
          <Text style={styles.timeText}>{formatTime(duration)}</Text>
        </View>

        {/* Main Controls */}
        <View style={styles.mainControls}>
          <TouchableOpacity style={styles.controlButton} onPress={() => setShuffle((s) => !s)}>
            <Ionicons name="shuffle" size={24} color={shuffle ? '#8B5CF6' : '#9CA3AF'} />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.controlButton} onPress={async () => {
            if (queueIds && queueIds.length > 0) {
              const nextIdx = Math.max(0, currentIndex - 1);
              try {
                const asset = await MediaLibrary.getAssetInfoAsync(queueIds[nextIdx] as any);
                setCurrentIndex(nextIdx);
                setCurrentSong(asset as any);
              } catch (e) { console.error('Prev track failed', e); }
            } else {
              player.seekTo(Math.max(0, currentTime - 10));
            }
          }}>
            <Ionicons name="play-skip-back" size={28} color="white" />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.playButton}
            onPress={async () => {
              try {
                setIsLoading(true);
                if (isPlaying) {
                  await player.pause();
                } else {
                  await player.play();
                }
              } catch (e) {
                console.error('Toggle play failed', e);
              } finally {
                setIsLoading(false);
              }
            }}
            disabled={isLoading}
          >
            <LinearGradient
              colors={['#8B5CF6', '#A855F7']}
              style={styles.playButtonGradient}
            >
              <Ionicons 
                name={isPlaying ? "pause" : "play"} 
                size={32} 
                color="white" 
                style={isPlaying ? {} : { marginLeft: 4 }}
              />
            </LinearGradient>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.controlButton} onPress={async () => {
            if (queueIds && queueIds.length > 0) {
              const nextIdx = Math.min(queueIds.length - 1, currentIndex + 1);
              try {
                const asset = await MediaLibrary.getAssetInfoAsync(queueIds[nextIdx] as any);
                setCurrentIndex(nextIdx);
                setCurrentSong(asset as any);
              } catch (e) { console.error('Next track failed', e); }
            } else {
              player.seekTo(Math.min(duration, currentTime + 10));
            }
          }}>
            <Ionicons name="play-skip-forward" size={28} color="white" />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.controlButton} onPress={() => setRepeat((r) => (r === 'off' ? 'all' : r === 'all' ? 'one' : 'off'))}>
            <Ionicons name={repeat === 'one' ? 'repeat' : 'repeat'} size={24} color={repeat !== 'off' ? '#8B5CF6' : '#9CA3AF'} />
          </TouchableOpacity>
        </View>

        {/* Additional Controls */}
        <View style={styles.additionalControls}>
          <TouchableOpacity style={styles.additionalButton} onPress={toggleFavorite}>
            <Ionicons name={isFavorite ? 'heart' : 'heart-outline'} size={24} color={isFavorite ? '#EF4444' : '#9CA3AF'} />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.additionalButton} onPress={async () => {
            try {
              await Share.share({ message: `${currentSong.filename}\n\n${currentSong.uri}` });
            } catch (e) {
              console.error('Share failed', e);
            }
          }}>
            <Ionicons name="share-outline" size={24} color="#9CA3AF" />
          </TouchableOpacity>
        </View>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  headerButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 16,
    color: '#9CA3AF',
    fontWeight: '500',
  },
  albumContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  albumArtContainer: {
    position: 'relative',
    marginBottom: 40,
  },
  albumArtGradient: {
    width: 280,
    height: 280,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 16,
  },
  progressContainer: {
    position: 'absolute',
    top: -2,
    left: -2,
  },
  progressCircle: {
    position: 'absolute',
  },
  visualizerWrapper: {
    position: 'absolute',
    bottom: -60,
    left: 0,
    right: 0,
  },
  visualizerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'flex-end',
    height: 40,
    gap: 3,
  },
  visualizerBar: {
    width: 3,
    borderRadius: 2,
    backgroundColor: '#8B5CF6',
  },
  songInfo: {
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 40,
  },
  songTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 8,
    textAlign: 'center',
  },
  songArtist: {
    fontSize: 16,
    color: '#9CA3AF',
    textAlign: 'center',
  },
  controls: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  timeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
    marginBottom: 24,
  },
  timeText: {
    fontSize: 14,
    color: '#9CA3AF',
  },
  mainControls: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 30,
    gap: 20,
  },
  controlButton: {
    padding: 12,
  },
  playButton: {
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  playButtonGradient: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  additionalControls: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 40,
  },
  seekBarContainer: {
    height: 24,
    justifyContent: 'center',
    marginHorizontal: 4,
    marginTop: 8,
  },
  seekBarTrack: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
  seekBarFill: {
    position: 'absolute',
    left: 0,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#8B5CF6',
  },
  seekBarThumb: {
    position: 'absolute',
    top: 6,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  additionalButton: {
    padding: 8,
  },
  errorText: {
    fontSize: 18,
    color: '#9CA3AF',
    textAlign: 'center',
  },
});
