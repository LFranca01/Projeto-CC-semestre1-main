// ================= PEDIDOS MODULE =================

const PED_PAGE_SIZE = 10;
let _pedPagina = 1;

function _avisoPed(msg, tipo) {
  if (typeof showToast === "function") showToast(msg, tipo);
  else alert(msg);
}

// Cor do avatar-letter por hash do nome (consistente entre renders).
function _corAvatar(nome) {
  const cores = ["blue", "green", "orange", "purple", "red"];
  let h = 0;
  for (const c of String(nome || "?")) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return cores[h % cores.length];
}

function _iniciais(nome) {
  if (!nome) return "?";
  const partes = String(nome).trim().split(/\s+/);
  if (partes.length === 1) return partes[0].slice(0, 2).toUpperCase();
  return (partes[0][0] + partes[partes.length - 1][0]).toUpperCase();
}

function _statusClass(status) {
  const s = (status || "Pendente").toLowerCase();
  if (s === "entregue" || s === "delivered") return "entregue";
  if (s === "enviado" || s === "transito" || s === "in transit") return "transito";
  if (s === "atrasado" || s === "delayed") return "delayed";
  return "pendente";
}

function carregarTabelaPedidos() {
  _pedPagina = 1;
  _renderPed();
}

function _renderPed() {
  const todos = getPedidos();
  const tabela = document.getElementById("tabela-pedidos");
  if (!todos.length) {
    tabela.innerHTML =
      '<tr><td colspan="7" class="tabela-vazia"><span class="material-icons-round">inventory_2</span><p>Nenhum pedido registrado.</p></td></tr>';
    _renderPedPaginacao(0, 0, 0);
    return;
  }

  const totalPag = Math.max(1, Math.ceil(todos.length / PED_PAGE_SIZE));
  if (_pedPagina > totalPag) _pedPagina = totalPag;
  const ini = (_pedPagina - 1) * PED_PAGE_SIZE;
  const fim = Math.min(ini + PED_PAGE_SIZE, todos.length);
  const pedidos = todos.slice(ini, fim);

  tabela.innerHTML = pedidos
    .map((p) => {
      const status = p.status || "Pendente";
      const cor = _corAvatar(p.clienteNome);
      const ini = _iniciais(p.clienteNome);
      return `
  <tr data-status="${esc(status.toLowerCase())}" data-filial="${esc((p.filialNome || "").toLowerCase())}">
    <td class="td-bold">#${esc(p.id)}</td>
    <td>
      <div class="cell-customer">
        <span class="avatar-letter ${cor}">${esc(ini)}</span>
        <span>${esc(p.clienteNome) || '<span class="sem-nome">Sem nome</span>'}</span>
      </div>
    </td>
    <td>${esc(p.filialNome) || "—"}</td>
    <td>${formatarData(p.dataPedido)}</td>
    <td class="td-valor">${formatarMoeda(p.freteFinal || p.receitaFrete || p.total)}</td>
    <td><span class="status ${_statusClass(status)}">${esc(status)}</span></td>
    <td>
      <button class="btn-icon" onclick="editarPedido(${esc(p.id)})" aria-label="Editar pedido"><span class="material-icons-round">edit</span></button>
      <button class="btn-icon danger" onclick="removerPedido(${esc(p.id)})" aria-label="Excluir pedido"><span class="material-icons-round">delete</span></button>
    </td>
  </tr>`;
    })
    .join("");

  _renderPedPaginacao(ini + 1, fim, todos.length);
}

function _renderPedPaginacao(ini, fim, total) {
  const info = document.getElementById("paginacao-info");
  const ctrls = document.getElementById("paginacao-controles");
  if (!info || !ctrls) return;
  if (!total) {
    info.innerText = "Sem registros";
    ctrls.innerHTML = "";
    return;
  }
  info.innerText = `Mostrando ${ini} a ${fim} de ${total} registros`;
  const totalPag = Math.max(1, Math.ceil(total / PED_PAGE_SIZE));
  let html = `<button class="pagination-btn" onclick="_pagPed(-1)" ${_pedPagina <= 1 ? 'disabled style="opacity:.4"' : ""}><span class="material-icons-round">chevron_left</span></button>`;
  for (let i = 1; i <= totalPag; i++) {
    if (i === 1 || i === totalPag || Math.abs(i - _pedPagina) <= 1) {
      html += `<button class="pagination-btn ${i === _pedPagina ? "active" : ""}" onclick="_irPedPag(${i})">${i}</button>`;
    } else if (Math.abs(i - _pedPagina) === 2) {
      html += `<span style="padding:0 4px; color:var(--text-subtle)">…</span>`;
    }
  }
  html += `<button class="pagination-btn" onclick="_pagPed(1)" ${_pedPagina >= totalPag ? 'disabled style="opacity:.4"' : ""}><span class="material-icons-round">chevron_right</span></button>`;
  ctrls.innerHTML = html;
}

