import React, { useCallback, useMemo, useState } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { colors, radius, shadow, fcfa } from '../../lib/theme';
import { useStore, statusLabel, effectiveProgress } from '../../lib/store';
import { useAuth } from '../../lib/auth';
import { RESTAURANTS } from '../../lib/data';
import { EmptyState } from '../../components/ui';
import { Order } from '../../lib/types';

// Part du restaurant : total des articles − 15 % de commission plateforme
function restoRevenue(o: Order): number {
  if (!o.items) return 0;
  const itemsTotal = o.items.reduce((s, l) => s + l.price * l.qty, 0);
  return Math.round(itemsTotal * 0.85 / 50) * 50;
}

export default function RestaurantDashScreen() {
  const nav = useNavigation<any>();
  const { orders, advanceOrder, acceptOrderResto, getMenu } = useStore();
  const { logout, restaurantId } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const [tab, setTab] = useState<'new' | 'kitchen' | 'done'>('new');
  const [, setTick] = useState(0);

  useFocusEffect(
    useCallback(() => {
      const t = setInterval(() => setTick((x) => x + 1), 4000);
      return () => clearInterval(t);
    }, [])
  );

  const resto = RESTAURANTS.find((r) => r.id === restaurantId);
  const menu = restaurantId ? getMenu(restaurantId) : [];
  const promoCount = menu.filter((m) => m.promoPrice != null && m.promoPrice > 0).length;
  const offCount = menu.filter((m) => m.available === false).length;

  // SÉCURITÉ : chaque restaurant ne voit QUE ses propres commandes
  const restoOrders = useMemo(
    () => orders.filter((o) => o.type === 'resto' && o.restaurantId === restaurantId),
    [orders, restaurantId, refreshing, tab]
  );
  const newOrders = restoOrders.filter((o) => !o.cancelledAt && !o.acceptedByResto && effectiveProgress(o) < 1);
  const kitchen = restoOrders.filter((o) => !o.cancelledAt && (o.acceptedByResto || effectiveProgress(o) >= 1) && effectiveProgress(o) < 2);
  const done = restoOrders.filter((o) => o.cancelledAt || effectiveProgress(o) >= 2);

  const revenue = restoOrders
    .filter((o) => !o.cancelledAt && effectiveProgress(o) >= 2)
    .reduce((s, o) => s + restoRevenue(o), 0);
  const penaltiesReceived = restoOrders
    .filter((o) => o.cancelledAt && (o.cancelFee ?? 0) > 0)
    .reduce((s, o) => s + Math.round((o.cancelFee ?? 0) * 0.85 / 50) * 50, 0);

  const data = tab === 'new' ? newOrders : tab === 'kitchen' ? kitchen : done;

  if (!resto) {
    return (
      <SafeAreaView style={st.safe} edges={['top']}>
        <View style={{ padding: 24, alignItems: 'center' }}>
          <Text style={{ fontSize: 16, fontWeight: '800', color: colors.text }}>Compte restaurant introuvable</Text>
          <Pressable style={[st.logoutBtn, { marginTop: 16 }]} onPress={logout}>
            <Ionicons name="log-out-outline" size={20} color={colors.danger} />
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={st.safe} edges={['top']}>
      {/* En-tête restaurant connecté */}
      <View style={st.header}>
        <View style={[st.avatar, { backgroundColor: resto.color }]}>
          <Text style={{ fontSize: 24 }}>{resto.emoji}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={st.name} numberOfLines={1}>{resto.name}</Text>
          <Text style={st.meta}>{resto.quartier} • Ouvert • ⭐ {resto.rating}</Text>
        </View>
        <Pressable style={st.logoutBtn} onPress={logout}>
          <Ionicons name="log-out-outline" size={20} color={colors.danger} />
        </Pressable>
      </View>

      {/* Revenus */}
      <View style={st.revCard}>
        <View style={{ flex: 1 }}>
          <Text style={st.revLabel}>Revenus (85% des articles)</Text>
          <Text style={st.revValue}>{fcfa(revenue)}</Text>
        </View>
        <View style={st.revDivider} />
        <View style={{ alignItems: 'center', paddingHorizontal: 12 }}>
          <Text style={st.revCount}>{newOrders.length}</Text>
          <Text style={st.revCountLabel}>nouvelles</Text>
        </View>
        <View style={st.revDivider} />
        <View style={{ alignItems: 'center', paddingHorizontal: 12 }}>
          <Text style={st.revCount}>{fcfa(penaltiesReceived)}</Text>
          <Text style={st.revCountLabel}>pénalités</Text>
        </View>
      </View>

      {/* Accès gestion du menu */}
      <Pressable style={st.menuLink} onPress={() => nav.navigate('RestaurantMenu')}>
        <View style={st.menuLinkIcon}>
          <Ionicons name="book" size={19} color={colors.primaryDark} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={st.menuLinkTitle}>Gérer mon menu</Text>
          <Text style={st.menuLinkSub}>
            {menu.length} plat{menu.length > 1 ? 's' : ''}
            {promoCount > 0 ? ` • ${promoCount} en promo 🏷️` : ''}
            {offCount > 0 ? ` • ${offCount} épuisé${offCount > 1 ? 's' : ''}` : ''}
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
      </Pressable>

      {/* Onglets */}
      <View style={st.tabs}>
        {[
          { id: 'new' as const, label: `Nouvelles (${newOrders.length})` },
          { id: 'kitchen' as const, label: `En cuisine (${kitchen.length})` },
          { id: 'done' as const, label: `Passées (${done.length})` },
        ].map((t) => (
          <Pressable key={t.id} style={[st.tabBtn, tab === t.id && st.tabActive]} onPress={() => setTab(t.id)}>
            <Text style={[st.tabText, tab === t.id && { color: '#fff' }]}>{t.label}</Text>
          </Pressable>
        ))}
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
            icon={tab === 'new' ? 'notifications-outline' : tab === 'kitchen' ? 'flame-outline' : 'checkmark-done-outline'}
            title={tab === 'new' ? 'Aucune nouvelle commande' : tab === 'kitchen' ? 'Rien en cuisine' : 'Aucune commande passée'}
            subtitle={tab === 'new'
              ? `Les commandes passées chez ${resto.name} arrivent ici en temps réel.`
              : tab === 'kitchen'
              ? 'Acceptez une commande pour la voir ici.'
              : 'Votre historique apparaîtra ici.'}
          />
        }
        renderItem={({ item: o }) => {
          const p = effectiveProgress(o);
          const s = statusLabel(o);
          const itemsTotal = o.items?.reduce((sum, l) => sum + l.price * l.qty, 0) ?? 0;
          return (
            <View style={st.card}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <View style={st.cardBadge}>
                  <Text style={st.cardBadgeText}>{o.id}</Text>
                </View>
                <Text style={st.cardTime}>
                  {new Date(o.createdAt).getHours().toString().padStart(2, '0')}:
                  {new Date(o.createdAt).getMinutes().toString().padStart(2, '0')}
                </Text>
                <View style={{ flex: 1 }} />
                <Text style={st.cardTotal}>{fcfa(itemsTotal)}</Text>
              </View>

              {/* Articles */}
              <View style={{ marginTop: 10 }}>
                {o.items?.map((l) => (
                  <View key={l.itemId} style={st.itemRow}>
                    <Text style={st.itemQty}>{l.qty}×</Text>
                    <Text style={st.itemName}>{l.emoji} {l.name}</Text>
                    <Text style={st.itemPrice}>{fcfa(l.price * l.qty)}</Text>
                  </View>
                ))}
              </View>

              <View style={st.divider} />
              <Text style={st.deliverTo} numberOfLines={1}>
                📍 {o.details.find((d) => d.label === 'Livraison à')?.value ?? o.subtitle}
              </Text>

              {/* Actions selon l'état */}
              {o.cancelledAt ? (
                <View style={st.cancelRow}>
                  <Ionicons name="close-circle" size={15} color={colors.danger} />
                  <Text style={st.cancelText}>
                    Annulée — {o.cancelReason}
                    {(o.cancelFee ?? 0) > 0 ? ` • pénalité perçue : ${fcfa(Math.round((o.cancelFee ?? 0) * 0.85 / 50) * 50)}` : ''}
                  </Text>
                </View>
              ) : tab === 'new' ? (
                <Pressable
                  style={st.acceptBtn}
                  onPress={() => {
                    acceptOrderResto(o.id);
                    advanceOrder(o.id); // passe en préparation
                  }}
                >
                  <Ionicons name="checkmark-circle" size={18} color="#fff" />
                  <Text style={st.acceptText}>Accepter et lancer la préparation</Text>
                </Pressable>
              ) : tab === 'kitchen' ? (
                <Pressable style={[st.acceptBtn, { backgroundColor: colors.accent }]} onPress={() => advanceOrder(o.id)}>
                  <Ionicons name="restaurant" size={18} color="#fff" />
                  <Text style={st.acceptText}>Plat prêt — remettre au livreur</Text>
                </Pressable>
              ) : (
                <View style={st.doneRow}>
                  <Ionicons name={p >= 3 ? 'checkmark-done' : 'bicycle'} size={15} color={colors.primary} />
                  <Text style={st.doneText}>{s.text}</Text>
                </View>
              )}
            </View>
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
    width: 50, height: 50, borderRadius: 25,
    alignItems: 'center', justifyContent: 'center',
  },
  name: { fontSize: 17, fontWeight: '800', color: colors.text },
  meta: { fontSize: 12.5, color: colors.textMuted, fontWeight: '600', marginTop: 1 },
  logoutBtn: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: '#fff',
    alignItems: 'center', justifyContent: 'center', ...shadow,
  },
  revCard: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: colors.primaryDark,
    marginHorizontal: 20, marginTop: 14, borderRadius: radius.lg, padding: 18, ...shadow,
  },
  revLabel: { color: 'rgba(255,255,255,0.8)', fontSize: 12, fontWeight: '600' },
  revValue: { color: '#fff', fontSize: 21, fontWeight: '800', marginTop: 3 },
  revDivider: { width: 1, height: 36, backgroundColor: 'rgba(255,255,255,0.25)' },
  revCount: { color: '#fff', fontSize: 14, fontWeight: '800' },
  revCountLabel: { color: 'rgba(255,255,255,0.8)', fontSize: 10.5, marginTop: 2 },
  menuLink: {
    flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#fff',
    marginHorizontal: 20, marginTop: 12, borderRadius: radius.md, padding: 14, ...shadow,
  },
  menuLinkIcon: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: colors.primaryLight,
    alignItems: 'center', justifyContent: 'center',
  },
  menuLinkTitle: { fontSize: 14.5, fontWeight: '800', color: colors.text },
  menuLinkSub: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  tabs: { flexDirection: 'row', gap: 8, paddingHorizontal: 20, marginTop: 14, marginBottom: 12 },
  tabBtn: {
    flex: 1, paddingVertical: 10, borderRadius: 999, backgroundColor: '#fff',
    alignItems: 'center', borderWidth: 1, borderColor: colors.border,
  },
  tabActive: { backgroundColor: colors.primaryDark, borderColor: colors.primaryDark },
  tabText: { fontSize: 12, fontWeight: '700', color: colors.text },
  card: { backgroundColor: '#fff', borderRadius: radius.md, padding: 16, marginBottom: 12, ...shadow },
  cardBadge: { backgroundColor: colors.primaryLight, paddingHorizontal: 9, paddingVertical: 4, borderRadius: 8 },
  cardBadgeText: { fontSize: 11.5, fontWeight: '800', color: colors.primaryDark },
  cardTime: { fontSize: 12, color: colors.textMuted, fontWeight: '600' },
  cardTotal: { fontSize: 15, fontWeight: '800', color: colors.text },
  itemRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 4 },
  itemQty: { fontSize: 13, fontWeight: '800', color: colors.primaryDark, width: 26 },
  itemName: { flex: 1, fontSize: 13.5, color: colors.text, fontWeight: '600' },
  itemPrice: { fontSize: 12.5, color: colors.textMuted, fontWeight: '600' },
  divider: { height: 1, backgroundColor: colors.border, marginVertical: 10 },
  deliverTo: { fontSize: 12.5, color: colors.textMuted, fontWeight: '600' },
  acceptBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: colors.primary, borderRadius: radius.sm, paddingVertical: 13, marginTop: 12,
  },
  acceptText: { color: '#fff', fontSize: 14, fontWeight: '800' },
  cancelRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 12 },
  cancelText: { flex: 1, fontSize: 12, color: colors.danger, fontWeight: '600' },
  doneRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 12 },
  doneText: { fontSize: 12.5, color: colors.primaryDark, fontWeight: '700' },
});
