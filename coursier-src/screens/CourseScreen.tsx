import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import { colors, radius, fcfa } from '../lib/theme';
import { COURSE_TYPES } from '../lib/data';
import { useStore } from '../lib/store';
import { Button } from '../components/ui';
import QuartierPicker from '../components/QuartierPicker';

const BUDGETS = [
  { id: 'b0', label: 'Aucun achat', value: 0 },
  { id: 'b1', label: '< 10 000', value: 10000 },
  { id: 'b2', label: '10 – 25 000', value: 25000 },
  { id: 'b3', label: '25 – 50 000', value: 50000 },
  { id: 'b4', label: '50 000+', value: 100000 },
];

const SERVICE_FEE = 2500;

export default function CourseScreen() {
  const nav = useNavigation<any>();
  const { placeOrder, defaultQuartier } = useStore();
  const [type, setType] = useState('achats');
  const [mission, setMission] = useState('');
  const [lieu, setLieu] = useState('Mont-Bouët');
  const [livraison, setLivraison] = useState(defaultQuartier);
  const [budget, setBudget] = useState('b1');
  const [urgent, setUrgent] = useState(false);

  const typeObj = COURSE_TYPES.find((t) => t.id === type)!;
  const budgetObj = BUDGETS.find((b) => b.id === budget)!;
  const fee = SERVICE_FEE + (urgent ? 1500 : 0);
  const valid = mission.trim().length > 5;

  const confirm = () => {
    const order = placeOrder({
      type: 'course',
      title: `Mission • ${typeObj.label}`,
      subtitle: `${lieu} → ${livraison}${urgent ? ' • ⚡ Urgent' : ''}`,
      total: fee,
      details: [
        { label: 'Type de mission', value: `${typeObj.emoji} ${typeObj.label}` },
        { label: 'Instructions', value: mission },
        { label: 'Lieu de la mission', value: lieu },
        { label: 'Livraison / compte-rendu à', value: livraison },
        { label: 'Budget d’achat prévu', value: budgetObj.value === 0 ? 'Aucun achat' : `~ ${fcfa(budgetObj.value)} (avancé par le coursier, remboursé à la livraison)` },
        { label: 'Frais de service', value: fcfa(fee) },
        { label: 'Priorité', value: urgent ? '⚡ Urgent' : 'Normale' },
      ],
    });
    setMission(''); setUrgent(false);
    nav.navigate('OrderDetail', { orderId: order.id, justPlaced: true });
  };

  return (
    <SafeAreaView style={st.safe} edges={['top']}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
          <View style={st.hero}>
            <Text style={{ fontSize: 40 }}>🏃‍♂️</Text>
            <Text style={st.heroTitle}>Votre coursier personnel</Text>
            <Text style={st.heroSub}>Achats, courses au marché, recueil d’informations, dépôt de dossiers… On fait la course à votre place.</Text>
          </View>

          <Text style={st.section}>Type de mission</Text>
          <View style={st.grid}>
            {COURSE_TYPES.map((t) => (
              <Pressable key={t.id} style={[st.typeCard, type === t.id && st.typeActive]} onPress={() => setType(t.id)}>
                <Text style={{ fontSize: 24 }}>{t.emoji}</Text>
                <Text style={[st.typeLabel, type === t.id && { color: colors.primaryDark }]}>{t.label}</Text>
                <Text style={st.typeDesc} numberOfLines={2}>{t.desc}</Text>
                {type === t.id && (
                  <View style={st.check}><Ionicons name="checkmark" size={12} color="#fff" /></View>
                )}
              </Pressable>
            ))}
          </View>

          <Text style={st.section}>Votre mission en détail</Text>
          <TextInput
            style={[st.input, { minHeight: 100, textAlignVertical: 'top' }]}
            placeholder={"Ex : Achète-moi 2 kg de crevettes au marché du Mont-Bouët, vérifie qu’elles sont fraîches. Prends aussi du piment et 3 citrons verts…"}
            placeholderTextColor={colors.textMuted}
            value={mission}
            onChangeText={(t) => setMission(t.slice(0, 500))}
            maxLength={500}
            multiline
          />

          <Text style={st.section}>Lieux</Text>
          <QuartierPicker label="Où se déroule la mission ?" value={lieu} onChange={setLieu} />
          <QuartierPicker label="Où livrer / faire le compte-rendu ?" value={livraison} onChange={setLivraison} />

          <Text style={st.section}>Budget d’achat estimé</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {BUDGETS.map((b) => (
              <Pressable key={b.id} style={[st.chip, budget === b.id && st.chipActive]} onPress={() => setBudget(b.id)}>
                <Text style={[st.chipText, budget === b.id && { color: '#fff' }]}>{b.label}</Text>
              </Pressable>
            ))}
          </ScrollView>
          <Text style={st.note}>
            💡 Budget préchargé et protégé : vos fonds sont détenus séparément (fonds de passage) jusqu'à l'achat réel.
            Ticket de caisse photographié, horodaté et consultable dans l'app. Si les achats coûtent moins que le budget,
            le surplus est remboursé automatiquement. Remboursement sous 48 h max en cas d'annulation ou de produit indisponible.
          </Text>

          <Pressable style={[st.urgentRow, urgent && { borderColor: colors.accent, backgroundColor: colors.accentLight }]} onPress={() => setUrgent(!urgent)}>
            <Text style={{ fontSize: 22 }}>⚡</Text>
            <View style={{ flex: 1 }}>
              <Text style={st.urgentTitle}>Mission urgente</Text>
              <Text style={st.urgentSub}>Prise en charge immédiate (+1 500 FCFA)</Text>
            </View>
            <Ionicons name={urgent ? 'checkbox' : 'square-outline'} size={22} color={urgent ? colors.accent : colors.border} />
          </Pressable>

          <View style={st.priceCard}>
            <View>
              <Text style={st.priceLabel}>Frais de service</Text>
              <Text style={st.priceValue}>{fcfa(fee)}</Text>
            </View>
            <View style={st.priceBadge}>
              <Ionicons name="receipt" size={14} color={colors.primaryDark} />
              <Text style={st.priceBadgeText}>Ticket fourni</Text>
            </View>
          </View>

          <Button title="Lancer la mission" icon="rocket" onPress={confirm} disabled={!valid} />
          {!valid && <Text style={st.hint}>Décrivez votre mission (au moins quelques mots) pour continuer.</Text>}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const st = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  hero: { backgroundColor: colors.primaryLight, borderRadius: radius.lg, padding: 20, marginTop: 12, marginBottom: 6 },
  heroTitle: { fontSize: 22, fontWeight: '800', color: colors.text, marginTop: 8 },
  heroSub: { fontSize: 13.5, color: colors.textMuted, marginTop: 4, lineHeight: 19 },
  section: { fontSize: 17, fontWeight: '800', color: colors.text, marginTop: 20, marginBottom: 10 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  typeCard: {
    width: '48%', backgroundColor: '#fff', borderRadius: radius.md, padding: 12,
    borderWidth: 1.5, borderColor: colors.border, position: 'relative',
  },
  typeActive: { borderColor: colors.primary, backgroundColor: colors.primaryLight },
  typeLabel: { fontSize: 13.5, fontWeight: '800', color: colors.text, marginTop: 6 },
  typeDesc: { fontSize: 11, color: colors.textMuted, marginTop: 3, lineHeight: 15 },
  check: {
    position: 'absolute', top: 8, right: 8, width: 20, height: 20, borderRadius: 10,
    backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center',
  },
  input: {
    backgroundColor: '#fff', borderWidth: 1, borderColor: colors.border, borderRadius: radius.md,
    paddingHorizontal: 14, paddingVertical: 13, fontSize: 15, color: colors.text,
  },
  chip: {
    paddingHorizontal: 14, paddingVertical: 9, borderRadius: 999, backgroundColor: '#fff',
    borderWidth: 1, borderColor: colors.border, marginRight: 8,
  },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { color: colors.text, fontWeight: '700', fontSize: 13 },
  note: { fontSize: 12.5, color: colors.textMuted, marginTop: 10, lineHeight: 18, backgroundColor: colors.primaryLight, padding: 12, borderRadius: radius.sm },
  urgentRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#fff',
    borderRadius: radius.md, padding: 15, marginTop: 16, borderWidth: 1.5, borderColor: colors.border,
  },
  urgentTitle: { fontSize: 14.5, fontWeight: '800', color: colors.text },
  urgentSub: { fontSize: 12.5, color: colors.textMuted, marginTop: 2 },
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
