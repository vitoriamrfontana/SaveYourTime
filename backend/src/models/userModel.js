// Modelo de dados em memória do Usuário (MVP / Sprint 1)
let perfilUsuario = {
  nome: 'Vitória',
  salario: 3500.00,
  horasMensais: 160,
  valorHora: 21.88,
  metaEconomia: 500.00
};

function calcularValorHora(salario, horasMensais) {
  const sal = Number(salario) || 0;
  const horas = Number(horasMensais) || 1;
  return Number((sal / horas).toFixed(2));
}

const UserModel = {
  getProfile: () => {
    return { ...perfilUsuario };
  },

  updateProfile: ({ nome, salario, horasMensais, metaEconomia }) => {
    if (nome !== undefined) perfilUsuario.nome = String(nome).trim();
    if (salario !== undefined) perfilUsuario.salario = Number(salario);
    if (horasMensais !== undefined) perfilUsuario.horasMensais = Number(horasMensais);
    if (metaEconomia !== undefined) perfilUsuario.metaEconomia = Number(metaEconomia);

    perfilUsuario.valorHora = calcularValorHora(perfilUsuario.salario, perfilUsuario.horasMensais);

    return { ...perfilUsuario };
  }
};

module.exports = UserModel;
