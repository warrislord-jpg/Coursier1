import { Restaurant } from './types';

export const QUARTIERS = [
  'Glass',
  'Nombakélé',
  'Louis',
  'Mont-Bouët',
  'Batterie IV',
  'Oloumi',
  'Akanda',
  'Owendo',
  'PK8',
  'Lalala',
  'Nzeng-Ayong',
  'Charbonnages',
];

export const RESTAURANTS: Restaurant[] = [
  {
    id: 'r1',
    name: 'Chez Maman Nyembwé',
    cuisine: 'Gabonaise',
    quartier: 'Nombakélé',
    rating: 4.8,
    reviews: 324,
    deliveryTime: '25-35 min',
    deliveryFee: 1000,
    emoji: '🍗',
    color: '#FDEBD2',
    tags: ['Traditionnel', 'Populaire'],
    menu: [
      { id: 'r1m1', name: 'Poulet Nyembwé', desc: 'Poulet mijoté à la sauce de noix de palme, accompagné de bâton de manioc', price: 4500, emoji: '🍗' },
      { id: 'r1m2', name: 'Feuilles de manioc au poisson fumé', desc: 'Feuilles pilées, poisson fumé, huile de palme', price: 3500, emoji: '🥬' },
      { id: 'r1m3', name: 'Poisson braisé + atanga', desc: 'Capitaine braisé, atangas mûrs, piment maison', price: 5000, emoji: '🐟' },
      { id: 'r1m4', name: 'Sauce gombo au bœuf', desc: 'Gombo frais, viande de bœuf, riz blanc', price: 4000, emoji: '🍲' },
      { id: 'r1m5', name: 'Jus de bissap glacé', desc: 'Fait maison, 50cl', price: 1000, emoji: '🧃' },
    ],
  },
  {
    id: 'r2',
    name: 'Le Braisé du Bord de Mer',
    cuisine: 'Grillades',
    quartier: 'Glass',
    rating: 4.6,
    reviews: 211,
    deliveryTime: '30-40 min',
    deliveryFee: 1200,
    emoji: '🔥',
    color: '#FFE3DB',
    tags: ['Grillades', 'Soirée'],
    menu: [
      { id: 'r2m1', name: 'Brochettes de bœuf (x5)', desc: 'Marinées aux épices, oignons grillés', price: 3000, emoji: '🍢' },
      { id: 'r2m2', name: 'Poulet braisé entier', desc: 'Poulet fermier braisé, frites de banane plantain', price: 7000, emoji: '🍗' },
      { id: 'r2m3', name: 'Bar braisé', desc: 'Poisson bar entier, sauce tomate pimentée', price: 6000, emoji: '🐟' },
      { id: 'r2m4', name: 'Alloco', desc: 'Bananes plantains frites, portion généreuse', price: 1500, emoji: '🍌' },
      { id: 'r2m5', name: 'Regab fraîche 65cl', desc: 'La bière du Gabon, bien glacée', price: 1200, emoji: '🍺' },
    ],
  },
  {
    id: 'r3',
    name: 'Saveurs du Fleuve',
    cuisine: 'Poissons & Fruits de mer',
    quartier: 'Louis',
    rating: 4.7,
    reviews: 189,
    deliveryTime: '35-45 min',
    deliveryFee: 1500,
    emoji: '🦐',
    color: '#DDEEFB',
    tags: ['Fruits de mer', 'Frais'],
    menu: [
      { id: 'r3m1', name: 'Crevettes sautées à l’ail', desc: 'Crevettes de Port-Gentil, riz parfumé', price: 8000, emoji: '🦐' },
      { id: 'r3m2', name: 'Court-bouillon de machoiron', desc: 'Poisson frais, tomates, citron vert', price: 5500, emoji: '🍜' },
      { id: 'r3m3', name: 'Crabe farci', desc: 'Crabe de mangrove farci, gratiné', price: 6500, emoji: '🦀' },
      { id: 'r3m4', name: 'Riz aux fruits de mer', desc: 'Crevettes, calamars, moules', price: 7000, emoji: '🍤' },
    ],
  },
  {
    id: 'r4',
    name: 'Mami Wata Fast Food',
    cuisine: 'Fast Food',
    quartier: 'Mont-Bouët',
    rating: 4.4,
    reviews: 456,
    deliveryTime: '15-25 min',
    deliveryFee: 800,
    emoji: '🍔',
    color: '#FFF0C9',
    tags: ['Rapide', 'Étudiants'],
    menu: [
      { id: 'r4m1', name: 'Burger Okoumé', desc: 'Double steak, cheddar, sauce secrète', price: 3500, emoji: '🍔' },
      { id: 'r4m2', name: 'Chawarma poulet', desc: 'Poulet mariné, crudités, sauce blanche', price: 2500, emoji: '🌯' },
      { id: 'r4m3', name: 'Frites + poulet pané', desc: 'Menu complet avec boisson', price: 3000, emoji: '🍟' },
      { id: 'r4m4', name: 'Pizza Makaya', desc: 'Jambon, champignons, fromage', price: 5000, emoji: '🍕' },
      { id: 'r4m5', name: 'Milkshake coco', desc: 'Noix de coco fraîche, 40cl', price: 1500, emoji: '🥤' },
    ],
  },
  {
    id: 'r5',
    name: 'Délices d’Akanda',
    cuisine: 'Africaine moderne',
    quartier: 'Akanda',
    rating: 4.9,
    reviews: 142,
    deliveryTime: '40-50 min',
    deliveryFee: 2000,
    emoji: '🥘',
    color: '#E5F6E0',
    tags: ['Chic', 'Nouveau'],
    menu: [
      { id: 'r5m1', name: 'Poulet DG', desc: 'Poulet, plantains mûrs, légumes sautés', price: 6000, emoji: '🥘' },
      { id: 'r5m2', name: 'Ndolè crevettes', desc: 'Feuilles amères, crevettes, arachides', price: 5500, emoji: '🍛' },
      { id: 'r5m3', name: 'Attiéké poisson', desc: 'Semoule de manioc, poisson frit, sauce claire', price: 4500, emoji: '🐠' },
      { id: 'r5m4', name: 'Salade tropicale', desc: 'Mangue, avocat, crevettes, vinaigrette passion', price: 4000, emoji: '🥗' },
      { id: 'r5m5', name: 'Jus de gingembre', desc: 'Fait maison, bien relevé, 50cl', price: 1000, emoji: '🥤' },
    ],
  },
  {
    id: 'r6',
    name: 'Owendo Street Food',
    cuisine: 'Street Food',
    quartier: 'Owendo',
    rating: 4.3,
    reviews: 278,
    deliveryTime: '20-30 min',
    deliveryFee: 1000,
    emoji: '🌮',
    color: '#F3E4FB',
    tags: ['Pas cher', 'Rapide'],
    menu: [
      { id: 'r6m1', name: 'Sandwich viande hachée', desc: 'Pain frais, viande, œuf, crudités', price: 1500, emoji: '🥪' },
      { id: 'r6m2', name: 'Beignets haricots (x6)', desc: 'Beignets soufflés + bouillie de maïs', price: 1000, emoji: '🍩' },
      { id: 'r6m3', name: 'Riz sauce arachide', desc: 'Riz blanc, sauce arachide au poulet', price: 2000, emoji: '🍚' },
      { id: 'r6m4', name: 'Omelette spaghetti', desc: 'Le classique de la rue, pain offert', price: 1500, emoji: '🍳' },
    ],
  },
];

