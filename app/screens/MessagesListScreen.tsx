import { ChatCard } from "@/components/ChatCard";
import { RoundedView } from '@/components/RoundedView';
import { Header } from '@/components/ui/Header';
import React from 'react';
import {
    FlatList,
    StyleSheet,
    Text,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useChatStore } from "../store/chatsStore";

export default function MessagesListScreen() {
    const chats = useChatStore(state => state.chats);

    return (
        <View style={styles.container}>
            <SafeAreaView style={{ flex: 1 }} edges={['top', 'left', 'right']} >
                <Header showBack={false} title='Messages' isCommunity={false} />
                <RoundedView isOverlay={false} style={styles.roundedView}>
                    {(!chats || chats.length === 0) ? (
                        <Text
                            style={{
                                fontSize: 14,
                                color: "gray",
                                textAlign: "center",
                                marginTop: 20
                            }}
                        >
                            There are no chats
                        </Text>
                    ) : (
                        <FlatList
                        style={{height: '100%', width: '100%'}}
                            data={chats}
                            keyExtractor={(item) => item.id}
                            renderItem={({ item }) => (
                                <ChatCard id={item.id} data={item} style={{}} />
                            )}
                            showsVerticalScrollIndicator={false}
                            contentContainerStyle={{
                                alignItems: "center",
                                paddingVertical: 10,
                                gap: 10,
                                width: '100%',
                                
                            }}
                        />
                    )}
                </RoundedView>
            </SafeAreaView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "black",
    },
    roundedView: {
        flex: 2,
        gap: 10,
        padding: 0,
        marginTop: 20,
        paddingVertical: 20,
    },
    header: {
        paddingHorizontal: 16,
        paddingVertical: 12,
        marginTop: 32,
    },
});
