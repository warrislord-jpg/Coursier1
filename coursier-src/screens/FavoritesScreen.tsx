import React from 'react';
import { View, Text, StyleSheet, FlatList, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import { colors, radius, shadow, fcfa } from '../lib/theme';
import { RESTAURANTS } from '../lib/data';
import { useStore } from '../lib/store';
import { Card, EmptyState, Button } from '../components/ui';

export default function FavoritesScreen() {
  const nav = useNavigation<any>();
  const { favorites, toggleFavorite } = useStore();
  const data = RESTAURANTS.filter((r) => favorites.includes(r.id));

  return (
    <SafeAreaView style={st.safe} edges={['top']}>
      <View style={st.header}>
        <Pressable style={st.back} onPress={() => (nav.canGoBack() ? nav.goBack() : nav.navigate('Tabs'))}>
          <Ionicons name="arrow-back" size={20} color={colors.text} />
        </Pressable>
        <Text style={st.title}>Mes favoris ❤️</Text>
        <View style={{ width: 40 }} />
      </View>
      <FlatList
        data={data}
        keyExtractor={(r) => r.id}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 32, flexGrow: 1 }}
        ListEmptyComponent={
          <View style={{ flex: 1 }}>
            <EmptyState
              icon="heart-outline"
              title="Aucun favori pour l'instant"
              subtitle="Touchez le cœur sur un restaurant pour le retrouver ici en un clin d'œil."
            />
            <View style={{ paddingHorizontal: 20 }}>
              <Button
                title="Découvrir les restos"
                icon="restaurant"
                onPress={() => nav.navigate('Tabs', { screen: 'RestosTab' })}
              />
            </View>
          </View>
        }
        renderItem={({ item: r }) => (
          <Pressable onPress={() => nav.navigate('Restaurant', { id: r.id })}>
            <Card style={{ marginBottom: 12, flexDirection: 'row', alignItems: 'center', gap: 14 }}>
              <View style={[st.emoji, { backgroundColor: r.color }]}>
                <Text style={{ fontSize: 30 }}>{r.emoji}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={st.name}>{r.name}</Text>
                <Text style={st.meta}>{r.cuisine} • {r.quartier}</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 4 }}>
                  <View style={st.rating}>
                    <Ionicons name="star" size={12} color={colors.accent} />
                    <Text style={st.ratingText}>{r.rating}</Text>
                  </View>
                  <Text style={st.meta}>{r.deliveryTime}</Text>
                  <Text style={st.meta}>{fcfa(r.deliveryFee)}</Text>
                </View>
              </View>
              <Pressable hitSlop={10} onPress={() => toggleFavorite(r.id)}>
                <Ionicons name="heart" size={24} color={colors.danger} />
              </Pressable>
            </Card>
          </Pressable>
        )}
      />
    </SafeAreaView>
  );
}

const st = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10, marginBottom: 4 },
  back: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', ...shadow },
  title: { flex: 1, textAlign: 'center', fontSize: 18, fontWeight: '800', color: colors.text },
  emoji: { width: 58, height: 58, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  name: { fontSize: 15.5, fontWeight: '800', color: colors.text },
  meta: { fontSize: 12.5, color: colors.textMuted, fontWeight: '600' },
  rating: { flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: colors.accentLight, paddingHorizontal: 7, paddingVertical: 2, borderRadius: 8 },
  ratingText: { fontSize: 12, fontWeight: '800', color: colors.accentDark },
});
