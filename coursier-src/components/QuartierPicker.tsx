import React, { useState } from 'react';
import { View, Text, Pressable, Modal, FlatList, StyleSheet } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { colors, radius } from '../lib/theme';
import { QUARTIERS } from '../lib/data';

export default function QuartierPicker({
  label, value, onChange,
}: { label: string; value: string; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false);
  return (
    <View style={{ marginBottom: 14 }}>
      <Text style={st.label}>{label}</Text>
      <Pressable style={st.field} onPress={() => setOpen(true)}>
        <Ionicons name="location" size={18} color={colors.primary} />
        <Text style={st.value}>{value || 'Choisir un quartier'}</Text>
        <Ionicons name="chevron-down" size={18} color={colors.textMuted} />
      </Pressable>
      <Modal visible={open} transparent animationType="slide" onRequestClose={() => setOpen(false)}>
        <Pressable style={st.backdrop} onPress={() => setOpen(false)} />
        <View style={st.sheet}>
          <View style={st.handle} />
          <Text style={st.sheetTitle}>{label}</Text>
          <FlatList
            data={QUARTIERS}
            keyExtractor={(q) => q}
            renderItem={({ item }) => (
              <Pressable
                style={st.row}
                onPress={() => { onChange(item); setOpen(false); }}
              >
                <Ionicons
                  name={item === value ? 'radio-button-on' : 'radio-button-off'}
                  size={20}
                  color={item === value ? colors.primary : colors.textMuted}
                />
                <Text style={st.rowText}>{item}</Text>
              </Pressable>
            )}
          />
        </View>
      </Modal>
    </View>
  );
}

const st = StyleSheet.create({
  label: { fontSize: 13, fontWeight: '700', color: colors.textMuted, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.4 },
  field: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: '#fff', borderWidth: 1, borderColor: colors.border,
    borderRadius: radius.md, paddingHorizontal: 14, paddingVertical: 14,
  },
  value: { flex: 1, fontSize: 15, fontWeight: '600', color: colors.text },
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' },
  sheet: {
    backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24,
    paddingHorizontal: 20, paddingBottom: 24, paddingTop: 10, maxHeight: '65%',
  },
  handle: { width: 44, height: 5, borderRadius: 3, backgroundColor: colors.border, alignSelf: 'center', marginBottom: 12 },
  sheetTitle: { fontSize: 17, fontWeight: '800', color: colors.text, marginBottom: 8 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: colors.border },
  rowText: { fontSize: 15, fontWeight: '600', color: colors.text },
});
