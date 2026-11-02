/**
 * Chip - botão em formato de pílula do Detox de Assinaturas.
 *
 * Sprint 4: saiu de dentro do SubscriptionFilters para o formulário de
 * cadastro usar o mesmo.
 */

import React from 'react';
import { Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors } from '../theme/colors';

export default function Chip({ label, ativo, onPress }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[styles.chip, ativo && styles.chipAtivo]}
      accessibilityRole="button"
      accessibilityState={{ selected: ativo }}
    >
      <Text style={[styles.texto, ativo && styles.textoAtivo]}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  chip: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  chipAtivo: {
    backgroundColor: colors.accentStrong,
    borderColor: colors.accent,
  },
  texto: {
    color: colors.textSecondary,
    fontSize: 13,
  },
  textoAtivo: {
    color: colors.textPrimary,
    fontWeight: '600',
  },
});
