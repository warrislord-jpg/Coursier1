import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CartLine, ChatMessage, MenuItem, Order, Restaurant } from './types';
import { courierForOrder, courierReply, greetingFor } from './chat';
import { RESTAURANTS } from './data';

// ─── Gestion des menus par les restaurants ───────────────────────────
// menuOverrides[restaurantId] contient le menu édité par le restaurant
// (plats ajoutés, prix modifiés, promos, disponibilité). S'il est absent,
// le menu par défaut de data.ts est utilisé.
export type MenuOverrides = Record<string, MenuItem[]>;

export function menuFor(restaurantId: string, overrides: MenuOverrides): MenuItem[] {
  if (overrides[restaurantId]) return overrides[restaurantId];
  return RESTAURANTS.find((r) => r.id === restaurantId)?.menu ?? [];
}

export function effectivePrice(m: MenuItem): number {
  if (m.promoPrice != null && m.promoPrice > 0 && m.promoPrice < m.price) return m.promoPrice;
  return m.price;
}

// SÉCURITÉ : taille max d'une image encodée en base64 (data URI), pour
// éviter de saturer AsyncStorage (limite ~6 Mo sur Android par défaut).
// ~700 000 caractères ≈ 500 Ko décodés — largement suffisant pour une
// photo de plat compressée par le picker (quality 0.5).
export const MAX_IMAGE_B64_LENGTH = 700_000;

export function validateImageDataUri(uri: string | null | undefined): { ok: boolean; error?: string } {
  if (!uri) return { ok: true }; // pas d'image = valide (champ optionnel)
  if (!uri.startsWith('data:image/')) return { ok: false, error: 'Format d\'image invalide.' };
  if (uri.length > MAX_IMAGE_B64_LENGTH) return { ok: false, error: 'Image trop volumineuse. Réessayez avec une photo plus légère.' };
  return { ok: true };
}

// Validation stricte côté « backend » — aucune confiance dans l'UI
export function validateMenuItem(item: Partial<MenuItem>): { ok: boolean; error?: string } {
  const name = (item.name ?? '').trim();
  if (name.length < 2) return { ok: false, error: 'Nom du plat trop court (2 caractères min).' };
  if (name.length > 60) return { ok: false, error: 'Nom du plat trop long (60 caractères max).' };
  const desc = (item.desc ?? '').trim();
  if (desc.length > 160) return { ok: false, error: 'Description trop longue (160 caractères max).' };
  const price = Number(item.price);
  if (!Number.isFinite(price) || price < 100) return { ok: false, error: 'Prix minimum : 100 FCFA.' };
  if (price > 500_000) return { ok: false, error: 'Prix maximum : 500 000 FCFA.' };
  if (price % 50 !== 0) return { ok: false, error: 'Le prix doit être un multiple de 50 FCFA.' };
  if (item.promoPrice != null && item.promoPrice !== 0) {
    const promo = Number(item.promoPrice);
    if (!Number.isFinite(promo) || promo < 100) return { ok: false, error: 'Prix promo minimum : 100 FCFA.' };
    if (promo >= price) return { ok: false, error: 'Le prix promo doit être inférieur au prix normal.' };
    if (promo % 50 !== 0) return { ok: false, error: 'Le prix promo doit être un multiple de 50 FCFA.' };
  }
  const photoCheck = validateImageDataUri(item.photo);
  if (!photoCheck.ok) return photoCheck;
  return { ok: true };
}

