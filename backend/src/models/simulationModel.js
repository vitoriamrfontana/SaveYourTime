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
}

module.exports = new SimulationModel();
