// ================= BANCO DE DADOS (Persistência em LocalStorage) =================
function getDB() {
  const db = JSON.parse(localStorage.getItem("db")) || {
    clientes: [],
    produtos: [],
    pedidos: [],
    funcionarios: [], 
    entregas: [],      
    armazens: [],      
    pagamentos: [],
    agregados: [],
    filiais: [
      { id: 1, nome: "Matriz - Centro" },
      { id: 2, nome: "Filial - Norte" }
    ]
  };
  return db;
}

function saveDB(db) {
  localStorage.setItem("db", JSON.stringify(db));
}

// ================= GERAÇÃO DE EAN/SKU =================
function gerarEAN() {
  let ean = '';
  for (let i = 0; i < 12; i++) ean += Math.floor(Math.random() * 10);
  let soma = 0;
  for (let i = 0; i < 12; i++) {
    soma += (i % 2 === 0) ? parseInt(ean[i]) * 1 : parseInt(ean[i]) * 3;
  }
  const verificador = (10 - (soma % 10)) % 10;
  return ean + verificador;
}

function gerarSKU() {
  const letras = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let sku = '';
  for (let i = 0; i < 3; i++) sku += letras[Math.floor(Math.random() * 26)];
  sku += '-';
  for (let i = 0; i < 4; i++) sku += Math.floor(Math.random() * 10);
  return sku;
}

// ================= GESTÃO DE FILIAIS =================
function getFiliais() { return getDB().filiais; }
function getFilialById(id) { return getDB().filiais.find(f => f.id == id); }
function createFilial(dados) {
  const db = getDB();
  db.filiais.push({ id: Date.now(), nome: dados.nome });
  saveDB(db);
}

// ================= GESTÃO DE CLIENTES (Tabela dbo.Clientes) =================
function getClientes() { return getDB().clientes; }

function getClienteById(id) { return getDB().clientes.find(c => c.id == id); }

function createCliente(dados) {
  const db = getDB();
  const novo = {
    id: Date.now(),
    nome: dados.nome,
    documento: dados.documento,
    telefone: dados.telefone || "",
    cep: dados.cep || "",
    numero: dados.numero || "",
    rua: dados.rua || "",
    bairro: dados.bairro || "",
    cidade: dados.cidade || ""
  };
  db.clientes.push(novo);
  saveDB(db);
  return novo;
}

function updateCliente(id, dados) {
  const db = getDB();
  const index = db.clientes.findIndex(c => c.id == id);
  if (index !== -1) {
    db.clientes[index] = { ...db.clientes[index], ...dados };
    saveDB(db);
  }
}

function deleteCliente(id) {
  const db = getDB();
  db.clientes = db.clientes.filter(c => c.id != id);
  saveDB(db);
}

// ================= GESTÃO DE PRODUTOS (Catálogo de Terceiros) =================
function getProdutos() { return getDB().produtos; }
function getProdutoById(id) { return getDB().produtos.find(p => p.id == id); }

function createProduto(dados) {
  const db = getDB();
  const novo = {
    id: Date.now(),
    nome: dados.nome,
    codigoBarras: dados.codigoBarras || gerarEAN(),
    sku: dados.sku || gerarSKU(),
    precoVenda: parseFloat(dados.precoVenda) || 0,
    unidade: dados.unidade || "UN",
    estoque: dados.estoque || 0,
    categoria: dados.categoria || "Geral"
  };
  db.produtos.push(novo);
  saveDB(db);
  return novo;
}

function updateProduto(id, dados) {
  const db = getDB();
  const index = db.produtos.findIndex(p => p.id == id);
  if (index !== -1) {
    db.produtos[index] = { ...db.produtos[index], ...dados };
    saveDB(db);
  }
}

function deleteProduto(id) {
  const db = getDB();
  db.produtos = db.produtos.filter(p => p.id != id);
  saveDB(db);
}

// ================= GESTÃO DE PEDIDOS (Transbordo) =================
function getPedidos() { return getDB().pedidos; }

function createPedido(dados) {
  const db = getDB();
  const novo = {
    id: db.pedidos.length + 1,
    ean: gerarEAN(),
    dataPedido: new Date().toISOString(),
    clienteId: dados.clienteId,
    clienteNome: dados.clienteNome,
    itens: dados.itens, 
    total: dados.total,
    status: "Pendente"
  };
  db.pedidos.push(novo);
  saveDB(db);
  return novo;
}

function updatePedido(id, dados) {
  const db = getDB();
  // Encontra o índice do pedido pelo ID
  const index = db.pedidos.findIndex(p => p.id == id);
  if (index !== -1) {
    // Mantém o ID original e a data, mas atualiza o restante
    db.pedidos[index] = { ...db.pedidos[index], ...dados };
    saveDB(db);
  }
}

