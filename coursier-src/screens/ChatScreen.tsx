import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, Pressable, TextInput,
  KeyboardAvoidingView, Platform, ScrollView, Image, Alert, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { colors, radius, shadow } from '../lib/theme';
import { useStore, statusLabel } from '../lib/store';
import { displayCourier, QUICK_REPLIES } from '../lib/chat';
import { ChatMessage } from '../lib/types';
import { pickFromCamera, pickFromLibrary } from '../lib/imagePicker';

function timeStr(at: number) {
  const d = new Date(at);
  return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
}

export default function ChatScreen() {
  const nav = useNavigation<any>();
  const route = useRoute<any>();
  const { orders, chats, sendMessage, markChatRead } = useStore();
  const order = orders.find((o) => o.id === route.params?.orderId);
  const [text, setText] = useState('');
  const [typing, setTyping] = useState(false);
  const [attaching, setAttaching] = useState(false);
  const listRef = useRef<FlatList>(null);
  const [, setTick] = useState(0);

  // Rafraîchit pour afficher les messages différés + marque comme lus
  useEffect(() => {
    const t = setInterval(() => setTick((x) => x + 1), 1500);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (order) markChatRead(order.id);
  });

  if (!order) {
    return (
      <SafeAreaView style={st.safe} edges={['top']}>
        <View style={{ padding: 20 }}>
          <Text style={st.headerName}>Conversation introuvable</Text>
        </View>
      </SafeAreaView>
    );
  }

  const courier = displayCourier(order);
  const status = statusLabel(order);
  const now = Date.now();
  const messages = (chats[order.id] ?? []).filter((m) => m.at <= now);

  const send = (msg?: string, imageUri?: string) => {
    const value = (msg ?? text).trim();
    if (!value && !imageUri) return;
    const res = sendMessage(order.id, value, imageUri);
    if (!res.ok) {
      if (res.error) Alert.alert('Message', res.error);
      return;
    }
    setText('');
    setTyping(true);
    setTimeout(() => setTyping(false), 4200);
    setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 120);
  };

  const attachPhoto = async (source: 'camera' | 'library') => {
    setAttaching(true);
    const res = source === 'camera' ? await pickFromCamera() : await pickFromLibrary();
    setAttaching(false);
    if (!res.ok) {
      if (res.error) Alert.alert('Photo', res.error);
      return;
    }
    if (res.dataUri) send(text, res.dataUri);
  };

  const renderMessage = ({ item: m }: { item: ChatMessage }) => {
    const mine = m.from === 'client';
    return (
      <View style={[st.bubbleRow, mine ? { justifyContent: 'flex-end' } : { justifyContent: 'flex-start' }]}>
        {!mine && (
          <View style={st.miniAvatar}>
            <Text style={{ fontSize: 14 }}>{courier.emoji}</Text>
          </View>
        )}
        <View style={[st.bubble, mine ? st.bubbleMine : st.bubbleTheirs, m.imageUri && st.bubbleWithImage]}>
          {m.imageUri && <Image source={{ uri: m.imageUri }} style={st.bubbleImage} />}
          {!!m.text && <Text style={[st.bubbleText, mine && { color: '#fff' }, m.imageUri && { marginTop: 6 }]}>{m.text}</Text>}
          <Text style={[st.bubbleTime, mine && { color: 'rgba(255,255,255,0.7)' }]}>{timeStr(m.at)}</Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={st.safe} edges={['top']}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {/* En-tête livreur */}
        <View style={st.header}>
          <Pressable style={st.back} onPress={() => (nav.canGoBack() ? nav.goBack() : nav.navigate('Tabs'))}>
            <Ionicons name="arrow-back" size={20} color={colors.text} />
          </Pressable>
          <View style={st.headerAvatar}>
            <Text style={{ fontSize: 22 }}>{courier.emoji}</Text>
            <View style={[st.dot, { backgroundColor: status.done ? colors.textMuted : colors.primary }]} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={st.headerName}>{courier.name}</Text>
            <Text style={st.headerStatus} numberOfLines={1}>
              {status.done ? 'Livraison terminée' : status.text}
            </Text>
          </View>
          <Pressable style={st.callBtn} onPress={() => send('Appelez-moi en arrivant')}>
            <Ionicons name="call" size={17} color="#fff" />
          </Pressable>
        </View>

        {/* Bandeau commande */}
        <Pressable style={st.orderBanner} onPress={() => nav.navigate('OrderDetail', { orderId: order.id })}>
          <Ionicons name="receipt" size={14} color={colors.primaryDark} />
          <Text style={st.orderBannerText} numberOfLines={1}>{order.title} • {order.id}</Text>
          <Ionicons name="chevron-forward" size={14} color={colors.primaryDark} />
        </Pressable>

        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(m) => m.id}
          renderItem={renderMessage}
          contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 14, flexGrow: 1 }}
          onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: false })}
          ListEmptyComponent={
            <View style={st.emptyChat}>
              <Text style={{ fontSize: 36 }}>💬</Text>
              <Text style={st.emptyText}>
                {courier.name.split(' ')[0]} va vous écrire d'un instant à l'autre.{'\n'}Vous pouvez déjà lui laisser un message !
              </Text>
            </View>
          }
          ListFooterComponent={
            typing ? (
              <View style={[st.bubbleRow, { justifyContent: 'flex-start' }]}>
                <View style={st.miniAvatar}>
                  <Text style={{ fontSize: 14 }}>{courier.emoji}</Text>
                </View>
                <View style={[st.bubble, st.bubbleTheirs, { paddingVertical: 12 }]}>
                  <Text style={st.typingText}>en train d'écrire…</Text>
                </View>
              </View>
            ) : null
          }
        />

        {/* Réponses rapides */}
        <View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 8, gap: 8 }}
          >
            {QUICK_REPLIES.map((q) => (
              <Pressable key={q} style={st.quick} onPress={() => send(q)}>
                <Text style={st.quickText}>{q}</Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>

        {/* Saisie */}
        <View style={st.inputBar}>
          {attaching ? (
            <View style={st.attachBtn}>
              <ActivityIndicator size="small" color={colors.primaryDark} />
            </View>
          ) : (
            <>
              <Pressable style={st.attachBtn} onPress={() => attachPhoto('camera')}>
                <Ionicons name="camera-outline" size={19} color={colors.primaryDark} />
              </Pressable>
              <Pressable style={st.attachBtn} onPress={() => attachPhoto('library')}>
                <Ionicons name="image-outline" size={19} color={colors.primaryDark} />
              </Pressable>
            </>
          )}
          <TextInput
            style={st.input}
            placeholder="Écrire un message…"
            placeholderTextColor={colors.textMuted}
            value={text}
            onChangeText={(t) => setText(t.slice(0, 500))}
            maxLength={500}
            multiline
            returnKeyType="send"
            onSubmitEditing={() => send()}
          />
          <Pressable
            style={[st.sendBtn, !text.trim() && { backgroundColor: colors.border }]}
            onPress={() => send()}
            disabled={!text.trim()}
          >
            <Ionicons name="send" size={17} color={text.trim() ? '#fff' : colors.textMuted} />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const st = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: 16, paddingVertical: 10, backgroundColor: '#fff',
    borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  back: { width: 38, height: 38, borderRadius: 19, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center' },
  headerAvatar: {
    width: 44, height: 44, borderRadius: 22, backgroundColor: colors.primaryLight,
    alignItems: 'center', justifyContent: 'center',
  },
  dot: {
    position: 'absolute', bottom: 0, right: 0, width: 12, height: 12, borderRadius: 6,
    borderWidth: 2, borderColor: '#fff',
  },
  headerName: { fontSize: 15.5, fontWeight: '800', color: colors.text },
  headerStatus: { fontSize: 12, color: colors.textMuted, fontWeight: '600', marginTop: 1 },
  callBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  orderBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: colors.primaryLight, paddingHorizontal: 16, paddingVertical: 9,
  },
  orderBannerText: { flex: 1, fontSize: 12.5, fontWeight: '700', color: colors.primaryDark },
  bubbleRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 8, marginBottom: 10 },
  miniAvatar: {
    width: 28, height: 28, borderRadius: 14, backgroundColor: colors.primaryLight,
    alignItems: 'center', justifyContent: 'center',
  },
  bubble: { maxWidth: '75%', borderRadius: radius.md, paddingHorizontal: 14, paddingVertical: 9, ...shadow },
  bubbleMine: { backgroundColor: colors.primary, borderBottomRightRadius: 4 },
  bubbleTheirs: { backgroundColor: '#fff', borderBottomLeftRadius: 4 },
  bubbleWithImage: { paddingHorizontal: 6, paddingTop: 6 },
  bubbleImage: { width: 190, height: 190, borderRadius: 12, backgroundColor: colors.bg },
  bubbleText: { fontSize: 14.5, color: colors.text, lineHeight: 20 },
  bubbleTime: { fontSize: 10.5, color: colors.textMuted, marginTop: 4, alignSelf: 'flex-end' },
  typingText: { fontSize: 13, color: colors.textMuted, fontStyle: 'italic' },
  emptyChat: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40, gap: 10 },
  emptyText: { fontSize: 13.5, color: colors.textMuted, textAlign: 'center', lineHeight: 20 },
  quick: {
    backgroundColor: '#fff', borderWidth: 1, borderColor: colors.border,
    borderRadius: 999, paddingHorizontal: 14, paddingVertical: 8,
  },
  quickText: { fontSize: 13, fontWeight: '700', color: colors.primaryDark },
  inputBar: {
    flexDirection: 'row', alignItems: 'flex-end', gap: 8,
    paddingHorizontal: 16, paddingTop: 8, paddingBottom: Platform.OS === 'ios' ? 24 : 14,
    backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: colors.border,
  },
  attachBtn: {
    width: 38, height: 38, borderRadius: 19, backgroundColor: colors.primaryLight,
    alignItems: 'center', justifyContent: 'center',
  },
  input: {
    flex: 1, backgroundColor: colors.bg, borderRadius: radius.md,
    paddingHorizontal: 14, paddingVertical: 10, fontSize: 15, color: colors.text,
    maxHeight: 100, borderWidth: 1, borderColor: colors.border,
  },
  sendBtn: {
    width: 42, height: 42, borderRadius: 21, backgroundColor: colors.primary,
    alignItems: 'center', justifyContent: 'center',
  },
});
