import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, TextInput, RefreshControl, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { colors, radius, fcfa } from '../lib/theme';
import { RESTAURANTS } from '../lib/data';
import { useStore } from '../lib/store';
import { Card, EmptyState } from '../components/ui';

const CUISINES = ['Tous', 'Gabonaise', 'Grillades', 'Fast Food', 'Poissons & Fruits de mer', 'Africaine moderne', 'Street Food'];

export default function RestaurantsScreen() {
  const nav = useNavigation<any>();
  const route = useRoute<any>();
  const { favorites, toggleFavorite } = useStore();
  const [query, setQuery] = useState('');
  const [cuisine, setCuisine] = useState('Tous');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (route.params?.cuisine) {
      setCuisine(route.params.cuisine);
      nav.setParams({ cuisine: undefined });
    }
  }, [route.params?.cuisine]);

  const data = useMemo(() => {
    const q = query.toLowerCase();
    return RESTAURANTS.filter(
      (r) =>
        (cuisine === 'Tous' || r.cuisine === cuisine) &&
        (r.name.toLowerCase().includes(q) ||
          r.quartier.toLowerCase().includes(q) ||
          r.menu.some((m) => m.name.toLowerCase().includes(q)))
    );
  }, [query, cuisine]);

  return (
    <SafeAreaView style={st.safe} edges={['top']}>
      <View style={st.headerPad}>
        <Text style={st.title}>Restaurants 🍽️</Text>
        <View style={st.search}>
          <Ionicons name="search" size={18} color={colors.textMuted} />
          <TextInput
            placeholder="Chercher un resto ou un quartier…"
            placeholderTextColor={colors.textMuted}
            value={query}
            onChangeText={setQuery}
            style={st.searchInput}
            returnKeyType="search"
          />
          {query.length > 0 && (
            <Pressable onPress={() => setQuery('')}>
              <Ionicons name="close-circle" size={18} color={colors.textMuted} />
            </Pressable>
          )}
        </View>
      </View>
      <View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 12 }}>
          {CUISINES.map((c) => (
            <Pressable
              key={c}
              onPress={() => setCuisine(c)}
              style={[st.chip, cuisine === c && st.chipActive]}
            >
              <Text style={[st.chipText, cuisine === c && { color: '#fff' }]}>{c}</Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>
      <FlatList
        data={data}
        keyExtractor={(r) => r.id}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 32 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); setTimeout(() => setRefreshing(false), 700); }} tintColor={colors.primary} />
        }
        ListEmptyComponent={
          <EmptyState icon="restaurant-outline" title="Aucun restaurant trouvé" subtitle="Essayez un autre nom ou un autre quartier de Libreville." />
        }
        renderItem={({ item: r }) => (
          <Pressable onPress={() => nav.navigate('Restaurant', { id: r.id })}>
            <Card style={{ marginBottom: 14, padding: 0, overflow: 'hidden' }}>
              <View style={[st.cover, { backgroundColor: r.color }]}>
                <Text style={{ fontSize: 52 }}>{r.emoji}</Text>
                <Pressable style={st.heart} hitSlop={8} onPress={() => toggleFavorite(r.id)}>
                  <Ionicons
                    name={favorites.includes(r.id) ? 'heart' : 'heart-outline'}
                    size={19}
                    color={favorites.includes(r.id) ? colors.danger : colors.text}
                  />
                </Pressable>
                <View style={st.timeBadge}>
                  <Ionicons name="time" size={12} color={colors.primaryDark} />
                  <Text style={st.timeText}>{r.deliveryTime}</Text>
                </View>
              </View>
              <View style={{ padding: 16 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text style={st.name}>{r.name}</Text>
                  <View style={st.rating}>
                    <Ionicons name="star" size={12} color={colors.accent} />
                    <Text style={st.ratingText}>{r.rating} ({r.reviews})</Text>
                  </View>
                </View>
                <Text style={st.meta}>{r.cuisine} • {r.quartier} • Livraison {fcfa(r.deliveryFee)}</Text>
                <View style={{ flexDirection: 'row', gap: 6, marginTop: 8 }}>
                  {r.tags.map((t) => (
                    <View key={t} style={st.tag}><Text style={st.tagText}>{t}</Text></View>
                  ))}
                </View>
              </View>
            </Card>
          </Pressable>
        )}
      />
    </SafeAreaView>
  );
}

const st = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  headerPad: { paddingHorizontal: 20, paddingTop: 12 },
  title: { fontSize: 24, fontWeight: '800', color: colors.text, marginBottom: 14 },
  search: {
    flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#fff',
    borderRadius: radius.md, paddingHorizontal: 14, paddingVertical: 12,
    borderWidth: 1, borderColor: colors.border, marginBottom: 14,
  },
  searchInput: { flex: 1, fontSize: 15, color: colors.text },
  chip: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999, backgroundColor: '#fff',
    borderWidth: 1, borderColor: colors.border, marginRight: 8,
  },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { color: colors.text, fontWeight: '600', fontSize: 13 },
  cover: { height: 110, alignItems: 'center', justifyContent: 'center' },
  heart: {
    position: 'absolute', top: 10, right: 10, width: 32, height: 32, borderRadius: 16,
    backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center',
  },
  timeBadge: {
    position: 'absolute', bottom: 10, right: 10, flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: '#fff', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999,
  },
  timeText: { fontSize: 12, fontWeight: '700', color: colors.primaryDark },
  name: { fontSize: 16.5, fontWeight: '800', color: colors.text, flex: 1, marginRight: 8 },
  rating: { flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: colors.accentLight, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  ratingText: { fontSize: 11.5, fontWeight: '800', color: colors.accentDark },
  meta: { fontSize: 13, color: colors.textMuted, fontWeight: '600', marginTop: 4 },
  tag: { backgroundColor: colors.primaryLight, paddingHorizontal: 9, paddingVertical: 4, borderRadius: 8 },
  tagText: { fontSize: 11.5, fontWeight: '700', color: colors.primaryDark },
});
