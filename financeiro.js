// ================= FINANCEIRO MODULE =================

let tabAtiva = "pagamentos";
let _chartFluxo = null;

function _dataLocalFin(valor) {
  if (!valor) return null;
  const texto = String(valor);
  if (/^\d{4}-\d{2}-\d{2}$/.test(texto)) {
    const [ano, mes, dia] = texto.split("-").map(Number);
    return new Date(ano, mes - 1, dia);
  }
  const data = new Date(texto);
  return Number.isNaN(data.getTime()) ? null : data;
}

function _diasFiltroFinanceiro() {
  const valor = document.getElementById("filtro-dias-fin")?.value || "30";
  return valor === "todos" ? null : parseInt(valor, 10);
}

function _pagamentosDoPeriodo() {
  const dias = _diasFiltroFinanceiro();
  const lista = getPagamentos();
  if (!dias) return lista;

  const hoje = new Date();
  hoje.setHours(23, 59, 59, 999);
  const inicio = new Date(hoje);
  inicio.setDate(inicio.getDate() - (dias - 1));
  inicio.setHours(0, 0, 0, 0);

  return lista.filter((p) => {
    const data = _dataLocalFin(p.dataPagamento);
    return data && data >= inicio && data <= hoje;
  });
}

function _totalFolhaMensal() {
  return getFuncionarios().reduce((total, f) => total + (parseFloat(f.salario) || 0), 0);
}

function _valorAtualDoPedido(idPedido, fallback) {
  const pedido = getPedidos().find((p) => p.id == idPedido);
  return parseFloat(pedido?.freteFinal ?? pedido?.receitaFrete ?? pedido?.total ?? fallback) || 0;
}

function _valorFinanceiroAtual(registro) {
  return _valorAtualDoPedido(registro.idPedido, registro.valor);
}

function _totalPago(lista) {
  return lista
    .filter((p) => p.situacao === "Pago")
    .reduce((total, p) => total + _valorFinanceiroAtual(p), 0);
}

function atualizarFinanceiro() {
  carregarStatsFinanceiro();
  renderPagamentos();
  renderCategorias();
  initChartFluxo();
}

function _avisoFin(msg, tipo) {
  if (typeof showToast === "function") showToast(msg, tipo);
  else alert(msg);
}

function setTab(tab, el) {
  tabAtiva = tab;
  document.querySelectorAll(".fin-tab").forEach((b) => b.classList.remove("ativo"));
  el.classList.add("ativo");
  const tp = document.getElementById("tab-pagamentos");
  const tn = document.getElementById("tab-notas");
  if (tab === "pagamentos") {
    tp.classList.remove("tab-hidden");
    tn.classList.add("tab-hidden");
    document.getElementById("btn-novo-pag").innerHTML =
      '<span class="material-icons-round">add</span><span>Pagamento</span>';
    document.getElementById("btn-novo-pag").onclick = abrirModalPagamento;
  } else {
    tp.classList.add("tab-hidden");
    tn.classList.remove("tab-hidden");
    document.getElementById("btn-novo-pag").innerHTML =
      '<span class="material-icons-round">add</span><span>Nova NF</span>';
    document.getElementById("btn-novo-pag").onclick = abrirModalNFAvancado;
    renderNotas();
  }
}

function carregarStatsFinanceiro() {
  const pags = _pagamentosDoPeriodo();
  const receitas = _totalPago(pags);
  // Estimativa simples: despesas = 60% das receitas (mock para o painel — visual)
  const despesas = (receitas * 0.45) + _totalFolhaMensal();
  const saldoLiquido = receitas - despesas;
  const _set = (id, v) => { const e = document.getElementById(id); if (e) e.innerText = v; };
  _set("stat-saldo", formatarMoeda(receitas));
  _set("stat-despesas", formatarMoeda(despesas));
  _set("stat-saldo-liquido", formatarMoeda(saldoLiquido));
}

function popularSelectPedidos() {
  const pedidos = getPedidos();
  const opts = pedidos
    .map((p) => `<option value="${esc(p.id)}">#${esc(p.id)} — ${esc(p.clienteNome) || "?"} — ${formatarMoeda(p.freteFinal || p.total)}</option>`)
    .join("");
  ["pag-pedido", "nf-pedido", "nf-rapido-pedido"].forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.innerHTML = opts || '<option value="">Nenhum pedido</option>';
  });
  const dataEl = document.getElementById("pag-data");
  if (dataEl) dataEl.value = new Date().toISOString().split("T")[0];
  const nfRapidoPedido = document.getElementById("nf-rapido-pedido");
  const nfRapidoValor = document.getElementById("nf-rapido-valor");
  if (nfRapidoPedido && nfRapidoValor) {
    nfRapidoPedido.setAttribute("onchange", "_preencherValorNFSelecionado('nf-rapido-pedido', 'nf-rapido-valor')");
    nfRapidoValor.readOnly = true;
    _preencherValorNFSelecionado("nf-rapido-pedido", "nf-rapido-valor");
  }
}

function abrirModalPagamento() {
  limparFormulario("modalPagamento");
  document.getElementById("pag-data").value = new Date().toISOString().split("T")[0];
  abrirModal("modalPagamento");
}

function abrirModalNFAvancado() {
  limparFormulario("modalNF");
  document.getElementById("nf-serie").value = "A1";
  document.getElementById("nf-prazo").value = "3";
  abrirModal("modalNF");
}

function renderPagamentos() {
  const lista = _pagamentosDoPeriodo();
  const tabela = document.getElementById("tabela-financeiro");
  if (!lista.length) {
    tabela.innerHTML = `<tr><td colspan="6" class="tabela-vazia">
    <span class="material-icons-round">payments</span>
    <p>Nenhum pagamento registrado.</p></td></tr>`;
    return;
  }
  tabela.innerHTML = lista
    .map((p) => {
      const situacao = p.situacao || "Pendente";
      const metodoLower = (p.metodo || "").toLowerCase();
      const valorAtual = _valorFinanceiroAtual(p);
      return `
  <tr data-status="${esc(situacao.toLowerCase())}" data-metodo="${esc(metodoLower)}" data-data="${esc(p.dataPagamento || "")}">
    <td class="td-bold">#${esc(p.idPedido)}</td>
    <td>${formatarData(p.dataPagamento)}</td>
    <td><span class="badge-metodo ${esc(metodoLower)}">${esc(p.metodo)}</span></td>
    <td class="td-valor">${formatarMoeda(valorAtual)}</td>
    <td><span class="status ${situacao === "Pago" ? "pago" : "pendente"}">${esc(situacao)}</span></td>
    <td>
      <button class="btn-icon danger" onclick="removerPagamento(${esc(p.id)})" aria-label="Remover"><span class="material-icons-round">delete</span></button>
    </td>
  </tr>`;
    })
    .join("");
}

function salvarPagamento() {
  const idPedido = document.getElementById("pag-pedido").value;
  const valor = parseFloat(document.getElementById("pag-valor").value);
  if (!idPedido || !valor) return _avisoFin("Pedido e valor são obrigatórios.", "error");
  createPagamento({
    idPedido, valor,
    dataPagamento: document.getElementById("pag-data").value,
    metodo: document.getElementById("pag-metodo").value,
    situacao: document.getElementById("pag-situacao").value,
  });
  _avisoFin("Pagamento registrado.", "success");
  fecharModal("modalPagamento");
  carregarStatsFinanceiro();
  renderPagamentos();
  renderCategorias();
  initChartFluxo();
}

function removerPagamento(id) {
  if (confirm("Remover este pagamento?")) {
    deletePagamento(id);
    _avisoFin("Pagamento removido.", "success");
    carregarStatsFinanceiro();
    renderPagamentos();
    renderCategorias();
    initChartFluxo();
  }
}

function renderNotas() {
  const busca = (document.getElementById("busca-nf")?.value || "").toLowerCase();
  const lista = getNotasFiscais().filter(
    (n) => !busca || n.numero.toLowerCase().includes(busca) || String(n.idPedido).includes(busca),
  );
  const tabela = document.getElementById("tabela-notas");
  if (!tabela) return;
  if (!lista.length) {
    tabela.innerHTML = `<tr><td colspan="7" class="tabela-vazia">
    <span class="material-icons-round">receipt_long</span>
    <p>Nenhuma nota fiscal emitida ainda.</p></td></tr>`;
    return;
  }
  tabela.innerHTML = lista
    .map((n) => `
  <tr>
    <td class="td-bold">${esc(n.numero)}</td>
    <td>#${esc(n.idPedido)}</td>
    <td>${formatarData(n.dataEmissao)}</td>
    <td class="td-valor">${formatarMoeda(n.valor)}</td>
    <td>${esc(n.cidade) || "—"}/${esc(n.estado) || "—"}</td>
    <td><span class="status ativo">${esc(n.situacao)}</span></td>
    <td>
      <button class="btn-icon" onclick="visualizarNF(${esc(n.id)})" aria-label="Visualizar"><span class="material-icons-round">visibility</span></button>
      <button class="btn-icon" onclick="imprimirNF(${esc(n.id)})" aria-label="Imprimir"><span class="material-icons-round">print</span></button>
    </td>
  </tr>`).join("");
}

