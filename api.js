// ================= BANCO DE DADOS (LocalStorage) =================
const FILIAIS_PADRAO = [
  { id: "matriz-sp", nome: "Matriz", cidade: "Vila Maria", estado: "SP", distanciaKm: 0 },
  { id: "cajamar-sp", nome: "Cajamar", cidade: "Cajamar", estado: "SP", distanciaKm: 42 },
  { id: "extrema-mg", nome: "Extrema", cidade: "Extrema", estado: "MG", distanciaKm: 118 },
  { id: "curitiba-pr", nome: "Curitiba", cidade: "Curitiba", estado: "PR", distanciaKm: 415 },
  { id: "recife-pe", nome: "Recife", cidade: "Recife", estado: "PE", distanciaKm: 2660 },
  { id: "goiania-go", nome: "Goiânia", cidade: "Goiânia", estado: "GO", distanciaKm: 940 },
  { id: "salvador-ba", nome: "Salvador", cidade: "Salvador", estado: "BA", distanciaKm: 1960 },
  { id: "manaus-am", nome: "Manaus", cidade: "Manaus", estado: "AM", distanciaKm: 3890 },
];

function getDefaultDB() {
  return {
    clientes: [],
    produtos: [],
    pedidos: [],
    funcionarios: [],
    entregas: [],
    armazens: [],
    pagamentos: [],
    agregados: [],
    notasFiscais: [],
    filiais: FILIAIS_PADRAO,
    transferencias: [],
  };
}

function getDB() {
  const salvo = JSON.parse(localStorage.getItem("db")) || {};
  const db = { ...getDefaultDB(), ...salvo };
  db.filiais = FILIAIS_PADRAO.map((filial) => {
    const existente = (salvo.filiais || []).find((f) => f.id === filial.id);
    return { ...filial, ...(existente || {}) };
  });
  db.transferencias = db.transferencias || [];
  return db;
}

function saveDB(db) {
  localStorage.setItem("db", JSON.stringify({ ...getDefaultDB(), ...db }));
}

// ================= FILIAIS / HUBS =================
function getFiliais() {
  return getDB().filiais;
}

function getFilialById(id) {
  return getFiliais().find((f) => f.id === id);
}

function getTransferencias() {
  return getDB().transferencias;
}

function createTransferencia(dados) {
  const db = getDB();
  const origem = getFilialById(dados.origemId);
  const destino = getFilialById(dados.destinoId);
  const nova = {
    id: Date.now(),
    origemId: dados.origemId,
    origemNome: origem ? formatarFilial(origem) : "",
    destinoId: dados.destinoId,
    destinoNome: destino ? formatarFilial(destino) : "",
    pedidoId: dados.pedidoId || "",
    responsavel: dados.responsavel || "",
    observacao: dados.observacao || "",
    data: new Date().toISOString(),
    status: "Em transferência",
  };
  db.transferencias.push(nova);
  saveDB(db);
  return nova;
}

function formatarFilial(filial) {
  return filial ? `${filial.nome}: ${filial.cidade}/${filial.estado}` : "—";
}

