// ================= RH MODULE =================

function _avisoRH(msg, tipo) {
  if (typeof showToast === "function") showToast(msg, tipo);
  else alert(msg);
}

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

function carregarStatsRH() {
  const lista = getFuncionarios();
  const clt = lista.filter((f) => (f.contrato || "CLT") === "CLT").length;
  const pj = lista.length - clt;
  const folha = lista.reduce((s, f) => s + (parseFloat(f.salario) || 0), 0);
  const _set = (id, v) => { const e = document.getElementById(id); if (e) e.innerText = v; };
  _set("stat-total", lista.length);
  _set("stat-clt", clt);
  _set("stat-pj", pj);
  _set("stat-folha", formatarMoeda(folha));
  _set("stat-ativos", lista.filter((f) => f.situacao === "Ativo").length);
}

function carregarTabelaFuncionarios() {
  const lista = getFuncionarios();
  const tabela = document.getElementById("tabela-rh");
  if (!lista.length) {
    tabela.innerHTML = `<tr><td colspan="6" class="tabela-vazia">
    <span class="material-icons-round">badge</span>
    <p>Nenhum funcionário cadastrado.</p></td></tr>`;
    return;
  }
  tabela.innerHTML = lista
    .map((f) => {
      const filialNome = f.filialNome || formatarFilial(getFilialById(f.filialId));
      const situacao = f.situacao || "Ativo";
      const contrato = f.contrato || "CLT";
      const cor = _corAvatar(f.nome);
      const iniciais = _iniciais(f.nome);
      const badgeCls = contrato === "PJ" ? "badge-pj" : "badge-clt";
      return `
  <tr data-status="${esc(situacao.toLowerCase())}" data-cargo="${esc((f.cargo || "").toLowerCase())}" data-filial="${esc((filialNome || "").toLowerCase())}">
    <td>
      <div class="cell-customer">
        <span class="avatar-letter ${cor}">${esc(iniciais)}</span>
        <div style="display:flex; flex-direction:column">
          <span class="td-bold">${esc(f.nome)}</span>
          <span style="font-size:12.5px; color:var(--text-muted)">${esc(f.email) || formatarDocumento(f.cpf)}</span>
        </div>
      </div>
    </td>
    <td>
      <div style="display:flex; flex-direction:column">
        <span style="font-weight:500">${esc(f.cargo) || "—"}</span>
        <span style="font-size:12.5px; color:var(--text-muted)">${esc(filialNome)}</span>
      </div>
    </td>
    <td class="td-valor">${formatarMoeda(f.salario)}</td>
    <td><span class="badge-cargo ${badgeCls}">${esc(contrato)}</span></td>
    <td><span class="status ${situacao === "Ativo" ? "ativo" : "inativo"}">${esc(situacao)}</span></td>
    <td>
      <button class="btn-icon" onclick="editarFuncionario(${esc(f.id)})" aria-label="Editar"><span class="material-icons-round">edit</span></button>
      <button class="btn-icon danger" onclick="removerFuncionario(${esc(f.id)})" aria-label="Excluir"><span class="material-icons-round">delete</span></button>
    </td>
  </tr>`;
    })
    .join("");
}

function popularFiliaisRH() {
  document.getElementById("func-filial").innerHTML =
    '<option value="">Selecione...</option>' +
    getFiliais().map((f) => `<option value="${esc(f.id)}">${esc(formatarFilial(f))}</option>`).join("");
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
  document.getElementById("func-contrato").value = f.contrato || "CLT";
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

  if (!nome) return _avisoRH("Nome é obrigatório.", "error");
  if (!filialId) return _avisoRH("Filial é obrigatória.", "error");
  if (cargo === "Motorista" && !cnh) return _avisoRH("CNH é obrigatória para motoristas.", "error");

  const dados = {
    nome,
    cpf: document.getElementById("func-cpf").value,
    email: document.getElementById("func-email").value,
    telefone: document.getElementById("func-telefone").value,
    cargo, filialId, cnh,
    contratacao: document.getElementById("func-contratacao").value,
    salario: document.getElementById("func-salario").value,
    contrato: document.getElementById("func-contrato").value,
    situacao: document.getElementById("func-situacao").value,
  };
  const editId = document.getElementById("modalFuncionario").dataset.editId;
  if (editId) { updateFuncionario(editId, dados); _avisoRH("Funcionário atualizado.", "success"); }
  else { createFuncionario(dados); _avisoRH("Funcionário cadastrado.", "success"); }
  fecharModal("modalFuncionario");
  carregarStatsRH();
  carregarTabelaFuncionarios();
}

function removerFuncionario(id) {
  if (confirm("Deseja remover este funcionário?")) {
    deleteFuncionario(id);
    _avisoRH("Funcionário removido.", "success");
    carregarStatsRH();
    carregarTabelaFuncionarios();
  }
}