export const EXTRA_RESTAURANTS: Restaurant[] = [
  {
    id: 'r7',
    name: 'Le Palmier d’Or',
    cuisine: 'Gabonaise',
    quartier: 'Batterie IV',
    rating: 4.5,
    reviews: 167,
    deliveryTime: '30-40 min',
    deliveryFee: 1200,
    emoji: '🌴',
    color: '#E8F5D6',
    tags: ['Familial', 'Copieux'],
    menu: [
      { id: 'r7m1', name: 'Porc-épic à la sauce chocolat', desc: 'Spécialité de brousse, sauce odika (chocolat indigène)', price: 7500, emoji: '🍫' },
      { id: 'r7m2', name: 'Poulet fumé aux aubergines', desc: 'Poulet fumé maison, aubergines locales, riz', price: 5000, emoji: '🍆' },
      { id: 'r7m3', name: 'Taro sauce jaune', desc: 'Taro pilé, sauce jaune au bœuf', price: 4500, emoji: '🥔' },
      { id: 'r7m4', name: 'Bananes malaxées + sardines', desc: 'Le classique réconfortant', price: 2500, emoji: '🍌' },
      { id: 'r7m5', name: 'Jus de corossol frais', desc: 'Pressé du jour, 50cl', price: 1200, emoji: '🥤' },
    ],
  },
  {
    id: 'r8',
    name: 'Nzeng Pizza & Co',
    cuisine: 'Fast Food',
    quartier: 'Nzeng-Ayong',
    rating: 4.2,
    reviews: 301,
    deliveryTime: '20-30 min',
    deliveryFee: 900,
    emoji: '🍕',
    color: '#FFE8E0',
    tags: ['Soirée', 'Groupes'],
    menu: [
      { id: 'r8m1', name: 'Pizza Ogooué', desc: 'Thon, oignons rouges, olives, double fromage', price: 5500, emoji: '🍕' },
      { id: 'r8m2', name: 'Pizza Équateur', desc: 'Poulet braisé, ananas, poivrons', price: 6000, emoji: '🍍' },
      { id: 'r8m3', name: 'Tacos géant viande', desc: 'Viande hachée, frites, sauce fromagère', price: 3500, emoji: '🌯' },
      { id: 'r8m4', name: 'Nuggets (x10) + frites', desc: 'Avec 2 sauces au choix', price: 3000, emoji: '🍗' },
      { id: 'r8m5', name: 'Soda 1,5L', desc: 'Coca, Fanta ou Sprite', price: 1500, emoji: '🥤' },
    ],
  },
];

