import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import { colors, radius, shadow, fcfa } from '../lib/theme';
import { RESTAURANTS } from '../lib/data';
import { useStore, statusLabel } from '../lib/store';
import { SectionTitle, Card } from '../components/ui';

export default function HomeScreen() {
  const nav = useNavigation<any>();
  const { userName, defaultQuartier, orders, favorites, toggleFavorite } = useStore();
  const active = orders.find((o) => !statusLabel(o).done);
  const top = useMemo(() => [...RESTAURANTS].sort((a, b) => b.rating - a.rating).slice(0, 3), []);
  const fast = useMemo(
    () => [...RESTAURANTS].sort((a, b) => parseInt(a.deliveryTime) - parseInt(b.deliveryTime)).slice(0, 5),
    []
  );

  return (
    <SafeAreaView style={st.safe} edges={['top']}>
      <ScrollView contentContainerStyle={{ paddingBottom: 32 }} showsVerticalScrollIndicator={false}>
        <View style={st.header}>
          <View style={{ flex: 1 }}>
            <Text style={st.hello}>Mbolo, {userName.split(' ')[0]} 👋</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Ionicons name="location" size={14} color={colors.primary} />
              <Text style={st.loc}>{defaultQuartier}, Libreville • Gabon</Text>
            </View>
          </View>
          <Pressable style={st.iconBtn} onPress={() => nav.navigate('Favorites')}>
            <Ionicons name="heart" size={20} color={colors.danger} />
            {favorites.length > 0 && (
              <View style={st.favBadge}>
                <Text style={st.favBadgeText}>{favorites.length}</Text>
              </View>
            )}
          </Pressable>
          <Pressable style={st.avatar} onPress={() => nav.navigate('Profil')}>
            <Text style={{ fontSize: 22 }}>🇬🇦</Text>
          </Pressable>
        </View>

        {active && (
          <Pressable style={st.banner} onPress={() => nav.navigate('OrderDetail', { orderId: active.id })}>
            <View style={st.bannerPulse}>
              <Ionicons name="bicycle" size={22} color="#fff" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={st.bannerTitle}>{active.title}</Text>
              <Text style={st.bannerSub}>{statusLabel(active).text}</Text>
            </View>
            <Pressable
              style={st.bannerChat}
              hitSlop={8}
              onPress={() => nav.navigate('Chat', { orderId: active.id })}
            >
              <Ionicons name="chatbubble-ellipses" size={18} color={colors.primary} />
            </Pressable>
            <Ionicons name="chevron-forward" size={20} color="#fff" />
          </Pressable>
        )}

        <View style={st.pad}>
          <SectionTitle title="Que peut-on faire pour vous ?" />
          <View style={st.services}>
            <Pressable style={[st.service, { backgroundColor: colors.primaryLight }]} onPress={() => nav.navigate('RestosTab')}>
              <Text style={st.serviceEmoji}>🍽️</Text>
              <Text style={st.serviceTitle}>Restaurants</Text>
              <Text style={st.serviceDesc}>Vos plats préférés livrés chauds</Text>
              <View style={[st.serviceArrow, { backgroundColor: colors.primary }]}>
                <Ionicons name="arrow-forward" size={14} color="#fff" />
              </View>
            </Pressable>
            <Pressable style={[st.service, { backgroundColor: colors.accentLight }]} onPress={() => nav.navigate('Colis')}>
              <Text style={st.serviceEmoji}>📦</Text>
              <Text style={st.serviceTitle}>Envoi de colis</Text>
              <Text style={st.serviceDesc}>Entre particuliers, en main propre</Text>
              <View style={[st.serviceArrow, { backgroundColor: colors.accent }]}>
                <Ionicons name="arrow-forward" size={14} color="#fff" />
              </View>
            </Pressable>
            <Pressable style={[st.service, { backgroundColor: colors.primaryLight, width: '100%', minHeight: 0 }]} onPress={() => nav.navigate('Course')}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
                <Text style={st.serviceEmoji}>🏃</Text>
                <View style={{ flex: 1 }}>
                  <Text style={st.serviceTitle}>Courses personnalisées</Text>
                  <Text style={[st.serviceDesc, { paddingRight: 0 }]}>Achats, marché, recueil d'infos, démarches… votre coursier personnel</Text>
                </View>
                <View style={[st.serviceArrowInline, { backgroundColor: colors.primaryDark }]}>
                  <Ionicons name="arrow-forward" size={14} color="#fff" />
                </View>
              </View>
            </Pressable>
          </View>
        </View>

        <View style={{ paddingLeft: 20 }}>
          <SectionTitle title="⚡ Livrés en un éclair" />
        </View>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={fast}
          keyExtractor={(r) => r.id}
          contentContainerStyle={{ paddingHorizontal: 20, gap: 12 }}
          renderItem={({ item: r }) => (
            <Pressable style={st.hCard} onPress={() => nav.navigate('Restaurant', { id: r.id })}>
              <View style={[st.hCover, { backgroundColor: r.color }]}>
                <Text style={{ fontSize: 40 }}>{r.emoji}</Text>
                <Pressable style={st.heart} hitSlop={8} onPress={() => toggleFavorite(r.id)}>
                  <Ionicons
                    name={favorites.includes(r.id) ? 'heart' : 'heart-outline'}
                    size={18}
                    color={favorites.includes(r.id) ? colors.danger : colors.text}
                  />
                </Pressable>
              </View>
              <Text style={st.hName} numberOfLines={1}>{r.name}</Text>
              <Text style={st.hMeta}>⏱ {r.deliveryTime} • ⭐ {r.rating}</Text>
            </Pressable>
          )}
        />

        <View style={st.pad}>
          <SectionTitle title="Top restos à Libreville" action="Tout voir" onAction={() => nav.navigate('RestosTab')} />
          {top.map((r) => (
            <Pressable key={r.id} onPress={() => nav.navigate('Restaurant', { id: r.id })}>
              <Card style={{ marginBottom: 12, flexDirection: 'row', alignItems: 'center', gap: 14 }}>
                <View style={[st.restoEmoji, { backgroundColor: r.color }]}>
                  <Text style={{ fontSize: 30 }}>{r.emoji}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={st.restoName}>{r.name}</Text>
                  <Text style={st.restoMeta}>{r.cuisine} • {r.quartier}</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 4 }}>
                    <View style={st.rating}>
                      <Ionicons name="star" size={12} color={colors.accent} />
                      <Text style={st.ratingText}>{r.rating}</Text>
                    </View>
                    <Text style={st.restoMeta}>{r.deliveryTime}</Text>
                    <Text style={st.restoMeta}>{fcfa(r.deliveryFee)}</Text>
                  </View>
                </View>
                <Pressable hitSlop={10} onPress={() => toggleFavorite(r.id)}>
                  <Ionicons
                    name={favorites.includes(r.id) ? 'heart' : 'heart-outline'}
                    size={22}
                    color={favorites.includes(r.id) ? colors.danger : colors.textMuted}
                  />
                </Pressable>
              </Card>
            </Pressable>
          ))}

          <Card style={{ backgroundColor: colors.primaryDark, marginTop: 8 }}>
            <Text style={{ fontSize: 26 }}>🛵</Text>
            <Text style={st.promoTitle}>Livraison partout à Libreville</Text>
            <Text style={st.promoSub}>
              De Glass à Akanda, d'Owendo au PK8 — nos livreurs connaissent chaque quartier. Paiement à la livraison, Airtel Money ou Moov Money.
            </Text>
          </Card>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const st = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 12, paddingBottom: 4, gap: 10 },
  hello: { fontSize: 22, fontWeight: '800', color: colors.text },
  loc: { fontSize: 13, color: colors.textMuted, fontWeight: '600' },
  iconBtn: {
    width: 46, height: 46, borderRadius: 23, backgroundColor: '#fff',
    alignItems: 'center', justifyContent: 'center', ...shadow,
  },
  favBadge: {
    position: 'absolute', top: -2, right: -2, backgroundColor: colors.danger, borderRadius: 8,
    minWidth: 16, height: 16, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 3,
  },
  favBadgeText: { color: '#fff', fontSize: 9.5, fontWeight: '800' },
  avatar: {
    width: 46, height: 46, borderRadius: 23, backgroundColor: '#fff',
    alignItems: 'center', justifyContent: 'center', ...shadow,
  },
  banner: {
    marginHorizontal: 20, marginTop: 14, backgroundColor: colors.primary,
    borderRadius: radius.lg, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 12, ...shadow,
  },
  bannerPulse: { width: 42, height: 42, borderRadius: 21, backgroundColor: 'rgba(255,255,255,0.25)', alignItems: 'center', justifyContent: 'center' },
  bannerChat: {
    width: 36, height: 36, borderRadius: 18, backgroundColor: '#fff',
    alignItems: 'center', justifyContent: 'center',
  },
  bannerTitle: { color: '#fff', fontWeight: '800', fontSize: 15 },
  bannerSub: { color: 'rgba(255,255,255,0.85)', fontSize: 13, marginTop: 2 },
  pad: { paddingHorizontal: 20, paddingTop: 8 },
  services: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 4 },
  service: {
    width: '47.8%', borderRadius: radius.lg, padding: 16, minHeight: 130, position: 'relative',
  },
  serviceEmoji: { fontSize: 30, marginBottom: 8 },
  serviceTitle: { fontSize: 15.5, fontWeight: '800', color: colors.text, marginBottom: 4 },
  serviceDesc: { fontSize: 12.5, color: colors.textMuted, lineHeight: 17, paddingRight: 20 },
  serviceArrow: {
    position: 'absolute', bottom: 12, right: 12, width: 26, height: 26, borderRadius: 13,
    alignItems: 'center', justifyContent: 'center',
  },
  serviceArrowInline: {
    width: 26, height: 26, borderRadius: 13, alignItems: 'center', justifyContent: 'center',
  },
  hCard: { width: 160 },
  hCover: {
    height: 100, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center', marginBottom: 8,
  },
  heart: {
    position: 'absolute', top: 8, right: 8, width: 30, height: 30, borderRadius: 15,
    backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', ...shadow,
  },
  hName: { fontSize: 13.5, fontWeight: '800', color: colors.text },
  hMeta: { fontSize: 12, color: colors.textMuted, fontWeight: '600', marginTop: 2 },
  restoEmoji: { width: 58, height: 58, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  restoName: { fontSize: 15.5, fontWeight: '800', color: colors.text },
  restoMeta: { fontSize: 12.5, color: colors.textMuted, fontWeight: '600' },
  rating: { flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: colors.accentLight, paddingHorizontal: 7, paddingVertical: 2, borderRadius: 8 },
  ratingText: { fontSize: 12, fontWeight: '800', color: colors.accentDark },
  promoTitle: { color: '#fff', fontSize: 17, fontWeight: '800', marginTop: 8, marginBottom: 6 },
  promoSub: { color: 'rgba(255,255,255,0.85)', fontSize: 13.5, lineHeight: 20 },
});
