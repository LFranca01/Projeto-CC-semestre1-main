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
    agregados: []
  };
  return db;
}

function saveDB(db) {
  localStorage.setItem("db", JSON.stringify(db));
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
    codigoBarras: dados.codigoBarras,
    precoVenda: parseFloat(dados.precoVenda) || 0,
    unidade: dados.unidade || "UN"
  };
  db.produtos.push(novo);
  saveDB(db);
  return novo;
}

// ================= GESTÃO DE PEDIDOS (Transbordo) =================
function getPedidos() { return getDB().pedidos; }

function createPedido(dados) {
  const db = getDB();
  const novo = {
    id: db.pedidos.length + 1,
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

function deletePedido(id) {
  const db = getDB();
  db.pedidos = db.pedidos.filter(p => p.id != id);
  saveDB(db);
}

// ================= UTILITÁRIOS =================
function formatarMoeda(v) { return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v); }
function formatarData(d) { return d ? new Date(d).toLocaleDateString('pt-BR') : "-"; }