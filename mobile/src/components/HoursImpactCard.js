
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../theme/colors';

function formatarMoeda(valor) {
  return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function formatarNumero(valor) {
  return valor.toLocaleString('pt-BR', { maximumFractionDigits: 1 });
}

export default function HoursImpactCard({ horasTrabalho }) {
  if (!horasTrabalho) return null;

  const { horasNecessarias, percentualDoMes, gastoMensal } = horasTrabalho;

  if (horasNecessarias === null) {
    return (
      <View style={styles.box}>
        <Text style={styles.detalhe}>
          Informe seu salário e suas horas mensais na aba Perfil para ver quantas horas de
          trabalho suas assinaturas custam.
        </Text>
      </View>
    );
  }

  if (gastoMensal === 0) {
    return (
      <View style={styles.box}>
        <Text style={styles.frase}>
          Nenhuma assinatura ativa. Nenhuma hora do seu mês vai para cobranças recorrentes.
        </Text>
      </View>
    );
  }

  const unidade = horasNecessarias === 1 ? 'hora' : 'horas';

  return (
    <View style={styles.box}>
      <Text style={styles.horas}>
        {formatarNumero(horasNecessarias)} {unidade}
      </Text>
      <Text style={styles.frase}>do seu mês são gastas apenas para manter suas assinaturas.</Text>
      <Text style={styles.detalhe}>
        São {formatarMoeda(gastoMensal)} por mês em assinaturas ativas
        {percentualDoMes !== null ? `, ou ${formatarNumero(percentualDoMes)}% da sua jornada.` : '.'}
      </Text>
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
    borderLeftWidth: 4,
    borderLeftColor: colors.warning,
  },
  horas: {
    color: colors.warning,
    fontSize: 32,
    fontWeight: 'bold',
  },
  frase: {
    color: colors.textPrimary,
    fontSize: 15,
    marginTop: 2,
  },
  detalhe: {
    color: colors.textSecondary,
    fontSize: 13,
    marginTop: 8,
    lineHeight: 18,
  },
});