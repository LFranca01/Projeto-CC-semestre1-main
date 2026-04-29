// ================= FILIAIS / HUBS MODULE =================

function carregarStatsFiliais() {
  const filiais = getFiliais();
  const pedidos = getPedidos();
  const transferencias = getTransferencias();
  const receita = pedidos.reduce((total, p) => total + (parseFloat(p.freteFinal) || 0), 0);

  document.getElementById("total-filiais").innerText = filiais.length;
  document.getElementById("total-pedidos-filiais").innerText = pedidos.length;
  document.getElementById("total-transferencias").innerText = transferencias.length;
  document.getElementById("receita-filiais").innerText = formatarMoeda(receita);
}

function renderFiliais() {
  const tabela = document.getElementById("tabela-filiais");
  const dados = contarPedidosPorFilial();

  tabela.innerHTML = dados
    .map(
      (f) => `
      <tr>
        <td><strong>${f.nome}</strong></td>
        <td>${f.cidade}/${f.estado}</td>
        <td>${f.distanciaKm} km</td>
        <td>${f.pedidos}</td>
        <td>${formatarMoeda(f.receita)}</td>
        <td><span class="status ${f.pedidos ? "entregue" : "pendente"}">${f.pedidos ? "Operando" : "Sem pedidos"}</span></td>
      </tr>
    `,
    )
    .join("");
}

function renderTransferencias() {
  const tabela = document.getElementById("tabela-transferencias");
  const transferencias = getTransferencias().slice().reverse();

  if (!transferencias.length) {
    tabela.innerHTML = `<tr><td colspan="6" class="tabela-vazia">
      <span class="material-icons-round">sync_alt</span>
      <p>Nenhuma transferência entre hubs registrada.</p>
    </td></tr>`;
    return;
  }

  tabela.innerHTML = transferencias
    .map(
      (t) => `
      <tr>
        <td>${formatarData(t.data)}</td>
        <td>${t.origemNome}</td>
        <td>${t.destinoNome}</td>
        <td>${t.pedidoId ? "#" + t.pedidoId : "—"}</td>
        <td>${t.responsavel || "—"}</td>
        <td><span class="status enviado">${t.status}</span></td>
      </tr>
    `,
    )
    .join("");
}

function popularSelectFiliais() {
  const opcoes = getFiliais()
    .map((f) => `<option value="${f.id}">${formatarFilial(f)}</option>`)
    .join("");
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

  if (!origemId || !destinoId) return alert("Selecione origem e destino.");
  if (origemId === destinoId) return alert("Origem e destino precisam ser filiais diferentes.");

  createTransferencia({
    origemId,
    destinoId,
    pedidoId: document.getElementById("transf-pedido").value,
    responsavel: document.getElementById("transf-responsavel").value,
    observacao: document.getElementById("transf-observacao").value,
  });

  fecharModal("modalTransferencia");
  carregarStatsFiliais();
  renderTransferencias();
}

function aplicarFiltrosFiliais() {
  const busca = (document.getElementById("input-busca")?.value || "").toLowerCase();
  document.querySelectorAll("#tabela-filiais tr").forEach((linha) => {
    linha.style.display = linha.innerText.toLowerCase().includes(busca) ? "" : "none";
  });
}

