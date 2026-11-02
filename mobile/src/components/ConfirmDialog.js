/**
 * ConfirmDialog - Sprint 4 (Detox de Assinaturas)
 *
 * Diálogo de confirmação no tema do app, com até três opções. Substitui o
 * Alert.alert, que no React Native Web não abre nada.
 *
 * dialogo: { titulo, mensagem, opcoes: [{ rotulo, tipo?: 'cancelar' | 'destrutivo', onPress? }] }
 */

import React from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors } from '../theme/colors';

export default function ConfirmDialog({ dialogo, onFechar }) {
  if (!dialogo) return null;

  const escolher = (opcao) => {
    onFechar();
    if (opcao.onPress) opcao.onPress();
  };

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onFechar}>
      <View style={styles.fundo}>
        <View style={styles.caixa} accessibilityRole="alert" accessibilityViewIsModal>
          <Text style={styles.titulo}>{dialogo.titulo}</Text>
          {dialogo.mensagem ? <Text style={styles.mensagem}>{dialogo.mensagem}</Text> : null}

          <View style={styles.opcoes}>
            {dialogo.opcoes.map((opcao) => (
              <TouchableOpacity
                key={opcao.rotulo}
                style={[
                  styles.opcao,
                  opcao.tipo === 'cancelar' && styles.opcaoCancelar,
                  opcao.tipo === 'destrutivo' && styles.opcaoDestrutiva,
                ]}
                onPress={() => escolher(opcao)}
                accessibilityRole="button"
              >
                <Text
                  style={[
                    styles.opcaoTexto,
                    opcao.tipo === 'destrutivo' && styles.textoDestrutivo,
                    opcao.tipo === 'cancelar' && styles.textoCancelar,
                  ]}
                >
                  {opcao.rotulo}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  fundo: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'center',
    padding: 24,
  },
  caixa: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 20,
  },
  titulo: {
    color: colors.textPrimary,
    fontSize: 17,
    fontWeight: 'bold',
  },
  mensagem: {
    color: colors.textSecondary,
    fontSize: 14,
    lineHeight: 20,
    marginTop: 8,
  },
  opcoes: {
    marginTop: 20,
    gap: 10,
  },
  opcao: {
    backgroundColor: colors.accentStrong,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  opcaoCancelar: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },
  opcaoDestrutiva: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.danger,
  },
  opcaoTexto: {
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: '600',
  },
  textoDestrutivo: {
    color: colors.danger,
  },
  textoCancelar: {
    color: colors.textSecondary,
  },
});
