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

PotsModel.resetar();
console.log('potsModel.test.js: OK');
