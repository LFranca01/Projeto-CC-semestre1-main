// ================= FINANCEIRO MODULE =================

let tabAtiva = "pagamentos";

function setTab(tab, el) {
  tabAtiva = tab;
  document.querySelectorAll(".fin-tab").forEach((b) => b.classList.remove("ativo"));
  el.classList.add("ativo");
  document.getElementById("tab-pagamentos").style.display = tab === "pagamentos" ? "" : "none";
  document.getElementById("tab-notas").style.display = tab === "notas" ? "" : "none";
  if (tab === "notas") renderNotas();
}

function carregarStatsFinanceiro() {
  const pags = getPagamentos();
  const hoje = new Date().toISOString().split("T")[0];
  const nfs = getNotasFiscais();
  document.getElementById("stat-saldo").innerText = formatarMoeda(getSaldoTotal());
  document.getElementById("stat-hoje").innerText = formatarMoeda(
    pags
      .filter((p) => p.dataPagamento === hoje && p.situacao === "Pago")
      .reduce((s, p) => s + p.valor, 0),
  );
  document.getElementById("stat-pendentes").innerText = pags.filter((p) => p.situacao === "Pendente").length;
  document.getElementById("stat-nf").innerText = nfs.length;
}

function popularSelectPedidos() {
  const pedidos = getPedidos();
  const opts = pedidos
    .map((p) => `<option value="${p.id}">#${p.id} — ${p.clienteNome || "?"} — ${formatarMoeda(p.freteFinal || p.total)}</option>`)
    .join("");
  document.getElementById("pag-pedido").innerHTML = opts || '<option value="">Nenhum pedido</option>';
  document.getElementById("nf-pedido").innerHTML = opts || '<option value="">Nenhum pedido</option>';
  document.getElementById("pag-data").value = new Date().toISOString().split("T")[0];
}

function renderPagamentos() {
  const lista = getPagamentos();
  const tabela = document.getElementById("tabela-financeiro");
  if (!lista.length) {
    tabela.innerHTML = `<tr><td colspan="6" class="tabela-vazia">
    <span class="material-icons-round">payments</span>
    <p>Nenhum pagamento registrado.</p></td></tr>`;
    return;
  }
  tabela.innerHTML = lista
    .map(
      (p) => `
  <tr>
    <td class="td-bold">#${p.idPedido}</td>
    <td>${formatarData(p.dataPagamento)}</td>
    <td><span class="badge-metodo ${p.metodo?.toLowerCase()}">${p.metodo}</span></td>
    <td class="td-valor">${formatarMoeda(p.valor)}</td>
    <td><span class="status ${p.situacao === "Pago" ? "pago" : "pendente"}">${p.situacao}</span></td>
    <td>
      <button class="btn-icon danger" onclick="removerPagamento(${p.id})"><span class="material-icons-round">delete</span></button>
    </td>
  </tr>`,
    )
    .join("");
}

function salvarPagamento() {
  const idPedido = document.getElementById("pag-pedido").value;
  const valor = parseFloat(document.getElementById("pag-valor").value);
  if (!idPedido || !valor) return alert("Pedido e valor são obrigatórios.");
  createPagamento({
    idPedido,
    valor,
    dataPagamento: document.getElementById("pag-data").value,
    metodo: document.getElementById("pag-metodo").value,
    situacao: document.getElementById("pag-situacao").value,
  });
  fecharModal("modalPagamento");
  carregarStatsFinanceiro();
  renderPagamentos();
}

function removerPagamento(id) {
  if (confirm("Remover este pagamento?")) {
    deletePagamento(id);
    carregarStatsFinanceiro();
    renderPagamentos();
  }
}

