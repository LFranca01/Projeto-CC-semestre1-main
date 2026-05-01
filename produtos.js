// ================= PRODUTOS MODULE =================

function _avisoProd(msg, tipo) {
  if (typeof showToast === "function") showToast(msg, tipo);
  else alert(msg);
}

function isCadastroCompleto(p) {
  return p.sku && p.categoria && p.peso && p.volume && p.descricao && p.filialId;
}

function _dadosAtuaisProdutoPedido(produto) {
  const pedido = getPedidos().find((p) => p.id == produto.pedidoOrigemId);
  if (!pedido) return produto;
  const itens = Array.isArray(pedido.itens) ? pedido.itens : [];
  const item =
    itens[Number(produto.itemPedidoIndex)] ||
    itens.find((i) => (i.produto || "").toLowerCase() === (produto.nome || "").toLowerCase());

  return {
    ...produto,
    nome: item?.produto || produto.nome,
    filialId: pedido.filialId || produto.filialId,
    filialNome: pedido.filialNome || produto.filialNome,
    peso: pedido.frete?.pesoReal || produto.peso,
    volume: pedido.frete?.pesoCubado || produto.volume,
    precoVenda: item ? parseFloat(item.preco) || 0 : produto.precoVenda,
  };
}

function renderSummary() {
  const todos = getProdutos();
  const completos = todos.filter(isCadastroCompleto).length;
  document.getElementById("produtos-summary").innerHTML = `
<div class="summary-pill"><span class="material-icons-round">inventory_2</span><span>Total: <strong>${todos.length}</strong></span></div>
<div class="summary-pill summary-pill-ok"><span class="material-icons-round">check_circle</span><span>Completos: <strong>${completos}</strong></span></div>
<div class="summary-pill summary-pill-warn"><span class="material-icons-round">pending</span><span>Pendentes: <strong>${todos.length - completos}</strong></span></div>`;
}

function carregarTabelaProdutos() {
  const lista = getProdutos();
  const tabela = document.getElementById("tabela-produtos");
  if (!lista.length) {
    tabela.innerHTML =
      '<tr><td colspan="11" class="tabela-vazia"><span class="material-icons-round">category</span><p>Nenhum produto. Eles aparecem automaticamente ao criar pedidos.</p></td></tr>';
    return;
  }
  tabela.innerHTML = lista
    .map((p) => {
      const completo = isCadastroCompleto(p);
      const filial = p.filialNome || formatarFilial(getFilialById(p.filialId));
      return `<tr data-status="${completo ? "completo" : "pendente"}" data-cat="${esc((p.categoria || "").toLowerCase())}" data-filial="${esc((p.filialNome || "").toLowerCase())}">
  <td class="td-bold">${esc(p.nome)}</td>
  <td><span class="sku-tag">${esc(p.sku) || "—"}</span></td>
  <td><span class="pedido-origem">#${esc(p.pedidoOrigemId) || "—"}</span></td>
  <td>${esc(filial)}</td>
  <td>${esc(p.categoria) || "—"}</td>
  <td>${p.peso ? esc(p.peso) + " kg" : "—"}</td>
  <td>${p.volume ? Number(p.volume).toFixed(2) + " kg cub." : "—"}</td>
  <td>${p.precoVenda ? formatarMoeda(p.precoVenda) : "—"}</td>
  <td><span class="prod-unidade">${esc(p.unidade) || "UN"}</span></td>
  <td><span class="status ${completo ? "completo" : "pendente"}">${completo ? "Completo" : "Pendente"}</span></td>
  <td>
    <button class="btn-icon" onclick="editarProduto('${esc(p.id)}')" aria-label="Editar produto"><span class="material-icons-round">edit</span></button>
    <button class="btn-icon danger" onclick="removerProduto('${esc(p.id)}')" aria-label="Excluir produto"><span class="material-icons-round">delete</span></button>
  </td>
</tr>`;
    })
    .join("");
}

function popularFiltroFilialProdutos() {
  const sel = document.getElementById("filtro-filial");
  if (!sel) return;
  sel.innerHTML =
    '<option value="">Todas as Filiais</option>' +
    getFiliais()
      .map((f) => `<option value="${esc(f.nome.toLowerCase())}">${esc(f.nome)}</option>`)
      .join("");
}

