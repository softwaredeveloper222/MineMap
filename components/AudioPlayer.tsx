import React, { useEffect, useRef, useState } from 'react';
import { View, TouchableOpacity, Text, StyleSheet, Pressable } from 'react-native';
import { Audio } from 'expo-av';
import { ActivityIndicator } from 'react-native-paper';

interface AudioPlayerProps {
  source: string; // URI or file url
  style?: any;
}

export default function AudioPlayer({ source, style }: AudioPlayerProps) {
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);
  const soundRef = useRef<Audio.Sound | null>(null);
  const progressInterval = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    load();
    return cleanup;
    // eslint-disable-next-line
  }, [source]);

  const load = async () => {
    cleanup();
    try {
      const { sound, status } = await Audio.Sound.createAsync(
        { uri: source },
        { shouldPlay: false },
        status => {
          if (status.isLoaded) {
            setDuration(status.durationMillis || 0);
            setProgress(status.positionMillis || 0);
            setIsLoaded(true);
            setPlaying(!!status.isPlaying);
          }
          if (status.didJustFinish) {
            setPlaying(false);
            setProgress(duration);
          }
        }
      );
      soundRef.current = sound;
      // Set initial
      if (status.isLoaded) {
        setDuration(status.durationMillis || 0);
        setProgress(status.positionMillis || 0);
        setIsLoaded(true);
      }
    } catch(er) {
      setIsLoaded(false);
      setProgress(0);
      setDuration(0);
    }
  }

  const cleanup = () => {
    if (soundRef.current) {
      soundRef.current.unloadAsync();
      soundRef.current = null;
    }
    setProgress(0);
    setPlaying(false);
    setIsLoaded(false);
    setDuration(0);
    if (progressInterval.current) {
      clearInterval(progressInterval.current);
      progressInterval.current = null;
    }
  };

  const togglePlay = async () => {
    if (!soundRef.current) return;
    if (playing) {
      await soundRef.current.pauseAsync();
      setPlaying(false);
      if (progressInterval.current) clearInterval(progressInterval.current);
    } else {
      // If at end, reset to beginning before playing
      if (Math.abs(progress - duration) < 1000 && duration > 0) { // allow for ~1s margin
        await soundRef.current.setPositionAsync(0);
        setProgress(0);
      }
      await soundRef.current.playAsync();
      setPlaying(true);
      // Start ticking progress
      progressInterval.current = setInterval(async () => {
        if (!soundRef.current) return;
        const s = await soundRef.current.getStatusAsync();
        if (s.isLoaded) {
          setProgress(s.positionMillis || 0);
        }
      }, 250);
    }
  };

  // Updates progress bar manually by seeking
  const handleSeek = async (e: any) => {
    if (!soundRef.current || !isLoaded) return;
    const x = e.nativeEvent.locationX;
    const barWidth = 1 * 150; // px, match below
    const rel = Math.max(0, Math.min(x / barWidth, 1));
    const newTime = Math.floor(rel * duration);
    await soundRef.current.setPositionAsync(newTime);
    setProgress(newTime);
  };

  const format = (ms: number) => {
    if (!ms || ms < 0) return '0:00';
    const total = Math.floor(ms/1000);
    const min = Math.floor(total/60);
    const sec = total % 60;
    return `${min}:${sec.toString().padStart(2, '0')}`;
  };

  return (
    <View style={[styles.container, style]}>  
      <TouchableOpacity style={styles.playBtn} onPress={togglePlay} disabled={!isLoaded}>
        {isLoaded === true ? <Text style={styles.playIcon}>{playing ? '⏸️' : '▶️'}</Text> : <ActivityIndicator />}
      </TouchableOpacity>
      <Pressable style={styles.progressWrap} onPress={handleSeek} disabled={!isLoaded}>
        <View style={styles.progressBarBg}>
          <View style={[styles.progressBarFg, { width: duration > 0 ? `${Math.max(0, Math.min(100, (progress/duration)*100))}%` : '0%' }]} />
        </View>
      </Pressable>
      <Text style={styles.time}>{format(progress)} / {format(duration)}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flexDirection: 'row', alignItems: 'center', gap: 10, minWidth: 200 },
  playBtn: { padding: 8 },
  playIcon: { fontSize: 22 },
  progressWrap: {
    flex: 1,
    height: 18,
    justifyContent: 'center',
    marginHorizontal: 3,
  },
  progressBarBg: {
    width: '100%', height: 6,
    borderRadius: 4, backgroundColor: '#ddd',
    overflow: 'hidden',
  },
  progressBarFg: {
    backgroundColor: '#00C787',
    height: 6, borderRadius: 4,
  },
  time: { fontSize: 14, color: '#111', width: 74, fontVariant: ['tabular-nums'] },
});
