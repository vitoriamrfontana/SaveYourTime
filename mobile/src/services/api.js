// Serviço de integração HTTP com o Back-end (API REST)
// Altere o IP se for rodar em dispositivo físico na mesma rede Wi-Fi (ex: http://192.168.1.X:3000/api)
const API_BASE_URL = 'http://localhost:3000/api';

// Perfil fallback em memória (caso a API esteja offline)
let mockProfile = {
  nome: 'Vitória',
  salario: 3500.00,
  horasMensais: 160,
  valorHora: 21.88,
  metaEconomia: 500.00
};

export const ApiService = {
  // Buscar perfil do usuário
  getUserProfile: async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/user`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });
      if (response.ok) {
        const json = await response.json();
        if (json.success && json.data) {
          mockProfile = { ...json.data };
          return json.data;
        }
      }
      return mockProfile;
    } catch (error) {
      console.warn('API Offline. Utilizando dados locais do perfil.');
      return mockProfile;
    }
  },

  // Atualizar perfil do usuário
  updateUserProfile: async (profileData) => {
    try {
      const response = await fetch(`${API_BASE_URL}/user`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profileData)
      });
      if (response.ok) {
        const json = await response.json();
        if (json.success && json.data) {
          mockProfile = { ...json.data };
          return { success: true, data: json.data, message: json.message };
        }
      }
      
      // Fallback local se a API não retornar ok
      const sal = Number(profileData.salario) || mockProfile.salario;
      const hor = Number(profileData.horasMensais) || mockProfile.horasMensais;
      mockProfile = {
        ...mockProfile,
        ...profileData,
        salario: sal,
        horasMensais: hor,
        valorHora: Number((sal / hor).toFixed(2))
      };
      return { success: true, data: mockProfile, message: 'Perfil atualizado (modo local)!' };
    } catch (error) {
      console.warn('API Offline. Atualizando perfil localmente.');
      const sal = Number(profileData.salario) || mockProfile.salario;
      const hor = Number(profileData.horasMensais) || mockProfile.horasMensais;
      mockProfile = {
        ...mockProfile,
        ...profileData,
        salario: sal,
        horasMensais: hor,
        valorHora: Number((sal / hor).toFixed(2))
      };
      return { success: true, data: mockProfile, message: 'Perfil atualizado offline!' };
    }
  }
};
