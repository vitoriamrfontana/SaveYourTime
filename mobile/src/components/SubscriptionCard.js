/**
 * SubscriptionCard - uma assinatura da lista: valor, custo em 5 anos, selo de
 * custo-benefício e o Switch de cancelar/reativar.
 *
 * Sprint 4: mostra o status (teste grátis, pausada, cancelada), o plano (ciclo e
 * divisão), a próxima cobrança e o botão de editar. A cancelada mostra quanto já
 * deixou de ser cobrado, e o Switch passou a ter label para o leitor de tela.
 */

import React from 'react';
import { View, Text, Switch, TouchableOpacity, StyleSheet } from 'react-native';
import { colors } from '../theme/colors';
import { formatarData, formatarMoeda } from '../utils/format';
import { CostBenefitBadge } from './UsageCheckModal';

// Como o status entra na frase lida pelo leitor de tela
const STATUS_FALADO = {
  ativa: 'ativa',
  teste: 'em teste grátis',
  pausada: 'pausada',
  cancelada: 'cancelada',
};

// "R$ 119,90 por ano · sua parte, dividida com 2 pessoas"
function descreverPlano({ ciclo, valorCobrado, compartilhadaCom }, fraseCiclo) {
  const partes = [];
  if (ciclo !== 'mensal') partes.push(`${formatarMoeda(valorCobrado)} ${fraseCiclo}`);
  if (compartilhadaCom > 0) {
    partes.push(`sua parte, dividida com ${compartilhadaCom} ${compartilhadaCom === 1 ? 'pessoa' : 'pessoas'}`);
  }
  return partes.join(' · ');
}

// Linha de situação: teste grátis, pausa, cancelamento ou próxima cobrança
function descreverSituacao(s) {
  if (s.status === 'teste') {
    return { texto: `Teste grátis até ${formatarData(s.fimTeste)}`, estilo: styles.situacaoAviso };
  }
  if (s.status === 'pausada') {
    return { texto: `Pausada até ${formatarData(s.pausadaAte)}`, estilo: styles.situacaoNeutra };
  }
  if (s.status === 'cancelada' && s.canceladaEm != null) {
    const economia =
      s.economizadoAteHoje > 0 ? ` · ${formatarMoeda(s.economizadoAteHoje)} economizados até hoje` : '';
    return { texto: `Cancelada em ${formatarData(s.canceladaEm)}${economia}`, estilo: styles.situacaoEconomia };
  }
  if (s.status === 'ativa' && s.proximaCobranca) {
    return { texto: `Próxima cobrança em ${formatarData(s.proximaCobranca)}`, estilo: styles.situacaoNeutra };
  }
  return null;
}

export default function SubscriptionCard({
  subscription,
  rotuloCategoria,
  fraseCiclo,
  onToggle,
  onEditar,
  custoEm5Anos,
  onVerificarUso,
}) {
  const { nome, valorMensal, ativo, status, usoMensal } = subscription;
  const plano = descreverPlano(subscription, fraseCiclo);
  const situacao = descreverSituacao(subscription);

  return (
    <View style={styles.card}>
      <View style={styles.info}>
        <Text style={[styles.nome, !ativo && styles.nomeInativo, status === 'cancelada' && styles.nomeCancelado]}>
          {nome}
        </Text>
        <Text style={styles.categoria}>{rotuloCategoria}</Text>
        <Text style={styles.valor}>{formatarMoeda(valorMensal)}/mês</Text>
        {plano ? <Text style={styles.plano}>{plano}</Text> : null}
        {ativo && custoEm5Anos != null && (
          <Text style={styles.custoInvisivel}>{formatarMoeda(custoEm5Anos)} em 5 anos</Text>
        )}
        {situacao && <Text style={[styles.situacao, situacao.estilo]}>{situacao.texto}</Text>}

        <View style={styles.acoes}>
          {/* Sprint 3: selo de custo-benefício e calculadora de custo por uso */}
          {ativo && usoMensal && (
            <>
              <CostBenefitBadge classificacao={usoMensal.classificacao} />
              <Text style={styles.custoPorUso}>
                {usoMensal.custoPorUso === null
                  ? 'sem uso no mês'
                  : `${formatarMoeda(usoMensal.custoPorUso)} por uso`}
              </Text>
            </>
          )}
          {ativo && onVerificarUso && (
            <TouchableOpacity
              onPress={() => onVerificarUso(subscription)}
              hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
              accessibilityRole="button"
              accessibilityLabel={`Verificar uso de ${nome}`}
              style={styles.botaoAcao}
            >
              <Text style={styles.acao}>{usoMensal ? 'Verificar de novo' : 'Verificar uso'}</Text>
            </TouchableOpacity>
          )}
          {/* Sprint 4 */}
          <TouchableOpacity
            onPress={() => onEditar(subscription)}
            hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
            accessibilityRole="button"
            accessibilityLabel={`Editar ${nome}`}
          >
            <Text style={styles.acao}>Editar</Text>
          </TouchableOpacity>
        </View>
      </View>
      {/* Sprint 4: sem label, o leitor de tela anunciava só "interruptor" */}
      <Switch
        value={ativo}
        onValueChange={() => onToggle(subscription)}
        trackColor={{ false: colors.border, true: colors.success }}
        thumbColor={ativo ? colors.textPrimary : colors.textMuted}
        accessibilityLabel={`${nome}, ${STATUS_FALADO[status]}, ${formatarMoeda(valorMensal)} por mês`}
        accessibilityHint={ativo ? 'Toque duas vezes para cancelar' : 'Toque duas vezes para reativar'}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  info: {
    flex: 1,
    marginRight: 12,
  },
  nome: {
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: '600',
  },
  nomeInativo: {
    color: colors.textMuted,
  },
  nomeCancelado: {
    textDecorationLine: 'line-through',
  },
  categoria: {
    color: colors.accent,
    fontSize: 12,
    marginTop: 2,
  },
  valor: {
    color: colors.textSecondary,
    fontSize: 13,
    marginTop: 2,
  },
  custoInvisivel: {
    color: colors.danger,
    fontSize: 12,
    marginTop: 2,
  },
  // Sprint 3
  custoPorUso: {
    color: colors.textSecondary,
    fontSize: 12,
    marginLeft: 8,
    marginRight: 12,
  },
  // Sprint 4
  plano: {
    color: colors.textMuted,
    fontSize: 12,
    marginTop: 2,
  },
  situacao: {
    fontSize: 12,
    marginTop: 2,
  },
  situacaoNeutra: {
    color: colors.textSecondary,
  },
  situacaoAviso: {
    color: colors.warning,
  },
  situacaoEconomia: {
    color: colors.success,
  },
  acoes: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    marginTop: 8,
  },
  botaoAcao: {
    marginRight: 16,
  },
  acao: {
    color: colors.accent,
    fontSize: 13,
    fontWeight: '600',
  },
});
