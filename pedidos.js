// ================= PEDIDOS MODULE =================

function carregarTabelaPedidos() {
  const pedidos = getPedidos();
  const tabela = document.getElementById("tabela-pedidos");
  if (!pedidos.length) {
    tabela.innerHTML =
      '<tr><td colspan="7" class="tabela-vazia"><span class="material-icons-round">inventory_2</span><p>Nenhum pedido registrado.</p></td></tr>';
    return;
  }
  tabela.innerHTML = pedidos
    .map(
      (p) => `
  <tr>
    <td class="td-bold">#${p.id}</td>
    <td>${p.clienteNome || "—"}</td>
    <td>${formatarData(p.dataPedido)}</td>
    <td>${p.filialNome || "—"}</td>
    <td>${formatarMoeda(p.freteFinal || p.receitaFrete || p.total)}</td>
    <td><span class="status ${p.status.toLowerCase()}">${p.status}</span></td>
    <td>
      <button class="btn-icon" onclick="editarPedido(${p.id})"><span class="material-icons-round">edit</span></button>
      <button class="btn-icon danger" onclick="removerPedido(${p.id})"><span class="material-icons-round">delete</span></button>
    </td>
  </tr>`,
    )
    .join("");
}

function popularSelectClientes() {
  const clientes = getClientes();
  document.getElementById("select-cliente").innerHTML =
    '<option value="">Selecione...</option>' +
    clientes.map((c) => `<option value="${c.id}">${c.nome}</option>`).join("");
}

function popularSelectFiliaisPedido() {
  document.getElementById("select-filial").innerHTML =
    '<option value="">Selecione...</option>' +
    getFiliais().map((f) => `<option value="${f.id}">${formatarFilial(f)}</option>`).join("");
}

function atualizarEnderecoCliente() {
  const cliente = getClienteById(document.getElementById("select-cliente").value);
  document.getElementById("endereco-entrega").value = montarEnderecoCliente(cliente);
}

function adicionarLinhaItem(produto = "", qtd = "", preco = "") {
  const div = document.createElement("div");
  div.className = "row-item-pedido";
  div.innerHTML = `
  <input type="text" placeholder="Produto" class="form-control input-produto" value="${produto}">
  <input type="number" placeholder="Qtd" class="form-control input-qtd" value="${qtd}">
  <input type="number" placeholder="Valor declarado" class="form-control input-preco" value="${preco}">
  <button class="btn-icon danger" onclick="this.parentElement.remove(); atualizarPreviewFrete();">
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
    "Selecione cliente, filial e dimensÃµes para calcular o frete.";
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
  const dadosFrete = coletarDadosFrete();
  const preview = document.getElementById("frete-preview");
  if (!cliente || !dadosFrete.filialId || !dadosFrete.pesoReal) {
    preview.innerText = "Selecione cliente, filial e peso real para calcular o frete.";
    return;
  }
  const frete = calcularFrete(dadosFrete, cliente);
  preview.innerHTML = `
    <strong>Frete final: ${formatarMoeda(frete.freteFinal)}</strong>
    <span>Peso cubado: ${frete.pesoCubado.toFixed(2)} kg | Peso taxado: ${frete.pesoTaxado.toFixed(2)} kg | DistÃ¢ncia: ${frete.distanciaKm} km</span>
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
    return alert("Preencha cliente, filial, data e pelo menos um produto.");
  }

  let itens = [];
  let totalProdutos = 0;
  linhas.forEach((l) => {
    const prod = l.querySelector(".input-produto").value.trim();
    const qtd = parseFloat(l.querySelector(".input-qtd").value);
    const preco = parseFloat(l.querySelector(".input-preco").value);
    if (prod && qtd && preco) {
      itens.push({ produto: prod, qtd, preco });
      totalProdutos += qtd * preco;
    }
  });
  if (!itens.length) return alert("Adicione pelo menos um produto válido.");

  const sel = document.getElementById("select-cliente");
  const dados = {
    clienteId,
    clienteNome: sel.options[sel.selectedIndex].text,
    filialId,
    total: totalProdutos,
    dataPedido: data,
    enderecoEntrega: document.getElementById("endereco-entrega").value,
    itens,
    ...coletarDadosFrete(),
  };

  if (editId) updatePedido(editId, dados);
  else createPedido(dados);
  cancelarModalPedido();
  carregarTabelaPedidos();
}

function cancelarModalPedido() {
  const modal = document.getElementById("modalPedido");
  delete modal.dataset.editId;
  document.getElementById("modal-titulo").innerText = "Registrar Novo Pedido";
  limparFormulario("modalPedido");
  document.getElementById("lista-itens-selecionados").innerHTML = "";
  fecharModal("modalPedido");
}

function removerPedido(id) {
  if (confirm("Excluir este pedido?")) {
    deletePedido(id);
    carregarTabelaPedidos();
  }
}

