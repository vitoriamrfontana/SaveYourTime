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
  getHealthScore,
  getHealthScoreTimeline,
  getUserBadges,
  criarDesejoCooldown
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
  const [subTab, setSubTab] = useState('simulador');
  const [item, setItem] = useState('');
  const [preco, setPreco] = useState('');
  const [categoria, setCategoria] = useState('Eletronicos');
  const [resultado, setResultado] = useState(null);
  const [loading, setLoading] = useState(false);
  const [historico, setHistorico] = useState([]);
  const [healthScoreData, setHealthScoreData] = useState(null);
  const [timelineData, setTimelineData] = useState(null);
  const [badgesData, setBadgesData] = useState(null);
  const [loadingDados, setLoadingDados] = useState(false);
  const [decisaoTomada, setDecisaoTomada] = useState(null);
  const [salvandoCooldown, setSalvandoCooldown] = useState(false);

  const valorHora = Number(perfil?.valorHora) || 21.88;

  useEffect(() => {
    carregarDados();
  }, []);

  const carregarDados = async () => {
    setLoadingDados(true);
    try {
      const [histData, scoreData, tLine, bData] = await Promise.all([
        getSimulationHistory(),
        getHealthScore(),
        getHealthScoreTimeline(),
        getUserBadges()
      ]);
      setHistorico(Array.isArray(histData) ? histData : []);
      setHealthScoreData(scoreData);
      setTimelineData(tLine);
      setBadgesData(bData);
    } catch (e) {
      setHistorico([]);
    } finally {
      setLoadingDados(false);
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
      const [novoScore, novaTimeline, novosBadges] = await Promise.all([
        getHealthScore().catch(() => null),
        getHealthScoreTimeline().catch(() => null),
        getUserBadges().catch(() => null)
      ]);
      if (novoScore) setHealthScoreData(novoScore);
      if (novaTimeline) setTimelineData(novaTimeline);
      if (novosBadges) setBadgesData(novosBadges);
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
      getHealthScoreTimeline().then(setTimelineData).catch(() => {});
      getUserBadges().then(setBadgesData).catch(() => {});
    } catch (e) {}
  };

  const handleAcaoCooldown = async () => {
    const simAtual = resultado?.simulacao || resultado;
    const simId = simAtual?.id;
    const nomeItem = (simAtual?.item || item || 'Produto').trim();
    const precoNum = Number(simAtual?.preco || preco) || 0;
    const catOriginal = (simAtual?.categoria || categoria || 'Outros').toLowerCase();

    let catValida = 'outros';
    if (catOriginal.includes('eletr')) catValida = 'eletronicos';
    else if (catOriginal.includes('vest')) catValida = 'vestuario';
    else if (catOriginal.includes('laz')) catValida = 'lazer';
    else if (catOriginal.includes('casa')) catValida = 'casa';

    setSalvandoCooldown(true);
    try {
      await criarDesejoCooldown({
        item: nomeItem,
        preco: precoNum,
        categoria: catValida
      });
      setDecisaoTomada('cooldown');

      if (simId) {
        setHistorico(prev => prev.map(h => h.id === simId ? { ...h, status: 'cooldown' } : h));
        updateSimulationStatus(simId, 'cooldown').catch(() => {});
      }
    } catch (e) {
      setDecisaoTomada('cooldown');
    } finally {
      setSalvandoCooldown(false);
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

    getHealthScoreTimeline().then(setTimelineData).catch(() => {});
    getUserBadges().then(setBadgesData).catch(() => {});
  };

  const sim = resultado?.simulacao || resultado;
  const score = healthScoreData?.score || 72;
  const classificacao = healthScoreData?.classificacao || 'Bom';
  const listaEvolucao = timelineData?.evolucao || [];
  const comparativo = timelineData?.comparativoMesAnterior || {
    scoreAtual: score,
    scoreAnterior: Math.max(40, score - 15),
    diferenca: 15,
    percentualCrescimento: 20,
    tendencia: 'Crescimento Saudavel'
  };
  const listaBadges = badgesData?.badges || [];
  const desbloqueadosCount = badgesData?.desbloqueadosCount || listaBadges.filter(b => b.desbloqueado).length;
  const taxaConclusao = badgesData?.taxaConclusaoPercentual || Math.round((desbloqueadosCount / Math.max(1, listaBadges.length)) * 100);

  return (
    <View style={styles.container}>
      <View style={styles.healthScoreCard}>
        <View style={styles.scoreHeader}>
          <View style={styles.headerLeftCol}>
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

      <View style={styles.subTabNav}>
        <TouchableOpacity
          style={[styles.subTabButton, subTab === 'simulador' && styles.subTabButtonActive]}
          onPress={() => setSubTab('simulador')}
        >
          <Text style={[styles.subTabButtonText, subTab === 'simulador' && styles.subTabButtonTextActive]}>
            Simulador
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.subTabButton, subTab === 'timeline' && styles.subTabButtonActive]}
          onPress={() => setSubTab('timeline')}
        >
          <Text style={[styles.subTabButtonText, subTab === 'timeline' && styles.subTabButtonTextActive]}>
            Evolucao (90d)
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.subTabButton, subTab === 'badges' && styles.subTabButtonActive]}
          onPress={() => setSubTab('badges')}
        >
          <Text style={[styles.subTabButtonText, subTab === 'badges' && styles.subTabButtonTextActive]}>
            Conquistas ({desbloqueadosCount})
          </Text>
        </TouchableOpacity>
      </View>

      {subTab === 'simulador' && (
        <View style={styles.tabContentBlock}>
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
              value={preco}
              onChangeText={setPreco}
              placeholder="0.00"
              placeholderTextColor="#64748b"
              keyboardType="numeric"
            />

            <TouchableOpacity style={styles.button} onPress={handleSimular} disabled={loading}>
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Calcular Horas de Suor</Text>
              )}
            </TouchableOpacity>

            {resultado && sim && (
              <View style={[
                styles.resultCard,
                sim.nivelImpacto === 'Critico' ? styles.resultCardCritico :
                sim.nivelImpacto === 'Alto' ? styles.resultCardAlto : styles.resultCardNormal
              ]}>
                <View style={styles.resultHeader}>
                  <View style={styles.headerLeftCol}>
                    <Text style={styles.resultItemName}>{sim.item}</Text>
                  </View>
                  <View style={[
                    styles.impactBadge,
                    sim.nivelImpacto === 'Critico' ? styles.impactBadgeCritico :
                    sim.nivelImpacto === 'Alto' ? styles.impactBadgeAlto : styles.impactBadgeNormal
                  ]}>
                    <Text style={styles.impactBadgeText}>Impacto {sim.nivelImpacto}</Text>
                  </View>
                </View>

                <View style={styles.resultMetricsGrid}>
                  <View style={styles.resultMetricBox}>
                    <Text style={styles.resultMetricValue}>{sim.horasSuor}h</Text>
                    <Text style={styles.resultMetricLabel}>Horas Trabalho</Text>
                  </View>
                  <View style={styles.resultMetricBox}>
                    <Text style={styles.resultMetricValue}>{sim.diasTrabalho}d</Text>
                    <Text style={styles.resultMetricLabel}>Dias Uteis</Text>
                  </View>
                  <View style={styles.resultMetricBox}>
                    <Text style={styles.resultMetricValue}>{sim.percentualSalario}%</Text>
                    <Text style={styles.resultMetricLabel}>Salario Liquido</Text>
                  </View>
                </View>

                <Text style={styles.resultMessage}>{resultado.mensagem}</Text>

                {decisaoTomada === 'desistiu' ? (
                  <View style={styles.feedbackSuccessBox}>
                    <Text style={styles.feedbackSuccessText}>
                      Parabens! Voce evitou um gasto por impulso e ganhou +8 pontos no seu Health Score.
                    </Text>
                  </View>
                ) : decisaoTomada === 'cooldown' ? (
                  <View style={styles.feedbackCooldownBox}>
                    <Text style={styles.feedbackCooldownTitle}>
                      Bloqueado no Cooldown de 48h!
                    </Text>
                    <Text style={styles.feedbackCooldownText}>
                      O item foi salvo na sua quarentena reflexiva. O cronometro de 48 horas ja esta ativo no sistema.
                    </Text>
                    <View style={styles.feedbackCooldownButtons}>
                      <TouchableOpacity
                        style={styles.cooldownGoButton}
                        onPress={() => {
                          if (onMandarCooldown) onMandarCooldown();
                        }}
                      >
                        <Text style={styles.cooldownGoButtonText}>Ver no Cooldown</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.cooldownContinueButton}
                        onPress={() => {
                          setResultado(null);
                          setDecisaoTomada(null);
                          setItem('');
                          setPreco('');
                        }}
                      >
                        <Text style={styles.cooldownContinueButtonText}>Nova Simulacao</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ) : (
                  <View style={styles.actionsContainer}>
                    <TouchableOpacity
                      style={styles.actionBtnCooldown}
                      onPress={handleAcaoCooldown}
                      disabled={salvandoCooldown}
                    >
                      {salvandoCooldown ? (
                        <ActivityIndicator color="#ffffff" size="small" />
                      ) : (
                        <Text style={styles.actionBtnCooldownText}>Travar no Cooldown 48h</Text>
                      )}
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.actionBtnDesistir} onPress={handleDesistirCompra}>
                      <Text style={styles.actionBtnDesistirText}>Desistir da Compra (+8 pts)</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.actionBtnDeals} onPress={handleAcaoComparador}>
                      <Text style={styles.actionBtnDealsText}>Buscar Menor Preco</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            )}
          </View>

          <View style={styles.historyCard}>
            <Text style={styles.historyTitle}>Historico de Consultas Recentes</Text>
            {loadingDados ? (
              <ActivityIndicator color="#38bdf8" style={{ marginVertical: 16 }} />
            ) : historico.length === 0 ? (
              <Text style={styles.emptyText}>Nenhuma simulacao registrada ainda.</Text>
            ) : (
              historico.map((h) => (
                <View key={h.id} style={styles.historyItem}>
                  <View style={styles.historyItemLeft}>
                    <View style={styles.historyTagRow}>
                      <Text style={styles.historyCategory}>{h.categoria || 'Gasto'}</Text>
                      {h.status === 'cooldown' ? (
                        <View style={styles.statusPillCooldown}>
                          <Text style={styles.statusPillText}>Cooldown</Text>
                        </View>
                      ) : h.status === 'desistiu' ? (
                        <View style={styles.statusPillDesistiu}>
                          <Text style={styles.statusPillTextGreen}>Economizado</Text>
                        </View>
                      ) : null}
                    </View>
                    <Text style={styles.historyItemName}>{h.item}</Text>
                    <Text style={styles.historyItemPrice}>R$ {Number(h.preco).toFixed(2)}</Text>
                  </View>
                  <View style={styles.historyItemRight}>
                    <Text style={styles.historyHours}>{h.horasSuor}h</Text>
                    <Text style={styles.historyDays}>{h.diasTrabalho} dias</Text>
                    <TouchableOpacity
                      style={styles.deleteButton}
                      onPress={() => handleDeleteItem(h.id)}
                    >
                      <Text style={styles.deleteButtonText}>Excluir</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            )}
          </View>
        </View>
      )}

      {subTab === 'timeline' && (
        <View style={styles.tabContentBlock}>
          <View style={styles.executiveCard}>
            <View style={styles.executiveHeader}>
              <View style={styles.headerLeftCol}>
                <Text style={styles.executiveTag}>Auditoria de Evolucao</Text>
                <Text style={styles.executiveTitle}>Trajetoria da Disciplina</Text>
              </View>
              <View style={styles.executiveTrendBadge}>
                <Text style={styles.executiveTrendText}>{comparativo.tendencia}</Text>
              </View>
            </View>

            <View style={styles.executiveGrid}>
              <View style={styles.executiveMetricCol}>
                <Text style={styles.executiveLabel}>Score Atual</Text>
                <Text style={styles.executiveScoreNow}>{comparativo.scoreAtual} pts</Text>
              </View>
              <View style={styles.executiveMetricCol}>
                <Text style={styles.executiveLabel}>Anterior</Text>
                <Text style={styles.executiveScoreBefore}>{comparativo.scoreAnterior} pts</Text>
              </View>
              <View style={styles.executiveMetricCol}>
                <Text style={styles.executiveLabel}>Variacao</Text>
                <Text style={styles.executiveGrowth}>
                  {comparativo.diferenca >= 0 ? '+' : ''}{comparativo.diferenca} pts ({comparativo.percentualCrescimento}%)
                </Text>
              </View>
            </View>

            <View style={styles.executiveNotice}>
              <Text style={styles.executiveNoticeText}>
                Sua disciplina financeira evoluiu nos ultimos meses conforme voce utilizou a quarentena do Cooldown e o conversor de horas de suor.
              </Text>
            </View>
          </View>

          <View style={styles.card}>
            <Text style={styles.title}>Flutuacao do Health Score no Tempo</Text>
            <Text style={styles.subtitle}>
              Registro consolidado semana a semana mostrando a consistencia das suas decisoes de consumo.
            </Text>

            <View style={styles.chartContainer}>
              <View style={styles.chartBarsRow}>
                {listaEvolucao.map((ponto, pIdx) => {
                  const isUltimo = pIdx === listaEvolucao.length - 1;
                  const alturaPercent = Math.max(15, Math.min(100, ponto.score));
                  return (
                    <View key={pIdx} style={styles.chartBarCol}>
                      <Text style={[styles.chartBarValue, isUltimo && styles.chartBarValueActive]}>
                        {ponto.score}
                      </Text>
                      <View style={styles.chartBarTrack}>
                        <View
                          style={[
                            styles.chartBarFill,
                            { height: alturaPercent + '%' },
                            isUltimo ? styles.chartBarFillActive : styles.chartBarFillPast
                          ]}
                        />
                      </View>
                      <Text style={[styles.chartBarPeriod, isUltimo && styles.chartBarPeriodActive]}>
                        {ponto.periodo}
                      </Text>
                      <Text style={styles.chartBarDate}>{ponto.data}</Text>
                    </View>
                  );
                })}
              </View>
            </View>

            <Text style={styles.sectionTitle}>Sessoes Auditadas no Periodo:</Text>
            {listaEvolucao.map((p, idx) => (
              <View key={idx} style={styles.timelineRowItem}>
                <View style={styles.timelinePeriodBadge}>
                  <Text style={styles.timelinePeriodText}>{p.periodo}</Text>
                  <Text style={styles.timelineDateText}>{p.data}</Text>
                </View>
                <View style={styles.timelineCenterInfo}>
                  <Text style={styles.timelineStatusTitle}>Status: {p.status}</Text>
                  <Text style={styles.timelineHoursSaved}>{p.horasPoupadas}h poupadas</Text>
                </View>
                <View style={styles.timelineScoreCol}>
                  <Text style={styles.timelineScoreVal}>{p.score} pts</Text>
                  <Text style={styles.timelineVarText}>{p.variacao} pts</Text>
                </View>
              </View>
            ))}
          </View>
        </View>
      )}

      {subTab === 'badges' && (
        <View style={styles.tabContentBlock}>
          <View style={styles.executiveCard}>
            <View style={styles.executiveHeader}>
              <View style={styles.headerLeftCol}>
                <Text style={styles.executiveTag}>Gamificacao e Habitos</Text>
                <Text style={styles.executiveTitle}>Conquistas de Autocontrole</Text>
              </View>
              <View style={styles.executiveTrendBadge}>
                <Text style={styles.executiveTrendText}>{desbloqueadosCount}/{listaBadges.length} Badges</Text>
              </View>
            </View>

            <View style={styles.scoreBarBackground}>
              <View style={[styles.scoreBarFill, { width: taxaConclusao + '%', backgroundColor: '#38bdf8' }]} />
            </View>

            <View style={styles.badgeSummaryRow}>
              <Text style={styles.badgeSummaryLabel}>Progresso Geral de Disciplina:</Text>
              <Text style={styles.badgeSummaryPercent}>{taxaConclusao}%</Text>
            </View>
          </View>

          <View style={styles.badgesGrid}>
            {listaBadges.map((badge) => (
              <View
                key={badge.id}
                style={[
                  styles.badgeCard,
                  badge.desbloqueado ? styles.badgeCardUnlocked : styles.badgeCardLocked
                ]}
              >
                <View style={styles.badgeTopRow}>
                  <View style={[
                    styles.badgeTierPill,
                    badge.nivel === 'Diamante' ? styles.tierDiamante :
                    badge.nivel === 'Platina' ? styles.tierPlatina :
                    badge.nivel === 'Ouro' ? styles.tierOuro :
                    badge.nivel === 'Prata' ? styles.tierPrata : styles.tierBronze
                  ]}>
                    <Text style={styles.badgeTierText}>{badge.nivel}</Text>
                  </View>
                  {badge.desbloqueado ? (
                    <View style={styles.badgeStatusTagUnlocked}>
                      <Text style={styles.badgeStatusTextUnlocked}>Conquistado</Text>
                    </View>
                  ) : (
                    <View style={styles.badgeStatusTagLocked}>
                      <Text style={styles.badgeStatusTextLocked}>Bloqueado</Text>
                    </View>
                  )}
                </View>

                <Text style={[
                  styles.badgeTitle,
                  badge.desbloqueado ? styles.badgeTitleUnlocked : styles.badgeTitleLocked
                ]}>
                  {badge.titulo}
                </Text>

                <Text style={styles.badgeDescription}>{badge.descricao}</Text>

                <View style={styles.badgeProgressContainer}>
                  <View style={styles.badgeProgressTrack}>
                    <View
                      style={[
                        styles.badgeProgressFill,
                        { width: badge.porcentagem + '%' },
                        badge.desbloqueado ? { backgroundColor: '#10b981' } : { backgroundColor: '#38bdf8' }
                      ]}
                    />
                  </View>
                  <View style={styles.badgeProgressMeta}>
                    <Text style={styles.badgeMetaText}>{badge.progressoTexto}</Text>
                    <Text style={styles.badgeMetaPercent}>{badge.porcentagem}%</Text>
                  </View>
                </View>

                {badge.dataDesbloqueio ? (
                  <Text style={styles.badgeUnlockedDate}>Liberado em {badge.dataDesbloqueio}</Text>
                ) : null}
              </View>
            ))}
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    paddingBottom: 36
  },
  tabContentBlock: {
    width: '100%'
  },
  healthScoreCard: {
    backgroundColor: '#0f172a',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#334155',
    marginBottom: 14,
    width: '100%'
  },
  scoreHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12
  },
  headerLeftCol: {
    flex: 1,
    marginRight: 8
  },
  scoreTag: {
    color: '#38bdf8',
    fontSize: 10,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 0.5
  },
  scoreTitle: {
    color: '#f8fafc',
    fontSize: 15,
    fontWeight: 'bold',
    marginTop: 2
  },
  scoreBadge: {
    flexDirection: 'row',
    alignItems: 'baseline',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    flexShrink: 0
  },
  scoreBadgeGreen: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)'
  },
  scoreBadgeBlue: {
    backgroundColor: 'rgba(56, 189, 248, 0.2)'
  },
  scoreBadgeAmber: {
    backgroundColor: 'rgba(245, 158, 11, 0.2)'
  },
  scoreBadgeNumber: {
    color: '#f8fafc',
    fontSize: 20,
    fontWeight: 'bold'
  },
  scoreBadgeMax: {
    color: '#94a3b8',
    fontSize: 11,
    marginLeft: 2
  },
  scoreBarBackground: {
    height: 7,
    backgroundColor: '#1e293b',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 12,
    width: '100%'
  },
  scoreBarFill: {
    height: '100%',
    borderRadius: 4
  },
  metricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#1e293b',
    padding: 8,
    borderRadius: 8,
    width: '100%'
  },
  metricItem: {
    alignItems: 'center',
    flex: 1
  },
  metricLabel: {
    color: '#64748b',
    fontSize: 9,
    textTransform: 'uppercase',
    fontWeight: '600'
  },
  metricValue: {
    color: '#f8fafc',
    fontSize: 12,
    fontWeight: 'bold',
    marginTop: 2
  },
  dicaBox: {
    marginTop: 10,
    backgroundColor: 'rgba(56, 189, 248, 0.08)',
    borderRadius: 8,
    padding: 10,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.2)'
  },
  dicaLabel: {
    color: '#38bdf8',
    fontSize: 10,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    marginBottom: 2
  },
  dicaText: {
    color: '#cbd5e1',
    fontSize: 11,
    lineHeight: 15
  },
  subTabNav: {
    flexDirection: 'row',
    backgroundColor: '#1e293b',
    borderRadius: 10,
    padding: 3,
    marginBottom: 14,
    width: '100%'
  },
  subTabButton: {
    flex: 1,
    paddingVertical: 9,
    paddingHorizontal: 2,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    marginHorizontal: 1
  },
  subTabButtonActive: {
    backgroundColor: '#0284c7'
  },
  subTabButtonText: {
    color: '#94a3b8',
    fontSize: 11,
    fontWeight: 'bold',
    textAlign: 'center'
  },
  subTabButtonTextActive: {
    color: '#ffffff'
  },
  card: {
    backgroundColor: '#1e293b',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#334155',
    marginBottom: 14,
    width: '100%'
  },
  title: {
    color: '#f8fafc',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4
  },
  subtitle: {
    color: '#94a3b8',
    fontSize: 11,
    lineHeight: 16,
    marginBottom: 12
  },
  sectionTitle: {
    color: '#94a3b8',
    fontSize: 10,
    textTransform: 'uppercase',
    fontWeight: 'bold',
    marginBottom: 8
  },
  tagsContainer: {
    flexDirection: 'row',
    marginBottom: 12
  },
  tagButton: {
    backgroundColor: '#0f172a',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginRight: 6,
    borderWidth: 1,
    borderColor: '#334155'
  },
  tagText: {
    color: '#38bdf8',
    fontSize: 11,
    fontWeight: '600'
  },
  label: {
    color: '#cbd5e1',
    fontSize: 11,
    fontWeight: 'bold',
    marginBottom: 4,
    marginTop: 6
  },
  input: {
    backgroundColor: '#0f172a',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    color: '#f8fafc',
    fontSize: 13,
    borderWidth: 1,
    borderColor: '#334155'
  },
  catContainer: {
    flexDirection: 'row',
    marginBottom: 6
  },
  catChip: {
    backgroundColor: '#0f172a',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
    marginRight: 6,
    borderWidth: 1,
    borderColor: '#334155'
  },
  catChipActive: {
    backgroundColor: 'rgba(56, 189, 248, 0.2)',
    borderColor: '#38bdf8'
  },
  catChipText: {
    color: '#94a3b8',
    fontSize: 11
  },
  catChipTextActive: {
    color: '#38bdf8',
    fontWeight: 'bold'
  },
  button: {
    backgroundColor: '#0284c7',
    borderRadius: 8,
    paddingVertical: 11,
    alignItems: 'center',
    marginTop: 14
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: 'bold'
  },
  resultCard: {
    borderRadius: 12,
    padding: 12,
    marginTop: 14,
    borderWidth: 1,
    width: '100%'
  },
  resultCardNormal: {
    backgroundColor: '#0f172a',
    borderColor: '#334155'
  },
  resultCardAlto: {
    backgroundColor: 'rgba(245, 158, 11, 0.08)',
    borderColor: '#f59e0b'
  },
  resultCardCritico: {
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
    borderColor: '#ef4444'
  },
  resultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10
  },
  resultItemName: {
    color: '#f8fafc',
    fontSize: 14,
    fontWeight: 'bold'
  },
  impactBadge: {
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 4,
    flexShrink: 0
  },
  impactBadgeNormal: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)'
  },
  impactBadgeAlto: {
    backgroundColor: 'rgba(245, 158, 11, 0.2)'
  },
  impactBadgeCritico: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)'
  },
  impactBadgeText: {
    color: '#f8fafc',
    fontSize: 9,
    fontWeight: 'bold',
    textTransform: 'uppercase'
  },
  resultMetricsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#1e293b',
    borderRadius: 8,
    padding: 8,
    marginBottom: 10,
    width: '100%'
  },
  resultMetricBox: {
    alignItems: 'center',
    flex: 1
  },
  resultMetricValue: {
    color: '#38bdf8',
    fontSize: 14,
    fontWeight: 'bold'
  },
  resultMetricLabel: {
    color: '#94a3b8',
    fontSize: 8,
    textTransform: 'uppercase',
    marginTop: 2,
    textAlign: 'center'
  },
  resultMessage: {
    color: '#cbd5e1',
    fontSize: 11,
    lineHeight: 15,
    marginBottom: 12
  },
  actionsContainer: {
    width: '100%'
  },
  actionBtnCooldown: {
    backgroundColor: '#0284c7',
    borderRadius: 8,
    paddingVertical: 9,
    alignItems: 'center',
    marginBottom: 6
  },
  actionBtnCooldownText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold'
  },
  actionBtnDesistir: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderWidth: 1,
    borderColor: '#10b981',
    borderRadius: 8,
    paddingVertical: 9,
    alignItems: 'center',
    marginBottom: 6
  },
  actionBtnDesistirText: {
    color: '#10b981',
    fontSize: 12,
    fontWeight: 'bold'
  },
  actionBtnDeals: {
    backgroundColor: '#334155',
    borderRadius: 8,
    paddingVertical: 8,
    alignItems: 'center'
  },
  actionBtnDealsText: {
    color: '#cbd5e1',
    fontSize: 11,
    fontWeight: 'bold'
  },
  feedbackSuccessBox: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#10b981'
  },
  feedbackSuccessText: {
    color: '#10b981',
    fontSize: 11,
    textAlign: 'center',
    fontWeight: 'bold'
  },
  feedbackCooldownBox: {
    backgroundColor: 'rgba(56, 189, 248, 0.12)',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#38bdf8',
    width: '100%',
    marginTop: 6
  },
  feedbackCooldownTitle: {
    color: '#38bdf8',
    fontSize: 13,
    fontWeight: 'bold',
    marginBottom: 4,
    textAlign: 'center'
  },
  feedbackCooldownText: {
    color: '#cbd5e1',
    fontSize: 11,
    textAlign: 'center',
    lineHeight: 16,
    marginBottom: 10
  },
  feedbackCooldownButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  cooldownGoButton: {
    flex: 1,
    backgroundColor: '#0284c7',
    paddingVertical: 9,
    borderRadius: 8,
    alignItems: 'center',
    marginRight: 6
  },
  cooldownGoButtonText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: 'bold'
  },
  cooldownContinueButton: {
    flex: 1,
    backgroundColor: '#334155',
    paddingVertical: 9,
    borderRadius: 8,
    alignItems: 'center'
  },
  cooldownContinueButtonText: {
    color: '#cbd5e1',
    fontSize: 11,
    fontWeight: 'bold'
  },
  historyCard: {
    backgroundColor: '#1e293b',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#334155',
    width: '100%'
  },
  historyTitle: {
    color: '#f8fafc',
    fontSize: 13,
    fontWeight: 'bold',
    marginBottom: 10
  },
  emptyText: {
    color: '#64748b',
    fontSize: 11,
    textAlign: 'center',
    paddingVertical: 10
  },
  historyItem: {
    backgroundColor: '#0f172a',
    borderRadius: 10,
    padding: 10,
    marginBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155',
    width: '100%'
  },
  historyItemLeft: {
    flex: 1,
    marginRight: 6
  },
  historyTagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 3
  },
  historyCategory: {
    color: '#94a3b8',
    fontSize: 9,
    textTransform: 'uppercase',
    fontWeight: '600',
    marginRight: 6
  },
  statusPillCooldown: {
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4
  },
  statusPillDesistiu: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4
  },
  statusPillText: {
    color: '#38bdf8',
    fontSize: 8,
    fontWeight: 'bold'
  },
  statusPillTextGreen: {
    color: '#10b981',
    fontSize: 8,
    fontWeight: 'bold'
  },
  historyItemName: {
    color: '#f8fafc',
    fontSize: 12,
    fontWeight: 'bold'
  },
  historyItemPrice: {
    color: '#94a3b8',
    fontSize: 10,
    marginTop: 1
  },
  historyItemRight: {
    alignItems: 'flex-end',
    flexShrink: 0
  },
  historyHours: {
    color: '#38bdf8',
    fontSize: 13,
    fontWeight: 'bold'
  },
  historyDays: {
    color: '#64748b',
    fontSize: 9
  },
  deleteButton: {
    marginTop: 3,
    paddingVertical: 2,
    paddingHorizontal: 4
  },
  deleteButtonText: {
    color: '#ef4444',
    fontSize: 9
  },
  executiveCard: {
    backgroundColor: '#0f172a',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#334155',
    marginBottom: 14,
    width: '100%'
  },
  executiveHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10
  },
  executiveTag: {
    color: '#38bdf8',
    fontSize: 10,
    fontWeight: 'bold',
    textTransform: 'uppercase'
  },
  executiveTitle: {
    color: '#f8fafc',
    fontSize: 15,
    fontWeight: 'bold',
    marginTop: 2
  },
  executiveTrendBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
    flexShrink: 0
  },
  executiveTrendText: {
    color: '#10b981',
    fontSize: 10,
    fontWeight: 'bold'
  },
  executiveGrid: {
    flexDirection: 'row',
    backgroundColor: '#1e293b',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 6,
    marginBottom: 10,
    width: '100%'
  },
  executiveMetricCol: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 2
  },
  executiveLabel: {
    color: '#64748b',
    fontSize: 9,
    textTransform: 'uppercase',
    fontWeight: '600'
  },
  executiveScoreNow: {
    color: '#38bdf8',
    fontSize: 14,
    fontWeight: 'bold',
    marginTop: 2
  },
  executiveScoreBefore: {
    color: '#cbd5e1',
    fontSize: 13,
    fontWeight: 'bold',
    marginTop: 2
  },
  executiveGrowth: {
    color: '#10b981',
    fontSize: 11,
    fontWeight: 'bold',
    marginTop: 2,
    textAlign: 'center'
  },
  executiveNotice: {
    backgroundColor: 'rgba(56, 189, 248, 0.08)',
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.2)'
  },
  executiveNoticeText: {
    color: '#94a3b8',
    fontSize: 10,
    lineHeight: 14
  },
  chartContainer: {
    backgroundColor: '#0f172a',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 6,
    borderWidth: 1,
    borderColor: '#334155',
    marginBottom: 14,
    width: '100%'
  },
  chartBarsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    height: 130,
    width: '100%'
  },
  chartBarCol: {
    flex: 1,
    alignItems: 'center',
    height: '100%',
    justifyContent: 'flex-end',
    marginHorizontal: 1
  },
  chartBarValue: {
    color: '#94a3b8',
    fontSize: 9,
    fontWeight: 'bold',
    marginBottom: 4
  },
  chartBarValueActive: {
    color: '#38bdf8'
  },
  chartBarTrack: {
    width: 14,
    height: 75,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 4,
    justifyContent: 'flex-end',
    overflow: 'hidden'
  },
  chartBarFill: {
    width: '100%',
    borderRadius: 4
  },
  chartBarFillPast: {
    backgroundColor: '#475569'
  },
  chartBarFillActive: {
    backgroundColor: '#38bdf8'
  },
  chartBarPeriod: {
    color: '#64748b',
    fontSize: 9,
    marginTop: 5,
    fontWeight: '600'
  },
  chartBarPeriodActive: {
    color: '#38bdf8',
    fontWeight: 'bold'
  },
  chartBarDate: {
    color: '#475569',
    fontSize: 8,
    marginTop: 1
  },
  timelineRowItem: {
    backgroundColor: '#0f172a',
    borderRadius: 10,
    padding: 10,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155',
    width: '100%'
  },
  timelinePeriodBadge: {
    backgroundColor: '#1e293b',
    paddingHorizontal: 4,
    paddingVertical: 5,
    borderRadius: 6,
    alignItems: 'center',
    width: 48,
    flexShrink: 0
  },
  timelinePeriodText: {
    color: '#38bdf8',
    fontSize: 10,
    fontWeight: 'bold'
  },
  timelineDateText: {
    color: '#64748b',
    fontSize: 8,
    marginTop: 1
  },
  timelineCenterInfo: {
    flex: 1,
    paddingHorizontal: 8
  },
  timelineStatusTitle: {
    color: '#f8fafc',
    fontSize: 11,
    fontWeight: 'bold'
  },
  timelineHoursSaved: {
    color: '#10b981',
    fontSize: 10,
    marginTop: 1
  },
  timelineScoreCol: {
    alignItems: 'flex-end',
    flexShrink: 0,
    minWidth: 48
  },
  timelineScoreVal: {
    color: '#f8fafc',
    fontSize: 13,
    fontWeight: 'bold'
  },
  timelineVarText: {
    color: '#38bdf8',
    fontSize: 10,
    fontWeight: '600'
  },
  badgeSummaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%'
  },
  badgeSummaryLabel: {
    color: '#94a3b8',
    fontSize: 10
  },
  badgeSummaryPercent: {
    color: '#38bdf8',
    fontSize: 11,
    fontWeight: 'bold'
  },
  badgesGrid: {
    width: '100%'
  },
  badgeCard: {
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    marginBottom: 10,
    width: '100%'
  },
  badgeCardUnlocked: {
    borderColor: 'rgba(16, 185, 129, 0.4)',
    backgroundColor: '#0f172a'
  },
  badgeCardLocked: {
    borderColor: '#334155',
    backgroundColor: '#1e293b',
    opacity: 0.85
  },
  badgeTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    width: '100%'
  },
  badgeTierPill: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4
  },
  tierBronze: {
    backgroundColor: 'rgba(217, 119, 6, 0.2)'
  },
  tierPrata: {
    backgroundColor: 'rgba(148, 163, 184, 0.2)'
  },
  tierOuro: {
    backgroundColor: 'rgba(245, 158, 11, 0.25)'
  },
  tierPlatina: {
    backgroundColor: 'rgba(56, 189, 248, 0.2)'
  },
  tierDiamante: {
    backgroundColor: 'rgba(168, 85, 247, 0.2)'
  },
  badgeTierText: {
    color: '#f8fafc',
    fontSize: 9,
    fontWeight: 'bold',
    textTransform: 'uppercase'
  },
  badgeStatusTagUnlocked: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4
  },
  badgeStatusTextUnlocked: {
    color: '#10b981',
    fontSize: 9,
    fontWeight: 'bold'
  },
  badgeStatusTagLocked: {
    backgroundColor: '#334155',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4
  },
  badgeStatusTextLocked: {
    color: '#94a3b8',
    fontSize: 9,
    fontWeight: '600'
  },
  badgeTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    marginBottom: 3
  },
  badgeTitleUnlocked: {
    color: '#f8fafc'
  },
  badgeTitleLocked: {
    color: '#cbd5e1'
  },
  badgeDescription: {
    color: '#94a3b8',
    fontSize: 10,
    lineHeight: 14,
    marginBottom: 8
  },
  badgeProgressContainer: {
    marginTop: 2,
    width: '100%'
  },
  badgeProgressTrack: {
    height: 5,
    backgroundColor: '#0f172a',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 5,
    width: '100%'
  },
  badgeProgressFill: {
    height: '100%',
    borderRadius: 3
  },
  badgeProgressMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%'
  },
  badgeMetaText: {
    color: '#64748b',
    fontSize: 9
  },
  badgeMetaPercent: {
    color: '#cbd5e1',
    fontSize: 9,
    fontWeight: 'bold'
  },
  badgeUnlockedDate: {
    color: '#10b981',
    fontSize: 9,
    marginTop: 4,
    fontStyle: 'italic'
  }
});
