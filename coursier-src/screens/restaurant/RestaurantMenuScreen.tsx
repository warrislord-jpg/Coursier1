import React, { useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, Pressable, TextInput, Modal,
  KeyboardAvoidingView, Platform, ScrollView, Image, Alert, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import { colors, radius, shadow, fcfa } from '../../lib/theme';
import { useStore, effectivePrice } from '../../lib/store';
import { useAuth } from '../../lib/auth';
import { RESTAURANTS } from '../../lib/data';
import { MenuItem } from '../../lib/types';
import { pickFromCamera, pickFromLibrary } from '../../lib/imagePicker';

const EMOJIS = ['🍗', '🐟', '🍚', '🍲', '🥘', '🍢', '🍕', '🍔', '🌯', '🥗', '🍌', '🦐', '🦀', '🥤', '🧃', '🍺', '☕', '🍰'];

type Draft = {
  id: string | null; // null = nouveau plat
  name: string;
  desc: string;
  price: string;
  promoPrice: string;
  emoji: string;
  photo: string | null;
};

const emptyDraft: Draft = { id: null, name: '', desc: '', price: '', promoPrice: '', emoji: '🍗', photo: null };

export default function RestaurantMenuScreen() {
  const nav = useNavigation<any>();
  const { getMenu, upsertMenuItem, deleteMenuItem, toggleItemAvailable, setPromo } = useStore();
  const { restaurantId, changeOwnRestaurantPin } = useAuth();
  const resto = RESTAURANTS.find((r) => r.id === restaurantId);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [error, setError] = useState('');
  const [photoLoading, setPhotoLoading] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  // Changement de PIN
  const [pinModal, setPinModal] = useState(false);
  const [curPin, setCurPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [pinMsg, setPinMsg] = useState<{ ok: boolean; text: string } | null>(null);

  if (!restaurantId || !resto) {
    return (
      <SafeAreaView style={st.safe} edges={['top']}>
        <View style={{ padding: 24 }}>
          <Text style={st.title}>Session expirée</Text>
        </View>
      </SafeAreaView>
    );
  }

  const menu = getMenu(restaurantId);

  const openNew = () => {
    setError('');
    setDraft({ ...emptyDraft });
  };

  const openEdit = (m: MenuItem) => {
    setError('');
    setDraft({
      id: m.id,
      name: m.name,
      desc: m.desc,
      price: String(m.price),
      promoPrice: m.promoPrice ? String(m.promoPrice) : '',
      emoji: m.emoji,
      photo: m.photo ?? null,
    });
  };

  const save = () => {
    if (!draft) return;
    const existing = draft.id ? menu.find((m) => m.id === draft.id) : undefined;
    const item: MenuItem = {
      id: draft.id ?? `${restaurantId}u${Date.now().toString(36)}`,
      name: draft.name,
      desc: draft.desc,
      price: parseInt(draft.price) || 0,
      promoPrice: draft.promoPrice ? parseInt(draft.promoPrice) : null,
      emoji: draft.emoji,
      photo: draft.photo,
      available: existing?.available !== false,
    };
    const res = upsertMenuItem(restaurantId, item);
    if (!res.ok) {
      setError(res.error ?? 'Erreur de validation');
      return;
    }
    setDraft(null);
    setError('');
  };

  const choosePhoto = async (source: 'camera' | 'library') => {
    setPhotoLoading(true);
    const res = source === 'camera' ? await pickFromCamera() : await pickFromLibrary();
    setPhotoLoading(false);
    if (!res.ok) {
      if (res.error) Alert.alert('Photo', res.error);
      return;
    }
    setDraft((d) => (d ? { ...d, photo: res.dataUri ?? null } : d));
  };

  const doChangePin = () => {
    const res = changeOwnRestaurantPin(curPin, newPin);
    setPinMsg(res.ok ? { ok: true, text: 'PIN modifié ✓' } : { ok: false, text: res.error ?? 'Erreur' });
    if (res.ok) { setCurPin(''); setNewPin(''); }
  };

  return (
    <SafeAreaView style={st.safe} edges={['top']}>
      {/* Header */}
      <View style={st.header}>
        <Pressable style={st.back} onPress={() => nav.goBack()}>
          <Ionicons name="arrow-back" size={20} color={colors.text} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={st.title}>Mon menu</Text>
          <Text style={st.sub}>{resto.name} • {menu.length} plat{menu.length > 1 ? 's' : ''}</Text>
        </View>
        <Pressable style={st.pinBtn} onPress={() => { setPinModal(true); setPinMsg(null); }}>
          <Ionicons name="key" size={17} color={colors.primaryDark} />
        </Pressable>
        <Pressable style={st.addBtn} onPress={openNew}>
          <Ionicons name="add" size={22} color="#fff" />
        </Pressable>
      </View>

      <FlatList
        data={menu}
        keyExtractor={(m) => m.id}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 30, paddingTop: 6 }}
        ListEmptyComponent={
          <View style={st.empty}>
            <Text style={{ fontSize: 40 }}>🍽️</Text>
            <Text style={st.emptyTitle}>Aucun plat au menu</Text>
            <Text style={st.emptySub}>Touchez + pour poster votre premier plat.</Text>
          </View>
        }
        renderItem={({ item: m }) => {
          const off = m.available === false;
          const hasPromo = m.promoPrice != null && m.promoPrice > 0;
          return (
            <View style={[st.card, off && { opacity: 0.55 }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                {m.photo ? (
                  <Image source={{ uri: m.photo }} style={st.photoThumb} />
                ) : (
                  <View style={st.emoji}><Text style={{ fontSize: 26 }}>{m.emoji}</Text></View>
                )}
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                    <Text style={st.name}>{m.name}</Text>
                    {hasPromo && (
                      <View style={st.promoBadge}>
                        <Text style={st.promoBadgeText}>PROMO −{Math.round((1 - (m.promoPrice! / m.price)) * 100)}%</Text>
                      </View>
                    )}
                    {off && (
                      <View style={st.offBadge}>
                        <Text style={st.offBadgeText}>ÉPUISÉ</Text>
                      </View>
                    )}
                  </View>
                  <Text style={st.desc} numberOfLines={1}>{m.desc}</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 }}>
                    <Text style={[st.price, hasPromo && st.priceStruck]}>{fcfa(m.price)}</Text>
                    {hasPromo && <Text style={st.promoPrice}>{fcfa(m.promoPrice!)}</Text>}
                  </View>
                </View>
              </View>

              {/* Actions */}
              <View style={st.actions}>
                <Pressable style={st.actionChip} onPress={() => openEdit(m)}>
                  <Ionicons name="create-outline" size={14} color={colors.primaryDark} />
                  <Text style={[st.actionText, { color: colors.primaryDark }]}>Modifier</Text>
                </Pressable>
                {hasPromo ? (
                  <Pressable style={st.actionChip} onPress={() => setPromo(restaurantId, m.id, null)}>
                    <Ionicons name="pricetag" size={14} color={colors.accentDark} />
                    <Text style={[st.actionText, { color: colors.accentDark }]}>Retirer promo</Text>
                  </Pressable>
                ) : (
                  <Pressable
                    style={st.actionChip}
                    onPress={() => openEdit(m)}
                  >
                    <Ionicons name="pricetag-outline" size={14} color={colors.accentDark} />
                    <Text style={[st.actionText, { color: colors.accentDark }]}>Promo</Text>
                  </Pressable>
                )}
                <Pressable style={st.actionChip} onPress={() => toggleItemAvailable(restaurantId, m.id)}>
                  <Ionicons name={off ? 'eye' : 'eye-off'} size={14} color={colors.textMuted} />
                  <Text style={st.actionText}>{off ? 'Remettre' : 'Épuisé'}</Text>
                </Pressable>
                <Pressable style={st.actionChip} onPress={() => setConfirmDelete(m.id)}>
                  <Ionicons name="trash-outline" size={14} color={colors.danger} />
                  <Text style={[st.actionText, { color: colors.danger }]}>Suppr.</Text>
                </Pressable>
              </View>
            </View>
          );
        }}
      />

      {/* ── Modal ajout / édition ───────────────────────────────── */}
      <Modal visible={!!draft} transparent animationType="slide" onRequestClose={() => setDraft(null)}>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <Pressable style={st.backdrop} onPress={() => setDraft(null)} />
          <View style={st.sheet}>
            <View style={st.handle} />
            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              <Text style={st.sheetTitle}>{draft?.id ? 'Modifier le plat' : 'Poster un nouveau plat'}</Text>

              <Text style={st.label}>Photo du plat</Text>
              <View style={st.photoRow}>
                {photoLoading ? (
                  <View style={st.photoPreview}>
                    <ActivityIndicator color={colors.primaryDark} />
                  </View>
                ) : draft?.photo ? (
                  <Image source={{ uri: draft.photo }} style={st.photoPreview} />
                ) : (
                  <View style={st.photoPreview}>
                    <Ionicons name="image-outline" size={26} color={colors.textMuted} />
                  </View>
                )}
                <View style={{ flex: 1, gap: 8 }}>
                  <Pressable style={st.photoBtn} onPress={() => choosePhoto('camera')} disabled={photoLoading}>
                    <Ionicons name="camera-outline" size={16} color={colors.primaryDark} />
                    <Text style={st.photoBtnText}>Prendre une photo</Text>
                  </Pressable>
                  <Pressable style={st.photoBtn} onPress={() => choosePhoto('library')} disabled={photoLoading}>
                    <Ionicons name="images-outline" size={16} color={colors.primaryDark} />
                    <Text style={st.photoBtnText}>Choisir dans la galerie</Text>
                  </Pressable>
                  {draft?.photo && (
                    <Pressable style={st.photoRemove} onPress={() => setDraft((d) => (d ? { ...d, photo: null } : d))}>
                      <Ionicons name="trash-outline" size={14} color={colors.danger} />
                      <Text style={st.photoRemoveText}>Retirer la photo</Text>
                    </Pressable>
                  )}
                </View>
              </View>
              <Text style={st.hint}>Optionnel — sans photo, un emoji représente le plat.</Text>

              <Text style={st.label}>Visuel (emoji, utilisé sans photo)</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
                {EMOJIS.map((e) => (
                  <Pressable
                    key={e}
                    style={[st.emojiPick, draft?.emoji === e && st.emojiPickActive]}
                    onPress={() => setDraft((d) => (d ? { ...d, emoji: e } : d))}
                  >
                    <Text style={{ fontSize: 24 }}>{e}</Text>
                  </Pressable>
                ))}
              </ScrollView>

              <Text style={st.label}>Nom du plat *</Text>
              <TextInput
                style={st.input}
                value={draft?.name}
                onChangeText={(t) => setDraft((d) => (d ? { ...d, name: t.slice(0, 60) } : d))}
                placeholder="Ex : Poulet Nyembwé"
                placeholderTextColor={colors.textMuted}
                maxLength={60}
              />

              <Text style={st.label}>Description</Text>
              <TextInput
                style={[st.input, { minHeight: 60, textAlignVertical: 'top' }]}
                value={draft?.desc}
                onChangeText={(t) => setDraft((d) => (d ? { ...d, desc: t.slice(0, 160) } : d))}
                placeholder="Ingrédients, accompagnement…"
                placeholderTextColor={colors.textMuted}
                multiline
                maxLength={160}
              />

              <View style={{ flexDirection: 'row', gap: 12 }}>
                <View style={{ flex: 1 }}>
                  <Text style={st.label}>Prix (FCFA) *</Text>
                  <TextInput
                    style={st.input}
                    value={draft?.price}
                    onChangeText={(t) => setDraft((d) => (d ? { ...d, price: t.replace(/[^0-9]/g, '').slice(0, 6) } : d))}
                    placeholder="4500"
                    placeholderTextColor={colors.textMuted}
                    keyboardType="number-pad"
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={st.label}>Prix promo 🏷️</Text>
                  <TextInput
                    style={st.input}
                    value={draft?.promoPrice}
                    onChangeText={(t) => setDraft((d) => (d ? { ...d, promoPrice: t.replace(/[^0-9]/g, '').slice(0, 6) } : d))}
                    placeholder="Optionnel"
                    placeholderTextColor={colors.textMuted}
                    keyboardType="number-pad"
                  />
                </View>
              </View>
              <Text style={st.hint}>Prix en multiples de 50 FCFA. La promo doit être inférieure au prix normal.</Text>

              {error ? (
                <View style={st.errBox}>
                  <Ionicons name="alert-circle" size={15} color={colors.danger} />
                  <Text style={st.errText}>{error}</Text>
                </View>
              ) : null}

              <Pressable style={st.saveBtn} onPress={save}>
                <Ionicons name="checkmark-circle" size={18} color="#fff" />
                <Text style={st.saveText}>{draft?.id ? 'Enregistrer les modifications' : 'Publier le plat'}</Text>
              </Pressable>
              <Pressable style={st.closeBtn} onPress={() => setDraft(null)}>
                <Text style={st.closeText}>Annuler</Text>
              </Pressable>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ── Modal confirmation suppression ─────────────────────── */}
      <Modal visible={!!confirmDelete} transparent animationType="fade" onRequestClose={() => setConfirmDelete(null)}>
        <View style={st.centerWrap}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setConfirmDelete(null)} />
          <View style={st.confirmCard}>
            <Text style={{ fontSize: 34, textAlign: 'center' }}>🗑️</Text>
            <Text style={st.confirmTitle}>Supprimer ce plat ?</Text>
            <Text style={st.confirmSub}>Il ne sera plus visible par les clients. Cette action est définitive.</Text>
            <Pressable
              style={st.deleteBtn}
              onPress={() => {
                if (confirmDelete) deleteMenuItem(restaurantId, confirmDelete);
                setConfirmDelete(null);
              }}
            >
              <Text style={st.deleteText}>Supprimer définitivement</Text>
            </Pressable>
            <Pressable style={st.closeBtn} onPress={() => setConfirmDelete(null)}>
              <Text style={st.closeText}>Garder le plat</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* ── Modal changement de PIN ────────────────────────────── */}
      <Modal visible={pinModal} transparent animationType="slide" onRequestClose={() => setPinModal(false)}>
        <Pressable style={st.backdrop} onPress={() => setPinModal(false)} />
        <View style={st.sheet}>
          <View style={st.handle} />
          <Text style={st.sheetTitle}>🔐 Changer mon PIN</Text>
          <Text style={st.label}>PIN actuel</Text>
          <TextInput
            style={st.input}
            value={curPin}
            onChangeText={(t) => setCurPin(t.replace(/[^0-9]/g, '').slice(0, 6))}
            keyboardType="number-pad"
            secureTextEntry
            placeholder="••••"
            placeholderTextColor={colors.textMuted}
          />
          <Text style={st.label}>Nouveau PIN (4 à 6 chiffres)</Text>
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
            <View style={[st.errBox, pinMsg.ok && { backgroundColor: colors.primaryLight }]}>
              <Ionicons name={pinMsg.ok ? 'checkmark-circle' : 'alert-circle'} size={15} color={pinMsg.ok ? colors.primary : colors.danger} />
              <Text style={[st.errText, pinMsg.ok && { color: colors.primaryDark }]}>{pinMsg.text}</Text>
            </View>
          )}
          <Pressable
            style={[st.saveBtn, (curPin.length < 4 || newPin.length < 4) && { opacity: 0.5 }]}
            disabled={curPin.length < 4 || newPin.length < 4}
            onPress={doChangePin}
          >
            <Ionicons name="key" size={17} color="#fff" />
            <Text style={st.saveText}>Changer le PIN</Text>
          </Pressable>
          <Pressable style={st.closeBtn} onPress={() => setPinModal(false)}>
            <Text style={st.closeText}>Fermer</Text>
          </Pressable>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const st = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  header: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 20, paddingVertical: 12 },
  back: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', ...shadow },
  title: { fontSize: 19, fontWeight: '800', color: colors.text },
  sub: { fontSize: 12, color: colors.textMuted, fontWeight: '600', marginTop: 1 },
  pinBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.primaryLight, alignItems: 'center', justifyContent: 'center' },
  addBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.primaryDark, alignItems: 'center', justifyContent: 'center', ...shadow },
  empty: { alignItems: 'center', paddingVertical: 60, gap: 8 },
  emptyTitle: { fontSize: 17, fontWeight: '800', color: colors.text },
  emptySub: { fontSize: 13, color: colors.textMuted },
  card: { backgroundColor: '#fff', borderRadius: radius.md, padding: 14, marginBottom: 12, ...shadow },
  emoji: { width: 50, height: 50, borderRadius: 14, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center' },
  photoThumb: { width: 50, height: 50, borderRadius: 14, backgroundColor: colors.bg },
  name: { fontSize: 15, fontWeight: '800', color: colors.text },
  desc: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  price: { fontSize: 13.5, fontWeight: '800', color: colors.primaryDark },
  priceStruck: { textDecorationLine: 'line-through', color: colors.textMuted, fontWeight: '600' },
  promoPrice: { fontSize: 14.5, fontWeight: '800', color: colors.accentDark },
  promoBadge: { backgroundColor: colors.accentLight, paddingHorizontal: 7, paddingVertical: 2, borderRadius: 6 },
  promoBadgeText: { fontSize: 9.5, fontWeight: '800', color: colors.accentDark },
  offBadge: { backgroundColor: colors.dangerLight, paddingHorizontal: 7, paddingVertical: 2, borderRadius: 6 },
  offBadgeText: { fontSize: 9.5, fontWeight: '800', color: colors.danger },
  actions: { flexDirection: 'row', gap: 8, marginTop: 12, flexWrap: 'wrap' },
  actionChip: {
    flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: colors.bg,
    paddingHorizontal: 10, paddingVertical: 7, borderRadius: 999, borderWidth: 1, borderColor: colors.border,
  },
  actionText: { fontSize: 11.5, fontWeight: '700', color: colors.textMuted },
  backdrop: { flex: 1, backgroundColor: 'rgba(18,33,26,0.5)' },
  sheet: {
    backgroundColor: '#fff', borderTopLeftRadius: 26, borderTopRightRadius: 26,
    paddingHorizontal: 22, paddingTop: 10, paddingBottom: 28, maxHeight: '88%',
  },
  handle: { width: 44, height: 5, borderRadius: 3, backgroundColor: colors.border, alignSelf: 'center', marginBottom: 12 },
  sheetTitle: { fontSize: 18, fontWeight: '800', color: colors.text, marginBottom: 14 },
  label: { fontSize: 12, fontWeight: '700', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 6, marginTop: 4 },
  input: {
    borderWidth: 1.5, borderColor: colors.border, borderRadius: radius.md, backgroundColor: colors.bg,
    paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: colors.text, marginBottom: 10,
  },
  hint: { fontSize: 11.5, color: colors.textMuted, marginBottom: 8, lineHeight: 16 },
  emojiPick: {
    width: 46, height: 46, borderRadius: 14, backgroundColor: colors.bg,
    alignItems: 'center', justifyContent: 'center', marginRight: 8, borderWidth: 1.5, borderColor: colors.border,
  },
  emojiPickActive: { borderColor: colors.primaryDark, backgroundColor: colors.primaryLight },
  photoRow: { flexDirection: 'row', gap: 12, marginBottom: 4 },
  photoPreview: {
    width: 76, height: 76, borderRadius: 16, backgroundColor: colors.bg,
    alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: colors.border, overflow: 'hidden',
  },
  photoBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 7, backgroundColor: colors.primaryLight,
    borderRadius: 10, paddingHorizontal: 12, paddingVertical: 9,
  },
  photoBtnText: { fontSize: 12.5, fontWeight: '700', color: colors.primaryDark },
  photoRemove: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 2 },
  photoRemoveText: { fontSize: 12, fontWeight: '700', color: colors.danger },
  errBox: {
    flexDirection: 'row', alignItems: 'center', gap: 7, backgroundColor: colors.dangerLight,
    borderRadius: 10, padding: 10, marginBottom: 10,
  },
  errText: { flex: 1, fontSize: 12.5, color: colors.danger, fontWeight: '700' },
  saveBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: colors.primaryDark, borderRadius: radius.md, paddingVertical: 15, marginTop: 6,
  },
  saveText: { color: '#fff', fontSize: 15, fontWeight: '800' },
  closeBtn: { alignItems: 'center', paddingVertical: 13 },
  closeText: { color: colors.textMuted, fontSize: 14, fontWeight: '700' },
  centerWrap: { flex: 1, backgroundColor: 'rgba(18,33,26,0.5)', justifyContent: 'center', paddingHorizontal: 36 },
  confirmCard: { backgroundColor: '#fff', borderRadius: 22, padding: 22 },
  confirmTitle: { fontSize: 17, fontWeight: '800', color: colors.text, textAlign: 'center', marginTop: 8 },
  confirmSub: { fontSize: 13, color: colors.textMuted, textAlign: 'center', marginTop: 6, lineHeight: 19 },
  deleteBtn: { backgroundColor: colors.danger, borderRadius: radius.md, paddingVertical: 14, alignItems: 'center', marginTop: 16 },
  deleteText: { color: '#fff', fontSize: 14.5, fontWeight: '800' },
});
