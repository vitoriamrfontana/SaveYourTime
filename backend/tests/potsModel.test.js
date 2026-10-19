const assert = require('assert');
const PotsModel = require('../src/models/potsModel');
const UserModel = require('../src/models/userModel');

PotsModel.resetar();
UserModel.updateProfile({ salario: 3500, horasMensais: 160 });

const mesAtual = new Date();
const mes = `${mesAtual.getFullYear()}-${String(mesAtual.getMonth() + 1).padStart(2, '0')}`;
const dia = String(mesAtual.getDate()).padStart(2, '0');
const data = `${mes}-${dia}`;

const primeiro = PotsModel.adicionarLancamento({
  categoria: 'sobrevivencia',
  valor: 700,
  descricao: 'Supermercado',
  data,
});

assert.strictEqual(primeiro.categoria, 'sobrevivencia');
assert.strictEqual(primeiro.valor, 700);

const segundo = PotsModel.adicionarLancamento({
  categoria: 'estiloVida',
  valor: 900,
  descricao: 'Passeio',
  data,
});

assert.strictEqual(segundo.valor, 900);

const resumo = PotsModel.getResumo(mes);
const necessidades = resumo.pots.find((pote) => pote.chave === 'sobrevivencia');
const estilo = resumo.pots.find((pote) => pote.chave === 'estiloVida');

assert.strictEqual(necessidades.limite, 1750);
assert.strictEqual(necessidades.gastoAtual, 700);
assert.strictEqual(necessidades.statusAlerta, 'normal');
assert.ok(necessidades.burnRateDiario > 0);
assert.strictEqual(estilo.limite, 1050);
assert.strictEqual(estilo.gastoAtual, 900);
assert.strictEqual(estilo.statusAlerta, 'atencao');

const removido = PotsModel.removerLancamento(segundo.id);
assert.strictEqual(removido.id, segundo.id);
assert.strictEqual(PotsModel.getResumo(mes).pots.find((pote) => pote.chave === 'estiloVida').gastoAtual, 0);

assert.throws(
  () => PotsModel.adicionarLancamento({ categoria: 'inexistente', valor: 10, descricao: 'Teste', data }),
  /Categoria inválida/
);

const compraLiberada = PotsModel.verificarImpactoCompra({ valor: 100, categoria: 'estiloVida', mes });
assert.strictEqual(compraLiberada.status, 'liberada');
assert.strictEqual(compraLiberada.gastoProjetado, 100);
assert.strictEqual(compraLiberada.saldoProjetado, 950);
assert.strictEqual(compraLiberada.pots.length, 3);

const compraAtencao = PotsModel.verificarImpactoCompra({ valor: 950, categoria: 'estiloVida', mes });
assert.strictEqual(compraAtencao.status, 'atencao');
assert.strictEqual(compraAtencao.parecer, 'Atenção - Margem Estreita');
assert.strictEqual(compraAtencao.saldoProjetado, 100);

const compraViolacao = PotsModel.verificarImpactoCompra({ valor: 1100, categoria: 'estiloVida', mes });
assert.strictEqual(compraViolacao.status, 'violacao');
assert.strictEqual(compraViolacao.saldoProjetado, -50);

assert.throws(
  () => PotsModel.verificarImpactoCompra({ valor: 50, categoria: 'inexistente', mes }),
  /Categoria inválida/
);
assert.throws(
  () => PotsModel.verificarImpactoCompra({ valor: 0, categoria: 'estiloVida', mes }),
  /maior que zero/
);

PotsModel.resetar();
console.log('potsModel.test.js: OK');
