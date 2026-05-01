// ================= AGREGADOS MODULE =================

function _avisoAgr(msg, tipo) {
  if (typeof showToast === "function") showToast(msg, tipo);
  else alert(msg);
}

function carregarStatsAgregados() {
  const lista = getAgregados();
  document.getElementById("stat-total").innerText = lista.length;
  document.getElementById("stat-ativos").innerText = lista.filter(
    (a) => a.situacao === "Ativo",
  ).length;
  document.getElementById("stat-veiculos").innerText = lista.reduce(
    (s, a) => s + (parseInt(a.quantiVei) || 1),
    0,
  );
}

function carregarTabelaAgregados() {
  const lista = getAgregados();
  const tabela = document.getElementById("tabela-agregados");
  if (!lista.length) {
    tabela.innerHTML = `<tr><td colspan="8" class="tabela-vazia">
  <span class="material-icons-round">local_shipping</span>
  <p>Nenhum agregado cadastrado.</p></td></tr>`;
    return;
  }
  tabela.innerHTML = lista
    .map((a) => {
      // Compatibilidade com registros antigos que usavam "rastrador" (typo).
      const rastreador = a.rastreador ?? a.rastrador ?? "";
      const situacao = a.situacao || "Ativo";
      return `
<tr data-status="${esc(situacao.toLowerCase())}" data-tipo-vei="${esc((a.tipoVei || "").toLowerCase())}">
  <td class="td-bold">${esc(a.nome)}</td>
  <td>${esc(a.telefone) || "—"}</td>
  <td>${esc(a.cnh) || "—"}</td>
  <td>${a.tipoVei ? `<span class="badge-tipo">${esc(a.tipoVei)}</span> ${esc(a.modeloVei) || ""}` : "—"}</td>
  <td>${esc(a.placaVei) || "—"}</td>
  <td><span class="status ${rastreador === "Sim" ? "ativo" : "inativo"}">${esc(rastreador) || "—"}</span></td>
  <td><span class="status ${situacao === "Ativo" ? "ativo" : "inativo"}">${esc(situacao)}</span></td>
  <td>
    <button class="btn-icon" onclick="editarAgregado(${esc(a.id)})" aria-label="Editar agregado"><span class="material-icons-round">edit</span></button>
    <button class="btn-icon danger" onclick="removerAgregado(${esc(a.id)})" aria-label="Excluir agregado"><span class="material-icons-round">delete</span></button>
  </td>
</tr>`;
    })
    .join("");
}

function abrirModalNovoAgregado() {
  document.getElementById("modal-titulo").innerText = "Novo Agregado";
  limparFormulario("modalAgregado");
  delete document.getElementById("modalAgregado").dataset.editId;
  abrirModal("modalAgregado");
}

function editarAgregado(id) {
  const a = getAgregadoById(id);
  if (!a) return;
  document.getElementById("modal-titulo").innerText = "Editar Agregado";
  document.getElementById("agr-nome").value = a.nome;
  document.getElementById("agr-telefone").value = a.telefone || "";
  document.getElementById("agr-cnh").value = a.cnh || "";
  document.getElementById("agr-tipo-vei").value = a.tipoVei || "";
  document.getElementById("agr-modelo-vei").value = a.modeloVei || "";
  document.getElementById("agr-placa-vei").value = a.placaVei || "";
  document.getElementById("agr-quanti-vei").value = a.quantiVei || 1;
  document.getElementById("agr-rastreador").value = a.rastreador ?? a.rastrador ?? "Não";
  document.getElementById("agr-situacao").value = a.situacao || "Ativo";
  document.getElementById("modalAgregado").dataset.editId = id;
  abrirModal("modalAgregado");
}

function salvarAgregado() {
  const nome = document.getElementById("agr-nome").value.trim();
  if (!nome) return _avisoAgr("Nome é obrigatório.", "error");
  const dados = {
    nome,
    telefone: document.getElementById("agr-telefone").value,
    cnh: document.getElementById("agr-cnh").value,
    tipoVei: document.getElementById("agr-tipo-vei").value,
    modeloVei: document.getElementById("agr-modelo-vei").value,
    placaVei: document.getElementById("agr-placa-vei").value,
    quantiVei: document.getElementById("agr-quanti-vei").value,
    rastreador: document.getElementById("agr-rastreador").value,
    situacao: document.getElementById("agr-situacao").value,
  };
  const editId = document.getElementById("modalAgregado").dataset.editId;
  if (editId) {
    updateAgregado(editId, dados);
    _avisoAgr("Agregado atualizado.", "success");
  } else {
    createAgregado(dados);
    _avisoAgr("Agregado cadastrado.", "success");
  }
  fecharModal("modalAgregado");
  carregarStatsAgregados();
  carregarTabelaAgregados();
}

function removerAgregado(id) {
  if (confirm("Deseja remover este agregado?")) {
    deleteAgregado(id);
    _avisoAgr("Agregado removido.", "success");
    carregarStatsAgregados();
    carregarTabelaAgregados();
  }
}