function renderNotas() {
  const busca = (document.getElementById("busca-nf")?.value || "").toLowerCase();
  const lista = getNotasFiscais().filter(
    (n) => !busca || n.numero.toLowerCase().includes(busca) || String(n.idPedido).includes(busca),
  );
  const tabela = document.getElementById("tabela-notas");
  if (!lista.length) {
    tabela.innerHTML = `<tr><td colspan="7" class="tabela-vazia">
    <span class="material-icons-round">receipt_long</span>
    <p>Nenhuma nota fiscal emitida.</p></td></tr>`;
    return;
  }
  tabela.innerHTML = lista
    .map(
      (n) => `
  <tr>
    <td class="td-bold">${n.numero}</td>
    <td>#${n.idPedido}</td>
    <td>${formatarData(n.dataEmissao)}</td>
    <td class="td-valor">${formatarMoeda(n.valor)}</td>
    <td>${n.cidade || "—"}/${n.estado || "—"}</td>
    <td><span class="status ativo">${n.situacao}</span></td>
    <td>
      <button class="btn-icon" onclick="visualizarNF(${n.id})"><span class="material-icons-round">visibility</span></button>
      <button class="btn-icon" onclick="imprimirNF(${n.id})"><span class="material-icons-round">print</span></button>
    </td>
  </tr>`,
    )
    .join("");
}

function emitirNF() {
  const idPedido = document.getElementById("nf-pedido").value;
  const valor = parseFloat(document.getElementById("nf-valor").value);
  if (!idPedido || !valor) return alert("Pedido e valor são obrigatórios.");
  createNotaFiscal({
    idPedido,
    valor,
    serie: document.getElementById("nf-serie").value,
    email: document.getElementById("nf-email").value,
    cidade: document.getElementById("nf-cidade").value,
    estado: document.getElementById("nf-estado").value,
    prazoEntrega: document.getElementById("nf-prazo").value,
  });
  fecharModal("modalNF");
  carregarStatsFinanceiro();
  if (tabAtiva === "notas") renderNotas();
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
    <div class="nf-numero">${nf.numero} — Série ${nf.serie}</div>
  </div>
  <div class="nf-info-grid">
    <div class="nf-campo"><span>Data de Emissão</span><strong>${formatarData(nf.dataEmissao)}</strong></div>
    <div class="nf-campo"><span>Pedido</span><strong>#${nf.idPedido}</strong></div>
    <div class="nf-campo"><span>Valor Total</span><strong>${formatarMoeda(nf.valor)}</strong></div>
    <div class="nf-campo"><span>Prazo de Entrega</span><strong>${nf.prazoEntrega} dias úteis</strong></div>
    <div class="nf-campo"><span>Cidade/Estado</span><strong>${nf.cidade || "—"}/${nf.estado || "—"}</strong></div>
    <div class="nf-campo"><span>Email</span><strong>${nf.email || "—"}</strong></div>
  </div>
  <div class="nf-chave">
    <span>Chave de Acesso:</span>
    <code>${nf.chaveAcesso}</code>
  </div>
  <div class="nf-rodape">Documento gerado pelo sistema da Distribuidora Serginho</div>
</div>`;
}

function imprimirRelatorio() {
  const pags = getPagamentos();
  const total = formatarMoeda(getSaldoTotal());
  const html = `
<div class="relatorio-print">
  <h2>Relatório Financeiro</h2>
  <p>Gerado em ${new Date().toLocaleDateString("pt-BR")}</p>
  <h3>Pagamentos (${pags.length} registros)</h3>
  <table border="1" cellpadding="6" cellspacing="0" width="100%">
    <thead><tr><th>Pedido</th><th>Data</th><th>Método</th><th>Valor</th><th>Status</th></tr></thead>
    <tbody>${pags.map((p) => `<tr><td>#${p.idPedido}</td><td>${formatarData(p.dataPagamento)}</td><td>${p.metodo}</td><td>${formatarMoeda(p.valor)}</td><td>${p.situacao}</td></tr>`).join("")}</tbody>
  </table>
  <p><strong>Saldo Total Recebido: ${total}</strong></p>
</div>`;
  const w = window.open("", "_blank");
  w.document.write(
    `<html><head><title>Relatório Financeiro</title><style>body{font-family:sans-serif;padding:30px}table{border-collapse:collapse}th,td{text-align:left;padding:8px}h2{color:#153856}</style></head><body>${html}</body></html>`,
  );
  w.document.close();
  w.print();
}

