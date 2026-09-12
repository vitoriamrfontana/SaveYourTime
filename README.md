# ⏳ Save your Time - Aplicativo de Gestão Financeira Consciente e Antimpulso

> **Disciplina:** Projeto de Sistemas  
> **Arquitetura:** MVC (Model-View-Controller)  
> **Plataforma:** Mobile (React Native / Expo) & Back-end REST API (Node.js / Express)  
> **Versão:** 1.0.0 (MVP Sprint 1)

---

## 📌 1. Visão Geral e Proposta de Valor

O **Save your Time** é uma solução mobile desenvolvida para transformar a relação do usuário com o dinheiro. Em vez de tratar financas apenas como números abstratos em planilhas complexas, o aplicativo recontextualiza compras e gastos em **métricas temporais de vida e esforço** ("Horas de Suor") e introduz mecânicas de **autocontrole comportamental**.

### Pilares Fundamentais do Aplicativo:
1. **Conversor de Preço em "Horas de Suor":** Calcula quantas horas e dias úteis de trabalho são necessários para pagar determinado item supérfluo, gerando reflexão imediata antes da compra.
2. **Detox de Assinaturas (Rastreamento de Gastos Invisíveis):** Um checklist focado em identificar e cancelar mensalidades negligenciadas (streamings não utilizados, tarifas de conta corrente, seguros embutidos), apresentando o impacto acumulado no orçamento anual.
3. **Trava de Compras por Impulso ("Cooldown" de 48 Horas):** Sistema de retenção moral que exige um período obrigatório de reflexão de 48 horas e respostas a questionários diários antes de autorizar o registro da compra.
4. **Orçamento Visual dos 3 Potes (Método 50-30-20):** Substituição de orçamentos rígidos por três barras de progresso visuais (Sobrevivência, Estilo de Vida e Quitação de Dívidas), com sistema de alerta para limite excedido.

---

## 🛠️ 2. Tecnologias e Stacks Utilizadas

### 📱 Mobile (Front-end)
- **React Native (v0.74+):** Framework multiplataforma para construção da interface móvel (Android e iOS).
- **Expo (v51+):** Plataforma para execução e testes instantâneos via app Expo Go no celular sem necessidade de compilações nativas pesadas.
- **JavaScript (ES6+):** Linguagem de programação unificada para a lógica das Views e componentes do aplicativo.
- **React Native StyleSheet:** Estilização com temas escuros modernos (Dark Mode) e componentes responsivos.

### ⚙️ Back-end (API REST)
- **Node.js:** Ambiente de execução servidor baseado na engine V8 do JavaScript.
- **Express.js (v4.19+):** Framework minimalista para criação de roteamento e endpoints da API RESTful.
- **CORS (Cross-Origin Resource Sharing):** Middleware para permissão de requisições entre o aplicativo mobile e o servidor.

### 🏛️ Padrão de Arquitetura & Ferramentas
- **MVC (Model-View-Controller):** Organização em camadas isoladas de dados, regras de negócio e telas.
- **Git & GitHub:** Versionamento de código e gerenciamento de contribuições da equipe por branches.
- **Postman / Insomnia:** Ferramentas para validação técnica dos endpoints HTTP.

---

## 🏗️ 3. Arquitetura da Aplicação (Padrão MVC)

O projeto foi estruturado seguindo rigorosamente a arquitetura **MVC (Model-View-Controller)** para garantir o desacoplamento de responsabilidades e permitir o desenvolvimento paralelo entre os 5 integrantes do grupo.

```
                    ┌──────────────────────────────────────────┐
                    │               Mobile (React)             │
                    │        (Views e Services Client)         │
                    └────────────────────┬─────────────────────┘
                                         │ Requisições HTTP (REST/JSON)
                                         ▼
                    ┌──────────────────────────────────────────┐
                    │             Routes (Roteador)            │
                    └────────────────────┬─────────────────────┘
                                         │
                                         ▼
                    ┌──────────────────────────────────────────┐
                    │               Controllers                │
                    │      (Manipulação de Req/Res e Regra)    │
                    └────────────────────┬─────────────────────┘
                                         │
                                         ▼
                    ┌──────────────────────────────────────────┐
                    │                  Models                  │
                    │    (Lógica de Dados e Estado em DB)      │
                    └──────────────────────────────────────────┘
```

---

## 📂 4. Estrutura de Divisões do Projeto (Padrão MVC)