function popularSelectFilialProduto() {
  const sel = document.getElementById("prod-filial");
  if (!sel) return;
  sel.innerHTML =
    '<option value="">Selecione...</option>' +
    getFiliais()
      .map((f) => `<option value="${esc(f.id)}">${esc(formatarFilial(f))}</option>`)
      .join("");
}

function editarProduto(id) {
  const p = getProdutos().find((x) => x.id == id);
  if (!p) return;
  popularSelectFilialProduto();
  document.getElementById("prod-nome-display").value = p.nome;
  document.getElementById("prod-sku").value = p.sku || "";
  document.getElementById("prod-categoria").value = p.categoria || "";
  document.getElementById("prod-peso").value = p.peso || "";
  document.getElementById("prod-volume").value = p.volume || "";
  document.getElementById("prod-preco").value = p.precoVenda || "";
  document.getElementById("prod-unidade").value = p.unidade || "UN";
  document.getElementById("prod-descricao").value = p.descricao || "";
  const selFilial = document.getElementById("prod-filial");
  if (selFilial) selFilial.value = p.filialId || "";
  document.getElementById("modalProduto").dataset.editId = id;
  abrirModal("modalProduto");
}

function salvarProduto() {
  const id = document.getElementById("modalProduto").dataset.editId;
  if (!id) return;
  const filialId = document.getElementById("prod-filial")?.value || "";
  const dados = {
    categoria: document.getElementById("prod-categoria").value,
    peso: parseFloat(document.getElementById("prod-peso").value) || null,
    volume: parseFloat(document.getElementById("prod-volume").value) || null,
    precoVenda: parseFloat(document.getElementById("prod-preco").value) || 0,
    unidade: document.getElementById("prod-unidade").value,
    descricao: document.getElementById("prod-descricao").value.trim(),
  };
  if (filialId) dados.filialId = filialId;
  updateProduto(id, dados);
  _avisoProd("Produto atualizado.", "success");
  fecharModal("modalProduto");
  renderSummary();
  carregarTabelaProdutos();
}

function removerProduto(id) {
  if (confirm("Remover este produto?")) {
    deleteProduto(id);
    _avisoProd("Produto removido.", "success");
    renderSummary();
    carregarTabelaProdutos();
  }
}

function carregarTabelaProdutos() {
  const lista = getProdutos();
  const tabela = document.getElementById("tabela-produtos");
  if (!lista.length) {
    tabela.innerHTML =
      '<tr><td colspan="11" class="tabela-vazia"><span class="material-icons-round">category</span><p>Nenhum produto. Eles aparecem automaticamente ao criar pedidos.</p></td></tr>';
    return;
  }
  tabela.innerHTML = lista
    .map((p) => {
      const atual = _dadosAtuaisProdutoPedido(p);
      const completo = isCadastroCompleto(atual);
      const filial = atual.filialNome || formatarFilial(getFilialById(atual.filialId));
      return `<tr data-status="${completo ? "completo" : "pendente"}" data-cat="${esc((atual.categoria || "").toLowerCase())}" data-filial="${esc((filial || "").toLowerCase())}">
  <td class="td-bold">${esc(atual.nome)}</td>
  <td><span class="sku-tag">${esc(atual.sku) || "-"}</span></td>
  <td><span class="pedido-origem">#${esc(atual.pedidoOrigemId) || "-"}</span></td>
  <td>${esc(filial)}</td>
  <td>${esc(atual.categoria) || "-"}</td>
  <td>${atual.peso ? esc(atual.peso) + " kg" : "-"}</td>
  <td>${atual.volume ? Number(atual.volume).toFixed(2) + " kg cub." : "-"}</td>
  <td>${atual.precoVenda ? formatarMoeda(atual.precoVenda) : "-"}</td>
  <td><span class="prod-unidade">${esc(atual.unidade) || "UN"}</span></td>
  <td><span class="status ${completo ? "completo" : "pendente"}">${completo ? "Completo" : "Pendente"}</span></td>
  <td>
    <button class="btn-icon" onclick="editarProduto('${esc(p.id)}')" aria-label="Editar produto"><span class="material-icons-round">edit</span></button>
    <button class="btn-icon danger" onclick="removerProduto('${esc(p.id)}')" aria-label="Excluir produto"><span class="material-icons-round">delete</span></button>
  </td>
</tr>`;
    })
    .join("");
}