type Store = {
  cart: CartLine[];
  cartRestaurant: Restaurant | null;
  addToCart: (r: Restaurant, line: Omit<CartLine, 'qty'>) => void;
  changeQty: (itemId: string, delta: number) => void;
  clearCart: () => void;
  orders: Order[];
  placeOrder: (o: Omit<Order, 'id' | 'createdAt'>) => Order;
  rateOrder: (orderId: string, rating: number) => void;
  cancelOrder: (orderId: string, reason: string) => { fee: number };
  advanceOrder: (orderId: string) => void;
  acceptOrderResto: (orderId: string) => void;
  claimOrder: (orderId: string, courierId: string, courierName: string) => { ok: boolean; error?: string };
  chats: Record<string, ChatMessage[]>;
  sendMessage: (orderId: string, text: string, imageUri?: string) => { ok: boolean; error?: string };
  sendCourierMessage: (orderId: string, text: string, imageUri?: string) => { ok: boolean; error?: string };
  markChatRead: (orderId: string) => void;
  markChatReadCourier: (orderId: string) => void;
  unreadCount: (orderId: string) => number;
  unreadForCourier: (orderId: string) => number;
  favorites: string[];
  toggleFavorite: (restoId: string) => void;
  userName: string;
  setUserName: (n: string) => void;
  phone: string;
  setPhone: (n: string) => void;
  defaultQuartier: string;
  setDefaultQuartier: (n: string) => void;
  onboarded: boolean;
  completeOnboarding: () => void;
  // Droit à l'effacement (loi n°001/2011, APDPVP) : suppression totale
  eraseAllData: () => Promise<void>;
  // Gestion des menus par les restaurants (même backend partagé)
  menuOverrides: MenuOverrides;
  getMenu: (restaurantId: string) => MenuItem[];
  upsertMenuItem: (restaurantId: string, item: MenuItem) => { ok: boolean; error?: string };
  deleteMenuItem: (restaurantId: string, itemId: string) => void;
  toggleItemAvailable: (restaurantId: string, itemId: string) => void;
  setPromo: (restaurantId: string, itemId: string, promoPrice: number | null) => { ok: boolean; error?: string };
};

const Ctx = createContext<Store | null>(null);

