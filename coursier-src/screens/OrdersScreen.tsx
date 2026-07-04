import React, { useCallback, useMemo, useState } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, RefreshControl, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { colors, radius, fcfa } from '../lib/theme';
import { useStore, statusLabel } from '../lib/store';
import { Card, EmptyState } from '../components/ui';
import { Order } from '../lib/types';

const TYPE_META: Record<Order['type'], { emoji: string; bg: string }> = {
  resto: { emoji: '🍽️', bg: colors.primaryLight },
  colis: { emoji: '📦', bg: colors.accentLight },
  course: { emoji: '🏃', bg: colors.primaryLight },
};

const FILTERS = [
  { id: 'all', label: 'Tout' },
  { id: 'active', label: 'En cours' },
  { id: 'resto', label: '🍽️ Restos' },
  { id: 'colis', label: '📦 Colis' },
  { id: 'course', label: '🏃 Missions' },
  { id: 'cancelled', label: 'Annulées' },
];

export default function OrdersScreen() {
  const nav = useNavigation<any>();
  const { orders, unreadCount } = useStore();
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState('all');
  const [tick, setTick] = useState(0);

  const data = useMemo(() => {
    if (filter === 'all') return orders;
    if (filter === 'active') return orders.filter((o) => !statusLabel(o).done);
    if (filter === 'cancelled') return orders.filter((o) => !!o.cancelledAt);
    return orders.filter((o) => o.type === filter);
  }, [orders, filter, tick]);

  useFocusEffect(
    useCallback(() => {
      const t = setInterval(() => setTick((x) => x + 1), 5000);
      return () => clearInterval(t);
    }, [])
  );

  return (
    <SafeAreaView style={st.safe} edges={['top']}>
      <Text style={st.title}>Mes commandes 🧾</Text>
      <View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 12 }}>
          {FILTERS.map((f) => (
            <Pressable key={f.id} style={[st.chip, filter === f.id && st.chipActive]} onPress={() => setFilter(f.id)}>
              <Text style={[st.chipText, filter === f.id && { color: '#fff' }]}>{f.label}</Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>
      <FlatList
        data={data}
        keyExtractor={(o) => o.id}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 32, flexGrow: 1 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); setTimeout(() => { setTick((x) => x + 1); setRefreshing(false); }, 600); }} tintColor={colors.primary} />
        }
        ListEmptyComponent={
          <EmptyState
            icon="receipt-outline"
            title={filter === 'all' ? 'Aucune commande pour l’instant' : 'Rien dans cette catégorie'}
            subtitle={filter === 'all'
              ? 'Commandez un plat, envoyez un colis ou lancez une mission — tout apparaîtra ici.'
              : 'Changez de filtre ou passez une nouvelle commande.'}
          />
        }
        renderItem={({ item: o }) => {
          const s = statusLabel(o);
          const meta = TYPE_META[o.type];
          const unread = unreadCount(o.id);
          return (
            <Pressable onPress={() => nav.navigate('OrderDetail', { orderId: o.id })}>
              <Card style={{ marginBottom: 12, flexDirection: 'row', alignItems: 'center', gap: 14 }}>
                <View style={[st.icon, { backgroundColor: meta.bg }]}>
                  <Text style={{ fontSize: 24 }}>{meta.emoji}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={st.orderTitle} numberOfLines={1}>{o.title}</Text>
                  <Text style={st.orderSub} numberOfLines={1}>{o.subtitle}</Text>
                  <View style={[
                    st.status,
                    s.cancelled
                      ? { backgroundColor: colors.dangerLight }
                      : s.done
                      ? { backgroundColor: colors.primaryLight }
                      : { backgroundColor: colors.accentLight },
                  ]}>
                    <View style={[st.dot, { backgroundColor: s.cancelled ? colors.danger : s.done ? colors.primary : colors.accent }]} />
                    <Text
                      style={[st.statusText, { color: s.cancelled ? colors.danger : s.done ? colors.primaryDark : colors.accentDark }]}
                      numberOfLines={1}
                    >{s.text}</Text>
                  </View>
                </View>
                <View style={{ alignItems: 'flex-end', gap: 6 }}>
                  <Text style={st.total}>{fcfa(o.total)}</Text>
                  {o.rating ? (
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
                      <Ionicons name="star" size={12} color={colors.accent} />
                      <Text style={st.ratedText}>{o.rating}</Text>
                    </View>
                  ) : null}
                  <Pressable
                    style={st.chatMini}
                    hitSlop={8}
                    onPress={() => nav.navigate('Chat', { orderId: o.id })}
                  >
                    <Ionicons name="chatbubble-ellipses" size={15} color={colors.primaryDark} />
                    {unread > 0 && (
                      <View style={st.chatMiniBadge}>
                        <Text style={st.chatMiniBadgeText}>{unread}</Text>
                      </View>
                    )}
                  </Pressable>
                </View>
              </Card>
            </Pressable>
          );
        }}
      />
    </SafeAreaView>
  );
}

const st = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  title: { fontSize: 24, fontWeight: '800', color: colors.text, paddingHorizontal: 20, paddingTop: 12, marginBottom: 14 },
  chip: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999, backgroundColor: '#fff',
    borderWidth: 1, borderColor: colors.border, marginRight: 8,
  },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { color: colors.text, fontWeight: '700', fontSize: 13 },
  icon: { width: 52, height: 52, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  orderTitle: { fontSize: 14.5, fontWeight: '800', color: colors.text },
  orderSub: { fontSize: 12.5, color: colors.textMuted, marginTop: 2 },
  status: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, marginTop: 6 },
  dot: { width: 7, height: 7, borderRadius: 4 },
  statusText: { fontSize: 11.5, fontWeight: '700' },
  total: { fontSize: 14, fontWeight: '800', color: colors.text },
  ratedText: { fontSize: 12, fontWeight: '800', color: colors.accentDark },
  chatMini: {
    width: 30, height: 30, borderRadius: 15, backgroundColor: colors.primaryLight,
    alignItems: 'center', justifyContent: 'center',
  },
  chatMiniBadge: {
    position: 'absolute', top: -4, right: -4, backgroundColor: colors.danger, borderRadius: 7,
    minWidth: 14, height: 14, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 2,
  },
  chatMiniBadgeText: { color: '#fff', fontSize: 9, fontWeight: '800' },
});
