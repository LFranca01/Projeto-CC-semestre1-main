// ================= INICIO MODULE =================
let _chartL = null;

function _setText(id, v) {
  const el = document.getElementById(id);
  if (el) el.innerText = v;
}

function carregarStatsInicio() {
  const pedidos = getPedidos();
  const entregas = getEntregas();
  const transferencias = getTransferencias();
  const pagamentos = getPagamentos();
  const receita = pagamentos.filter(p => p.situacao === "Pago").reduce((a, p) => a + (parseFloat(p.valor) || 0), 0);
  const emTransito = entregas.filter((e) => e.situacao === "Em Trânsito").length;

  // Mobile carousel ids
  _setText("pedidos-count", pedidos.length);
  _setText("transito-count", emTransito);
  _setText("total-vendas", formatarMoeda(receita));
  _setText("clientes-count", transferencias.length);
  // Desktop stack ids
  _setText("pedidos-count-d", pedidos.length);
  _setText("transito-count-d", emTransito);
  _setText("total-vendas-d", formatarMoeda(receita));
  // Hub status
  _setText("hub-pedidos", pedidos.length);
}

function _isDarkMode() {
  return document.documentElement.getAttribute("data-theme") === "dark";
}

function initCharts() {
  if (typeof Chart === "undefined") return;
  if (_chartL) {
    try { _chartL.destroy(); } catch (e) {}
    _chartL = null;
  }

  const pedidos = getPedidos();
  const entregas = getEntregas();
  const pendentes = pedidos.filter((p) => (p.status || "Pendente") === "Pendente").length;
  const emTransito = entregas.filter((e) => e.situacao === "Em Trânsito").length;
  const entreguesE = entregas.filter((e) => e.situacao === "Entregue").length;

  const ctxL = document.getElementById("chartLogistica");
  if (!ctxL) return;

  Chart.defaults.font.family = "'Josefin Sans', sans-serif";
  Chart.defaults.color = _isDarkMode() ? "#cbd5e1" : "#475569";

  _chartL = new Chart(ctxL.getContext("2d"), {
    type: "doughnut",
    data: {
      labels: ["Pendente", "Em Trânsito", "Entregue"],
      datasets: [{
        data: [pendentes, emTransito, entreguesE],
        backgroundColor: ["#f59e0b", "#3b82f6", "#10b981"],
        borderWidth: 0,
        spacing: 2,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: "65%",
      plugins: {
        legend: { position: "bottom", labels: { boxWidth: 12, padding: 14, usePointStyle: true } },
      },
    },
  });
}