function emitirNFRapida(e) {
  e.preventDefault();
  const idPedido = document.getElementById("nf-rapido-pedido").value;
  const valor = parseFloat(document.getElementById("nf-rapido-valor").value);
  if (!idPedido || !valor) return _avisoFin("Selecione pedido e informe valor.", "error");
  const pedido = getPedidos().find((p) => p.id == idPedido);
  const cliente = pedido ? getClienteById(pedido.clienteId) : null;
  createNotaFiscal({
    idPedido, valor, serie: "A1",
    email: cliente?.email || "",
    cidade: cliente?.cidade || "",
    estado: cliente?.estado || "",
    prazoEntrega: 3,
  });
  _avisoFin("NF-e emitida com sucesso.", "success");
  document.getElementById("nf-rapido-valor").value = "";
  renderNotas();
}

function emitirNF() {
  const idPedido = document.getElementById("nf-pedido").value;
  const valor = parseFloat(document.getElementById("nf-valor").value);
  if (!idPedido || !valor) return _avisoFin("Pedido e valor são obrigatórios.", "error");
  createNotaFiscal({
    idPedido, valor,
    serie: document.getElementById("nf-serie").value,
    email: document.getElementById("nf-email").value,
    cidade: document.getElementById("nf-cidade").value,
    estado: document.getElementById("nf-estado").value,
    prazoEntrega: document.getElementById("nf-prazo").value,
  });
  _avisoFin("Nota fiscal emitida.", "success");
  fecharModal("modalNF");
  renderNotas();
}

function _valorNFAtual(nf) {
  return _valorAtualDoPedido(nf.idPedido, nf.valor);
}

function _preencherValorNFSelecionado(selectId, inputId) {
  const idPedido = document.getElementById(selectId)?.value;
  const input = document.getElementById(inputId);
  if (!idPedido || !input) return;
  input.value = _valorAtualDoPedido(idPedido, 0).toFixed(2);
}

function popularSelectPedidos() {
  const pedidos = getPedidos();
  const opts = pedidos
    .map((p) => {
      const total = _valorAtualDoPedido(p.id, p.freteFinal || p.total);
      const pendente = _saldoPendentePedido(p.id);
      const status = pendente <= 0.009 ? "quitado" : `pendente ${formatarMoeda(pendente)}`;
      return `<option value="${esc(p.id)}">#${esc(p.id)} - ${esc(p.clienteNome) || "?"} - ${formatarMoeda(total)} (${status})</option>`;
    })
    .join("");
  ["pag-pedido", "nf-pedido", "nf-rapido-pedido"].forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.innerHTML = opts || '<option value="">Nenhum pedido</option>';
  });

  const dataEl = document.getElementById("pag-data");
  if (dataEl) dataEl.value = new Date().toISOString().split("T")[0];

  const nfRapidoPedido = document.getElementById("nf-rapido-pedido");
  const nfRapidoValor = document.getElementById("nf-rapido-valor");
  if (nfRapidoPedido && nfRapidoValor) {
    nfRapidoPedido.setAttribute("onchange", "_preencherValorNFSelecionado('nf-rapido-pedido', 'nf-rapido-valor')");
    nfRapidoValor.readOnly = true;
    _preencherValorNFSelecionado("nf-rapido-pedido", "nf-rapido-valor");
  }
}

function abrirModalNFAvancado() {
  limparFormulario("modalNF");
  document.getElementById("nf-serie").value = "A1";
  document.getElementById("nf-prazo").value = "3";
  const nfPedido = document.getElementById("nf-pedido");
  if (nfPedido) nfPedido.setAttribute("onchange", "_preencherValorNFSelecionado('nf-pedido', 'nf-valor')");
  const nfValor = document.getElementById("nf-valor");
  if (nfValor) nfValor.readOnly = true;
  _preencherValorNFSelecionado("nf-pedido", "nf-valor");
  abrirModal("modalNF");
}

function initChartFluxo() {
  if (typeof Chart === "undefined") return;
  if (_chartFluxo) { try { _chartFluxo.destroy(); } catch (e) {} _chartFluxo = null; }
  const ctx = document.getElementById("chartFluxo");
  if (!ctx) return;

  const hoje = new Date();
  hoje.setHours(23, 59, 59, 999);
  const diasFiltro = _diasFiltroFinanceiro() || 30;
  const diasGrafico = Math.min(diasFiltro, 30);
  const labels = _labelsFluxoFinanceiro(diasGrafico, hoje);
  const entradas = new Array(diasGrafico).fill(0);
  const saidas = new Array(diasGrafico).fill(0);

  getPagamentos().forEach((p) => {
    const data = _dataLocalFin(p.dataPagamento);
    if (!data) return;
    const diff = Math.floor((hoje - data) / (1000 * 60 * 60 * 24));
    if (diff < 0 || diff >= diasGrafico) return;
    const idx = diasGrafico - 1 - diff;
    const valor = _valorPagoRegistro(p);
    if (p.situacao === "Pago") entradas[idx] += valor;
    else saidas[idx] += valor;
  });

  Chart.defaults.font.family = "'Josefin Sans', sans-serif";
  Chart.defaults.color = _isDarkMode() ? "#cbd5e1" : "#475569";

  _chartFluxo = new Chart(ctx.getContext("2d"), {
    type: "bar",
    data: {
      labels,
      datasets: [
        { label: "Entradas", data: entradas, backgroundColor: "#10b981", borderRadius: 6, maxBarThickness: 32 },
        { label: "Pendentes", data: saidas, backgroundColor: "#ef4444", borderRadius: 6, maxBarThickness: 32 },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { position: "bottom", labels: { boxWidth: 12, padding: 14, usePointStyle: true } } },
      scales: {
        x: { grid: { display: false } },
        y: {
          beginAtZero: true,
          ticks: {
            stepSize: 1000,
            callback: (v) => "R$ " + Number(v).toLocaleString("pt-BR", { maximumFractionDigits: 0 }),
          },
        },
      },
    },
  });
}

function renderNotas() {
  const busca = (document.getElementById("busca-nf")?.value || "").toLowerCase();
  const lista = getNotasFiscais().filter(
    (n) => !busca || n.numero.toLowerCase().includes(busca) || String(n.idPedido).includes(busca),
  );
  const tabela = document.getElementById("tabela-notas");
  if (!tabela) return;
  if (!lista.length) {
    tabela.innerHTML = `<tr><td colspan="7" class="tabela-vazia">
    <span class="material-icons-round">receipt_long</span>
    <p>Nenhuma nota fiscal emitida ainda.</p></td></tr>`;
    return;
  }
  tabela.innerHTML = lista
    .map((n) => `
  <tr>
    <td class="td-bold">${esc(n.numero)}</td>
    <td>#${esc(n.idPedido)}</td>
    <td>${formatarData(n.dataEmissao)}</td>
    <td class="td-valor">${formatarMoeda(_valorNFAtual(n))}</td>
    <td>${esc(n.cidade) || "-"} / ${esc(n.estado) || "-"}</td>
    <td><span class="status ativo">${esc(n.situacao)}</span></td>
    <td>
      <button class="btn-icon" onclick="visualizarNF(${esc(n.id)})" aria-label="Visualizar"><span class="material-icons-round">visibility</span></button>
      <button class="btn-icon" onclick="imprimirNF(${esc(n.id)})" aria-label="Imprimir"><span class="material-icons-round">print</span></button>
    </td>
  </tr>`)
    .join("");
}

function gerarHTMLNF(nf) {
  const pedido = getPedidos().find((p) => p.id == nf.idPedido);
  const itens = (pedido?.itens || [])
    .map((item) => `
      <tr>
        <td>${esc(item.produto)}</td>
        <td>${esc(item.qtd)}</td>
        <td>${formatarMoeda(item.preco)}</td>
      </tr>`)
    .join("");

  return `
<div class="nf-documento">
  <div class="nf-header">
    <h2>NOTA FISCAL ELETRONICA</h2>
    <div class="nf-numero">${esc(nf.numero)} - Serie ${esc(nf.serie)}</div>
  </div>
  <div class="nf-info-grid">
    <div class="nf-campo"><span>Data de Emissao</span><strong>${formatarData(nf.dataEmissao)}</strong></div>
    <div class="nf-campo"><span>Pedido</span><strong>#${esc(nf.idPedido)}</strong></div>
    <div class="nf-campo"><span>Cliente</span><strong>${esc(pedido?.clienteNome) || "-"}</strong></div>
    <div class="nf-campo"><span>Valor Total</span><strong>${formatarMoeda(_valorNFAtual(nf))}</strong></div>
    <div class="nf-campo"><span>Prazo de Entrega</span><strong>${esc(nf.prazoEntrega)} dias uteis</strong></div>
    <div class="nf-campo"><span>Cidade/UF</span><strong>${esc(nf.cidade) || "-"}/${esc(nf.estado) || "-"}</strong></div>
    <div class="nf-campo"><span>Email</span><strong>${esc(nf.email) || "-"}</strong></div>
    <div class="nf-campo"><span>Endereco</span><strong>${esc(pedido?.enderecoEntrega) || "-"}</strong></div>
  </div>
  ${itens ? `
  <div class="nf-itens">
    <h3>Itens do Pedido</h3>
    <table>
      <thead><tr><th>Produto</th><th>Qtd</th><th>Valor declarado</th></tr></thead>
      <tbody>${itens}</tbody>
    </table>
  </div>` : ""}
  <div class="nf-chave">
    <span>Chave de Acesso:</span>
    <code>${esc(nf.chaveAcesso)}</code>
  </div>
  <div class="nf-rodape">Documento gerado pelo sistema Serginho Leva Atras</div>
</div>`;
}

