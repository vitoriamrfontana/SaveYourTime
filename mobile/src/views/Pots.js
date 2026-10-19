import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { usePotsController } from '../controllers/PotsController';
import { CORES_STATUS } from '../models/Pots';
import { checkPurchaseBudgetImpact } from '../services/api';

const CATEGORIAS = [
  { chave: 'sobrevivencia', nome: 'Necessidades', percentual: 50 },
  { chave: 'estiloVida', nome: 'Estilo de Vida', percentual: 30 },
  { chave: 'dividas', nome: 'Dívidas / Investimentos', percentual: 20 },
];

function dataHoje() {
  const agora = new Date();
  return `${agora.getFullYear()}-${String(agora.getMonth() + 1).padStart(2, '0')}-${String(agora.getDate()).padStart(2, '0')}`;
}

function dinheiro(valor) {
  return `R$ ${Number(valor || 0).toFixed(2).replace('.', ',')}`;
}

function formatarData(data) {
  const [ano, mes, dia] = data.split('-');
  return `${dia}/${mes}/${ano}`;
}

function textoProjecao(pote, diasNoMes) {
  if (pote.estourado || pote.gastoAtual >= pote.limite) {
    return 'Teto já excedido neste mês.';
  }

  if (!pote.burnRateDiario) {
    return 'Sem projeção — nenhum gasto registrado.';
  }

  if (!pote.projecaoDia || pote.projecaoDia > diasNoMes) {
    return 'No ritmo atual, este pote não se esgota neste mês.';
  }

  return `No ritmo atual, este pote se esgota no dia ${pote.projecaoDia}.`;
}

function BarraPote({ pote }) {
  const cor = CORES_STATUS[pote.statusAlerta] || CORES_STATUS.normal;
  const percentual = Number(pote.percentualVisual || 0);

  return (
    <View style={styles.card}>
      <View style={styles.cabecalhoPote}>
        <View style={styles.nomeArea}>
          <Text style={styles.nome}>{pote.nome}</Text>
          <Text style={styles.percentualOrcamento}>{pote.percentualOrcamento}% do salário</Text>
        </View>
        <View style={[styles.statusBadge, { borderColor: cor }]}>
          <Text style={[styles.statusText, { color: cor }]}>
            {pote.statusAlerta === 'estourado' ? 'ESTOURADO' : pote.statusAlerta === 'atencao' ? 'ATENÇÃO' : 'OK'}
          </Text>
        </View>
      </View>

      <Text style={styles.valores}>
        {dinheiro(pote.gastoAtual)} / {dinheiro(pote.limite)}
      </Text>

      <View style={styles.barraFundo}>
        <View
          style={[
            styles.barraPreenchida,
            { width: `${percentual}%`, backgroundColor: cor },
          ]}
        />
      </View>

      <View style={styles.linhaInfo}>
        <Text style={styles.info}>{Number(pote.percentualTeto || 0).toFixed(0)}% consumido</Text>
        <Text style={styles.info}>Saldo: {dinheiro(Math.max(pote.saldo, 0))}</Text>
      </View>

      <Text style={styles.burnRate}>
        Burn rate: {dinheiro(pote.burnRateDiario)}/dia
      </Text>
      <Text style={[styles.projecao, pote.statusAlerta !== 'normal' && { color: cor }]}>
        {textoProjecao(pote, pote.__diasNoMes || 31)}
      </Text>
    </View>
  );
}

