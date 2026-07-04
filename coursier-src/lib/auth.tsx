import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { hashPin, generateSalt, lockDuration, PIN_DEFAULTS } from './security';
import { RESTAURANT_ACCOUNTS, accountByUsername } from './restaurantAccounts';
import { COURIER_ACCOUNTS } from './courierAccounts';

export type Role = 'client' | 'courier' | 'restaurant' | 'admin';

export type AuditEntry = {
  id: string;
  at: number;
  role: string;
  event: 'login_success' | 'login_fail' | 'lockout' | 'logout' | 'pin_changed';
  detail?: string;
};

type AuthState = {
  salt: string;
  pins: Record<string, string>; // hashés, jamais en clair (rôles + comptes restos "resto:rX")
  failures: Record<string, number>;
  locks: Record<string, number>; // timestamp de fin de verrouillage
  audit: AuditEntry[];
};

type AuthCtx = {
  role: Role | null;
  // Restaurant connecté (comptes individuels par restaurant)
  restaurantId: string | null;
  // Livreur connecté (comptes individuels par livreur)
  courierId: string | null;
  login: (role: Role, pin?: string) => { ok: boolean; error?: string };
  loginRestaurant: (username: string, pin: string) => { ok: boolean; error?: string };
  loginCourier: (username: string, pin: string) => { ok: boolean; error?: string };
  logout: () => void;
  audit: AuditEntry[];
  lockedUntil: (key: string) => number;
  failuresFor: (key: string) => number;
  changePin: (role: Role, currentAdminPin: string, newPin: string) => { ok: boolean; error?: string };
  resetRestaurantPin: (restaurantId: string, currentAdminPin: string, newPin: string) => { ok: boolean; error?: string };
  resetCourierPin: (courierId: string, currentAdminPin: string, newPin: string) => { ok: boolean; error?: string };
  changeOwnRestaurantPin: (currentPin: string, newPin: string) => { ok: boolean; error?: string };
  ready: boolean;
};

const Ctx = createContext<AuthCtx | null>(null);
export const useAuth = () => {
  const c = useContext(Ctx);
  if (!c) throw new Error('auth');
  return c;
};

const KEY = 'coursier_auth_v2';

