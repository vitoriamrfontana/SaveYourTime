/**
 * CancellationGuideModal - Sprint 4 (Detox de Assinaturas)
 *
 * Como cancelar: link oficial do serviço (quando ele está no catálogo), passo a
 * passo, lojas de aplicativo e os direitos do consumidor que valem para o caso.
 * Depois de cancelar no serviço, a pessoa marca a assinatura como cancelada aqui.
 */

import React, { useEffect, useState } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { colors } from '../theme/colors';

export default function CancellationGuideModal({ assinatura, carregarGuia, onMarcarCancelada, onFechar }) {
  const [guia, setGuia] = useState(null);
  const [erro, setErro] = useState(null);

  // Ao abrir, busca o guia da assinatura escolhida
  useEffect(() => {
    if (!assinatura) return undefined;
    let aberto = true;
    setGuia(null);
    setErro(null);
    carregarGuia(assinatura.id)
      .then((dados) => aberto && setGuia(dados))
      .catch((err) => aberto && setErro(err.message));
    return () => {
      aberto = false;
    };
  }, [assinatura, carregarGuia]);

  const abrir = (link) => {
    Linking.openURL(link).catch(() => setErro('Não foi possível abrir o link neste aparelho.'));
  };

  if (!assinatura) return null;

  return (
    <Modal visible animationType="slide" transparent onRequestClose={onFechar}>
      <View style={styles.fundo}>
        <View style={styles.painel}>
          <View style={styles.cabecalho}>
            <Text style={styles.titulo}>Como cancelar {assinatura.nome}</Text>
            <TouchableOpacity
              onPress={onFechar}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              accessibilityRole="button"
              accessibilityLabel="Fechar"
            >
              <Text style={styles.fechar}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView>
            {erro ? <Text style={styles.erro}>{erro}</Text> : null}
            {!guia && !erro && <ActivityIndicator color={colors.accent} />}

            {guia && (
              <>
                {guia.linkCancelamento && (
                  <TouchableOpacity
                    style={styles.botao}
                    onPress={() => abrir(guia.linkCancelamento)}
                    accessibilityRole="link"
                  >
                    <Text style={styles.botaoTexto}>Abrir a página oficial de cancelamento</Text>
                  </TouchableOpacity>
                )}

                <Text style={styles.secao}>Passo a passo</Text>
                {guia.passos.map((passo, posicao) => (
                  <Text key={passo} style={styles.texto}>
                    {posicao + 1}. {passo}
                  </Text>
                ))}

                <Text style={styles.secao}>Assinou pela loja do celular?</Text>
                <View style={styles.lojas}>
                  {guia.lojas.map((loja) => (
                    <TouchableOpacity key={loja.nome} onPress={() => abrir(loja.link)} accessibilityRole="link">
                      <Text style={styles.link}>{loja.nome}</Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <Text style={styles.secao}>Seus direitos</Text>
                {guia.direitos.map((direito) => (
                  <View key={direito.id} style={styles.direito}>
                    <Text style={styles.direitoTitulo}>{direito.titulo}</Text>
                    <Text style={styles.texto}>{direito.texto}</Text>
                    <Text style={styles.baseLegal}>{direito.baseLegal}</Text>
                  </View>
                ))}
                <Text style={styles.aviso}>{guia.aviso}</Text>

                {assinatura.status !== 'cancelada' && (
                  <TouchableOpacity
                    style={styles.botaoSecundario}
                    onPress={() => onMarcarCancelada(assinatura)}
                    accessibilityRole="button"
                  >
                    <Text style={styles.botaoSecundarioTexto}>Já cancelei: marcar como cancelada</Text>
                  </TouchableOpacity>
                )}
              </>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  fundo: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'flex-end',
  },
  painel: {
    maxHeight: '90%',
    backgroundColor: colors.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    borderTopWidth: 1,
    borderColor: colors.border,
  },
  cabecalho: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  titulo: {
    color: colors.textPrimary,
    fontSize: 18,
    fontWeight: 'bold',
    flex: 1,
    marginRight: 12,
  },
  fechar: {
    color: colors.textSecondary,
    fontSize: 18,
    paddingHorizontal: 4,
  },
  erro: {
    color: colors.danger,
    fontSize: 13,
    marginBottom: 12,
  },
  botao: {
    backgroundColor: colors.accentStrong,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 8,
  },
  botaoTexto: {
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: '600',
  },
  secao: {
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 6,
  },
  texto: {
    color: colors.textSecondary,
    fontSize: 13,
    lineHeight: 19,
    marginBottom: 4,
  },
  lojas: {
    flexDirection: 'row',
    gap: 20,
  },
  link: {
    color: colors.accent,
    fontSize: 14,
    fontWeight: '600',
  },
  direito: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 12,
    marginBottom: 8,
  },
  direitoTitulo: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  baseLegal: {
    color: colors.textMuted,
    fontSize: 11,
    marginTop: 2,
  },
  aviso: {
    color: colors.textMuted,
    fontSize: 11,
    lineHeight: 16,
    marginTop: 8,
  },
  botaoSecundario: {
    borderWidth: 1,
    borderColor: colors.accent,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 8,
  },
  botaoSecundarioTexto: {
    color: colors.accent,
    fontSize: 15,
    fontWeight: '600',
  },
});
