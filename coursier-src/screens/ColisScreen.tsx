import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, TextInput, KeyboardAvoidingView, Platform, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import { colors, radius, shadow, fcfa } from '../lib/theme';
import { COLIS_SIZES, colisPrice } from '../lib/data';
import { useStore } from '../lib/store';
import { Button } from '../components/ui';
import QuartierPicker from '../components/QuartierPicker';

export default function ColisScreen() {
  const nav = useNavigation<any>();
  const { placeOrder, defaultQuartier } = useStore();
  const [from, setFrom] = useState(defaultQuartier);
  const [to, setTo] = useState('Mont-Bouët');
  const [size, setSize] = useState('M');
  const [express, setExpress] = useState(false);
  const [desc, setDesc] = useState('');
  const [recipient, setRecipient] = useState('');
  const [recipientPhone, setRecipientPhone] = useState('');

  const sizeObj = COLIS_SIZES.find((s) => s.id === size)!;
  const price = useMemo(() => colisPrice(from, to, sizeObj.base, express), [from, to, sizeObj, express]);
  const valid = recipient.trim().length > 1 && recipientPhone.trim().length >= 8 && desc.trim().length > 2 && from !== to;

  const confirm = () => {
    const order = placeOrder({
      type: 'colis',
      title: `Colis • ${from} → ${to}`,
      subtitle: `${sizeObj.label} • ${express ? 'Express' : 'Standard'} • pour ${recipient}`,
      total: price,
      details: [
        { label: 'Contenu', value: desc },
        { label: 'Départ', value: from },
        { label: 'Arrivée', value: to },
        { label: 'Taille', value: `${sizeObj.emoji} ${sizeObj.label} — ${sizeObj.desc}` },
        { label: 'Destinataire', value: `${recipient} • ${recipientPhone}` },
        { label: 'Vitesse', value: express ? '⚡ Express (moins d’1h)' : 'Standard (dans la journée)' },
      ],
    });
    setDesc(''); setRecipient(''); setRecipientPhone(''); setExpress(false);
    nav.navigate('OrderDetail', { orderId: order.id, justPlaced: true });
  };

  return (
    <SafeAreaView style={st.safe} edges={['top']}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
          <View style={st.hero}>
            <Text style={{ fontSize: 40 }}>📦</Text>
            <Text style={st.heroTitle}>Envoyer un colis</Text>
            <Text style={st.heroSub}>Livraison entre particuliers, remise en main propre partout à Libreville et environs.</Text>
          </View>

          <Text style={st.section}>Trajet</Text>
          <QuartierPicker label="Quartier de départ" value={from} onChange={setFrom} />
          <QuartierPicker label="Quartier d’arrivée" value={to} onChange={setTo} />
          {from === to && (
            <View style={st.warn}>
              <Ionicons name="alert-circle" size={16} color={colors.accentDark} />
              <Text style={st.warnText}>Le départ et l’arrivée doivent être différents.</Text>
            </View>
          )}

          <Text style={st.section}>Taille du colis</Text>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            {COLIS_SIZES.map((s) => (
              <Pressable key={s.id} style={[st.size, size === s.id && st.sizeActive]} onPress={() => setSize(s.id)}>
                <Text style={{ fontSize: 26 }}>{s.emoji}</Text>
                <Text style={[st.sizeLabel, size === s.id && { color: colors.primaryDark }]}>{s.label}</Text>
                <Text style={st.sizeDesc}>{s.desc}</Text>
              </Pressable>
            ))}
          </View>

          <Text style={st.section}>Détails</Text>
          <Text style={st.label}>Que contient le colis ?</Text>
          <TextInput
            style={st.input}
            placeholder="Ex : documents, médicaments, cadeau…"
            placeholderTextColor={colors.textMuted}
            value={desc}
            onChangeText={(t) => setDesc(t.slice(0, 150))}
            maxLength={150}
            returnKeyType="next"
          />
          <Text style={st.label}>Nom du destinataire</Text>
          <TextInput
            style={st.input}
            placeholder="Ex : Marie Ondo"
            placeholderTextColor={colors.textMuted}
            value={recipient}
            onChangeText={(t) => setRecipient(t.slice(0, 60))}
            maxLength={60}
            returnKeyType="next"
          />
          <Text style={st.label}>Téléphone du destinataire</Text>
          <TextInput
            style={st.input}
            placeholder="+241 XX XX XX XX"
            placeholderTextColor={colors.textMuted}
            value={recipientPhone}
            onChangeText={(t) => setRecipientPhone(t.replace(/[^0-9+ ]/g, '').slice(0, 20))}
            maxLength={20}
            keyboardType="phone-pad"
            returnKeyType="done"
          />

          <View style={st.expressRow}>
            <View style={{ flex: 1 }}>
              <Text style={st.expressTitle}>⚡ Livraison express</Text>
              <Text style={st.expressSub}>Prioritaire, en moins d’une heure (+50%)</Text>
            </View>
            <Switch value={express} onValueChange={setExpress} trackColor={{ true: colors.primary, false: colors.border }} thumbColor="#fff" />
          </View>

          <View style={st.priceCard}>
            <View>
              <Text style={st.priceLabel}>Prix estimé</Text>
              <Text style={st.priceValue}>{fcfa(price)}</Text>
            </View>
            <View style={st.priceBadge}>
              <Ionicons name="shield-checkmark" size={14} color={colors.primaryDark} />
              <Text style={st.priceBadgeText}>Colis assuré</Text>
            </View>
          </View>

          <Button title="Envoyer le colis" icon="paper-plane" onPress={confirm} disabled={!valid} />
          {!valid && <Text style={st.hint}>Renseignez le contenu, le destinataire et son numéro pour continuer.</Text>}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const st = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  hero: { backgroundColor: colors.accentLight, borderRadius: radius.lg, padding: 20, marginTop: 12, marginBottom: 6 },
  heroTitle: { fontSize: 22, fontWeight: '800', color: colors.text, marginTop: 8 },
  heroSub: { fontSize: 13.5, color: colors.textMuted, marginTop: 4, lineHeight: 19 },
  section: { fontSize: 17, fontWeight: '800', color: colors.text, marginTop: 20, marginBottom: 10 },
  warn: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: colors.accentLight, borderRadius: radius.sm, padding: 10 },
  warnText: { fontSize: 12.5, fontWeight: '700', color: colors.accentDark, flex: 1 },
  size: {
    flex: 1, backgroundColor: '#fff', borderRadius: radius.md, padding: 12, alignItems: 'center',
    borderWidth: 1.5, borderColor: colors.border,
  },
  sizeActive: { borderColor: colors.primary, backgroundColor: colors.primaryLight },
  sizeLabel: { fontSize: 14, fontWeight: '800', color: colors.text, marginTop: 6 },
  sizeDesc: { fontSize: 10.5, color: colors.textMuted, textAlign: 'center', marginTop: 3, lineHeight: 14 },
  label: { fontSize: 13, fontWeight: '700', color: colors.textMuted, marginBottom: 6, marginTop: 8, textTransform: 'uppercase', letterSpacing: 0.4 },
  input: {
    backgroundColor: '#fff', borderWidth: 1, borderColor: colors.border, borderRadius: radius.md,
    paddingHorizontal: 14, paddingVertical: 13, fontSize: 15, color: colors.text, marginBottom: 6,
  },
  expressRow: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: radius.md,
    padding: 16, marginTop: 16, ...shadow,
  },
  expressTitle: { fontSize: 15, fontWeight: '800', color: colors.text },
  expressSub: { fontSize: 12.5, color: colors.textMuted, marginTop: 2 },
  priceCard: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: colors.primaryDark, borderRadius: radius.md, padding: 18, marginVertical: 16,
  },
  priceLabel: { color: 'rgba(255,255,255,0.8)', fontSize: 13, fontWeight: '600' },
  priceValue: { color: '#fff', fontSize: 24, fontWeight: '800', marginTop: 2 },
  priceBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: '#fff', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999 },
  priceBadgeText: { fontSize: 12, fontWeight: '800', color: colors.primaryDark },
  hint: { fontSize: 12.5, color: colors.textMuted, textAlign: 'center', marginTop: 10 },
});
