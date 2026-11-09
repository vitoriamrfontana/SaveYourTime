/**
 * UndoToast - Sprint 4 (Detox de Assinaturas)
 *
 * Aviso no rodapé da tela depois de cancelar ou pausar, com o botão
 * "Desfazer" por 5 segundos.
 */

import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors } from '../theme/colors';

const DURACAO_MS = 5000;

export default function UndoToast({ aviso, onDesfazer, onFechar }) {
  // Cada aviso novo reinicia a contagem
  useEffect(() => {
    if (!aviso) return undefined;
    const temporizador = setTimeout(onFechar, DURACAO_MS);
    return () => clearTimeout(temporizador);
  }, [aviso, onFechar]);

  if (!aviso) return null;

  return (
    <View style={styles.toast} accessibilityLiveRegion="polite">
      <Text style={styles.mensagem}>{aviso.mensagem}</Text>
      <TouchableOpacity
        onPress={onDesfazer}
        accessibilityRole="button"
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <Text style={styles.desfazer}>Desfazer</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  toast: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.accent,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    elevation: 4,
  },
  mensagem: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: 14,
    marginRight: 12,
  },
  desfazer: {
    color: colors.accent,
    fontSize: 14,
    fontWeight: 'bold',
  },
});
