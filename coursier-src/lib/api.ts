import { supabase } from './supabase';
import { MenuItem, Restaurant } from './types';

// ─── Restaurants & menus (lecture publique, Supabase) ──────────────────

type DbRestaurant = {
  id: string;
  name: string;
  cuisine: string | null;
  quartier: string | null;
  rating: number | null;
  reviews: number | null;
  delivery_time: string | null;
  delivery_fee: number | null;
  emoji: string | null;
  color: string | null;
  tags: string[] | null;
};

type DbMenuItem = {
  id: string;
  restaurant_id: string;
  name: string;
  description: string | null;
  price: number;
  emoji: string | null;
  promo_price: number | null;
  available: boolean;
  photo_url: string | null;
};

function toMenuItem(m: DbMenuItem): MenuItem {
  return {
    id: m.id,
    name: m.name,
    desc: m.description ?? '',
    price: m.price,
    emoji: m.emoji ?? '🍽️',
    promoPrice: m.promo_price ?? null,
    available: m.available,
    photo: m.photo_url ?? null,
  };
}

function toRestaurant(r: DbRestaurant, menu: MenuItem[]): Restaurant {
  return {
    id: r.id,
    name: r.name,
    cuisine: r.cuisine ?? '',
    quartier: r.quartier ?? '',
    rating: r.rating ?? 0,
    reviews: r.reviews ?? 0,
    deliveryTime: r.delivery_time ?? '',
    deliveryFee: r.delivery_fee ?? 0,
    emoji: r.emoji ?? '🍽️',
    color: r.color ?? '#EEEEEE',
    tags: r.tags ?? [],
    menu,
  };
}

// Récupère tous les restaurants + leurs menus en 2 requêtes (pas de N+1).
export async function fetchRestaurants(): Promise<{ ok: boolean; data: Restaurant[]; error?: string }> {
  const [{ data: restos, error: err1 }, { data: items, error: err2 }] = await Promise.all([
    supabase.from('restaurants').select('*').order('name'),
    supabase.from('menu_items').select('*'),
  ]);
  if (err1 || err2) return { ok: false, data: [], error: (err1 ?? err2)?.message };

  const byResto = new Map<string, MenuItem[]>();
  for (const it of (items ?? []) as DbMenuItem[]) {
    const arr = byResto.get(it.restaurant_id) ?? [];
    arr.push(toMenuItem(it));
    byResto.set(it.restaurant_id, arr);
  }
  const result = ((restos ?? []) as DbRestaurant[]).map((r) => toRestaurant(r, byResto.get(r.id) ?? []));
  return { ok: true, data: result };
}

// ─── Écriture menu (côté restaurant) ────────────────────────────────────

export async function upsertMenuItemRemote(
  restaurantId: string,
  item: MenuItem
): Promise<{ ok: boolean; error?: string }> {
  const { error } = await supabase.from('menu_items').upsert({
    id: item.id,
    restaurant_id: restaurantId,
    name: item.name,
    description: item.desc,
    price: item.price,
    emoji: item.emoji,
    promo_price: item.promoPrice ?? null,
    available: item.available !== false,
    photo_url: item.photo ?? null,
    updated_at: new Date().toISOString(),
  });
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export async function deleteMenuItemRemote(itemId: string): Promise<{ ok: boolean; error?: string }> {
  const { error } = await supabase.from('menu_items').delete().eq('id', itemId);
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export async function toggleItemAvailableRemote(
  itemId: string,
  available: boolean
): Promise<{ ok: boolean; error?: string }> {
  const { error } = await supabase.from('menu_items').update({ available }).eq('id', itemId);
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export async function setPromoRemote(
  itemId: string,
  promoPrice: number | null
): Promise<{ ok: boolean; error?: string }> {
  const { error } = await supabase.from('menu_items').update({ promo_price: promoPrice }).eq('id', itemId);
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

// ─── Auth par PIN (RPC security definer côté Supabase) ──────────────────

export async function loginCourierRemote(
  username: string,
  pin: string
): Promise<{ ok: boolean; courierId?: string; name?: string; error?: string }> {
  const { data, error } = await supabase.rpc('login_courier', { p_username: username, p_pin: pin });
  if (error) return { ok: false, error: error.message };
  const row = data?.[0];
  if (!row?.ok) return { ok: false, error: row?.error ?? 'Échec de connexion' };
  return { ok: true, courierId: row.courier_id, name: row.name };
}

export async function loginRestaurantRemote(
  username: string,
  pin: string
): Promise<{ ok: boolean; restaurantId?: string; error?: string }> {
  const { data, error } = await supabase.rpc('login_restaurant', { p_username: username, p_pin: pin });
  if (error) return { ok: false, error: error.message };
  const row = data?.[0];
  if (!row?.ok) return { ok: false, error: row?.error ?? 'Échec de connexion' };
  return { ok: true, restaurantId: row.restaurant_id };
}

export async function loginAdminRemote(
  username: string,
  pin: string
): Promise<{ ok: boolean; error?: string }> {
  const { data, error } = await supabase.rpc('login_admin', { p_username: username, p_pin: pin });
  if (error) return { ok: false, error: error.message };
  const row = data?.[0];
  if (!row?.ok) return { ok: false, error: row?.error ?? 'Échec de connexion' };
  return { ok: true };
}
