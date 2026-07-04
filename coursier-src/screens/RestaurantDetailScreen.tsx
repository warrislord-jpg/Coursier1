import React from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { colors, radius, shadow, fcfa } from '../lib/theme';
import { RESTAURANTS } from '../lib/data';
import { useStore, effectivePrice } from '../lib/store';

export default function RestaurantDetailScreen() {
  const nav = useNavigation<any>();
  const route = useRoute<any>();
  const resto = RESTAURANTS.find((r) => r.id === route.params?.id) ?? RESTAURANTS[0];
  const { cart, cartRestaurant, addToCart, changeQty, favorites, toggleFavorite, getMenu } = useStore();
  // Menu géré par le restaurant (plats postés, prix, promos, disponibilité)
  const menu = getMenu(resto.id);
  const isFav = favorites.includes(resto.id);
  const cartForThis = cartRestaurant?.id === resto.id ? cart : [];
  const total = cartForThis.reduce((s, l) => s + l.price * l.qty, 0);
  const count = cartForThis.reduce((s, l) => s + l.qty, 0);

  return (
    <SafeAreaView style={st.safe} edges={['top']}>
      <View style={[st.cover, { backgroundColor: resto.color }]}>
        <Pressable style={st.back} onPress={() => nav.goBack()}>
          <Ionicons name="arrow-back" size={20} color={colors.text} />
        </Pressable>
        <Pressable style={st.favBtn} onPress={() => toggleFavorite(resto.id)}>
          <Ionicons name={isFav ? 'heart' : 'heart-outline'} size={22} color={isFav ? colors.danger : colors.text} />
        </Pressable>
        <Text style={{ fontSize: 64 }}>{resto.emoji}</Text>
      </View>
      <View style={st.info}>
        <Text style={st.name}>{resto.name}</Text>
        <Text style={st.meta}>{resto.cuisine} • {resto.quartier}, Libreville</Text>
        <View style={st.statsRow}>
          <View style={st.stat}>
            <Ionicons name="star" size={14} color={colors.accent} />
            <Text style={st.statText}>{resto.rating} ({resto.reviews} avis)</Text>
          </View>
          <View style={st.stat}>
            <Ionicons name="time" size={14} color={colors.primary} />
            <Text style={st.statText}>{resto.deliveryTime}</Text>
          </View>
          <View style={st.stat}>
            <Ionicons name="bicycle" size={14} color={colors.primary} />
            <Text style={st.statText}>{fcfa(resto.deliveryFee)}</Text>
          </View>
        </View>
      </View>

      <FlatList
        data={menu}
        keyExtractor={(m) => m.id}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: count > 0 ? 110 : 32 }}
        ListHeaderComponent={<Text style={st.menuTitle}>Menu</Text>}
        renderItem={({ item: m }) => {
          const line = cartForThis.find((l) => l.itemId === m.id);
          const price = effectivePrice(m);
          const hasPromo = m.promoPrice != null && m.promoPrice > 0 && m.promoPrice < m.price;
          const off = m.available === false;
          return (
            <View style={[st.menuItem, off && { opacity: 0.5 }]}>
              {m.photo ? (
                <Image source={{ uri: m.photo }} style={st.menuPhoto} />
              ) : (
                <View style={st.menuEmoji}><Text style={{ fontSize: 26 }}>{m.emoji}</Text></View>
              )}
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                  <Text style={st.menuName}>{m.name}</Text>
                  {hasPromo && !off && (
                    <View style={st.promoTag}>
                      <Text style={st.promoTagText}>🏷️ −{Math.round((1 - price / m.price) * 100)}%</Text>
                    </View>
                  )}
                  {off && (
                    <View style={st.offTag}>
                      <Text style={st.offTagText}>Épuisé</Text>
                    </View>
                  )}
                </View>
                <Text style={st.menuDesc} numberOfLines={2}>{m.desc}</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 }}>
                  {hasPromo && <Text style={st.menuPriceStruck}>{fcfa(m.price)}</Text>}
                  <Text style={[st.menuPrice, hasPromo && { color: colors.accentDark }]}>{fcfa(price)}</Text>
                </View>
              </View>
              {off ? null : line ? (
                <View style={st.qtyRow}>
                  <Pressable style={st.qtyBtn} onPress={() => changeQty(m.id, -1)}>
                    <Ionicons name="remove" size={16} color={colors.primaryDark} />
                  </Pressable>
                  <Text style={st.qty}>{line.qty}</Text>
                  <Pressable style={[st.qtyBtn, { backgroundColor: colors.primary }]} onPress={() => changeQty(m.id, 1)}>
                    <Ionicons name="add" size={16} color="#fff" />
                  </Pressable>
                </View>
              ) : (
                <Pressable
                  style={st.addBtn}
                  onPress={() => addToCart(resto, { itemId: m.id, name: m.name, price, emoji: m.emoji })}
                >
                  <Ionicons name="add" size={20} color="#fff" />
                </Pressable>
              )}
            </View>
          );
        }}
      />

      {count > 0 && (
        <Pressable style={st.cartBar} onPress={() => nav.navigate('Cart')}>
          <View style={st.cartCount}><Text style={st.cartCountText}>{count}</Text></View>
          <Text style={st.cartBarText}>Voir le panier</Text>
          <Text style={st.cartBarTotal}>{fcfa(total)}</Text>
        </Pressable>
      )}
    </SafeAreaView>
  );
}

