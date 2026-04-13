// ================= BANCO =================
function getDB() {
  return JSON.parse(localStorage.getItem("db")) || {
    clientes: [],
    produtos: [],
    pedidos: []
  };
}

function saveDB(db) {
  localStorage.setItem("db", JSON.stringify(db));
}

// ================= CLIENTES =================
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
    documento: cliente.documento || ""
  };
  db.clientes.push(novo);
  saveDB(db);
  return novo;
}

function updateCliente(id, dados) {
  const db = getDB();
  const cliente = db.clientes.find(c => c.id == id);
  if (!cliente) return;
  cliente.nome = dados.nome;
  cliente.email = dados.email;
  cliente.telefone = dados.telefone;
  cliente.documento = dados.documento;
  saveDB(db);
  return cliente;
}

function deleteCliente(id) {
  const db = getDB();
  db.clientes = db.clientes.filter(c => c.id != id);
  saveDB(db);
}

function getClienteById(id) {
  const clientes = getClientes();
  return clientes.find(c => c.id == id);
}

// ================= PRODUTOS =================
function getProdutos() {
  return getDB().produtos;
}

function createProduto(produto) {
  const db = getDB();
  const novo = {
    id: Date.now(),
    nome: produto.nome,
    preco: parseFloat(produto.preco) || 0
  };
  db.produtos.push(novo);
  saveDB(db);
  return novo;
}

// ================= PEDIDOS =================
function getPedidos() {
  return getDB().pedidos;
}

function createPedido(pedido) {
  const db = getDB();
  const novo = {
    id: Date.now(),
    clienteId: pedido.clienteId || null,
    cliente: pedido.cliente || "Sem nome",
    itens: pedido.itens || [],
    total: parseFloat(pedido.total) || 0,
    status: pedido.status || "Pendente",
    data: pedido.data || new Date().toISOString().split("T")[0]
  };
  db.pedidos.push(novo);
  saveDB(db);
  return novo;
}

function updateStatus(id) {
  const db = getDB();
  const pedido = db.pedidos.find(p => p.id == id);
  if (!pedido) return;
  if (pedido.status === "Pendente") pedido.status = "Enviado";
  else if (pedido.status === "Enviado") pedido.status = "Entregue";
  else pedido.status = "Pendente";
  saveDB(db);
}

// ================= DASHBOARD =================
function getMetricas(lista = null) {
  const pedidos = lista || getPedidos();
  const total = pedidos.length;
  const faturamento = pedidos.reduce((acc, p) => acc + (parseFloat(p.total) || 0), 0);
  const pendentes = pedidos.filter(p => p.status === "Pendente").length;
  const enviados = pedidos.filter(p => p.status === "Enviado").length;
  const entregues = pedidos.filter(p => p.status === "Entregue").length;
  return { total, faturamento, pendentes, enviados, entregues };
}

// ================= FORMATAÇÕES =================
function formatarData(data) {
  if (!data) return "-";
  const d = new Date(data);
  return d.toLocaleDateString("pt-BR");
}

function formatarTelefone(telefone) {
  if (!telefone) return "Sem telefone";
  const nums = telefone.replace(/\D/g, "");
  if (nums.length === 11) return `(${nums.slice(0, 2)}) ${nums.slice(2, 7)}-${nums.slice(7)}`;
  if (nums.length === 10) return `(${nums.slice(0, 2)}) ${nums.slice(2, 6)}-${nums.slice(6)}`;
  return telefone;
}

function formatarDocumento(valor) {
  if (!valor) return "";
  const v = valor.replace(/\D/g, ""); 
  if (v.length <= 11) {
    return v.replace(/(\d{3})(\d)/, "$1.$2").replace(/(\d{3})(\d)/, "$1.$2").replace(/(\d{3})(\d{1,2})$/, "$1-$2");
  } else {
    return v.replace(/^(\d{2})(\d)/, "$1.$2").replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3").replace(/\.(\d{3})(\d)/, ".$1/$2").replace(/(\d{4})(\d)/, "$1-$2");
  }
}