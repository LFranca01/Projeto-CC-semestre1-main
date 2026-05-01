// ================= LOGISTICA MODULE =================

let entregaEditandoId = null;

function _avisoLog(msg, tipo) {
  if (typeof showToast === "function") showToast(msg, tipo);
  else alert(msg);
}

function _statusClass(situacao) {
  if (situacao === "Entregue") return "entregue";
  if (situacao === "Em Trânsito") return "transito";
  return "pendente";
}

function carregarStatsLogistica() {
  const pedidos = getPedidos();
  const entregas = getEntregas();
  const _set = (id, v) => { const e = document.getElementById(id); if (e) e.innerText = v; };
  _set("stat-pendentes", pedidos.filter((p) => (p.status || "Pendente") === "Pendente").length);
  _set("stat-transito", entregas.filter((e) => e.situacao === "Em Trânsito").length);
  _set("stat-entregues", entregas.filter((e) => e.situacao === "Entregue").length);
}

function popularAgregados() {
  const lista = getAgregados().filter((a) => a.situacao === "Ativo");
  const sel = document.getElementById("bip-agregado");
  if (!sel) return;
  sel.innerHTML = lista.length
    ? lista.map((a) => `<option value="${esc(a.id)}">${esc(a.nome)} — ${esc(a.tipoVei) || ""} ${esc(a.placaVei) || ""}</option>`).join("")
    : '<option value="">Nenhum agregado ativo</option>';
}

function carregarTabelaEntregas() {
  const entregas = getEntregas().slice().reverse();
  const agregados = getAgregados();
  const tabela = document.getElementById("tabela-entregas");
  if (!entregas.length) {
    tabela.innerHTML = `<tr><td colspan="6" class="tabela-vazia">
  <span class="material-icons-round">local_shipping</span>
  <p>Nenhuma entrega registrada. Bipe um pedido para começar.</p></td></tr>`;
    return;
  }
  tabela.innerHTML = entregas
    .map((e) => {
      const agr = agregados.find((a) => a.id == e.idAgregado);
      const situacao = e.situacao || "Em Trânsito";
      return `
  <tr data-status="${esc(situacao.toLowerCase())}">
    <td class="td-bold">#${esc(e.idPedido)}</td>
    <td>${agr ? esc(agr.nome) : "—"}</td>
    <td><span class="sku-tag">${esc(e.codRastreio)}</span></td>
    <td>${formatarData(e.dataSaida)}</td>
    <td><span class="status ${_statusClass(situacao)}">${esc(situacao)}</span></td>
    <td>
      ${situacao !== "Entregue" ? `<button class="btn-icon" title="Marcar como entregue" onclick="abrirConfirmarEntrega(${esc(e.id)},${esc(e.idPedido)})" aria-label="Marcar como entregue"><span class="material-icons-round">check_circle</span></button>` : ""}
      <button class="btn-icon danger" onclick="removerEntrega(${esc(e.id)})" aria-label="Remover"><span class="material-icons-round">delete</span></button>
    </td>
  </tr>`;
    })
    .join("");
}

function bipar() {
  const idAgregado = document.getElementById("bip-agregado").value;
  const idPedido = parseInt(document.getElementById("bip-pedido").value);
  const res = document.getElementById("bip-resultado");

  if (!idAgregado || !idPedido) {
    res.innerHTML = `<div class="bip-msg erro"><span class="material-icons-round">error</span> Preencha o agregado e o ID do pedido.</div>`;
    return;
  }

  const resultado = biparPedido(idPedido, idAgregado);

  if (resultado.ok) {
    res.innerHTML = `<div class="bip-msg sucesso">
  <span class="material-icons-round">check_circle</span>
  Pedido <strong>#${esc(idPedido)}</strong> bipado! Rastreio: <span class="sku-tag">${esc(resultado.entrega.codRastreio)}</span>
</div>`;
    document.getElementById("bip-pedido").value = "";
    _avisoLog("Pedido bipado com sucesso.", "success");
    carregarStatsLogistica();
    carregarTabelaEntregas();
  } else {
    res.innerHTML = `<div class="bip-msg erro"><span class="material-icons-round">error</span> ${esc(resultado.msg)}</div>`;
  }
  setTimeout(() => { if (res) res.innerHTML = ""; }, 5000);
}

function abrirConfirmarEntrega(idEntrega, idPedido) {
  entregaEditandoId = idEntrega;
  document.getElementById("entregue-pedido-id").innerText = "#" + idPedido;
  abrirModal("modalEntregue");
}

function confirmarEntrega() {
  if (!entregaEditandoId) return;
  const data = document.getElementById("entregue-data").value;
  updateEntrega(entregaEditandoId, { situacao: "Entregue", dataEntrega: data });
  const entrega = getEntregas().find((e) => e.id == entregaEditandoId);
  if (entrega) updatePedido(entrega.idPedido, { status: "Entregue", situacao: "Entregue" });
  _avisoLog("Entrega confirmada.", "success");
  fecharModal("modalEntregue");
  carregarStatsLogistica();
  carregarTabelaEntregas();
  entregaEditandoId = null;
}

function removerEntrega(id) {
  if (confirm("Remover este registro de entrega?")) {
    deleteEntrega(id);
    _avisoLog("Registro removido.", "success");
    carregarStatsLogistica();
    carregarTabelaEntregas();
  }
}