const st = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  cover: { height: 150, alignItems: 'center', justifyContent: 'center' },
  back: {
    position: 'absolute', top: 12, left: 16, width: 40, height: 40, borderRadius: 20,
    backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', zIndex: 2, ...shadow,
  },
  favBtn: {
    position: 'absolute', top: 12, right: 16, width: 40, height: 40, borderRadius: 20,
    backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', zIndex: 2, ...shadow,
  },
  info: { backgroundColor: '#fff', paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: colors.border },
  name: { fontSize: 22, fontWeight: '800', color: colors.text },
  meta: { fontSize: 13.5, color: colors.textMuted, fontWeight: '600', marginTop: 3 },
  statsRow: { flexDirection: 'row', gap: 14, marginTop: 10 },
  stat: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  statText: { fontSize: 12.5, fontWeight: '700', color: colors.text },
  menuTitle: { fontSize: 19, fontWeight: '800', color: colors.text, marginTop: 18, marginBottom: 10 },
  menuItem: {
    flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#fff',
    borderRadius: radius.md, padding: 14, marginBottom: 10, ...shadow,
  },
  menuEmoji: { width: 50, height: 50, borderRadius: 12, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center' },
  menuPhoto: { width: 50, height: 50, borderRadius: 12, backgroundColor: colors.bg },
  menuName: { fontSize: 15, fontWeight: '800', color: colors.text },
  menuDesc: { fontSize: 12.5, color: colors.textMuted, marginTop: 2, lineHeight: 17 },
  menuPrice: { fontSize: 14, fontWeight: '800', color: colors.primaryDark },
  menuPriceStruck: { fontSize: 12.5, fontWeight: '600', color: colors.textMuted, textDecorationLine: 'line-through' },
  promoTag: { backgroundColor: colors.accentLight, paddingHorizontal: 7, paddingVertical: 2, borderRadius: 6 },
  promoTagText: { fontSize: 10, fontWeight: '800', color: colors.accentDark },
  offTag: { backgroundColor: colors.dangerLight, paddingHorizontal: 7, paddingVertical: 2, borderRadius: 6 },
  offTagText: { fontSize: 10, fontWeight: '800', color: colors.danger },
  addBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  qtyRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  qtyBtn: { width: 30, height: 30, borderRadius: 15, backgroundColor: colors.primaryLight, alignItems: 'center', justifyContent: 'center' },
  qty: { fontSize: 15, fontWeight: '800', color: colors.text, minWidth: 18, textAlign: 'center' },
  cartBar: {
    position: 'absolute', bottom: 20, left: 20, right: 20, backgroundColor: colors.primary,
    borderRadius: radius.md, paddingVertical: 16, paddingHorizontal: 18,
    flexDirection: 'row', alignItems: 'center', ...shadow,
  },
  cartCount: { width: 26, height: 26, borderRadius: 13, backgroundColor: 'rgba(255,255,255,0.3)', alignItems: 'center', justifyContent: 'center' },
  cartCountText: { color: '#fff', fontWeight: '800', fontSize: 13 },
  cartBarText: { flex: 1, color: '#fff', fontWeight: '800', fontSize: 16, textAlign: 'center' },
  cartBarTotal: { color: '#fff', fontWeight: '800', fontSize: 15 },
});
