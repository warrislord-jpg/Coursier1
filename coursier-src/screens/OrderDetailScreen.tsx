import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { colors, radius, shadow, fcfa } from '../lib/theme';
import { useStore, orderSteps, effectiveProgress, STEP_MS, cancellationPolicy, cancellationFee } from '../lib/store';
import { displayCourier } from '../lib/chat';
import { generateInvoice, generateCreditNote } from '../lib/invoice';
import { Button, Card } from '../components/ui';

export default function OrderDetailScreen() {
  const nav = useNavigation<any>();
  const route = useRoute<any>();
  const { orders, rateOrder, cancelOrder, unreadCount } = useStore();
  const order = orders.find((o) => o.id === route.params?.orderId);
  const [, setTick] = useState(0);
  const [cancelVisible, setCancelVisible] = useState(false);
  const [cancelReason, setCancelReason] = useState<string | null>(null);
  const [invoiceVisible, setInvoiceVisible] = useState(false);

  useEffect(() => {
    const t = setInterval(() => setTick((x) => x + 1), 3000);
    return () => clearInterval(t);
  }, []);

  if (!order) {
    return (
      <SafeAreaView style={st.safe} edges={['top']}>
        <View style={{ padding: 20 }}>
          <Text style={st.title}>Commande introuvable</Text>
          <Button title="Retour" onPress={() => nav.goBack()} style={{ marginTop: 16 }} />
        </View>
      </SafeAreaView>
    );
  }

  const steps = orderSteps(order.type);
  const progress = effectiveProgress(order);
  const cancelled = !!order.cancelledAt;
  const done = progress >= 3 && !cancelled;
  const courier = displayCourier(order);
  const unread = unreadCount(order.id);
  const justPlaced = route.params?.justPlaced;
  const remaining = Math.max(0, Math.ceil(((order.createdAt + 4 * STEP_MS) - Date.now()) / 60000));
  const policy = cancellationPolicy(order);
  const fee = cancellationFee(order);

  const REASONS = [
    'J’ai changé d’avis',
    'Erreur dans la commande',
    'Délai trop long',
    'Je ne suis plus disponible',
    'Autre raison',
  ];

  const confirmCancel = () => {
    cancelOrder(order.id, cancelReason ?? 'Non précisée');
    setCancelVisible(false);
    setCancelReason(null);
  };

  return (
    <SafeAreaView style={st.safe} edges={['top']}>
      <View style={st.header}>
        <Pressable style={st.back} onPress={() => (nav.canGoBack() ? nav.goBack() : nav.navigate('Tabs'))}>
          <Ionicons name="arrow-back" size={20} color={colors.text} />
        </Pressable>
        <Text style={st.headerTitle}>Suivi • {order.id}</Text>
        <View style={{ width: 40 }} />
      </View>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
        {justPlaced && !cancelled && (
          <View style={st.success}>
            <Ionicons name="checkmark-circle" size={28} color="#fff" />
            <View style={{ flex: 1 }}>
              <Text style={st.successTitle}>C’est parti ! 🎉</Text>
              <Text style={st.successSub}>Votre demande a été confirmée. Suivez sa progression ici.</Text>
            </View>
          </View>
        )}

        {cancelled && (
          <View style={st.cancelledBanner}>
            <Ionicons name="close-circle" size={26} color={colors.danger} />
            <View style={{ flex: 1 }}>
              <Text style={st.cancelledTitle}>Commande annulée</Text>
              <Text style={st.cancelledSub}>
                Motif : {order.cancelReason}
                {order.cancelFee && order.cancelFee > 0
                  ? ` • Frais d’annulation : ${fcfa(order.cancelFee)}`
                  : ' • Aucun frais appliqué'}
              </Text>
            </View>
          </View>
        )}

        <Card style={{ marginTop: 14 }}>
          <Text style={st.orderTitle}>{order.title}</Text>
          <Text style={st.orderSub}>{order.subtitle}</Text>
          <View style={[st.etaRow, cancelled && { backgroundColor: colors.dangerLight }]}>
            <Ionicons
              name={cancelled ? 'close-circle' : done ? 'checkmark-done' : 'time'}
              size={16}
              color={cancelled ? colors.danger : colors.primary}
            />
            <Text style={[st.eta, cancelled && { color: colors.danger }]}>
              {cancelled ? 'Annulée' : done ? 'Terminé — merci de votre confiance !' : `Estimation : ~${remaining} min restantes`}
            </Text>
          </View>
        </Card>

        {!cancelled && <Text style={st.section}>Progression</Text>}
        {!cancelled && (<>
        <Card>
          {steps.map((s, i) => {
            const reached = i <= progress;
            const current = i === progress && !done;
            return (
              <View key={s.label} style={st.stepRow}>
                <View style={{ alignItems: 'center' }}>
                  <View style={[st.stepIcon, reached ? { backgroundColor: colors.primary } : { backgroundColor: colors.border }]}>
                    <Ionicons name={s.icon as any} size={15} color={reached ? '#fff' : colors.textMuted} />
                  </View>
                  {i < steps.length - 1 && (
                    <View style={[st.stepLine, { backgroundColor: i < progress ? colors.primary : colors.border }]} />
                  )}
                </View>
                <View style={{ flex: 1, paddingBottom: i < steps.length - 1 ? 22 : 0 }}>
                  <Text style={[st.stepLabel, reached && { color: colors.text }]}>{s.label}</Text>
                  {current && <Text style={st.stepNow}>En cours…</Text>}
                </View>
              </View>
            );
          })}
        </Card>
        </>)}

        {!cancelled && !done && policy.allowed && (
          <Pressable style={st.cancelLink} onPress={() => setCancelVisible(true)}>
            <Ionicons name="close-circle-outline" size={18} color={colors.danger} />
            <View style={{ flex: 1 }}>
              <Text style={st.cancelLinkTitle}>Annuler cette commande</Text>
              <Text style={st.cancelLinkSub}>
                {fee === 0
                  ? 'Encore gratuit — annulez avant que le travail ne commence'
                  : `${policy.label} — pénalité de ${fcfa(fee)}`}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={colors.danger} />
          </Pressable>
        )}

        {done && (
          <>
            <Text style={st.section}>{order.rating ? 'Votre note' : 'Notez cette expérience'}</Text>
            <Card style={{ alignItems: 'center' }}>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                {[1, 2, 3, 4, 5].map((n) => (
                  <Pressable key={n} hitSlop={6} onPress={() => rateOrder(order.id, n)}>
                    <Ionicons
                      name={(order.rating ?? 0) >= n ? 'star' : 'star-outline'}
                      size={34}
                      color={colors.accent}
                    />
                  </Pressable>
                ))}
              </View>
              <Text style={st.rateHint}>
                {order.rating
                  ? order.rating >= 4
                    ? 'Merci beaucoup ! À très vite 🙏'
                    : 'Merci, nous allons nous améliorer 💪'
                  : 'Touchez une étoile pour noter'}
              </Text>
            </Card>
          </>
        )}

        <Text style={st.section}>Votre livreur</Text>
        <Card style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
          <View style={st.courierAvatar}><Text style={{ fontSize: 26 }}>{courier.emoji}</Text></View>
          <View style={{ flex: 1 }}>
            <Text style={st.courierName}>{courier.name}</Text>
            <Text style={st.courierMeta}>{courier.vehicle} • ⭐ {courier.rating}</Text>
          </View>
          <Pressable style={st.chatBtn} onPress={() => nav.navigate('Chat', { orderId: order.id })}>
            <Ionicons name="chatbubble-ellipses" size={18} color="#fff" />
            {unread > 0 && (
              <View style={st.chatBadge}>
                <Text style={st.chatBadgeText}>{unread}</Text>
              </View>
            )}
          </Pressable>
          <Pressable style={st.callBtn} onPress={() => nav.navigate('Chat', { orderId: order.id })}>
            <Ionicons name="call" size={18} color="#fff" />
          </Pressable>
        </Card>

        <Button
          title={unread > 0 ? `Discuter avec ${courier.name.split(' ')[0]} (${unread} nouveau${unread > 1 ? 'x' : ''})` : `Discuter avec ${courier.name.split(' ')[0]}`}
          icon="chatbubbles"
          variant="ghost"
          onPress={() => nav.navigate('Chat', { orderId: order.id })}
          style={{ marginTop: 10 }}
        />

        {order.items && order.items.length > 0 && (
          <>
            <Text style={st.section}>Articles</Text>
            <Card>
              {order.items.map((l) => (
                <View key={l.itemId} style={st.itemRow}>
                  <Text style={{ fontSize: 18 }}>{l.emoji}</Text>
                  <Text style={st.itemName}>{l.qty}× {l.name}</Text>
                  <Text style={st.itemPrice}>{fcfa(l.price * l.qty)}</Text>
                </View>
              ))}
            </Card>
          </>
        )}

        <Text style={st.section}>Détails</Text>
        <Card>
          {order.details.map((d, i) => (
            <View key={i} style={[st.detailRow, i < order.details.length - 1 && st.detailBorder]}>
              <Text style={st.detailLabel}>{d.label}</Text>
              <Text style={st.detailValue}>{d.value}</Text>
            </View>
          ))}
          <View style={[st.detailRow, { borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 12, marginTop: 4 }]}>
            <Text style={[st.detailLabel, { fontSize: 15, fontWeight: '800', color: colors.text }]}>Total</Text>
            <Text style={[st.detailValue, { fontSize: 16, fontWeight: '800', color: colors.primaryDark }]}>{fcfa(order.total)}</Text>
          </View>
        </Card>

        {(done || cancelled) && (
          <Button
            title={cancelled ? 'Voir l’avoir (note de crédit)' : 'Voir la facture électronique'}
            variant="outline"
            icon="document-text"
            onPress={() => setInvoiceVisible(true)}
            style={{ marginTop: 14 }}
          />
        )}

        <Button title="Retour à l’accueil" variant="ghost" icon="home" onPress={() => nav.navigate('Tabs')} style={{ marginTop: 12 }} />
      </ScrollView>

      {/* Modal facture électronique normalisée (loi n°041/2025) */}
      <Modal visible={invoiceVisible} transparent animationType="slide" onRequestClose={() => setInvoiceVisible(false)}>
        <Pressable style={st.backdrop} onPress={() => setInvoiceVisible(false)} />
        <View style={st.sheet}>
          <View style={st.handle} />
          {(() => {
            const inv = cancelled ? generateCreditNote(order) : generateInvoice(order);
            return (
              <>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                  <View style={st.invBadge}>
                    <Ionicons name="document-text" size={16} color="#fff" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={st.sheetTitle}>{inv.type === 'credit_note' ? 'Avoir' : 'Facture'} {inv.number}</Text>
                    <Text style={st.invMeta}>
                      Commande {inv.orderId} • {new Date(inv.issuedAt).toLocaleDateString('fr-FR')}
                    </Text>
                  </View>
                </View>

                <View style={st.invDivider} />
                {inv.lines.map((l, i) => (
                  <View key={i} style={st.invLine}>
                    <Text style={st.invLineLabel}>{l.label}</Text>
                    <Text style={[st.invLineAmount, l.amountHT < 0 && { color: colors.danger }]}>
                      {l.amountHT === 0 ? 'sur ticket' : fcfa(l.amountHT)}
                    </Text>
                  </View>
                ))}
                <View style={st.invDivider} />
                <View style={st.invLine}>
                  <Text style={st.invTotalLabel}>Frais de service HT</Text>
                  <Text style={st.invTotalValue}>{fcfa(inv.totalHT)}</Text>
                </View>
                <View style={st.invLine}>
                  <Text style={st.invTotalLabel}>TVA (18 % si assujetti)</Text>
                  <Text style={st.invTotalValue}>{fcfa(inv.totalTVA)}</Text>
                </View>
                {inv.passthroughTotal !== 0 && (
                  <View style={st.invLine}>
                    <Text style={st.invTotalLabel}>Fonds de passage</Text>
                    <Text style={st.invTotalValue}>{fcfa(inv.passthroughTotal)}</Text>
                  </View>
                )}
                <View style={st.invLine}>
                  <Text style={[st.invTotalLabel, { fontSize: 15, color: colors.text }]}>Total TTC</Text>
                  <Text style={[st.invTotalValue, { fontSize: 16, color: colors.primaryDark }]}>{fcfa(inv.totalTTC)}</Text>
                </View>

                <View style={st.invMention}>
                  <Ionicons name="shield-checkmark" size={13} color={colors.primaryDark} />
                  <Text style={st.invMentionText}>{inv.vatMention}</Text>
                </View>

                <Pressable style={st.invClose} onPress={() => setInvoiceVisible(false)}>
                  <Text style={st.invCloseText}>Fermer</Text>
                </Pressable>
              </>
            );
          })()}
        </View>
      </Modal>

      {/* Modal d’annulation */}
      <Modal visible={cancelVisible} transparent animationType="slide" onRequestClose={() => setCancelVisible(false)}>
        <Pressable style={st.backdrop} onPress={() => setCancelVisible(false)} />
        <View style={st.sheet}>
          <View style={st.handle} />
          <Text style={st.sheetTitle}>Annuler la commande ?</Text>

          <View style={[st.feeBox, fee === 0 ? { backgroundColor: colors.primaryLight } : { backgroundColor: colors.dangerLight }]}>
            <Ionicons
              name={fee === 0 ? 'checkmark-circle' : 'alert-circle'}
              size={22}
              color={fee === 0 ? colors.primary : colors.danger}
            />
            <View style={{ flex: 1 }}>
              <Text style={[st.feeTitle, { color: fee === 0 ? colors.primaryDark : colors.danger }]}>
                {fee === 0 ? 'Annulation gratuite — vous êtes à temps' : `${policy.label} — pénalité de ${fcfa(fee)}`}
              </Text>
              <Text style={st.feeSub}>{policy.detail}</Text>
            </View>
          </View>

          <Text style={st.reasonLabel}>Motif de l’annulation</Text>
          {REASONS.map((r) => (
            <Pressable key={r} style={[st.reason, cancelReason === r && st.reasonActive]} onPress={() => setCancelReason(r)}>
              <Ionicons
                name={cancelReason === r ? 'radio-button-on' : 'radio-button-off'}
                size={19}
                color={cancelReason === r ? colors.danger : colors.textMuted}
              />
              <Text style={[st.reasonText, cancelReason === r && { color: colors.danger, fontWeight: '800' }]}>{r}</Text>
            </Pressable>
          ))}

          <Pressable
            style={[st.confirmCancel, !cancelReason && { opacity: 0.5 }]}
            disabled={!cancelReason}
            onPress={confirmCancel}
          >
            <Text style={st.confirmCancelText}>
              {fee === 0 ? 'Confirmer l’annulation (gratuit)' : `Annuler et payer la pénalité de ${fcfa(fee)}`}
            </Text>
          </Pressable>
          <Pressable style={st.keepBtn} onPress={() => setCancelVisible(false)}>
            <Text style={st.keepBtnText}>Garder ma commande</Text>
          </Pressable>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const st = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10 },
  back: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', ...shadow },
  headerTitle: { flex: 1, textAlign: 'center', fontSize: 17, fontWeight: '800', color: colors.text },
  title: { fontSize: 20, fontWeight: '800', color: colors.text },
  success: {
    flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: colors.primary,
    borderRadius: radius.md, padding: 16, marginTop: 8,
  },
  successTitle: { color: '#fff', fontWeight: '800', fontSize: 16 },
  successSub: { color: 'rgba(255,255,255,0.9)', fontSize: 13, marginTop: 2 },
  orderTitle: { fontSize: 17, fontWeight: '800', color: colors.text },
  orderSub: { fontSize: 13.5, color: colors.textMuted, marginTop: 3 },
  etaRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 10, backgroundColor: colors.primaryLight, alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999 },
  eta: { fontSize: 12.5, fontWeight: '700', color: colors.primaryDark },
  section: { fontSize: 17, fontWeight: '800', color: colors.text, marginTop: 20, marginBottom: 10 },
  stepRow: { flexDirection: 'row', gap: 14 },
  stepIcon: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  stepLine: { width: 3, flex: 1, minHeight: 18, borderRadius: 2, marginVertical: 2 },
  stepLabel: { fontSize: 14, fontWeight: '700', color: colors.textMuted, paddingTop: 5 },
  stepNow: { fontSize: 12, color: colors.primary, fontWeight: '700', marginTop: 2 },
  rateHint: { fontSize: 13, color: colors.textMuted, fontWeight: '600', marginTop: 10 },
  cancelledBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: colors.dangerLight,
    borderRadius: radius.md, padding: 16, marginTop: 8,
  },
  cancelledTitle: { color: colors.danger, fontWeight: '800', fontSize: 15.5 },
  cancelledSub: { color: colors.text, fontSize: 12.5, marginTop: 3, lineHeight: 18 },
  cancelLink: {
    flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#fff',
    borderRadius: radius.md, padding: 15, marginTop: 14, borderWidth: 1, borderColor: '#F2D6D6',
  },
  cancelLinkTitle: { fontSize: 14.5, fontWeight: '800', color: colors.danger },
  cancelLinkSub: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  backdrop: { flex: 1, backgroundColor: 'rgba(18,33,26,0.45)' },
  sheet: {
    backgroundColor: '#fff', borderTopLeftRadius: 26, borderTopRightRadius: 26,
    paddingHorizontal: 22, paddingTop: 10, paddingBottom: 30,
  },
  handle: { width: 44, height: 5, borderRadius: 3, backgroundColor: colors.border, alignSelf: 'center', marginBottom: 14 },
  sheetTitle: { fontSize: 19, fontWeight: '800', color: colors.text, marginBottom: 14 },
  feeBox: { flexDirection: 'row', gap: 12, borderRadius: radius.md, padding: 14, marginBottom: 16 },
  feeTitle: { fontSize: 14.5, fontWeight: '800' },
  feeSub: { fontSize: 12.5, color: colors.textMuted, marginTop: 3, lineHeight: 18 },
  reasonLabel: { fontSize: 13, fontWeight: '700', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 8 },
  reason: {
    flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 11,
    paddingHorizontal: 12, borderRadius: radius.sm, marginBottom: 4,
  },
  reasonActive: { backgroundColor: colors.dangerLight },
  reasonText: { fontSize: 14.5, fontWeight: '600', color: colors.text },
  confirmCancel: {
    backgroundColor: colors.danger, borderRadius: radius.md, paddingVertical: 16,
    alignItems: 'center', marginTop: 14,
  },
  confirmCancelText: { color: '#fff', fontSize: 15.5, fontWeight: '800' },
  keepBtn: { alignItems: 'center', paddingVertical: 14 },
  keepBtnText: { color: colors.textMuted, fontSize: 14.5, fontWeight: '700' },
  invBadge: { width: 36, height: 36, borderRadius: 12, backgroundColor: colors.primaryDark, alignItems: 'center', justifyContent: 'center' },
  invMeta: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  invDivider: { height: 1, backgroundColor: colors.border, marginVertical: 10 },
  invLine: { flexDirection: 'row', justifyContent: 'space-between', gap: 14, paddingVertical: 5 },
  invLineLabel: { flex: 1, fontSize: 12.5, color: colors.text, fontWeight: '600', lineHeight: 17 },
  invLineAmount: { fontSize: 12.5, fontWeight: '700', color: colors.text },
  invTotalLabel: { fontSize: 13, fontWeight: '700', color: colors.textMuted },
  invTotalValue: { fontSize: 13.5, fontWeight: '800', color: colors.text },
  invMention: {
    flexDirection: 'row', gap: 7, backgroundColor: colors.primaryLight,
    borderRadius: radius.sm, padding: 10, marginTop: 12,
  },
  invMentionText: { flex: 1, fontSize: 10.5, color: colors.primaryDark, lineHeight: 15, fontWeight: '600' },
  invClose: {
    backgroundColor: colors.primary, borderRadius: radius.md, paddingVertical: 14,
    alignItems: 'center', marginTop: 14,
  },
  invCloseText: { color: '#fff', fontSize: 15, fontWeight: '800' },
  courierAvatar: { width: 54, height: 54, borderRadius: 27, backgroundColor: colors.primaryLight, alignItems: 'center', justifyContent: 'center' },
  courierName: { fontSize: 15.5, fontWeight: '800', color: colors.text },
  courierMeta: { fontSize: 13, color: colors.textMuted, marginTop: 2 },
  callBtn: { width: 42, height: 42, borderRadius: 21, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  chatBtn: { width: 42, height: 42, borderRadius: 21, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center' },
  chatBadge: {
    position: 'absolute', top: -4, right: -4, backgroundColor: colors.danger, borderRadius: 8,
    minWidth: 16, height: 16, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 3,
  },
  chatBadgeText: { color: '#fff', fontSize: 9.5, fontWeight: '800' },
  itemRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 7 },
  itemName: { flex: 1, fontSize: 14, fontWeight: '600', color: colors.text },
  itemPrice: { fontSize: 13.5, fontWeight: '700', color: colors.textMuted },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 16, paddingVertical: 9 },
  detailBorder: { borderBottomWidth: 1, borderBottomColor: colors.border },
  detailLabel: { fontSize: 13, fontWeight: '700', color: colors.textMuted, width: 120 },
  detailValue: { flex: 1, fontSize: 13.5, fontWeight: '600', color: colors.text, textAlign: 'right' },
});
