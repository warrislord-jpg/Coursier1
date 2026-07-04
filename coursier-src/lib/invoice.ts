// ─── Module de facturation — Conformité fiscale Gabon ──────────────────
//
// Références réglementaires intégrées :
// • TVA taux normal 18 % : s'applique aux FRAIS DE SERVICE Coursier
//   (livraison, commission plateforme) — PAS au prix des plats, qui
//   relève de la TVA propre du restaurant.
// • Seuil d'assujettissement : CA HT > 60 000 000 FCFA/an.
//   Sous ce seuil → mention « TVA non applicable » OBLIGATOIRE sur facture.
// • Loi n°041/2025 du 29/12/2025 (loi de finances 2026) : facturation
//   électronique normalisée obligatoire. Ce module génère des factures
//   structurées prêtes pour la plateforme E-tax de la DGI.
// • Service C (courses) : le budget d'achat avancé est un FONDS DE PASSAGE
//   (responsabilité fiduciaire) — jamais compté dans le CA de Coursier.

import { Order } from './types';
import { effectiveProgress } from './store';

export const TVA_RATE = 0.18; // taux normal Gabon — frais de service
export const TVA_THRESHOLD_FCFA = 60_000_000; // seuil d'assujettissement annuel HT

// Statut TVA de la plateforme (démo : sous le seuil au démarrage).
// À basculer à true quand le CA HT annuel dépasse 60 M FCFA.
export const PLATFORM_VAT_REGISTERED = false;

export type InvoiceLine = {
  label: string;
  amountHT: number;
  tvaRate: number; // 0 si non applicable / fonds de passage
  category: 'service' | 'passthrough'; // passthrough = fonds de passage (plats, budget d'achat)
};

export type Invoice = {
  number: string; // numérotation séquentielle normalisée
  orderId: string;
  issuedAt: number;
  lines: InvoiceLine[];
  totalHT: number; // uniquement les frais de service Coursier
  totalTVA: number;
  totalTTC: number;
  passthroughTotal: number; // fonds de passage (non-CA)
  vatMention: string; // mention légale obligatoire
  type: 'invoice' | 'credit_note'; // avoir en cas d'annulation
};

let invoiceCounter = 0;

function nextInvoiceNumber(prefix: string): string {
  invoiceCounter += 1;
  const year = new Date().getFullYear();
  return `${prefix}-${year}-${String(invoiceCounter).padStart(5, '0')}`;
}

// Décompose une commande en lignes de facture conformes :
// frais de service Coursier (assujettis TVA) vs fonds de passage.
export function buildInvoiceLines(o: Order): InvoiceLine[] {
  const lines: InvoiceLine[] = [];
  const rate = PLATFORM_VAT_REGISTERED ? TVA_RATE : 0;

  if (o.type === 'resto') {
    const itemsTotal = o.items?.reduce((s, l) => s + l.price * l.qty, 0) ?? 0;
    const feeDetail = o.details.find((d) => d.label === 'Frais de livraison');
    const fee = feeDetail ? parseInt(feeDetail.value.replace(/\D/g, '')) || 0 : 0;
    if (itemsTotal > 0)
      lines.push({
        label: 'Articles restaurant (TVA du restaurant — fonds reversés)',
        amountHT: itemsTotal,
        tvaRate: 0,
        category: 'passthrough',
      });
    if (fee > 0)
      lines.push({
        label: 'Frais de livraison Coursier',
        amountHT: fee,
        tvaRate: rate,
        category: 'service',
      });
  } else if (o.type === 'colis') {
    lines.push({
      label: 'Frais de course — livraison de colis',
      amountHT: o.total,
      tvaRate: rate,
      category: 'service',
    });
  } else {
    // Mission : les frais de service sont du CA ; le budget d'achat avancé
    // est un fonds de passage remboursé sur ticket (jamais du CA).
    lines.push({
      label: 'Frais de service — course personnalisée',
      amountHT: o.total,
      tvaRate: rate,
      category: 'service',
    });
    const budget = o.details.find((d) => d.label === 'Budget d\'achat prévu');
    if (budget && !budget.value.startsWith('Aucun')) {
      lines.push({
        label: 'Budget d\'achat avancé (fonds de passage — ticket à l\'appui)',
        amountHT: 0, // le montant réel est réconcilié au ticket
        tvaRate: 0,
        category: 'passthrough',
      });
    }
  }
  return lines;
}