function imprimirRelatorio() {
  const pags = _pagamentosDoPeriodo();
  const total = formatarMoeda(_totalPago(pags));
  const linhas = pags
    .map((p) => `<tr><td>#${esc(p.idPedido)}</td><td>${formatarData(p.dataPagamento)}</td><td>${esc(p.metodo)}</td><td>${esc(p.tipo || "Sinal")}</td><td>${formatarMoeda(_valorPagoRegistro(p))}</td><td>${formatarMoeda(_saldoPendentePedido(p.idPedido))}</td><td>${esc(p.situacao)}</td></tr>`)
    .join("");
  const w = window.open("", "_blank");
  if (!w) return _avisoFin("Permita pop-ups para gerar o relatorio.", "error");
  w.document.write(`<!doctype html><html lang="pt-br">
<head><meta charset="utf-8"><title>Relatorio Financeiro</title>
<style>body{font-family:-apple-system,BlinkMacSystemFont,Segoe UI,sans-serif;padding:30px;color:#0f172a}
h2{color:#0f2942}h3{color:#475569;margin-top:20px}
table{border-collapse:collapse;width:100%;margin-top:8px}
th{background:#f1f5f9;text-align:left;padding:10px;font-size:13px;color:#475569;text-transform:uppercase;letter-spacing:.5px}
td{padding:8px 10px;font-size:13px;border-bottom:1px solid #e2e8f0}
.total{margin-top:20px;font-size:15px;font-weight:600}</style></head>
<body><h2>Relatorio Financeiro</h2><p>Gerado em ${new Date().toLocaleDateString("pt-BR")}</p>
<h3>Pagamentos (${pags.length} registros)</h3>
<table><thead><tr><th>Pedido</th><th>Data</th><th>Metodo</th><th>Tipo</th><th>Valor Pago</th><th>Pendente</th><th>Status</th></tr></thead>
<tbody>${linhas}</tbody></table>
<p class="total">Total pago no periodo: <strong>${total}</strong></p></body></html>`);
  w.document.close();
  w.print();
}

// ===== Regras finais de pagamento parcial / NF quitada =====
function _valorPagoRegistro(registro) {
  return parseFloat(registro?.valor) || 0;
}

function _valorNFAtual(nf) {
  return _valorAtualDoPedido(nf.idPedido, nf.valor);
}

function _totalPagoPedido(idPedido, ignorarPagamentoId) {
  return getPagamentos()
    .filter((p) => p.idPedido == idPedido && p.id != ignorarPagamentoId && p.situacao === "Pago")
    .reduce((total, p) => total + _valorPagoRegistro(p), 0);
}

function _saldoPendentePedido(idPedido, ignorarPagamentoId) {
  return Math.max(_valorAtualDoPedido(idPedido, 0) - _totalPagoPedido(idPedido, ignorarPagamentoId), 0);
}

function _pedidoQuitado(idPedido) {
  return _valorAtualDoPedido(idPedido, 0) > 0 && _saldoPendentePedido(idPedido) <= 0.009;
}

function _totalPago(lista) {
  return lista
    .filter((p) => p.situacao === "Pago")
    .reduce((total, p) => total + _valorPagoRegistro(p), 0);
}

function _garantirCamposPagamentoParcial() {
  const pedido = document.getElementById("pag-pedido");
  const valor = document.getElementById("pag-valor");
  if (!pedido || !valor || document.getElementById("pag-tipo")) return;
  pedido.setAttribute("onchange", "atualizarResumoPagamento()");
  const grupoValor = valor.closest(".filter-group");
  grupoValor.insertAdjacentHTML("beforebegin", `
    <div class="filter-group">
      <label>Tipo de pagamento</label>
      <select id="pag-tipo" class="form-control" onchange="atualizarResumoPagamento()">
        <option value="Sinal">Sinal</option>
        <option value="Complemento">Complemento</option>
        <option value="Quitacao">Quitacao</option>
      </select>
    </div>`);
  grupoValor.insertAdjacentHTML("afterend", `
    <div class="filter-group span-2">
      <span id="pag-resumo" class="page-subtitle"></span>
    </div>`);
}

function atualizarResumoPagamento() {
  const idPedido = document.getElementById("pag-pedido")?.value;
  const tipo = document.getElementById("pag-tipo")?.value;
  const valor = document.getElementById("pag-valor");
  const resumo = document.getElementById("pag-resumo");
  if (!idPedido || !resumo) return;
  const totalPedido = _valorAtualDoPedido(idPedido, 0);
  const totalPago = _totalPagoPedido(idPedido);
  const pendente = Math.max(totalPedido - totalPago, 0);
  resumo.innerText = `Total do pedido: ${formatarMoeda(totalPedido)} | Pago: ${formatarMoeda(totalPago)} | Pendente: ${formatarMoeda(pendente)}`;
  if (tipo === "Quitacao" && valor) valor.value = pendente.toFixed(2);
}

function _preencherValorNFSelecionado(selectId, inputId) {
  const idPedido = document.getElementById(selectId)?.value;
  const input = document.getElementById(inputId);
  if (!idPedido || !input) return;
  input.value = _valorAtualDoPedido(idPedido, 0).toFixed(2);
}

function popularSelectPedidos() {
  const pedidos = getPedidos();
  const opts = pedidos
    .map((p) => {
      const total = _valorAtualDoPedido(p.id, p.freteFinal || p.total);
      const pendente = _saldoPendentePedido(p.id);
      const status = pendente <= 0.009 ? "quitado" : `pendente ${formatarMoeda(pendente)}`;
      return `<option value="${esc(p.id)}">#${esc(p.id)} - ${esc(p.clienteNome) || "?"} - ${formatarMoeda(total)} (${status})</option>`;
    })
    .join("");
  ["pag-pedido", "nf-pedido", "nf-rapido-pedido"].forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.innerHTML = opts || '<option value="">Nenhum pedido</option>';
  });
  const dataEl = document.getElementById("pag-data");
  if (dataEl) dataEl.value = new Date().toISOString().split("T")[0];
  const nfRapidoPedido = document.getElementById("nf-rapido-pedido");
  const nfRapidoValor = document.getElementById("nf-rapido-valor");
  if (nfRapidoPedido && nfRapidoValor) {
    nfRapidoPedido.setAttribute("onchange", "_preencherValorNFSelecionado('nf-rapido-pedido', 'nf-rapido-valor')");
    nfRapidoValor.readOnly = true;
    _preencherValorNFSelecionado("nf-rapido-pedido", "nf-rapido-valor");
  }
}

function abrirModalPagamento() {
  limparFormulario("modalPagamento");
  _garantirCamposPagamentoParcial();
  document.getElementById("pag-data").value = new Date().toISOString().split("T")[0];
  const tipo = document.getElementById("pag-tipo");
  if (tipo) tipo.value = "Sinal";
  atualizarResumoPagamento();
  abrirModal("modalPagamento");
}

function abrirModalNFAvancado() {
  limparFormulario("modalNF");
  document.getElementById("nf-serie").value = "A1";
  document.getElementById("nf-prazo").value = "3";
  const nfPedido = document.getElementById("nf-pedido");
  if (nfPedido) nfPedido.setAttribute("onchange", "_preencherValorNFSelecionado('nf-pedido', 'nf-valor')");
  const nfValor = document.getElementById("nf-valor");
  if (nfValor) nfValor.readOnly = true;
  _preencherValorNFSelecionado("nf-pedido", "nf-valor");
  abrirModal("modalNF");
}

