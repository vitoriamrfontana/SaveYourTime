

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../theme/colors';

const LIMITE_EVENTOS = 5;

function formatarMoeda(valor) {
  return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function formatarData(iso) {
  const data = new Date(iso);
  const dia = data.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
  const hora = data.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  return `${dia} às ${hora}`;
}

export default function AuditHistory({ auditoria = [] }) {
  const eventos = auditoria.slice(0, LIMITE_EVENTOS);

  return (
    <View style={styles.box}>
      <Text style={styles.titulo}>Histórico de alterações</Text>

      {eventos.length === 0 ? (
        <Text style={styles.vazio}>
          Nenhuma assinatura foi cancelada ou reativada ainda. As alterações aparecem aqui.
        </Text>
      ) : (
        eventos.map((evento) => {
          const cancelada = evento.acao === 'cancelada';
          return (
            <View key={evento.id} style={styles.linha}>
              <View
                style={[styles.marcador, { backgroundColor: cancelada ? colors.success : colors.danger }]}
              />
              <View style={styles.info}>
                <Text style={styles.nome}>{evento.nome}</Text>
                <Text style={styles.detalhe}>
                  {cancelada ? 'Cancelada' : 'Reativada'} em {formatarData(evento.data)}
                </Text>
              </View>
              <Text style={[styles.valor, { color: cancelada ? colors.success : colors.danger }]}>
                {cancelada ? '−' : '+'}
                {formatarMoeda(evento.valorMensal)}/mês
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