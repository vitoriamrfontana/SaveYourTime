/**
 * CooldownAuditPanel - auditoria de desfecho da trava: quanto as desistências
 * já pouparam, a taxa de desistência e as últimas decisões registradas.
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../theme/colors';

const LIMITE_REGISTROS = 5;

function formatarMoeda(valor) {
  return Number(valor || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function formatarData(iso) {
  const data = new Date(iso);
  const dia = data.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
  const hora = data.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  return `${dia} às ${hora}`;
}

export default function CooldownAuditPanel({ auditoria }) {
  const registros = (auditoria?.registros ?? []).slice(0, LIMITE_REGISTROS);

  return (
    <View style={styles.box}>
      <Text style={styles.titulo}>Auditoria de desfecho</Text>

      <View style={styles.indicadores}>
        <View style={styles.indicador}>
          <Text style={styles.indicadorValor}>{formatarMoeda(auditoria?.economiaTotal)}</Text>
          <Text style={styles.indicadorLabel}>poupado</Text>
        </View>
        <View style={styles.indicador}>
          <Text style={styles.indicadorValor}>{auditoria?.horasPoupadas ?? 0}h</Text>
          <Text style={styles.indicadorLabel}>de trabalho de volta</Text>
        </View>
        <View style={styles.indicador}>
          <Text style={styles.indicadorValor}>{auditoria?.taxaDesistencia ?? 0}%</Text>
          <Text style={styles.indicadorLabel}>de desistência</Text>
        </View>
      </View>

      {registros.length === 0 ? (
        <Text style={styles.vazio}>
          Nenhuma quarentena encerrada ainda. Quando você desistir de uma compra, o valor poupado
          aparece aqui.
        </Text>
      ) : (
        registros.map((registro) => {
          const desistiu = registro.tipo === 'desistiu';
          return (
            <View key={registro.id} style={styles.linha}>
              <View
                style={[
                  styles.marcador,
                  { backgroundColor: desistiu ? colors.success : colors.danger },
                ]}
              />
              <View style={styles.info}>
                <Text style={styles.nome} numberOfLines={1}>
                  {registro.item}
                </Text>
                <Text style={styles.detalhe}>
                  {desistiu ? 'Desisti' : 'Comprei'} em {formatarData(registro.registradoEm)} · risco{' '}
                  {registro.nivelNoDesfecho}
                </Text>
              </View>
              <Text style={[styles.valor, { color: desistiu ? colors.success : colors.danger }]}>
                {desistiu ? '+' : '−'}
                {formatarMoeda(registro.preco)}
              </Text>
            </View>
          );
        })
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    marginTop: 12,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  titulo: {
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 10,
  },
  indicadores: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 12,
    marginBottom: 12,
  },
  indicador: {
    flex: 1,
    alignItems: 'center',
  },
  indicadorValor: {
    color: colors.success,
    fontSize: 15,
    fontWeight: 'bold',
  },
  indicadorLabel: {
    color: colors.textMuted,
    fontSize: 11,
    marginTop: 2,
    textAlign: 'center',
  },
  vazio: {
    color: colors.textSecondary,
    fontSize: 13,
    lineHeight: 18,
  },
  linha: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  marcador: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 10,
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
  valor: {
    fontSize: 13,
    fontWeight: '600',
  },
});
