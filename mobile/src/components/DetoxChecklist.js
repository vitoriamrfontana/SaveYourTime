/**
 * DetoxChecklist - Sprint 4 (Detox de Assinaturas)
 *
 * "Você paga alguma destas?": cobranças que costumam passar despercebidas
 * (a lista vem da API, em /meta). Tocar em uma abre o formulário preenchido.
 */

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors } from '../theme/colors';

export default function DetoxChecklist({ itens, onEscolher }) {
  if (!itens || itens.length === 0) return null;

  return (
    <View style={styles.box}>
      <Text style={styles.titulo}>Você paga alguma destas?</Text>
      <Text style={styles.subtitulo}>
        São cobranças que costumam passar despercebidas. Toque na que você paga para cadastrar.
      </Text>

      {itens.map((item) => (
        <TouchableOpacity
          key={item.id}
          style={styles.linha}
          onPress={() => onEscolher(item)}
          accessibilityRole="button"
          accessibilityLabel={`Cadastrar ${item.nome}`}
        >
          <View style={styles.info}>
            <Text style={styles.nome}>{item.nome}</Text>
            <Text style={styles.dica}>{item.dica}</Text>
          </View>
          <Text style={styles.acao}>Pago</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  titulo: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '600',
  },
  subtitulo: {
    color: colors.textSecondary,
    fontSize: 13,
    lineHeight: 18,
    marginTop: 4,
    marginBottom: 4,
  },
  linha: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  info: {
    flex: 1,
    marginRight: 12,
  },
  nome: {
    color: colors.textPrimary,
    fontSize: 14,
  },
  dica: {
    color: colors.textMuted,
    fontSize: 12,
    marginTop: 2,
    lineHeight: 16,
  },
  acao: {
    color: colors.accent,
    fontSize: 13,
    fontWeight: '600',
  },
});
