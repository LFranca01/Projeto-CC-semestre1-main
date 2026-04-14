// ================= BANCO DE DADOS (Simulado) =================
function getDB() {
  const db = JSON.parse(localStorage.getItem("db")) || {
    clientes: [],
    produtos: [],
    pedidos: [],
    funcionarios: [], // Tabela dbo.Funcionarios
    entregas: [],      // Tabela dbo.Entregas
    fornecedores: [],  // Tabela dbo.Fornecedores
    armazens: [],      // Tabela dbo.Armazens
    agregados: [],     // Tabela dbo.Agregados
    filiais: []        // Tabela dbo.Filiais
  };
  return db;
}

function saveDB(db) {
  localStorage.setItem("db", JSON.stringify(db));
}

// ================= CLIENTES (Atualizado com SQL Schema) =================
function getClientes() {
  return getDB().clientes;
}

function createCliente(cliente) {
  const db = getDB();
  const novo = {
    id: Date.now(),
    nome: cliente.nome,
    email: cliente.email || "",
    telefone: cliente.telefone || "",
    documento: cliente.documento || "",
    // Novos campos baseados na imagem da tabela dbo.Clientes:
    tipoPessoa: cliente.tipoPessoa || "F", 
    rua: cliente.rua || "",
    bairro: cliente.bairro || "",
    cep: cliente.cep || ""
  };
  db.clientes.push(novo);
  saveDB(db);
  return novo;
}

function updateCliente(id, dados) {
  const db = getDB();
  const index = db.clientes.findIndex(c => c.id == id);
  
  // Se o cliente não existir, interrompe a função
  if (index === -1) {
    console.error("Cliente não encontrado para o ID:", id);
    return null;
  }
  
  db.clientes[index] = {
    ...db.clientes[index], 
    nome: dados.nome,
    email: dados.email,
    telefone: dados.telefone,
    documento: dados.documento,
    tipoPessoa: dados.tipoPessoa, 
    rua: dados.rua,               
    bairro: dados.bairro,        
    cep: dados.cep                
  };
  
  saveDB(db);
  
  return db.clientes[index];
}

function deleteCliente(id) {
  const db = getDB();
  db.clientes = db.clientes.filter(c => c.id != id);
  saveDB(db);
}

function getClienteById(id) {
  return getDB().clientes.find(c => c.id == id);
}

// ================= PEDIDOS =================
function getPedidos() {
  return getDB().pedidos;
}

function createPedido(pedido) {
  const db = getDB();
  const novo = {
    id: pedido.id || Date.now(),
    clienteId: pedido.clienteId,
    data: pedido.data || new Date().toISOString(),
    status: pedido.status || "Pendente",
    itens: pedido.itens || [],
    total: pedido.total || 0,
    situacao: pedido.situacao || "A" // Campo 'Situacao' da imagem SQL
  };
  db.pedidos.push(novo);
  saveDB(db);
  return novo;
}

function updateStatus(id) {
  const db = getDB();
  const pedido = db.pedidos.find(p => p.id == id);
  if (!pedido) return;

  const fluxos = ["Pendente", "Enviado", "Entregue"];
  let index = fluxos.indexOf(pedido.status);
  pedido.status = fluxos[(index + 1) % fluxos.length];

  saveDB(db);
  return pedido;
}

// ================= PRODUTOS =================
function getProdutos() {
  return getDB().produtos;
}

// ================= DASHBOARD / MÉTRICAS =================
function getMetricas(lista = null) {
  const pedidos = lista || getPedidos();
  const db = getDB();
  
  const total = pedidos.length;
  const faturamento = pedidos.reduce((acc, p) => acc + (parseFloat(p.total) || 0), 0);
  
  return { 
    total, 
    faturamento, 
    totalClientes: db.clientes.length,
    pendentes: pedidos.filter(p => p.status === "Pendente").length,
    enviados: pedidos.filter(p => p.status === "Enviado").length,
    entregues: pedidos.filter(p => p.status === "Entregue").length 
  };
}

// ================= FORMATAÇÕES =================
function formatarData(data) {
  if (!data) return "-";
  const d = new Date(data);
  return d.toLocaleDateString("pt-BR");
}

function formatarMoeda(valor) {
  return new Number(valor).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL"
  });
}

function formatarTelefone(telefone) {
  if (!telefone) return "Sem telefone";
  const nums = telefone.replace(/\D/g, "");
  if (nums.length === 11) return `(${nums.slice(0, 2)}) ${nums.slice(2, 7)}-${nums.slice(7)}`;
  if (nums.length === 10) return `(${nums.slice(0, 2)}) ${nums.slice(2, 6)}-${nums.slice(6)}`;
  return telefone;
}

function formatarDocumento(valor) {
  if (!valor) return "-";
  const n = valor.replace(/\D/g, "");
  if (n.length === 11) return n.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
  if (n.length === 14) return n.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, "$1.$2.$3/$4-$5");
  return valor;
}

// ================= PRODUTOS (SQL Schema Compliant) =================
function createProduto(dados) {
  const db = getDB();
  const novo = {
    id: Date.now(),
    nome: dados.nome,
    precoVenda: parseFloat(dados.precoVenda) || 0,
    codigoBarras: dados.codigoBarras || "",
    peso: parseFloat(dados.peso) || 0,
    volume: parseFloat(dados.volume) || 0,
    unidade: dados.unidade || "UN",
    estoque: parseInt(dados.estoque) || 0
  };
  db.produtos.push(novo);
  saveDB(db);
  return novo;
}

