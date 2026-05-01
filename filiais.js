// ================= FILIAIS / HUBS MODULE =================

function _avisoFil(msg, tipo) {
  if (typeof showToast === "function") showToast(msg, tipo);
  else alert(msg);
}

function carregarStatsFiliais() {
  const filiais = getFiliais();
  const pedidos = getPedidos();
  const transferencias = getTransferencias();
  const receita = pedidos.reduce((total, p) => total + (parseFloat(p.freteFinal) || 0), 0);
  const _set = (id, v) => { const e = document.getElementById(id); if (e) e.innerText = v; };
  _set("total-filiais", filiais.length);
  _set("total-pedidos-filiais", pedidos.length);
  _set("total-transferencias", transferencias.length);
  _set("receita-filiais", formatarMoeda(receita));
}

function renderFiliais() {
  const tabela = document.getElementById("tabela-filiais");
  const dados = contarPedidosPorFilial();
  tabela.innerHTML = dados
    .map((f) => `
      <tr data-filial="${esc(f.nome.toLowerCase())}">
        <td class="td-bold">${esc(f.nome)}</td>
        <td>${esc(f.cidade)}/${esc(f.estado)}</td>
        <td>${esc(f.distanciaKm)} km</td>
        <td>${f.pedidos}</td>
        <td class="td-valor">${formatarMoeda(f.receita)}</td>
        <td><span class="status ${f.pedidos ? "ativo" : "pendente"}">${f.pedidos ? "Operando" : "Sem pedidos"}</span></td>
      </tr>`).join("");
}

function renderTransferencias() {
  const tabela = document.getElementById("tabela-transferencias");
  if (!tabela) return;
  const transferencias = getTransferencias().slice().reverse();
  if (!transferencias.length) {
    tabela.innerHTML = `<tr><td colspan="6" class="tabela-vazia">
      <span class="material-icons-round">sync_alt</span>
      <p>Nenhuma transferência registrada.</p></td></tr>`;
    return;
  }
  tabela.innerHTML = transferencias
    .map((t) => `
      <tr>
        <td>${formatarData(t.data)}</td>
        <td>${esc(t.origemNome)}</td>
        <td>${esc(t.destinoNome)}</td>
        <td>${t.pedidoId ? "#" + esc(t.pedidoId) : "—"}</td>
        <td>${esc(t.responsavel) || "—"}</td>
        <td><span class="status transito">${esc(t.status)}</span></td>
      </tr>`).join("");
}

function renderTransferenciasCompact() {
  const tabela = document.getElementById("tabela-transferencias-compact");
  if (!tabela) return;
  const transferencias = getTransferencias().slice().reverse();
  if (!transferencias.length) {
    tabela.innerHTML = `<tr><td colspan="3" class="tabela-vazia">
      <span class="material-icons-round">sync_alt</span>
      <p>Nenhuma transferência ainda.</p></td></tr>`;
    return;
  }
  tabela.innerHTML = transferencias
    .map((t) => {
      const origem = (t.origemNome || "").split(":")[0] || "—";
      const destino = (t.destinoNome || "").split(":")[0] || "—";
      return `
      <tr>
        <td style="font-size:12.5px">${formatarData(t.data)}</td>
        <td>${esc(origem)} <span style="color:var(--text-subtle)">→</span> ${esc(destino)}</td>
        <td><span class="status transito">${esc(t.status)}</span></td>
      </tr>`;
    }).join("");
}

function popularSelectFiliais() {
  const opcoes = getFiliais().map((f) => `<option value="${esc(f.id)}">${esc(formatarFilial(f))}</option>`).join("");
  document.getElementById("transf-origem").innerHTML = `<option value="">Origem...</option>${opcoes}`;
  document.getElementById("transf-destino").innerHTML = `<option value="">Destino...</option>${opcoes}`;
}

function abrirModalTransferencia() {
  limparFormulario("modalTransferencia");
  popularSelectFiliais();
  abrirModal("modalTransferencia");
}

function salvarTransferencia() {
  const origemId = document.getElementById("transf-origem").value;
  const destinoId = document.getElementById("transf-destino").value;

  if (!origemId || !destinoId) return _avisoFil("Selecione origem e destino.", "error");
  if (origemId === destinoId) return _avisoFil("Origem e destino precisam ser filiais diferentes.", "error");

  createTransferencia({
    origemId, destinoId,
    pedidoId: document.getElementById("transf-pedido").value,
    responsavel: document.getElementById("transf-responsavel").value,
    observacao: document.getElementById("transf-observacao").value,
  });
  _avisoFil("Transferência registrada.", "success");

  fecharModal("modalTransferencia");
  carregarStatsFiliais();
  renderFiliais();
  renderTransferencias();
  renderTransferenciasCompact();
}

function aplicarFiltrosFiliais() {
  const busca = (document.getElementById("input-busca")?.value || "").toLowerCase();
  document.querySelectorAll("#tabela-filiais tr, #tabela-transferencias-compact tr").forEach((linha) => {
    if (linha.querySelector(".tabela-vazia")) return;
    linha.style.display = linha.innerText.toLowerCase().includes(busca) ? "" : "none";
  });
}
