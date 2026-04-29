// ================= PRODUTOS MODULE =================

function isCadastroCompleto(p) {
  return p.sku && p.categoria && p.peso && p.volume && p.descricao && p.filialId;
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
      return `<tr>
  <td class="td-bold">${p.nome}</td>
  <td><span class="sku-tag">${p.sku || "—"}</span></td>
  <td><span class="pedido-origem">#${p.pedidoOrigemId || "—"}</span></td>
  <td>${filial}</td>
  <td>${p.categoria || "—"}</td>
  <td>${p.peso ? p.peso + " kg" : "—"}</td>
  <td>${p.volume ? Number(p.volume).toFixed(2) + " kg cub." : "—"}</td>
  <td>${p.precoVenda ? formatarMoeda(p.precoVenda) : "—"}</td>
  <td><span class="prod-unidade">${p.unidade || "UN"}</span></td>
  <td><span class="status ${completo ? "completo" : "pendente"}">${completo ? "Completo" : "Pendente"}</span></td>
  <td>
    <button class="btn-icon" onclick="editarProduto('${p.id}')"><span class="material-icons-round">edit</span></button>
    <button class="btn-icon danger" onclick="removerProduto('${p.id}')"><span class="material-icons-round">delete</span></button>
  </td>
</tr>`;
    })
    .join("");
}

function editarProduto(id) {
  const p = getProdutos().find((x) => x.id == id);
  if (!p) return;
  document.getElementById("prod-nome-display").value = p.nome;
  document.getElementById("prod-sku").value = p.sku || "";
  document.getElementById("prod-categoria").value = p.categoria || "";
  document.getElementById("prod-peso").value = p.peso || "";
  document.getElementById("prod-volume").value = p.volume || "";
  document.getElementById("prod-preco").value = p.precoVenda || "";
  document.getElementById("prod-unidade").value = p.unidade || "UN";
  document.getElementById("prod-descricao").value = p.descricao || "";
  document.getElementById("modalProduto").dataset.editId = id;
  abrirModal("modalProduto");
}

function salvarProduto() {
  const id = document.getElementById("modalProduto").dataset.editId;
  if (!id) return;
  updateProduto(id, {
    categoria: document.getElementById("prod-categoria").value,
    peso: parseFloat(document.getElementById("prod-peso").value) || null,
    volume: parseFloat(document.getElementById("prod-volume").value) || null,
    precoVenda: parseFloat(document.getElementById("prod-preco").value) || 0,
    unidade: document.getElementById("prod-unidade").value,
    descricao: document.getElementById("prod-descricao").value.trim(),
  });
  fecharModal("modalProduto");
  renderSummary();
  carregarTabelaProdutos();
}

function removerProduto(id) {
  if (confirm("Remover este produto?")) {
    deleteProduto(id);
    renderSummary();
    carregarTabelaProdutos();
  }
}