function renderPagamentos() {
  const lista = _pagamentosDoPeriodo();
  const tabela = document.getElementById("tabela-financeiro");
  if (!tabela) return;
  const thead = tabela.closest("table")?.querySelector("thead");
  if (thead) thead.innerHTML = "<tr><th>Pedido</th><th>Data</th><th>Metodo</th><th>Tipo</th><th>Valor Pago</th><th>Pendente</th><th>Status</th><th>Acoes</th></tr>";
  if (!lista.length) {
    tabela.innerHTML = `<tr><td colspan="8" class="tabela-vazia"><span class="material-icons-round">payments</span><p>Nenhum pagamento registrado.</p></td></tr>`;
    return;
  }
  tabela.innerHTML = lista
    .map((p) => {
      const situacao = p.situacao || "Pendente";
      const metodoLower = (p.metodo || "").toLowerCase();
      return `
  <tr data-status="${esc(situacao.toLowerCase())}" data-metodo="${esc(metodoLower)}" data-data="${esc(p.dataPagamento || "")}">
    <td class="td-bold">#${esc(p.idPedido)}</td>
    <td>${formatarData(p.dataPagamento)}</td>
    <td><span class="badge-metodo ${esc(metodoLower)}">${esc(p.metodo)}</span></td>
    <td>${esc(p.tipo || "Sinal")}</td>
    <td class="td-valor">${formatarMoeda(_valorPagoRegistro(p))}</td>
    <td class="td-valor">${formatarMoeda(_saldoPendentePedido(p.idPedido))}</td>
    <td><span class="status ${situacao === "Pago" ? "pago" : "pendente"}">${esc(situacao)}</span></td>
    <td><button class="btn-icon danger" onclick="removerPagamento(${esc(p.id)})" aria-label="Remover"><span class="material-icons-round">delete</span></button></td>
  </tr>`;
    })
    .join("");
}

function salvarPagamento() {
  const idPedido = document.getElementById("pag-pedido").value;
  const valor = parseFloat(document.getElementById("pag-valor").value);
  const tipo = document.getElementById("pag-tipo")?.value || "Sinal";
  if (!idPedido || !valor) return _avisoFin("Pedido e valor sao obrigatorios.", "error");
  const pendente = _saldoPendentePedido(idPedido);
  if (valor - pendente > 0.009) return _avisoFin(`Valor maior que o saldo pendente (${formatarMoeda(pendente)}).`, "error");
  createPagamento({
    idPedido,
    valor,
    tipo,
    dataPagamento: document.getElementById("pag-data").value,
    metodo: document.getElementById("pag-metodo").value,
    situacao: document.getElementById("pag-situacao").value,
  });
  _avisoFin(tipo === "Sinal" ? "Sinal registrado." : "Pagamento registrado.", "success");
  fecharModal("modalPagamento");
  popularSelectPedidos();
  carregarStatsFinanceiro();
  renderPagamentos();
  renderCategorias();
  initChartFluxo();
}

function _validarPedidoQuitadoParaNF(idPedido) {
  if (_pedidoQuitado(idPedido)) return true;
  _avisoFin(`NF so pode ser emitida apos pagamento total. Pendente: ${formatarMoeda(_saldoPendentePedido(idPedido))}.`, "error");
  return false;
}

function emitirNFRapida(e) {
  e.preventDefault();
  const idPedido = document.getElementById("nf-rapido-pedido").value;
  if (!idPedido || !_validarPedidoQuitadoParaNF(idPedido)) return;
  const pedido = getPedidos().find((p) => p.id == idPedido);
  const cliente = pedido ? getClienteById(pedido.clienteId) : null;
  createNotaFiscal({
    idPedido,
    valor: _valorAtualDoPedido(idPedido, 0),
    serie: "A1",
    email: cliente?.email || "",
    cidade: cliente?.cidade || "",
    estado: cliente?.estado || "",
    prazoEntrega: 3,
  });
  _avisoFin("NF-e emitida com sucesso.", "success");
  renderNotas();
}

function emitirNF() {
  const idPedido = document.getElementById("nf-pedido").value;
  if (!idPedido || !_validarPedidoQuitadoParaNF(idPedido)) return;
  createNotaFiscal({
    idPedido,
    valor: _valorAtualDoPedido(idPedido, 0),
    serie: document.getElementById("nf-serie").value,
    email: document.getElementById("nf-email").value,
    cidade: document.getElementById("nf-cidade").value,
    estado: document.getElementById("nf-estado").value,
    prazoEntrega: document.getElementById("nf-prazo").value,
  });
  _avisoFin("Nota fiscal emitida.", "success");
  fecharModal("modalNF");
  renderNotas();
}

function initChartFluxo() {
  if (typeof Chart === "undefined") return;
  if (_chartFluxo) { try { _chartFluxo.destroy(); } catch (e) {} _chartFluxo = null; }
  const ctx = document.getElementById("chartFluxo");
  if (!ctx) return;
  const hoje = new Date();
  hoje.setHours(23, 59, 59, 999);
  const diasGrafico = Math.min(_diasFiltroFinanceiro() || 30, 30);
  const labels = _labelsFluxoFinanceiro(diasGrafico, hoje);
  const entradas = new Array(diasGrafico).fill(0);
  const saidas = new Array(diasGrafico).fill(0);
  getPagamentos().forEach((p) => {
    const data = _dataLocalFin(p.dataPagamento);
    if (!data) return;
    const diff = Math.floor((hoje - data) / (1000 * 60 * 60 * 24));
    if (diff < 0 || diff >= diasGrafico) return;
    const idx = diasGrafico - 1 - diff;
    if (p.situacao === "Pago") entradas[idx] += _valorPagoRegistro(p);
    else saidas[idx] += _valorPagoRegistro(p);
  });
  Chart.defaults.font.family = "'Josefin Sans', sans-serif";
  Chart.defaults.color = _isDarkMode() ? "#cbd5e1" : "#475569";
  _chartFluxo = new Chart(ctx.getContext("2d"), {
    type: "bar",
    data: {
      labels,
      datasets: [
        { label: "Entradas", data: entradas, backgroundColor: "#10b981", borderRadius: 6, maxBarThickness: 32 },
        { label: "Pendentes", data: saidas, backgroundColor: "#ef4444", borderRadius: 6, maxBarThickness: 32 },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { position: "bottom", labels: { boxWidth: 12, padding: 14, usePointStyle: true } } },
      scales: {
        x: { grid: { display: false } },
        y: { beginAtZero: true, ticks: { stepSize: 1000, callback: (v) => "R$ " + Number(v).toLocaleString("pt-BR", { maximumFractionDigits: 0 }) } },
      },
    },
  });
}

function renderNotas() {
  const busca = (document.getElementById("busca-nf")?.value || "").toLowerCase();
  const lista = getNotasFiscais().filter((n) => !busca || n.numero.toLowerCase().includes(busca) || String(n.idPedido).includes(busca));
  const tabela = document.getElementById("tabela-notas");
  if (!tabela) return;
  if (!lista.length) {
    tabela.innerHTML = `<tr><td colspan="7" class="tabela-vazia"><span class="material-icons-round">receipt_long</span><p>Nenhuma nota fiscal emitida ainda.</p></td></tr>`;
    return;
  }
  tabela.innerHTML = lista.map((n) => `
  <tr>
    <td class="td-bold">${esc(n.numero)}</td>
    <td>#${esc(n.idPedido)}</td>
    <td>${formatarData(n.dataEmissao)}</td>
    <td class="td-valor">${formatarMoeda(_valorNFAtual(n))}</td>
    <td>${esc(n.cidade) || "-"} / ${esc(n.estado) || "-"}</td>
    <td><span class="status ativo">${esc(n.situacao)}</span></td>
    <td>
      <button class="btn-icon" onclick="visualizarNF(${esc(n.id)})" aria-label="Visualizar"><span class="material-icons-round">visibility</span></button>
      <button class="btn-icon" onclick="imprimirNF(${esc(n.id)})" aria-label="Imprimir"><span class="material-icons-round">print</span></button>
    </td>
  </tr>`).join("");
}

function gerarHTMLNF(nf) {
  const pedido = getPedidos().find((p) => p.id == nf.idPedido);
  const itens = (pedido?.itens || []).map((item) => `
      <tr><td>${esc(item.produto)}</td><td>${esc(item.qtd)}</td><td>${formatarMoeda(item.preco)}</td></tr>`).join("");
  return `
<div class="nf-documento">
  <div class="nf-header"><h2>NOTA FISCAL ELETRONICA</h2><div class="nf-numero">${esc(nf.numero)} - Serie ${esc(nf.serie)}</div></div>
  <div class="nf-info-grid">
    <div class="nf-campo"><span>Data de Emissao</span><strong>${formatarData(nf.dataEmissao)}</strong></div>
    <div class="nf-campo"><span>Pedido</span><strong>#${esc(nf.idPedido)}</strong></div>
    <div class="nf-campo"><span>Cliente</span><strong>${esc(pedido?.clienteNome) || "-"}</strong></div>
    <div class="nf-campo"><span>Valor Total</span><strong>${formatarMoeda(_valorNFAtual(nf))}</strong></div>
    <div class="nf-campo"><span>Prazo de Entrega</span><strong>${esc(nf.prazoEntrega)} dias uteis</strong></div>
    <div class="nf-campo"><span>Cidade/UF</span><strong>${esc(nf.cidade) || "-"}/${esc(nf.estado) || "-"}</strong></div>
    <div class="nf-campo"><span>Email</span><strong>${esc(nf.email) || "-"}</strong></div>
    <div class="nf-campo"><span>Endereco</span><strong>${esc(pedido?.enderecoEntrega) || "-"}</strong></div>
  </div>
  ${itens ? `<div class="nf-itens"><h3>Itens do Pedido</h3><table><thead><tr><th>Produto</th><th>Qtd</th><th>Valor declarado</th></tr></thead><tbody>${itens}</tbody></table></div>` : ""}
  <div class="nf-chave"><span>Chave de Acesso:</span><code>${esc(nf.chaveAcesso)}</code></div>
  <div class="nf-rodape">Documento gerado pelo sistema Serginho Leva Atras</div>
</div>`;
}

