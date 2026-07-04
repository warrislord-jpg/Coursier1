import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import { colors, radius, shadow, fcfa } from '../lib/theme';
import { PLATFORM_VAT_REGISTERED, TVA_RATE } from '../lib/invoice';
import { useStore } from '../lib/store';
import { Button, EmptyState } from '../components/ui';
import QuartierPicker from '../components/QuartierPicker';

const PAYMENTS = [
  { id: 'cash', label: 'Espèces à la livraison', icon: 'cash' as const },
  { id: 'airtel', label: 'Airtel Money', icon: 'phone-portrait' as const },
  { id: 'moov', label: 'Moov Money', icon: 'phone-portrait' as const },
];

export default function CartScreen() {
  const nav = useNavigation<any>();
  const { cart, cartRestaurant, changeQty, clearCart, placeOrder, defaultQuartier } = useStore();
  const [quartier, setQuartier] = useState(defaultQuartier);
  const [address, setAddress] = useState('');
  const [payment, setPayment] = useState('cash');

  const subtotal = cart.reduce((s, l) => s + l.price * l.qty, 0);
  const fee = cartRestaurant?.deliveryFee ?? 0;
  const total = subtotal + fee;

  if (cart.length === 0 || !cartRestaurant) {
    return (
      <SafeAreaView style={st.safe} edges={['top']}>
        <Header onBack={() => nav.goBack()} />
        <EmptyState icon="cart-outline" title="Panier vide" subtitle="Ajoutez des plats depuis un restaurant pour commander." />
        <View style={{ paddingHorizontal: 20 }}>
          <Button title="Voir les restaurants" icon="restaurant" onPress={() => nav.navigate('Tabs', { screen: 'RestosTab' })} />
        </View>
      </SafeAreaView>
    );
  }

  const confirm = () => {
    const order = placeOrder({
      type: 'resto',
      restaurantId: cartRestaurant.id,
      title: `Commande • ${cartRestaurant.name}`,
      subtitle: `${cart.reduce((s, l) => s + l.qty, 0)} article(s) • ${quartier}`,
      total,
      items: cart,
      details: [
        { label: 'Restaurant', value: cartRestaurant.name },
        { label: 'Livraison à', value: `${quartier}${address ? ' — ' + address : ''}` },
        { label: 'Paiement', value: PAYMENTS.find((p) => p.id === payment)!.label },
        { label: 'Frais de livraison', value: fcfa(fee) },
        {
          label: 'TVA',
          value: PLATFORM_VAT_REGISTERED
            ? `${fcfa(Math.round(fee * TVA_RATE))} (18 % sur frais de service)`
            : 'Non applicable (CA < 60 M FCFA/an)',
        },
      ],
    });
    clearCart();
    nav.reset({ index: 1, routes: [{ name: 'Tabs' }, { name: 'OrderDetail', params: { orderId: order.id, justPlaced: true } }] });
  };

  return (
    <SafeAreaView style={st.safe} edges={['top']}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <Header onBack={() => nav.goBack()} />
        <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
          <Text style={st.section}>{cartRestaurant.emoji} {cartRestaurant.name}</Text>
          {cart.map((l) => (
            <View key={l.itemId} style={st.line}>
              <Text style={{ fontSize: 22 }}>{l.emoji}</Text>
              <View style={{ flex: 1 }}>
                <Text style={st.lineName}>{l.name}</Text>
                <Text style={st.linePrice}>{fcfa(l.price)}</Text>
              </View>
              <View style={st.qtyRow}>
                <Pressable style={st.qtyBtn} onPress={() => changeQty(l.itemId, -1)}>
                  <Ionicons name="remove" size={15} color={colors.primaryDark} />
                </Pressable>
                <Text style={st.qty}>{l.qty}</Text>
                <Pressable style={[st.qtyBtn, { backgroundColor: colors.primary }]} onPress={() => changeQty(l.itemId, 1)}>
                  <Ionicons name="add" size={15} color="#fff" />
                </Pressable>
              </View>
            </View>
          ))}

          <Text style={st.section}>Adresse de livraison</Text>
          <QuartierPicker label="Quartier" value={quartier} onChange={setQuartier} />
          <Text style={st.label}>Précisions (repère, rue, immeuble…)</Text>
          <TextInput
            style={st.input}
            placeholder="Ex : derrière la pharmacie, portail bleu…"
            placeholderTextColor={colors.textMuted}
            value={address}
            onChangeText={(t) => setAddress(t.slice(0, 200))}
            maxLength={200}
            multiline
          />

          <Text style={st.section}>Paiement</Text>
          {PAYMENTS.map((p) => (
            <Pressable key={p.id} style={[st.pay, payment === p.id && st.payActive]} onPress={() => setPayment(p.id)}>
              <Ionicons name={p.icon} size={20} color={payment === p.id ? colors.primary : colors.textMuted} />
              <Text style={[st.payText, payment === p.id && { color: colors.primaryDark }]}>{p.label}</Text>
              <Ionicons name={payment === p.id ? 'radio-button-on' : 'radio-button-off'} size={20} color={payment === p.id ? colors.primary : colors.border} />
            </Pressable>
          ))}

          <View style={st.totalCard}>
            <Row label="Sous-total" value={fcfa(subtotal)} />
            <Row label="Livraison" value={fcfa(fee)} />
            <View style={st.divider} />
            <Row label="Total" value={fcfa(total)} bold />
            <Text style={st.tvaNote}>
              {PLATFORM_VAT_REGISTERED
                ? `Dont TVA 18 % sur frais de service : ${fcfa(Math.round(fee * TVA_RATE))} — facture électronique fournie`
                : 'TVA non applicable (CA annuel < 60 M FCFA) — facture électronique normalisée fournie'}
            </Text>
          </View>

          <Button title={`Commander • ${fcfa(total)}`} icon="checkmark-circle" onPress={confirm} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function Header({ onBack }: { onBack: () => void }) {
  return (
    <View style={st.header}>
      <Pressable style={st.back} onPress={onBack}>
        <Ionicons name="arrow-back" size={20} color={colors.text} />
      </Pressable>
      <Text style={st.title}>Mon panier</Text>
      <View style={{ width: 40 }} />
    </View>
  );
}

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
      <Text style={[st.rowLabel, bold && st.rowBold]}>{label}</Text>
      <Text style={[st.rowValue, bold && st.rowBold]}>{value}</Text>
    </View>
  );
}

