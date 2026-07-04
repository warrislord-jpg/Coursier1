import React, { useCallback, useMemo, useState } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { colors, radius, shadow, fcfa } from '../../lib/theme';
import { useStore, statusLabel, effectiveProgress, orderSteps } from '../../lib/store';
import { useAuth } from '../../lib/auth';
import { COURIER_ACCOUNTS } from '../../lib/courierAccounts';
import { EmptyState } from '../../components/ui';
import { Order } from '../../lib/types';

const TYPE_META: Record<Order['type'], { emoji: string; bg: string }> = {
  resto: { emoji: '🍽️', bg: colors.primaryLight },
  colis: { emoji: '📦', bg: colors.accentLight },
  course: { emoji: '🏃', bg: colors.primaryLight },
};

// Part du livreur : 80 % des frais de livraison/service
export function courierEarning(o: Order): number {
  if (o.cancelledAt) return o.cancelFee ? Math.round(o.cancelFee * 0.5 / 50) * 50 : 0;
  if (o.type === 'resto') {
    const feeDetail = o.details.find((d) => d.label === 'Frais de livraison');
    const fee = feeDetail ? parseInt(feeDetail.value.replace(/\D/g, '')) : 1000;
    return Math.round(fee * 0.8 / 50) * 50;
  }
  return Math.round(o.total * 0.8 / 50) * 50;
}

