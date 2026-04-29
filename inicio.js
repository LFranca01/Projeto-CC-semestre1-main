// ================= INICIO MODULE =================

function carregarStatsInicio() {
  const pedidos = getPedidos();
  const entregas = getEntregas();
  const transferencias = getTransferencias();
  const receitaFrete = pedidos.reduce((a, p) => a + (parseFloat(p.freteFinal) || 0), 0);

  document.getElementById("pedidos-count").innerText = pedidos.length;
  document.getElementById("transito-count").innerText = entregas.filter(
    (e) => e.situacao === "Em Trânsito",
  ).length;
  document.getElementById("total-vendas").innerText = formatarMoeda(receitaFrete);
  document.getElementById("clientes-count").innerText = transferencias.length;
}

function renderUltimosPedidos() {
  const pedidos = getPedidos().slice(-5).reverse();
  document.getElementById("tabela-dashboard").innerHTML = pedidos.length
    ? pedidos
        .map(
          (p) => `
    <tr>
      <td class="td-bold">#${p.id}</td>
      <td>${p.clienteNome || '<span class="sem-nome">Sem nome</span>'}</td>
      <td>${p.filialNome || "—"}</td>
      <td>${formatarMoeda(p.freteFinal || p.receitaFrete || p.total)}</td>
      <td><span class="status ${p.status.toLowerCase()}">${p.status}</span></td>
    </tr>`,
        )
        .join("")
    : '<tr><td colspan="5" class="tabela-vazia"><span class="material-icons-round">inventory_2</span><p>Nenhum pedido ainda.</p></td></tr>';
}

function initCharts() {
  const pedidos = getPedidos();
  const entregas = getEntregas();
  const pendentes = pedidos.filter((p) => p.status === "Pendente").length;
  const enviados = pedidos.filter((p) => p.status === "Enviado").length;
  const entregues = pedidos.filter((p) => p.status === "Entregue").length;
  const emTransito = entregas.filter((e) => e.situacao === "Em Trânsito").length;
  const entreguesE = entregas.filter((e) => e.situacao === "Entregue").length;
  const pedidosPorFilial = contarPedidosPorFilial();

  new Chart(document.getElementById("chartLogistica").getContext("2d"), {
    type: "doughnut",
    data: {
      labels: ["Pendente", "Em Trânsito", "Entregue"],
      datasets: [
        {
          data: [pendentes, emTransito, entreguesE],
          backgroundColor: ["#f59e0b", "#3b82f6", "#10b981"],
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { position: "bottom" } },
    },
  });

  new Chart(document.getElementById("chartPedidos").getContext("2d"), {
    type: "bar",
    data: {
      labels: pedidosPorFilial.map((f) => f.nome),
      datasets: [
        {
          label: "Pedidos por filial",
          data: pedidosPorFilial.map((f) => f.pedidos),
          backgroundColor: "#3b82f6",
          borderRadius: 6,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
    },
  });
}

