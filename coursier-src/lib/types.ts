export type MenuItem = {
  id: string;
  name: string;
  desc: string;
  price: number;
  emoji: string;
  // Gestion par le restaurant
  promoPrice?: number | null; // prix promotionnel actif (< price)
  available?: boolean;        // false = épuisé / retiré de la vente
  photo?: string | null;      // photo du plat postée par le restaurant (data URI base64)
};

export type Restaurant = {
  id: string;
  name: string;
  cuisine: string;
  quartier: string;
  rating: number;
  reviews: number;
  deliveryTime: string;
  deliveryFee: number;
  emoji: string;
  color: string;
  tags: string[];
  menu: MenuItem[];
};

export type CartLine = {
  itemId: string;
  name: string;
  price: number;
  qty: number;
  emoji: string;
};

export type OrderType = 'resto' | 'colis' | 'course';

export type ChatMessage = {
  id: string;
  from: 'client' | 'courier';
  text: string;
  at: number;
  read: boolean;
  readByCourier?: boolean;
  // true si envoyé par un humain via l'interface Livreur (désactive le bot)
  manual?: boolean;
  // photo jointe au message (data URI base64), optionnelle
  imageUri?: string;
};

export type Order = {
  id: string;
  restaurantId?: string; // pour les commandes resto : à quel restaurant
  courierId?: string;     // livreur qui a pris la course (dispatch)
  type: OrderType;
  title: string;
  subtitle: string;
  total: number;
  createdAt: number;
  details: { label: string; value: string }[];
  items?: CartLine[];
  rating?: number;
  cancelledAt?: number;
  cancelReason?: string;
  cancelFee?: number;
  // Contrôle manuel par les rôles livreur / restaurant.
  // Si défini, remplace la progression automatique.
  manualStep?: number;
  acceptedByResto?: boolean;
  courierName?: string;
};
