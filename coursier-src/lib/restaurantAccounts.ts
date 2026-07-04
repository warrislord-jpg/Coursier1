// ─── Comptes restaurants ─────────────────────────────────────────────
// Chaque restaurant a son propre compte (identifiant + PIN individuel).
// Les PIN sont hachés avec le même mécanisme que les rôles (SHA-256 salé).
// L'admin peut réinitialiser un PIN restaurant depuis son espace.

import { RESTAURANTS } from './data';

export type RestaurantAccount = {
  restaurantId: string; // lie le compte au restaurant de data.ts
  username: string;     // identifiant de connexion (simple, lisible)
  defaultPin: string;   // PIN par défaut (haché au premier lancement)
};

// Un compte par restaurant — en production, ces comptes seraient créés
// par l'admin depuis son interface et stockés côté serveur.
export const RESTAURANT_ACCOUNTS: RestaurantAccount[] = [
  { restaurantId: 'r1', username: 'nyembwe', defaultPin: '1101' },
  { restaurantId: 'r2', username: 'braise', defaultPin: '1102' },
  { restaurantId: 'r3', username: 'fleuve', defaultPin: '1103' },
  { restaurantId: 'r4', username: 'mamiwata', defaultPin: '1104' },
  { restaurantId: 'r5', username: 'akanda', defaultPin: '1105' },
  { restaurantId: 'r6', username: 'owendo', defaultPin: '1106' },
  { restaurantId: 'r7', username: 'palmier', defaultPin: '1107' },
  { restaurantId: 'r8', username: 'nzengpizza', defaultPin: '1108' },
];

export function accountForRestaurant(restaurantId: string): RestaurantAccount | undefined {
  return RESTAURANT_ACCOUNTS.find((a) => a.restaurantId === restaurantId);
}

export function accountByUsername(username: string): RestaurantAccount | undefined {
  const u = username.trim().toLowerCase();
  return RESTAURANT_ACCOUNTS.find((a) => a.username === u);
}

export function restaurantForAccount(acc: RestaurantAccount) {
  return RESTAURANTS.find((r) => r.id === acc.restaurantId);
}