function imprimirRelatorio() {
  const pags = _pagamentosDoPeriodo();
  const total = formatarMoeda(_totalPago(pags));
  const linhas = pags.map((p) => `<tr><td>#${esc(p.idPedido)}</td><td>${formatarData(p.dataPagamento)}</td><td>${esc(p.metodo)}</td><td>${esc(p.tipo || "Sinal")}</td><td>${formatarMoeda(_valorPagoRegistro(p))}</td><td>${formatarMoeda(_saldoPendentePedido(p.idPedido))}</td><td>${esc(p.situacao)}</td></tr>`).join("");
  const w = window.open("", "_blank");
  if (!w) return _avisoFin("Permita pop-ups para gerar o relatorio.", "error");
  w.document.write(`<!doctype html><html lang="pt-br"><head><meta charset="utf-8"><title>Relatorio Financeiro</title>
<style>body{font-family:-apple-system,BlinkMacSystemFont,Segoe UI,sans-serif;padding:30px;color:#0f172a}h2{color:#0f2942}h3{color:#475569;margin-top:20px}table{border-collapse:collapse;width:100%;margin-top:8px}th{background:#f1f5f9;text-align:left;padding:10px;font-size:13px;color:#475569;text-transform:uppercase;letter-spacing:.5px}td{padding:8px 10px;font-size:13px;border-bottom:1px solid #e2e8f0}.total{margin-top:20px;font-size:15px;font-weight:600}</style></head>
<body><h2>Relatorio Financeiro</h2><p>Gerado em ${new Date().toLocaleDateString("pt-BR")}</p><h3>Pagamentos (${pags.length} registros)</h3>
<table><thead><tr><th>Pedido</th><th>Data</th><th>Metodo</th><th>Tipo</th><th>Valor Pago</th><th>Pendente</th><th>Status</th></tr></thead><tbody>${linhas}</tbody></table>
<p class="total">Total pago no periodo: <strong>${total}</strong></p></body></html>`);
  w.document.close();
  w.print();
}

function visualizarNF(id) {
  const nf = getNotasFiscais().find((n) => n.id == id);
  if (!nf) return;
  document.getElementById("nf-print-area").innerHTML = gerarHTMLNF(nf);
  abrirModal("modalNFView");
}

function imprimirNF(id) {
  visualizarNF(id);
  setTimeout(() => window.print(), 400);
}

function gerarHTMLNF(nf) {
  return `
<div class="nf-documento">
  <div class="nf-header">
    <h2>NOTA FISCAL ELETRÔNICA</h2>
    <div class="nf-numero">${esc(nf.numero)} — Série ${esc(nf.serie)}</div>
  </div>
  <div class="nf-info-grid">
    <div class="nf-campo"><span>Data de Emissão</span><strong>${formatarData(nf.dataEmissao)}</strong></div>
    <div class="nf-campo"><span>Pedido</span><strong>#${esc(nf.idPedido)}</strong></div>
    <div class="nf-campo"><span>Valor Total</span><strong>${formatarMoeda(nf.valor)}</strong></div>
    <div class="nf-campo"><span>Prazo de Entrega</span><strong>${esc(nf.prazoEntrega)} dias úteis</strong></div>
    <div class="nf-campo"><span>Cidade/UF</span><strong>${esc(nf.cidade) || "—"}/${esc(nf.estado) || "—"}</strong></div>
    <div class="nf-campo"><span>Email</span><strong>${esc(nf.email) || "—"}</strong></div>
  </div>
  <div class="nf-chave">
    <span>Chave de Acesso:</span>
    <code>${esc(nf.chaveAcesso)}</code>
  </div>
  <div class="nf-rodape">Documento gerado pelo sistema Serginho Leva Atrás</div>
</div>`;
}

// ============ Categorias (visual mock) ============
function renderCategorias() {
  const cont = document.getElementById("lista-categorias");
  if (!cont) return;
  const receitas = getSaldoTotal();
  const desp = receitas * 0.6;
  // Distribuição realista para um operador logístico
  const cats = [
    { nome: "Combustível", pct: 45, cor: "#0f2942" },
    { nome: "Manutenção Frota", pct: 28, cor: "#94a3b8" },
    { nome: "Folha de Pagamento", pct: 15, cor: "#64748b" },
    { nome: "Seguros e Taxas", pct: 12, cor: "#3b82f6" },
  ];
  cont.innerHTML = cats
    .map((c) => `
  <div class="category-item-row">
    <div class="category-item-header">
      <span class="name" style="display:inline-flex; align-items:center; gap:8px">
        <span style="width:8px; height:8px; border-radius:50%; background:${c.cor}; display:inline-block"></span>
        ${esc(c.nome)}
      </span>
      <span class="pct">${c.pct}%</span>
    </div>
    <div class="category-bar"><span style="width:${c.pct}%; background:${c.cor}"></span></div>
    <span class="value">${formatarMoeda(desp * (c.pct / 100))}</span>
  </div>`).join("");
}

function renderCategorias() {
  const cont = document.getElementById("lista-categorias");
  if (!cont) return;

  const receitas = _totalPago(_pagamentosDoPeriodo());
  const folha = _totalFolhaMensal();
  const despesasVariaveis = receitas * 0.45;
  const manutencao = despesasVariaveis * 0.35;
  const seguros = despesasVariaveis * 0.15;
  const combustivel = Math.max(despesasVariaveis - manutencao - seguros, 0);
  const totalDespesas = combustivel + manutencao + folha + seguros;
  const cats = [
    { nome: "Combustivel", valor: combustivel, cor: "#0f2942" },
    { nome: "Manutencao Frota", valor: manutencao, cor: "#94a3b8" },
    { nome: "Folha de Pagamento", valor: folha, cor: "#64748b" },
    { nome: "Seguros e Taxas", valor: seguros, cor: "#3b82f6" },
  ];

  cont.innerHTML = cats
    .map((c) => {
      const pct = totalDespesas > 0 ? Math.round((c.valor / totalDespesas) * 100) : 0;
      return `
  <div class="category-item-row">
    <div class="category-item-header">
      <span class="name" style="display:inline-flex; align-items:center; gap:8px">
        <span style="width:8px; height:8px; border-radius:50%; background:${c.cor}; display:inline-block"></span>
        ${esc(c.nome)}
      </span>
      <span class="pct">${pct}%</span>
    </div>
    <div class="category-bar"><span style="width:${pct}%; background:${c.cor}"></span></div>
    <span class="value">${formatarMoeda(c.valor)}</span>
  </div>`;
    }).join("");
}

// ============ Chart Fluxo de Caixa ============
function _isDarkMode() {
  return document.documentElement.getAttribute("data-theme") === "dark";
}

function initChartFluxo() {
  if (typeof Chart === "undefined") return;
  if (_chartFluxo) { try { _chartFluxo.destroy(); } catch (e) {} _chartFluxo = null; }
  const ctx = document.getElementById("chartFluxo");
  if (!ctx) return;

  // Agrupar pagamentos por dia da semana (últimos 7 dias).
  const hoje = new Date();
  const labels = [];
  const entradas = new Array(7).fill(0);
  const saidas = new Array(7).fill(0);
  for (let i = 6; i >= 0; i--) {
    const d = new Date(hoje);
    d.setDate(d.getDate() - i);
    labels.push(["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"][d.getDay()]);
  }

  getPagamentos().forEach((p) => {
    if (!p.dataPagamento) return;
    const d = new Date(p.dataPagamento);
    const diff = Math.floor((hoje - d) / (1000 * 60 * 60 * 24));
    if (diff >= 0 && diff < 7) {
      const idx = 6 - diff;
      if (p.situacao === "Pago") entradas[idx] += p.valor;
      else saidas[idx] += p.valor;
    }
  });

  // Mock saídas se não houver dados (visual)
  const totalEntradas = entradas.reduce((a, b) => a + b, 0);
  if (totalEntradas > 0 && saidas.reduce((a, b) => a + b, 0) === 0) {
    for (let i = 0; i < 7; i++) saidas[i] = entradas[i] * (0.4 + Math.random() * 0.2);
  }

  Chart.defaults.font.family = "'Josefin Sans', sans-serif";
  Chart.defaults.color = _isDarkMode() ? "#cbd5e1" : "#475569";

  _chartFluxo = new Chart(ctx.getContext("2d"), {
    type: "bar",
    data: {
      labels,
      datasets: [
        { label: "Entradas", data: entradas, backgroundColor: "#10b981", borderRadius: 6, maxBarThickness: 32 },
        { label: "Saídas", data: saidas, backgroundColor: "#ef4444", borderRadius: 6, maxBarThickness: 32 },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { position: "bottom", labels: { boxWidth: 12, padding: 14, usePointStyle: true } } },
      scales: {
        x: { grid: { display: false } },
        y: { beginAtZero: true, ticks: { callback: (v) => "R$ " + (v / 1000).toFixed(0) + "k" } },
      },
    },
  });
}

