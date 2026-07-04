import { Order } from './types';

export type Courier = { name: string; vehicle: string; rating: number; emoji: string };

const COURIERS: Courier[] = [
  { name: 'Jean-Bosco M.', vehicle: 'Moto Yamaha', rating: 4.9, emoji: '🛵' },
  { name: 'Prisca N.', vehicle: 'Scooter', rating: 4.8, emoji: '🛵' },
  { name: 'Aimé O.', vehicle: 'Moto TVS', rating: 4.7, emoji: '🏍️' },
  { name: 'Karl E.', vehicle: 'Vélo cargo', rating: 4.9, emoji: '🚲' },
];

export function courierForOrder(orderId: string): Courier {
  return COURIERS[orderId.charCodeAt(2) % COURIERS.length];
}

// Livreur affiché au client : le VRAI livreur s'il a pris la course,
// sinon le livreur simulé par défaut (démo).
export function displayCourier(order: { id: string; courierName?: string }): Courier {
  if (order.courierName) {
    const base = courierForOrder(order.id);
    return { ...base, name: order.courierName };
  }
  return courierForOrder(order.id);
}

export const QUICK_REPLIES = [
  'Vous êtes où ?',
  'Dans combien de temps ?',
  'Appelez-moi en arrivant',
  'Merci ! 🙏',
];

function pick<T>(arr: T[], seed: number): T {
  return arr[seed % arr.length];
}

export function greetingFor(order: Order, courierName: string): string {
  const first = courierName.split(' ')[0];
  if (order.type === 'resto')
    return `Mbolo ! C'est ${first}, votre livreur 🛵 Je m'occupe de votre commande. Je vous écris dès que je récupère les plats au restaurant !`;
  if (order.type === 'colis')
    return `Bonjour ! ${first} à votre service 📦 Je pars récupérer votre colis. N'hésitez pas à m'écrire si besoin.`;
  return `Bonjour ! C'est ${first} 🏃 J'ai bien reçu votre mission, je m'y mets tout de suite. Je vous tiens au courant ici !`;
}

export function courierReply(clientText: string, order: Order, progress: number, seed: number): string {
  const t = clientText.toLowerCase();

  if (/(où|ou êtes|ou es|position|localis)/.test(t)) {
    if (progress >= 3) return 'Je suis arrivé, la livraison est faite ✅';
    if (progress === 2) return pick([
      'Je suis en route vers vous, plus que quelques minutes ! 🛵',
      'J\'arrive bientôt, je traverse le carrefour là. Restez joignable !',
    ], seed);
    if (progress === 1) return pick([
      order.type === 'resto' ? 'Je suis au restaurant, la commande est presque prête 🍽️' : 'Je suis sur le lieu de départ, tout se passe bien 👍',
      'Encore sur place, j\'aurai bientôt fini ici et je fonce vers vous.',
    ], seed);
    return 'Je viens de confirmer, je me prépare à partir 👍';
  }

  if (/(combien|temps|minute|quand|long)/.test(t)) {
    if (progress >= 3) return 'C\'est déjà livré ! 🎉';
    if (progress === 2) return pick(['Environ 5 à 10 minutes ! ⏱', 'Je dirais 10 minutes maximum, sauf embouteillage au rond-point.'], seed);
    return pick(['Comptez 15 à 20 minutes, je fais au plus vite 💪', 'Une vingtaine de minutes environ, je vous écris dès que je pars.'], seed);
  }

  if (/(appel|téléphone|sonn)/.test(t)) {
    return 'Pas de souci, je vous appelle dès que j\'arrive devant 📞';
  }

  if (/(merci|super|parfait|top|génial|nickel)/.test(t)) {
    return pick(['Avec plaisir ! 🙏', 'C\'est un plaisir de vous servir ! 😊', 'Merci à vous, à très vite !'], seed);
  }

  if (/(bonjour|mbolo|salut|bonsoir)/.test(t)) {
    return pick(['Mbolo ! Je suis sur votre commande 👍', 'Bonjour ! Tout se passe bien de mon côté, je vous tiens informé.'], seed);
  }

  if (/(portail|porte|immeuble|repère|bleu|rouge|derrière|face|pharmacie|étage)/.test(t)) {
    return 'C\'est noté, merci pour la précision ! Je trouverai facilement 📍';
  }

  if (/(annul|problème|erreur|manque)/.test(t)) {
    return 'Je vois, ne vous inquiétez pas. Je vérifie ça tout de suite et je reviens vers vous 🙏';
  }

  if (/(monnaie|billet|payer|paiement|airtel|moov|espèce)/.test(t)) {
    return 'D\'accord, j\'aurai de la monnaie sur moi. Airtel Money et Moov Money passent aussi 👍';
  }

  return pick([
    'Bien reçu ! 👍',
    'C\'est noté, merci !',
    'Ok, je gère ça 💪',
    'Compris, je vous tiens au courant !',
  ], seed);
}
