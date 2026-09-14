// Modelo de dados em memória do Usuário (MVP / Sprint 1)
let perfilUsuario = {
  nome: 'Vitória',
  salario: 3500.00,
  horasMensais: 160,
  valorHora: 21.88,
  metaEconomia: 500.00
};

// Calcula automaticamente o valor da hora com base no salário e carga horária
function calcularValorHora(salario, horasMensais) {
  const sal = Number(salario) || 0;
  const horas = Number(horasMensais) || 1;
  return Number((sal / horas).toFixed(2));
}

const UserModel = {
  // Retorna os dados do perfil atual
  getProfile: () => {
    return { ...perfilUsuario };
  },

  // Atualiza os dados do perfil e recalcula o valor por hora
  updateProfile: ({ nome, salario, horasMensais, metaEconomia }) => {
    if (nome !== undefined) perfilUsuario.nome = String(nome).trim();
    if (salario !== undefined) perfilUsuario.salario = Number(salario);
    if (horasMensais !== undefined) perfilUsuario.horasMensais = Number(horasMensais);
    if (metaEconomia !== undefined) perfilUsuario.metaEconomia = Number(metaEconomia);

    // Recalcula o valor/hora
    perfilUsuario.valorHora = calcularValorHora(perfilUsuario.salario, perfilUsuario.horasMensais);

    return { ...perfilUsuario };
  }
};

module.exports = UserModel;
