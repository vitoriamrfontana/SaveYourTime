const UserModel = require('./userModel');

let historicoSimulacoes = [
  {
    id: 'sim-1',
    item: 'iPhone 15 128GB',
    preco: 4199.00,
    categoria: 'Eletronicos',
    horasSuor: 191.9,
    diasTrabalho: 24.0,
    percentualSalario: 119.9,
    nivelImpacto: 'Critico',
    data: new Date(Date.now() - 86400000 * 2).toISOString(),
    status: 'cooldown'
  },
  {
    id: 'sim-2',
    item: 'Tenis Nike Air Max',
    preco: 329.90,
    categoria: 'Vestuario',
    horasSuor: 15.1,
    diasTrabalho: 1.9,
    percentualSalario: 9.4,
    nivelImpacto: 'Moderado',
    data: new Date(Date.now() - 86400000).toISOString(),
    status: 'simulado'
  },
  {
    id: 'sim-3',
    item: 'Fritadeira Air Fryer',
    preco: 199.90,
    categoria: 'Casa',
    horasSuor: 9.1,
    diasTrabalho: 1.1,
    percentualSalario: 5.7,
    nivelImpacto: 'Baixo',
    data: new Date().toISOString(),
    status: 'comprou'
  }
];

class SimulationModel {
  simular({ item, preco, categoria }) {
    const nomeItem = (item || 'Item').trim();
    const precoNum = Math.max(0, Number(preco) || 0);
    const cat = categoria || 'Outros';

    let perfil;
    try {
      perfil = UserModel.getProfile();
    } catch (e) {
      perfil = { valorHora: 21.88, salario: 3500 };
    }

    const valorHora = Number(perfil.valorHora) || 21.88;
    const salario = Number(perfil.salario) || 3500;

    const horasSuor = Number((precoNum / valorHora).toFixed(1));
    const diasTrabalho = Number((horasSuor / 8).toFixed(1));
    const percentualSalario = Number(((precoNum / salario) * 100).toFixed(1));

    let nivelImpacto = 'Baixo';
    if (percentualSalario > 40) {
      nivelImpacto = 'Critico';
    } else if (percentualSalario > 15) {
      nivelImpacto = 'Alto';
    } else if (percentualSalario > 5) {
      nivelImpacto = 'Moderado';
    }

    let mensagem = 'Este item consome ' + horasSuor + 'h da sua jornada. Vale a pena trabalhar ' + diasTrabalho + ' dias por isso?';
    if (nivelImpacto === 'Critico') {
      mensagem = 'Alerta: este gasto consome mais de um terco da sua renda mensal. Recomenda-se colocar no Cooldown.';
    } else if (nivelImpacto === 'Baixo') {
      mensagem = 'Gasto de baixo impacto relativo. Se for planejado, cabe com tranquilidade no orcamento.';
    }

    const registro = {
      id: 'sim-' + Date.now(),
      item: nomeItem,
      preco: precoNum,
      categoria: cat,
      horasSuor,
      diasTrabalho,
      percentualSalario,
      nivelImpacto,
      data: new Date().toISOString(),
      status: 'simulado'
    };

    historicoSimulacoes.unshift(registro);
    if (historicoSimulacoes.length > 25) {
      historicoSimulacoes.pop();
    }

    return {
      simulacao: registro,
      precoItem: precoNum,
      horasSuor,
      diasTrabalho,
      percentualSalario,
      nivelImpacto,
      mensagem
    };
  }

  getHistorico() {
    return [...historicoSimulacoes];
  }

  deletarItemHistorico(id) {
    const totalAntes = historicoSimulacoes.length;
    historicoSimulacoes = historicoSimulacoes.filter(item => item.id !== id);
    return historicoSimulacoes.length < totalAntes;
  }

  atualizarStatusItem(id, status) {
    const item = historicoSimulacoes.find(s => s.id === id);
    if (item) {
      item.status = status;
      return item;
    }
    return null;
  }

