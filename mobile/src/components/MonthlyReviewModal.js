/**
 * MonthlyReviewModal - Sprint 4 (Detox de Assinaturas)
 *
 * "Detox do mês": um cartão por assinatura ativa, da que mais pede atenção para a
 * que menos pede. Em cada um, a pessoa confere o uso e decide entre manter, pausar
 * por 1 mês ou cancelar. No fim, vê quanto vai liberar por mês (em reais e em
 * horas de trabalho) e só então confirma; até lá, dá para voltar e mudar de ideia.
 */

import React, { useEffect, useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { colors } from '../theme/colors';
import { formatarHoras, formatarMoeda } from '../utils/format';
import { DECISOES, resumirDecisoes } from '../utils/revisaoDoMes';
import { CostBenefitBadge } from './UsageCheckModal';

const ROTULOS_SUGESTAO = {
  cancelar: 'Sugestão: cancelar',
  pausar: 'Sugestão: pausar',
  verificar: 'Sugestão: conferir o uso',
  decidir: 'Sugestão: decidir antes de o teste acabar',
  manter: 'Sugestão: manter',
};

const OPCOES = [
  { decisao: DECISOES.MANTER, rotulo: 'Manter' },
  { decisao: DECISOES.PAUSAR, rotulo: 'Pausar 1 mês' },
  { decisao: DECISOES.CANCELAR, rotulo: 'Cancelar' },
];

function descreverVerificacao(resultado) {
  if (resultado.forma === 'pergunta') return resultado.resposta ? 'está sendo útil' : 'não está compensando';
  if (resultado.custoPorUso === null) return 'sem uso no mês';
  return `${formatarMoeda(resultado.custoPorUso)} por uso`;
}

function nomes(lista) {
  return lista.map((s) => s.nome).join(', ');
}

export default function MonthlyReviewModal({ visible, onFechar, carregarRevisao, onVerificarUso, onAplicar }) {
  const [revisao, setRevisao] = useState(null);
  const [indice, setIndice] = useState(0);
  const [decisoes, setDecisoes] = useState({});
  const [verificacoes, setVerificacoes] = useState({});
  const [usos, setUsos] = useState('');
  const [erro, setErro] = useState(null);
  const [ocupado, setOcupado] = useState(false);
  const [concluido, setConcluido] = useState(false);

  // Ao abrir, busca a revisão do mês e recomeça do primeiro cartão
  useEffect(() => {
    if (!visible) return undefined;
    let aberto = true;
    setRevisao(null);
    setIndice(0);
    setDecisoes({});
    setVerificacoes({});
    setUsos('');
    setErro(null);
    setConcluido(false);
    carregarRevisao()
      .then((dados) => aberto && setRevisao(dados))
      .catch((err) => aberto && setErro(err.message));
    return () => {
      aberto = false;
    };
  }, [visible, carregarRevisao]);

  const itens = revisao?.itens ?? [];
  const item = itens[indice];
  const resumo = revisao ? resumirDecisoes(itens, decisoes, revisao.valorHora) : null;

  // "entrada" é o número de usos ou { resposta }
  const conferir = async (entrada) => {
    setOcupado(true);
    setErro(null);
    try {
      const resultado = await onVerificarUso(item.assinatura.id, entrada);
      setVerificacoes((atuais) => ({ ...atuais, [item.assinatura.id]: resultado }));
    } catch (err) {
      setErro(err.message);
    } finally {
      setOcupado(false);
    }
  };

  const decidir = (decisao) => {
    setDecisoes((atuais) => ({ ...atuais, [item.assinatura.id]: decisao }));
    setIndice((atual) => atual + 1);
    setUsos('');
    setErro(null);
  };

  const confirmar = async () => {
    setOcupado(true);
    setErro(null);
    const falhas = await onAplicar(decisoes);
    setOcupado(false);
    if (falhas > 0) {
      setErro(`${falhas} ${falhas === 1 ? 'mudança não foi salva' : 'mudanças não foram salvas'}. Confira na lista e tente de novo.`);
    } else {
      setConcluido(true);
    }
  };

  const renderCartao = () => {
    const { assinatura, verificacao, sugestao, motivo } = item;
    const resultado = verificacoes[assinatura.id];
    // Teste grátis não se pausa: mantém ou cancela antes da primeira cobrança
    const opcoes = assinatura.status === 'teste' ? OPCOES.filter((o) => o.decisao !== DECISOES.PAUSAR) : OPCOES;

    return (
      <>
        <Text style={styles.passo}>
          {indice + 1} de {itens.length}
        </Text>
        <Text style={styles.nome}>{assinatura.nome}</Text>
        <Text style={styles.valor}>
          {formatarMoeda(assinatura.valorMensal)}/mês
          {assinatura.horasDeTrabalho != null ? ` · ${formatarHoras(assinatura.horasDeTrabalho)} do seu mês` : ''}
        </Text>
        <Text style={styles.sugestao}>{ROTULOS_SUGESTAO[sugestao]}</Text>
        <Text style={styles.motivo}>{motivo}</Text>

        {verificacao.forma === 'uso' && (
          <>
            <Text style={styles.label}>Quantas vezes você usou neste mês?</Text>
            <View style={styles.linha}>
              <TextInput
                style={[styles.input, styles.inputUsos]}
                value={usos}
                onChangeText={(texto) => setUsos(texto.replace(/\D/g, ''))}
                placeholder="Ex.: 3"
                placeholderTextColor={colors.textMuted}
                keyboardType="number-pad"
                maxLength={4}
                accessibilityLabel={`Quantas vezes você usou ${assinatura.nome} neste mês`}
              />
              <TouchableOpacity
                style={[styles.botaoPequeno, (usos === '' || ocupado) && styles.desabilitado]}
                onPress={() => conferir(Number(usos))}
                disabled={usos === '' || ocupado}
                accessibilityRole="button"
              >
                <Text style={styles.botaoTexto}>Conferir</Text>
              </TouchableOpacity>
            </View>
          </>
        )}
        {verificacao.forma === 'pergunta' && (
          <>
            <Text style={styles.label}>{verificacao.pergunta}</Text>
            <View style={styles.linha}>
              {[
                { resposta: true, rotulo: 'Sim' },
                { resposta: false, rotulo: 'Não' },
              ].map((opcao) => (
                <TouchableOpacity
                  key={opcao.rotulo}
                  style={[styles.botaoPequeno, ocupado && styles.desabilitado]}
                  onPress={() => conferir({ resposta: opcao.resposta })}
                  disabled={ocupado}
                  accessibilityRole="button"
                >
                  <Text style={styles.botaoTexto}>{opcao.rotulo}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}
        {resultado && (
          <View style={styles.resultado}>
            <CostBenefitBadge classificacao={resultado.classificacao} />
            <Text style={styles.resultadoTexto}>{descreverVerificacao(resultado)}</Text>
          </View>
        )}

        <View style={styles.opcoes}>
          {opcoes.map(({ decisao, rotulo }) => (
            <TouchableOpacity
              key={decisao}
              style={[styles.opcao, decisoes[assinatura.id] === decisao && styles.opcaoEscolhida]}
              onPress={() => decidir(decisao)}
              accessibilityRole="button"
              accessibilityState={{ selected: decisoes[assinatura.id] === decisao }}
            >
              <Text style={[styles.opcaoTexto, decisao === DECISOES.CANCELAR && styles.opcaoCancelar]}>{rotulo}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </>
    );
  };

  const renderResumo = () => {
    const mudou = resumo.pausadas.length + resumo.canceladas.length > 0;
    return (
      <>
        <Text style={styles.nome}>Resumo do Detox do mês</Text>
        {mudou ? (
          <>
            {resumo.canceladas.length > 0 && (
              <Text style={styles.motivo}>Cancelar: {nomes(resumo.canceladas)}.</Text>
            )}
            {resumo.pausadas.length > 0 && (
              <Text style={styles.motivo}>Pausar por 1 mês: {nomes(resumo.pausadas)}.</Text>
            )}
            <Text style={styles.destaque}>
              Você vai liberar {formatarMoeda(resumo.liberadoPorMes)} por mês
              {resumo.horas != null ? `, ou ${formatarHoras(resumo.horas)} de trabalho` : ''}.
            </Text>
            <TouchableOpacity
              style={[styles.botao, ocupado && styles.desabilitado]}
              onPress={confirmar}
              disabled={ocupado}
              accessibilityRole="button"
            >
              {ocupado ? (
                <ActivityIndicator color={colors.textPrimary} />
              ) : (
                <Text style={styles.botaoTexto}>Confirmar</Text>
              )}
            </TouchableOpacity>
          </>
        ) : (
          <Text style={styles.motivo}>Você decidiu manter todas. Elas continuam valendo o que custam.</Text>
        )}
        <TouchableOpacity onPress={() => setIndice(0)} accessibilityRole="button" style={styles.linkBotao}>
          <Text style={styles.link}>Revisar de novo</Text>
        </TouchableOpacity>
      </>
    );
  };

  const renderConteudo = () => {
    if (concluido) {
      return (
        <>
          <Text style={styles.nome}>Pronto!</Text>
          <Text style={styles.destaque}>
            Você liberou {formatarMoeda(resumo.liberadoPorMes)} por mês
            {resumo.horas != null ? `, ou ${formatarHoras(resumo.horas)} de trabalho` : ''}.
          </Text>
          <TouchableOpacity style={styles.botao} onPress={onFechar} accessibilityRole="button">
            <Text style={styles.botaoTexto}>Fechar</Text>
          </TouchableOpacity>
        </>
      );
    }
    if (!revisao) return erro ? null : <ActivityIndicator color={colors.accent} />;
    if (itens.length === 0) {
      return <Text style={styles.motivo}>Nenhuma assinatura ativa para revisar neste mês.</Text>;
    }
    return item ? renderCartao() : renderResumo();
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onFechar}>
      <View style={styles.tela}>
        <View style={styles.cabecalho}>
          <Text style={styles.titulo}>Detox do mês</Text>
          <TouchableOpacity
            onPress={onFechar}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            accessibilityRole="button"
            accessibilityLabel="Fechar"
          >
            <Text style={styles.fechar}>✕</Text>
          </TouchableOpacity>
        </View>

        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.conteudo}>
          {erro ? <Text style={styles.erro}>{erro}</Text> : null}
          {renderConteudo()}
          {item && indice > 0 && !concluido && (
            <TouchableOpacity
              onPress={() => setIndice((atual) => atual - 1)}
              accessibilityRole="button"
              style={styles.linkBotao}
            >
              <Text style={styles.link}>Voltar à anterior</Text>
            </TouchableOpacity>
          )}
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  tela: {
    flex: 1,
    backgroundColor: colors.background,
    padding: 20,
  },
  cabecalho: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  titulo: {
    color: colors.textPrimary,
    fontSize: 20,
    fontWeight: 'bold',
  },
  fechar: {
    color: colors.textSecondary,
    fontSize: 18,
    paddingHorizontal: 4,
  },
  conteudo: {
    paddingBottom: 40,
  },
  passo: {
    color: colors.textMuted,
    fontSize: 12,
  },
  nome: {
    color: colors.textPrimary,
    fontSize: 18,
    fontWeight: '600',
    marginTop: 4,
  },
  valor: {
    color: colors.textSecondary,
    fontSize: 14,
    marginTop: 2,
  },
  sugestao: {
    color: colors.accent,
    fontSize: 14,
    fontWeight: '600',
    marginTop: 16,
  },
  motivo: {
    color: colors.textSecondary,
    fontSize: 14,
    lineHeight: 20,
    marginTop: 4,
  },
  label: {
    color: colors.textSecondary,
    fontSize: 13,
    marginTop: 16,
    marginBottom: 6,
  },
  linha: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: colors.textPrimary,
    fontSize: 16,
  },
  inputUsos: {
    flex: 1,
  },
  botaoPequeno: {
    backgroundColor: colors.accentStrong,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 18,
    alignItems: 'center',
  },
  resultado: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 10,
  },
  resultadoTexto: {
    color: colors.textSecondary,
    fontSize: 13,
  },
  opcoes: {
    marginTop: 20,
    gap: 10,
  },
  opcao: {
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  opcaoEscolhida: {
    borderColor: colors.accent,
  },
  opcaoTexto: {
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: '600',
  },
  opcaoCancelar: {
    color: colors.danger,
  },
  destaque: {
    color: colors.success,
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 22,
    marginTop: 16,
  },
  botao: {
    backgroundColor: colors.accentStrong,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 20,
  },
  botaoTexto: {
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: '600',
  },
  desabilitado: {
    opacity: 0.6,
  },
  linkBotao: {
    alignItems: 'center',
    paddingVertical: 14,
  },
  link: {
    color: colors.accent,
    fontSize: 14,
    fontWeight: '600',
  },
  erro: {
    color: colors.danger,
    fontSize: 13,
    marginBottom: 12,
  },
});
