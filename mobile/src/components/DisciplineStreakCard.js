/**
 * DisciplineStreakCard - card de destaque no topo da aba Cooldown com o
 * "Fogo da Disciplina": dias seguidos sem compra por impulso (compra feita
 * antes de a quarentena terminar), o recorde e a próxima meta.
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../theme/colors';

const COR_FOGO = '#fb923c';

function formatarMoeda(valor) {
  return Number(valor || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function rotuloDias(dias) {
  return dias === 1 ? '1 dia' : `${dias} dias`;
}

export default function DisciplineStreakCard({ streak }) {
  const dias = streak?.diasSeguidos ?? 0;
  const recorde = streak?.recorde ?? 0;
  const meta = streak?.proximaMeta ?? null;
  const ultima = streak?.ultimaCompraImpulsiva ?? null;

  const aceso = dias > 0;
  const corFogo = aceso ? COR_FOGO : colors.textMuted;
  // Progresso até a próxima meta (ou cheio quando todas foram batidas)
  const progresso = meta ? Math.min(dias / meta.dias, 1) : 1;

  return (
    <View style={[styles.box, aceso && styles.boxAceso]}>
      <View style={styles.linhaTopo}>
        <Text style={styles.icone}>{aceso ? '🔥' : '🪵'}</Text>
        <View style={styles.textos}>
          <Text style={styles.label}>Fogo da Disciplina</Text>
          <Text style={[styles.dias, { color: corFogo }]}>
            {rotuloDias(dias)} {dias === 1 ? 'seguido' : 'seguidos'}
          </Text>
          <Text style={styles.detalhe}>sem compras por impulso</Text>
        </View>
        <View style={styles.recorde}>
          <Text style={styles.recordeValor}>{recorde}</Text>
          <Text style={styles.recordeLabel}>recorde</Text>
        </View>
      </View>

      {meta && (
        <>
          <View style={styles.barraFundo}>
            <View
              style={[styles.barraProgresso, { width: `${progresso * 100}%`, backgroundColor: corFogo }]}
            />
          </View>
          <Text style={styles.meta}>
            Faltam {rotuloDias(meta.faltam)} para a meta de {meta.dias} dias
          </Text>
        </>
      )}

      {!aceso && ultima && (
        <Text style={styles.quebra}>
          A sequência reiniciou com "{ultima.item}" ({formatarMoeda(ultima.preco)}), comprado antes
          do fim da quarentena.
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
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  boxAceso: {
    borderColor: COR_FOGO,
  },
  linhaTopo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  icone: {
    fontSize: 34,
    marginRight: 12,
  },
  textos: {
    flex: 1,
  },
  label: {
    color: colors.textSecondary,
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  dias: {
    fontSize: 22,
    fontWeight: 'bold',
    marginTop: 2,
  },
  detalhe: {
    color: colors.textPrimary,
    fontSize: 13,
  },
  recorde: {
    alignItems: 'center',
    paddingLeft: 12,
    borderLeftWidth: 1,
    borderLeftColor: colors.border,
  },
  recordeValor: {
    color: colors.textPrimary,
    fontSize: 18,
    fontWeight: 'bold',
  },
  recordeLabel: {
    color: colors.textMuted,
    fontSize: 11,
  },
  barraFundo: {
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.border,
    marginTop: 14,
    overflow: 'hidden',
  },
  barraProgresso: {
    height: '100%',
    borderRadius: 3,
  },
  meta: {
    color: colors.textMuted,
    fontSize: 12,
    marginTop: 6,
  },
  quebra: {
    color: colors.textSecondary,
    fontSize: 12,
    marginTop: 10,
    lineHeight: 17,
  },
});