function deletePedido(id) {
  const db = getDB();
  db.pedidos = db.pedidos.filter(p => p.id != id);
  saveDB(db);
}

// ================= UTILITÁRIOS =================
function formatarMoeda(v) { return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v); }
function formatarData(d) { return d ? new Date(d).toLocaleDateString('pt-BR') : "-"; }
function formatarDocumento(v) {
  v = v.replace(/\D/g, "");
  if (v.length <= 11) {
    return v.replace(/(\d{3})(\d)/, "$1.$2").replace(/(\d{3})(\d)/, "$1.$2").replace(/(\d{3})(\d{1,2})$/, "$1-$2");
  } else {
    return v.replace(/^(\d{2})(\d)/, "$1.$2").replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3").replace(/\.(\d{3})(\d)/, ".$1/$2").replace(/(\d{4})(\d)/, "$1-$2");
  }
}
function mascaraTelefone(v) {
  v = v.replace(/\D/g, "");
  v = v.replace(/^(\d{2})(\d)/g, "($1) $2");
  v = v.replace(/(\d)(\d{4})$/, "$1-$2");
  return v;
}

// ================= GESTÃO DE AGREGADOS (Motoristas Parceiros) =================
function getAgregados() { return getDB().agregados; }
function getAgregadoById(id) { return getDB().agregados.find(a => a.id == id); }

function createAgregado(dados) {
  const db = getDB();
  const novo = {
    id: Date.now(),
    nome: dados.nome,
    cpf: dados.cpf,
    telefone: dados.telefone,
    veiculo: dados.veiculo,
    placa: dados.placa.toUpperCase(),
    cnh: dados.cnh,
    status: "Ativo",
    dataCadastro: new Date().toISOString()
  };
  db.agregados.push(novo);
  saveDB(db);
  return novo;
}

function updateAgregado(id, dados) {
  const db = getDB();
  const index = db.agregados.findIndex(a => a.id == id);
  if (index !== -1) {
    db.agregados[index] = { ...db.agregados[index], ...dados };
    saveDB(db);
  }
}

function deleteAgregado(id) {
  const db = getDB();
  db.agregados = db.agregados.filter(a => a.id != id);
  saveDB(db);
}

// ================= GESTÃO DE PAGAMENTOS (Financeiro) =================
function getPagamentos() { return getDB().pagamentos; }

function createPagamento(dados) {
  const db = getDB();
  const novo = {
    id: Date.now(),
    pedidoId: dados.pedidoId,
    valor: parseFloat(dados.valor),
    metodo: dados.metodo,
    dataPagamento: dados.dataPagamento || new Date().toISOString().split('T')[0],
    status: "Pago",
    notaFiscal: gerarNF()
  };
  db.pagamentos.push(novo);
  saveDB(db);
  return novo;
}

function gerarNF() {
  const nf = 'NF-' + Date.now().toString().slice(-8);
  return nf;
}

function getSaldoTotal() {
  const db = getDB();
  const pagamentos = db.pagamentos || [];
  return pagamentos.filter(p => p && p.status === 'Pago').reduce((acc, p) => acc + (p.valor || 0), 0);
}

// ================= GESTÃO DE EXPEDIÇÕES (Logística) =================
function getEntregas() { return getDB().entregas; }
function getEntregaById(id) { return getDB().entregas.find(e => e.id == id); }

function createEntrega(dados) {
  const db = getDB();
  const codRastreio = 'BR' + Date.now().toString().slice(-8);
  const novo = {
    id: Date.now(),
    pedidoId: dados.pedidoId,
    codRastreio: codRastreio,
    dataSaida: dados.dataSaida,
    previsaoEntrega: dados.previsaoEntrega,
    agregadoId: dados.agregadoId || null,
    status: "Aguardando"
  };
  db.entregas.push(novo);
  
  const idxPedido = db.pedidos.findIndex(p => p.id == dados.pedidoId);
  if (idxPedido !== -1) {
    db.pedidos[idxPedido].status = "Em Trânsito";
  }
  saveDB(db);
  return novo;
}

function atualizarStatusEntrega(id, status) {
  const db = getDB();
  const index = db.entregas.findIndex(e => e.id == id);
  if (index !== -1) {
    db.entregas[index].status = status;
    saveDB(db);
  }
}

function deleteEntrega(id) {
  const db = getDB();
  db.entregas = db.entregas.filter(e => e.id != id);
  saveDB(db);
}