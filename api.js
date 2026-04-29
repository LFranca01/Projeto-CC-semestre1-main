// ================= BANCO DE DADOS (LocalStorage) =================
function getDB() {
  return (
    JSON.parse(localStorage.getItem("db")) || {
      clientes: [],
      produtos: [],
      pedidos: [],
      funcionarios: [],
      entregas: [],
      armazens: [],
      pagamentos: [],
      agregados: [],
      notasFiscais: [],
    }
  );
}
function saveDB(db) {
  localStorage.setItem("db", JSON.stringify(db));
}

// ================= CLIENTES =================
function getClientes() {
  return getDB().clientes;
}
function getClienteById(id) {
  return getDB().clientes.find((c) => c.id == id);
}

function createCliente(dados) {
  const db = getDB();
  const novo = { id: Date.now(), ...dados };
  db.clientes.push(novo);
  saveDB(db);
  return novo;
}
function updateCliente(id, dados) {
  const db = getDB();
  const i = db.clientes.findIndex((c) => c.id == id);
  if (i !== -1) {
    db.clientes[i] = { ...db.clientes[i], ...dados };
    saveDB(db);
  }
}
function deleteCliente(id) {
  const db = getDB();
  db.clientes = db.clientes.filter((c) => c.id != id);
  saveDB(db);
}

// ================= PRODUTOS (criados via pedido) =================
function getProdutos() {
  return getDB().produtos;
}
function getProdutoById(id) {
  return getDB().produtos.find((p) => p.id == id);
}

function gerarSKU() {
  const l = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const n = "0123456789";
  let s = "";
  for (let i = 0; i < 4; i++) s += l[Math.floor(Math.random() * l.length)];
  for (let i = 0; i < 3; i++) s += n[Math.floor(Math.random() * n.length)];
  return s;
}

function updateProduto(id, dados) {
  const db = getDB();
  const i = db.produtos.findIndex((p) => p.id == id);
  if (i !== -1) {
    db.produtos[i] = { ...db.produtos[i], ...dados };
    saveDB(db);
  }
}
function deleteProduto(id) {
  const db = getDB();
  db.produtos = db.produtos.filter((p) => p.id != id);
  saveDB(db);
}

// ================= PEDIDOS =================
function getPedidos() {
  return getDB().pedidos;
}

function createPedido(dados) {
  const db = getDB();
  // Registra produtos novos com SKU automático
  if (dados.itens && Array.isArray(dados.itens)) {
    dados.itens.forEach(function (item) {
      const nome = (item.produto || "").trim();
      if (!nome) return;
      const existe = db.produtos.find(
        (p) => p.nome.toLowerCase() === nome.toLowerCase(),
      );
      if (!existe) {
        db.produtos.push({
          id: Date.now() + Math.random(),
          nome: nome,
          sku: gerarSKU(),
          codigoBarras: "",
          precoVenda: parseFloat(item.preco) || 0,
          unidade: "UN",
          categoria: "",
          peso: null,
          volume: null,
          descricao: "",
          situacao: "Ativo",
        });
      }
    });
  }
  const novo = {
    id: db.pedidos.length + 1,
    dataPedido: new Date().toISOString(),
    clienteId: dados.clienteId,
    clienteNome: dados.clienteNome,
    idFuncionario: dados.idFuncionario || null,
    itens: dados.itens,
    total: dados.total,
    observacao: dados.observacao || "",
    status: "Pendente",
    situacao: "Pendente",
  };
  db.pedidos.push(novo);
  saveDB(db);
  return novo;
}

function updatePedido(id, dados) {
  const db = getDB();
  const i = db.pedidos.findIndex((p) => p.id == id);
  if (i !== -1) {
    db.pedidos[i] = { ...db.pedidos[i], ...dados };
    saveDB(db);
  }
}
function deletePedido(id) {
  const db = getDB();
  db.pedidos = db.pedidos.filter((p) => p.id != id);
  saveDB(db);
}

// ================= AGREGADOS (motoristas parceiros) =================
function getAgregados() {
  return getDB().agregados;
}
function getAgregadoById(id) {
  return getDB().agregados.find((a) => a.id == id);
}

function createAgregado(dados) {
  const db = getDB();
  const novo = {
    id: Date.now(),
    nome: dados.nome,
    placaVei: dados.placaVei || "",
    modeloVei: dados.modeloVei || "",
    quantiVei: parseInt(dados.quantiVei) || 1,
    tipoVei: dados.tipoVei || "",
    cnh: dados.cnh || "",
    rastrador: dados.rastrador || "",
    telefone: dados.telefone || "",
    situacao: "Ativo",
  };
  db.agregados.push(novo);
  saveDB(db);
  return novo;
}
function updateAgregado(id, dados) {
  const db = getDB();
  const i = db.agregados.findIndex((a) => a.id == id);
  if (i !== -1) {
    db.agregados[i] = { ...db.agregados[i], ...dados };
    saveDB(db);
  }
}
function deleteAgregado(id) {
  const db = getDB();
  db.agregados = db.agregados.filter((a) => a.id != id);
  saveDB(db);
}

// ================= FUNCIONÁRIOS =================
function getFuncionarios() {
  return getDB().funcionarios;
}
function getFuncionarioById(id) {
  return getDB().funcionarios.find((f) => f.id == id);
}

function createFuncionario(dados) {
  const db = getDB();
  const novo = {
    id: Date.now(),
    nome: dados.nome,
    email: dados.email || "",
    telefone: dados.telefone || "",
    cpf: dados.cpf || "",
    contratacao: dados.contratacao || "",
    cargo: dados.cargo || "",
    salario: parseFloat(dados.salario) || 0,
    situacao: dados.situacao || "Ativo",
  };
  db.funcionarios.push(novo);
  saveDB(db);
  return novo;
}
function updateFuncionario(id, dados) {
  const db = getDB();
  const i = db.funcionarios.findIndex((f) => f.id == id);
  if (i !== -1) {
    db.funcionarios[i] = { ...db.funcionarios[i], ...dados };
    saveDB(db);
  }
}
function deleteFuncionario(id) {
  const db = getDB();
  db.funcionarios = db.funcionarios.filter((f) => f.id != id);
  saveDB(db);
}

