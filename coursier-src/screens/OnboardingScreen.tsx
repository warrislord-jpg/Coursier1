import React, { useRef, useState } from 'react';
import {
  View, Text, StyleSheet, Pressable, FlatList, Dimensions, Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { colors, radius, shadow } from '../lib/theme';
import { useStore } from '../lib/store';

const { width: W } = Dimensions.get('window');

const SLIDES = [
  { key: 's1' }, { key: 's2' }, { key: 's3' },
];

// ─── Illustration 1 : Restaurants ────────────────────────────────
function IllustrationResto() {
  return (
    <View style={il.zone}>
      <View style={il.blobBack} />
      <View style={il.blob} />
      <Text style={[il.leaf, { top: 6, right: 60 }]}>🍃</Text>
      <Text style={[il.leaf, { top: 60, left: 30, fontSize: 13, transform: [{ rotate: '-30deg' }] }]}>🍃</Text>
      <Text style={[il.leaf, { bottom: 40, right: 26, fontSize: 15, transform: [{ rotate: '20deg' }] }]}>🍃</Text>

      {/* Plat central sur assiette */}
      <View style={il.plate}>
        <Text style={{ fontSize: 92 }}>🍗</Text>
      </View>
      <Text style={[il.sideEmoji, { bottom: 58, left: 34, fontSize: 40 }]}>🥘</Text>
      <Text style={[il.sideEmoji, { bottom: 46, right: 40, fontSize: 34 }]}>🥤</Text>

      {/* Carte flottante haut-gauche */}
      <View style={[il.tag, { top: 26, left: 6 }]}>
        <View style={il.tagIcon}><Ionicons name="flame" size={13} color="#fff" /></View>
        <View>
          <Text style={il.tagSmall}>Livré chaud</Text>
          <Text style={il.tagBold}>en 30 min</Text>
        </View>
      </View>

      {/* Mini carte suivi bas-droite */}
      <View style={[il.miniCard, { bottom: 4, right: 2 }]}>
        <Text style={il.miniTitle}>Votre commande</Text>
        <View style={il.miniRow}>
          <Ionicons name="checkmark-circle" size={13} color={colors.primary} />
          <Text style={il.miniText}>Poulet nyembwé</Text>
        </View>
        <View style={il.miniRow}>
          <Ionicons name="checkmark-circle" size={13} color={colors.primary} />
          <Text style={il.miniText}>Bâton de manioc</Text>
        </View>
      </View>
    </View>
  );
}

// ─── Illustration 2 : Colis ──────────────────────────────────────
function IllustrationColis() {
  return (
    <View style={il.zone}>
      <View style={il.blobBack} />
      <View style={il.blob} />
      <Text style={[il.leaf, { top: 10, left: 56 }]}>🍃</Text>
      <Text style={[il.leaf, { bottom: 60, right: 20, fontSize: 14, transform: [{ rotate: '25deg' }] }]}>🍃</Text>

      <View style={il.plate}>
        <Text style={{ fontSize: 92 }}>📦</Text>
      </View>
      <Text style={[il.sideEmoji, { bottom: 60, right: 44, fontSize: 36 }]}>✉️</Text>

      {/* Carte sécurité haut-droite */}
      <View style={[il.tag, { top: 22, right: 4 }]}>
        <View style={[il.tagIcon, { backgroundColor: colors.primary }]}>
          <Ionicons name="shield-checkmark" size={13} color="#fff" />
        </View>
        <View>
          <Text style={il.tagSmall}>Colis assuré</Text>
          <Text style={il.tagBold}>main propre</Text>
        </View>
      </View>

      {/* Trajet pointillé Glass → Akanda */}
      <View style={[il.miniCard, { bottom: 8, left: 0, width: 150 }]}>
        <View style={il.routeRow}>
          <View style={il.routeDot} />
          <View style={il.routeDash} />
          <Ionicons name="location" size={15} color={colors.primary} />
        </View>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 5 }}>
          <Text style={il.miniText}>Glass</Text>
          <Text style={il.miniText}>Akanda</Text>
        </View>
        <Text style={[il.miniTitle, { marginTop: 5, marginBottom: 0 }]}>Suivi en direct</Text>
      </View>
    </View>
  );
}

