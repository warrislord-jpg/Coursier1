import React from 'react';
import { View, Text, Pressable, StyleSheet, ViewStyle } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { colors, radius, shadow } from '../lib/theme';

export function Button({
  title, onPress, variant = 'primary', icon, disabled, style,
}: {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'outline' | 'ghost';
  icon?: keyof typeof Ionicons.glyphMap;
  disabled?: boolean;
  style?: ViewStyle;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        st.btn,
        variant === 'primary' && { backgroundColor: disabled ? '#9CCDB9' : colors.primary },
        variant === 'outline' && { backgroundColor: '#fff', borderWidth: 1.5, borderColor: colors.primary },
        variant === 'ghost' && { backgroundColor: colors.primaryLight },
        pressed && { opacity: 0.85, transform: [{ scale: 0.98 }] },
        style,
      ]}
    >
      {icon ? (
        <Ionicons name={icon} size={18} color={variant === 'primary' ? '#fff' : colors.primary} style={{ marginRight: 8 }} />
      ) : null}
      <Text style={[st.btnText, { color: variant === 'primary' ? '#fff' : colors.primaryDark }]}>{title}</Text>
    </Pressable>
  );
}

export function Chip({ label, active, onPress }: { label: string; active?: boolean; onPress?: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      style={[st.chip, active && { backgroundColor: colors.primary, borderColor: colors.primary }]}
    >
      <Text style={[st.chipText, active && { color: '#fff' }]}>{label}</Text>
    </Pressable>
  );
}

export function Card({ children, style }: { children: React.ReactNode; style?: ViewStyle }) {
  return <View style={[st.card, style]}>{children}</View>;
}

export function EmptyState({ icon, title, subtitle }: { icon: keyof typeof Ionicons.glyphMap; title: string; subtitle: string }) {
  return (
    <View style={st.empty}>
      <View style={st.emptyIcon}>
        <Ionicons name={icon} size={36} color={colors.primary} />
      </View>
      <Text style={st.emptyTitle}>{title}</Text>
      <Text style={st.emptySub}>{subtitle}</Text>
    </View>
  );
}

export function SectionTitle({ title, action, onAction }: { title: string; action?: string; onAction?: () => void }) {
  return (
    <View style={st.secRow}>
      <Text style={st.secTitle}>{title}</Text>
      {action ? (
        <Pressable onPress={onAction}>
          <Text style={st.secAction}>{action}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const st = StyleSheet.create({
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: radius.md,
  },
  btnText: { fontSize: 16, fontWeight: '700' },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: 8,
  },
  chipText: { color: colors.text, fontWeight: '600', fontSize: 13 },
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: 16,
    ...shadow,
  },
  empty: { alignItems: 'center', paddingVertical: 48, paddingHorizontal: 32 },
  emptyIcon: {
    width: 76, height: 76, borderRadius: 38,
    backgroundColor: colors.primaryLight,
    alignItems: 'center', justifyContent: 'center', marginBottom: 16,
  },
  emptyTitle: { fontSize: 18, fontWeight: '800', color: colors.text, marginBottom: 6, textAlign: 'center' },
  emptySub: { fontSize: 14, color: colors.textMuted, textAlign: 'center', lineHeight: 20 },
  secRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: 12, marginTop: 8,
  },
  secTitle: { fontSize: 19, fontWeight: '800', color: colors.text },
  secAction: { color: colors.primary, fontWeight: '700', fontSize: 14 },
});