  getHealthScore() {
    let perfil;
    try {
      perfil = UserModel.getProfile();
    } catch (e) {
      perfil = { valorHora: 21.88, salario: 3500 };
    }

    const totalSimuladoReais = historicoSimulacoes.reduce((acc, curr) => acc + curr.preco, 0);
    const totalHorasSimuladas = Number(historicoSimulacoes.reduce((acc, curr) => acc + curr.horasSuor, 0).toFixed(1));

    const itensCooldownOuDesistidos = historicoSimulacoes.filter(s => s.status === 'cooldown' || s.status === 'desistiu');
    const horasPoupadas = Number(itensCooldownOuDesistidos.reduce((acc, curr) => acc + curr.horasSuor, 0).toFixed(1));
    const dinheiroPoupado = Number(itensCooldownOuDesistidos.reduce((acc, curr) => acc + curr.preco, 0).toFixed(2));

    let score = 70;
    if (historicoSimulacoes.length > 0) {
      const taxaReflexao = itensCooldownOuDesistidos.length / historicoSimulacoes.length;
      score += Math.round(taxaReflexao * 25);

      const mediaPercentualSalario = historicoSimulacoes.reduce((acc, curr) => acc + curr.percentualSalario, 0) / historicoSimulacoes.length;
      if (mediaPercentualSalario > 30) {
        score -= 15;
      } else if (mediaPercentualSalario < 10) {
        score += 5;
      }
    }

    score = Math.max(10, Math.min(100, score));

    let classificacao = 'Bom';
    if (score >= 85) {
      classificacao = 'Excelente';
    } else if (score >= 70) {
      classificacao = 'Bom';
    } else if (score >= 50) {
      classificacao = 'Em Atencao';
    } else {
      classificacao = 'Critico';
    }

    return {
      score,
      classificacao,
      totalSimulacoes: historicoSimulacoes.length,
      totalSimuladoReais: Number(totalSimuladoReais.toFixed(2)),
      totalHorasSimuladas,
      horasPoupadas,
      dinheiroPoupado,
      dicas: [
        'Colocar gastos acima de 15h de trabalho no Cooldown preserva seu saldo.',
        'Ao simular no comparador, priorize compras a vista no Pix para poupar horas de jornada.',
        'Mantenha gastos superfluos dentro do teto de 30% da regra 50-30-20.'
      ]
    };
  }

  getHealthScoreTimeline() {
    const dadosScore = this.getHealthScore();
    const scoreAtual = dadosScore.score;

    const baseSem1 = Math.max(40, scoreAtual - 24);
    const baseSem2 = Math.max(45, scoreAtual - 18);
    const baseSem3 = Math.max(50, scoreAtual - 13);
    const baseSem4 = Math.max(58, scoreAtual - 9);
    const baseSem5 = Math.max(65, scoreAtual - 4);

    const timeline = [
      { periodo: 'Sem 1', data: '08/09', score: baseSem1, variacao: '+0', horasPoupadas: 18.5, status: 'Inicio' },
      { periodo: 'Sem 2', data: '15/09', score: baseSem2, variacao: '+' + (baseSem2 - baseSem1), horasPoupadas: 42.0, status: 'Evolucao' },
      { periodo: 'Sem 3', data: '22/09', score: baseSem3, variacao: '+' + (baseSem3 - baseSem2), horasPoupadas: 78.4, status: 'Evolucao' },
      { periodo: 'Sem 4', data: '29/09', score: baseSem4, variacao: '+' + (baseSem4 - baseSem3), horasPoupadas: 120.1, status: 'Estavel' },
      { periodo: 'Sem 5', data: '06/10', score: baseSem5, variacao: '+' + (baseSem5 - baseSem4), horasPoupadas: 154.6, status: 'Avanco' },
      { periodo: 'Sem 6', data: '13/10', score: scoreAtual, variacao: (scoreAtual - baseSem5 >= 0 ? '+' : '') + (scoreAtual - baseSem5), horasPoupadas: dadosScore.horasPoupadas, status: dadosScore.classificacao }
    ];

    const scoreMesAnterior = baseSem3;
    const diff = scoreAtual - scoreMesAnterior;
    const percCrescimento = scoreMesAnterior > 0 ? Math.round((diff / scoreMesAnterior) * 100) : 0;

    return {
      evolucao: timeline,
      scoreAtual: scoreAtual,
      classificacao: dadosScore.classificacao,
      comparativoMesAnterior: {
        scoreAtual: scoreAtual,
        scoreAnterior: scoreMesAnterior,
        diferenca: diff,
        percentualCrescimento: percCrescimento,
        tendencia: diff >= 10 ? 'Crescimento Acelerado' : diff > 0 ? 'Crescimento Saudavel' : 'Estavel'
      }
    };
  }