```
save-your-time/
├── backend/
│   ├── src/
│   │   ├── config/       # Configurações do banco de dados e variáveis
│   │   ├── controllers/  # Camada Controller (Regras de requisição/resposta HTTP)
│   │   ├── models/       # Camada Model (Regras de negócio e modelos de dados)
│   │   └── routes/       # Camada Routes (Rotas e endpoints da API)
│   ├── server.js         # Servidor principal Node.js / Express
│   └── package.json
│
├── mobile/
│   ├── src/
│   │   ├── services/     # Serviços de integração HTTP com o Back-end
│   │   ├── views/        # Camada View (Telas e interfaces de usuário)
│   │   ├── controllers/  # Controladores de estado e lógica de apresentação
│   │   └── components/   # Componentes visuais reutilizáveis
│   ├── App.js            # Ponto de entrada do aplicativo Expo
│   └── package.json
│
├── .gitignore            # Filtro de arquivos do Git
└── README.md             # Documentação do projeto
```

---

## 👥 5. Matriz de Responsabilidade por Integrante (Sprint 1)

Cada integrante é responsável pelo desenvolvimento da sua respectiva funcionalidade na camada **Back-end (Model / Controller / Route)** e **Front-end (View)**:

| Integrante | Módulo / Funcionalidade | Camada Back-end (MVC) | Camada Front-end (MVC) |
| :--- | :--- | :--- | :--- |
| **Integrante 1** | Base & Perfil Financeiro | Model, Controller e Rota de Usuário/Perfil | View de Perfil e Configurações |
| **Integrante 2** | Conversor "Horas de Suor" | Model, Controller e Rota de Simulação | View de Conversão em Horas |
| **Integrante 3** | Detox de Assinaturas | Model, Controller e Rota de Assinaturas | View do Checklist de Assinaturas |
| **Integrante 4** | Trava Cooldown 48h | Model, Controller e Rota de Cooldown | View da Trava 48h & Quiz |
| **Integrante 5** | Orçamento 3 Potes (50-30-20) | Model, Controller e Rota dos Potes | View de Barras do Orçamento |

---

## 📡 6. Especificação Técnica dos Endpoints da API REST

### 5.1. Módulo Perfil do Usuário
- **`GET /api/user`**: Retorna os dados cadastrais e o valor por hora calculado.
- **`PUT /api/user`**: Atualiza salário mensal e carga horária.
  - *Payload:* `{ "salario": 3500.00, "horasMensais": 160 }`

### 5.2. Módulo Conversor de Horas de Suor
- **`POST /api/simulate`**: Converte o preço em tempo de trabalho.
  - *Payload:* `{ "item": "Smartphone", "preco": 2500.00 }`
  - *Resposta:* `{ "horasSuor": 114.3, "diasTrabalho": 14.3, "mensagem": "..." }`
- **`GET /api/simulate`**: Retorna o histórico de simulações realizadas.

### 5.3. Módulo Detox de Assinaturas
- **`GET /api/subscriptions`**: Retorna a lista de assinaturas e o cálculo da economia total.
- **`POST /api/subscriptions`**: Cadastra nova assinatura recorrente.
- **`PATCH /api/subscriptions/:id/toggle`**: Alterna o status de cancelado/ativo de uma assinatura.

### 5.4. Módulo Trava Cooldown 48h
- **`GET /api/cooldown`**: Retorna os desejos de consumo em período de reflexão.
- **`POST /api/cooldown`**: Cadastra um novo item na trava de 48h.
- **`PATCH /api/cooldown/:id/quiz`**: Salva as respostas das perguntas reflexivas diárias.

### 5.5. Módulo Orçamento dos 3 Potes
- **`GET /api/pots`**: Retorna o limite de cada pote com base no salário e o gasto atual com sinalização de estouro.
- **`POST /api/pots/lancamento`**: Adiciona uma nova despesa associada a uma categoria (sobrevivencia, estiloVida, dividas).

---

## 🚀 7. Guia de Instalação e Execução

### Pré-requisitos
- Node.js versão 18 ou superior instalado.
- Aplicativo **Expo Go** instalado no smartphone (Android ou iOS).

### Passo 1: Executar o Back-end
```bash
cd save-your-time/backend
npm install
npm start
```
O servidor estará ativo em `http://localhost:3000`. Teste o status acessando `http://localhost:3000/api/health`.

### Passo 2: Executar o App Mobile
Em um novo terminal:
```bash
cd save-your-time/mobile
npm install
npx expo start
```
Escaneie o QR Code exibido no terminal utilizando a câmera ou o app **Expo Go** do seu celular.

---

## 🌿 8. Boas Práticas e Fluxo de Versionamento com Git

1. NUNCA faça commits diretamente na branch `main`.
2. Para criar novas funcionalidades, abra uma branch própria seguindo o padrão:
   `git checkout -b feature/integrante-X-nome-do-modulo`
3. Ao finalizar a tarefa da sprint, envie a branch para o repositório remoto:
   `git push origin feature/integrante-X-nome-do-modulo`
4. Abra um **Pull Request** no GitHub para revisão da equipe antes de realizar o merge.
