const assert = require('assert');
const PotsModel = require('../src/models/potsModel');
const UserModel = require('../src/models/userModel');

PotsModel.resetar();
UserModel.updateProfile({ salario: 3500, horasMensais: 160 });

const agora = new Date();
const mes = `${agora.getFullYear()}-${String(agora.getMonth() + 1).padStart(2, '0')}`;
const data = `${mes}-01`;
const lancar = (categoria, valor) =>
  PotsModel.adicionarLancamento({ categoria, valor, descricao: 'Teste', data });

// Sem lançamentos não há o que fechar
assert.throws(() => PotsModel.fecharCompetenciaMensal(mes), /Não há lançamentos/);
// Mês futuro e formato inválido
assert.throws(() => PotsModel.fecharCompetenciaMensal('2999-01'), /futuro/);
assert.throws(() => PotsModel.fecharCompetenciaMensal('abc'), /AAAA-MM/);
// Reequilibrar exige fechamento prévio
assert.throws(() => PotsModel.reequilibrarPotes({ mes }), /Feche a competência/);

// Mês perfeito: 1750 / 1050 / 700 (50-30-20 de 3500)
lancar('sobrevivencia', 1750);
lancar('estiloVida', 1050);
lancar('dividas', 700);
let fechamento = PotsModel.fecharCompetenciaMensal(mes);
assert.strictEqual(fechamento.conforme, true);
assert.strictEqual(fechamento.conformes, 3);
assert.strictEqual(fechamento.medalha.nivel, 'ouro');
assert.strictEqual(fechamento.medalha.mensagem, 'Você manteve 50-30-20 perfeitamente este mês!');
assert.strictEqual(fechamento.aderencia, 100);
assert.strictEqual(fechamento.sugestaoReequilibrio, null);
assert.throws(() => PotsModel.reequilibrarPotes({ mes }), /Não há sobras/);

// Mês com sobra no estilo de vida e déficit na reserva
PotsModel.resetar();
UserModel.updateProfile({ salario: 3500, horasMensais: 160 });
lancar('sobrevivencia', 1750);
lancar('estiloVida', 650);
lancar('dividas', 300);
fechamento = PotsModel.fecharCompetenciaMensal(mes);
const estilo = fechamento.potes.find((p) => p.chave === 'estiloVida');
const reserva = fechamento.potes.find((p) => p.chave === 'dividas');
assert.strictEqual(estilo.conforme, true);
assert.strictEqual(estilo.sobra, 400);
assert.strictEqual(estilo.desvioPontosPercentuais, -11.43);
assert.strictEqual(reserva.conforme, false);
assert.strictEqual(reserva.situacao, 'abaixo');
assert.strictEqual(fechamento.deficitReserva, 400);
assert.strictEqual(fechamento.medalha.nivel, 'prata');
assert.deepStrictEqual(fechamento.sugestaoReequilibrio, { origem: 'estiloVida', destino: 'dividas', valor: 400 });

// Validações do reequilíbrio
assert.throws(() => PotsModel.reequilibrarPotes({ mes, valor: 500 }), /excede a sobra/);
assert.throws(() => PotsModel.reequilibrarPotes({ mes, valor: -1 }), /maior que zero/);
assert.throws(() => PotsModel.reequilibrarPotes({ mes, origem: 'dividas' }), /teto/);
assert.throws(() => PotsModel.reequilibrarPotes({ mes, destino: 'estiloVida' }), /reserva/);
assert.throws(() => PotsModel.reequilibrarPotes({ mes, origem: 'x' }), /Categoria inválida/);

// Transferência parcial
let r = PotsModel.reequilibrarPotes({ mes, valor: 150 });
assert.strictEqual(r.transferencia.valor, 150);
assert.strictEqual(r.fechamento.totalTransferido, 150);
assert.strictEqual(r.fechamento.potes.find((p) => p.chave === 'estiloVida').sobra, 250);
assert.strictEqual(r.fechamento.potes.find((p) => p.chave === 'dividas').alocado, 450);

// Transferência do restante (sem valor): reserva atinge a meta e o mês fica perfeito
r = PotsModel.reequilibrarPotes({ mes });
assert.strictEqual(r.transferencia.valor, 250);
assert.strictEqual(r.fechamento.totalTransferido, 400);
assert.strictEqual(r.fechamento.conforme, true);
assert.strictEqual(r.fechamento.medalha.nivel, 'ouro');
assert.strictEqual(r.fechamento.transferencias.length, 2);

// Resumo reflete os tetos ajustados; os valores gastos não mudam
const potes = PotsModel.getResumo(mes).pots;
assert.strictEqual(potes.find((p) => p.chave === 'estiloVida').limite, 650);
assert.strictEqual(potes.find((p) => p.chave === 'dividas').limite, 1100);
assert.strictEqual(potes.find((p) => p.chave === 'estiloVida').gastoAtual, 650);
assert.strictEqual(PotsModel.getResumo(mes).fechado, true);

// Fechar de novo preserva as transferências; histórico traz o mês
const refeito = PotsModel.fecharCompetenciaMensal(mes);
assert.strictEqual(refeito.totalTransferido, 400);
assert.strictEqual(PotsModel.listarFechamentos().length, 1);

// Teto estourado e medalhas mais baixas
PotsModel.resetar();
UserModel.updateProfile({ salario: 3500, horasMensais: 160 });
lancar('sobrevivencia', 2000);
lancar('estiloVida', 1500);
fechamento = PotsModel.fecharCompetenciaMensal(mes);
assert.strictEqual(fechamento.conformes, 0);
assert.strictEqual(fechamento.medalha.nivel, 'nenhuma');
assert.strictEqual(fechamento.sugestaoReequilibrio, null);
assert.ok(fechamento.aderencia < 100);

PotsModel.resetar();
console.log('potsMonthClose.test.js: OK');
