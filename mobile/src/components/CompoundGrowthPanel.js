
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../theme/colors';

const ALTURA_GRAFICO = 150;

function formatarMoeda(valor) {
  return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function formatarNumero(valor) {
  return valor.toLocaleString('pt-BR', { maximumFractionDigits: 2 });
}

function formatarPeriodo(meses) {
  const anos = meses / 12;
  return `${anos} ${anos === 1 ? 'ano' : 'anos'}`;
}

function Grafico({ pontos }) {
  const montanteMaximo = Math.max(...pontos.map((p) => p.montante), 0);

  return (
    <View style={styles.grafico}>
      {pontos.map((p) => {
        const alturaTotal = montanteMaximo > 0 ? (p.montante / montanteMaximo) * ALTURA_GRAFICO : 0;
        const alturaRendimento = p.montante > 0 ? (p.rendimento / p.montante) * alturaTotal : 0;

        return (
          <View key={p.meses} style={styles.coluna}>
            <View style={[styles.barra, { height: alturaTotal }]}>
              <View style={[styles.barraRendimento, { height: alturaRendimento }]} />
              <View style={styles.barraAportado} />
            </View>
            <Text style={styles.eixo}>{p.meses % 12 === 0 ? p.meses : ''}</Text>
          </View>
        );
      })}
    </View>
  );
}

export default function CompoundGrowthPanel({ projecaoJuros, custoInvisivel }) {
  if (!projecaoJuros || !custoInvisivel) return null;

  const { economiaMensal, taxaAnualPercentual, periodos, curva } = projecaoJuros;
  const pontos = curva.filter((p) => p.meses > 0);
  const ultimoPeriodo = periodos[periodos.length - 1];

  const custoPorPeriodo = {};
  custoInvisivel.totais.forEach((t) => {
    custoPorPeriodo[t.meses] = t.valor;
  });

  return (
    <View style={styles.box}>
      <Text style={styles.titulo}>Se o dinheiro das canceladas fosse investido</Text>

      {economiaMensal > 0 ? (
        <>
          <Text style={styles.resumo}>
            Aplicando {formatarMoeda(economiaMensal)} por mês a 100% do CDI (
            {formatarNumero(taxaAnualPercentual)}% ao ano), você teria{' '}
            <Text style={styles.resumoDestaque}>{formatarMoeda(ultimoPeriodo.montante)}</Text> em{' '}
            {formatarPeriodo(ultimoPeriodo.meses)}, sendo {formatarMoeda(ultimoPeriodo.rendimento)}{' '}
            só de juros.
          </Text>

          <View
            accessible
            accessibilityLabel={`Gráfico: o montante cresce até ${formatarMoeda(
              ultimoPeriodo.montante
            )} em ${ultimoPeriodo.meses} meses.`}
          >
            <Grafico pontos={pontos} />
            <Text style={styles.eixoLegenda}>meses</Text>
          </View>

          <View style={styles.legenda}>
            <View style={styles.legendaItem}>
              <View style={[styles.legendaCor, { backgroundColor: colors.accentStrong }]} />
              <Text style={styles.legendaTexto}>Valor guardado</Text>
            </View>
            <View style={styles.legendaItem}>
              <View style={[styles.legendaCor, { backgroundColor: colors.success }]} />
              <Text style={styles.legendaTexto}>Rendimento dos juros</Text>
            </View>
          </View>
        </>
      ) : (
        <Text style={styles.vazio}>
          Desative uma assinatura na lista abaixo para ver quanto esse dinheiro renderia
          aplicado.
        </Text>
      )}

      <View style={styles.tabela}>
        <View style={styles.linhaTabela}>
          <Text style={[styles.celula, styles.celulaPeriodo, styles.cabecalho]}>Período</Text>
          <Text style={[styles.celula, styles.cabecalho]}>Ativas vão custar</Text>
          <Text style={[styles.celula, styles.cabecalho]}>Canceladas renderiam</Text>
        </View>
        {periodos.map((p) => (
          <View key={p.meses} style={[styles.linhaTabela, styles.linhaDados]}>
            <Text style={[styles.celula, styles.celulaPeriodo]}>{formatarPeriodo(p.meses)}</Text>
            <Text style={[styles.celula, styles.valorCusto]}>
              {formatarMoeda(custoPorPeriodo[p.meses] ?? 0)}
            </Text>
            <Text style={[styles.celula, styles.valorRendimento]}>{formatarMoeda(p.montante)}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: colors.border,
  },
  titulo: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 6,
  },
  resumo: {
    color: colors.textSecondary,
    fontSize: 13,
    lineHeight: 19,
    marginBottom: 16,
  },
  resumoDestaque: {
    color: colors.success,
    fontWeight: 'bold',
  },
  grafico: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: ALTURA_GRAFICO + 20,
  },
  coluna: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  barra: {
    width: '70%',
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
    overflow: 'hidden',
  },
  barraRendimento: {
    backgroundColor: colors.success,
  },
  barraAportado: {
    flex: 1,
    backgroundColor: colors.accentStrong,
  },
  eixo: {
    color: colors.textMuted,
    fontSize: 11,
    marginTop: 4,
    height: 16,
  },
  eixoLegenda: {
    color: colors.textMuted,
    fontSize: 11,
    textAlign: 'center',
  },
  legenda: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    marginTop: 10,
  },
  legendaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendaCor: {
    width: 10,
    height: 10,
    borderRadius: 2,
  },
  legendaTexto: {
    color: colors.textSecondary,
    fontSize: 12,
  },
  vazio: {
    color: colors.textSecondary,
    fontSize: 13,
    lineHeight: 19,
  },
  tabela: {
    marginTop: 16,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 8,
  },
  linhaTabela: {
    flexDirection: 'row',
    paddingVertical: 6,
  },
  linhaDados: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  celula: {
    flex: 1,
    fontSize: 13,
    textAlign: 'right',
  },
  celulaPeriodo: {
    flex: 0.7,
    textAlign: 'left',
    color: colors.textPrimary,
  },
  cabecalho: {
    color: colors.textMuted,
    fontSize: 12,
  },
  valorCusto: {
    color: colors.danger,
    fontWeight: '600',
  },
  valorRendimento: {
    color: colors.success,
    fontWeight: '600',
  },
});