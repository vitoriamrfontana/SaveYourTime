/**
 * MaturityBadge - badge de "Maturidade Comportamental" da auditoria final:
 * nível atual (de "Em observação" a "Mestre do autocontrole"), pontuação de
 * 0 a 100 e o que falta para o próximo nível.
 *
 * A pontuação vem pronta do back-end (cooldownModel.calcularMaturidade):
 * desistência e necessidade genuína comprada depois da quarentena valem 1,
 * compra consciente com gatilho emocional vale 0,5 e compra por impulso, 0.
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../theme/colors';
import { textoProximoNivel } from '../utils/antirrecaida';

const VISUAL_NIVEL = {
  em_observacao: { icone: '🔍', cor: colors.textMuted },
  reativo: { icone: '⚡', cor: colors.danger },
  despertar: { icone: '🌱', cor: colors.warning },
  consciente: { icone: '🧭', cor: colors.accent },
  mestre: { icone: '🏆', cor: colors.success },
};

export default function MaturityBadge({ maturidade }) {
  if (!maturidade) return null;

  const visual = VISUAL_NIVEL[maturidade.chave] ?? VISUAL_NIVEL.em_observacao;
  const totalEstagios = maturidade.totalEstagios ?? 5;
  const emObservacao = maturidade.chave === 'em_observacao';

  return (
    <View
      style={[styles.box, { borderColor: visual.cor }]}
      accessible
      accessibilityLabel={`Maturidade Comportamental: ${maturidade.titulo}, nível ${maturidade.estagio} de ${totalEstagios}, ${maturidade.pontuacao} de 100 pontos.`}
    >
      <View style={styles.linhaTopo}>
        <View style={[styles.medalha, { borderColor: visual.cor }]}>
          <Text style={styles.icone}>{visual.icone}</Text>
        </View>

        <View style={styles.textos}>
          <Text style={styles.label}>Maturidade Comportamental</Text>
          <Text style={[styles.titulo, { color: visual.cor }]}>{maturidade.titulo}</Text>
        </View>

        {!emObservacao && (
          <View style={styles.pontuacao}>
            <Text style={styles.pontuacaoValor}>{maturidade.pontuacao}</Text>
            <Text style={styles.pontuacaoLabel}>de 100</Text>
          </View>
        )}
      </View>

      <Text style={styles.descricao}>{maturidade.descricao}</Text>

      <View style={styles.estagios}>
        {Array.from({ length: totalEstagios }, (_, i) => (
          <View
            key={i}
            style={[styles.estagio, i < maturidade.estagio && { backgroundColor: visual.cor }]}
          />
        ))}
        <Text style={styles.estagioTexto}>
          nível {maturidade.estagio} de {totalEstagios}
        </Text>
      </View>

      <Text style={styles.proximo}>{textoProximoNivel(maturidade.proximoNivel)}</Text>
      <Text style={styles.rodape}>
        {maturidade.decisoesMaduras} de {maturidade.totalDecisoes} decisões maduras
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    marginBottom: 12,
  },
  linhaTopo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  medalha: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  icone: {
    fontSize: 22,
  },
  textos: {
    flex: 1,
  },
  label: {
    color: colors.textMuted,
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  titulo: {
    fontSize: 17,
    fontWeight: 'bold',
    marginTop: 2,
  },
  pontuacao: {
    alignItems: 'flex-end',
  },
  pontuacaoValor: {
    color: colors.textPrimary,
    fontSize: 22,
    fontWeight: 'bold',
  },
  pontuacaoLabel: {
    color: colors.textMuted,
    fontSize: 11,
  },
  descricao: {
    color: colors.textSecondary,
    fontSize: 13,
    lineHeight: 18,
    marginTop: 10,
  },
  estagios: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
  },
  estagio: {
    width: 22,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.border,
    marginRight: 4,
  },
  estagioTexto: {
    color: colors.textMuted,
    fontSize: 11,
    marginLeft: 6,
  },
  proximo: {
    color: colors.textPrimary,
    fontSize: 12,
    marginTop: 10,
    lineHeight: 17,
  },
  rodape: {
    color: colors.textMuted,
    fontSize: 11,
    marginTop: 4,
  },
});