export default function CourierHomeScreen() {
  const nav = useNavigation<any>();
  const { orders, unreadForCourier, claimOrder } = useStore();
  const { logout, courierId } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const [tab, setTab] = useState<'available' | 'mine' | 'done'>('available');
  const [claimError, setClaimError] = useState<string | null>(null);
  const [, setTick] = useState(0);

  useFocusEffect(
    useCallback(() => {
      const t = setInterval(() => setTick((x) => x + 1), 4000);
      return () => clearInterval(t);
    }, [])
  );

  const me = COURIER_ACCOUNTS.find((c) => c.courierId === courierId);

  // Disponibles : sans livreur assigné, non annulées, non terminées.
  // Les commandes resto n'apparaissent qu'une fois acceptées par le restaurant.
  const available = useMemo(
    () => orders.filter((o) => {
      if (o.courierId || o.cancelledAt || statusLabel(o).done) return false;
      if (o.type === 'resto') return !!o.acceptedByResto;
      return true;
    }),
    [orders, refreshing, tab]
  );
  // Mes courses : assignées à MOI, en cours
  const mine = useMemo(
    () => orders.filter((o) => o.courierId === courierId && !statusLabel(o).done),
    [orders, courierId, refreshing, tab]
  );
  // Historique : mes courses terminées ou annulées
  const done = useMemo(
    () => orders.filter((o) => o.courierId === courierId && statusLabel(o).done),
    [orders, courierId, refreshing, tab]
  );
  const data = tab === 'available' ? available : tab === 'mine' ? mine : done;

  const earnings = done
    .filter((o) => !o.cancelledAt)
    .reduce((s, o) => s + courierEarning(o), 0);
  const deliveredCount = done.filter((o) => !o.cancelledAt).length;

  const takeOrder = (o: Order) => {
    if (!courierId || !me) return;
    const res = claimOrder(o.id, courierId, me.name);
    if (!res.ok) {
      setClaimError(res.error ?? 'Erreur');
      setTimeout(() => setClaimError(null), 3000);
    } else {
      setTab('mine');
    }
  };

  return (
    <SafeAreaView style={st.safe} edges={['top']}>
      {/* En-tête livreur connecté */}
      <View style={st.header}>
        <View style={st.avatar}>
          <Text style={{ fontSize: 24 }}>🛵</Text>
          <View style={st.onlineDot} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={st.name}>{me?.name ?? 'Livreur'}</Text>
          <Text style={st.meta}>@{me?.username} • {me?.vehicle} • En ligne</Text>
        </View>
        <Pressable style={st.logoutBtn} onPress={logout}>
          <Ionicons name="log-out-outline" size={20} color={colors.danger} />
        </Pressable>
      </View>

      {/* Gains */}
      <View style={st.earningsCard}>
        <View style={{ flex: 1 }}>
          <Text style={st.earnLabel}>Mes gains (80% des frais)</Text>
          <Text style={st.earnValue}>{fcfa(earnings)}</Text>
        </View>
        <View style={st.earnDivider} />
        <View style={{ alignItems: 'center', paddingHorizontal: 14 }}>
          <Text style={st.earnCount}>{deliveredCount}</Text>
          <Text style={st.earnCountLabel}>livrées</Text>
        </View>
        <View style={st.earnDivider} />
        <View style={{ alignItems: 'center', paddingHorizontal: 14 }}>
          <Text style={st.earnCount}>{mine.length}</Text>
          <Text style={st.earnCountLabel}>en cours</Text>
        </View>
      </View>

      {claimError && (
        <View style={st.claimError}>
          <Ionicons name="alert-circle" size={15} color={colors.danger} />
          <Text style={st.claimErrorText}>{claimError}</Text>
        </View>
      )}

      {/* Onglets */}
      <View style={st.tabs}>
        <Pressable style={[st.tabBtn, tab === 'available' && st.tabActive]} onPress={() => setTab('available')}>
          <Text style={[st.tabText, tab === 'available' && { color: '#fff' }]}>Dispo ({available.length})</Text>
        </Pressable>
        <Pressable style={[st.tabBtn, tab === 'mine' && st.tabActive]} onPress={() => setTab('mine')}>
          <Text style={[st.tabText, tab === 'mine' && { color: '#fff' }]}>Mes courses ({mine.length})</Text>
        </Pressable>
        <Pressable style={[st.tabBtn, tab === 'done' && st.tabActive]} onPress={() => setTab('done')}>
          <Text style={[st.tabText, tab === 'done' && { color: '#fff' }]}>Historique ({done.length})</Text>
        </Pressable>
      </View>

      <FlatList
        data={data}
        keyExtractor={(o) => o.id}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 30, flexGrow: 1 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); setTimeout(() => setRefreshing(false), 600); }} tintColor={colors.primary} />
        }
        ListEmptyComponent={
          <EmptyState
            icon={tab === 'available' ? 'radio-outline' : tab === 'mine' ? 'bicycle-outline' : 'checkmark-done-outline'}
            title={tab === 'available' ? 'Aucune course disponible' : tab === 'mine' ? 'Aucune course en cours' : 'Aucune course terminée'}
            subtitle={tab === 'available'
              ? 'Les nouvelles courses apparaissent ici en temps réel. Les commandes resto arrivent une fois acceptées par le restaurant.'
              : tab === 'mine'
              ? 'Prenez une course dans l\'onglet « Dispo » pour commencer à livrer.'
              : 'Vos livraisons terminées apparaîtront ici avec vos gains.'}
          />
        }
        renderItem={({ item: o }) => {
          const s = statusLabel(o);
          const p = effectiveProgress(o);
          const meta = TYPE_META[o.type];
          const unread = unreadForCourier(o.id);
          const steps = orderSteps(o.type);
          const isMine = o.courierId === courierId;
          return (
            <Pressable
              style={st.card}
              onPress={() => isMine ? nav.navigate('CourierOrder', { orderId: o.id }) : undefined}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <View style={[st.cardIcon, { backgroundColor: meta.bg }]}>
                  <Text style={{ fontSize: 22 }}>{meta.emoji}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={st.cardTitle} numberOfLines={1}>{o.title}</Text>
                  <Text style={st.cardSub} numberOfLines={1}>{o.subtitle}</Text>
                </View>
                <View style={{ alignItems: 'flex-end', gap: 3 }}>
                  <Text style={st.gain}>+{fcfa(courierEarning(o))}</Text>
                  {isMine && unread > 0 && (
                    <View style={st.unreadPill}>
                      <Ionicons name="chatbubble" size={10} color="#fff" />
                      <Text style={st.unreadText}>{unread}</Text>
                    </View>
                  )}
                </View>
              </View>

              {tab === 'available' ? (
                <Pressable style={st.claimBtn} onPress={() => takeOrder(o)}>
                  <Ionicons name="hand-right" size={16} color="#fff" />
                  <Text style={st.claimBtnText}>Prendre cette course</Text>
                </Pressable>
              ) : !o.cancelledAt ? (
                <View style={st.stepsRow}>
                  {steps.map((_, i) => (
                    <View key={i} style={[st.stepSeg, { backgroundColor: i <= p ? colors.primary : colors.border }]} />
                  ))}
                  <Text style={st.stepText}>{s.text}</Text>
                </View>
              ) : (
                <View style={[st.stepsRow, { gap: 6 }]}>
                  <Ionicons name="close-circle" size={14} color={colors.danger} />
                  <Text style={[st.stepText, { color: colors.danger }]}>Annulée par le client</Text>
                </View>
              )}
            </Pressable>
          );
        }}
      />
    </SafeAreaView>
  );
}

