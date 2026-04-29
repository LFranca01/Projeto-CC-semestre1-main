// ================= RH MODULE =================

function carregarStatsRH() {
  const lista = getFuncionarios();
  document.getElementById("stat-total").innerText = lista.length;
  document.getElementById("stat-ativos").innerText = lista.filter((f) => f.situacao === "Ativo").length;
  const folha = lista.reduce((s, f) => s + (parseFloat(f.salario) || 0), 0);
  document.getElementById("stat-folha").innerText = formatarMoeda(folha);
}

function carregarTabelaFuncionarios() {
  const lista = getFuncionarios();
  const tabela = document.getElementById("tabela-rh");
  if (!lista.length) {
    tabela.innerHTML = `<tr><td colspan="10" class="tabela-vazia">
    <span class="material-icons-round">badge</span>
    <p>Nenhum funcionário cadastrado.</p></td></tr>`;
    return;
  }
  tabela.innerHTML = lista
    .map(
      (f) => `
  <tr>
    <td class="td-bold">${f.nome}</td>
    <td>${formatarDocumento(f.cpf)}</td>
    <td>${f.email || "—"}</td>
    <td>${f.telefone || "—"}</td>
    <td><span class="badge-cargo">${f.cargo || "—"}</span></td>
    <td>${f.filialNome || formatarFilial(getFilialById(f.filialId))}</td>
    <td>${formatarData(f.contratacao)}</td>
    <td>${formatarMoeda(f.salario)}</td>
    <td><span class="status ${f.situacao === "Ativo" ? "ativo" : "inativo"}">${f.situacao}</span></td>
    <td>
      <button class="btn-icon" onclick="editarFuncionario(${f.id})"><span class="material-icons-round">edit</span></button>
      <button class="btn-icon danger" onclick="removerFuncionario(${f.id})"><span class="material-icons-round">delete</span></button>
    </td>
  </tr>`,
    )
    .join("");
}

function popularFiliaisRH() {
  document.getElementById("func-filial").innerHTML =
    '<option value="">Selecione...</option>' +
    getFiliais().map((f) => `<option value="${f.id}">${formatarFilial(f)}</option>`).join("");
}

function alternarCampoCNH() {
  const cargo = document.getElementById("func-cargo").value.toLowerCase();
  document.getElementById("grupo-cnh").style.display = cargo === "motorista" ? "" : "none";
}

function abrirModalNovoFuncionario() {
  document.getElementById("modal-titulo").innerText = "Novo Funcionário";
  limparFormulario("modalFuncionario");
  delete document.getElementById("modalFuncionario").dataset.editId;
  popularFiliaisRH();
  alternarCampoCNH();
  abrirModal("modalFuncionario");
}

function editarFuncionario(id) {
  const f = getFuncionarioById(id);
  if (!f) return;
  popularFiliaisRH();
  document.getElementById("modal-titulo").innerText = "Editar Funcionário";
  document.getElementById("func-nome").value = f.nome;
  document.getElementById("func-cpf").value = f.cpf || "";
  document.getElementById("func-email").value = f.email || "";
  document.getElementById("func-telefone").value = f.telefone || "";
  document.getElementById("func-cargo").value = f.cargo || "";
  document.getElementById("func-filial").value = f.filialId || "";
  document.getElementById("func-cnh").value = f.cnh || "";
  document.getElementById("func-contratacao").value = f.contratacao ? f.contratacao.split("T")[0] : "";
  document.getElementById("func-salario").value = f.salario || "";
  document.getElementById("func-situacao").value = f.situacao || "Ativo";
  document.getElementById("modalFuncionario").dataset.editId = id;
  alternarCampoCNH();
  abrirModal("modalFuncionario");
}

function salvarFuncionario() {
  const nome = document.getElementById("func-nome").value.trim();
  const cargo = document.getElementById("func-cargo").value;
  const filialId = document.getElementById("func-filial").value;
  const cnh = document.getElementById("func-cnh").value.trim();

  if (!nome) return alert("Nome é obrigatório.");
  if (!filialId) return alert("Filial é obrigatória.");
  if (cargo === "Motorista" && !cnh) return alert("CNH é obrigatória para motoristas.");

  const dados = {
    nome,
    cpf: document.getElementById("func-cpf").value,
    email: document.getElementById("func-email").value,
    telefone: document.getElementById("func-telefone").value,
    cargo,
    filialId,
    cnh,
    contratacao: document.getElementById("func-contratacao").value,
    salario: document.getElementById("func-salario").value,
    situacao: document.getElementById("func-situacao").value,
  };
  const editId = document.getElementById("modalFuncionario").dataset.editId;
  if (editId) updateFuncionario(editId, dados);
  else createFuncionario(dados);
  fecharModal("modalFuncionario");
  carregarStatsRH();
  carregarTabelaFuncionarios();
}

function removerFuncionario(id) {
  if (confirm("Deseja remover este funcionário?")) {
    deleteFuncionario(id);
    carregarStatsRH();
    carregarTabelaFuncionarios();
  }
}

