import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, Pressable, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import { colors, radius, shadow, fcfa } from '../lib/theme';
import { useStore } from '../lib/store';
import { useAuth } from '../lib/auth';
import { Card, Button } from '../components/ui';
import QuartierPicker from '../components/QuartierPicker';

export default function ProfileScreen() {
  const nav = useNavigation<any>();
  const { userName, setUserName, phone, setPhone, defaultQuartier, setDefaultQuartier, orders, favorites, eraseAllData } = useStore();
  const { logout } = useAuth();
  const [eraseModal, setEraseModal] = useState(false);
  const [erased, setErased] = useState(false);
  const [name, setName] = useState(userName);
  const [tel, setTel] = useState(phone);
  const [saved, setSaved] = useState(false);

  const totalSpent = orders.reduce((s, o) => s + o.total, 0);
  const save = () => {
    setUserName(name.trim() || 'Client Coursier');
    setPhone(tel.trim() || '+241');
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <SafeAreaView style={st.safe} edges={['top']}>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
        <View style={st.headerCard}>
          <View style={st.avatar}><Text style={{ fontSize: 34 }}>🇬🇦</Text></View>
          <Text style={st.name}>{userName}</Text>
          <Text style={st.phone}>{phone}</Text>
          <View style={st.statsRow}>
            <View style={st.stat}>
              <Text style={st.statValue}>{orders.length}</Text>
              <Text style={st.statLabel}>Commandes</Text>
            </View>
            <View style={st.statDivider} />
            <View style={st.stat}>
              <Text style={st.statValue}>{fcfa(totalSpent)}</Text>
              <Text style={st.statLabel}>Dépensé</Text>
            </View>
            <View style={st.statDivider} />
            <View style={st.stat}>
              <Text style={st.statValue}>❤️ {favorites.length}</Text>
              <Text style={st.statLabel}>Favoris</Text>
            </View>
          </View>
        </View>

        <Pressable style={st.favLink} onPress={() => nav.navigate('Favorites')}>
          <View style={st.favIcon}><Ionicons name="heart" size={18} color={colors.danger} /></View>
          <View style={{ flex: 1 }}>
            <Text style={st.favLinkTitle}>Mes restaurants favoris</Text>
            <Text style={st.favLinkSub}>{favorites.length === 0 ? 'Aucun favori pour l’instant' : `${favorites.length} restaurant(s) enregistré(s)`}</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
        </Pressable>

        <Text style={st.section}>Mes informations</Text>
        <Card>
          <Text style={st.label}>Nom complet</Text>
          <TextInput style={st.input} value={name} onChangeText={(t) => setName(t.slice(0, 60))} maxLength={60} placeholder="Votre nom" placeholderTextColor={colors.textMuted} />
          <Text style={st.label}>Téléphone</Text>
          <TextInput style={st.input} value={tel} onChangeText={(t) => setTel(t.replace(/[^0-9+ ]/g, '').slice(0, 20))} maxLength={20} keyboardType="phone-pad" placeholder="+241 XX XX XX XX" placeholderTextColor={colors.textMuted} />
          <QuartierPicker label="Quartier par défaut" value={defaultQuartier} onChange={setDefaultQuartier} />
          <Button title={saved ? 'Enregistré ✓' : 'Enregistrer'} icon={saved ? 'checkmark-circle' : 'save'} onPress={save} />
        </Card>

        <Text style={st.section}>À propos de Coursier</Text>
        <Card>
          <InfoRow icon="flash" title="Rapide et fiable" text="Des livreurs qui connaissent chaque quartier de Libreville, d’Akanda à Owendo." />
          <InfoRow icon="restaurant" title="3 services en 1" text="Restaurants livrés chauds, colis entre particuliers, courses et missions personnalisées." />
          <InfoRow icon="wallet" title="Paiement flexible" text="Espèces à la livraison, Airtel Money ou Moov Money." />
          <InfoRow icon="shield-checkmark" title="Colis assurés" text="Chaque envoi est suivi et remis en main propre avec confirmation." />
          <InfoRow icon="call" title="Support 7j/7" text="Une équipe joignable de 7h à 22h pour vous accompagner." last />
        </Card>

        <Text style={st.section}>Confidentialité &amp; données</Text>
        <Card>
          <Pressable style={st.privacyRow} onPress={() => nav.navigate('Privacy')}>
            <View style={st.infoIcon}><Ionicons name="lock-closed" size={17} color={colors.primary} /></View>
            <View style={{ flex: 1 }}>
              <Text style={st.infoTitle}>Politique de confidentialité</Text>
              <Text style={st.infoText}>Vos données, vos droits — conforme APDPVP (lois n°001/2011 &amp; n°025/2023)</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
          </Pressable>
          <Pressable style={[st.privacyRow, { borderTopWidth: 1, borderTopColor: colors.border, marginTop: 4, paddingTop: 14 }]} onPress={() => setEraseModal(true)}>
            <View style={[st.infoIcon, { backgroundColor: colors.dangerLight }]}><Ionicons name="trash" size={17} color={colors.danger} /></View>
            <View style={{ flex: 1 }}>
              <Text style={[st.infoTitle, { color: colors.danger }]}>Supprimer toutes mes données</Text>
              <Text style={st.infoText}>Droit à l’effacement — commandes, conversations, profil</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
          </Pressable>
        </Card>

        <Pressable style={st.switchRole} onPress={logout}>
          <Ionicons name="swap-horizontal" size={18} color={colors.danger} />
          <Text style={st.switchRoleText}>Changer d’espace (Livreur, Restaurant, Admin…)</Text>
        </Pressable>

        <View style={st.footer}>
          <Text style={st.footerText}>Coursier • Libreville, Gabon 🇬🇦</Text>
          <Text style={st.footerSub}>« On fait la course pour vous »</Text>
        </View>
      </ScrollView>

      {/* Modal de confirmation d'effacement (droit à l'effacement APDPVP) */}
      <Modal visible={eraseModal} transparent animationType="fade" onRequestClose={() => setEraseModal(false)}>
        <View style={st.modalWrap}>
          <View style={st.modalCard}>
            {erased ? (
              <>
                <View style={[st.modalIcon, { backgroundColor: colors.primaryLight }]}>
                  <Ionicons name="checkmark-circle" size={30} color={colors.primary} />
                </View>
                <Text style={st.modalTitle}>Données supprimées</Text>
                <Text style={st.modalText}>
                  Toutes vos données (commandes, conversations, favoris, profil) ont été effacées de cet appareil, conformément à votre droit à l’effacement.
                </Text>
                <Pressable style={st.modalBtn} onPress={() => { setEraseModal(false); setErased(false); }}>
                  <Text style={st.modalBtnText}>Fermer</Text>
                </Pressable>
              </>
            ) : (
              <>
                <View style={[st.modalIcon, { backgroundColor: colors.dangerLight }]}>
                  <Ionicons name="warning" size={30} color={colors.danger} />
                </View>
                <Text style={st.modalTitle}>Tout supprimer ?</Text>
                <Text style={st.modalText}>
                  Cette action est irréversible : historique de commandes, conversations avec les livreurs, favoris et informations de profil seront définitivement effacés de cet appareil.
                </Text>
                <Pressable
                  style={[st.modalBtn, { backgroundColor: colors.danger }]}
                  onPress={async () => { await eraseAllData(); setErased(true); }}
                >
                  <Text style={st.modalBtnText}>Oui, tout supprimer</Text>
                </Pressable>
                <Pressable style={st.modalCancel} onPress={() => setEraseModal(false)}>
                  <Text style={st.modalCancelText}>Annuler</Text>
                </Pressable>
              </>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function InfoRow({ icon, title, text, last }: { icon: any; title: string; text: string; last?: boolean }) {
  return (
    <View style={[st.infoRow, !last && { borderBottomWidth: 1, borderBottomColor: colors.border }]}>
      <View style={st.infoIcon}><Ionicons name={icon} size={18} color={colors.primary} /></View>
      <View style={{ flex: 1 }}>
        <Text style={st.infoTitle}>{title}</Text>
        <Text style={st.infoText}>{text}</Text>
      </View>
    </View>
  );
}

const st = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  headerCard: {
    backgroundColor: colors.primaryDark, borderRadius: radius.lg, padding: 22, alignItems: 'center', marginTop: 12, ...shadow,
  },
  avatar: { width: 72, height: 72, borderRadius: 36, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  name: { color: '#fff', fontSize: 20, fontWeight: '800' },
  phone: { color: 'rgba(255,255,255,0.8)', fontSize: 13.5, marginTop: 3 },
  statsRow: { flexDirection: 'row', marginTop: 18, backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: radius.md, padding: 14, alignSelf: 'stretch' },
  stat: { flex: 1, alignItems: 'center' },
  statDivider: { width: 1, backgroundColor: 'rgba(255,255,255,0.25)' },
  statValue: { color: '#fff', fontSize: 14.5, fontWeight: '800' },
  statLabel: { color: 'rgba(255,255,255,0.75)', fontSize: 11.5, marginTop: 3 },
  section: { fontSize: 17, fontWeight: '800', color: colors.text, marginTop: 22, marginBottom: 10 },
  favLink: {
    flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#fff',
    borderRadius: radius.md, padding: 15, marginTop: 14, ...shadow,
  },
  favIcon: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.dangerLight, alignItems: 'center', justifyContent: 'center' },
  favLinkTitle: { fontSize: 14.5, fontWeight: '800', color: colors.text },
  favLinkSub: { fontSize: 12.5, color: colors.textMuted, marginTop: 2 },
  label: { fontSize: 13, fontWeight: '700', color: colors.textMuted, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.4 },
  input: {
    backgroundColor: colors.bg, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md,
    paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: colors.text, marginBottom: 14,
  },
  infoRow: { flexDirection: 'row', gap: 12, paddingVertical: 12 },
  infoIcon: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.primaryLight, alignItems: 'center', justifyContent: 'center' },
  infoTitle: { fontSize: 14.5, fontWeight: '800', color: colors.text },
  infoText: { fontSize: 12.5, color: colors.textMuted, marginTop: 2, lineHeight: 17 },
  switchRole: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: '#fff', borderRadius: radius.md, padding: 15, marginTop: 20,
    borderWidth: 1, borderColor: '#F2D6D6',
  },
  switchRoleText: { fontSize: 13.5, fontWeight: '700', color: colors.danger },
  privacyRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 8 },
  modalWrap: { flex: 1, backgroundColor: 'rgba(18,33,26,0.55)', justifyContent: 'center', paddingHorizontal: 32 },
  modalCard: { backgroundColor: '#fff', borderRadius: 24, padding: 24, alignItems: 'center' },
  modalIcon: { width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center', marginBottom: 14 },
  modalTitle: { fontSize: 19, fontWeight: '800', color: colors.text, marginBottom: 8, textAlign: 'center' },
  modalText: { fontSize: 13.5, color: colors.textMuted, lineHeight: 20, textAlign: 'center', marginBottom: 18 },
  modalBtn: { backgroundColor: colors.primary, borderRadius: radius.md, paddingVertical: 14, paddingHorizontal: 28, alignSelf: 'stretch', alignItems: 'center' },
  modalBtnText: { color: '#fff', fontSize: 15, fontWeight: '800' },
  modalCancel: { paddingVertical: 12 },
  modalCancelText: { color: colors.textMuted, fontSize: 14, fontWeight: '700' },
  footer: { alignItems: 'center', marginTop: 26 },
  footerText: { fontSize: 13.5, fontWeight: '700', color: colors.textMuted },
  footerSub: { fontSize: 12.5, color: colors.textMuted, marginTop: 4, fontStyle: 'italic' },
});
