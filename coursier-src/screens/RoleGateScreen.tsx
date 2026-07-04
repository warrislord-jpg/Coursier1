import React, { useState } from 'react';
import {
  View, Text, StyleSheet, Pressable, TextInput, Modal, ScrollView, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { colors, radius, shadow } from '../lib/theme';
import { useAuth, Role } from '../lib/auth';

const ROLES: {
  id: Role;
  title: string;
  desc: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  bg: string;
  secure: boolean;
}[] = [
  {
    id: 'client', title: 'Client', desc: 'Commander, envoyer des colis, lancer des missions',
    icon: 'person', color: colors.primary, bg: colors.primaryLight, secure: false,
  },
  {
    id: 'courier', title: 'Livreur', desc: 'Accepter des courses, livrer, discuter avec les clients',
    icon: 'bicycle', color: colors.accent, bg: colors.accentLight, secure: true,
  },
  {
    id: 'restaurant', title: 'Restaurant', desc: 'Recevoir les commandes, gérer la préparation',
    icon: 'restaurant', color: colors.primaryDark, bg: colors.primaryLight, secure: true,
  },
  {
    id: 'admin', title: 'Administrateur', desc: 'Superviser la plateforme, revenus et sécurité',
    icon: 'shield-checkmark', color: colors.primaryDark, bg: '#E4EBE4', secure: true,
  },
];

export default function RoleGateScreen() {
  const { login, loginRestaurant, loginCourier, ready, failuresFor, lockedUntil } = useAuth();
  const [pinModal, setPinModal] = useState<Role | null>(null);
  const [pin, setPin] = useState('');
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');

  const tryLogin = (role: Role) => {
    setError('');
    if (role === 'client') {
      login('client');
      return;
    }
    setPin('');
    setUsername('');
    setPinModal(role);
  };

  const submitPin = () => {
    if (!pinModal) return;
    const res = pinModal === 'restaurant'
      ? loginRestaurant(username, pin)
      : pinModal === 'courier'
      ? loginCourier(username, pin)
      : login(pinModal, pin);
    if (res.ok) {
      setPinModal(null);
      setPin('');
      setUsername('');
      setError('');
    } else {
      setError(res.error ?? 'Erreur');
      setPin('');
    }
  };

  const roleMeta = ROLES.find((r) => r.id === pinModal);
  const locked = pinModal === 'admin' ? lockedUntil('admin') > Date.now() : false;
  const needsUsername = pinModal === 'restaurant' || pinModal === 'courier';

  return (
    <SafeAreaView style={st.safe} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 30 }} showsVerticalScrollIndicator={false}>
        <View style={st.logoZone}>
          <View style={st.logoBadge}>
            <Ionicons name="bicycle" size={28} color="#fff" />
          </View>
          <Text style={st.logoTitle}>Coursier</Text>
          <Text style={st.logoSub}>Libreville • Gabon 🇬🇦</Text>
        </View>

        <Text style={st.heading}>Qui êtes-vous ?</Text>
        <Text style={st.sub}>Chaque espace est protégé et adapté à votre rôle.</Text>

        {ROLES.map((r) => (
          <Pressable
            key={r.id}
            style={({ pressed }) => [st.roleCard, pressed && { transform: [{ scale: 0.98 }], opacity: 0.9 }]}
            onPress={() => tryLogin(r.id)}
            disabled={!ready}
          >
            <View style={[st.roleIcon, { backgroundColor: r.bg }]}>
              <Ionicons name={r.icon} size={24} color={r.color} />
            </View>
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Text style={st.roleTitle}>{r.title}</Text>
                {r.secure && (
                  <View style={st.lockBadge}>
                    <Ionicons name="lock-closed" size={9} color={colors.textMuted} />
                    <Text style={st.lockText}>PIN</Text>
                  </View>
                )}
              </View>
              <Text style={st.roleDesc}>{r.desc}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
          </Pressable>
        ))}

        <View style={st.secureNote}>
          <Ionicons name="shield-checkmark" size={16} color={colors.primary} />
          <Text style={st.secureNoteText}>
            Accès professionnels protégés par PIN chiffré (SHA-256 salé, 500 itérations).
            Verrouillage automatique après 3 tentatives échouées. Journal d'audit complet.
          </Text>
        </View>

        <View style={st.demoNote}>
          <Ionicons name="information-circle" size={15} color={colors.textMuted} />
          <Text style={st.demoNoteText}>
            Démo — Admin : PIN 9024.{'\n'}
            Livreurs (identifiant / PIN) : jeanbosco/2468 • prisca/2469 • aime/2470.{'\n'}
            Restaurants (identifiant / PIN) : nyembwe/1101 • braise/1102 • mamiwata/1104…{'\n'}
            Chaque partenaire a son propre compte. L'admin gère tous les PIN.
          </Text>
        </View>
      </ScrollView>

      {/* Modal PIN */}
      <Modal visible={!!pinModal} transparent animationType="fade" onRequestClose={() => setPinModal(null)}>
        <KeyboardAvoidingView style={st.modalWrap} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setPinModal(null)} />
          <View style={st.pinCard}>
            <View style={[st.roleIcon, { backgroundColor: roleMeta?.bg, alignSelf: 'center', width: 60, height: 60, borderRadius: 30 }]}>
              <Ionicons name={roleMeta?.icon ?? 'lock-closed'} size={28} color={roleMeta?.color} />
            </View>
            <Text style={st.pinTitle}>Espace {roleMeta?.title}</Text>
            <Text style={st.pinSub}>
              {needsUsername
                ? pinModal === 'restaurant'
                  ? 'Connectez-vous avec votre compte restaurant'
                  : 'Connectez-vous avec votre compte livreur'
                : 'Saisissez votre code PIN pour continuer'}
            </Text>

            {needsUsername && (
              <TextInput
                style={st.userInput}
                value={username}
                onChangeText={(t) => setUsername(t.replace(/[^a-zA-Z0-9]/g, '').slice(0, 20))}
                placeholder={pinModal === 'restaurant' ? 'Identifiant (ex : nyembwe)' : 'Identifiant (ex : jeanbosco)'}
                placeholderTextColor={colors.textMuted}
                autoCapitalize="none"
                autoCorrect={false}
                autoFocus
              />
            )}

            <TextInput
              style={[st.pinInput, error ? { borderColor: colors.danger } : null]}
              value={pin}
              onChangeText={(t) => setPin(t.replace(/[^0-9]/g, '').slice(0, 6))}
              keyboardType="number-pad"
              secureTextEntry
              placeholder="••••"
              placeholderTextColor={colors.textMuted}
              maxLength={6}
              autoFocus={!needsUsername}
              onSubmitEditing={submitPin}
            />

            {error ? (
              <View style={st.errBox}>
                <Ionicons name="alert-circle" size={15} color={colors.danger} />
                <Text style={st.errText}>{error}</Text>
              </View>
            ) : pinModal === 'admin' && failuresFor('admin') > 0 && !locked ? (
              <Text style={st.warnText}>
                {3 - failuresFor('admin')} essai(s) restant(s) avant verrouillage temporaire
              </Text>
            ) : null}

            <Pressable
              style={[st.pinBtn, (pin.length < 4 || locked || (needsUsername && username.length < 2)) && { opacity: 0.5 }]}
              disabled={pin.length < 4 || locked || (needsUsername && username.length < 2)}
              onPress={submitPin}
            >
              <Ionicons name="lock-open" size={17} color="#fff" />
              <Text style={st.pinBtnText}>Déverrouiller</Text>
            </Pressable>
            <Pressable style={st.cancelBtn} onPress={() => setPinModal(null)}>
              <Text style={st.cancelText}>Annuler</Text>
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const st = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  logoZone: { alignItems: 'center', marginTop: 26, marginBottom: 26 },
  logoBadge: {
    width: 64, height: 64, borderRadius: 20, backgroundColor: colors.primary,
    alignItems: 'center', justifyContent: 'center', ...shadow,
  },
  logoTitle: { fontSize: 26, fontWeight: '800', color: colors.primaryDark, marginTop: 12 },
  logoSub: { fontSize: 13, color: colors.textMuted, fontWeight: '600', marginTop: 2 },
  heading: { fontSize: 21, fontWeight: '800', color: colors.text, marginBottom: 4 },
  sub: { fontSize: 13.5, color: colors.textMuted, marginBottom: 18, lineHeight: 19 },
  roleCard: {
    flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: '#fff',
    borderRadius: radius.md, padding: 16, marginBottom: 12, ...shadow,
  },
  roleIcon: { width: 50, height: 50, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  roleTitle: { fontSize: 16, fontWeight: '800', color: colors.text },
  roleDesc: { fontSize: 12.5, color: colors.textMuted, marginTop: 2, lineHeight: 17 },
  lockBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: colors.bg,
    paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, borderWidth: 1, borderColor: colors.border,
  },
  lockText: { fontSize: 9, fontWeight: '800', color: colors.textMuted },
  secureNote: {
    flexDirection: 'row', gap: 10, backgroundColor: colors.primaryLight,
    borderRadius: radius.md, padding: 14, marginTop: 8,
  },
  secureNoteText: { flex: 1, fontSize: 12, color: colors.primaryDark, lineHeight: 17, fontWeight: '600' },
  demoNote: {
    flexDirection: 'row', gap: 8, backgroundColor: '#fff', borderRadius: radius.md,
    padding: 12, marginTop: 10, borderWidth: 1, borderColor: colors.border,
  },
  demoNoteText: { flex: 1, fontSize: 11.5, color: colors.textMuted, lineHeight: 16, fontWeight: '600' },
  modalWrap: { flex: 1, backgroundColor: 'rgba(18,33,26,0.55)', justifyContent: 'center', paddingHorizontal: 32 },
  pinCard: { backgroundColor: '#fff', borderRadius: 24, padding: 24 },
  pinTitle: { fontSize: 19, fontWeight: '800', color: colors.text, textAlign: 'center', marginTop: 14 },
  pinSub: { fontSize: 13, color: colors.textMuted, textAlign: 'center', marginTop: 4, marginBottom: 18 },
  pinInput: {
    borderWidth: 1.5, borderColor: colors.border, borderRadius: radius.md,
    paddingVertical: 14, textAlign: 'center', fontSize: 24, letterSpacing: 12,
    color: colors.text, backgroundColor: colors.bg,
  },
  userInput: {
    borderWidth: 1.5, borderColor: colors.border, borderRadius: radius.md,
    paddingVertical: 13, paddingHorizontal: 16, fontSize: 15.5, fontWeight: '600',
    color: colors.text, backgroundColor: colors.bg, marginBottom: 12,
  },
  errBox: {
    flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: colors.dangerLight,
    borderRadius: 10, padding: 10, marginTop: 10,
  },
  errText: { flex: 1, fontSize: 12.5, color: colors.danger, fontWeight: '700' },
  warnText: { fontSize: 12, color: colors.accentDark, fontWeight: '700', textAlign: 'center', marginTop: 10 },
  pinBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: colors.primary, borderRadius: radius.md, paddingVertical: 15, marginTop: 16,
  },
  pinBtnText: { color: '#fff', fontSize: 15.5, fontWeight: '800' },
  cancelBtn: { alignItems: 'center', paddingVertical: 12 },
  cancelText: { color: colors.textMuted, fontSize: 14, fontWeight: '700' },
});