export const useStore = () => {
  const s = useContext(Ctx);
  if (!s) throw new Error('store');
  return s;
};

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<CartLine[]>([]);
  const [cartRestaurant, setCartRestaurant] = useState<Restaurant | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [chats, setChats] = useState<Record<string, ChatMessage[]>>({});
  const [favorites, setFavorites] = useState<string[]>([]);
  const [userName, setUserName] = useState('Client Coursier');
  const [phone, setPhone] = useState('+241 74 00 00 00');
  const [defaultQuartier, setDefaultQuartier] = useState('Glass');
  const [onboarded, setOnboarded] = useState(true); // évite le flash pendant le chargement
  const [menuOverrides, setMenuOverrides] = useState<MenuOverrides>({});
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem('coursier_state_v1');
        if (raw) {
          const s = JSON.parse(raw);
          setOrders(s.orders ?? []);
          setChats(s.chats ?? {});
          setFavorites(s.favorites ?? []);
          setUserName(s.userName ?? 'Client Coursier');
          setPhone(s.phone ?? '+241 74 00 00 00');
          setDefaultQuartier(s.defaultQuartier ?? 'Glass');
          setOnboarded(s.onboarded ?? false);
          setMenuOverrides(s.menuOverrides ?? {});
        } else {
          setOnboarded(false);
        }
      } catch {}
      setLoaded(true);
    })();
  }, []);

  useEffect(() => {
    if (!loaded) return;
    AsyncStorage.setItem(
      'coursier_state_v1',
      JSON.stringify({ orders, chats, favorites, userName, phone, defaultQuartier, onboarded, menuOverrides })
    ).catch(() => {});
  }, [orders, chats, favorites, userName, phone, defaultQuartier, onboarded, menuOverrides, loaded]);

  // SÉCURITÉ : quantité bornée 1-20 (anti-manipulation / anti-overflow)
  const MAX_QTY = 20;

  const addToCart = (r: Restaurant, line: Omit<CartLine, 'qty'>) => {
    setCart((prev) => {
      if (cartRestaurant && cartRestaurant.id !== r.id) {
        setCartRestaurant(r);
        return [{ ...line, qty: 1 }];
      }
      setCartRestaurant(r);
      const ex = prev.find((l) => l.itemId === line.itemId);
      if (ex) return prev.map((l) => (l.itemId === line.itemId ? { ...l, qty: Math.min(MAX_QTY, l.qty + 1) } : l));
      return [...prev, { ...line, qty: 1 }];
    });
  };

  const changeQty = (itemId: string, delta: number) => {
    // SÉCURITÉ : delta borné à ±1, quantité finale bornée 0-20
    const safeDelta = delta > 0 ? 1 : -1;
    setCart((prev) =>
      prev
        .map((l) => (l.itemId === itemId ? { ...l, qty: Math.min(MAX_QTY, Math.max(0, l.qty + safeDelta)) } : l))
        .filter((l) => l.qty > 0)
    );
  };

  const clearCart = () => {
    setCart([]);
    setCartRestaurant(null);
  };

  const toggleFavorite = (restoId: string) => {
    setFavorites((prev) =>
      prev.includes(restoId) ? prev.filter((id) => id !== restoId) : [...prev, restoId]
    );
  };

  const placeOrder = (o: Omit<Order, 'id' | 'createdAt'>) => {
    const order: Order = {
      ...o,
      id: 'CR' + Math.random().toString(36).slice(2, 7).toUpperCase(),
      createdAt: Date.now(),
    };
    setOrders((prev) => [order, ...prev]);
    // Le livreur envoie un premier message de prise en charge
    const courier = courierForOrder(order.id);
    const greeting: ChatMessage = {
      id: 'm' + Math.random().toString(36).slice(2, 9),
      from: 'courier',
      text: greetingFor(order, courier.name),
      at: Date.now() + 4000,
      read: false,
    };
    setChats((prev) => ({ ...prev, [order.id]: [greeting] }));
    return order;
  };

  const sendMessage = (orderId: string, text: string, imageUri?: string): { ok: boolean; error?: string } => {
    // SÉCURITÉ : longueur bornée (anti-saturation du stockage)
    const safe = text.trim().slice(0, 500);
    const imgCheck = validateImageDataUri(imageUri);
    if (!imgCheck.ok) return imgCheck;
    // Un message doit contenir du texte OU une image (pas les deux vides)
    if (!safe && !imageUri) return { ok: false, error: 'Message vide.' };
    const order = orders.find((o) => o.id === orderId);
    const msg: ChatMessage = {
      id: 'm' + Math.random().toString(36).slice(2, 9),
      from: 'client',
      text: safe,
      at: Date.now(),
      read: true,
      readByCourier: false,
      ...(imageUri ? { imageUri } : {}),
    };
    setChats((prev) => ({ ...prev, [orderId]: [...(prev[orderId] ?? []), msg] }));
    // Réponse automatique du livreur après un court délai
    // (désactivée si un vrai livreur a déjà écrit via son interface, ou sur une photo seule)
    const courierHasSpoken = (chats[orderId] ?? []).some(
      (m) => m.from === 'courier' && m.manual === true
    );
    if (order && !courierHasSpoken && safe) {
      const progress = effectiveProgress(order);
      const seed = text.length + orderId.charCodeAt(3);
      const replyText = imageUri && !safe ? 'Bien reçu, merci pour la photo 📸' : courierReply(text, order, progress, seed);
      const delay = 1500 + Math.random() * 2500;
      setTimeout(() => {
        const reply: ChatMessage = {
          id: 'm' + Math.random().toString(36).slice(2, 9),
          from: 'courier',
          text: replyText,
          at: Date.now(),
          read: false,
          readByCourier: true,
          manual: false,
        };
        setChats((prev) => ({ ...prev, [orderId]: [...(prev[orderId] ?? []), reply] }));
      }, delay);
    } else if (order && !courierHasSpoken && imageUri) {
      // Photo envoyée sans texte : accusé de réception simple
      const delay = 1200 + Math.random() * 1800;
      setTimeout(() => {
        const reply: ChatMessage = {
          id: 'm' + Math.random().toString(36).slice(2, 9),
          from: 'courier',
          text: 'Bien reçu, merci pour la photo 📸',
          at: Date.now(),
          read: false,
          readByCourier: true,
          manual: false,
        };
        setChats((prev) => ({ ...prev, [orderId]: [...(prev[orderId] ?? []), reply] }));
      }, delay);
    }
    return { ok: true };
  };

  // Message envoyé par un VRAI livreur depuis son interface
  const sendCourierMessage = (orderId: string, text: string, imageUri?: string): { ok: boolean; error?: string } => {
    const safe = text.trim().slice(0, 500);
    const imgCheck = validateImageDataUri(imageUri);
    if (!imgCheck.ok) return imgCheck;
    if (!safe && !imageUri) return { ok: false, error: 'Message vide.' };
    const msg: ChatMessage = {
      id: 'm' + Math.random().toString(36).slice(2, 9),
      from: 'courier',
      text: safe,
      at: Date.now(),
      read: false,
      readByCourier: true,
      manual: true,
      ...(imageUri ? { imageUri } : {}),
    };
    setChats((prev) => ({ ...prev, [orderId]: [...(prev[orderId] ?? []), msg] }));
    return { ok: true };
  };

  const markChatRead = (orderId: string) => {
    setChats((prev) => {
      const msgs = prev[orderId];
      if (!msgs || msgs.every((m) => m.read)) return prev;
      return { ...prev, [orderId]: msgs.map((m) => ({ ...m, read: true })) };
    });
  };

  const markChatReadCourier = (orderId: string) => {
    setChats((prev) => {
      const msgs = prev[orderId];
      if (!msgs || msgs.every((m) => m.readByCourier)) return prev;
      return { ...prev, [orderId]: msgs.map((m) => ({ ...m, readByCourier: true })) };
    });
  };

  const unreadCount = (orderId: string) =>
    (chats[orderId] ?? []).filter((m) => m.from === 'courier' && !m.read && m.at <= Date.now()).length;

  const unreadForCourier = (orderId: string) =>
    (chats[orderId] ?? []).filter((m) => m.from === 'client' && !m.readByCourier).length;

  // Le livreur / restaurant fait avancer la commande à l'étape suivante
  const advanceOrder = (orderId: string) => {
    setOrders((prev) =>
      prev.map((o) => {
        if (o.id !== orderId || o.cancelledAt) return o;
        const current = effectiveProgress(o); // max(manuel, auto)
        return { ...o, manualStep: Math.min(3, current + 1) };
      })
    );
  };

  const acceptOrderResto = (orderId: string) => {
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, acceptedByResto: true } : o))
    );
  };

  // Un livreur prend une course disponible (dispatch premier arrivé, premier servi)
  const claimOrder = (orderId: string, cid: string, courierName: string) => {
    const order = orders.find((o) => o.id === orderId);
    if (!order) return { ok: false, error: 'Course introuvable.' };
    if (order.cancelledAt) return { ok: false, error: 'Cette course a été annulée.' };
    if (order.courierId && order.courierId !== cid) return { ok: false, error: 'Course déjà prise par un autre livreur.' };
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, courierId: cid, courierName } : o))
    );
    // Message de prise en charge dans le chat du client
    const msg: ChatMessage = {
      id: 'm' + Math.random().toString(36).slice(2, 9),
      from: 'courier',
      text: `Mbolo ! C'est ${courierName.split(' ')[0]}, je prends votre course en charge 🛵`,
      at: Date.now(),
      read: false,
      readByCourier: true,
      manual: true,
    };
    setChats((prev) => ({ ...prev, [orderId]: [...(prev[orderId] ?? []), msg] }));
    return { ok: true };
  };

  const rateOrder = (orderId: string, rating: number) => {
    setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, rating } : o)));
  };

  const cancelOrder = (orderId: string, reason: string) => {
    const order = orders.find((o) => o.id === orderId);
    // SÉCURITÉ : refus si commande introuvable, déjà annulée ou déjà livrée
    // (empêche double annulation et annulation post-livraison)
    if (!order || order.cancelledAt || !cancellationPolicy(order).allowed) return { fee: 0 };
    const fee = cancellationFee(order);
    const safeReason = reason.trim().slice(0, 120) || 'Non précisée';
    setOrders((prev) =>
      prev.map((o) =>
        o.id === orderId ? { ...o, cancelledAt: Date.now(), cancelReason: safeReason, cancelFee: fee } : o
      )
    );
    // Message du livreur confirmant l'annulation
    if (order) {
      const notice: ChatMessage = {
        id: 'm' + Math.random().toString(36).slice(2, 9),
        from: 'courier',
        text: fee > 0
          ? `Annulation bien reçue. Comme la prise en charge était déjà lancée, des frais de ${fee.toLocaleString('fr-FR')} FCFA s'appliquent. À bientôt j'espère 🙏`
          : `Annulation bien reçue, aucun frais appliqué. À bientôt j'espère 🙏`,
        at: Date.now() + 2000,
        read: false,
      };
      setChats((prev) => ({ ...prev, [orderId]: [...(prev[orderId] ?? []), notice] }));
    }
    return { fee };
  };

  const completeOnboarding = () => setOnboarded(true);

  // Droit à l'effacement : supprime TOUTES les données utilisateur de l'appareil
  const eraseAllData = async () => {
    setCart([]);
    setCartRestaurant(null);
    setOrders([]);
    setChats({});
    setFavorites([]);
    setUserName('Client Coursier');
    setPhone('+241 74 00 00 00');
    setDefaultQuartier('Glass');
    setMenuOverrides({});
    try {
      await AsyncStorage.removeItem('coursier_state_v1');
    } catch {}
  };

  // ─── Menu : opérations restaurant (validées côté « backend ») ──────────
  const getMenu = (restaurantId: string) => menuFor(restaurantId, menuOverrides);

  const upsertMenuItem = (restaurantId: string, item: MenuItem): { ok: boolean; error?: string } => {
    const check = validateMenuItem(item);
    if (!check.ok) return check;
    const clean: MenuItem = {
      ...item,
      name: item.name.trim().slice(0, 60),
      desc: item.desc.trim().slice(0, 160),
      emoji: (item.emoji || '🍽️').slice(0, 4),
      price: Math.round(item.price / 50) * 50,
      promoPrice: item.promoPrice != null && item.promoPrice > 0 ? Math.round(item.promoPrice / 50) * 50 : null,
      available: item.available !== false,
      photo: item.photo || null,
    };
    setMenuOverrides((prev) => {
      const current = menuFor(restaurantId, prev);
      const exists = current.some((m) => m.id === clean.id);
      const next = exists
        ? current.map((m) => (m.id === clean.id ? clean : m))
        : [...current, clean];
      return { ...prev, [restaurantId]: next };
    });
    return { ok: true };
  };

  const deleteMenuItem = (restaurantId: string, itemId: string) => {
    setMenuOverrides((prev) => {
      const current = menuFor(restaurantId, prev);
      return { ...prev, [restaurantId]: current.filter((m) => m.id !== itemId) };
    });
  };

  const toggleItemAvailable = (restaurantId: string, itemId: string) => {
    setMenuOverrides((prev) => {
      const current = menuFor(restaurantId, prev);
      return {
        ...prev,
        [restaurantId]: current.map((m) =>
          m.id === itemId ? { ...m, available: m.available === false ? true : false } : m
        ),
      };
    });
  };

  const setPromo = (restaurantId: string, itemId: string, promoPrice: number | null): { ok: boolean; error?: string } => {
    const current = menuFor(restaurantId, menuOverrides);
    const item = current.find((m) => m.id === itemId);
    if (!item) return { ok: false, error: 'Plat introuvable.' };
    if (promoPrice != null) {
      const check = validateMenuItem({ ...item, promoPrice });
      if (!check.ok) return check;
    }
    setMenuOverrides((prev) => {
      const cur = menuFor(restaurantId, prev);
      return {
        ...prev,
        [restaurantId]: cur.map((m) => (m.id === itemId ? { ...m, promoPrice: promoPrice ?? null } : m)),
      };
    });
    return { ok: true };
  };

  const value = useMemo(
    () => ({
      cart, cartRestaurant, addToCart, changeQty, clearCart,
      orders, placeOrder, rateOrder, cancelOrder, advanceOrder, acceptOrderResto, claimOrder,
      chats, sendMessage, sendCourierMessage, markChatRead, markChatReadCourier, unreadCount, unreadForCourier, favorites, toggleFavorite,
      userName, setUserName, phone, setPhone, defaultQuartier, setDefaultQuartier,
      onboarded, completeOnboarding, eraseAllData,
      menuOverrides, getMenu, upsertMenuItem, deleteMenuItem, toggleItemAvailable, setPromo,
    }),
    [cart, cartRestaurant, orders, chats, favorites, userName, phone, defaultQuartier, onboarded, menuOverrides]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export const STEP_MS = 40_000;

export function orderSteps(type: Order['type']): { label: string; icon: string }[] {
  if (type === 'resto')
    return [
      { label: 'Commande confirmée', icon: 'checkmark-circle' },
      { label: 'En préparation au restaurant', icon: 'restaurant' },
      { label: 'Livreur en route', icon: 'bicycle' },
      { label: 'Livrée — bon appétit !', icon: 'happy' },
    ];
  if (type === 'colis')
    return [
      { label: 'Demande confirmée', icon: 'checkmark-circle' },
      { label: 'Livreur parti récupérer le colis', icon: 'navigate' },
      { label: 'Colis en route vers le destinataire', icon: 'bicycle' },
      { label: 'Colis livré et remis en main propre', icon: 'hand-left' },
    ];
  return [
    { label: 'Mission confirmée', icon: 'checkmark-circle' },
    { label: 'Coursier en mission', icon: 'walk' },
    { label: 'Mission accomplie, retour en cours', icon: 'bicycle' },
    { label: 'Livré / Compte-rendu remis', icon: 'document-text' },
  ];
}

export function orderProgress(createdAt: number): number {
  return Math.min(3, Math.floor((Date.now() - createdAt) / STEP_MS));
}

// Progression effective : si un livreur/restaurant a agi manuellement,
// c'est sa décision qui prime sur le minuteur automatique.
export function effectiveProgress(o: Order): number {
  if (o.manualStep !== undefined) return Math.max(o.manualStep, orderProgress(o.createdAt));
  return orderProgress(o.createdAt);
}

export function statusLabel(o: Order): { text: string; done: boolean; cancelled?: boolean } {
  if (o.cancelledAt) return { text: 'Commande annulée', done: true, cancelled: true };
  const p = effectiveProgress(o);
  const steps = orderSteps(o.type);
  return { text: steps[p].label, done: p >= 3 };
}

// ─── Politique d'annulation ──────────────────────────────────────────
// La pénalité ne s'applique QUE si la commande n'est pas annulée à temps,
// c.-à-d. quand un travail a déjà été engagé :
//
// RESTO   ▸ étape 0 : gratuit (le restaurant n'a rien commencé)
//         ▸ étape 1 : le plat est DÉJÀ PRÉPARÉ → prix des articles dû
//                     (invendable), frais de livraison remboursés
//         ▸ étape 2 : plat préparé + livreur en route → total complet
//
// COLIS   ▸ étape 0 : gratuit (le livreur n'est pas encore parti)
//         ▸ étape 1 : le livreur s'est DÉPLACÉ pour récupérer → 50 %
//         ▸ étape 2 : le colis est DÉJÀ RÉCUPÉRÉ et en route → 100 %
//
// MISSION ▸ étape 0 : gratuit
//         ▸ étape 1 : le coursier a DÉJÀ COMMENCÉ → 50 % des frais
//         ▸ étape 2 : mission accomplie, retour en cours → 100 %
//
// Étape 3 (livrée) : annulation impossible.

export function cancellationPolicy(o: Order): {
  allowed: boolean;
  feePct: number;
  label: string;
  detail: string;
} {
  if (o.cancelledAt) return { allowed: false, feePct: 0, label: 'Déjà annulée', detail: '' };
  const p = effectiveProgress(o);

  if (p >= 3)
    return { allowed: false, feePct: 0, label: 'Déjà livrée', detail: 'Une commande livrée ne peut plus être annulée.' };

  if (p === 0)
    return {
      allowed: true, feePct: 0, label: 'Annulation gratuite',
      detail: o.type === 'resto'
        ? 'Le restaurant n\'a pas encore commencé la préparation : vous pouvez annuler sans frais.'
        : 'Le livreur n\'est pas encore parti : vous pouvez annuler sans frais.',
    };

  if (o.type === 'resto') {
    if (p === 1)
      return {
        allowed: true, feePct: 100, label: 'Le plat est déjà préparé',
        detail: 'Le restaurant a déjà préparé votre commande : elle ne peut pas être revendue. Le prix des plats reste dû (les frais de livraison sont remboursés).',
      };
    return {
      allowed: true, feePct: 100, label: 'Plat préparé, livreur en route',
      detail: 'La commande est préparée et le livreur roule déjà vers vous. Le montant total reste dû.',
    };
  }

  if (o.type === 'colis') {
    if (p === 1)
      return {
        allowed: true, feePct: 50, label: 'Le livreur s\'est déjà déplacé',
        detail: 'Le livreur est parti récupérer votre colis : 50 % du prix couvre son déplacement.',
      };
    return {
      allowed: true, feePct: 100, label: 'Le colis est déjà récupéré',
      detail: 'Le colis est entre les mains du livreur et en route : la course est due en totalité (le colis sera retourné à l\'expéditeur).',
    };
  }

  // Mission / course personnalisée
  if (p === 1)
    return {
      allowed: true, feePct: 50, label: 'Le coursier a déjà commencé',
      detail: 'Le coursier est en pleine mission : 50 % des frais de service couvrent le travail engagé.',
    };
  return {
    allowed: true, feePct: 100, label: 'Mission déjà accomplie',
    detail: 'La mission est terminée, le coursier est sur le retour : les frais sont dus en totalité.',
  };
}

export function cancellationFee(o: Order): number {
  const pol = cancellationPolicy(o);
  if (!pol.allowed || pol.feePct === 0) return 0;
  // Resto à l'étape 1 : les plats restent dus mais la livraison est remboursée
  if (o.type === 'resto' && effectiveProgress(o) === 1 && o.items) {
    const itemsTotal = o.items.reduce((s, l) => s + l.price * l.qty, 0);
    return Math.round(itemsTotal / 50) * 50;
  }
  return Math.round((o.total * pol.feePct) / 100 / 50) * 50; // arrondi aux 50 FCFA
}
