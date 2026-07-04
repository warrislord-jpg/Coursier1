// ─── Module de sécurité ──────────────────────────────────────────────
// • Les PIN ne sont JAMAIS stockés en clair : SHA-256 salé + 500 itérations
// • Sel aléatoire généré par installation (le même PIN donne un hash
//   différent sur chaque appareil → inutilisable si volé)
// • Verrouillage progressif après échecs (anti force-brute)
// • Journal d'audit inviolable côté app (append-only)

// SHA-256 — implémentation pure JS (aucune dépendance externe)
export function sha256(ascii: string): string {
  function rightRotate(value: number, amount: number) {
    return (value >>> amount) | (value << (32 - amount));
  }
  const mathPow = Math.pow;
  const maxWord = mathPow(2, 32);
  let result = '';

  const words: number[] = [];
  const asciiBitLength = ascii.length * 8;

  let hash: number[] = (sha256 as any).h = (sha256 as any).h || [];
  const k: number[] = (sha256 as any).k = (sha256 as any).k || [];
  let primeCounter = k.length;

  const isComposite: Record<number, number> = {};
  for (let candidate = 2; primeCounter < 64; candidate++) {
    if (!isComposite[candidate]) {
      for (let i = 0; i < 313; i += candidate) isComposite[i] = candidate;
      hash[primeCounter] = (mathPow(candidate, 0.5) * maxWord) | 0;
      k[primeCounter++] = (mathPow(candidate, 1 / 3) * maxWord) | 0;
    }
  }

  ascii += '\x80';
  while ((ascii.length % 64) - 56) ascii += '\x00';
  for (let i = 0; i < ascii.length; i++) {
    const j = ascii.charCodeAt(i);
    if (j >> 8) return '';
    words[i >> 2] |= j << (((3 - i) % 4) * 8);
  }
  words[words.length] = (asciiBitLength / maxWord) | 0;
  words[words.length] = asciiBitLength;

  hash = hash.slice(0, 8);

  for (let j = 0; j < words.length; ) {
    const w = words.slice(j, (j += 16));
    const oldHash = hash.slice(0);

    for (let i = 0; i < 64; i++) {
      const w15 = w[i - 15], w2 = w[i - 2];
      const a = hash[0], e = hash[4];
      const temp1 =
        hash[7] +
        (rightRotate(e, 6) ^ rightRotate(e, 11) ^ rightRotate(e, 25)) +
        ((e & hash[5]) ^ (~e & hash[6])) +
        k[i] +
        (w[i] =
          i < 16
            ? w[i]
            : (w[i - 16] +
                (rightRotate(w15, 7) ^ rightRotate(w15, 18) ^ (w15 >>> 3)) +
                w[i - 7] +
                (rightRotate(w2, 17) ^ rightRotate(w2, 19) ^ (w2 >>> 10))) |
              0);
      const temp2 =
        (rightRotate(a, 2) ^ rightRotate(a, 13) ^ rightRotate(a, 22)) +
        ((a & hash[1]) ^ (a & hash[2]) ^ (hash[1] & hash[2]));

      hash = [(temp1 + temp2) | 0].concat(hash);
      hash[4] = (hash[4] + temp1) | 0;
    }

    for (let i = 0; i < 8; i++) {
      hash[i] = (hash[i] + oldHash[i]) | 0;
    }
  }

  for (let i = 0; i < 8; i++) {
    for (let j = 3; j + 1; j--) {
      const b = (hash[i] >> (j * 8)) & 255;
      result += (b < 16 ? '0' : '') + b.toString(16);
    }
  }
  return result;
}

// Hachage renforcé : sel + rôle + PIN, itéré 500 fois
export function hashPin(salt: string, role: string, pin: string): string {
  let h = `${salt}::${role}::${pin}`;
  for (let i = 0; i < 500; i++) h = sha256(h);
  return h;
}

export function generateSalt(): string {
  let s = '';
  for (let i = 0; i < 4; i++) s += Math.random().toString(36).slice(2);
  return s + Date.now().toString(36);
}

// Verrouillage progressif : 3 échecs → 30 s, 5 → 5 min, 8+ → 30 min
export function lockDuration(failures: number): number {
  if (failures >= 8) return 30 * 60_000;
  if (failures >= 5) return 5 * 60_000;
  if (failures >= 3) return 30_000;
  return 0;
}

// Seul l'admin garde un PIN de rôle global.
// Livreurs et restaurants ont des comptes individuels
// (voir courierAccounts.ts et restaurantAccounts.ts).
export const PIN_DEFAULTS: Record<string, string> = {
  admin: '9024',
};
