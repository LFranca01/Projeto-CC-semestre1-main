// ================= CLIENTES MODULE =================

function carregarTabelaClientes() {
  const clientes = getClientes();
  const tabela = document.getElementById("tabela-clientes");
  if (!clientes.length) {
    tabela.innerHTML =
      '<tr><td colspan="5" class="tabela-vazia"><span class="material-icons-round">groups</span><p>Nenhum cliente cadastrado.</p></td></tr>';
    return;
  }
  tabela.innerHTML = clientes
    .map(
      (c) => `
  <tr>
    <td class="td-bold">${c.nome}</td>
    <td>${formatarDocumento(c.documento)}</td>
    <td>${c.telefone || "—"}</td>
    <td>
      <span class="cli-rua">${c.rua || "S/R"}, ${c.numero || "S/N"}</span>
      <span class="cli-bairro">${c.bairro ? c.bairro + " — " : ""}${c.cidade || ""}${c.estado ? "/" + c.estado : ""}</span>
    </td>
    <td>
      <button class="btn-icon" onclick="editarCliente(${c.id})"><span class="material-icons-round">edit</span></button>
      <button class="btn-icon danger" onclick="removerCliente(${c.id})"><span class="material-icons-round">delete</span></button>
    </td>
  </tr>`,
    )
    .join("");
}

function abrirModalNovoCliente() {
  document.getElementById("modal-titulo").innerText = "Cadastrar Cliente";
  limparFormulario("modalCliente");
  delete document.getElementById("modalCliente").dataset.editId;
  abrirModal("modalCliente");
}

function editarCliente(id) {
  const c = getClienteById(id);
  if (!c) return;
  document.getElementById("modal-titulo").innerText = "Editar Cliente";
  document.getElementById("cli-nome").value = c.nome;
  document.getElementById("cli-doc").value = formatarDocumento(c.documento);
  document.getElementById("cli-tel").value = c.telefone || "";
  document.getElementById("cli-cep").value = c.cep || "";
  document.getElementById("cli-numero").value = c.numero || "";
  document.getElementById("cli-rua").value = c.rua || "";
  document.getElementById("cli-bairro").value = c.bairro || "";
  document.getElementById("cli-cidade").value = c.cidade || "";
  document.getElementById("cli-estado").value = c.estado || "";
  document.getElementById("modalCliente").dataset.editId = id;
  abrirModal("modalCliente");
}

function salvarCliente() {
  const nome = document.getElementById("cli-nome").value.trim();
  if (!nome) return alert("Nome é obrigatório.");
  const dados = {
    nome,
    documento: document.getElementById("cli-doc").value.replace(/\D/g, ""),
    telefone: document.getElementById("cli-tel").value,
    cep: document.getElementById("cli-cep").value,
    numero: document.getElementById("cli-numero").value,
    rua: document.getElementById("cli-rua").value,
    bairro: document.getElementById("cli-bairro").value,
    cidade: document.getElementById("cli-cidade").value,
    estado: document.getElementById("cli-estado").value,
  };
  const editId = document.getElementById("modalCliente").dataset.editId;
  if (editId) updateCliente(editId, dados);
  else createCliente(dados);
  delete document.getElementById("modalCliente").dataset.editId;
  limparFormulario("modalCliente");
  fecharModal("modalCliente");
  carregarTabelaClientes();
}

function removerCliente(id) {
  if (confirm("Deseja excluir este cliente?")) {
    deleteCliente(id);
    carregarTabelaClientes();
  }
}