function freshState(): AuthState {
  const salt = generateSalt();
  const pins: Record<string, string> = {
    admin: hashPin(salt, 'admin', PIN_DEFAULTS.admin),
  };
  // Un PIN individuel par compte restaurant
  for (const acc of RESTAURANT_ACCOUNTS) {
    pins[`resto:${acc.restaurantId}`] = hashPin(salt, `resto:${acc.restaurantId}`, acc.defaultPin);
  }
  // Un PIN individuel par compte livreur
  for (const acc of COURIER_ACCOUNTS) {
    pins[`courier:${acc.courierId}`] = hashPin(salt, `courier:${acc.courierId}`, acc.defaultPin);
  }
  return { salt, pins, failures: {}, locks: {}, audit: [] };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState | null>(null);
  // Le rôle vit uniquement en mémoire : fermer l'app = session terminée.
  const [role, setRole] = useState<Role | null>(null);
  const [restaurantId, setRestaurantId] = useState<string | null>(null);
  const [courierId, setCourierId] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(KEY);
        if (raw) {
          const parsed: AuthState = JSON.parse(raw);
          // Migration : s'assurer que chaque compte resto/livreur a bien son PIN
          let changed = false;
          for (const acc of RESTAURANT_ACCOUNTS) {
            const k = `resto:${acc.restaurantId}`;
            if (!parsed.pins[k]) {
              parsed.pins[k] = hashPin(parsed.salt, k, acc.defaultPin);
              changed = true;
            }
          }
          for (const acc of COURIER_ACCOUNTS) {
            const k = `courier:${acc.courierId}`;
            if (!parsed.pins[k]) {
              parsed.pins[k] = hashPin(parsed.salt, k, acc.defaultPin);
              changed = true;
            }
          }
          setState(parsed);
          if (changed) AsyncStorage.setItem(KEY, JSON.stringify(parsed)).catch(() => {});
          return;
        }
      } catch {}
      const s = freshState();
      setState(s);
      AsyncStorage.setItem(KEY, JSON.stringify(s)).catch(() => {});
    })();
  }, []);

  const persist = (s: AuthState) => {
    setState(s);
    AsyncStorage.setItem(KEY, JSON.stringify(s)).catch(() => {});
  };

  const log = (s: AuthState, entry: Omit<AuditEntry, 'id' | 'at'>): AuthState => ({
    ...s,
    audit: [
      { ...entry, id: 'a' + Math.random().toString(36).slice(2, 9), at: Date.now() },
      ...s.audit,
    ].slice(0, 60),
  });

  // Vérification générique d'un PIN pour une clé (rôle ou compte resto)
  const verifyPin = (
    s: AuthState,
    key: string,
    label: string,
    pin: string
  ): { ok: boolean; error?: string; next: AuthState } => {
    const lockEnd = s.locks[key] ?? 0;
    if (Date.now() < lockEnd) {
      const mins = Math.ceil((lockEnd - Date.now()) / 60000);
      return { ok: false, error: `Accès verrouillé. Réessayez dans ${mins} min.`, next: s };
    }
    const expected = s.pins[key];
    const given = hashPin(s.salt, key, pin);
    if (expected && given === expected) {
      return { ok: true, next: log({ ...s, failures: { ...s.failures, [key]: 0 } }, { role: label, event: 'login_success' }) };
    }
    const failures = (s.failures[key] ?? 0) + 1;
    const dur = lockDuration(failures);
    let s2: AuthState = { ...s, failures: { ...s.failures, [key]: failures } };
    if (dur > 0) {
      s2 = { ...s2, locks: { ...s2.locks, [key]: Date.now() + dur } };
      s2 = log(s2, { role: label, event: 'lockout', detail: `${failures} échecs → verrouillé ${Math.round(dur / 1000)}s` });
    } else {
      s2 = log(s2, { role: label, event: 'login_fail', detail: `Tentative ${failures}` });
    }
    const left = Math.max(0, 3 - failures);
    return {
      ok: false,
      error: dur > 0
        ? `PIN incorrect. Accès verrouillé ${Math.round(dur / 1000) >= 60 ? Math.round(dur / 60000) + ' min' : Math.round(dur / 1000) + ' s'}.`
        : `PIN incorrect. ${left} essai${left > 1 ? 's' : ''} avant verrouillage.`,
      next: s2,
    };
  };

  const login = (r: Role, pin?: string): { ok: boolean; error?: string } => {
    if (!state) return { ok: false, error: 'Initialisation…' };
    if (r === 'client') {
      persist(log(state, { role: r, event: 'login_success' }));
      setRole('client');
      setRestaurantId(null);
      return { ok: true };
    }
    if (r === 'restaurant') {
      // Le rôle restaurant passe obligatoirement par loginRestaurant (compte individuel)
      return { ok: false, error: 'Utilisez votre identifiant restaurant.' };
    }
    if (r === 'courier') {
      // Le rôle livreur passe obligatoirement par loginCourier (compte individuel)
      return { ok: false, error: 'Utilisez votre identifiant livreur.' };
    }
    const res = verifyPin(state, r, r, pin ?? '');
    persist(res.next);
    if (res.ok) {
      setRole(r);
      setRestaurantId(null);
      setCourierId(null);
    }
    return { ok: res.ok, error: res.error };
  };

  // Connexion d'un livreur : identifiant + PIN individuel
  const loginCourier = (username: string, pin: string): { ok: boolean; error?: string } => {
    if (!state) return { ok: false, error: 'Initialisation…' };
    const u = username.trim().toLowerCase();
    const acc = COURIER_ACCOUNTS.find((a) => a.username === u);
    if (!acc) {
      persist(log(state, { role: 'courier', event: 'login_fail', detail: `Identifiant inconnu : ${u.slice(0, 20)}` }));
      return { ok: false, error: 'Identifiant livreur inconnu.' };
    }
    const key = `courier:${acc.courierId}`;
    const res = verifyPin(state, key, `courier(${acc.username})`, pin);
    persist(res.next);
    if (res.ok) {
      setRole('courier');
      setCourierId(acc.courierId);
      setRestaurantId(null);
    }
    return { ok: res.ok, error: res.error };
  };

  // Connexion d'un restaurant : identifiant + PIN individuel
  const loginRestaurant = (username: string, pin: string): { ok: boolean; error?: string } => {
    if (!state) return { ok: false, error: 'Initialisation…' };
    const acc = accountByUsername(username);
    if (!acc) {
      persist(log(state, { role: 'restaurant', event: 'login_fail', detail: `Identifiant inconnu : ${username.slice(0, 20)}` }));
      return { ok: false, error: 'Identifiant restaurant inconnu.' };
    }
    const key = `resto:${acc.restaurantId}`;
    const res = verifyPin(state, key, `restaurant(${acc.username})`, pin);
    persist(res.next);
    if (res.ok) {
      setRole('restaurant');
      setRestaurantId(acc.restaurantId);
    }
    return { ok: res.ok, error: res.error };
  };

  const logout = () => {
    if (state && role) {
      const label = restaurantId ? `restaurant(${restaurantId})` : courierId ? `courier(${courierId})` : role;
      persist(log(state, { role: label, event: 'logout' }));
    }
    setRole(null);
    setRestaurantId(null);
    setCourierId(null);
  };

  const changePin = (r: Role, currentAdminPin: string, newPin: string) => {
    if (!state) return { ok: false, error: 'Initialisation…' };
    if (role !== 'admin') return { ok: false, error: 'Réservé à l’administrateur.' };
    const adminOk = hashPin(state.salt, 'admin', currentAdminPin) === state.pins.admin;
    if (!adminOk) return { ok: false, error: 'PIN administrateur incorrect.' };
    if (!/^\d{4,6}$/.test(newPin)) return { ok: false, error: 'Le PIN doit faire 4 à 6 chiffres.' };
    const s2 = log(
      { ...state, pins: { ...state.pins, [r]: hashPin(state.salt, r, newPin) } },
      { role: r, event: 'pin_changed', detail: `PIN ${r} modifié par l’admin` }
    );
    persist(s2);
    return { ok: true };
  };

  // L'admin réinitialise le PIN d'un livreur précis
  const resetCourierPin = (cid: string, currentAdminPin: string, newPin: string) => {
    if (!state) return { ok: false, error: 'Initialisation…' };
    if (role !== 'admin') return { ok: false, error: 'Réservé à l’administrateur.' };
    const adminOk = hashPin(state.salt, 'admin', currentAdminPin) === state.pins.admin;
    if (!adminOk) return { ok: false, error: 'PIN administrateur incorrect.' };
    if (!/^\d{4,6}$/.test(newPin)) return { ok: false, error: 'Le PIN doit faire 4 à 6 chiffres.' };
    const key = `courier:${cid}`;
    const s2 = log(
      { ...state, pins: { ...state.pins, [key]: hashPin(state.salt, key, newPin) }, locks: { ...state.locks, [key]: 0 }, failures: { ...state.failures, [key]: 0 } },
      { role: `courier(${cid})`, event: 'pin_changed', detail: 'PIN réinitialisé par l’admin' }
    );
    persist(s2);
    return { ok: true };
  };

  // L'admin réinitialise le PIN d'un restaurant précis
  const resetRestaurantPin = (rid: string, currentAdminPin: string, newPin: string) => {
    if (!state) return { ok: false, error: 'Initialisation…' };
    if (role !== 'admin') return { ok: false, error: 'Réservé à l’administrateur.' };
    const adminOk = hashPin(state.salt, 'admin', currentAdminPin) === state.pins.admin;
    if (!adminOk) return { ok: false, error: 'PIN administrateur incorrect.' };
    if (!/^\d{4,6}$/.test(newPin)) return { ok: false, error: 'Le PIN doit faire 4 à 6 chiffres.' };
    const key = `resto:${rid}`;
    const s2 = log(
      { ...state, pins: { ...state.pins, [key]: hashPin(state.salt, key, newPin) }, locks: { ...state.locks, [key]: 0 }, failures: { ...state.failures, [key]: 0 } },
      { role: `restaurant(${rid})`, event: 'pin_changed', detail: 'PIN réinitialisé par l’admin' }
    );
    persist(s2);
    return { ok: true };
  };

  // Un restaurant connecté change son propre PIN
  const changeOwnRestaurantPin = (currentPin: string, newPin: string) => {
    if (!state) return { ok: false, error: 'Initialisation…' };
    if (role !== 'restaurant' || !restaurantId) return { ok: false, error: 'Réservé aux restaurants connectés.' };
    const key = `resto:${restaurantId}`;
    const ok = hashPin(state.salt, key, currentPin) === state.pins[key];
    if (!ok) return { ok: false, error: 'PIN actuel incorrect.' };
    if (!/^\d{4,6}$/.test(newPin)) return { ok: false, error: 'Le PIN doit faire 4 à 6 chiffres.' };
    const s2 = log(
      { ...state, pins: { ...state.pins, [key]: hashPin(state.salt, key, newPin) } },
      { role: `restaurant(${restaurantId})`, event: 'pin_changed', detail: 'PIN modifié par le restaurant' }
    );
    persist(s2);
    return { ok: true };
  };

  const value = useMemo<AuthCtx>(
    () => ({
      role,
      restaurantId,
      courierId,
      login,
      loginRestaurant,
      loginCourier,
      logout,
      audit: state?.audit ?? [],
      lockedUntil: (k) => state?.locks[k] ?? 0,
      failuresFor: (k) => state?.failures[k] ?? 0,
      changePin,
      resetRestaurantPin,
      resetCourierPin,
      changeOwnRestaurantPin,
      ready: !!state,
    }),
    [role, restaurantId, courierId, state]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
