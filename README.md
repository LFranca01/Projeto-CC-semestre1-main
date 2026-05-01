# Serginho Leva Atrás — Logistics Hub ERP v2

ERP logístico em frontend puro (HTML/CSS/JS vanilla) com persistência em
`localStorage`. Esta v2 reescreveu o esqueleto visual seguindo o design
de referência (estilo Linear/Vercel — sidebar dark, layout multi-coluna
denso, viewport-fit sem rolagem na página).

## Como rodar

Suba qualquer servidor estático na pasta:

```bash
python3 -m http.server 8000
# ou
npx serve .
```

Abra `http://localhost:8000` e logue com `admin@sla.com` / `admin`.

Nota: as páginas referenciam `./assets/Logo.png`. Mantenha sua pasta
`assets/` ao lado dos HTMLs.

## O que mudou na v2

### Layout viewport-fit (desktop ≥ 1025px)
- `body { height: 100vh; overflow: hidden }` — nenhuma rolagem na página.
- Sidebar fixa à esquerda, header fixo no topo, conteúdo principal
  ocupa o espaço restante exato.
- Tabelas e listas têm scroll **interno** quando o conteúdo passa do
  espaço disponível.
- Em ≤ 1024px o layout volta ao modelo mobile-first com bottom-nav e
  scroll vertical normal.

### Sidebar
- Logo em destaque (64×64), sem o texto "Logistics Hub".
- Lista de navegação (Dashboard, Pedidos, Filiais, Produtos, RH,
  Clientes, Agregados, Relatórios, Logística).
- Card de usuário fixo embaixo (avatar + nome + cargo).

### Login
- Card centralizado (max 420px) sobre fundo gradiente em qualquer
  tamanho de tela.
- Logo grande (96×96) sempre visível, inclusive em mobile.
- Floating labels nos inputs.

### Dashboard (`inicio.html`)
- Grid 3 colunas no desktop: KPIs empilhados | Chart "Distribuição
  Operacional" | "Ações Rápidas" (4 atalhos).
- Card "Status dos Hubs Logísticos" embaixo com pill "Operação Ótima".
- KPIs viram carrossel horizontal no mobile.

### Pedidos (`pedidos.html`)
- Page header "Gestão de Pedidos" + botões "Exportar" / "Novo Pedido".
- Filter bar dedicada (Filtros / Status / Data / Filial / Limpar).
- Tabela com `cell-customer` (avatar circular colorido + nome do
  cliente) e status pills (Pendente / Em Trânsito / Entregue / Atrasado).
- Paginação 10/página com botões numerados estilo Linear.
- `Exportar` gera CSV; `Limpar Filtros` resetá todos os campos.

### Relatórios / Financeiro (`financeiro.html`)
- 3 KPIs no topo: Receitas (Período), Despesas Operacionais, **Saldo
  Líquido** (card destaque em navy escuro).
- Linha do meio: chart "Fluxo de Caixa Diário" (barras Entradas/Saídas
  últimos 7 dias) + painel "Despesas por Categoria" (barras de
  progresso por categoria).
- **Função NF integrada** na tab "Notas Fiscais":
  - Seção "Emissão de Notas Fiscais" com formulário rápido inline:
    Cliente/Tomador (select de pedidos) + Valor Total + botão verde
    "Gerar NF-e".
  - Botão "Mais opções" abre o modal completo (série, e-mail, cidade,
    UF, prazo).
  - Tabela com NFs emitidas, com botões de visualizar/imprimir.
  - Print → gera HTML completo da NF (chave de acesso, dados do
    pedido, valor, prazo) e dispara `window.print()`.

### RH (`rh.html`)
- 4 KPIs: Total Equipe, Contratos CLT, Contratos PJ, Folha Mensal.
- Tabela com `cell-customer` (avatar + nome + e-mail), Cargo & Filial
  agrupados em uma célula, badge CLT (navy) / PJ (verde).
- Modal de funcionário inclui campo "Tipo Contrato" (CLT / PJ).

### Logística (`logistica.html`)
- Page header "Estação de Bipagem" + 2 stat-cards inline (Bipados Hoje
  / Em Trânsito).
- Grid 2 colunas: à esquerda card "Leitura Rápida" (input de código
  com borda tracejada estilo dropzone, status pill ATIVO), card
  "Associação de Motorista" e card de pendentes; à direita tabela
  "Últimos Bipados".

### Filiais, Produtos, Clientes, Agregados
- Mesma sidebar e header das demais.
- Page header com título + subtítulo + ações.
- KPIs (quando aplicável) e tabela ocupando o restante da tela com
  scroll interno.

## Stack e dependências

- HTML5, CSS3 (variáveis CSS, grid/flex), JavaScript ES2017.
- [Chart.js](https://www.chartjs.org/) (CDN) — donut do dashboard,
  barras do fluxo de caixa.
- [Cropper.js](https://github.com/fengyuanchen/cropperjs) (CDN) —
  recorte de avatar.
- Material Icons Round (Google).
- Font Josefin Sans (Google Fonts).

## Persistência

Todos os dados ficam em `localStorage` (`sla_db` é o root). O cache em
memória `_dbCache` evita parses repetidos do JSON.

Filiais padrão (8 hubs) são populadas automaticamente no primeiro acesso:
matriz-sp, cajamar-sp, extrema-mg, curitiba-pr, recife-pe, goiania-go,
salvador-ba, manaus-am.

## Fórmula de frete (preservada da v1)

```
pesoCubado  = (Comprimento × Largura × Altura) / 6000
pesoTaxado  = max(pesoReal, pesoCubado)
freteBase   = pesoTaxado × R$ 4,50
adicionais  = +2,5% por adicional (pedágio/risco/seguro)
freteFinal  = (freteBase + adicionais) × 1,035  # +3,5% imposto
```

## Estrutura de arquivos

```
/
├── index.html            login (card centralizado)
├── inicio.html           Dashboard
├── pedidos.html          Pedidos
├── filiais.html          Filiais
├── produtos.html         Produtos
├── rh.html               RH
├── clientes.html         Clientes
├── agregados.html        Agregados
├── financeiro.html       Relatórios + NF integrada
├── logistica.html        Logística
├── api.js                CRUD localStorage + cálculo de frete
├── auth.js               sessão + login/logout
├── ui-helper.js          modais, máscaras, bottom-nav, toasts, filtros
├── *.js                  módulo por página
├── theme.js              stub (compatibilidade)
└── styles/
    ├── style.css         design system completo (~43 KB)
    └── login.css         login standalone
```

## Atalhos

- `Esc` — fecha qualquer modal aberto.
- Click fora — também fecha modais.
- Avatar na sidebar → click → abre dropdown (alterar foto / sair).
- Click no avatar abre o zoom em tela cheia.