function contarPedidosPorFilial() {
  const pedidos = getPedidos();
  return getFiliais().map((filial) => ({
    ...filial,
    pedidos: pedidos.filter((p) => p.filialId === filial.id).length,
    receita: pedidos
      .filter((p) => p.filialId === filial.id)
      .reduce((total, p) => total + (parseFloat(p.freteFinal) || 0), 0),
  }));
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
  const novo = { id: Date.now(), estado: dados.estado || "", ...dados };
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

// ================= PRODUTOS =================
function getProdutos() {
  return getDB().produtos;
}
function getProdutoById(id) {
  return getDB().produtos.find((p) => p.id == id);
}

function gerarSKU() {
  const letras = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const numeros = "0123456789";
  let sku = "";
  for (let i = 0; i < 4; i++) sku += letras[Math.floor(Math.random() * letras.length)];
  for (let i = 0; i < 3; i++) sku += numeros[Math.floor(Math.random() * numeros.length)];
  return sku;
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

// ================= PEDIDOS / FRETE =================
function getPedidos() {
  return getDB().pedidos;
}

function calcularDistancia(filialId, cliente) {
  const filial = getFilialById(filialId) || FILIAIS_PADRAO[0];
  const estadoCliente = (cliente?.estado || "").toUpperCase();
  const cidadeCliente = (cliente?.cidade || "").toLowerCase();

  if (estadoCliente && estadoCliente !== filial.estado) return Math.max(filial.distanciaKm, 80);
  if (cidadeCliente && cidadeCliente.includes(filial.cidade.toLowerCase())) return 12;
  if (estadoCliente === filial.estado) return filial.id === "matriz-sp" ? 28 : 45;
  return filial.distanciaKm || 60;
}

function calcularFrete(dados, cliente) {
  const pesoReal = parseFloat(dados.pesoReal) || 0;
  const comprimento = parseFloat(dados.comprimento) || 0;
  const largura = parseFloat(dados.largura) || 0;
  const altura = parseFloat(dados.altura) || 0;
  const pesoCubado = (comprimento * largura * altura) / 6000;
  const pesoTaxado = Math.max(pesoReal, pesoCubado);
  const freteBase = pesoTaxado * 4.5;
  const filial = getFilialById(dados.filialId);
  const distanciaKm = calcularDistancia(dados.filialId, cliente);
  const outroEstado = Boolean(cliente?.estado && filial && cliente.estado.toUpperCase() !== filial.estado);
  const adicionais = [];

  if (distanciaKm > 35 || outroEstado) adicionais.push("Distância acima de 35km ou outro estado");
  if (dados.pedagio) adicionais.push("Pedágio");
  if (dados.taxaRisco) adicionais.push("Taxa de risco");
  if (dados.seguro) adicionais.push("Seguro");
  if (["Frágil", "Perigosa"].includes(dados.tipoCarga)) adicionais.push(`Carga ${dados.tipoCarga.toLowerCase()}`);

  const percentualAdicional = adicionais.length * 0.025;
  const valorAdicionais = freteBase * percentualAdicional;
  const subtotal = freteBase + valorAdicionais;
  const imposto = subtotal * 0.035;
  const freteFinal = subtotal + imposto;

  return {
    pesoReal,
    comprimento,
    largura,
    altura,
    pesoCubado,
    pesoTaxado,
    freteBase,
    percentualAdicional,
    valorAdicionais,
    imposto,
    freteFinal,
    distanciaKm,
    outroEstado,
    adicionais,
    tipoCarga: dados.tipoCarga || "Normal",
    pedagio: Boolean(dados.pedagio),
    taxaRisco: Boolean(dados.taxaRisco),
    seguro: Boolean(dados.seguro),
  };
}

function createPedido(dados) {
  const db = getDB();
  const cliente = db.clientes.find((c) => c.id == dados.clienteId);
  const filial = getFilialById(dados.filialId) || FILIAIS_PADRAO[0];
  const idPedido = db.pedidos.length ? Math.max(...db.pedidos.map((p) => Number(p.id) || 0)) + 1 : 1;
  const frete = calcularFrete({ ...dados, filialId: filial.id }, cliente);

  if (dados.itens && Array.isArray(dados.itens)) {
    dados.itens.forEach(function (item) {
      const nome = (item.produto || "").trim();
      if (!nome) return;
      const existe = db.produtos.find((p) => p.nome.toLowerCase() === nome.toLowerCase());
      if (!existe) {
        db.produtos.push({
          id: Date.now() + Math.random(),
          nome,
          sku: gerarSKU(),
          pedidoOrigemId: idPedido,
          filialId: filial.id,
          filialNome: formatarFilial(filial),
          codigoBarras: "",
          precoVenda: parseFloat(item.preco) || 0,
          unidade: "UN",
          categoria: "",
          peso: frete.pesoReal || null,
          volume: frete.pesoCubado || null,
          descricao: "",
          situacao: "Ativo",
        });
      }
    });
  }

  const novo = {
    id: idPedido,
    dataPedido: dados.dataPedido || new Date().toISOString().split("T")[0],
    clienteId: dados.clienteId,
    clienteNome: dados.clienteNome,
    enderecoEntrega: dados.enderecoEntrega || montarEnderecoCliente(cliente),
    filialId: filial.id,
    filialNome: formatarFilial(filial),
    idFuncionario: dados.idFuncionario || null,
    itens: dados.itens,
    totalProdutos: dados.total || 0,
    total: frete.freteFinal,
    receitaFrete: frete.freteFinal,
    freteFinal: frete.freteFinal,
    frete,
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
    const cliente = db.clientes.find((c) => c.id == (dados.clienteId || db.pedidos[i].clienteId));
    const filialId = dados.filialId || db.pedidos[i].filialId || FILIAIS_PADRAO[0].id;
    const frete = calcularFrete({ ...db.pedidos[i].frete, ...dados, filialId }, cliente);
    db.pedidos[i] = {
      ...db.pedidos[i],
      ...dados,
      filialId,
      filialNome: formatarFilial(getFilialById(filialId)),
      enderecoEntrega: dados.enderecoEntrega || db.pedidos[i].enderecoEntrega || montarEnderecoCliente(cliente),
      total: frete.freteFinal,
      receitaFrete: frete.freteFinal,
      freteFinal: frete.freteFinal,
      frete,
    };
    saveDB(db);
  }
}
function deletePedido(id) {
  const db = getDB();
  db.pedidos = db.pedidos.filter((p) => p.id != id);
  saveDB(db);
}

function montarEnderecoCliente(cliente) {
  if (!cliente) return "";
  const partes = [
    cliente.rua,
    cliente.numero ? `nº ${cliente.numero}` : "",
    cliente.bairro,
    cliente.cidade,
    cliente.estado,
  ].filter(Boolean);
  return partes.join(", ");
}

// ================= AGREGADOS =================
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
    rastreador: dados.rastreador || dados.rastrador || "",
    rastrador: dados.rastreador || dados.rastrador || "",
    telefone: dados.telefone || "",
    situacao: dados.situacao || "Ativo",
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
  const filial = getFilialById(dados.filialId);
  const novo = {
    id: Date.now(),
    nome: dados.nome,
    email: dados.email || "",
    telefone: dados.telefone || "",
    cpf: dados.cpf || "",
    contratacao: dados.contratacao || "",
    cargo: dados.cargo || "",
    cnh: dados.cnh || "",
    filialId: dados.filialId,
    filialNome: formatarFilial(filial),
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
    const filial = getFilialById(dados.filialId || db.funcionarios[i].filialId);
    db.funcionarios[i] = {
      ...db.funcionarios[i],
      ...dados,
      filialNome: formatarFilial(filial),
    };
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
  const pi = db.pedidos.findIndex((p) => p.id == dados.idPedido);
  if (pi !== -1) {
    db.pedidos[pi].status = "Enviado";
    db.pedidos[pi].situacao = "Enviado";
  }
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
  return "BR" + Math.random().toString(36).substring(2, 10).toUpperCase() + "SL";
}
function biparPedido(idPedido, idAgregado) {
  const db = getDB();
  const pi = db.pedidos.findIndex((p) => p.id == idPedido);
  if (pi === -1) return { ok: false, msg: "Pedido não encontrado" };
  if (db.pedidos[pi].status !== "Pendente") return { ok: false, msg: "Pedido já processado" };
  const entrega = {
    id: Date.now(),
    idPedido,
    idAgregado,
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
  return { ok: true, entrega, pedido: db.pedidos[pi] };
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
    dataPagamento: dados.dataPagamento || new Date().toISOString().split("T")[0],
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
  return Array.from({ length: 44 }, () => Math.floor(Math.random() * 10)).join("");
}

// ================= UTILITÁRIOS =================
function formatarMoeda(v) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(v || 0);
}
function formatarData(d) {
  if (!d) return "—";
  if (/^\d{4}-\d{2}-\d{2}$/.test(d)) {
    const [ano, mes, dia] = d.split("-");
    return `${dia}/${mes}/${ano}`;
  }
  return new Date(d).toLocaleDateString("pt-BR");
}
function formatarDocumento(v) {
  if (!v) return "—";
  v = v.replace(/\D/g, "");
  if (v.length <= 11) return v.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
  return v.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, "$1.$2.$3/$4-$5");
}

