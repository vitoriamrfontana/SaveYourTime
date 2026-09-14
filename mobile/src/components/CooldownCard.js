/**
 * CooldownCard - card de um desejo em quarentena: mostra o preço, o custo
 * em horas de trabalho e quanto falta para a trava de 48h liberar a compra.
 *
 * Sprint 1: o tempo restante é estático (vem pronto da API, em horas),
 * sem contagem regressiva ao vivo.
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../theme/colors';

function formatarMoeda(valor) {
  return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

/** 41 -> "1d 17h" | 12 -> "12h" */
function formatarTempo(horas) {
  if (horas >= 24) {
    const dias = Math.floor(horas / 24);
    const resto = horas % 24;
    return resto > 0 ? `${dias}d ${resto}h` : `${dias}d`;
  }
  return `${horas}h`;
}

export default function CooldownCard({ item, periodoCooldownHoras = 48 }) {
  const { item: nome, preco, horasSuor, horasRestantes, status } = item;

  const liberado = status === 'liberado';
  const retaFinal = !liberado && horasRestantes <= 12;

  const corStatus = liberado ? colors.success : retaFinal ? colors.accent : colors.warning;

  // Quanto do período de reflexão já passou (0 a 1)
  const decorrido = Math.min(
    Math.max((periodoCooldownHoras - horasRestantes) / periodoCooldownHoras, 0),
    1
  );

  return (
    <View style={styles.card}>
      <View style={styles.linhaTopo}>
        <Text style={styles.nome} numberOfLines={2}>
          {nome}
        </Text>
        <View style={[styles.badge, { borderColor: corStatus }]}>
          <Text style={[styles.badgeTexto, { color: corStatus }]}>
            {liberado ? 'Liberado' : formatarTempo(horasRestantes)}
          </Text>
        </View>
      </View>

      <Text style={styles.preco}>{formatarMoeda(preco)}</Text>
      <Text style={styles.suor}>Equivale a {horasSuor}h do seu trabalho</Text>

      <View style={styles.barraFundo}>
        <View
          style={[
            styles.barraProgresso,
            { width: `${decorrido * 100}%`, backgroundColor: corStatus },
          ]}
        />
      </View>

      <Text style={styles.legenda}>
        {liberado
          ? 'Reflexão concluída. Ainda quer comprar?'
          : `Faltam ${formatarTempo(horasRestantes)} de reflexão`}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  linhaTopo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  nome: {
    flex: 1,
    marginRight: 12,
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: '600',
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
  },
  badgeTexto: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  preco: {
    color: colors.textPrimary,
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 6,
  },
  suor: {
    color: colors.textSecondary,
    fontSize: 13,
    marginTop: 2,
  },
  barraFundo: {
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.border,
    marginTop: 12,
    overflow: 'hidden',
  },
  barraProgresso: {
    height: '100%',
    borderRadius: 3,
  },
  legenda: {
    color: colors.textMuted,
    fontSize: 12,
    marginTop: 6,
  },
});