// ─── Illustration 3 : Livreur ────────────────────────────────────
function IllustrationLivreur() {
  return (
    <View style={il.zone}>
      <View style={il.blobBack} />
      <View style={il.blob} />
      <Text style={[il.leaf, { top: 14, right: 48 }]}>🍃</Text>
      <Text style={[il.leaf, { top: 80, left: 18, fontSize: 13, transform: [{ rotate: '-20deg' }] }]}>🍃</Text>

      <View style={il.plate}>
        <Text style={{ fontSize: 92 }}>🛵</Text>
      </View>
      <Text style={[il.sideEmoji, { bottom: 52, left: 38, fontSize: 36 }]}>🛍️</Text>

      {/* Carte suivi type "Order on the way" */}
      <View style={[il.miniCard, { top: 16, left: 0, width: 148 }]}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Text style={il.miniTitle}>Commande en route</Text>
          <Text style={{ fontSize: 13 }}>👨🏾</Text>
        </View>
        <Text style={il.miniEta}>25 min</Text>
        <View style={il.routeRow}>
          <Ionicons name="location" size={14} color={colors.primary} />
          <View style={il.routeDash} />
          <Ionicons name="home" size={13} color={colors.primaryDark} />
        </View>
      </View>

      {/* Étapes cochées bas-droite */}
      <View style={[il.miniCard, { bottom: 10, right: 0, flexDirection: 'row', gap: 10, alignItems: 'center', paddingVertical: 10 }]}>
        <View style={il.stepOk}><Ionicons name="checkmark" size={11} color="#fff" /></View>
        <View style={il.stepOk}><Ionicons name="checkmark" size={11} color="#fff" /></View>
        <View style={[il.stepOk, { backgroundColor: colors.accent }]}>
          <Ionicons name="bicycle" size={11} color="#fff" />
        </View>
        <View style={[il.stepOk, { backgroundColor: colors.border }]} />
      </View>
    </View>
  );
}

const CONTENT = [
  {
    Illustration: IllustrationResto,
    title: 'Vos plats préférés,',
    accent: 'sans le stress',
    text: 'Commandez auprès des meilleures tables de Libreville et recevez vos plats encore chauds, où que vous soyez.',
  },
  {
    Illustration: IllustrationColis,
    title: 'Envoyez vos colis',
    accent: 'en toute confiance',
    text: 'De Glass à Akanda, vos colis sont suivis en temps réel et remis en main propre avec confirmation.',
  },
  {
    Illustration: IllustrationLivreur,
    title: 'Livraison rapide',
    accent: 'à votre porte',
    text: 'Courses, achats et démarches — suivez votre livreur minute par minute et discutez avec lui à tout moment.',
  },
];

export default function OnboardingScreen() {
  const { completeOnboarding } = useStore();
  const [index, setIndex] = useState(0);
  const [consent, setConsent] = useState(false);
  const listRef = useRef<FlatList>(null);
  const scrollX = useRef(new Animated.Value(0)).current;
  const last = index === CONTENT.length - 1;

  const goTo = (i: number) => listRef.current?.scrollToIndex({ index: i, animated: true });
  const next = () => {
    if (last) {
      if (consent) completeOnboarding();
    } else {
      goTo(index + 1);
    }
  };

  return (
    <SafeAreaView style={st.safe} edges={['top', 'bottom']}>
      {/* Barre haute : retour + passer */}
      <View style={st.topBar}>
        <Pressable
          style={[st.backCircle, index === 0 && { opacity: 0 }]}
          disabled={index === 0}
          onPress={() => goTo(index - 1)}
        >
          <Ionicons name="arrow-back" size={19} color={colors.primaryDark} />
        </Pressable>
        {!last && (
          <Pressable onPress={() => goTo(CONTENT.length - 1)} hitSlop={10}>
            <Text style={st.skip}>Passer</Text>
          </Pressable>
        )}
      </View>

      <Animated.FlatList
        ref={listRef}
        data={SLIDES}
        keyExtractor={(s) => s.key}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { x: scrollX } } }],
          { useNativeDriver: false }
        )}
        onMomentumScrollEnd={(e) => setIndex(Math.round(e.nativeEvent.contentOffset.x / W))}
        renderItem={({ index: i }) => {
          const { Illustration } = CONTENT[i];
          return (
            <View style={{ width: W, paddingHorizontal: 24 }}>
              <Illustration />
            </View>
          );
        }}
      />

      {/* Points de pagination — entre l'illustration et le titre */}
      <View style={st.dots}>
        {CONTENT.map((_, i) => {
          const w = scrollX.interpolate({
            inputRange: [(i - 1) * W, i * W, (i + 1) * W],
            outputRange: [7, 24, 7],
            extrapolate: 'clamp',
          });
          const bg = scrollX.interpolate({
            inputRange: [(i - 1) * W, i * W, (i + 1) * W],
            outputRange: [colors.border, colors.primary, colors.border] as any,
            extrapolate: 'clamp',
          });
          return <Animated.View key={i} style={[st.dot, { width: w, backgroundColor: bg as any }]} />;
        })}
      </View>

      {/* Texte */}
      <View style={st.textZone}>
        <Text style={st.title}>
          {CONTENT[index].title}{'\n'}
          <Text style={st.titleAccent}>{CONTENT[index].accent}</Text>
        </Text>
        <Text style={st.text}>{CONTENT[index].text}</Text>
      </View>

      {/* Consentement RGPD/APDPVP sur le dernier écran */}
      {last && (
        <Pressable style={st.consentRow} onPress={() => setConsent(!consent)}>
          <Ionicons
            name={consent ? 'checkbox' : 'square-outline'}
            size={22}
            color={consent ? colors.primary : colors.textMuted}
          />
          <Text style={st.consentText}>
            J’accepte la <Text style={{ fontWeight: '800', color: colors.primaryDark }}>politique de confidentialité</Text> de
            Coursier (loi gabonaise n°001/2011 — protection des données personnelles). Consultable à tout moment dans le Profil.
          </Text>
        </Pressable>
      )}

      {/* CTA */}
      <View style={{ paddingHorizontal: 24 }}>
        <Pressable
          style={({ pressed }) => [
            st.cta,
            last && !consent && { backgroundColor: colors.border },
            pressed && { opacity: 0.9, transform: [{ scale: 0.98 }] },
          ]}
          onPress={next}
          disabled={last && !consent}
        >
          <Text style={[st.ctaText, last && !consent && { color: colors.textMuted }]}>
            {last ? 'Commencer' : 'Suivant'}
          </Text>
          <Ionicons name="arrow-forward" size={19} color={last && !consent ? colors.textMuted : '#fff'} />
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const st = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FCFDFB' },
  topBar: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 24, paddingTop: 8,
  },
  backCircle: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: colors.primaryLight,
    alignItems: 'center', justifyContent: 'center',
  },
  skip: { fontSize: 15, fontWeight: '600', color: colors.textMuted },
  dots: {
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6,
    marginTop: 6, marginBottom: 20,
  },
  dot: { height: 7, borderRadius: 4 },
  textZone: { paddingHorizontal: 34, alignItems: 'center' },
  title: {
    fontSize: 27, fontWeight: '800', color: colors.text, textAlign: 'center', lineHeight: 35,
  },
  titleAccent: { color: colors.primary },
  text: {
    fontSize: 14.5, color: colors.textMuted, textAlign: 'center',
    lineHeight: 22, marginTop: 12,
  },
  consentRow: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 10,
    paddingHorizontal: 28, marginTop: 18,
  },
  consentText: { flex: 1, fontSize: 12, color: colors.textMuted, lineHeight: 17 },
  cta: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    backgroundColor: colors.primary, borderRadius: 18, paddingVertical: 17,
    marginTop: 14, marginBottom: 6, ...shadow,
  },
  ctaText: { color: '#fff', fontSize: 16.5, fontWeight: '800' },
});