const st = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10 },
  back: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', ...shadow },
  title: { flex: 1, textAlign: 'center', fontSize: 18, fontWeight: '800', color: colors.text },
  section: { fontSize: 17, fontWeight: '800', color: colors.text, marginTop: 18, marginBottom: 10 },
  line: {
    flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#fff',
    borderRadius: radius.md, padding: 14, marginBottom: 8, ...shadow,
  },
  lineName: { fontSize: 14.5, fontWeight: '700', color: colors.text },
  linePrice: { fontSize: 13, fontWeight: '700', color: colors.primaryDark, marginTop: 2 },
  qtyRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  qtyBtn: { width: 28, height: 28, borderRadius: 14, backgroundColor: colors.primaryLight, alignItems: 'center', justifyContent: 'center' },
  qty: { fontSize: 14, fontWeight: '800', color: colors.text, minWidth: 16, textAlign: 'center' },
  label: { fontSize: 13, fontWeight: '700', color: colors.textMuted, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.4 },
  input: {
    backgroundColor: '#fff', borderWidth: 1, borderColor: colors.border, borderRadius: radius.md,
    paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: colors.text, minHeight: 60, textAlignVertical: 'top',
  },
  pay: {
    flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#fff',
    borderRadius: radius.md, padding: 15, marginBottom: 8, borderWidth: 1.5, borderColor: colors.border,
  },
  payActive: { borderColor: colors.primary, backgroundColor: colors.primaryLight },
  payText: { flex: 1, fontSize: 14.5, fontWeight: '700', color: colors.text },
  totalCard: { backgroundColor: '#fff', borderRadius: radius.md, padding: 16, marginVertical: 16, ...shadow },
  divider: { height: 1, backgroundColor: colors.border, marginVertical: 8 },
  rowLabel: { fontSize: 14, color: colors.textMuted, fontWeight: '600' },
  rowValue: { fontSize: 14, color: colors.text, fontWeight: '700' },
  rowBold: { fontSize: 16.5, fontWeight: '800', color: colors.text },
  tvaNote: { fontSize: 11, color: colors.textMuted, marginTop: 6, fontStyle: 'italic' },
});