  getConquistas() {
    const dadosScore = this.getHealthScore();
    const scoreAtual = dadosScore.score;

    const itensCooldownOuDesistidos = historicoSimulacoes.filter(s => s.status === 'cooldown' || s.status === 'desistiu');
    const totalEvitados = itensCooldownOuDesistidos.length;
    const horasPoupadas = dadosScore.horasPoupadas;
    const dinheiroPoupado = dadosScore.dinheiroPoupado;
    const totalSimulacoes = historicoSimulacoes.length;

    const badges = [
      {
        id: 'badge-cooldown-master',
        titulo: 'Mestre do Cooldown',
        descricao: 'Evitou compras colocando desejos impulsivos na quarentena reflexiva.',
        categoria: 'Autocontrole',
        desbloqueado: totalEvitados >= 1,
        progressoTexto: Math.min(5, totalEvitados + 2) + ' de 5 compras',
        porcentagem: Math.min(100, Math.round(((totalEvitados + 2) / 5) * 100)),
        nivel: 'Ouro',
        dataDesbloqueio: totalEvitados >= 1 ? '12/10/2026' : null
      },
      {
        id: 'badge-semana-zero-impulso',
        titulo: 'Zero Impulso na Semana',
        descricao: 'Completou 7 dias consecutivos sem compras superfluas nao planejadas.',
        categoria: 'Habito',
        desbloqueado: true,
        progressoTexto: '7 de 7 dias',
        porcentagem: 100,
        nivel: 'Prata',
        dataDesbloqueio: '14/10/2026'
      },
      {
        id: 'badge-guardiao-orcamento',
        titulo: 'Guardiao do Orcamento',
        descricao: 'Alcancou Financial Health Score igual ou superior a 80 pontos.',
        categoria: 'Pontuacao',
        desbloqueado: scoreAtual >= 80,
        progressoTexto: scoreAtual + ' de 80 pontos',
        porcentagem: Math.min(100, Math.round((scoreAtual / 80) * 100)),
        nivel: 'Ouro',
        dataDesbloqueio: scoreAtual >= 80 ? '15/10/2026' : null
      },
      {
        id: 'badge-100h-poupadas',
        titulo: '100 Horas de Vida Poupadas',
        descricao: 'Acumulou mais de 100 horas uteis de trabalho poupadas em despesas evitadas.',
        categoria: 'Tempo',
        desbloqueado: horasPoupadas >= 100,
        progressoTexto: horasPoupadas + 'h poupadas',
        porcentagem: Math.min(100, Math.round((horasPoupadas / 100) * 100)),
        nivel: 'Diamante',
        dataDesbloqueio: horasPoupadas >= 100 ? '16/10/2026' : null
      },
      {
        id: 'badge-simulador-consciente',
        titulo: 'Calculador Consciente',
        descricao: 'Simulou o custo em horas de trabalho de pelo menos 5 produtos.',
        categoria: 'Engajamento',
        desbloqueado: totalSimulacoes >= 5,
        progressoTexto: totalSimulacoes + ' de 5 simulacoes',
        porcentagem: Math.min(100, Math.round((totalSimulacoes / 5) * 100)),
        nivel: 'Bronze',
        dataDesbloqueio: totalSimulacoes >= 5 ? '17/10/2026' : null
      },
      {
        id: 'badge-poupanca-ouro',
        titulo: 'Reserva Blindada',
        descricao: 'Economizou mais de R$ 5.000,00 desistindo de compras antes de passar o cartao.',
        categoria: 'Financas',
        desbloqueado: dinheiroPoupado >= 5000,
        progressoTexto: 'R$ ' + dinheiroPoupado.toFixed(0) + ' de R$ 5.000',
        porcentagem: Math.min(100, Math.round((dinheiroPoupado / 5000) * 100)),
        nivel: 'Platina',
        dataDesbloqueio: dinheiroPoupado >= 5000 ? '18/10/2026' : null
      }
    ];

    const desbloqueadosCount = badges.filter(b => b.desbloqueado).length;

    return {
      badges,
      totalBadges: badges.length,
      desbloqueadosCount,
      taxaConclusaoPercentual: Math.round((desbloqueadosCount / badges.length) * 100)
    };
  }
}

module.exports = new SimulationModel();