const il = StyleSheet.create({
  zone: {
    height: 400, alignItems: 'center', justifyContent: 'center', marginTop: 6,
  },
  blobBack: {
    position: 'absolute', width: 240, height: 250,
    borderTopLeftRadius: 120, borderTopRightRadius: 130, borderBottomLeftRadius: 110, borderBottomRightRadius: 125,
    backgroundColor: '#EDF6EC', top: 20, left: 30, transform: [{ rotate: '-8deg' }],
  },
  blob: {
    position: 'absolute', width: 270, height: 300,
    borderTopLeftRadius: 135, borderTopRightRadius: 135, borderBottomLeftRadius: 40, borderBottomRightRadius: 40,
    backgroundColor: '#E3F1E1', bottom: 24, alignSelf: 'center',
  },
  plate: {
    width: 175, height: 175, borderRadius: 88, backgroundColor: '#fff',
    alignItems: 'center', justifyContent: 'center', ...shadow,
    shadowOpacity: 0.12, shadowRadius: 18, elevation: 6,
  },
  sideEmoji: { position: 'absolute' },
  leaf: { position: 'absolute', fontSize: 17, opacity: 0.85 },
  tag: {
    position: 'absolute', flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#fff', borderRadius: 14, paddingHorizontal: 12, paddingVertical: 9,
    ...shadow, shadowOpacity: 0.1, elevation: 5,
  },
  tagIcon: {
    width: 26, height: 26, borderRadius: 9, backgroundColor: colors.accent,
    alignItems: 'center', justifyContent: 'center',
  },
  tagSmall: { fontSize: 10.5, color: colors.textMuted, fontWeight: '600' },
  tagBold: { fontSize: 12.5, fontWeight: '800', color: colors.text },
  miniCard: {
    position: 'absolute', backgroundColor: '#fff', borderRadius: 14,
    paddingHorizontal: 12, paddingVertical: 10,
    ...shadow, shadowOpacity: 0.1, elevation: 5,
  },
  miniTitle: { fontSize: 11, fontWeight: '800', color: colors.text, marginBottom: 4 },
  miniEta: { fontSize: 18, fontWeight: '800', color: colors.primary, marginBottom: 6 },
  miniRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 2 },
  miniText: { fontSize: 10.5, color: colors.textMuted, fontWeight: '600' },
  routeRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  routeDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.primary },
  routeDash: {
    flex: 1, height: 2, borderRadius: 1,
    borderWidth: 1, borderColor: colors.primary, borderStyle: 'dashed',
  },
  stepOk: {
    width: 22, height: 22, borderRadius: 11, backgroundColor: colors.primary,
    alignItems: 'center', justifyContent: 'center',
  },
});
