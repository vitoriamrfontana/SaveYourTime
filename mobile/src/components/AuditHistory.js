/**
 * AuditHistory - rodapé da lista com o histórico de mudanças das assinaturas
 * (vem junto do resumo da tela).
 *
 * Sprint 4: rótulo, sinal e cor para cada ação nova (pausa, volta da pausa,
 * teste grátis, mudança de preço e exclusão) e "Ver tudo" depois das 5 primeiras.
 */

import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors } from '../theme/colors';
import { formatarData, formatarDataHora, formatarMoeda } from '../utils/format';

const LIMITE_EVENTOS = 5;

// Sprint 4: "−" é gasto que deixou de existir, "+" é gasto que voltou
const ACOES = {
  cancelada: { rotulo: 'Cancelada', sinal: '−', cor: colors.success },
  pausada: { rotulo: 'Pausada', sinal: '−', cor: colors.success },
  reativada: { rotulo: 'Reativada', sinal: '+', cor: colors.danger },
  retomada: { rotulo: 'Voltou da pausa', sinal: '+', cor: colors.danger },
  teste_iniciado: { rotulo: 'Teste grátis começou', sinal: '', cor: colors.textSecondary },
  teste_encerrado: { rotulo: 'Teste grátis acabou', sinal: '+', cor: colors.danger },
  preco_alterado: { rotulo: 'Preço alterado', sinal: '', cor: colors.warning },
  removida: { rotulo: 'Cadastro removido', sinal: '', cor: colors.textMuted },
};

// Ação que o app ainda não conhece não quebra o histórico
const ACAO_DESCONHECIDA = { rotulo: 'Alterada', sinal: '', cor: colors.textSecondary };

function descrever(evento, acao) {
  const quando = formatarDataHora(evento.data);
  if (evento.acao === 'pausada' && evento.pausadaAte) {
    return `Pausada até ${formatarData(evento.pausadaAte)}, em ${quando}`;
  }
  if (evento.acao === 'preco_alterado') {
    return `De ${formatarMoeda(evento.valorAnterior)} para ${formatarMoeda(evento.valorMensal)} por mês, em ${quando}`;
  }
  return `${acao.rotulo} em ${quando}`;
}

export default function AuditHistory({ auditoria = [] }) {
  const [verTudo, setVerTudo] = useState(false);
  const eventos = verTudo ? auditoria : auditoria.slice(0, LIMITE_EVENTOS);

  return (
    <View style={styles.box}>
      <Text style={styles.titulo}>Histórico de alterações</Text>

      {eventos.length === 0 ? (
        <Text style={styles.vazio}>
          Nenhuma mudança ainda. Cancelamentos, pausas e mudanças de preço aparecem aqui.
        </Text>
      ) : (
        eventos.map((evento) => {
          const acao = ACOES[evento.acao] ?? ACAO_DESCONHECIDA;
          return (
            <View key={evento.id} style={styles.linha}>
              <View style={[styles.marcador, { backgroundColor: acao.cor }]} />
              <View style={styles.info}>
                <Text style={styles.nome}>{evento.nome}</Text>
                <Text style={styles.detalhe}>{descrever(evento, acao)}</Text>
              </View>
              <Text style={[styles.valor, { color: acao.cor }]}>
                {acao.sinal}
                {formatarMoeda(evento.valorMensal)}/mês
              </Text>
            </View>
          );
        })
      )}

      {auditoria.length > LIMITE_EVENTOS && (
        <TouchableOpacity
          onPress={() => setVerTudo((atual) => !atual)}
          accessibilityRole="button"
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Text style={styles.verTudo}>{verTudo ? 'Ver menos' : `Ver tudo (${auditoria.length})`}</Text>
        </TouchableOpacity>
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
  // Sprint 4
  verTudo: {
    color: colors.accent,
    fontSize: 13,
    fontWeight: '600',
    marginTop: 8,
  },
});
