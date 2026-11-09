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
- **`GET /api/subscriptions`**: Retorna a lista de assinaturas e a economia (formato da Sprint 1, mantido).
  - *Resposta:* `{ "subscriptions": [...], "economia": { "economiaMensal": 59.80, "economiaAnual": 717.60, "economiaAcumulada": 139.40 } }`
- **`GET /api/subscriptions/overview`**: Tudo o que a tela do Detox usa, numa chamada só.
  - *Resposta:* `{ "subscriptions", "economia", "insights", "auditoria", "redundancias", "proximasCobrancas", "limite", "taxas" }`
- **`GET /api/subscriptions/meta`**: Categorias, tipos (com a forma de verificar o uso de cada um), ciclos, status, limites dos campos e o checklist de cobranças esquecidas.
- **`GET /api/subscriptions/catalog?q=net`**: Autocomplete de serviços conhecidos, com planos, preço de referência datado e link oficial de cancelamento. Com menos de 2 letras devolve `[]`; `q` tem até 60 caracteres.
  - *Resposta:* `[{ "id": "netflix", "nome": "Netflix", "categoria": "streaming", "tipo": "video", "precos": { "conferidosEm": "2026-11", "fonte": "site oficial" }, "planos": [...], "planoSugerido": { "nome": "Padrão", "valor": 51.90, "ciclo": "mensal" }, "linkCancelamento": "https://..." }]`
- **`GET /api/subscriptions/upcoming?dias=7`**: Cobranças, fins de teste grátis e fins de pausa dos próximos dias (1 a 90; padrão 7).
- **`GET /api/subscriptions/review`**: Detox do mês: um cartão por assinatura ativa ou em teste, com sugestão (`manter`, `verificar`, `pausar`, `cancelar` ou `decidir`) e o motivo.
- **`GET /api/subscriptions/settings`** e **`PATCH /api/subscriptions/settings`**: Meta de gasto com assinaturas, em % da renda do Perfil.
  - *Payload:* `{ "limitePercentualRenda": 8 }` (de 1 a 50, até 1 casa decimal)
  - *Resposta do PATCH:* `{ "configuracoes": { "limitePercentualRenda": 8 }, "resumo": { ... } }`
- **`POST /api/subscriptions`**: Cadastra uma assinatura. O formato antigo (`{ "nome", "valorMensal", "categoria" }`) continua aceito.
  - *Payload:* `{ "nome": "Netflix", "valorCobrado": 51.90, "ciclo": "mensal", "diaCobranca": 10, "categoria": "streaming", "tipo": "video", "compartilhadaCom": 1, "catalogoId": "netflix" }`
  - Ciclos: `semanal`, `mensal`, `trimestral`, `semestral` e `anual`; fora do mensal, envie `proximaCobranca` (`AAAA-MM-DD`) em vez de `diaCobranca`. Para teste grátis: `"status": "teste", "fimTeste": "2026-11-15"`.
- **`PATCH /api/subscriptions/:id`**: Edita nome, valor, ciclo, data de cobrança, divisão, categoria e tipo. Mudança de valor entra no histórico de preços.
- **`PATCH /api/subscriptions/:id/status`**: Muda o status.
  - *Payload:* `{ "status": "pausada", "pausadaAte": "2026-12-01" }` (também `"ativa"`, `"cancelada"` e `"teste"` com `fimTeste`)
- **`PATCH /api/subscriptions/:id/toggle`**: Cancela (ativa ou em teste) ou reativa (pausada ou cancelada). Mantido para compatibilidade.
- **`DELETE /api/subscriptions/:id`**: Exclui um cadastro feito por engano. É diferente de cancelar: a assinatura some da lista e da economia.
- **`POST /api/subscriptions/:id/usage-check`**: Verificação de uso do mês.
  - *Payload:* `{ "frequenciaUso": 12 }`, ou `{ "resposta": true }` nos tipos que se verificam com uma pergunta (seguro, conta bancária, cartão e nuvem)
  - *Resposta:* `{ "forma": "uso", "custoPorUso": 3.33, "referencia": 15, "classificacao": "excelente", "validaAte": "2026-12-01", ... }`