const st = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 20, paddingTop: 12, paddingBottom: 4 },
  avatar: {
    width: 50, height: 50, borderRadius: 25, backgroundColor: colors.accentLight,
    alignItems: 'center', justifyContent: 'center',
  },
  onlineDot: {
    position: 'absolute', bottom: 0, right: 0, width: 13, height: 13, borderRadius: 7,
    backgroundColor: colors.primary, borderWidth: 2, borderColor: colors.bg,
  },
  name: { fontSize: 18, fontWeight: '800', color: colors.text },
  meta: { fontSize: 12.5, color: colors.textMuted, fontWeight: '600', marginTop: 1 },
  logoutBtn: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: '#fff',
    alignItems: 'center', justifyContent: 'center', ...shadow,
  },
  earningsCard: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: colors.primaryDark,
    marginHorizontal: 20, marginTop: 14, borderRadius: radius.lg, padding: 18, ...shadow,
  },
  earnLabel: { color: 'rgba(255,255,255,0.75)', fontSize: 12, fontWeight: '600' },
  earnValue: { color: '#fff', fontSize: 22, fontWeight: '800', marginTop: 3 },
  earnDivider: { width: 1, height: 36, backgroundColor: 'rgba(255,255,255,0.2)' },
  earnCount: { color: '#fff', fontSize: 17, fontWeight: '800' },
  earnCountLabel: { color: 'rgba(255,255,255,0.75)', fontSize: 11, marginTop: 2 },
  claimError: {
    flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: colors.dangerLight,
    marginHorizontal: 20, marginTop: 10, borderRadius: radius.sm, padding: 10,
  },
  claimErrorText: { flex: 1, fontSize: 12.5, color: colors.danger, fontWeight: '700' },
  tabs: { flexDirection: 'row', gap: 8, paddingHorizontal: 20, marginTop: 16, marginBottom: 12 },
  tabBtn: {
    flex: 1, paddingVertical: 10, borderRadius: 999, backgroundColor: '#fff',
    alignItems: 'center', borderWidth: 1, borderColor: colors.border,
  },
  tabActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  tabText: { fontSize: 12, fontWeight: '700', color: colors.text },
  card: { backgroundColor: '#fff', borderRadius: radius.md, padding: 14, marginBottom: 12, ...shadow },
  cardIcon: { width: 46, height: 46, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  cardTitle: { fontSize: 14.5, fontWeight: '800', color: colors.text },
  cardSub: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  gain: { fontSize: 14, fontWeight: '800', color: colors.primary },
  unreadPill: {
    flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: colors.danger,
    paddingHorizontal: 7, paddingVertical: 3, borderRadius: 999,
  },
  unreadText: { color: '#fff', fontSize: 10, fontWeight: '800' },
  claimBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: colors.accent, borderRadius: radius.sm, paddingVertical: 12, marginTop: 12,
  },
  claimBtnText: { color: '#fff', fontSize: 13.5, fontWeight: '800' },
  stepsRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 12 },
  stepSeg: { width: 26, height: 4, borderRadius: 2 },
  stepText: { fontSize: 11.5, fontWeight: '700', color: colors.textMuted, marginLeft: 6, flex: 1 },
});
