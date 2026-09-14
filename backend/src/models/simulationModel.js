const db = require('../config/db');

class SimulationModel {
  simular(item, preco) {
    const perfil = db.usuario;
    const valorHora = perfil.valorHora || 20;
    const precoNum = parseFloat(preco);

    const horasSuor = parseFloat((precoNum / valorHora).toFixed(1));
    const diasTrabalho = parseFloat((horasSuor / 8).toFixed(1));
    const percentualSalario = parseFloat(((precoNum / perfil.salario) * 100).toFixed(1));

    const novaSimulacao = {
      id: Date.now(),
      item: item.trim(),
      preco: precoNum,
      horasSuor,
      diasTrabalho,
      percentualSalario,
      valorHoraUsado: valorHora,
      data: new Date().toISOString().split('T')[0],
    };

    db.simulacoes.unshift(novaSimulacao);

    let mensagem;
    if (percentualSalario <= 5) {
      mensagem = `"${item}" representa ${percentualSalario}% do seu salário. Um gasto controlado!`;
    } else if (percentualSalario <= 20) {
      mensagem = `"${item}" vai custar ${horasSuor} horas de trabalho. Pense bem antes de decidir.`;
    } else {
      mensagem = `Atenção! "${item}" consome ${percentualSalario}% do seu salário mensal (${horasSuor} horas). Vale realmente a pena?`;
    }

    return { simulacao: novaSimulacao, mensagem };
  }

  getHistorico() {
    return db.simulacoes;
  }

  deletarSimulacao(id) {
    const index = db.simulacoes.findIndex(s => s.id === parseInt(id));
    if (index === -1) return false;
    db.simulacoes.splice(index, 1);
    return true;
  }
}

module.exports = new SimulationModel();