- **`GET /api/subscriptions/:id/cancel-guide`**: Como cancelar: link oficial (quando o serviço está no catálogo), passo a passo, lojas de aplicativo e direitos do consumidor que valem para o caso.
- **`GET /api/subscriptions/insights`**, **`/auditoria`** e **`/redundancies`**: Partes do `/overview` em separado (Sprints 2 e 3).

`PATCH /:id`, `PATCH /:id/status` e `DELETE /:id` devolvem `{ "assinatura", "resumo" }`, com o resumo já recalculado.

> **Regras de cálculo (`subscriptionsModel.js`):**
> - **Datas e dinheiro:** datas `AAAA-MM-DD` no fuso de São Paulo; somas e arredondamentos em centavos inteiros.
> - **Status:** `ativa`, `teste` (vira ativa quando o teste acaba), `pausada` (volta sozinha no `pausadaAte`) e `cancelada`.
> - **Valor mensal:** o valor de cada cobrança convertido para o mês pelo ciclo e dividido entre quem divide o plano (`compartilhadaCom + 1`).
> - **Economia acumulada:** soma as cobranças que deixaram de acontecer enquanto a assinatura esteve pausada ou cancelada, sem contar a mesma cobrança duas vezes.
> - **Custo invisível:** gasto em 12, 36 e 60 meses, também com reajuste anual pelo IPCA de 12 meses, e quanto o mesmo dinheiro viraria aplicado a 100% do CDI, já sem o IR (tabela regressiva da Lei 11.033/2004: 22,5% até 180 dias, 20% até 360, 17,5% até 720 e 15% acima disso).
> - **Juros compostos:** a economia mensal das canceladas aplicada todo mês a 100% do CDI, com o IR regressivo de cada aporte (`montanteLiquido`).
> - **Taxas:** CDI (série SGS 4389) e IPCA de 12 meses (série SGS 13522) do Banco Central, com limite de 3 s por consulta, cache de 24 h e valores de referência quando o BCB não responde (`taxas.fonte` é `"bcb"` ou `"fallback"`).
> - **Custo por uso:** valor mensal ÷ usos no mês, comparado com a referência do tipo (ex.: vídeo R$ 15, música R$ 5, academia R$ 30). Até metade da referência é `excelente`, até a referência é `neutro`; acima disso, ou sem nenhum uso, é `prejuizo`. A verificação vale 30 dias.
> - **Score de eficiência (0 a 100):** começa em 100 e perde pontos por custo-benefício (neutro −15, prejuízo −40), por falta de verificação válida (−10), por concorrente ativo do mesmo tipo (−20) e pelo peso na renda (−8 por ponto percentual, até −20). É `bom` a partir de 70, `atencao` de 40 a 69 e `ruim` abaixo de 40.
> - **Concorrentes:** assinaturas ativas do mesmo tipo (ex.: dois streamings de vídeo); a sugestão de pausa vai para a que menos vale a pena manter.
> - **Meta de gasto:** 5% da renda do Perfil por padrão (de 1% a 50%); `limite.acimaDoLimite` avisa quando o gasto passa da meta.
>
> Os preços do catálogo são **referência datada** (`precos.conferidosEm`) e editável, não o preço atual. O guia de cancelamento cita o CDC art. 49 (arrependimento em 7 dias, para contratação fora do estabelecimento) e, só nos serviços regulados (no app, financeiros e plano de saúde), o Decreto 11.034/2022 art. 14 (cancelamento pelo SAC). As projeções são estimativas educativas, não recomendação de investimento. Como no resto do MVP, os dados ficam em memória.

### 5.4. Módulo Trava Cooldown 48h
- **`GET /api/cooldown`**: Retorna os desejos em quarentena (cada um já com Score de Impulso, fase temporal e marcos) mais o resumo da trava.
  - *Resposta:* `{ "items": [...], "resumo": { "valorRetido": 2478.80, "riscoCritico": 1, "economiaTotal": 240.00, ... }, "categorias": [...], "marcos": [...] }`
- **`GET /api/cooldown/:id`**: Retorna um desejo específico com o cálculo atualizado.
- **`POST /api/cooldown`**: Cadastra um novo item na trava de 48h, já com o questionário reflexivo.
  - *Payload:* `{ "item": "Fone bluetooth", "preco": 1299.90, "categoria": "eletronicos", "quiz": { "necessidadeReal": false, "usoPrevisto": "raro", "alternativas": "O fone atual funciona" } }`
