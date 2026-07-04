// ─── Palette « Coursier » ────────────────────────────────────────────
// Volontairement MINIMALE : 2 familles seulement.
//   1. Le VERT de marque (3 nuances : action / profond / fond)
//   2. Un accent DORÉ unique (prix, étoiles, attente)
// + neutres verdis + rouge réservé au danger. Rien d'autre.

export const colors = {
  // 1️⃣ Vert de marque — la seule couleur d'identité
  primary: '#33A15A',        // actions, boutons, liens, succès, "en ligne"
  primaryDark: '#1E5B38',    // fonds profonds, en-têtes, texte fort sur clair
  primaryLight: '#EAF6EE',   // fonds de puces, surlignages, badges

  // 2️⃣ Accent doré — unique touche chaude
  accent: '#E8A33D',         // étoiles, express, états "en cours"
  accentLight: '#FBF1DE',    // fonds des badges dorés
  accentDark: '#8A5D13',     // texte sur fond doré clair

  // Neutres (teintés vert pour l'harmonie)
  bg: '#F6F9F4',
  card: '#FFFFFF',
  text: '#17251C',
  textMuted: '#66786C',
  border: '#E4EBE4',

  // Sémantique — rouge réservé exclusivement aux erreurs/annulations
  danger: '#D64545',
  dangerLight: '#FBEAEA',
};

export const shadow = {
  shadowColor: '#1E5B38',
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.07,
  shadowRadius: 12,
  elevation: 3,
};

export const radius = {
  sm: 10,
  md: 16,
  lg: 22,
  xl: 28,
};

export const fcfa = (n: number) => `${n.toLocaleString('fr-FR')} FCFA`;

// La logique fiscale (TVA 18 %, seuil 60 M FCFA, facturation électronique
// loi n°041/2025) vit dans lib/invoice.ts — source de vérité unique.