function _pagPed(d) { _pedPagina += d; _renderPed(); }
function _irPedPag(p) { _pedPagina = p; _renderPed(); }

function popularSelectClientes() {
  const clientes = getClientes();
  document.getElementById("select-cliente").innerHTML =
    '<option value="">Selecione...</option>' +
    clientes.map((c) => `<option value="${esc(c.id)}">${esc(c.nome)}</option>`).join("");
}

function popularSelectFiliaisPedido() {
  document.getElementById("select-filial").innerHTML =
    '<option value="">Selecione...</option>' +
    getFiliais().map((f) => `<option value="${esc(f.id)}">${esc(formatarFilial(f))}</option>`).join("");
}

function popularFiltroFilialPedidos() {
  const sel = document.getElementById("filtro-filial");
  if (!sel) return;
  sel.innerHTML =
    '<option value="">Todas as Filiais</option>' +
    getFiliais().map((f) => `<option value="${esc(f.nome.toLowerCase())}">${esc(f.nome)}</option>`).join("");
}

function limparFiltrosPedidos() {
  ["input-busca", "select-filtro", "filtro-data", "filtro-filial"].forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.value = "";
  });
  document.querySelectorAll("#tabela-pedidos tr").forEach((tr) => (tr.style.display = ""));
}

function exportarPedidos() {
  const pedidos = getPedidos();
  if (!pedidos.length) return _avisoPed("Nada para exportar.", "error");
  const csv = [
    "id,cliente,filial,data,frete,status",
    ...pedidos.map((p) =>
      [p.id, JSON.stringify(p.clienteNome || ""), JSON.stringify(p.filialNome || ""),
       p.dataPedido, p.freteFinal || p.total || 0, p.status || "Pendente"].join(","),
    ),
  ].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = "pedidos.csv"; a.click();
  URL.revokeObjectURL(url);
  _avisoPed("Exportação concluída.", "success");
}

function atualizarEnderecoCliente() {
  const cliente = getClienteById(document.getElementById("select-cliente").value);
  document.getElementById("endereco-entrega").value = montarEnderecoCliente(cliente);
}

function adicionarLinhaItem(produto = "", qtd = "", preco = "") {
  const div = document.createElement("div");
  div.className = "row-item-pedido";
  div.innerHTML = `
  <input type="text" placeholder="Produto" class="form-control input-produto" value="${esc(produto)}" maxlength="100">
  <input type="number" placeholder="Qtd" class="form-control input-qtd" value="${esc(qtd)}" min="0" step="0.01">
  <input type="number" placeholder="Valor declarado" class="form-control input-preco" value="${esc(preco)}" min="0" step="0.01">
  <button class="btn-icon danger" onclick="this.parentElement.remove(); atualizarPreviewFrete();" aria-label="Remover">
    <span class="material-icons-round">delete</span>
  </button>`;
  document.getElementById("lista-itens-selecionados").appendChild(div);
}

function abrirModalNovoPedido() {
  document.getElementById("modal-titulo").innerText = "Registrar Novo Pedido";
  limparFormulario("modalPedido");
  document.getElementById("lista-itens-selecionados").innerHTML = "";
  delete document.getElementById("modalPedido").dataset.editId;
  document.getElementById("data-pedido").value = new Date().toISOString().split("T")[0];
  document.getElementById("frete-preview").innerText =
    "Selecione cliente, filial e dimensões para calcular o frete.";
  abrirModal("modalPedido");
}