function imprimirRelatorio() {
  const pags = getPagamentos();
  const total = formatarMoeda(getSaldoTotal());
  const linhas = pags
    .map((p) => `<tr><td>#${esc(p.idPedido)}</td><td>${formatarData(p.dataPagamento)}</td><td>${esc(p.metodo)}</td><td>${formatarMoeda(p.valor)}</td><td>${esc(p.situacao)}</td></tr>`)
    .join("");
  const w = window.open("", "_blank");
  if (!w) return _avisoFin("Permita pop-ups para gerar o relatório.", "error");
  w.document.write(`<!doctype html><html lang="pt-br">
<head><meta charset="utf-8"><title>Relatório Financeiro — Serginho Leva Atrás</title>
<style>body{font-family:-apple-system,BlinkMacSystemFont,Segoe UI,sans-serif;padding:30px;color:#0f172a}
h2{color:#0f2942}h3{color:#475569;margin-top:20px}
table{border-collapse:collapse;width:100%;margin-top:8px}
th{background:#f1f5f9;text-align:left;padding:10px;font-size:13px;color:#475569;text-transform:uppercase;letter-spacing:.5px}
td{padding:8px 10px;font-size:13px;border-bottom:1px solid #e2e8f0}
.total{margin-top:20px;font-size:15px;font-weight:600}</style></head>
<body><h2>Relatório Financeiro</h2><p>Gerado em ${new Date().toLocaleDateString("pt-BR")}</p>
<h3>Pagamentos (${pags.length} registros)</h3>
<table><thead><tr><th>Pedido</th><th>Data</th><th>Método</th><th>Valor</th><th>Status</th></tr></thead>
<tbody>${linhas}</tbody></table>
<p class="total">Saldo Total: <strong>${total}</strong></p></body></html>`);
  w.document.close();
  w.print();
}

function _valorPagoRegistro(registro) {
  return parseFloat(registro?.valor) || 0;
}

function _totalPagoPedido(idPedido, ignorarPagamentoId) {
  return getPagamentos()
    .filter((p) => p.idPedido == idPedido && p.id != ignorarPagamentoId && p.situacao === "Pago")
    .reduce((total, p) => total + _valorPagoRegistro(p), 0);
}

function _saldoPendentePedido(idPedido, ignorarPagamentoId) {
  return Math.max(_valorAtualDoPedido(idPedido, 0) - _totalPagoPedido(idPedido, ignorarPagamentoId), 0);
}

function _pedidoQuitado(idPedido) {
  return _saldoPendentePedido(idPedido) <= 0.009 && _valorAtualDoPedido(idPedido, 0) > 0;
}

function _totalPago(lista) {
  return lista
    .filter((p) => p.situacao === "Pago")
    .reduce((total, p) => total + _valorPagoRegistro(p), 0);
}

function _garantirCamposPagamentoParcial() {
  const pedido = document.getElementById("pag-pedido");
  const valor = document.getElementById("pag-valor");
  if (!pedido || !valor || document.getElementById("pag-tipo")) return;

  pedido.setAttribute("onchange", "atualizarResumoPagamento()");
  const grupoValor = valor.closest(".filter-group");
  grupoValor.insertAdjacentHTML("beforebegin", `
    <div class="filter-group">
      <label>Tipo de pagamento</label>
      <select id="pag-tipo" class="form-control" onchange="atualizarResumoPagamento()">
        <option value="Sinal">Sinal</option>
        <option value="Complemento">Complemento</option>
        <option value="Quitacao">Quitacao</option>
      </select>
    </div>`);
  grupoValor.insertAdjacentHTML("afterend", `
    <div class="filter-group span-2">
      <span id="pag-resumo" class="page-subtitle"></span>
    </div>`);
}

function atualizarResumoPagamento() {
  const idPedido = document.getElementById("pag-pedido")?.value;
  const tipo = document.getElementById("pag-tipo")?.value;
  const valor = document.getElementById("pag-valor");
  const resumo = document.getElementById("pag-resumo");
  if (!idPedido || !resumo) return;

  const totalPedido = _valorAtualDoPedido(idPedido, 0);
  const totalPago = _totalPagoPedido(idPedido);
  const pendente = Math.max(totalPedido - totalPago, 0);
  resumo.innerText = `Total do pedido: ${formatarMoeda(totalPedido)} | Pago: ${formatarMoeda(totalPago)} | Pendente: ${formatarMoeda(pendente)}`;

  if (tipo === "Quitacao" && valor) {
    valor.value = pendente.toFixed(2);
  }
}

function popularSelectPedidos() {
  const pedidos = getPedidos();
  const opts = pedidos
    .map((p) => {
      const total = _valorAtualDoPedido(p.id, p.freteFinal || p.total);
      const pendente = _saldoPendentePedido(p.id);
      const status = pendente <= 0.009 ? "quitado" : `pendente ${formatarMoeda(pendente)}`;
      return `<option value="${esc(p.id)}">#${esc(p.id)} - ${esc(p.clienteNome) || "?"} - ${formatarMoeda(total)} (${status})</option>`;
    })
    .join("");
  ["pag-pedido", "nf-pedido", "nf-rapido-pedido"].forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.innerHTML = opts || '<option value="">Nenhum pedido</option>';
  });
  const dataEl = document.getElementById("pag-data");
  if (dataEl) dataEl.value = new Date().toISOString().split("T")[0];
}

function abrirModalPagamento() {
  limparFormulario("modalPagamento");
  _garantirCamposPagamentoParcial();
  document.getElementById("pag-data").value = new Date().toISOString().split("T")[0];
  const tipo = document.getElementById("pag-tipo");
  if (tipo) tipo.value = "Sinal";
  atualizarResumoPagamento();
  abrirModal("modalPagamento");
}

function renderPagamentos() {
  const lista = _pagamentosDoPeriodo();
  const tabela = document.getElementById("tabela-financeiro");
  if (!tabela) return;
  const thead = tabela.closest("table")?.querySelector("thead");
  if (thead) {
    thead.innerHTML = "<tr><th>Pedido</th><th>Data</th><th>Metodo</th><th>Tipo</th><th>Valor Pago</th><th>Pendente</th><th>Status</th><th>Acoes</th></tr>";
  }
  if (!lista.length) {
    tabela.innerHTML = `<tr><td colspan="8" class="tabela-vazia">
    <span class="material-icons-round">payments</span>
    <p>Nenhum pagamento registrado.</p></td></tr>`;
    return;
  }
  tabela.innerHTML = lista
    .map((p) => {
      const situacao = p.situacao || "Pendente";
      const metodoLower = (p.metodo || "").toLowerCase();
      const valorPago = _valorPagoRegistro(p);
      const pendente = _saldoPendentePedido(p.idPedido);
      return `
  <tr data-status="${esc(situacao.toLowerCase())}" data-metodo="${esc(metodoLower)}" data-data="${esc(p.dataPagamento || "")}">
    <td class="td-bold">#${esc(p.idPedido)}</td>
    <td>${formatarData(p.dataPagamento)}</td>
    <td><span class="badge-metodo ${esc(metodoLower)}">${esc(p.metodo)}</span></td>
    <td>${esc(p.tipo || "Sinal")}</td>
    <td class="td-valor">${formatarMoeda(valorPago)}</td>
    <td class="td-valor">${formatarMoeda(pendente)}</td>
    <td><span class="status ${situacao === "Pago" ? "pago" : "pendente"}">${esc(situacao)}</span></td>
    <td>
      <button class="btn-icon danger" onclick="removerPagamento(${esc(p.id)})" aria-label="Remover"><span class="material-icons-round">delete</span></button>
    </td>
  </tr>`;
    })
    .join("");
}

function salvarPagamento() {
  const idPedido = document.getElementById("pag-pedido").value;
  const valor = parseFloat(document.getElementById("pag-valor").value);
  const tipo = document.getElementById("pag-tipo")?.value || "Sinal";
  if (!idPedido || !valor) return _avisoFin("Pedido e valor sao obrigatorios.", "error");

  const pendente = _saldoPendentePedido(idPedido);
  if (valor - pendente > 0.009) {
    return _avisoFin(`Valor maior que o saldo pendente (${formatarMoeda(pendente)}).`, "error");
  }

  createPagamento({
    idPedido,
    valor,
    tipo,
    dataPagamento: document.getElementById("pag-data").value,
    metodo: document.getElementById("pag-metodo").value,
    situacao: document.getElementById("pag-situacao").value,
  });
  _avisoFin(tipo === "Sinal" ? "Sinal registrado." : "Pagamento registrado.", "success");
  fecharModal("modalPagamento");
  popularSelectPedidos();
  carregarStatsFinanceiro();
  renderPagamentos();
  renderCategorias();
  initChartFluxo();
}

