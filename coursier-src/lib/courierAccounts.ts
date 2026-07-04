// ─── Comptes livreurs ────────────────────────────────────────────────
// Chaque livreur a son propre compte (identifiant + PIN individuel),
// exactement comme les restaurants. L'admin peut en créer de nouveaux
// et réinitialiser les PIN depuis son espace.

export type CourierAccount = {
  courierId: string;
  username: string;
  name: string;       // nom affiché aux clients
  vehicle: string;
  defaultPin: string; // haché au premier lancement
};

export const COURIER_ACCOUNTS: CourierAccount[] = [
  { courierId: 'c1', username: 'jeanbosco', name: 'Jean-Bosco M.', vehicle: 'Moto Yamaha', defaultPin: '2468' },
  { courierId: 'c2', username: 'prisca', name: 'Prisca N.', vehicle: 'Scooter', defaultPin: '2469' },
  { courierId: 'c3', username: 'aime', name: 'Aimé O.', vehicle: 'Moto TVS', defaultPin: '2470' },
];