function editarPedido(id) {
  const p = getPedidos().find((x) => x.id == id);
  if (!p) return;
  document.getElementById("modal-titulo").innerText = "Editar Pedido";
  document.getElementById("select-cliente").value = p.clienteId;
  document.getElementById("select-filial").value = p.filialId || "";
  document.getElementById("data-pedido").value = p.dataPedido ? p.dataPedido.split("T")[0] : "";
  document.getElementById("endereco-entrega").value = p.enderecoEntrega || "";
  document.getElementById("peso-real").value = p.frete?.pesoReal || "";
  document.getElementById("comprimento").value = p.frete?.comprimento || "";
  document.getElementById("largura").value = p.frete?.largura || "";
  document.getElementById("altura").value = p.frete?.altura || "";
  document.getElementById("tipo-carga").value = p.frete?.tipoCarga || "Normal";
  document.getElementById("pedagio").checked = Boolean(p.frete?.pedagio);
  document.getElementById("taxa-risco").checked = Boolean(p.frete?.taxaRisco);
  document.getElementById("seguro").checked = Boolean(p.frete?.seguro);
  document.getElementById("lista-itens-selecionados").innerHTML = "";
  (p.itens || []).forEach((i) => adicionarLinhaItem(i.produto, i.qtd, i.preco));
  document.getElementById("modalPedido").dataset.editId = id;
  atualizarPreviewFrete();
  abrirModal("modalPedido");
}

function coletarDadosFrete() {
  return {
    filialId: document.getElementById("select-filial").value,
    pesoReal: document.getElementById("peso-real").value,
    comprimento: document.getElementById("comprimento").value,
    largura: document.getElementById("largura").value,
    altura: document.getElementById("altura").value,
    tipoCarga: document.getElementById("tipo-carga").value,
    pedagio: document.getElementById("pedagio").checked,
    taxaRisco: document.getElementById("taxa-risco").checked,
    seguro: document.getElementById("seguro").checked,
  };
}

function atualizarPreviewFrete() {
  const cliente = getClienteById(document.getElementById("select-cliente").value);
  const dados = coletarDadosFrete();
  const preview = document.getElementById("frete-preview");
  if (!cliente || !dados.filialId || !dados.pesoReal) {
    preview.innerText = "Selecione cliente, filial e peso real para calcular o frete.";
    return;
  }
  const frete = calcularFrete(dados, cliente);
  preview.innerHTML = `
    <strong>Frete final: ${formatarMoeda(frete.freteFinal)}</strong>
    <span>Peso cubado: ${frete.pesoCubado.toFixed(2)} kg • Peso taxado: ${frete.pesoTaxado.toFixed(2)} kg • Distância: ${frete.distanciaKm} km</span>
  `;
}

function salvarPedido() {
  const modal = document.getElementById("modalPedido");
  const editId = modal.dataset.editId;
  const clienteId = document.getElementById("select-cliente").value;
  const filialId = document.getElementById("select-filial").value;
  const data = document.getElementById("data-pedido").value;
  const linhas = document.querySelectorAll(".row-item-pedido");

  if (!clienteId || !filialId || !data || !linhas.length) {
    return _avisoPed("Preencha cliente, filial, data e ao menos um produto.", "error");
  }

  let itens = [];
  let totalProd = 0;
  linhas.forEach((l) => {
    const prod = l.querySelector(".input-produto").value.trim();
    const qtd = parseFloat(l.querySelector(".input-qtd").value);
    const preco = parseFloat(l.querySelector(".input-preco").value);
    if (prod && qtd && preco) { itens.push({ produto: prod, qtd, preco }); totalProd += qtd * preco; }
  });
  if (!itens.length) return _avisoPed("Adicione um produto válido.", "error");

  const sel = document.getElementById("select-cliente");
  const dados = {
    clienteId, clienteNome: sel.options[sel.selectedIndex].text,
    filialId, total: totalProd, dataPedido: data,
    enderecoEntrega: document.getElementById("endereco-entrega").value,
    itens, ...coletarDadosFrete(),
  };

  if (editId) { updatePedido(editId, dados); _avisoPed("Pedido atualizado.", "success"); }
  else { createPedido(dados); _avisoPed("Pedido criado.", "success"); }

  cancelarModalPedido();
  carregarTabelaPedidos();
}

function cancelarModalPedido() {
  delete document.getElementById("modalPedido").dataset.editId;
  document.getElementById("modal-titulo").innerText = "Registrar Novo Pedido";
  limparFormulario("modalPedido");
  document.getElementById("lista-itens-selecionados").innerHTML = "";
  fecharModal("modalPedido");
}

function removerPedido(id) {
  if (confirm("Excluir este pedido?")) {
    deletePedido(id);
    _avisoPed("Pedido excluído.", "success");
    carregarTabelaPedidos();
  }
}
