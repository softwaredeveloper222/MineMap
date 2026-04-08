import SendMessage from '@/assets/images/MessageSend.svg';
import Recording from '@/assets/images/Recording.svg';
import { RoundedView } from '@/components/RoundedView';
import { Header } from '@/components/ui/Header';
import { formatDate } from '@/constants/Functions';
import { getChatId, listenMessages, readMark, sendMessage } from "@/hooks/chatService";
import { Image } from 'expo-image';
import { useLocalSearchParams } from 'expo-router';
import { Timestamp } from "firebase/firestore";
import React, { memo, useCallback, useEffect, useRef, useState } from 'react';
import {
    FlatList,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
    AppState,
    Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { userData } from '../store/userStore';
import { ActivityIndicator } from 'react-native-paper';
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';
import { uploadAudio } from '@/hooks/functions';
import AudioPlayer from '@/components/AudioPlayer';

type Message = {
    id: string;
    text: string;
    senderId?: string;
    isMine?: boolean;
    createdAt?: Timestamp | null;
};

const groupMessagesByDate = (messages: Message[]) => {
    const grouped: { [key: string]: Message[] } = {};
    messages.forEach((message) => {
        if (!message.createdAt) return;
        const jsDate = message.createdAt.toDate();
        const dateKey = jsDate.toDateString();
        if (!grouped[dateKey]) grouped[dateKey] = [];
        grouped[dateKey].push(message);
    });
    return grouped;
};

// ✅ Memoized avatar (renders once)
const Avatar = memo(({ source }: { source: any }) => (
    <View style={styles.avatarContainer}>
        <Image source={source} style={styles.avatar} contentFit="cover" />
    </View>
));

// ✅ Memoized Message bubble
const MessageBubble = memo(({ message, showAvatar, avatarSrc }: any) => (
    <View style={{ width: '100%' }}>
        <View
            style={{
                flexDirection: 'row',
                justifyContent: !message.isMine ? 'flex-start' : 'flex-end',
                width: '100%',
                gap: 15,
            }}
        >
            {!message.isMine && showAvatar && <Avatar source={avatarSrc} />}
            <View
                style={{
                    width: '70%',
                    padding: 10,
                    backgroundColor: !message.isMine ? '#EEEEEE' : '#FFFFFF',
                    borderColor: '#E9E9E9',
                    borderWidth: message.isMine ? 1 : 0,
                    borderRadius: 20,
                    borderBottomLeftRadius: !message.isMine ? 0 : 20,
                    borderBottomRightRadius: message.isMine ? 0 : 20,
                }}
            >
                {message.type === 'voice' && message.audioUrl ? (
                    <AudioPlayer source={message.audioUrl} />
                ) : (
                    <Text>{message.text}</Text>
                )}
            </View>
        </View>
    </View>
));

// expo-av enums for reference (from SDK v16):
// MPEG_4 outputFormat = 2
// AAC audioEncoder = 3
// HIGH quality (iOS) = 2
const recordingOptions = {
    android: {
        extension: '.m4a',
        outputFormat: 2, // MPEG_4
        audioEncoder: 3, // AAC
        sampleRate: 44100,
        numberOfChannels: 2,
        bitRate: 128000,
    },
    ios: {
        extension: '.m4a',
        audioQuality: 2, // HIGH
        sampleRate: 44100,
        numberOfChannels: 2,
        bitRate: 128000,
        linearPCMBitDepth: 16,
        linearPCMIsBigEndian: false,
        linearPCMIsFloat: false,
    },
    web: {
        mimeType: 'audio/webm',
        bitsPerSecond: 128000,
    }
};

// Add SectionItem type for FlatList
type SectionItem = { type: 'date'; dateKey: string } | { type: 'msg'; message: Message };

export default function MessagesScreen() {
    const avataUrl = require('@/assets/images/Avata.jpg');
    const [inputedMessage, setInputedMessage] = useState('');
    const [messages, setMessages] = useState<Message[]>([]);
    const { to_user_id, hazard_id } = useLocalSearchParams<{ to_user_id: string, hazard_id: string }>();
    const currentUserId = userData.getState().userId;
    const userRole = userData.getState().userRole;
    const chatId = getChatId(currentUserId, to_user_id, hazard_id);
    const flatListRef = useRef<FlatList>(null);
    const [sendingMessage, setSendingMessage] = useState(false);
    const [isRecording, setIsRecording] = useState(false);
    const [recording, setRecording] = useState<Audio.Recording | null>(null);
    const [audioUri, setAudioUri] = useState<string | null>(null);
    const [isPreview, setIsPreview] = useState(false);
    const [sound, setSound] = useState<Audio.Sound | null>(null);
    const [playing, setPlaying] = useState(false);
    const [sendAudioLoading, setSendAudioLoading] = useState(false);
    const [isAppActive, setIsAppActive] = useState(true);

    useEffect(() => {
        const unsubscribe = listenMessages(chatId, (msgs) => {
            const processed = msgs.map((m: any) => ({
                ...m,
                isMine: m.senderId === currentUserId,
                audioUrl: m.type === 'voice' ? m.url || m.audio || m.audioUrl : undefined,
            }));
            setMessages(processed);
        });
        return unsubscribe;
    }, []);

    useEffect(() => {
        if (messages.length > 0) {
            flatListRef.current?.scrollToEnd({ animated: true });
        }
        readMark(chatId, currentUserId);
    }, [messages]);

    useEffect(() => {
        const sub = AppState.addEventListener('change', (nextState) => {
            setIsAppActive(nextState === 'active');
        });
        return () => sub.remove();
    }, []);

    const groupedMessages = groupMessagesByDate(messages);
    const sortedDates = Object.keys(groupedMessages).sort(
        (a, b) => new Date(a).getTime() - new Date(b).getTime()
    );

    const sections: SectionItem[] = sortedDates.flatMap((dateKey) => [
        { type: 'date', dateKey } as const,
        ...groupedMessages[dateKey].map((m) => ({ type: 'msg', message: m } as const)),
    ]);

    const handleSendMessage = async () => {
        if (inputedMessage.trim().length === 0) return;
        setSendingMessage(true);
        await sendMessage(chatId, currentUserId, to_user_id, hazard_id, 'text', '', inputedMessage);
        setInputedMessage('');
        setSendingMessage(false);
    };

    // Recording handlers
    const startRecording = async () => {
        try {
            setIsRecording(true);
            const { status } = await Audio.requestPermissionsAsync();
            if (status !== 'granted') {
                alert('Permission to access microphone is required!');
                setIsRecording(false);
                return;
            }
            await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
            const rec = new Audio.Recording();
            await rec.prepareToRecordAsync(recordingOptions);
            await rec.startAsync();
            setRecording(rec);
        } catch (err) {
            setIsRecording(false);
            alert('Failed to start recording: ' + err);
        }
    };

    const stopRecording = async () => {
        if (!recording) return;
        setIsRecording(false);
        try {
            await recording.stopAndUnloadAsync();
            const uri = recording.getURI();
            setAudioUri(uri || null);
            setIsPreview(true);
            setRecording(null);
        } catch (err) {
            alert('Failed to stop recording: ' + err);
        }
    };

    const resetRecordingState = () => {
        setIsRecording(false);
        setRecording(null);
        setAudioUri(null);
        setIsPreview(false);
        setSound(null);
        setPlaying(false);
    };

    // Playback logic
    const playAudio = async () => {
        if (!audioUri) return;
        if (!isAppActive) {
            alert('Cannot play audio while the app is in the background. Please bring the app to the foreground.');
            return;
        }
        try {
            await Audio.setAudioModeAsync({
                playsInSilentModeIOS: true,
                staysActiveInBackground: false,
                allowsRecordingIOS: false,
                shouldDuckAndroid: true,
            });
            if (sound) {
                await sound.replayAsync();
                setPlaying(true);
                return;
            }
            const { sound: newSound } = await Audio.Sound.createAsync({ uri: audioUri });
            setSound(newSound);
            setPlaying(true);
            newSound.setOnPlaybackStatusUpdate((status) => {
                if (!status.isLoaded) return;
                if (status.didJustFinish) setPlaying(false);
            });
            await newSound.playAsync();
        } catch (err) {
            console.log(err);
            if (typeof err?.message === 'string' && err.message.includes('AudioFocusNotAcquiredException')) {
                alert('Cannot play audio while the app is in the background. Please bring the app to the foreground.');
            } else {
                alert('Playback error: ' + err);
            }
        }
    };
    const pauseAudio = async () => {
        if (sound && playing) {
            await sound.pauseAsync();
            setPlaying(false);
        }
    };

    // UI: Recording button action
    const handleRecordingButton = async () => {
        if (isRecording) {
            await stopRecording();
        } else {
            await startRecording();
        }
    };

    // UI: Send audio (placeholder, actual upload logic in next steps)
    const handleSendAudio = async () => {
        if (!audioUri) return;
        setSendAudioLoading(true);
        setSendingMessage(true);
        const uploadedUrl = await uploadAudio(audioUri);
        if (!uploadedUrl) {
            setSendAudioLoading(false);
            setSendingMessage(false);
            Alert.alert('Error', 'Failed to upload audio');
            return;
        };
        await sendMessage(chatId, currentUserId, to_user_id, hazard_id, 'voice', uploadedUrl, '');
        resetRecordingState();
        setSendAudioLoading(false);
        setSendingMessage(false);
    };

    // ✅ Memoized renderItem
    const renderItem = useCallback(
        ({ item }: { item: SectionItem }) => {
            if (item.type === 'date') {
                return (
                    <View style={styles.dateHeader}>
                        <Text style={styles.dateText}>{formatDate(new Date(item.dateKey))}</Text>
                    </View>
                );
            }
            if (item.type === 'msg') {
                return (
                    <MessageBubble
                        message={item.message}
                        showAvatar={true}
                        avatarSrc={avataUrl}
                    />
                );
            }
            return null;
        },
        [avataUrl]
    );

    return (
        <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
            <Header title={userRole === 'community' ? 'Reporter' : 'Community User'} isCommunity={true} />
            <RoundedView isOverlay={false} style={styles.roundedView}>
                <View style={{ width: '100%', height: '100%', gap: 20 }}>
                    <FlatList<SectionItem>
                        ref={flatListRef}
                        data={sections}
                        keyExtractor={(item, index) =>
                            item.type === 'date' ? `date-${item.dateKey}-${index}` : `msg-${index}`
                        }
                        renderItem={renderItem}
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={{
                            flexGrow: 1,
                            justifyContent: 'flex-end',
                            paddingVertical: 20,
                            paddingBottom: 30,
                            gap: 15,
                        }}
                        // ✅ Performance props
                        initialNumToRender={15}
                        maxToRenderPerBatch={10}
                        windowSize={5}
                        removeClippedSubviews
                    />
                    {/* === Audio Preview Modal === */}
                    {isPreview && (
                        <View style={{ backgroundColor: '#fff', padding: 20, borderRadius: 20, margin: 10, alignItems: 'center' }}>
                            <Text style={{ marginBottom: 10 }}>Voice message preview</Text>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
                                <TouchableOpacity onPress={playing ? pauseAudio : playAudio} style={{ backgroundColor: '#eee', borderRadius: 30, padding: 16, marginRight: 12 }}>
                                    <Text style={{}}>{playing ? 'Pause' : 'Play'}</Text>
                                </TouchableOpacity>
                                <TouchableOpacity onPress={resetRecordingState} style={{ backgroundColor: '#eee', borderRadius: 30, padding: 16, marginRight: 12 }}>
                                    <Text>Discard</Text>
                                </TouchableOpacity>
                                <TouchableOpacity onPress={handleSendAudio} disabled={sendAudioLoading} style={{ backgroundColor: '#0a0', borderRadius: 30, padding: 16 }}>
                                    <Text style={{ color: '#fff' }}>{sendAudioLoading ? 'Sending...' : 'Send'}</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    )}
                    {/* === /Audio Preview Modal === */}
                    <View style={styles.buttonContainer}>
                        <View style={{ flexDirection: 'row', gap: 10 }}>
                            <View
                                style={{
                                    flexDirection: 'row',
                                    padding: 4,
                                    paddingHorizontal: 20,
                                    alignItems: 'center',
                                    justifyContent: 'flex-start',
                                    backgroundColor: '#EEEEEE',
                                    borderRadius: 50,
                                    flex: 1,
                                    maxHeight: 200,
                                }}
                            >
                                <TextInput
                                    style={{
                                        flex: 1,
                                        minHeight: 40,
                                        maxHeight: 120, // prevent growing too tall
                                        paddingVertical: 8,
                                    }}
                                    value={inputedMessage}
                                    onChangeText={setInputedMessage}
                                    placeholder="Send Message"
                                    multiline={true}
                                    textAlignVertical="top"
                                    editable={!isPreview} // Lock input when preview
                                />
                                <TouchableOpacity onPress={handleSendMessage} disabled={sendingMessage || isPreview}>
                                    {sendingMessage ? <ActivityIndicator /> : <SendMessage width={18} height={18} />}
                                </TouchableOpacity>
                            </View>
                            {/* Recording button */}
                            <TouchableOpacity
                                style={{
                                    width: 50,
                                    height: 50,
                                    borderRadius: 50,
                                    backgroundColor: isRecording ? '#ff3b30' : '#EEEEEE',
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                }}
                                activeOpacity={0.8}
                                onPress={handleRecordingButton}
                                disabled={isPreview}
                            >
                                <Recording />
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </RoundedView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: 'black' },
    roundedView: { flex: 1, gap: 10, marginTop: 20 },
    avatar: { width: '100%', height: '100%' },
    avatarContainer: {
        width: 50,
        height: 50,
        borderRadius: 30,
        backgroundColor: '#ccc',
        overflow: 'hidden',
        justifyContent: 'center',
        alignItems: 'center',
    },
    buttonContainer: { width: '100%' },
    dateHeader: { alignItems: 'center', paddingHorizontal: 16 },
    dateText: {
        fontSize: 14,
        color: '#666',
        fontWeight: '500',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
    },
});