// ================= ENTREGAS =================
function getEntregas() {
  return getDB().entregas;
}

function createEntrega(dados) {
  const db = getDB();
  const novo = {
    id: Date.now(),
    idPedido: dados.idPedido,
    idAgregado: dados.idAgregado || null,
    dataSaida: dados.dataSaida || new Date().toISOString(),
    dataPrevista: dados.dataPrevista || "",
    dataEntrega: null,
    codRastreio: dados.codRastreio || gerarRastreio(),
    situacao: "Em Trânsito",
  };
  // Muda status do pedido
  const pi = db.pedidos.findIndex((p) => p.id == dados.idPedido);
  if (pi !== -1) db.pedidos[pi].status = "Enviado";
  db.entregas.push(novo);
  saveDB(db);
  return novo;
}
function updateEntrega(id, dados) {
  const db = getDB();
  const i = db.entregas.findIndex((e) => e.id == id);
  if (i !== -1) {
    db.entregas[i] = { ...db.entregas[i], ...dados };
    saveDB(db);
  }
}
function deleteEntrega(id) {
  const db = getDB();
  db.entregas = db.entregas.filter((e) => e.id != id);
  saveDB(db);
}
function gerarRastreio() {
  return (
    "BR" + Math.random().toString(36).substring(2, 10).toUpperCase() + "SL"
  );
}
// Bipagem do pedido pelo agregado
function biparPedido(idPedido, idAgregado) {
  const db = getDB();
  const pi = db.pedidos.findIndex((p) => p.id == idPedido);
  if (pi === -1) return { ok: false, msg: "Pedido não encontrado" };
  if (db.pedidos[pi].status !== "Pendente")
    return { ok: false, msg: "Pedido já processado" };
  // Cria entrega
  const entrega = {
    id: Date.now(),
    idPedido: idPedido,
    idAgregado: idAgregado,
    dataSaida: new Date().toISOString(),
    dataPrevista: "",
    dataEntrega: null,
    codRastreio: gerarRastreio(),
    situacao: "Em Trânsito",
  };
  db.pedidos[pi].status = "Enviado";
  db.pedidos[pi].situacao = "Enviado";
  db.entregas.push(entrega);
  saveDB(db);
  return { ok: true, entrega: entrega, pedido: db.pedidos[pi] };
}

// ================= PAGAMENTOS =================
function getPagamentos() {
  return getDB().pagamentos;
}

function createPagamento(dados) {
  const db = getDB();
  const novo = {
    id: Date.now(),
    idPedido: dados.idPedido,
    valor: parseFloat(dados.valor) || 0,
    dataPagamento:
      dados.dataPagamento || new Date().toISOString().split("T")[0],
    metodo: dados.metodo || "Pix",
    situacao: dados.situacao || "Pago",
  };
  db.pagamentos.push(novo);
  saveDB(db);
  return novo;
}
function updatePagamento(id, dados) {
  const db = getDB();
  const i = db.pagamentos.findIndex((p) => p.id == id);
  if (i !== -1) {
    db.pagamentos[i] = { ...db.pagamentos[i], ...dados };
    saveDB(db);
  }
}
function deletePagamento(id) {
  const db = getDB();
  db.pagamentos = db.pagamentos.filter((p) => p.id != id);
  saveDB(db);
}
function getSaldoTotal() {
  return getDB()
    .pagamentos.filter((p) => p.situacao === "Pago")
    .reduce((a, p) => a + p.valor, 0);
}

// ================= NOTAS FISCAIS =================
function getNotasFiscais() {
  return getDB().notasFiscais;
}

function createNotaFiscal(dados) {
  const db = getDB();
  const novo = {
    id: Date.now(),
    idPedido: dados.idPedido,
    numero: "NF-" + String(db.notasFiscais.length + 1).padStart(5, "0"),
    serie: dados.serie || "A1",
    dataEmissao: new Date().toISOString(),
    valor: parseFloat(dados.valor) || 0,
    chaveAcesso: gerarChaveNF(),
    email: dados.email || "",
    cidade: dados.cidade || "",
    estado: dados.estado || "",
    prazoEntrega: parseInt(dados.prazoEntrega) || 3,
    situacao: "Emitida",
  };
  db.notasFiscais.push(novo);
  saveDB(db);
  return novo;
}
function gerarChaveNF() {
  return Array.from({ length: 44 }, () => Math.floor(Math.random() * 10)).join(
    "",
  );
}

// ================= ARMAZÉNS =================
function getArmazens() {
  return getDB().armazens;
}
function updateEstoque(dados) {
  const db = getDB();
  const i = db.armazens.findIndex(
    (a) => a.idFilial == dados.idFilial && a.idProduto == dados.idProduto,
  );
  if (i !== -1) {
    db.armazens[i] = { ...db.armazens[i], ...dados };
  } else {
    db.armazens.push({ id: Date.now(), ...dados });
  }
  saveDB(db);
}

// ================= UTILITÁRIOS =================
function formatarMoeda(v) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(v || 0);
}
function formatarData(d) {
  return d ? new Date(d).toLocaleDateString("pt-BR") : "—";
}
function formatarDocumento(v) {
  if (!v) return "—";
  v = v.replace(/\D/g, "");
  if (v.length <= 11)
    return v.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
  return v.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, "$1.$2.$3/$4-$5");
}