RESTAURANTS.push(...EXTRA_RESTAURANTS);

export const COURSE_TYPES = [
  { id: 'achats', label: 'Achats en boutique', emoji: '🛍️', desc: 'Vêtements, électronique, pharmacie…' },
  { id: 'marche', label: 'Courses au marché', emoji: '🥕', desc: 'Mont-Bouët, Oloumi, marché local' },
  { id: 'supermarche', label: 'Supermarché', emoji: '🛒', desc: 'Casino, CKdo, Prix Import…' },
  { id: 'infos', label: 'Recueil d’informations', emoji: '📋', desc: 'Prix, disponibilité, files d’attente' },
  { id: 'demarches', label: 'Démarches & dépôts', emoji: '📄', desc: 'Dépôt de dossier, retrait de document' },
  { id: 'autre', label: 'Autre mission', emoji: '✨', desc: 'Décrivez votre besoin, on s’en occupe' },
];

export const COLIS_SIZES = [
  { id: 'S', label: 'Petit', desc: 'Documents, téléphone, clés', emoji: '✉️', base: 1000 },
  { id: 'M', label: 'Moyen', desc: 'Sac, boîte à chaussures', emoji: '📦', base: 2000 },
  { id: 'L', label: 'Grand', desc: 'Carton, valise, glacière', emoji: '🧳', base: 3500 },
];

// zone pricing between quartiers (simplified distance factor)
const ZONE: Record<string, number> = {
  Glass: 0, 'Nombakélé': 0, Louis: 0, 'Mont-Bouët': 1, 'Batterie IV': 1, Oloumi: 1,
  Lalala: 2, 'Nzeng-Ayong': 2, Charbonnages: 1, Akanda: 3, Owendo: 3, PK8: 3,
};

export function colisPrice(from: string, to: string, sizeBase: number, express: boolean): number {
  const dist = Math.abs((ZONE[from] ?? 1) - (ZONE[to] ?? 1)) + ((ZONE[from] ?? 1) === 3 || (ZONE[to] ?? 1) === 3 ? 1 : 0);
  let p = sizeBase + dist * 500;
  if (express) p = Math.round(p * 1.5);
  return p;
}
