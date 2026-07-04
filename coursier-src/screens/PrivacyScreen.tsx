import React from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import { colors, radius, shadow } from '../lib/theme';

const SECTIONS = [
  {
    icon: 'document-text' as const,
    title: 'Qui est responsable ?',
    body:
      'Coursier (Libreville, Gabon) est responsable du traitement de vos données. ' +
      'Conformément à la loi n°001/2011 du 25 septembre 2011 modifiée par la loi n°025/2023, ' +
      'nos traitements sont déclarés auprès de l\'APDPVP (Autorité pour la Protection des ' +
      'Données Personnelles et de la Vie Privée).',
  },
  {
    icon: 'list' as const,
    title: 'Quelles données collectons-nous ?',
    body:
      'Uniquement le strict nécessaire au service (principe de minimisation) :\n\n' +
      '• Votre nom ou pseudonyme — pour vous identifier auprès du livreur\n' +
      '• Votre numéro de téléphone — pour vous joindre pendant la livraison\n' +
      '• Votre quartier et vos adresses de livraison — pour livrer\n' +
      '• L\'historique de vos commandes et conversations — pour le suivi et les litiges\n\n' +
      'Nous ne collectons NI date de naissance, NI pièce d\'identité, NI donnée de santé, ' +
      'NI géolocalisation en continu.',
  },
  {
    icon: 'time' as const,
    title: 'Combien de temps ?',
    body:
      'Vos commandes et conversations sont conservées 12 mois maximum pour la gestion des ' +
      'litiges et obligations comptables, puis supprimées automatiquement. Les données de ' +
      'profil sont conservées tant que votre compte est actif.',
  },
  {
    icon: 'people' as const,
    title: 'Qui y accède ?',
    body:
      'Seuls le livreur assigné à votre commande (nom, téléphone, adresse de livraison), ' +
      'le restaurant concerné (articles commandés, quartier) et notre équipe support. ' +
      'Vos données ne sont jamais vendues ni transmises à des tiers à des fins publicitaires.',
  },
  {
    icon: 'globe' as const,
    title: 'Où sont-elles hébergées ?',
    body:
      'Vos données peuvent être hébergées dans l\'Union Européenne, cadre reconnu comme ' +
      'offrant un niveau de protection adéquat. Ce transfert est documenté conformément ' +
      'aux exigences de l\'APDPVP.',
  },
  {
    icon: 'shield-checkmark' as const,
    title: 'Comment sont-elles protégées ?',
    body:
      'Conformément à la loi n°027/2023 sur la cybersécurité : accès professionnels protégés ' +
      'par codes chiffrés (hachage salé, jamais stockés en clair), verrouillage automatique ' +
      'anti-intrusion, journal d\'audit des accès, et cloisonnement strict entre les rôles ' +
      '(un restaurant ne voit jamais les données d\'un autre).',
  },
  {
    icon: 'hand-right' as const,
    title: 'Vos droits',
    body:
      'Vous disposez à tout moment des droits d\'accès, de rectification et de suppression :\n\n' +
      '• Accès & rectification : directement dans l\'onglet Profil\n' +
      '• Suppression totale : bouton « Supprimer toutes mes données » dans le Profil\n' +
      '• Réclamation : vous pouvez saisir l\'APDPVP si vous estimez vos droits non respectés\n\n' +
      'Contact : confidentialite@coursier-gabon.com',
  },
];

export default function PrivacyScreen() {
  const nav = useNavigation<any>();
  return (
    <SafeAreaView style={st.safe} edges={['top']}>
      <View style={st.header}>
        <Pressable style={st.back} onPress={() => nav.goBack()}>
          <Ionicons name="arrow-back" size={20} color={colors.text} />
        </Pressable>
        <Text style={st.title}>Confidentialité</Text>
        <View style={{ width: 40 }} />
      </View>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
        <View style={st.hero}>
          <Ionicons name="lock-closed" size={26} color={colors.primary} />
          <Text style={st.heroTitle}>Vos données vous appartiennent</Text>
          <Text style={st.heroSub}>
            Politique de confidentialité — conforme aux lois gabonaises n°001/2011, n°025/2023 (APDPVP) et n°027/2023 (cybersécurité).
          </Text>
        </View>
        {SECTIONS.map((s) => (
          <View key={s.title} style={st.card}>
            <View style={st.cardHead}>
              <View style={st.cardIcon}>
                <Ionicons name={s.icon} size={17} color={colors.primary} />
              </View>
              <Text style={st.cardTitle}>{s.title}</Text>
            </View>
            <Text style={st.cardBody}>{s.body}</Text>
          </View>
        ))}
        <Text style={st.footer}>Dernière mise à jour : juin 2026 • Coursier, Libreville 🇬🇦</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const st = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10 },
  back: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', ...shadow },
  title: { flex: 1, textAlign: 'center', fontSize: 18, fontWeight: '800', color: colors.text },
  hero: { backgroundColor: colors.primaryLight, borderRadius: radius.lg, padding: 20, marginTop: 8, marginBottom: 16 },
  heroTitle: { fontSize: 19, fontWeight: '800', color: colors.text, marginTop: 10 },
  heroSub: { fontSize: 12.5, color: colors.primaryDark, marginTop: 6, lineHeight: 18, fontWeight: '600' },
  card: { backgroundColor: '#fff', borderRadius: radius.md, padding: 16, marginBottom: 12, ...shadow },
  cardHead: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  cardIcon: { width: 32, height: 32, borderRadius: 16, backgroundColor: colors.primaryLight, alignItems: 'center', justifyContent: 'center' },
  cardTitle: { fontSize: 15, fontWeight: '800', color: colors.text, flex: 1 },
  cardBody: { fontSize: 13, color: colors.textMuted, lineHeight: 20 },
  footer: { fontSize: 12, color: colors.textMuted, textAlign: 'center', marginTop: 10 },
});