export default function Pots() {
  const {
    dados,
    pots,
    carregando,
    salvando,
    erro,
    recarregar,
    adicionarLancamento,
    removerLancamento,
  } = usePotsController();

  const [modalAberto, setModalAberto] = useState(false);
  const [categoria, setCategoria] = useState('sobrevivencia');
  const [valor, setValor] = useState('');
  const [descricao, setDescricao] = useState('');
  const [data, setData] = useState(dataHoje());
  const [valorCompra, setValorCompra] = useState('');
  const [categoriaCompra, setCategoriaCompra] = useState('estiloVida');
  const [resultadoCompra, setResultadoCompra] = useState(null);
  const [verificandoCompra, setVerificandoCompra] = useState(false);
  const [erroCompra, setErroCompra] = useState('');

  const transacoes = useMemo(() => {
    return pots
      .flatMap((pote) => (pote.transacoes || []).map((transacao) => ({
        ...transacao,
        categoriaNome: pote.nome,
      })))
      .sort((a, b) => b.data.localeCompare(a.data) || b.id - a.id);
  }, [pots]);

  const fecharModal = () => {
    if (salvando) return;
    setModalAberto(false);
    setValor('');
    setDescricao('');
    setData(dataHoje());
  };

  const salvar = async () => {
    if (!valor || Number(valor.replace(',', '.')) <= 0) {
      Alert.alert('Valor inválido', 'Informe um valor maior que zero.');
      return;
    }

    if (!descricao.trim()) {
      Alert.alert('Descrição obrigatória', 'Informe o que foi gasto.');
      return;
    }

    try {
      await adicionarLancamento({
        categoria,
        valor: Number(valor.replace(',', '.')),
        descricao: descricao.trim(),
        data,
      });
      fecharModal();
    } catch (error) {
      Alert.alert('Não foi possível salvar', error.message);
    }
  };

  const verificarCompra = async () => {
    const valorNumerico = Number(String(valorCompra).replace(',', '.'));
    if (!Number.isFinite(valorNumerico) || valorNumerico <= 0) {
      setErroCompra('Informe um valor maior que zero.');
      setResultadoCompra(null);
      return;
    }

    setVerificandoCompra(true);
    setErroCompra('');
    setResultadoCompra(null);
    try {
      const resultado = await checkPurchaseBudgetImpact(valorNumerico, categoriaCompra);
      setResultadoCompra(resultado);
    } catch (error) {
      setErroCompra(error.message || 'Não foi possível simular esta compra.');
    } finally {
      setVerificandoCompra(false);
    }
  };

  const excluir = (transacao) => {
    Alert.alert(
      'Excluir lançamento',
      `Remover "${transacao.descricao}" de ${dinheiro(transacao.valor)}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: async () => {
            try {
              await removerLancamento(transacao.id);
            } catch (error) {
              Alert.alert('Não foi possível excluir', error.message);
            }
          },
        },
      ]
    );
  };

  if (carregando && !pots.length) {
    return (
      <View style={styles.mensagemContainer}>
        <ActivityIndicator size="large" color="#38bdf8" />
        <Text style={styles.mensagem}>Carregando orçamento...</Text>
      </View>
    );
  }

  if (erro && !pots.length) {
    return (
      <View style={styles.mensagemContainer}>
        <Text style={[styles.mensagem, styles.erro]}>Erro: {erro}</Text>
        <TouchableOpacity style={styles.botaoRetry} onPress={() => recarregar()}>
          <Text style={styles.botaoTexto}>Tentar novamente</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const potsComDias = pots.map((pote) => ({ ...pote, __diasNoMes: dados?.diasNoMes }));

  return (
    <View style={styles.container}>
      <View style={styles.resumoHeader}>
        <View>
          <Text style={styles.titulo}>Orçamento mensal</Text>
          <Text style={styles.subtitulo}>
            Salário: {dinheiro(dados?.salario)} · {dados?.diasDecorridos}/{dados?.diasNoMes} dias
          </Text>
        </View>
        <TouchableOpacity style={styles.botaoAdicionar} onPress={() => setModalAberto(true)}>
          <Text style={styles.botaoAdicionarTexto}>+ Lançar gasto</Text>
        </TouchableOpacity>
      </View>

      {erro ? <Text style={styles.erroInline}>{erro}</Text> : null}

      {potsComDias.map((pote) => <BarraPote key={pote.chave} pote={pote} />)}

      <View style={styles.simuladorCard}>
        <Text style={styles.simuladorTitulo}>🛍️ Posso Comprar?</Text>
        <Text style={styles.simuladorSubtitulo}>
          Simule uma compra antes de gastar e veja o impacto no teto 50-30-20.
        </Text>

        <Text style={styles.label}>Valor da compra (R$)</Text>
        <TextInput
          style={styles.input}
          placeholder="Ex.: 249,90"
          placeholderTextColor="#64748b"
          keyboardType="decimal-pad"
          value={valorCompra}
          onChangeText={(texto) => {
            setValorCompra(texto);
            setResultadoCompra(null);
            setErroCompra('');
          }}
        />

        <Text style={styles.label}>Categoria do gasto</Text>
        <View style={styles.categorias}>
          {CATEGORIAS.map((item) => (
            <Pressable
              key={`compra-${item.chave}`}
              style={[
                styles.categoriaBotao,
                categoriaCompra === item.chave && styles.categoriaSelecionada,
              ]}
              onPress={() => {
                setCategoriaCompra(item.chave);
                setResultadoCompra(null);
                setErroCompra('');
              }}
            >
              <Text style={[
                styles.categoriaTexto,
                categoriaCompra === item.chave && styles.categoriaTextoSelecionado,
              ]}>
                {item.percentual}% · {item.nome}
              </Text>
            </Pressable>
          ))}
        </View>

        {erroCompra ? <Text style={styles.erroInline}>{erroCompra}</Text> : null}

        <TouchableOpacity
          style={[styles.botaoSalvar, verificandoCompra && styles.botaoDesabilitado]}
          onPress={verificarCompra}
          disabled={verificandoCompra}
        >
          {verificandoCompra
            ? <ActivityIndicator color="#fff" />
            : <Text style={styles.botaoSalvarTexto}>Verificar impacto</Text>}
        </TouchableOpacity>

        {resultadoCompra ? (
          <View style={[
            styles.resultadoCompra,
            resultadoCompra.status === 'liberada' ? styles.resultadoVerde
              : resultadoCompra.status === 'atencao' ? styles.resultadoAmarelo
                : styles.resultadoVermelho,
          ]}>
            <Text style={styles.parecerCompra}>{resultadoCompra.parecer}</Text>
            <Text style={styles.mensagemCompra}>{resultadoCompra.mensagem}</Text>
            <View style={styles.resumoCompraLinha}>
              <View style={styles.resumoCompraItem}>
                <Text style={styles.resumoCompraLabel}>Saldo atual</Text>
                <Text style={styles.resumoCompraValor}>{dinheiro(resultadoCompra.saldoAtual)}</Text>
              </View>
              <View style={styles.resumoCompraItem}>
                <Text style={styles.resumoCompraLabel}>Após a compra</Text>
                <Text style={styles.resumoCompraValor}>{dinheiro(resultadoCompra.saldoProjetado)}</Text>
              </View>
            </View>

            <Text style={styles.comparativoTitulo}>Potes: antes × depois</Text>
            {resultadoCompra.pots.map((pote) => {
              const antes = pote.limite > 0
                ? Math.min(Math.max((pote.gastoAtual / pote.limite) * 100, 0), 100)
                : 0;
              const depois = Number(pote.percentualVisualProjetado || 0);
              const corDepois = pote.percentualProjetado > 100
                ? CORES_STATUS.estourado
                : pote.percentualProjetado >= 90
                  ? '#f59e0b'
                  : CORES_STATUS.normal;
              return (
                <View key={`comparativo-${pote.chave}`} style={styles.comparativoPote}>
                  <View style={styles.comparativoCabecalho}>
                    <Text style={styles.comparativoNome}>{pote.nome}</Text>
                    <Text style={styles.comparativoPercentual}>
                      {antes.toFixed(0)}% → {pote.percentualProjetado.toFixed(0)}%
                    </Text>
                  </View>
                  <View style={styles.barraComparativaFundo}>
                    <View style={[styles.barraComparativa, { width: `${antes}%`, backgroundColor: '#64748b' }]} />
                  </View>
                  <View style={[styles.barraComparativaFundo, styles.barraDepoisFundo]}>
                    <View style={[styles.barraComparativa, { width: `${depois}%`, backgroundColor: corDepois }]} />
                  </View>
                  <Text style={styles.comparativoSaldo}>
                    Saldo após: {dinheiro(pote.saldoProjetado)}
                  </Text>
                </View>
              );
            })}
            <Text style={styles.legendaComparativo}>Cinza: situação atual · Colorido: projeção após a compra</Text>
          </View>
        ) : null}
      </View>

      <View style={styles.extratoCard}>
        <View style={styles.extratoHeader}>
          <View>
            <Text style={styles.extratoTitulo}>Extrato do mês</Text>
            <Text style={styles.extratoSubtitulo}>{transacoes.length} lançamento(s) · {dinheiro(dados?.totalGasto)}</Text>
          </View>
          <TouchableOpacity onPress={() => recarregar()} disabled={carregando}>
            <Text style={styles.atualizarTexto}>{carregando ? '...' : 'Atualizar'}</Text>
          </TouchableOpacity>
        </View>

        {!transacoes.length ? (
          <Text style={styles.vazio}>Nenhum lançamento registrado neste mês.</Text>
        ) : (
          transacoes.map((transacao) => (
            <View key={transacao.id} style={styles.transacao}>
              <View style={styles.transacaoInfo}>
                <Text style={styles.transacaoDescricao}>{transacao.descricao}</Text>
                <Text style={styles.transacaoMeta}>
                  {formatarData(transacao.data)} · {transacao.categoriaNome}
                </Text>
              </View>
              <View style={styles.transacaoAcao}>
                <Text style={styles.transacaoValor}>{dinheiro(transacao.valor)}</Text>
                <TouchableOpacity onPress={() => excluir(transacao)} disabled={salvando}>
                  <Text style={styles.excluir}>Excluir</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </View>

      <Modal visible={modalAberto} animationType="slide" transparent onRequestClose={fecharModal}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitulo}>Novo lançamento</Text>
                <Text style={styles.modalSubtitulo}>Adicione uma despesa ao pote correspondente.</Text>
              </View>
              <TouchableOpacity onPress={fecharModal} disabled={salvando}>
                <Text style={styles.fechar}>✕</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.label}>Pote</Text>
            <View style={styles.categorias}>
              {CATEGORIAS.map((item) => (
                <Pressable
                  key={item.chave}
                  style={[styles.categoriaBotao, categoria === item.chave && styles.categoriaSelecionada]}
                  onPress={() => setCategoria(item.chave)}
                >
                  <Text style={[styles.categoriaTexto, categoria === item.chave && styles.categoriaTextoSelecionado]}>
                    {item.percentual}% · {item.nome}
                  </Text>
                </Pressable>
              ))}
            </View>

            <Text style={styles.label}>Valor</Text>
            <TextInput
              style={styles.input}
              placeholder="0,00"
              placeholderTextColor="#64748b"
              keyboardType="decimal-pad"
              value={valor}
              onChangeText={setValor}
            />

            <Text style={styles.label}>Descrição</Text>
            <TextInput
              style={styles.input}
              placeholder="Ex.: supermercado, transporte..."
              placeholderTextColor="#64748b"
              value={descricao}
              onChangeText={setDescricao}
              maxLength={80}
            />

            <Text style={styles.label}>Data</Text>
            <TextInput
              style={styles.input}
              placeholder="AAAA-MM-DD"
              placeholderTextColor="#64748b"
              value={data}
              onChangeText={setData}
              maxLength={10}
            />

            <TouchableOpacity style={styles.botaoSalvar} onPress={salvar} disabled={salvando}>
              {salvando ? <ActivityIndicator color="#fff" /> : <Text style={styles.botaoSalvarTexto}>Salvar lançamento</Text>}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { paddingBottom: 24 },
  resumoHeader: { flexDirection: 'row', justifyContent: 'space-between', gap: 12, marginBottom: 14, alignItems: 'center' },
  titulo: { color: '#f8fafc', fontSize: 20, fontWeight: '800' },
  subtitulo: { color: '#94a3b8', marginTop: 3, fontSize: 12 },
  botaoAdicionar: { backgroundColor: '#0284c7', paddingHorizontal: 13, paddingVertical: 10, borderRadius: 10 },
  botaoAdicionarTexto: { color: '#fff', fontWeight: '800', fontSize: 12 },
  card: { backgroundColor: '#1e293b', padding: 16, borderRadius: 14, marginBottom: 12, borderWidth: 1, borderColor: '#334155' },
  cabecalhoPote: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  nomeArea: { flex: 1, paddingRight: 8 },
  nome: { color: '#f8fafc', fontSize: 16, fontWeight: '800' },
  percentualOrcamento: { color: '#64748b', fontSize: 11, marginTop: 2 },
  statusBadge: { borderWidth: 1, borderRadius: 20, paddingHorizontal: 8, paddingVertical: 4 },
  statusText: { fontSize: 9, fontWeight: '900' },
  valores: { color: '#cbd5e1', fontSize: 13, marginTop: 13, marginBottom: 8 },
  barraFundo: { height: 11, backgroundColor: '#334155', borderRadius: 6, overflow: 'hidden' },
  barraPreenchida: { height: '100%', borderRadius: 6 },
  linhaInfo: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 7 },
  info: { color: '#94a3b8', fontSize: 11 },
  burnRate: { color: '#cbd5e1', fontSize: 12, marginTop: 12 },
  projecao: { color: '#38bdf8', fontSize: 12, fontWeight: '700', marginTop: 4 },
  extratoCard: { backgroundColor: '#1e293b', padding: 16, borderRadius: 14, borderWidth: 1, borderColor: '#334155', marginTop: 2 },
  extratoHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  extratoTitulo: { color: '#f8fafc', fontSize: 17, fontWeight: '800' },
  extratoSubtitulo: { color: '#64748b', marginTop: 2, fontSize: 11 },
  atualizarTexto: { color: '#38bdf8', fontSize: 12, fontWeight: '700' },
  vazio: { color: '#64748b', textAlign: 'center', paddingVertical: 18 },
  transacao: { flexDirection: 'row', justifyContent: 'space-between', gap: 10, borderTopWidth: 1, borderTopColor: '#334155', paddingVertical: 12 },
  transacaoInfo: { flex: 1 },
  transacaoDescricao: { color: '#f8fafc', fontWeight: '700', fontSize: 13 },
  transacaoMeta: { color: '#64748b', fontSize: 10, marginTop: 3 },
  transacaoAcao: { alignItems: 'flex-end' },
  transacaoValor: { color: '#f8fafc', fontWeight: '800', fontSize: 12 },
  excluir: { color: '#f87171', marginTop: 3, fontSize: 10, fontWeight: '700' },
  mensagemContainer: { alignItems: 'center', justifyContent: 'center', paddingVertical: 28 },
  mensagem: { color: '#f8fafc', marginTop: 10, textAlign: 'center' },
  erro: { color: '#f87171' },
  erroInline: { color: '#f87171', fontSize: 11, marginBottom: 10 },
  botaoRetry: { backgroundColor: '#0284c7', padding: 12, borderRadius: 8, marginTop: 10 },
  botaoTexto: { color: '#fff', fontWeight: '600' },
  simuladorCard: { backgroundColor: '#0f172a', padding: 16, borderRadius: 16, borderWidth: 1, borderColor: '#334155', marginTop: 4, marginBottom: 14 },
  simuladorTitulo: { color: '#f8fafc', fontSize: 19, fontWeight: '900' },
  simuladorSubtitulo: { color: '#94a3b8', fontSize: 12, lineHeight: 18, marginTop: 5 },
  botaoDesabilitado: { opacity: 0.65 },
  resultadoCompra: { borderWidth: 1, borderRadius: 12, padding: 13, marginTop: 16 },
  resultadoVerde: { backgroundColor: '#052e16', borderColor: '#22c55e' },
  resultadoAmarelo: { backgroundColor: '#422006', borderColor: '#f59e0b' },
  resultadoVermelho: { backgroundColor: '#450a0a', borderColor: '#ef4444' },
  parecerCompra: { color: '#f8fafc', fontSize: 15, fontWeight: '900' },
  mensagemCompra: { color: '#e2e8f0', fontSize: 12, lineHeight: 18, marginTop: 6 },
  resumoCompraLinha: { flexDirection: 'row', gap: 12, marginTop: 14, marginBottom: 8 },
  resumoCompraItem: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.45)', borderRadius: 8, padding: 10 },
  resumoCompraLabel: { color: '#cbd5e1', fontSize: 10 },
  resumoCompraValor: { color: '#fff', fontSize: 14, fontWeight: '800', marginTop: 4 },
  comparativoTitulo: { color: '#f8fafc', fontSize: 13, fontWeight: '800', marginTop: 12, marginBottom: 10 },
  comparativoPote: { marginBottom: 12 },
  comparativoCabecalho: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5, gap: 8 },
  comparativoNome: { color: '#e2e8f0', fontSize: 11, fontWeight: '700', flex: 1 },
  comparativoPercentual: { color: '#cbd5e1', fontSize: 10, fontWeight: '800' },
  barraComparativaFundo: { height: 8, backgroundColor: '#1e293b', borderRadius: 5, overflow: 'hidden' },
  barraDepoisFundo: { marginTop: 4 },
  barraComparativa: { height: '100%', borderRadius: 5 },
  comparativoSaldo: { color: '#94a3b8', fontSize: 10, marginTop: 4 },
  legendaComparativo: { color: '#64748b', fontSize: 10, marginTop: 2 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(2, 6, 23, 0.75)', justifyContent: 'flex-end' },
  modalCard: { backgroundColor: '#0f172a', borderTopLeftRadius: 22, borderTopRightRadius: 22, padding: 20, borderWidth: 1, borderColor: '#334155' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 18 },
  modalTitulo: { color: '#f8fafc', fontSize: 20, fontWeight: '800' },
  modalSubtitulo: { color: '#94a3b8', fontSize: 12, marginTop: 4, paddingRight: 20 },
  fechar: { color: '#94a3b8', fontSize: 22 },
  label: { color: '#cbd5e1', fontSize: 12, fontWeight: '700', marginBottom: 7, marginTop: 9 },
  categorias: { gap: 8 },
  categoriaBotao: { backgroundColor: '#1e293b', borderWidth: 1, borderColor: '#334155', padding: 11, borderRadius: 10 },
  categoriaSelecionada: { borderColor: '#38bdf8', backgroundColor: '#082f49' },
  categoriaTexto: { color: '#94a3b8', fontSize: 12, fontWeight: '700' },
  categoriaTextoSelecionado: { color: '#e0f2fe' },
  input: { backgroundColor: '#1e293b', borderWidth: 1, borderColor: '#334155', borderRadius: 10, color: '#f8fafc', paddingHorizontal: 12, paddingVertical: 11 },
  botaoSalvar: { backgroundColor: '#0284c7', borderRadius: 11, paddingVertical: 13, alignItems: 'center', marginTop: 18 },
  botaoSalvarTexto: { color: '#fff', fontWeight: '800' },
});