function _validarPedidoQuitadoParaNF(idPedido) {
  if (_pedidoQuitado(idPedido)) return true;
  _avisoFin(`NF so pode ser emitida apos pagamento total. Pendente: ${formatarMoeda(_saldoPendentePedido(idPedido))}.`, "error");
  return false;
}

function emitirNFRapida(e) {
  e.preventDefault();
  const idPedido = document.getElementById("nf-rapido-pedido").value;
  if (!idPedido || !_validarPedidoQuitadoParaNF(idPedido)) return;
  const pedido = getPedidos().find((p) => p.id == idPedido);
  const cliente = pedido ? getClienteById(pedido.clienteId) : null;
  const valor = _valorAtualDoPedido(idPedido, 0);
  createNotaFiscal({
    idPedido,
    valor,
    serie: "A1",
    email: cliente?.email || "",
    cidade: cliente?.cidade || "",
    estado: cliente?.estado || "",
    prazoEntrega: 3,
  });
  _avisoFin("NF-e emitida com sucesso.", "success");
  document.getElementById("nf-rapido-valor").value = "";
  renderNotas();
}

function emitirNF() {
  const idPedido = document.getElementById("nf-pedido").value;
  if (!idPedido || !_validarPedidoQuitadoParaNF(idPedido)) return;
  const valor = _valorAtualDoPedido(idPedido, 0);
  createNotaFiscal({
    idPedido,
    valor,
    serie: document.getElementById("nf-serie").value,
    email: document.getElementById("nf-email").value,
    cidade: document.getElementById("nf-cidade").value,
    estado: document.getElementById("nf-estado").value,
    prazoEntrega: document.getElementById("nf-prazo").value,
  });
  _avisoFin("Nota fiscal emitida.", "success");
  fecharModal("modalNF");
  renderNotas();
}

function _labelsFluxoFinanceiro(diasGrafico, hoje) {
  return Array.from({ length: diasGrafico }, (_, idx) => {
    const d = new Date(hoje);
    d.setDate(d.getDate() - (diasGrafico - 1 - idx));
    return diasGrafico <= 7
      ? ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sab"][d.getDay()]
      : String(d.getDate()).padStart(2, "0");
  });
}

function initChartFluxo() {
  if (typeof Chart === "undefined") return;
  if (_chartFluxo) { try { _chartFluxo.destroy(); } catch (e) {} _chartFluxo = null; }
  const ctx = document.getElementById("chartFluxo");
  if (!ctx) return;

  const hoje = new Date();
  hoje.setHours(23, 59, 59, 999);
  const diasFiltro = _diasFiltroFinanceiro() || 30;
  const diasGrafico = Math.min(diasFiltro, 30);
  const labels = _labelsFluxoFinanceiro(diasGrafico, hoje);
  const entradas = new Array(diasGrafico).fill(0);
  const saidas = new Array(diasGrafico).fill(0);

  getPagamentos().forEach((p) => {
    const data = _dataLocalFin(p.dataPagamento);
    if (!data) return;
    const diff = Math.floor((hoje - data) / (1000 * 60 * 60 * 24));
    if (diff < 0 || diff >= diasGrafico) return;
    const idx = diasGrafico - 1 - diff;
    const valor = _valorPagoRegistro(p);
    if (p.situacao === "Pago") entradas[idx] += valor;
    else saidas[idx] += valor;
  });

  const totalEntradas = entradas.reduce((a, b) => a + b, 0);
  if (totalEntradas > 0 && saidas.reduce((a, b) => a + b, 0) === 0) {
    for (let i = 0; i < diasGrafico; i++) saidas[i] = entradas[i] * 0.45;
  }

  Chart.defaults.font.family = "'Josefin Sans', sans-serif";
  Chart.defaults.color = _isDarkMode() ? "#cbd5e1" : "#475569";

  _chartFluxo = new Chart(ctx.getContext("2d"), {
    type: "bar",
    data: {
      labels,
      datasets: [
        { label: "Entradas", data: entradas, backgroundColor: "#10b981", borderRadius: 6, maxBarThickness: 32 },
        { label: "Saidas", data: saidas, backgroundColor: "#ef4444", borderRadius: 6, maxBarThickness: 32 },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { position: "bottom", labels: { boxWidth: 12, padding: 14, usePointStyle: true } } },
      scales: {
        x: { grid: { display: false } },
        y: {
          beginAtZero: true,
          ticks: {
            stepSize: 1000,
            callback: (v) => "R$ " + Number(v).toLocaleString("pt-BR", { maximumFractionDigits: 0 }),
          },
        },
      },
    },
  });
}

function gerarHTMLNF(nf) {
  const pedido = getPedidos().find((p) => p.id == nf.idPedido);
  const itens = (pedido?.itens || [])
    .map((item) => `
      <tr>
        <td>${esc(item.produto)}</td>
        <td>${esc(item.qtd)}</td>
        <td>${formatarMoeda(item.preco)}</td>
      </tr>`)
    .join("");

  return `
<div class="nf-documento">
  <div class="nf-header">
    <h2>NOTA FISCAL ELETRONICA</h2>
    <div class="nf-numero">${esc(nf.numero)} - Serie ${esc(nf.serie)}</div>
  </div>
  <div class="nf-info-grid">
    <div class="nf-campo"><span>Data de Emissao</span><strong>${formatarData(nf.dataEmissao)}</strong></div>
    <div class="nf-campo"><span>Pedido</span><strong>#${esc(nf.idPedido)}</strong></div>
    <div class="nf-campo"><span>Cliente</span><strong>${esc(pedido?.clienteNome) || "-"}</strong></div>
    <div class="nf-campo"><span>Valor Total</span><strong>${formatarMoeda(nf.valor)}</strong></div>
    <div class="nf-campo"><span>Prazo de Entrega</span><strong>${esc(nf.prazoEntrega)} dias uteis</strong></div>
    <div class="nf-campo"><span>Cidade/UF</span><strong>${esc(nf.cidade) || "-"}/${esc(nf.estado) || "-"}</strong></div>
    <div class="nf-campo"><span>Email</span><strong>${esc(nf.email) || "-"}</strong></div>
    <div class="nf-campo"><span>Endereco</span><strong>${esc(pedido?.enderecoEntrega) || "-"}</strong></div>
  </div>
  ${itens ? `
  <div class="nf-itens">
    <h3>Itens do Pedido</h3>
    <table>
      <thead><tr><th>Produto</th><th>Qtd</th><th>Valor declarado</th></tr></thead>
      <tbody>${itens}</tbody>
    </table>
  </div>` : ""}
  <div class="nf-chave">
    <span>Chave de Acesso:</span>
    <code>${esc(nf.chaveAcesso)}</code>
  </div>
  <div class="nf-rodape">Documento gerado pelo sistema Serginho Leva Atras</div>
</div>`;
}

function imprimirModalNF() {
  const area = document.getElementById("nf-print-area");
  if (!area || !area.innerHTML.trim()) return _avisoFin("Abra uma nota fiscal antes de imprimir.", "error");
  window.print();
}

function imprimirNF(id) {
  visualizarNF(id);
  setTimeout(imprimirModalNF, 250);
}

function imprimirRelatorio() {
  const pags = _pagamentosDoPeriodo();
  const total = formatarMoeda(_totalPago(pags));
  const linhas = pags
    .map((p) => `<tr><td>#${esc(p.idPedido)}</td><td>${formatarData(p.dataPagamento)}</td><td>${esc(p.metodo)}</td><td>${formatarMoeda(p.valor)}</td><td>${esc(p.situacao)}</td></tr>`)
    .join("");
  const w = window.open("", "_blank");
  if (!w) return _avisoFin("Permita pop-ups para gerar o relatorio.", "error");
  w.document.write(`<!doctype html><html lang="pt-br">
<head><meta charset="utf-8"><title>Relatorio Financeiro</title>
<style>body{font-family:-apple-system,BlinkMacSystemFont,Segoe UI,sans-serif;padding:30px;color:#0f172a}
h2{color:#0f2942}h3{color:#475569;margin-top:20px}
table{border-collapse:collapse;width:100%;margin-top:8px}
th{background:#f1f5f9;text-align:left;padding:10px;font-size:13px;color:#475569;text-transform:uppercase;letter-spacing:.5px}
td{padding:8px 10px;font-size:13px;border-bottom:1px solid #e2e8f0}
.total{margin-top:20px;font-size:15px;font-weight:600}</style></head>
<body><h2>Relatorio Financeiro</h2><p>Gerado em ${new Date().toLocaleDateString("pt-BR")}</p>
<h3>Pagamentos (${pags.length} registros)</h3>
<table><thead><tr><th>Pedido</th><th>Data</th><th>Metodo</th><th>Valor</th><th>Status</th></tr></thead>
<tbody>${linhas}</tbody></table>
<p class="total">Saldo Total: <strong>${total}</strong></p></body></html>`);
  w.document.close();
  w.print();
}

