/**
 * UpcomingChargesCard - Sprint 4 (Detox de Assinaturas)
 *
 * As cobranças dos próximos dias, incluindo fim de teste grátis e volta de
 * pausa, para dar tempo de cancelar antes da renovação.
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../theme/colors';
import { formatarMoeda, formatarQuando } from '../utils/format';

function descreverEvento({ tipo, diasRestantes, data, valor, suaParte }) {
  const quando = formatarQuando(diasRestantes, data);
  const parte = suaParte < valor ? ` · sua parte ${formatarMoeda(suaParte)}` : '';
  if (tipo === 'fim_teste') return `Teste grátis acaba ${quando} e começa a cobrar${parte}`;
  if (tipo === 'retomada') return `Volta da pausa e cobra ${quando}${parte}`;
  return `Cobrança ${quando}${parte}`;
}

export default function UpcomingChargesCard({ proximas }) {
  if (!proximas) return null;

  const { dias, itens, total, semData } = proximas;
  const quantidade = `${itens.length} ${itens.length === 1 ? 'cobrança' : 'cobranças'}`;

  return (
    <View style={styles.box}>
      <Text style={styles.titulo}>Próximas cobranças</Text>
      <Text style={styles.subtitulo}>
        {itens.length === 0
          ? `Nenhuma cobrança nos próximos ${dias} dias.`
          : `${formatarMoeda(total)} em ${quantidade} nos próximos ${dias} dias.`}
      </Text>

      {itens.map((item) => (
        <View key={`${item.id}-${item.data}`} style={styles.linha}>
          <View style={styles.info}>
            <Text style={styles.nome}>{item.nome}</Text>
            <Text style={[styles.detalhe, item.tipo === 'fim_teste' && styles.alerta]}>
              {descreverEvento(item)}
            </Text>
          </View>
          <Text style={styles.valor}>{formatarMoeda(item.valor)}</Text>
        </View>
      ))}

      {semData > 0 && (
        <Text style={styles.dica}>
          {semData === 1 ? '1 assinatura está' : `${semData} assinaturas estão`} sem dia de cobrança.
          Edite para ela aparecer aqui.
        </Text>
      )}
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
    borderLeftColor: colors.accent,
  },
  titulo: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '600',
  },
  subtitulo: {
    color: colors.textSecondary,
    fontSize: 13,
    marginTop: 4,
  },
  linha: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
  },
  info: {
    flex: 1,
    marginRight: 8,
  },
  nome: {
    color: colors.textPrimary,
    fontSize: 14,
  },
  detalhe: {
    color: colors.textMuted,
    fontSize: 12,
    marginTop: 2,
  },
  alerta: {
    color: colors.warning,
  },
  valor: {
    color: colors.textPrimary,
    fontSize: 13,
    fontWeight: '600',
  },
  dica: {
    color: colors.textMuted,
    fontSize: 12,
    marginTop: 12,
    lineHeight: 17,
  },
});
