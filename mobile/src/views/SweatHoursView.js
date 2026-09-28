import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView
} from 'react-native';
import {
  simularHorasSuor,
  getSimulationHistory,
  deleteSimulation,
  updateSimulationStatus,
  getHealthScore
} from '../services/api';

const QUICK_TAGS = [
  { label: 'iPhone 15', item: 'iPhone 15 128GB', preco: '4199', categoria: 'Eletronicos' },
  { label: 'Notebook Dell', item: 'Notebook Dell Inspiron', preco: '2899', categoria: 'Informatica' },
  { label: 'Tenis Nike', item: 'Tenis Nike Air Max', preco: '329', categoria: 'Vestuario' },
  { label: 'Air Fryer', item: 'Fritadeira Air Fryer', preco: '199', categoria: 'Casa' },
  { label: 'Smart TV', item: 'Smart TV LG 50', preco: '1999', categoria: 'Eletronicos' },
  { label: 'Lanche', item: 'Combo Fast Food', preco: '45', categoria: 'Alimentacao' }
];

const CATEGORIAS = ['Eletronicos', 'Vestuario', 'Alimentacao', 'Lazer', 'Casa', 'Outros'];

export default function SweatHoursView({ perfil, onBuscarOferta, onMandarCooldown }) {
  const [item, setItem] = useState('');
  const [preco, setPreco] = useState('');
  const [categoria, setCategoria] = useState('Eletronicos');
  const [resultado, setResultado] = useState(null);
  const [loading, setLoading] = useState(false);
  const [historico, setHistorico] = useState([]);
  const [healthScoreData, setHealthScoreData] = useState(null);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [decisaoTomada, setDecisaoTomada] = useState(null);

  const valorHora = Number(perfil?.valorHora) || 21.88;

  useEffect(() => {
    carregarDados();
  }, []);

  const carregarDados = async () => {
    setLoadingHistory(true);
    try {
      const [histData, scoreData] = await Promise.all([
        getSimulationHistory(),
        getHealthScore()
      ]);
      setHistorico(Array.isArray(histData) ? histData : []);
      setHealthScoreData(scoreData);
    } catch (e) {
      setHistorico([]);
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleSimular = async () => {
    if (!item.trim() || !preco) return;
    setLoading(true);
    setResultado(null);
    setDecisaoTomada(null);
    try {
      const res = await simularHorasSuor(item, preco, categoria, valorHora);
      setResultado(res);
      if (res?.simulacao) {
        setHistorico(prev => {
          const semEsse = prev.filter(p => p.id !== res.simulacao.id);
          return [res.simulacao, ...semEsse];
        });
      }
      getHealthScore().then(setHealthScoreData).catch(() => {});
    } catch (error) {
      
    } finally {
      setLoading(false);
    }
  };

  const handleQuickTag = (tag) => {
    setItem(tag.item);
    setPreco(tag.preco);
    if (tag.categoria) {
      setCategoria(tag.categoria);
    }
  };

  const handleDeleteItem = async (id) => {
    try {
      await deleteSimulation(id);
      setHistorico(prev => prev.filter(h => h.id !== id));
      getHealthScore().then(setHealthScoreData).catch(() => {});
    } catch (e) {}
  };

  const handleAcaoCooldown = async () => {
    const simAtual = resultado?.simulacao || resultado;
    const simId = simAtual?.id;
    setDecisaoTomada('cooldown');

    if (simId) {
      setHistorico(prev => prev.map(h => h.id === simId ? { ...h, status: 'cooldown' } : h));
      updateSimulationStatus(simId, 'cooldown').catch(() => {});
    }

    if (onMandarCooldown) {
      onMandarCooldown(item, preco);
    }
  };

  const handleAcaoComparador = () => {
    if (onBuscarOferta) {
      onBuscarOferta(item);
    }
  };

  const handleDesistirCompra = async () => {
    const simAtual = resultado?.simulacao || resultado;
    const simId = simAtual?.id;
    const horasPoupadasItem = Number(simAtual?.horasSuor) || 0;
    const precoItem = Number(simAtual?.preco || preco) || 0;

    setDecisaoTomada('desistiu');

    if (simId) {
      setHistorico(prev => prev.map(h => h.id === simId ? { ...h, status: 'desistiu' } : h));
      updateSimulationStatus(simId, 'desistiu').catch(() => {});
    }

    setHealthScoreData(prev => {
      const scoreAtual = prev?.score || 72;
      const novoScore = Math.min(100, scoreAtual + 8);
      const horasAtuais = Number(prev?.horasPoupadas) || 0;
      const dinheiroAtual = Number(prev?.dinheiroPoupado) || 0;

      let novaClassificacao = 'Bom';
      if (novoScore >= 85) novaClassificacao = 'Excelente';
      else if (novoScore >= 70) novaClassificacao = 'Bom';
      else if (novoScore >= 50) novaClassificacao = 'Em Atencao';
      else novaClassificacao = 'Critico';

      return {
        ...prev,
        score: novoScore,
        classificacao: novaClassificacao,
        horasPoupadas: Number((horasAtuais + horasPoupadasItem).toFixed(1)),
        dinheiroPoupado: Number((dinheiroAtual + precoItem).toFixed(2))
      };
    });
  };

  const sim = resultado?.simulacao || resultado;
  const score = healthScoreData?.score || 72;
  const classificacao = healthScoreData?.classificacao || 'Bom';

  return (
    <View style={styles.container}>
      <View style={styles.healthScoreCard}>
        <View style={styles.scoreHeader}>
          <View>
            <Text style={styles.scoreTag}>Central de Inteligencia Financeira</Text>
            <Text style={styles.scoreTitle}>Financial Health Score</Text>
          </View>
          <View style={[
            styles.scoreBadge,
            score >= 80 ? styles.scoreBadgeGreen : score >= 60 ? styles.scoreBadgeBlue : styles.scoreBadgeAmber
          ]}>
            <Text style={styles.scoreBadgeNumber}>{score}</Text>
            <Text style={styles.scoreBadgeMax}>/100</Text>
          </View>
        </View>

        <View style={styles.scoreBarBackground}>
          <View style={[
            styles.scoreBarFill,
            { width: score + '%' },
            score >= 80 ? { backgroundColor: '#10b981' } : score >= 60 ? { backgroundColor: '#38bdf8' } : { backgroundColor: '#f59e0b' }
          ]} />
        </View>

        <View style={styles.metricsRow}>
          <View style={styles.metricItem}>
            <Text style={styles.metricLabel}>Classificacao</Text>
            <Text style={styles.metricValue}>{classificacao}</Text>
          </View>
          <View style={styles.metricItem}>
            <Text style={styles.metricLabel}>Horas Simuladas</Text>
            <Text style={styles.metricValue}>{healthScoreData?.totalHorasSimuladas || 0}h</Text>
          </View>
          <View style={styles.metricItem}>
            <Text style={styles.metricLabel}>Horas Poupadas</Text>
            <Text style={[styles.metricValue, { color: '#10b981' }]}>{healthScoreData?.horasPoupadas || 0}h</Text>
          </View>
        </View>

        {healthScoreData?.dicas && healthScoreData.dicas.length > 0 ? (
          <View style={styles.dicaBox}>
            <Text style={styles.dicaLabel}>Recomendacao do Sistema:</Text>
            <Text style={styles.dicaText}>{healthScoreData.dicas[0]}</Text>
          </View>
        ) : null}
      </View>

      <View style={styles.card}>
        <Text style={styles.title}>Conversor de Horas de Suor</Text>
        <Text style={styles.subtitle}>
          Descubra quanto tempo da sua jornada de trabalho voce vai gastar para pagar cada item.
        </Text>

        <Text style={styles.sectionTitle}>Sugestoes Rapidas:</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tagsContainer}>
          {QUICK_TAGS.map((tag, idx) => (
            <TouchableOpacity key={idx} style={styles.tagButton} onPress={() => handleQuickTag(tag)}>
              <Text style={styles.tagText}>{tag.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <Text style={styles.label}>O que voce quer comprar?</Text>
        <TextInput
          style={styles.input}
          value={item}
          onChangeText={setItem}
          placeholder="Ex: Smartphone / Tenis / Notebook"
          placeholderTextColor="#64748b"
        />

        <Text style={styles.label}>Categoria do Gasto:</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.catContainer}>
          {CATEGORIAS.map((cat) => (
            <TouchableOpacity
              key={cat}
              style={[styles.catChip, categoria === cat && styles.catChipActive]}
              onPress={() => setCategoria(cat)}
            >
              <Text style={[styles.catChipText, categoria === cat && styles.catChipTextActive]}>
                {cat}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <Text style={styles.label}>Preco do Item (R$):</Text>
        <TextInput
          style={styles.input}
          keyboardType="numeric"
          value={preco}
          onChangeText={setPreco}
          placeholder="Ex: 1200"
          placeholderTextColor="#64748b"
        />

        <TouchableOpacity 
          style={[styles.button, (!item.trim() || !preco) && styles.buttonDisabled]} 
          onPress={handleSimular}
          disabled={!item.trim() || !preco || loading}
        >
          {loading ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <Text style={styles.buttonText}>Calcular Horas de Suor</Text>
          )}
        </TouchableOpacity>

        {resultado && sim && sim.horasSuor !== undefined && (
          <View style={styles.resultBox}>
            <Text style={styles.resultTitle}>Impacto Real no seu Trabalho:</Text>
            <Text style={styles.resultBig}>{sim.horasSuor} Horas</Text>
            <Text style={styles.resultDays}>Equivalente a {sim.diasTrabalho} dias uteis de trabalho</Text>
            
            {sim.percentualSalario !== undefined && (
              <View style={styles.percentualContainer}>
                <Text style={styles.percentualText}>Consome {sim.percentualSalario}% do seu salario mensal</Text>
                <View style={styles.progressBarBg}>
                  <View style={[
                    styles.progressBarFill, 
                    { width: Math.min(Number(sim.percentualSalario) || 0, 100) + '%' },
                    sim.percentualSalario > 30 ? { backgroundColor: '#ef4444' } : 
                    sim.percentualSalario > 10 ? { backgroundColor: '#f59e0b' } : { backgroundColor: '#10b981' }
                  ]} />
                </View>
              </View>
            )}

            <View style={styles.provocacaoBox}>
              <Text style={styles.provocacaoText}>{resultado.mensagem}</Text>
            </View>

            {decisaoTomada === 'desistiu' ? (
              <View style={styles.savedBanner}>
                <Text style={styles.savedBannerTitle}>Decisao Inteligente Registrada!</Text>
                <Text style={styles.savedBannerText}>
                  Voce evitou gastar {sim.horasSuor}h de trabalho e manteve R$ {Number(sim.preco).toFixed(2)} no seu bolso.
                </Text>
                <Text style={styles.savedBannerScore}>
                  +8 pontos adicionados ao seu Financial Health Score!
                </Text>
              </View>
            ) : null}

            {decisaoTomada === 'cooldown' ? (
              <View style={styles.cooldownBanner}>
                <Text style={styles.cooldownBannerTitle}>Item em Quarentena de 48h</Text>
                <Text style={styles.cooldownBannerText}>
                  Desejo enviado para a trava de reflexao. Aguarde 48h para avaliar a real necessidade.
                </Text>
              </View>
            ) : null}

            <View style={styles.actionsContainer}>
              <Text style={styles.actionsHeader}>Acoes Recomendadas:</Text>
              
              <TouchableOpacity
                style={[styles.actionBtnCooldown, decisaoTomada === 'cooldown' && styles.actionBtnActive]}
                onPress={handleAcaoCooldown}
              >
                <Text style={styles.actionBtnText}>
                  {decisaoTomada === 'cooldown' ? 'Item em Cooldown 48h' : 'Colocar no Cooldown 48h'}
                </Text>
              </TouchableOpacity>

              {onBuscarOferta ? (
                <TouchableOpacity style={styles.actionBtnCompare} onPress={handleAcaoComparador}>
                  <Text style={styles.actionBtnTextCompare}>Buscar Menor Preco no Comparador</Text>
                </TouchableOpacity>
              ) : null}

              {decisaoTomada === 'desistiu' ? (
                <View style={styles.actionBtnDone}>
                  <Text style={styles.actionBtnDoneText}>Compra Cancelada (+{sim.horasSuor}h Salvas)</Text>
                </View>
              ) : (
                <TouchableOpacity style={styles.actionBtnSave} onPress={handleDesistirCompra}>
                  <Text style={styles.actionBtnTextSave}>Desisti da Compra (Poupe Horas)</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}
      </View>

      <View style={styles.historySection}>
        <View style={styles.historyHeader}>
          <Text style={styles.historyTitle}>Historico de Simulacoes Recentes</Text>
          <Text style={styles.historyCount}>{historico.length} itens</Text>
        </View>

        {loadingHistory ? (
          <ActivityIndicator size="small" color="#38bdf8" style={{ marginVertical: 14 }} />
        ) : null}

        {!loadingHistory && historico.length === 0 ? (
          <View style={styles.emptyHistory}>
            <Text style={styles.emptyHistoryText}>Nenhuma simulacao realizada ainda.</Text>
          </View>
        ) : null}

        {!loadingHistory && historico.map((hItem) => (
          <View key={hItem.id} style={styles.historyCard}>
            <View style={styles.historyCardLeft}>
              <View style={styles.historyTagRow}>
                <Text style={styles.historyCategoryBadge}>{hItem.categoria || 'Geral'}</Text>
                {hItem.status === 'cooldown' ? (
                  <Text style={styles.statusBadgeCooldown}>Em Cooldown</Text>
                ) : hItem.status === 'desistiu' ? (
                  <Text style={styles.statusBadgeSaved}>Poupado</Text>
                ) : null}
              </View>
              <Text style={styles.historyItemName}>{hItem.item}</Text>
              <Text style={styles.historyItemPrice}>R$ {Number(hItem.preco).toFixed(2)}</Text>
            </View>

            <View style={styles.historyCardRight}>
              <Text style={styles.historyHoursBig}>{hItem.horasSuor}h</Text>
              <Text style={styles.historyDaysSmall}>{hItem.diasTrabalho}d de trabalho</Text>
              <TouchableOpacity
                style={styles.historyDeleteBtn}
                onPress={() => handleDeleteItem(hItem.id)}
              >
                <Text style={styles.historyDeleteText}>Excluir</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { paddingBottom: 40 },
  healthScoreCard: {
    backgroundColor: '#0f172a',
    borderRadius: 16,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#38bdf8',
    elevation: 3
  },
  scoreHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  scoreTag: { fontSize: 11, fontWeight: 'bold', color: '#38bdf8', textTransform: 'uppercase', letterSpacing: 0.5 },
  scoreTitle: { fontSize: 18, fontWeight: 'bold', color: '#f8fafc', marginTop: 2 },
  scoreBadge: { flexDirection: 'row', alignItems: 'baseline', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  scoreBadgeGreen: { backgroundColor: 'rgba(16, 185, 129, 0.2)' },
  scoreBadgeBlue: { backgroundColor: 'rgba(56, 189, 248, 0.2)' },
  scoreBadgeAmber: { backgroundColor: 'rgba(245, 158, 11, 0.2)' },
  scoreBadgeNumber: { fontSize: 24, fontWeight: 'bold', color: '#ffffff' },
  scoreBadgeMax: { fontSize: 12, fontWeight: 'bold', color: '#94a3b8', marginLeft: 2 },
  scoreBarBackground: { height: 8, backgroundColor: '#1e293b', borderRadius: 4, overflow: 'hidden', marginBottom: 14 },
  scoreBarFill: { height: '100%', borderRadius: 4 },
  metricsRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderTopWidth: 1, borderTopColor: '#1e293b' },
  metricItem: { alignItems: 'center' },
  metricLabel: { fontSize: 11, color: '#94a3b8', marginBottom: 2 },
  metricValue: { fontSize: 14, fontWeight: 'bold', color: '#f8fafc' },
  dicaBox: { backgroundColor: '#1e293b', padding: 10, borderRadius: 8, marginTop: 10 },
  dicaLabel: { fontSize: 11, fontWeight: 'bold', color: '#38bdf8', textTransform: 'uppercase' },
  dicaText: { fontSize: 12, color: '#cbd5e1', marginTop: 2, lineHeight: 16 },
  card: { backgroundColor: '#1e293b', borderRadius: 16, padding: 20, marginBottom: 16, borderLeftWidth: 4, borderLeftColor: '#f59e0b' },
  title: { fontSize: 22, fontWeight: 'bold', color: '#f8fafc', marginBottom: 4 },
  subtitle: { fontSize: 13, color: '#94a3b8', marginBottom: 14, lineHeight: 18 },
  sectionTitle: { fontSize: 12, color: '#cbd5e1', marginBottom: 8, fontWeight: '600' },
  tagsContainer: { flexDirection: 'row', marginBottom: 16 },
  tagButton: { backgroundColor: '#334155', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, marginRight: 8, borderWidth: 1, borderColor: '#475569' },
  tagText: { color: '#e2e8f0', fontSize: 12, fontWeight: '500' },
  catContainer: { flexDirection: 'row', marginBottom: 14 },
  catChip: { backgroundColor: '#0f172a', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, marginRight: 6, borderWidth: 1, borderColor: '#334155' },
  catChipActive: { backgroundColor: '#0284c7', borderColor: '#38bdf8' },
  catChipText: { color: '#94a3b8', fontSize: 12 },
  catChipTextActive: { color: '#ffffff', fontWeight: 'bold' },
  label: { fontSize: 13, color: '#e2e8f0', marginBottom: 6, fontWeight: '600' },
  input: { backgroundColor: '#0f172a', borderColor: '#334155', borderWidth: 1, borderRadius: 10, padding: 12, color: '#ffffff', fontSize: 15, marginBottom: 14 },
  button: { backgroundColor: '#d97706', padding: 14, borderRadius: 10, alignItems: 'center', marginTop: 4 },
  buttonDisabled: { backgroundColor: '#64748b' },
  buttonText: { color: '#ffffff', fontWeight: 'bold', fontSize: 15 },
  resultBox: { backgroundColor: '#451a03', borderColor: '#78350f', borderWidth: 1, borderRadius: 12, padding: 18, marginTop: 20, alignItems: 'center' },
  resultTitle: { color: '#fcd34d', fontSize: 12, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 0.5 },
  resultBig: { color: '#fbbf24', fontSize: 34, fontWeight: '900', marginVertical: 6 },
  resultDays: { color: '#fef3c7', fontSize: 14, fontWeight: '500' },
  percentualContainer: { width: '100%', marginTop: 10, alignItems: 'center' },
  percentualText: { color: '#fca5a5', fontSize: 12, fontWeight: '600' },
  progressBarBg: { width: '100%', height: 6, backgroundColor: '#78350f', borderRadius: 3, marginTop: 6, overflow: 'hidden' },
  progressBarFill: { height: '100%', borderRadius: 3 },
  provocacaoBox: { marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#78350f', width: '100%' },
  provocacaoText: { color: '#fde68a', fontSize: 13, fontStyle: 'italic', textAlign: 'center', fontWeight: 'bold', lineHeight: 18 },
  savedBanner: { width: '100%', backgroundColor: 'rgba(16, 185, 129, 0.15)', borderWidth: 1, borderColor: '#10b981', borderRadius: 10, padding: 12, marginTop: 14, alignItems: 'center' },
  savedBannerTitle: { color: '#34d399', fontSize: 13, fontWeight: 'bold', textTransform: 'uppercase', marginBottom: 2 },
  savedBannerText: { color: '#d1fae5', fontSize: 12, textAlign: 'center', lineHeight: 16 },
  savedBannerScore: { color: '#10b981', fontSize: 12, fontWeight: 'bold', marginTop: 4 },
  cooldownBanner: { width: '100%', backgroundColor: 'rgba(56, 189, 248, 0.15)', borderWidth: 1, borderColor: '#38bdf8', borderRadius: 10, padding: 12, marginTop: 14, alignItems: 'center' },
  cooldownBannerTitle: { color: '#7dd3fc', fontSize: 13, fontWeight: 'bold', textTransform: 'uppercase', marginBottom: 2 },
  cooldownBannerText: { color: '#e0f2fe', fontSize: 12, textAlign: 'center', lineHeight: 16 },
  actionsContainer: { width: '100%', marginTop: 14, paddingTop: 14, borderTopWidth: 1, borderTopColor: '#78350f' },
  actionsHeader: { color: '#fcd34d', fontSize: 12, fontWeight: 'bold', textTransform: 'uppercase', marginBottom: 8, textAlign: 'center' },
  actionBtnCooldown: { backgroundColor: '#0284c7', paddingVertical: 10, borderRadius: 8, alignItems: 'center', marginBottom: 6 },
  actionBtnActive: { backgroundColor: '#0369a1', borderColor: '#38bdf8', borderWidth: 1 },
  actionBtnCompare: { backgroundColor: '#334155', paddingVertical: 10, borderRadius: 8, alignItems: 'center', marginBottom: 6 },
  actionBtnSave: { backgroundColor: '#10b981', paddingVertical: 10, borderRadius: 8, alignItems: 'center' },
  actionBtnDone: { backgroundColor: 'rgba(16, 185, 129, 0.2)', borderWidth: 1, borderColor: '#10b981', paddingVertical: 10, borderRadius: 8, alignItems: 'center' },
  actionBtnDoneText: { color: '#34d399', fontWeight: 'bold', fontSize: 13 },
  actionBtnText: { color: '#ffffff', fontWeight: 'bold', fontSize: 13 },
  actionBtnTextCompare: { color: '#38bdf8', fontWeight: 'bold', fontSize: 13 },
  actionBtnTextSave: { color: '#ffffff', fontWeight: 'bold', fontSize: 13 },
  historySection: { backgroundColor: '#0f172a', borderRadius: 16, padding: 18, borderWidth: 1, borderColor: '#334155' },
  historyHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  historyTitle: { fontSize: 15, fontWeight: 'bold', color: '#f8fafc' },
  historyCount: { fontSize: 12, color: '#94a3b8', fontWeight: '600' },
  emptyHistory: { padding: 18, alignItems: 'center' },
  emptyHistoryText: { color: '#64748b', fontSize: 13 },
  historyCard: { backgroundColor: '#1e293b', borderRadius: 10, padding: 12, marginBottom: 8, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 1, borderColor: '#334155' },
  historyCardLeft: { flex: 1 },
  historyTagRow: { flexDirection: 'row', marginBottom: 4 },
  historyCategoryBadge: { backgroundColor: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8', fontSize: 10, fontWeight: 'bold', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, marginRight: 6, textTransform: 'uppercase' },
  statusBadgeCooldown: { backgroundColor: 'rgba(2, 132, 199, 0.2)', color: '#38bdf8', fontSize: 10, fontWeight: 'bold', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  statusBadgeSaved: { backgroundColor: 'rgba(16, 185, 129, 0.2)', color: '#10b981', fontSize: 10, fontWeight: 'bold', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  historyItemName: { color: '#f8fafc', fontSize: 14, fontWeight: 'bold' },
  historyItemPrice: { color: '#94a3b8', fontSize: 12, marginTop: 2 },
  historyCardRight: { alignItems: 'flex-end' },
  historyHoursBig: { color: '#f59e0b', fontSize: 16, fontWeight: 'bold' },
  historyDaysSmall: { color: '#64748b', fontSize: 11, marginBottom: 4 },
  historyDeleteBtn: { paddingVertical: 2, paddingHorizontal: 6 },
  historyDeleteText: { color: '#ef4444', fontSize: 11, fontWeight: '600' }
});
