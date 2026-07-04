import React, { useCallback, useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, TextInput, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useFocusEffect } from '@react-navigation/native';
import { colors, radius, shadow, fcfa } from '../../lib/theme';
import { useStore, statusLabel, effectiveProgress } from '../../lib/store';
import { useAuth, Role } from '../../lib/auth';
import { accountingSummary } from '../../lib/invoice';
import { Order } from '../../lib/types';
import { RESTAURANTS } from '../../lib/data';
import { RESTAURANT_ACCOUNTS } from '../../lib/restaurantAccounts';
import { COURIER_ACCOUNTS } from '../../lib/courierAccounts';
import { courierEarning } from '../courier/CourierHomeScreen';

const TYPE_META: Record<Order['type'], { emoji: string; label: string }> = {
  resto: { emoji: '🍽️', label: 'Resto' },
  colis: { emoji: '📦', label: 'Colis' },
  course: { emoji: '🏃', label: 'Mission' },
};

export default function AdminDashScreen() {
  const { orders, getMenu } = useStore();
  const { logout, audit, changePin, resetRestaurantPin, resetCourierPin } = useAuth();
  const [, setTick] = useState(0);
  const [pinModal, setPinModal] = useState(false);
  // Cible : 'admin', un compte restaurant ('resto:rX') ou un livreur ('courier:cX')
  const [pinTarget, setPinTarget] = useState<string>('admin');
  const [adminPin, setAdminPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [pinMsg, setPinMsg] = useState<{ ok: boolean; text: string } | null>(null);

  useFocusEffect(
    useCallback(() => {
      const t = setInterval(() => setTick((x) => x + 1), 5000);
      return () => clearInterval(t);
    }, [])
  );

  const stats = useMemo(() => {
    const delivered = orders.filter((o) => !o.cancelledAt && statusLabel(o).done);
    const activeOrders = orders.filter((o) => !statusLabel(o).done);
    const cancelled = orders.filter((o) => !!o.cancelledAt);
    const gmv = delivered.reduce((s, o) => s + o.total, 0);
    const penalties = cancelled.reduce((s, o) => s + (o.cancelFee ?? 0), 0);
    // Commission plateforme : 15% articles resto + 20% des frais colis/missions + 100% part plateforme pénalités (50% ou 15%)
    let commission = 0;
    for (const o of delivered) {
      if (o.type === 'resto' && o.items) {
        const itemsTotal = o.items.reduce((s, l) => s + l.price * l.qty, 0);
        const feeDetail = o.details.find((d) => d.label === 'Frais de livraison');
        const fee = feeDetail ? parseInt(feeDetail.value.replace(/\D/g, '')) : 0;
        commission += itemsTotal * 0.15 + fee * 0.2;
      } else {
        commission += o.total * 0.2;
      }
    }
    for (const o of cancelled) {
      if ((o.cancelFee ?? 0) > 0) {
        commission += (o.cancelFee ?? 0) * (o.type === 'resto' ? 0.15 : 0.5);
      }
    }
    return {
      total: orders.length,
      delivered: delivered.length,
      active: activeOrders.length,
      cancelled: cancelled.length,
      gmv,
      penalties,
      commission: Math.round(commission / 50) * 50,
      byType: {
        resto: orders.filter((o) => o.type === 'resto').length,
        colis: orders.filter((o) => o.type === 'colis').length,
        course: orders.filter((o) => o.type === 'course').length,
      },
    };
  }, [orders]);

  const recentOrders = orders.slice(0, 8);
  const accounting = useMemo(() => accountingSummary(orders), [orders]);

  const doChangePin = () => {
    const res = pinTarget.startsWith('resto:')
      ? resetRestaurantPin(pinTarget.slice(6), adminPin, newPin)
      : pinTarget.startsWith('courier:')
      ? resetCourierPin(pinTarget.slice(8), adminPin, newPin)
      : changePin(pinTarget as Role, adminPin, newPin);
    setPinMsg(res.ok ? { ok: true, text: 'PIN modifié avec succès ✓' } : { ok: false, text: res.error ?? 'Erreur' });
    if (res.ok) {
      setAdminPin('');
      setNewPin('');
    }
  };

  return (
    <SafeAreaView style={st.safe} edges={['top']}>
      <ScrollView contentContainerStyle={{ paddingBottom: 30 }} showsVerticalScrollIndicator={false}>
        {/* En-tête */}
        <View style={st.header}>
          <View style={st.avatar}>
            <Ionicons name="shield-checkmark" size={24} color="#fff" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={st.name}>Administration</Text>
            <Text style={st.meta}>Coursier • Supervision plateforme</Text>
          </View>
          <Pressable style={st.logoutBtn} onPress={logout}>
            <Ionicons name="log-out-outline" size={20} color={colors.danger} />
          </Pressable>
        </View>

        {/* KPIs financiers */}
        <View style={st.kpiMain}>
          <View style={{ flex: 1 }}>
            <Text style={st.kpiMainLabel}>Volume d'affaires (livré)</Text>
            <Text style={st.kpiMainValue}>{fcfa(stats.gmv)}</Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={st.kpiMainLabel}>Commission Coursier</Text>
            <Text style={[st.kpiMainValue, { fontSize: 17 }]}>{fcfa(stats.commission)}</Text>
          </View>
        </View>

        {/* Grille KPIs */}
        <View style={st.kpiGrid}>
          <View style={st.kpi}>
            <Text style={st.kpiValue}>{stats.total}</Text>
            <Text style={st.kpiLabel}>Commandes</Text>
          </View>
          <View style={st.kpi}>
            <Text style={[st.kpiValue, { color: colors.accentDark }]}>{stats.active}</Text>
            <Text style={st.kpiLabel}>En cours</Text>
          </View>
          <View style={st.kpi}>
            <Text style={[st.kpiValue, { color: colors.primary }]}>{stats.delivered}</Text>
            <Text style={st.kpiLabel}>Livrées</Text>
          </View>
          <View style={st.kpi}>
            <Text style={[st.kpiValue, { color: colors.danger }]}>{stats.cancelled}</Text>
            <Text style={st.kpiLabel}>Annulées</Text>
          </View>
        </View>

        {/* Pénalités + répartition */}
        <View style={st.row2}>
          <View style={[st.panel, { flex: 1 }]}>
            <Text style={st.panelTitle}>Pénalités perçues</Text>
            <Text style={st.penaltyValue}>{fcfa(stats.penalties)}</Text>
            <Text style={st.panelHint}>Annulations hors délai</Text>
          </View>
          <View style={[st.panel, { flex: 1 }]}>
            <Text style={st.panelTitle}>Par service</Text>
            {(['resto', 'colis', 'course'] as const).map((t) => (
              <View key={t} style={st.typeRow}>
                <Text style={{ fontSize: 13 }}>{TYPE_META[t].emoji}</Text>
                <Text style={st.typeLabel}>{TYPE_META[t].label}</Text>
                <Text style={st.typeCount}>{stats.byType[t]}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Commandes récentes */}
        <Text style={st.section}>Commandes récentes</Text>
        <View style={st.panelFull}>
          {recentOrders.length === 0 && (
            <Text style={st.emptyText}>Aucune commande sur la plateforme. Passez côté Client pour en créer.</Text>
          )}
          {recentOrders.map((o, i) => {
            const s = statusLabel(o);
            return (
              <View key={o.id} style={[st.orderRow, i < recentOrders.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.border }]}>
                <Text style={{ fontSize: 16 }}>{TYPE_META[o.type].emoji}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={st.orderTitle} numberOfLines={1}>{o.id} — {o.title}</Text>
                  <Text style={[st.orderStatus, s.cancelled && { color: colors.danger }]} numberOfLines={1}>
                    {s.text}{o.courierName ? ` • 🛵 ${o.courierName}` : o.type !== 'resto' || o.acceptedByResto ? ' • ⏳ en attente de livreur' : ''}
                  </Text>
                </View>
                <Text style={st.orderTotal}>{fcfa(o.total)}</Text>
              </View>
            );
          })}
        </View>

        {/* Comptabilité & fiscalité */}
        <Text style={st.section}>🧾 Comptabilité & fiscalité (Gabon)</Text>
        <View style={st.panelFull}>
          <View style={st.fiscRow}>
            <Text style={st.fiscLabel}>CA réel Coursier (frais de service HT)</Text>
            <Text style={st.fiscValue}>{fcfa(accounting.serviceRevenueHT)}</Text>
          </View>
          <View style={st.fiscRow}>
            <Text style={st.fiscLabel}>TVA collectée (18 % sur services)</Text>
            <Text style={st.fiscValue}>{fcfa(accounting.tvaCollected)}</Text>
          </View>
          <View style={st.fiscRow}>
            <Text style={st.fiscLabel}>Fonds de passage (plats + budgets clients)</Text>
            <Text style={[st.fiscValue, { color: colors.primary }]}>{fcfa(accounting.passthroughFunds)}</Text>
          </View>
          <View style={st.fiscRow}>
            <Text style={st.fiscLabel}>Pénalités facturées HT</Text>
            <Text style={[st.fiscValue, { color: colors.danger }]}>{fcfa(accounting.penaltiesHT)}</Text>
          </View>
          <View style={st.fiscNote}>
            <Ionicons name="document-text" size={14} color={colors.primaryDark} />
            <Text style={st.fiscNoteText}>{accounting.vatStatus}</Text>
          </View>
          <View style={st.fiscNote}>
            <Ionicons name="flash" size={14} color={colors.accentDark} />
            <Text style={st.fiscNoteText}>
              Factures électroniques normalisées générées pour chaque commande (loi n°041/2025 — prêt E-tax DGI).
              Séparation stricte fonds de passage / CA (responsabilité fiduciaire).
            </Text>
          </View>
        </View>

        {/* Sécurité */}
        <Text style={st.section}>🔐 Sécurité</Text>
        <View style={st.panelFull}>
          <Pressable style={st.secRow} onPress={() => { setPinTarget('admin'); setPinModal(true); setPinMsg(null); }}>
            <View style={st.secIcon}><Ionicons name="key" size={17} color={colors.primary} /></View>
            <View style={{ flex: 1 }}>
              <Text style={st.secTitle}>Gérer les codes PIN</Text>
              <Text style={st.secSub}>Admin, chaque livreur et chaque restaurant</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
          </Pressable>
          <View style={st.secInfo}>
            <Ionicons name="shield-checkmark" size={15} color={colors.primary} />
            <Text style={st.secInfoText}>
              PIN hachés SHA-256 salés (500 itérations) — jamais stockés en clair. Verrouillage progressif anti force-brute : 3 échecs → 30 s, 5 → 5 min, 8 → 30 min.
            </Text>
          </View>
        </View>

        {/* Livreurs */}
        <Text style={st.section}>Livreurs ({COURIER_ACCOUNTS.length})</Text>
        <View style={st.panelFull}>
          {COURIER_ACCOUNTS.map((acc, i) => {
            const courierOrders = orders.filter((o) => o.courierId === acc.courierId);
            const active = courierOrders.filter((o) => !statusLabel(o).done).length;
            const deliveredOrders = courierOrders.filter((o) => statusLabel(o).done && !o.cancelledAt);
            const gains = deliveredOrders.reduce((s, o) => s + courierEarning(o), 0);
            return (
              <View key={acc.courierId} style={[st.restoRow, i < COURIER_ACCOUNTS.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.border }]}>
                <Text style={{ fontSize: 20 }}>🛵</Text>
                <View style={{ flex: 1 }}>
                  <Text style={st.restoName} numberOfLines={1}>{acc.name}</Text>
                  <Text style={st.restoMeta}>
                    @{acc.username} • {acc.vehicle} • {deliveredOrders.length} livrée(s){active > 0 ? ` • ${active} en cours` : ''} • {fcfa(gains)}
                  </Text>
                </View>
                <Pressable
                  style={st.resetBtn}
                  onPress={() => { setPinTarget(`courier:${acc.courierId}`); setPinModal(true); setPinMsg(null); }}
                >
                  <Ionicons name="key" size={13} color={colors.primaryDark} />
                  <Text style={st.resetText}>PIN</Text>
                </Pressable>
              </View>
            );
          })}
        </View>

        {/* Restaurants partenaires */}
        <Text style={st.section}>Restaurants partenaires ({RESTAURANT_ACCOUNTS.length})</Text>
        <View style={st.panelFull}>
          {RESTAURANT_ACCOUNTS.map((acc, i) => {
            const r = RESTAURANTS.find((x) => x.id === acc.restaurantId);
            if (!r) return null;
            const menu = getMenu(r.id);
            const promos = menu.filter((m) => m.promoPrice != null && m.promoPrice > 0).length;
            const restoOrders = orders.filter((o) => o.type === 'resto' && o.restaurantId === r.id);
            return (
              <View key={acc.restaurantId} style={[st.restoRow, i < RESTAURANT_ACCOUNTS.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.border }]}>
                <Text style={{ fontSize: 20 }}>{r.emoji}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={st.restoName} numberOfLines={1}>{r.name}</Text>
                  <Text style={st.restoMeta}>
                    @{acc.username} • {menu.length} plats{promos > 0 ? ` • ${promos} promo` : ''} • {restoOrders.length} cmd
                  </Text>
                </View>
                <Pressable
                  style={st.resetBtn}
                  onPress={() => { setPinTarget(`resto:${acc.restaurantId}`); setPinModal(true); setPinMsg(null); }}
                >
                  <Ionicons name="key" size={13} color={colors.primaryDark} />
                  <Text style={st.resetText}>PIN</Text>
                </Pressable>
              </View>
            );
          })}
        </View>

        {/* Conformité légale */}
        <Text style={st.section}>⚖️ Conformité (Gabon)</Text>
        <View style={st.panelFull}>
          {[
            {
              icon: 'document-text' as const, ok: true,
              title: 'Protection des données — APDPVP',
              sub: 'Politique de confidentialité publiée dans l\'app • consentement au 1er lancement • droit à l\'effacement actif (lois n°001/2011 & n°025/2023)',
            },
            {
              icon: 'receipt' as const, ok: true,
              title: 'Fiscalité — TVA 18 % & seuil 60 M FCFA',
              sub: 'TVA 18 % sur les frais de service uniquement (pas sur les plats — TVA propre du restaurant) • mention « TVA non applicable » sous le seuil de 60 M FCFA/an • déclaration mensuelle avant le 20 — répartition à valider avec un comptable',
            },
            {
              icon: 'flash' as const, ok: true,
              title: 'Facturation électronique — loi n°041/2025',
              sub: 'Factures et avoirs électroniques normalisés générés pour chaque commande (numérotation séquentielle, mentions légales) • prêt pour inscription E-tax DGI dès disponibilité • amendes jusqu’à 10 M FCFA/facture en cas de fraude',
            },
            {
              icon: 'wallet' as const, ok: true,
              title: 'Protection financière — fonds de passage',
              sub: 'Séparation comptable stricte : budgets clients (Service C) et prix des plats = fonds de passage, jamais comptés dans le CA • remboursement automatique du surplus • traçabilité ticket horodaté',
            },
            {
              icon: 'card' as const, ok: false,
              title: 'Mobile Money — webhooks signés',
              sub: 'À faire au passage en production : vérification serveur des confirmations Airtel/Moov Money signées cryptographiquement • jamais de confirmation côté client seul • conservation des références opérateur',
            },
            {
              icon: 'shield-checkmark' as const, ok: true,
              title: 'Cybersécurité — loi n°027/2023',
              sub: 'PIN hachés + salés, verrouillage anti force-brute, journal d\'audit, cloisonnement strict des rôles',
            },
            {
              icon: 'people' as const, ok: false,
              title: 'CNSS / CNAMGS — livreurs salariés',
              sub: 'À faire avant embauche : déclaration CNSS sous 8 jours (retraite, prestations familiales, accidents du travail) — hors périmètre de l\'app',
            },
            {
              icon: 'business' as const, ok: false,
              title: 'Déclaration APDPVP + statuts',
              sub: 'À faire avant lancement commercial : déclaration des traitements auprès de l\'APDPVP, immatriculation, conseil juridique agréé',
            },
          ].map((c, i, arr) => (
            <View key={c.title} style={[st.compRow, i < arr.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.border }]}>
              <View style={[st.compIcon, { backgroundColor: c.ok ? colors.primaryLight : colors.accentLight }]}>
                <Ionicons name={c.icon} size={16} color={c.ok ? colors.primary : colors.accentDark} />
              </View>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Text style={st.compTitle}>{c.title}</Text>
                  <View style={[st.compBadge, { backgroundColor: c.ok ? colors.primaryLight : colors.accentLight }]}>
                    <Text style={[st.compBadgeText, { color: c.ok ? colors.primaryDark : colors.accentDark }]}>
                      {c.ok ? 'Dans l\'app ✓' : 'Hors app'}
                    </Text>
                  </View>
                </View>
                <Text style={st.compSub}>{c.sub}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Journal d'audit */}
        <Text style={st.section}>Journal d'audit ({audit.length})</Text>
        <View style={st.panelFull}>
          {audit.length === 0 && <Text style={st.emptyText}>Aucun événement enregistré.</Text>}
          {audit.slice(0, 12).map((a) => {
            const icons: Record<string, { icon: keyof typeof Ionicons.glyphMap; color: string }> = {
              login_success: { icon: 'log-in', color: colors.primary },
              login_fail: { icon: 'alert-circle', color: colors.accentDark },
              lockout: { icon: 'lock-closed', color: colors.danger },
              logout: { icon: 'log-out', color: colors.textMuted },
              pin_changed: { icon: 'key', color: colors.primaryDark },
            };
            const m = icons[a.event];
            const d = new Date(a.at);
            return (
              <View key={a.id} style={st.auditRow}>
                <Ionicons name={m.icon} size={15} color={m.color} />
                <View style={{ flex: 1 }}>
                  <Text style={st.auditText}>
                    <Text style={{ fontWeight: '800' }}>{a.role}</Text> — {
                      a.event === 'login_success' ? 'connexion réussie'
                      : a.event === 'login_fail' ? 'échec de connexion'
                      : a.event === 'lockout' ? 'VERROUILLAGE anti force-brute'
                      : a.event === 'logout' ? 'déconnexion'
                      : 'PIN modifié'
                    }
                    {a.detail ? ` (${a.detail})` : ''}
                  </Text>
                  <Text style={st.auditTime}>
                    {d.toLocaleDateString('fr-FR')} {d.getHours().toString().padStart(2, '0')}:{d.getMinutes().toString().padStart(2, '0')}
                  </Text>
                </View>
              </View>
            );
          })}
        </View>
      </ScrollView>

      {/* Modal changement de PIN */}
      <Modal visible={pinModal} transparent animationType="slide" onRequestClose={() => setPinModal(false)}>
        <Pressable style={st.backdrop} onPress={() => setPinModal(false)} />
        <View style={st.sheet}>
          <View style={st.handle} />
          <Text style={st.sheetTitle}>Modifier un code PIN</Text>

          <Text style={st.fieldLabel}>Compte concerné</Text>
          {!pinTarget.startsWith('resto:') && !pinTarget.startsWith('courier:') && (
            <View style={{ flexDirection: 'row', gap: 8, marginBottom: 8 }}>
              <Pressable style={[st.roleChip, pinTarget === 'admin' && st.roleChipActive]} onPress={() => setPinTarget('admin')}>
                <Text style={[st.roleChipText, pinTarget === 'admin' && { color: '#fff' }]}>Admin</Text>
              </Pressable>
            </View>
          )}
          {pinTarget.startsWith('resto:') && (
            <View style={st.targetResto}>
              <Ionicons name="restaurant" size={14} color={colors.primaryDark} />
              <Text style={st.targetRestoText}>
                Restaurant : {RESTAURANTS.find((r) => r.id === pinTarget.slice(6))?.name ?? pinTarget}
              </Text>
            </View>
          )}
          {pinTarget.startsWith('courier:') && (
            <View style={st.targetResto}>
              <Ionicons name="bicycle" size={14} color={colors.primaryDark} />
              <Text style={st.targetRestoText}>
                Livreur : {COURIER_ACCOUNTS.find((c) => c.courierId === pinTarget.slice(8))?.name ?? pinTarget}
              </Text>
            </View>
          )}
          <Text style={[st.fieldLabel, { marginTop: 4 }]}>
            {pinTarget.startsWith('resto:') || pinTarget.startsWith('courier:') ? 'Réinitialisation — débloque aussi le compte' : ' '}
          </Text>

          <Text style={st.fieldLabel}>Votre PIN admin actuel</Text>
          <TextInput
            style={st.input}
            value={adminPin}
            onChangeText={(t) => setAdminPin(t.replace(/[^0-9]/g, '').slice(0, 6))}
            keyboardType="number-pad"
            secureTextEntry
            placeholder="••••"
            placeholderTextColor={colors.textMuted}
          />
          <Text style={st.fieldLabel}>Nouveau PIN (4 à 6 chiffres)</Text>
          <TextInput
            style={st.input}
            value={newPin}
            onChangeText={(t) => setNewPin(t.replace(/[^0-9]/g, '').slice(0, 6))}
            keyboardType="number-pad"
            secureTextEntry
            placeholder="••••"
            placeholderTextColor={colors.textMuted}
          />

          {pinMsg && (
            <View style={[st.msgBox, { backgroundColor: pinMsg.ok ? colors.primaryLight : colors.dangerLight }]}>
              <Ionicons name={pinMsg.ok ? 'checkmark-circle' : 'alert-circle'} size={15} color={pinMsg.ok ? colors.primary : colors.danger} />
              <Text style={[st.msgText, { color: pinMsg.ok ? colors.primaryDark : colors.danger }]}>{pinMsg.text}</Text>
            </View>
          )}

          <Pressable
            style={[st.saveBtn, (adminPin.length < 4 || newPin.length < 4) && { opacity: 0.5 }]}
            disabled={adminPin.length < 4 || newPin.length < 4}
            onPress={doChangePin}
          >
            <Text style={st.saveBtnText}>Enregistrer le nouveau PIN</Text>
          </Pressable>
          <Pressable style={st.closeBtn} onPress={() => setPinModal(false)}>
            <Text style={st.closeBtnText}>Fermer</Text>
          </Pressable>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const st = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 20, paddingTop: 12, paddingBottom: 4 },
  avatar: {
    width: 50, height: 50, borderRadius: 25, backgroundColor: colors.primaryDark,
    alignItems: 'center', justifyContent: 'center',
  },
  name: { fontSize: 18, fontWeight: '800', color: colors.text },
  meta: { fontSize: 12.5, color: colors.textMuted, fontWeight: '600', marginTop: 1 },
  logoutBtn: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: '#fff',
    alignItems: 'center', justifyContent: 'center', ...shadow,
  },
  kpiMain: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: colors.primaryDark,
    marginHorizontal: 20, marginTop: 14, borderRadius: radius.lg, padding: 18, ...shadow,
  },
  kpiMainLabel: { color: 'rgba(255,255,255,0.75)', fontSize: 11.5, fontWeight: '600' },
  kpiMainValue: { color: '#fff', fontSize: 21, fontWeight: '800', marginTop: 3 },
  kpiGrid: { flexDirection: 'row', gap: 10, paddingHorizontal: 20, marginTop: 12 },
  kpi: {
    flex: 1, backgroundColor: '#fff', borderRadius: radius.md, paddingVertical: 14,
    alignItems: 'center', ...shadow,
  },
  kpiValue: { fontSize: 18, fontWeight: '800', color: colors.text },
  kpiLabel: { fontSize: 10.5, color: colors.textMuted, fontWeight: '700', marginTop: 3 },
  row2: { flexDirection: 'row', gap: 10, paddingHorizontal: 20, marginTop: 12 },
  panel: { backgroundColor: '#fff', borderRadius: radius.md, padding: 14, ...shadow },
  panelFull: { backgroundColor: '#fff', borderRadius: radius.md, padding: 16, marginHorizontal: 20, ...shadow },
  panelTitle: { fontSize: 12.5, fontWeight: '800', color: colors.textMuted, marginBottom: 6 },
  panelHint: { fontSize: 10.5, color: colors.textMuted, marginTop: 3 },
  penaltyValue: { fontSize: 19, fontWeight: '800', color: colors.danger },
  typeRow: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 3 },
  typeLabel: { flex: 1, fontSize: 12.5, color: colors.text, fontWeight: '600' },
  typeCount: { fontSize: 13, fontWeight: '800', color: colors.text },
  section: { fontSize: 16, fontWeight: '800', color: colors.text, paddingHorizontal: 20, marginTop: 20, marginBottom: 10 },
  emptyText: { fontSize: 12.5, color: colors.textMuted, fontStyle: 'italic' },
  orderRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 9 },
  orderTitle: { fontSize: 13, fontWeight: '700', color: colors.text },
  orderStatus: { fontSize: 11.5, color: colors.textMuted, marginTop: 1 },
  orderTotal: { fontSize: 12.5, fontWeight: '800', color: colors.text },
  fiscRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 7, gap: 12 },
  fiscLabel: { flex: 1, fontSize: 12.5, color: colors.textMuted, fontWeight: '600' },
  fiscValue: { fontSize: 13.5, fontWeight: '800', color: colors.text },
  fiscNote: {
    flexDirection: 'row', gap: 8, backgroundColor: colors.bg, borderRadius: radius.sm,
    padding: 10, marginTop: 8,
  },
  fiscNoteText: { flex: 1, fontSize: 11, color: colors.text, lineHeight: 16, fontWeight: '600' },
  secRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 4 },
  secIcon: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.primaryLight, alignItems: 'center', justifyContent: 'center' },
  secTitle: { fontSize: 14, fontWeight: '800', color: colors.text },
  secSub: { fontSize: 12, color: colors.textMuted, marginTop: 1 },
  secInfo: {
    flexDirection: 'row', gap: 8, backgroundColor: colors.primaryLight,
    borderRadius: radius.sm, padding: 11, marginTop: 12,
  },
  secInfoText: { flex: 1, fontSize: 11, color: colors.primaryDark, lineHeight: 16, fontWeight: '600' },
  restoRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 9 },
  restoName: { fontSize: 13, fontWeight: '800', color: colors.text },
  restoMeta: { fontSize: 11, color: colors.textMuted, marginTop: 1 },
  resetBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: colors.primaryLight,
    paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999,
  },
  resetText: { fontSize: 11, fontWeight: '800', color: colors.primaryDark },
  targetResto: {
    flexDirection: 'row', alignItems: 'center', gap: 7, backgroundColor: colors.primaryLight,
    borderRadius: 10, padding: 10, marginBottom: 8,
  },
  targetRestoText: { flex: 1, fontSize: 12.5, fontWeight: '700', color: colors.primaryDark },
  compRow: { flexDirection: 'row', gap: 11, paddingVertical: 10, alignItems: 'flex-start' },
  compIcon: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  compTitle: { fontSize: 13, fontWeight: '800', color: colors.text },
  compBadge: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 6 },
  compBadgeText: { fontSize: 9.5, fontWeight: '800' },
  compSub: { fontSize: 11.5, color: colors.textMuted, lineHeight: 16, marginTop: 3 },
  auditRow: { flexDirection: 'row', gap: 10, paddingVertical: 7, alignItems: 'flex-start' },
  auditText: { fontSize: 12.5, color: colors.text, lineHeight: 17 },
  auditTime: { fontSize: 10.5, color: colors.textMuted, marginTop: 2 },
  backdrop: { flex: 1, backgroundColor: 'rgba(18,33,26,0.5)' },
  sheet: {
    backgroundColor: '#fff', borderTopLeftRadius: 26, borderTopRightRadius: 26,
    paddingHorizontal: 22, paddingTop: 10, paddingBottom: 30,
  },
  handle: { width: 44, height: 5, borderRadius: 3, backgroundColor: colors.border, alignSelf: 'center', marginBottom: 12 },
  sheetTitle: { fontSize: 18, fontWeight: '800', color: colors.text, marginBottom: 16 },
  fieldLabel: { fontSize: 12, fontWeight: '700', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 6 },
  roleChip: {
    flex: 1, paddingVertical: 10, borderRadius: 999, backgroundColor: colors.bg,
    alignItems: 'center', borderWidth: 1, borderColor: colors.border,
  },
  roleChipActive: { backgroundColor: colors.primaryDark, borderColor: colors.primaryDark },
  roleChipText: { fontSize: 12.5, fontWeight: '700', color: colors.text },
  input: {
    borderWidth: 1.5, borderColor: colors.border, borderRadius: radius.md, backgroundColor: colors.bg,
    paddingVertical: 12, textAlign: 'center', fontSize: 19, letterSpacing: 8, color: colors.text, marginBottom: 14,
  },
  msgBox: { flexDirection: 'row', alignItems: 'center', gap: 7, borderRadius: 10, padding: 10, marginBottom: 10 },
  msgText: { flex: 1, fontSize: 12.5, fontWeight: '700' },
  saveBtn: { backgroundColor: colors.primaryDark, borderRadius: radius.md, paddingVertical: 15, alignItems: 'center' },
  saveBtnText: { color: '#fff', fontSize: 15, fontWeight: '800' },
  closeBtn: { alignItems: 'center', paddingVertical: 13 },
  closeBtnText: { color: colors.textMuted, fontSize: 14, fontWeight: '700' },
});
