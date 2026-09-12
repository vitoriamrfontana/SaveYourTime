# ⏳ Save your Time - Aplicativo de Gestão Financeira Consciente

Projeto de Sistemas - Aplicativo Mobile para monitoramento de gastos, conscientização de consumo e prevenção de compras por impulso.

---

## 🏗️ Arquitetura do Projeto (Padrão MVC)

O repositório foi organizado no modelo **MVC (Model-View-Controller)** para facilitar a divisão de trabalho entre os 5 integrantes:

```
save-your-time/
├── backend/
│   ├── src/
│   │   ├── config/       # Configurações do Banco de Dados e Variáveis
│   │   ├── controllers/  # Lógica de negócio de cada integrante (HTTP API)
│   │   ├── models/       # Estruturas de dados e regras dos módulos
│   │   └── routes/       # Definição dos endpoints REST
│   ├── server.js         # Ponto de entrada da aplicação Express
│   └── package.json
├── mobile/
│   ├── src/
│   │   ├── views/        # Telas (Interfaces gráficas) de cada integrante
│   │   ├── controllers/  # Lógica de apresentação das telas
│   │   ├── models/       # Interfaces e modelos de dados do cliente
│   │   ├── components/   # Componentes visuais reutilizáveis
│   │   └── services/     # Conexão HTTP com o Back-end
│   ├── App.js            # Ponto de entrada do aplicativo Expo
│   └── package.json
├── .gitignore
└── README.md
```

---

## 👥 Divisão de Tarefas - Sprint 1

Cada integrante desenvolverá sua respectiva **View/Controller no Mobile** e seu **Model/Controller no Back-end**:

* **Integrante 1:** Perfil do Usuário e Cadastro de Salário / Horas Trabalhadas.
* **Integrante 2:** Conversor de Preço em "Horas de Suor".
* **Integrante 3:** Checklist e Contador do Detox de Assinaturas.
* **Integrante 4:** Trava de Compras por Impulso (Cooldown 48h).
* **Integrante 5:** Orçamento Visual dos 3 Potes (50-30-20).

---

## 🚀 Como Executar o Projeto

### Back-end
```bash
cd backend
npm install
npm start
```

### Mobile
```bash
cd mobile
npm install
npx expo start
```
Escaneie o QR Code no app **Expo Go** no celular.