function updateProduto(id, dados) {
  const db = getDB();
  const index = db.produtos.findIndex(p => p.id == id);
  if (index === -1) return null;

  db.produtos[index] = {
    ...db.produtos[index],
    nome: dados.nome,
    precoVenda: parseFloat(dados.precoVenda),
    codigoBarras: dados.codigoBarras,
    peso: parseFloat(dados.peso),
    volume: parseFloat(dados.volume),
    unidade: dados.unidade,
    estoque: parseInt(dados.estoque)
  };

  saveDB(db);
  return db.produtos[index];
}

function deleteProduto(id) {
  const db = getDB();
  db.produtos = db.produtos.filter(p => p.id != id);
  saveDB(db);
}

function getProdutoById(id) {
  return getDB().produtos.find(p => p.id == id);
}

// ================= LOGÍSTICA (Entregas e Agregados) =================

function getEntregas() {
  return getDB().entregas;
}

function getAgregados() {
  return getDB().agregados;
}

function createEntrega(dados) {
  const db = getDB();
  const nova = {
    id: Date.now(),
    pedidoId: dados.pedidoId,
    agregadoId: dados.agregadoId,
    codRastreio: dados.codRastreio || `BR${Math.floor(Math.random() * 1000000)}`,
    dataSaida: dados.dataSaida || new Date().toISOString(),
    previsaoEntrega: dados.previsaoEntrega || "",
    status: "Em Trânsito"
  };
  
  // Atualiza também o status do pedido para "Enviado" automaticamente
  const pedido = db.pedidos.find(p => p.id == dados.pedidoId);
  if (pedido) pedido.status = "Enviado";

  db.entregas.push(nova);
  saveDB(db);
  return nova;
}

function deleteEntrega(id) {
  const db = getDB();
  db.entregas = db.entregas.filter(e => e.id != id);
  saveDB(db);
}

// ================= ESTOQUE / ARMAZÉNS (SQL Schema) =================

function getArmazens() {
  return getDB().armazens;
}

function getFiliais() {
  const db = getDB();
  // Se estiver vazio, cria filiais padrão para o projeto conceitual
  if (db.filiais.length === 0) {
    db.filiais = [
      { id: 1, nome: "Matriz - São Paulo", cidade: "São Paulo" },
      { id: 2, nome: "Filial - Rio de Janeiro", cidade: "Rio de Janeiro" }
    ];
    saveDB(db);
  }
  return db.filiais;
}

function updateEstoque(dados) {
  const db = getDB();
  // Busca se já existe registro desse produto nesse armazém
  let item = db.armazens.find(a => a.idProduto == dados.idProduto && a.idFilial == dados.idFilial);
  
  if (item) {
    item.quantidadeAtual = parseInt(dados.quantidadeAtual);
    item.estoqueMinimo = parseInt(dados.estoqueMinimo);
    item.estoqueMaximo = parseInt(dados.estoqueMaximo);
  } else {
    db.armazens.push({
      id: Date.now(),
      idFilial: dados.idFilial,
      idProduto: dados.idProduto,
      quantidadeAtual: parseInt(dados.quantidadeAtual),
      estoqueMinimo: parseInt(dados.estoqueMinimo),
      estoqueMaximo: parseInt(dados.estoqueMaximo)
    });
  }
  
  // Atualiza o estoque global na tabela de produtos para manter sincronia simples
  const produto = db.produtos.find(p => p.id == dados.idProduto);
  if (produto) {
    const totalNoEstoque = db.armazens
      .filter(a => a.idProduto == dados.idProduto)
      .reduce((acc, curr) => acc + curr.quantidadeAtual, 0);
    produto.estoque = totalNoEstoque;
  }

  saveDB(db);
}

// ================= RH / FUNCIONÁRIOS (SQL Schema) =================

function getFuncionarios() {
  return getDB().funcionarios;
}

function createFuncionario(dados) {
  const db = getDB();
  const novo = {
    id: Date.now(),
    nome: dados.nome,
    cpf: dados.cpf || "",
    cargo: dados.cargo || "",
    idFilial: dados.idFilial, // FK para Filiais
    dataAdmissao: dados.dataAdmissao || new Date().toISOString(),
    status: "Ativo"
  };
  db.funcionarios.push(novo);
  saveDB(db);
  return novo;
}

function updateFuncionario(id, dados) {
  const db = getDB();
  const index = db.funcionarios.findIndex(f => f.id == id);
  if (index === -1) return null;

  db.funcionarios[index] = {
    ...db.funcionarios[index],
    nome: dados.nome,
    cpf: dados.cpf,
    cargo: dados.cargo,
    idFilial: dados.idFilial,
    dataAdmissao: dados.dataAdmissao
  };

  saveDB(db);
  return db.funcionarios[index];
}

function deleteFuncionario(id) {
  const db = getDB();
  db.funcionarios = db.funcionarios.filter(f => f.id != id);
  saveDB(db);
}

// ================= FINANCEIRO (SQL Schema) =================

function getPagamentos() {
  const db = getDB();
  return db.pagamentos || [];
}

function registrarPagamento(dados) {
  const db = getDB();
  if (!db.pagamentos) db.pagamentos = [];

  const novo = {
    id: Date.now(),
    pedidoId: dados.pedidoId,
    valor: parseFloat(dados.valor),
    metodo: dados.metodo || "Boleto",
    dataPagamento: new Date().toISOString(),
    status: "Confirmado"
  };

  db.pagamentos.push(novo);

  // Opcional: Se o valor pago cobrir o pedido, podemos mudar a 'Situacao' do pedido
  const pedido = db.pedidos.find(p => p.id == dados.pedidoId);
  if (pedido) {
    pedido.situacao = "P"; // 'P' de Pago, seguindo lógica de banco
  }

  saveDB(db);
  return novo;
}

function getSaldoTotal() {
  return getPagamentos().reduce((acc, p) => acc + p.valor, 0);
}