export function generateInvoice(o: Order): Invoice {
  const lines = buildInvoiceLines(o);
  const serviceLines = lines.filter((l) => l.category === 'service');
  const totalHT = serviceLines.reduce((s, l) => s + l.amountHT, 0);
  const totalTVA = Math.round(serviceLines.reduce((s, l) => s + l.amountHT * l.tvaRate, 0));
  const passthroughTotal = lines
    .filter((l) => l.category === 'passthrough')
    .reduce((s, l) => s + l.amountHT, 0);

  return {
    number: nextInvoiceNumber('CR-FAC'),
    orderId: o.id,
    issuedAt: Date.now(),
    lines,
    totalHT,
    totalTVA,
    totalTTC: totalHT + totalTVA + passthroughTotal,
    passthroughTotal,
    vatMention: PLATFORM_VAT_REGISTERED
      ? `TVA 18 % — Régime réel. Facture électronique normalisée (loi n°041/2025).`
      : `TVA non applicable — CA annuel HT inférieur au seuil de 60 000 000 FCFA (art. CGI Gabon). Facture électronique normalisée (loi n°041/2025).`,
    type: 'invoice',
  };
}

// Avoir (note de crédit) en cas d'annulation : la pénalité éventuelle
// reste facturée, le reste est remboursé.
export function generateCreditNote(o: Order): Invoice {
  const fee = o.cancelFee ?? 0;
  const rate = PLATFORM_VAT_REGISTERED ? TVA_RATE : 0;
  const lines: InvoiceLine[] = [
    {
      label: 'Annulation de commande — remboursement',
      amountHT: -(o.total - fee),
      tvaRate: 0,
      category: 'passthrough',
    },
  ];
  if (fee > 0) {
    lines.push({
      label: `Pénalité d'annulation hors délai (${o.cancelReason ?? ''})`,
      amountHT: fee,
      tvaRate: rate,
      category: 'service',
    });
  }
  const totalTVA = Math.round(fee * rate);
  return {
    number: nextInvoiceNumber('CR-AVR'),
    orderId: o.id,
    issuedAt: Date.now(),
    lines,
    totalHT: fee,
    totalTVA,
    totalTTC: fee + totalTVA,
    passthroughTotal: -(o.total - fee),
    vatMention: PLATFORM_VAT_REGISTERED
      ? `TVA 18 % — Régime réel. Avoir électronique normalisé (loi n°041/2025).`
      : `TVA non applicable — CA annuel HT inférieur au seuil de 60 000 000 FCFA. Avoir électronique normalisé (loi n°041/2025).`,
    type: 'credit_note',
  };
}

// Réconciliation comptable pour l'admin : séparation stricte
// CA Coursier (frais de service) vs fonds de passage (art. 5.2 protection financière)
export function accountingSummary(orders: Order[]): {
  serviceRevenueHT: number; // CA réel Coursier
  tvaCollected: number;
  passthroughFunds: number; // fonds clients "de passage" (plats + budgets)
  penaltiesHT: number;
  vatStatus: string;
} {
  let serviceRevenueHT = 0;
  let tvaCollected = 0;
  let passthroughFunds = 0;
  let penaltiesHT = 0;

  for (const o of orders) {
    if (o.cancelledAt) {
      const fee = o.cancelFee ?? 0;
      penaltiesHT += fee;
      serviceRevenueHT += fee;
      if (PLATFORM_VAT_REGISTERED) tvaCollected += Math.round(fee * TVA_RATE);
      continue;
    }
    if (effectiveProgress(o) < 3) continue; // seules les commandes livrées comptent
    const lines = buildInvoiceLines(o);
    for (const l of lines) {
      if (l.category === 'service') {
        serviceRevenueHT += l.amountHT;
        tvaCollected += Math.round(l.amountHT * l.tvaRate);
      } else {
        passthroughFunds += l.amountHT;
      }
    }
  }

  return {
    serviceRevenueHT,
    tvaCollected,
    passthroughFunds,
    penaltiesHT,
    vatStatus: PLATFORM_VAT_REGISTERED
      ? 'Assujetti TVA 18 % (CA > 60 M FCFA/an) — déclaration mensuelle avant le 20'
      : 'TVA non applicable (CA < 60 M FCFA/an) — mention obligatoire sur factures',
  };
}
