import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Pressable, TextInput,
  KeyboardAvoidingView, Platform, FlatList, Image, Alert, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { colors, radius, shadow, fcfa } from '../../lib/theme';
import { useStore, orderSteps, effectiveProgress, statusLabel } from '../../lib/store';
import { useAuth } from '../../lib/auth';
import { ChatMessage } from '../../lib/types';
import { pickFromCamera, pickFromLibrary } from '../../lib/imagePicker';

const NEXT_ACTION: Record<string, string[]> = {
  resto: ['Commande récupérée au restaurant', 'Je pars livrer le client', 'Livraison effectuée ✅'],
  colis: ['Colis récupéré chez l’expéditeur', 'Je pars vers le destinataire', 'Colis remis en main propre ✅'],
  course: ['Mission démarrée', 'Mission accomplie, je reviens', 'Compte-rendu / achats remis ✅'],
};

function timeStr(at: number) {
  const d = new Date(at);
  return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
}

export default function CourierOrderScreen() {
  const nav = useNavigation<any>();
  const route = useRoute<any>();
  const { orders, chats, advanceOrder, sendCourierMessage, markChatReadCourier, userName } = useStore();
  const { courierId } = useAuth();
  // SÉCURITÉ : un livreur ne peut ouvrir QUE ses propres courses
  const order = orders.find((o) => o.id === route.params?.orderId && o.courierId === courierId);
  const [text, setText] = useState('');
  const [attaching, setAttaching] = useState(false);
  const [, setTick] = useState(0);
  const listRef = useRef<FlatList>(null);

  useEffect(() => {
    const t = setInterval(() => setTick((x) => x + 1), 2500);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (order) markChatReadCourier(order.id);
  });

  if (!order) {
    return (
      <SafeAreaView style={st.safe} edges={['top']}>
        <View style={{ padding: 20 }}>
          <Text style={st.secTitle}>Course introuvable</Text>
        </View>
      </SafeAreaView>
    );
  }

  const p = effectiveProgress(order);
  const s = statusLabel(order);
  const steps = orderSteps(order.type);
  const cancelled = !!order.cancelledAt;
  const done = p >= 3 && !cancelled;
  const actions = NEXT_ACTION[order.type];
  const now = Date.now();
  const messages = (chats[order.id] ?? []).filter((m) => m.at <= now);

  const send = (imageUri?: string) => {
    if (!text.trim() && !imageUri) return;
    const res = sendCourierMessage(order.id, text, imageUri);
    if (!res.ok) {
      if (res.error) Alert.alert('Message', res.error);
      return;
    }
    setText('');
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
    if (res.dataUri) send(res.dataUri);
  };

  const advance = () => {
    advanceOrder(order.id);
    // informer le client automatiquement dans le chat
    const label = actions[Math.min(p, actions.length - 1)];
    sendCourierMessage(order.id, `📍 ${label}`);
  };

  return (
    <SafeAreaView style={st.safe} edges={['top']}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {/* Header */}
        <View style={st.header}>
          <Pressable style={st.back} onPress={() => nav.goBack()}>
            <Ionicons name="arrow-back" size={20} color={colors.text} />
          </Pressable>
          <View style={{ flex: 1 }}>
            <Text style={st.headerTitle} numberOfLines={1}>{order.title}</Text>
            <Text style={st.headerSub}>{order.id} • {fcfa(order.total)}</Text>
          </View>
          <View style={[st.statusPill, cancelled ? { backgroundColor: colors.dangerLight } : done ? { backgroundColor: colors.primaryLight } : { backgroundColor: colors.accentLight }]}>
            <Text style={[st.statusPillText, { color: cancelled ? colors.danger : done ? colors.primaryDark : colors.accentDark }]}>
              {cancelled ? 'Annulée' : done ? 'Terminée' : `Étape ${p + 1}/4`}
            </Text>
          </View>
        </View>

        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 10 }} showsVerticalScrollIndicator={false}>
          {/* Action principale */}
          {!cancelled && !done && (
            <Pressable style={st.actionBtn} onPress={advance}>
              <View style={st.actionIcon}>
                <Ionicons name={p === 2 ? 'checkmark-done' : 'arrow-forward'} size={20} color="#fff" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={st.actionLabel}>Prochaine étape</Text>
                <Text style={st.actionText}>{actions[Math.min(p, actions.length - 1)]}</Text>
              </View>
            </Pressable>
          )}

          {cancelled && (
            <View style={st.cancelBox}>
              <Ionicons name="close-circle" size={20} color={colors.danger} />
              <Text style={st.cancelText}>
                Annulée par le client — {order.cancelReason}.{' '}
                {order.cancelFee && order.cancelFee > 0 ? `Pénalité perçue : ${fcfa(order.cancelFee)} (votre part : 50%).` : 'Aucune pénalité.'}
              </Text>
            </View>
          )}

          {/* Progression */}
          <View style={st.card}>
            <Text style={st.secTitle}>Progression</Text>
            {steps.map((step, i) => (
              <View key={i} style={st.stepRow}>
                <View style={[st.stepDot, { backgroundColor: i <= p && !cancelled ? colors.primary : colors.border }]}>
                  {i <= p && !cancelled && <Ionicons name="checkmark" size={11} color="#fff" />}
                </View>
                <Text style={[st.stepLabel, i <= p && !cancelled && { color: colors.text, fontWeight: '700' }]}>{step.label}</Text>
              </View>
            ))}
          </View>

          {/* Détails course */}
          <View style={st.card}>
            <Text style={st.secTitle}>Détails de la course</Text>
            {order.details.map((d, i) => (
              <View key={i} style={st.detailRow}>
                <Text style={st.detailLabel}>{d.label}</Text>
                <Text style={st.detailValue}>{d.value}</Text>
              </View>
            ))}
            {order.items && order.items.length > 0 && (
              <View style={{ marginTop: 8 }}>
                {order.items.map((l) => (
                  <Text key={l.itemId} style={st.itemLine}>• {l.qty}× {l.name}</Text>
                ))}
              </View>
            )}
          </View>

          {/* Chat avec le client */}
          <View style={[st.card, { paddingBottom: 6 }]}>
            <Text style={st.secTitle}>💬 Conversation avec {userName.split(' ')[0]}</Text>
            {messages.length === 0 && (
              <Text style={st.noMsg}>Aucun message pour l’instant. Écrivez au client ci-dessous.</Text>
            )}
            {messages.map((m: ChatMessage) => {
              const mine = m.from === 'courier';
              return (
                <View key={m.id} style={[st.bubbleRow, mine ? { justifyContent: 'flex-end' } : { justifyContent: 'flex-start' }]}>
                  <View style={[st.bubble, mine ? st.bubbleMine : st.bubbleTheirs, m.imageUri && st.bubbleWithImage]}>
                    {m.imageUri && <Image source={{ uri: m.imageUri }} style={st.bubbleImage} />}
                    {!!m.text && <Text style={[st.bubbleText, mine && { color: '#fff' }, m.imageUri && { marginTop: 6 }]}>{m.text}</Text>}
                    <Text style={[st.bubbleTime, mine && { color: 'rgba(255,255,255,0.7)' }]}>{timeStr(m.at)}</Text>
                  </View>
                </View>
              );
            })}
          </View>
        </ScrollView>

        {/* Barre d'envoi */}
        <View style={st.inputBar}>
          {attaching ? (
            <View style={st.attachBtn}>
              <ActivityIndicator size="small" color={colors.primaryDark} />
            </View>
          ) : (
            <>
              <Pressable style={st.attachBtn} onPress={() => attachPhoto('camera')}>
                <Ionicons name="camera-outline" size={18} color={colors.primaryDark} />
              </Pressable>
              <Pressable style={st.attachBtn} onPress={() => attachPhoto('library')}>
                <Ionicons name="image-outline" size={18} color={colors.primaryDark} />
              </Pressable>
            </>
          )}
          <TextInput
            style={st.input}
            placeholder="Message au client…"
            placeholderTextColor={colors.textMuted}
            value={text}
            onChangeText={(t) => setText(t.slice(0, 500))}
            maxLength={500}
            multiline
            onSubmitEditing={() => send()}
          />
          <Pressable style={[st.sendBtn, !text.trim() && { backgroundColor: colors.border }]} onPress={() => send()} disabled={!text.trim()}>
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
    flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 10,
    backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  back: { width: 38, height: 38, borderRadius: 19, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 15, fontWeight: '800', color: colors.text },
  headerSub: { fontSize: 12, color: colors.textMuted, marginTop: 1 },
  statusPill: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999 },
  statusPillText: { fontSize: 11.5, fontWeight: '800' },
  actionBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: colors.primary,
    marginHorizontal: 20, marginTop: 14, borderRadius: radius.md, padding: 16, ...shadow,
  },
  actionIcon: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center', justifyContent: 'center',
  },
  actionLabel: { color: 'rgba(255,255,255,0.8)', fontSize: 11.5, fontWeight: '600' },
  actionText: { color: '#fff', fontSize: 15, fontWeight: '800', marginTop: 2 },
  cancelBox: {
    flexDirection: 'row', gap: 10, alignItems: 'center', backgroundColor: colors.dangerLight,
    marginHorizontal: 20, marginTop: 14, borderRadius: radius.md, padding: 14,
  },
  cancelText: { flex: 1, fontSize: 12.5, color: colors.danger, fontWeight: '600', lineHeight: 18 },
  card: {
    backgroundColor: '#fff', borderRadius: radius.md, padding: 16,
    marginHorizontal: 20, marginTop: 14, ...shadow,
  },
  secTitle: { fontSize: 15, fontWeight: '800', color: colors.text, marginBottom: 10 },
  stepRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 6 },
  stepDot: { width: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  stepLabel: { fontSize: 13.5, color: colors.textMuted, flex: 1 },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 14, paddingVertical: 6 },
  detailLabel: { fontSize: 12.5, fontWeight: '700', color: colors.textMuted, width: 110 },
  detailValue: { flex: 1, fontSize: 13, fontWeight: '600', color: colors.text, textAlign: 'right' },
  itemLine: { fontSize: 13, color: colors.text, paddingVertical: 2 },
  noMsg: { fontSize: 12.5, color: colors.textMuted, fontStyle: 'italic', paddingBottom: 8 },
  bubbleRow: { flexDirection: 'row', marginBottom: 8 },
  bubble: { maxWidth: '80%', borderRadius: 14, paddingHorizontal: 12, paddingVertical: 8 },
  bubbleMine: { backgroundColor: colors.primary, borderBottomRightRadius: 4 },
  bubbleTheirs: { backgroundColor: colors.bg, borderBottomLeftRadius: 4 },
  bubbleWithImage: { paddingHorizontal: 6, paddingTop: 6 },
  bubbleImage: { width: 170, height: 170, borderRadius: 10, backgroundColor: '#fff' },
  bubbleText: { fontSize: 13.5, color: colors.text, lineHeight: 19 },
  bubbleTime: { fontSize: 10, color: colors.textMuted, marginTop: 3, alignSelf: 'flex-end' },
  inputBar: {
    flexDirection: 'row', alignItems: 'flex-end', gap: 8, paddingHorizontal: 16,
    paddingTop: 8, paddingBottom: Platform.OS === 'ios' ? 22 : 12,
    backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: colors.border,
  },
  attachBtn: {
    width: 36, height: 36, borderRadius: 18, backgroundColor: colors.primaryLight,
    alignItems: 'center', justifyContent: 'center',
  },
  input: {
    flex: 1, backgroundColor: colors.bg, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border,
    paddingHorizontal: 14, paddingVertical: 10, fontSize: 14.5, color: colors.text, maxHeight: 90,
  },
  sendBtn: { width: 42, height: 42, borderRadius: 21, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
});
