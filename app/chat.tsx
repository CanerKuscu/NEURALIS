/**
 * Chat Screen — Sohbet/Mesajlaşma
 */
import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, View, ScrollView, Text, TouchableOpacity, StatusBar, TextInput, KeyboardAvoidingView, Platform, FlatList } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { ArrowLeft, Send, Smile, Image, Zap, MessageCircle, Plus, Users } from 'lucide-react-native';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import { useTheme } from '../src/context/ThemeContext';
import { chatService, STICKER_PACKS } from '../src/services/ChatService';
import type { Chat, ChatMessage } from '../src/services/ChatService';
import * as Haptics from 'expo-haptics';
import i18n from '../src/i18n';

export default function ChatScreen() {
    const insets = useSafeAreaInsets();
    const { theme, isDark } = useTheme();
    const [mode, setMode] = useState<'list' | 'chat'>('list');
    const [chats, setChats] = useState<Chat[]>([]);
    const [activeChat, setActiveChat] = useState<Chat | null>(null);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [inputText, setInputText] = useState('');
    const [showStickers, setShowStickers] = useState(false);
    const scrollRef = useRef<FlatList>(null);

    useEffect(() => {
        loadChats();
    }, []);

    const loadChats = async () => {
        let allChats = await chatService.getChats();
        // Create demo chats if none exist
        if (allChats.length === 0) {
            await chatService.createDirectChat({
                userId: 'nf-bot', displayName: 'Neural Fox 🦊',
                role: 'member', joinedAt: new Date().toISOString(), isOnline: true,
            });
            await chatService.createGroupChat(i18n.t('chat_screen.club_title'), '🧠', [
                { userId: 'bot1', displayName: 'Yıldız🌟', role: 'member', joinedAt: new Date().toISOString(), isOnline: true },
                { userId: 'bot2', displayName: 'MathGenius', role: 'member', joinedAt: new Date().toISOString(), isOnline: false },
            ]);
            allChats = await chatService.getChats();
        }
        setChats(allChats);
    };

    const openChat = async (chat: Chat) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setActiveChat(chat);
        const msgs = await chatService.getMessages(chat.id);
        setMessages(msgs);
        await chatService.markAsRead(chat.id);
        setMode('chat');
    };

    const sendMessage = async () => {
        if (!inputText.trim() || !activeChat) return;
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        const msg = await chatService.sendMessage(activeChat.id, 'me', 'Sen', inputText.trim());
        setMessages(prev => [...prev, msg]);
        setInputText('');
        scrollRef.current?.scrollToEnd({ animated: true });

        // Refresh to get bot reply
        setTimeout(async () => {
            const msgs = await chatService.getMessages(activeChat.id);
            setMessages(msgs);
        }, 4000);
    };

    const sendSticker = async (emoji: string) => {
        if (!activeChat) return;
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        const msg = await chatService.sendMessage(activeChat.id, 'me', 'Sen', emoji, 'sticker');
        setMessages(prev => [...prev, msg]);
        setShowStickers(false);
    };

    // ── CHAT LIST ──
    if (mode === 'list') {
        return (
            <View style={[styles.container, { paddingTop: insets.top, backgroundColor: theme.background.primary }]}>
                <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()}>
                        <ArrowLeft size={24} color={theme.text.primary} />
                    </TouchableOpacity>
                    <Text style={[styles.headerTitle, { color: theme.text.primary }]}>Mesajlar</Text>
                    <TouchableOpacity>
                        <Plus size={24} color={theme.primary} />
                    </TouchableOpacity>
                </View>

                <FlatList
                    data={chats}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={{ paddingBottom: 100 }}
                    renderItem={({ item: chat, index: i }) => (
                        <Animated.View entering={FadeInDown.delay(i * 60)}>
                            <TouchableOpacity
                                style={[styles.chatItem, { borderBottomColor: theme.border.light }]}
                                onPress={() => openChat(chat)}
                                accessibilityRole="button"
                                accessibilityLabel={chat.name || chat.participants[0]?.displayName || 'Sohbet'}
                            >
                                <View style={[styles.chatAvatar, { backgroundColor: chat.type === 'group' ? '#9B59B620' : '#3498DB20' }]}>
                                    {chat.type === 'group' ? <Users size={24} color="#9B59B6" /> :
                                        <Text style={{ fontSize: 24 }}>{chat.emoji || '🦊'}</Text>}
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={[styles.chatName, { color: theme.text.primary }]}>
                                        {chat.name || chat.participants[0]?.displayName || 'Sohbet'}
                                    </Text>
                                    {chat.lastMessage && (
                                        <Text style={[styles.chatLastMsg, { color: theme.text.secondary }]} numberOfLines={1}>
                                            {chat.lastMessage.text}
                                        </Text>
                                    )}
                                </View>
                                {chat.unreadCount > 0 && (
                                    <View style={styles.unreadBadge}>
                                        <Text style={styles.unreadText}>{chat.unreadCount}</Text>
                                    </View>
                                )}
                            </TouchableOpacity>
                        </Animated.View>
                    )}
                />
            </View>
        );
    }

    // ── CHAT VIEW ──
    const chatName = activeChat?.name || activeChat?.participants[0]?.displayName || 'Sohbet';

    return (
        <View style={[styles.container, { paddingTop: insets.top, backgroundColor: theme.background.primary }]}>
            <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
            <View style={[styles.chatHeader, { borderBottomColor: theme.border.light }]}>
                <TouchableOpacity onPress={() => { setMode('list'); loadChats(); }}>
                    <ArrowLeft size={24} color={theme.text.primary} />
                </TouchableOpacity>
                <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={[styles.chatHeaderName, { color: theme.text.primary }]}>{chatName}</Text>
                    <Text style={[styles.chatHeaderStatus, { color: theme.text.secondary }]}>
                        {activeChat?.type === 'group' ? `${(activeChat.participants?.length || 0) + 1} ${i18n.t('chat_screen.members')}` : i18n.t('chat_screen.online')}
                    </Text>
                </View>
            </View>

            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }} keyboardVerticalOffset={insets.top + 60}>
                <FlatList
                    ref={scrollRef}
                    data={messages}
                    keyExtractor={m => m.id}
                    contentContainerStyle={{ padding: 16, gap: 6, paddingBottom: 8 }}
                    onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
                    renderItem={({ item: msg }) => {
                        const isMe = msg.senderId === 'me';
                        return (
                            <View style={[styles.msgRow, { justifyContent: isMe ? 'flex-end' : 'flex-start' }]}>
                                <View style={[styles.msgBubble, {
                                    backgroundColor: isMe ? '#2ECC71' : theme.background.secondary,
                                    borderBottomRightRadius: isMe ? 4 : 16,
                                    borderBottomLeftRadius: isMe ? 16 : 4,
                                }]}>
                                    {!isMe && <Text style={[styles.msgSender, { color: '#3498DB' }]}>{msg.senderName}</Text>}
                                    <Text style={[styles.msgText, { color: isMe ? '#FFF' : theme.text.primary, fontSize: msg.type === 'sticker' ? 32 : 15 }]}>
                                        {msg.text}
                                    </Text>
                                    <Text style={[styles.msgTime, { color: isMe ? 'rgba(255,255,255,0.6)' : theme.text.secondary }]}>
                                        {new Date(msg.createdAt).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                                    </Text>
                                </View>
                            </View>
                        );
                    }}
                />

                {/* Sticker Panel */}
                {showStickers && (
                    <View style={[styles.stickerPanel, { backgroundColor: theme.background.secondary }]}>
                        {STICKER_PACKS.map(pack => (
                            <View key={pack.category}>
                                <Text style={[styles.stickerCategory, { color: theme.text.secondary }]}>{pack.category}</Text>
                                <View style={styles.stickerGrid}>
                                    {pack.stickers.filter(s => !s.isPremium).map(s => (
                                        <TouchableOpacity key={s.id} style={styles.stickerItem} onPress={() => sendSticker(s.emoji)}>
                                            <Text style={styles.stickerEmoji}>{s.emoji}</Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </View>
                        ))}
                    </View>
                )}

                {/* Input Bar */}
                <View style={[styles.inputBar, { backgroundColor: theme.background.secondary, paddingBottom: insets.bottom + 8 }]}>
                    <TouchableOpacity onPress={() => setShowStickers(!showStickers)}>
                        <Smile size={24} color={showStickers ? '#2ECC71' : theme.text.secondary} />
                    </TouchableOpacity>
                    <TextInput
                        style={[styles.input, { color: theme.text.primary, backgroundColor: theme.background.primary }]}
                        placeholder="Mesaj yaz..."
                        placeholderTextColor={theme.text.secondary}
                        value={inputText}
                        onChangeText={setInputText}
                        onSubmitEditing={sendMessage}
                    />
                    <TouchableOpacity onPress={sendMessage} disabled={!inputText.trim()}>
                        <Send size={24} color={inputText.trim() ? '#2ECC71' : theme.text.secondary} />
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 16 },
    headerTitle: { fontSize: 18, fontWeight: '700' },
    chatItem: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16, borderBottomWidth: 1 },
    chatAvatar: { width: 50, height: 50, borderRadius: 25, justifyContent: 'center', alignItems: 'center' },
    chatName: { fontSize: 16, fontWeight: '700' },
    chatLastMsg: { fontSize: 13, marginTop: 2 },
    unreadBadge: { backgroundColor: '#2ECC71', minWidth: 22, height: 22, borderRadius: 11, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 6 },
    unreadText: { color: '#FFF', fontSize: 12, fontWeight: '700' },
    chatHeader: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1 },
    chatHeaderName: { fontSize: 16, fontWeight: '700' },
    chatHeaderStatus: { fontSize: 12 },
    msgRow: { flexDirection: 'row', marginVertical: 2 },
    msgBubble: { maxWidth: '80%', padding: 12, borderRadius: 16 },
    msgSender: { fontSize: 12, fontWeight: '700', marginBottom: 4 },
    msgText: { fontSize: 15, lineHeight: 22 },
    msgTime: { fontSize: 10, marginTop: 4, textAlign: 'right' },
    stickerPanel: { maxHeight: 180, padding: 12 },
    stickerCategory: { fontSize: 12, fontWeight: '700', marginBottom: 6 },
    stickerGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
    stickerItem: { padding: 8, borderRadius: 12 },
    stickerEmoji: { fontSize: 28 },
    inputBar: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, paddingTop: 10 },
    input: { flex: 1, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, fontSize: 15 },
});