- **`PATCH /api/cooldown/:id/quiz`**: Salva as respostas das perguntas reflexivas diárias e recalcula o score.
- **`PATCH /api/cooldown/:id/desisti`**: Encerra a quarentena como desistência (o valor do item entra na economia).
- **`PATCH /api/cooldown/:id/comprei`**: Encerra a quarentena como compra realizada (não gera economia).
- **`GET /api/cooldown/auditoria`**: Histórico de desfechos, montante poupado pelas compras canceladas e taxa de desistência.

> **Motor preditivo (`cooldownModel.js`):** o *Impulse Risk Score* vai de 0 a 100 e cruza três eixos — peso do item na renda mensal (50 pts), custo em dias úteis de trabalho pelo valor-hora do Perfil (30 pts) e as respostas do questionário reflexivo (20 pts) —, classificando o gasto em **Baixo** (< 35), **Médio** (35 a 64) ou **Crítico** (≥ 65). As 48h são contadas de forma regressiva a partir da data de inclusão, com verificação dos marcos de **12h, 24h e 48h** e as fases *impulso → análise → decisão → liberado*.

### 5.5. Módulo Orçamento dos 3 Potes
- **`GET /api/pots`**: Retorna os limites 50/30/20, gastos do mês, saldo, percentual consumido, burn rate diário, projeção de esgotamento e status de alerta de cada pote.
  - *Query opcional:* `?mes=AAAA-MM` para consultar outro mês.
- **`GET /api/pots/lancamentos`**: Retorna o extrato de despesas do mês.
  - *Queries opcionais:* `?mes=AAAA-MM&categoria=sobrevivencia|estiloVida|dividas`
- **`POST /api/pots/lancamento`**: Adiciona uma despesa associada a uma categoria.
  - *Payload:* `{ "categoria": "sobrevivencia", "valor": 120.50, "descricao": "Mercado", "data": "2026-09-27" }`
- **`DELETE /api/pots/lancamento/:id`**: Exclui um lançamento pelo identificador.

> O módulo de 3 Potes segue o padrão atual do MVP: os lançamentos ficam em memória no `potsModel.js`, sem banco de dados ou ORM.

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

## 🌿 8. Fluxo de Versionamento com Git e Pull Requests

### Estrutura de Branches

| Branch | Finalidade |
| :--- | :--- |
| `main` | Versão final do projeto. **Recebe merge apenas no último dia de aula.** |
| `develop` | Branch de integração contínua. Todo Pull Request da Sprint deve ser aprovado e mergeado aqui. |
| `feature/nome-modulo` | Branch individual de cada integrante para desenvolver o seu módulo. |

---

### Regras Obrigatórias

1. **NUNCA** faça commits diretamente nas branches `main` ou `develop`.
2. Crie sempre uma branch própria para a sua funcionalidade:
   ```bash
   git checkout -b feature/nome-modulo
   ```
3. Ao finalizar a tarefa da Sprint, suba sua branch para o repositório remoto:
   ```bash
   git push origin feature/nome-modulo
   ```
4. Abra um **Pull Request** no GitHub com destino **obrigatório para `develop`** (nunca para `main`).
5. O PR só pode ser mergeado após a **aprovação do revisor responsável**.

---

### 🔄 Ciclo de Revisão de Pull Requests (Sprint 1)

Cada integrante é responsável por revisar o Pull Request de um colega específico, garantindo a revisão cruzada do código antes de qualquer merge na `develop`.

| Integrante | Abre o PR do módulo | PR revisado por |
| :--- | :--- | :--- |
| **Vitória** | Perfil e Base do Projeto | **Arthur** |
| **Arthur** | A definir pela equipe | **Murillo** |
| **Murillo** | A definir pela equipe | **Tiago** |
| **Tiago** | A definir pela equipe | **Afonso** |
| **Afonso** | A definir pela equipe | **Vitória** |

> **Como revisar:** Acesse o Pull Request do seu colega no GitHub, leia o código adicionado, execute o projeto localmente e aprove clicando em **"Approve"** (ou solicite correções com **"Request changes"**).

