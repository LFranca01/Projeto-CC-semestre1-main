/* ============================================================
   UI-HELPER.JS — Dark mode, Avatar Cropper, Zoom, Filtros
   ============================================================ */
let cropper;

document.addEventListener("DOMContentLoaded", () => {
  inicializarUI();
});

function inicializarUI() {
  // Nome e avatar
  const user = getUser();
  if (user) {
    const el = document.getElementById("user-name-display");
    if (el) el.innerText = user.nome;
  }
  const avatar = localStorage.getItem("userAvatar");
  const img = document.getElementById("avatar-nav");
  if (img && avatar) img.src = avatar;

  // Dark mode persistido
  const tema = localStorage.getItem("tema") || localStorage.getItem("theme");
  if (tema === "dark")
    document.documentElement.setAttribute("data-theme", "dark");

  // Dropdown perfil
  const toggle = document.getElementById("dropdownToggle");
  const dropdown = document.getElementById("profileDropdown");
  if (toggle && dropdown) {
    toggle.addEventListener("click", (e) => {
      e.stopPropagation();
      dropdown.classList.toggle("show");
    });
    document.addEventListener("click", () => dropdown.classList.remove("show"));
  }
}

// â”€â”€ DARK MODE â”€â”€
function toggleDarkMode() {
  const isDark = document.documentElement.getAttribute("data-theme") === "dark";
  if (isDark) {
    document.documentElement.removeAttribute("data-theme");
    localStorage.setItem("tema", "light");
  } else {
    document.documentElement.setAttribute("data-theme", "dark");
    localStorage.setItem("tema", "dark");
  }
}

// â”€â”€ CROPPER / AVATAR â”€â”€
function abrirModalAvatar() {
  const modal = document.getElementById("modalAvatar");
  if (modal) modal.style.display = "flex";
  const input = document.getElementById("inputImage");
  if (input) input.value = "";
  const img = document.getElementById("image-to-crop");
  if (img) {
    img.src = "";
    img.style.display = "none";
  }
}

function fecharModalAvatar() {
  const modal = document.getElementById("modalAvatar");
  if (modal) modal.style.display = "none";
  if (cropper) {
    cropper.destroy();
    cropper = null;
  }
}

function salvarAvatar() {
  if (!cropper) return alert("Selecione e ajuste uma imagem primeiro.");
  const canvas = cropper.getCroppedCanvas({
    width: 150,
    height: 150,
    fillColor: "#fff",
  });
  const base64 = canvas.toDataURL("image/jpeg", 0.85);
  localStorage.setItem("userAvatar", base64);
  const img = document.getElementById("avatar-nav");
  if (img) img.src = base64;
  fecharModalAvatar();
}

document.addEventListener("change", (e) => {
  if (e.target.id !== "inputImage") return;
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (ev) => {
    const img = document.getElementById("image-to-crop");
    img.src = ev.target.result;
    img.style.display = "block";
    img.style.maxWidth = "100%";
    if (cropper) cropper.destroy();
    cropper = new Cropper(img, {
      aspectRatio: 1,
      viewMode: 1,
      background: false,
    });
  };
  reader.readAsDataURL(file);
});

// â”€â”€ ZOOM â”€â”€
function abrirZoom(src) {
  const modal = document.getElementById("modalZoom");
  const img = document.getElementById("imgZoom");
  if (modal && img) {
    img.src = src;
    modal.style.display = "flex";
  }
}
function fecharZoom() {
  const modal = document.getElementById("modalZoom");
  if (modal) modal.style.display = "none";
}

// â”€â”€ MODAIS â”€â”€
function abrirModal(id) {
  const m = document.getElementById(id);
  if (m) m.style.display = "flex";
}
function fecharModal(id) {
  const m = document.getElementById(id);
  if (m) m.style.display = "none";
}

// â”€â”€ FILTRO DE TABELA â”€â”€
function aplicarFiltros(tabelaId) {
  const busca = (
    document.getElementById("input-busca")?.value || ""
  ).toLowerCase();
  const status = (
    document.getElementById("select-filtro")?.value || ""
  ).toLowerCase();
  document.querySelectorAll("#" + tabelaId + " tr").forEach((tr) => {
    const txt = tr.innerText.toLowerCase();
    const okB = !busca || txt.includes(busca);
    const okS = !status || txt.includes(status);
    tr.style.display = okB && okS ? "" : "none";
  });
}

// â”€â”€ MÁSCARAS â”€â”€
function mascaraTelefone(v) {
  v = v.replace(/\D/g, "");
  v = v.replace(/^(\d{2})(\d)/g, "($1) $2");
  v = v.replace(/(\d)(\d{4})$/, "$1-$2");
  return v;
}
function mascaraDocumento(v) {
  v = v.replace(/\D/g, "");
  if (v.length <= 11) {
    v = v
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
  } else {
    v = v
      .replace(/^(\d{2})(\d)/, "$1.$2")
      .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
      .replace(/\.(\d{3})(\d)/, ".$1/$2")
      .replace(/(\d{4})(\d)/, "$1-$2");
  }
  return v;
}
function mascaraCEP(v) {
  return v.replace(/\D/g, "").replace(/^(\d{5})(\d)/, "$1-$2");
}

async function buscarEnderecoPorCEP(cep) {
  const c = cep.replace(/\D/g, "");
  if (c.length !== 8) return;
  try {
    const r = await fetch(`https://viacep.com.br/ws/${c}/json/`);
    const d = await r.json();
    if (d.erro) return alert("CEP não encontrado.");
    if (document.getElementById("cli-rua"))
      document.getElementById("cli-rua").value = d.logradouro;
    if (document.getElementById("cli-bairro"))
      document.getElementById("cli-bairro").value = d.bairro;
    if (document.getElementById("cli-cidade"))
      document.getElementById("cli-cidade").value = d.localidade;
    if (document.getElementById("cli-estado"))
      document.getElementById("cli-estado").value = d.uf;
  } catch (e) {
    console.error("Erro CEP:", e);
  }
}

document.addEventListener("input", (e) => {
  const t = e.target;
  if (t.dataset.mask === "telefone") t.value = mascaraTelefone(t.value);
  if (t.dataset.mask === "documento") t.value = mascaraDocumento(t.value);
  if (t.dataset.mask === "cep") {
    t.value = mascaraCEP(t.value);
    if (t.value.length === 9) buscarEnderecoPorCEP(t.value);
  }
});

// â”€â”€ UTILITÁRIOS â”€â”€
function limparFormulario(id) {
  const f = document.getElementById(id);
  if (f) {
    f.querySelectorAll("input,select,textarea").forEach((i) => (i.value = ""));
  }
}