function _abrirJanelaImpressaoNF(htmlNF) {
  const w = window.open("", "_blank");
  if (!w) {
    _avisoFin("Permita pop-ups para imprimir a nota fiscal.", "error");
    return;
  }

  w.document.open();
  w.document.write(`<!doctype html>
<html lang="pt-br">
<head>
  <meta charset="utf-8">
  <title>Nota Fiscal</title>
  <style>
    * { box-sizing: border-box; }
    body {
      margin: 0;
      padding: 24px;
      background: #fff;
      color: #0f172a;
      font-family: Arial, Helvetica, sans-serif;
    }
    .nf-documento {
      width: 100%;
      max-width: 820px;
      margin: 0 auto;
      background: #fff;
      color: #000;
      padding: 0;
    }
    .nf-header {
      text-align: center;
      border-bottom: 2px solid #0f2942;
      padding-bottom: 12px;
      margin-bottom: 18px;
    }
    .nf-header h2 { color: #0f2942; font-size: 20px; margin: 0; }
    .nf-numero { color: #475569; font-size: 13px; margin-top: 4px; }
    .nf-info-grid {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 12px;
      margin-bottom: 18px;
    }
    .nf-campo {
      display: flex;
      flex-direction: column;
      gap: 4px;
      padding: 10px 12px;
      background: #f8fafc;
      border-radius: 8px;
      break-inside: avoid;
    }
    .nf-campo span {
      font-size: 11px;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: .4px;
    }
    .nf-campo strong { font-size: 14px; color: #0f172a; }
    .nf-itens { margin-top: 18px; }
    .nf-itens h3 { font-size: 14px; margin: 0 0 8px; color: #0f172a; }
    .nf-itens table { width: 100%; border-collapse: collapse; }
    .nf-itens th, .nf-itens td {
      padding: 8px 10px;
      border: 1px solid #e2e8f0;
      text-align: left;
      font-size: 12.5px;
    }
    .nf-chave {
      background: #f1f5f9;
      padding: 12px;
      border-radius: 8px;
      margin-top: 18px;
      margin-bottom: 12px;
      font-size: 12px;
    }
    .nf-chave span { display: block; font-weight: 600; color: #475569; margin-bottom: 4px; }
    .nf-chave code { font-family: Consolas, monospace; word-break: break-all; }
    .nf-rodape { text-align: center; font-size: 11px; color: #94a3b8; margin-top: 18px; font-style: italic; }
    @page { margin: 14mm; }
    @media print {
      body { padding: 0; }
      .nf-documento { max-width: none; }
    }
  </style>
</head>
<body>${htmlNF}</body>
</html>`);
  w.document.close();
  w.focus();
  w.onafterprint = () => w.close();
  setTimeout(() => {
    w.print();
  }, 150);
}

function imprimirModalNF() {
  const area = document.getElementById("nf-print-area");
  const htmlNF = area?.innerHTML?.trim();
  if (!htmlNF) return _avisoFin("Abra uma nota fiscal antes de imprimir.", "error");
  _abrirJanelaImpressaoNF(htmlNF);
}

function imprimirNF(id) {
  const nf = getNotasFiscais().find((n) => n.id == id);
  if (!nf) return _avisoFin("Nota fiscal nao encontrada.", "error");

  const htmlNF = gerarHTMLNF(nf);
  const area = document.getElementById("nf-print-area");
  if (area) area.innerHTML = htmlNF;
  _abrirJanelaImpressaoNF(htmlNF);
}

function renderNotas() {
  const busca = (document.getElementById("busca-nf")?.value || "").toLowerCase();
  const lista = getNotasFiscais().filter(
    (n) => !busca || n.numero.toLowerCase().includes(busca) || String(n.idPedido).includes(busca),
  );
  const tabela = document.getElementById("tabela-notas");
  if (!tabela) return;
  if (!lista.length) {
    tabela.innerHTML = `<tr><td colspan="7" class="tabela-vazia">
    <span class="material-icons-round">receipt_long</span>
    <p>Nenhuma nota fiscal emitida ainda.</p></td></tr>`;
    return;
  }
  tabela.innerHTML = lista
    .map((n) => {
      const valorAtual = _valorFinanceiroAtual(n);
      return `
  <tr>
    <td class="td-bold">${esc(n.numero)}</td>
    <td>#${esc(n.idPedido)}</td>
    <td>${formatarData(n.dataEmissao)}</td>
    <td class="td-valor">${formatarMoeda(valorAtual)}</td>
    <td>${esc(n.cidade) || "-"} / ${esc(n.estado) || "-"}</td>
    <td><span class="status ativo">${esc(n.situacao)}</span></td>
    <td>
      <button class="btn-icon" onclick="visualizarNF(${esc(n.id)})" aria-label="Visualizar"><span class="material-icons-round">visibility</span></button>
      <button class="btn-icon" onclick="imprimirNF(${esc(n.id)})" aria-label="Imprimir"><span class="material-icons-round">print</span></button>
    </td>
  </tr>`;
    }).join("");
}

function gerarHTMLNF(nf) {
  const pedido = getPedidos().find((p) => p.id == nf.idPedido);
  const valorAtual = _valorFinanceiroAtual(nf);
  const itens = (pedido?.itens || [])
    .map((item) => `
      <tr>
        <td>${esc(item.produto)}</td>
        <td>${esc(item.qtd)}</td>
        <td>${formatarMoeda(item.preco)}</td>
      </tr>`)
    .join("");

  return `
<div class="nf-documento">
  <div class="nf-header">
    <h2>NOTA FISCAL ELETRONICA</h2>
    <div class="nf-numero">${esc(nf.numero)} - Serie ${esc(nf.serie)}</div>
  </div>
  <div class="nf-info-grid">
    <div class="nf-campo"><span>Data de Emissao</span><strong>${formatarData(nf.dataEmissao)}</strong></div>
    <div class="nf-campo"><span>Pedido</span><strong>#${esc(nf.idPedido)}</strong></div>
    <div class="nf-campo"><span>Cliente</span><strong>${esc(pedido?.clienteNome) || "-"}</strong></div>
    <div class="nf-campo"><span>Valor Total</span><strong>${formatarMoeda(valorAtual)}</strong></div>
    <div class="nf-campo"><span>Prazo de Entrega</span><strong>${esc(nf.prazoEntrega)} dias uteis</strong></div>
    <div class="nf-campo"><span>Cidade/UF</span><strong>${esc(nf.cidade) || "-"}/${esc(nf.estado) || "-"}</strong></div>
    <div class="nf-campo"><span>Email</span><strong>${esc(nf.email) || "-"}</strong></div>
    <div class="nf-campo"><span>Endereco</span><strong>${esc(pedido?.enderecoEntrega) || "-"}</strong></div>
  </div>
  ${itens ? `
  <div class="nf-itens">
    <h3>Itens do Pedido</h3>
    <table>
      <thead><tr><th>Produto</th><th>Qtd</th><th>Valor declarado</th></tr></thead>
      <tbody>${itens}</tbody>
    </table>
  </div>` : ""}
  <div class="nf-chave">
    <span>Chave de Acesso:</span>
    <code>${esc(nf.chaveAcesso)}</code>
  </div>
  <div class="nf-rodape">Documento gerado pelo sistema Serginho Leva Atras</div>
</div>`;
}

function imprimirRelatorio() {
  const pags = _pagamentosDoPeriodo();
  const total = formatarMoeda(_totalPago(pags));
  const linhas = pags
    .map((p) => `<tr><td>#${esc(p.idPedido)}</td><td>${formatarData(p.dataPagamento)}</td><td>${esc(p.metodo)}</td><td>${esc(p.tipo || "Sinal")}</td><td>${formatarMoeda(_valorPagoRegistro(p))}</td><td>${formatarMoeda(_saldoPendentePedido(p.idPedido))}</td><td>${esc(p.situacao)}</td></tr>`)
    .join("");
  const w = window.open("", "_blank");
  if (!w) return _avisoFin("Permita pop-ups para gerar o relatorio.", "error");
  w.document.write(`<!doctype html><html lang="pt-br">
<head><meta charset="utf-8"><title>Relatorio Financeiro</title>
<style>body{font-family:-apple-system,BlinkMacSystemFont,Segoe UI,sans-serif;padding:30px;color:#0f172a}
h2{color:#0f2942}h3{color:#475569;margin-top:20px}
table{border-collapse:collapse;width:100%;margin-top:8px}
th{background:#f1f5f9;text-align:left;padding:10px;font-size:13px;color:#475569;text-transform:uppercase;letter-spacing:.5px}
td{padding:8px 10px;font-size:13px;border-bottom:1px solid #e2e8f0}
.total{margin-top:20px;font-size:15px;font-weight:600}</style></head>
<body><h2>Relatorio Financeiro</h2><p>Gerado em ${new Date().toLocaleDateString("pt-BR")}</p>
<h3>Pagamentos (${pags.length} registros)</h3>
<table><thead><tr><th>Pedido</th><th>Data</th><th>Metodo</th><th>Tipo</th><th>Valor Pago</th><th>Pendente</th><th>Status</th></tr></thead>
<tbody>${linhas}</tbody></table>
<p class="total">Total pago no periodo: <strong>${total}</strong></p></body></html>`);
  w.document.close();
  w.print();
}
