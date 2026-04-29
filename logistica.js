// ================= LOGISTICA MODULE =================

let entregaEditandoId = null;

function carregarStatsLogistica() {
  const pedidos = getPedidos();
  const entregas = getEntregas();
  document.getElementById("stat-pendentes").innerText = pedidos.filter((p) => p.status === "Pendente").length;
  document.getElementById("stat-transito").innerText = entregas.filter((e) => e.situacao === "Em Trânsito").length;
  document.getElementById("stat-entregues").innerText = entregas.filter((e) => e.situacao === "Entregue").length;
}

function popularAgregados() {
  const lista = getAgregados().filter((a) => a.situacao === "Ativo");
  const sel = document.getElementById("bip-agregado");
  sel.innerHTML = lista.length
    ? lista.map((a) => `<option value="${a.id}">${a.nome} — ${a.tipoVei || ""} ${a.placaVei || ""}</option>`).join("")
    : '<option value="">Nenhum agregado ativo</option>';
}

function carregarTabelaEntregas() {
  const entregas = getEntregas();
  const agregados = getAgregados();
  const tabela = document.getElementById("tabela-entregas");
  if (!entregas.length) {
    tabela.innerHTML = `<tr><td colspan="7" class="tabela-vazia">
  <span class="material-icons-round">local_shipping</span>
  <p>Nenhuma entrega registrada. Use a bipagem acima para registrar saídas.</p></td></tr>`;
    return;
  }
  tabela.innerHTML = entregas
    .map((e) => {
      const agr = agregados.find((a) => a.id == e.idAgregado);
      return `
  <tr>
    <td class="td-bold">#${e.idPedido}</td>
    <td>${agr ? agr.nome : "—"}</td>
    <td><code>${e.codRastreio}</code></td>
    <td>${formatarData(e.dataSaida)}</td>
    <td>${e.dataPrevista ? formatarData(e.dataPrevista) : "—"}</td>
    <td><span class="status ${e.situacao === "Entregue" ? "entregue" : "transito"}">${e.situacao}</span></td>
    <td>
      ${e.situacao !== "Entregue" ? `<button class="btn-icon" title="Marcar como entregue" onclick="abrirConfirmarEntrega(${e.id},${e.idPedido})"><span class="material-icons-round">check_circle</span></button>` : ""}
      <button class="btn-icon danger" onclick="removerEntrega(${e.id})"><span class="material-icons-round">delete</span></button>
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
  Pedido <strong>#${idPedido}</strong> bipado com sucesso! Rastreio: <code>${resultado.entrega.codRastreio}</code>
</div>`;
    document.getElementById("bip-pedido").value = "";
    carregarStatsLogistica();
    carregarTabelaEntregas();
  } else {
    res.innerHTML = `<div class="bip-msg erro"><span class="material-icons-round">error</span> ${resultado.msg}</div>`;
  }
  setTimeout(() => {
    res.innerHTML = "";
  }, 5000);
}

function abrirConfirmarEntrega(idEntrega, idPedido) {
  entregaEditandoId = idEntrega;
  document.getElementById("entregue-pedido-id").innerText = "#" + idPedido;
  abrirModal("modalEntregue");
}

function confirmarEntrega() {
  if (!entregaEditandoId) return;
  const data = document.getElementById("entregue-data").value;
  updateEntrega(entregaEditandoId, {
    situacao: "Entregue",
    dataEntrega: data,
  });
  const entrega = getEntregas().find((e) => e.id == entregaEditandoId);
  if (entrega) {
    updatePedido(entrega.idPedido, {
      status: "Entregue",
      situacao: "Entregue",
    });
  }
  fecharModal("modalEntregue");
  carregarStatsLogistica();
  carregarTabelaEntregas();
  entregaEditandoId = null;
}

function removerEntrega(id) {
  if (confirm("Remover este registro de entrega?")) {
    deleteEntrega(id);
    carregarStatsLogistica();
    carregarTabelaEntregas();
  }
}

function aplicarFiltros(tabelaId) {
  const filtro = document.getElementById("select-filtro").value.toLowerCase();
  const linhas = document.querySelectorAll("#" + tabelaId + " tr");
  linhas.forEach((linha) => {
    const status = linha.querySelector(".status")?.textContent.toLowerCase() || "";
    linha.style.display = !filtro || status.includes(filtro) ? "" : "none";
  });
}

