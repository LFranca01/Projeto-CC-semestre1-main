/* ============================================================
   UI-HELPER.JS — Serginho Leva Atrás
   Dark mode • Avatar Cropper • Zoom • Filtros • Bottom Nav •
   KPI Carousel • Toasts • Mobile Table Labels • Focus Trap
   ============================================================ */
let cropper;

document.addEventListener("DOMContentLoaded", () => {
  inicializarUI();
  injetarBottomNav();
  observarTabelas();
  observarKpiCarousel();
});

/* ============================================================
   INICIALIZAÇÃO BÁSICA
   ============================================================ */
function inicializarUI() {
  const user = getUser();
  if (user) {
    const el = document.getElementById("user-name-display");
    if (el) el.innerText = user.nome;
  }
  const avatar = localStorage.getItem("userAvatar");
  const img = document.getElementById("avatar-nav");
  if (img && avatar) img.src = avatar;

  // Tema persistido — usamos apenas a chave "tema".
  const tema = localStorage.getItem("tema");
  if (tema === "dark") document.documentElement.setAttribute("data-theme", "dark");

  // Dropdown perfil
  const toggle = document.getElementById("dropdownToggle");
  const dropdown = document.getElementById("profileDropdown");
  if (toggle && dropdown) {
    toggle.addEventListener("click", (e) => {
      e.stopPropagation();
      dropdown.classList.toggle("show");
    });
    // Fecha o dropdown ao clicar fora — mas não interfere em links internos
    // (que rodam seu onclick antes desse listener disparar).
    document.addEventListener("click", () => dropdown.classList.remove("show"));
  }
}

/* ============================================================
   DARK MODE
   ============================================================ */
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

/* ============================================================
   BOTTOM NAVIGATION (mobile/tablet)
   Auto-injetada em todas as páginas autenticadas
   ============================================================ */
const NAV_ITEMS = [
  { href: "inicio.html", icon: "dashboard", label: "Início" },
  { href: "pedidos.html", icon: "inventory_2", label: "Pedidos" },
  { href: "filiais.html", icon: "hub", label: "Filiais" },
  { href: "produtos.html", icon: "category", label: "Produtos" },
];

const NAV_MORE_ITEMS = [
  { href: "rh.html", icon: "badge", label: "RH" },
  { href: "clientes.html", icon: "groups", label: "Clientes" },
  { href: "agregados.html", icon: "warehouse", label: "Agregados" },
  { href: "financeiro.html", icon: "payments", label: "Financeiro" },
  { href: "logistica.html", icon: "local_shipping", label: "Logística" },
];

function injetarBottomNav() {
  // Não injetar em telas de login
  if (!document.querySelector(".sidebar")) return;
  if (document.querySelector(".bottom-nav")) return;

  const path = (location.pathname.split("/").pop() || "inicio.html").toLowerCase();
  const isMore = NAV_MORE_ITEMS.some((i) => i.href === path);

  const nav = document.createElement("nav");
  nav.className = "bottom-nav";
  nav.setAttribute("aria-label", "Navegação principal");
  nav.innerHTML = `
    <div class="bottom-nav-inner">
      ${NAV_ITEMS.map(
        (it) => `
        <a class="bottom-nav-item ${it.href === path ? "active" : ""}" href="${it.href}">
          <span class="material-icons-round">${it.icon}</span>
          <span>${it.label}</span>
        </a>`,
      ).join("")}
      <button class="bottom-nav-item ${isMore ? "active" : ""}" id="btnBottomMore" type="button" aria-label="Mais opções">
        <span class="material-icons-round">apps</span>
        <span>Mais</span>
      </button>
    </div>
  `;
  document.body.appendChild(nav);

  const overlay = document.createElement("div");
  overlay.className = "bottom-sheet-overlay";
  overlay.id = "bottomSheetOverlay";
  document.body.appendChild(overlay);

  const sheet = document.createElement("div");
  sheet.className = "bottom-sheet";
  sheet.id = "bottomSheet";
  sheet.innerHTML = `
    <div class="bottom-sheet-handle"></div>
    <h3>Outros módulos</h3>
    <div class="bottom-sheet-grid">
      ${NAV_MORE_ITEMS.map(
        (it) => `
        <a class="bottom-sheet-item ${it.href === path ? "active" : ""}" href="${it.href}">
          <span class="material-icons-round">${it.icon}</span>
          <span>${it.label}</span>
        </a>`,
      ).join("")}
    </div>
  `;
  document.body.appendChild(sheet);

  document.getElementById("btnBottomMore").addEventListener("click", abrirBottomSheet);
  overlay.addEventListener("click", fecharBottomSheet);
}

function abrirBottomSheet() {
  document.getElementById("bottomSheetOverlay").classList.add("show");
  document.getElementById("bottomSheet").classList.add("show");
}
function fecharBottomSheet() {
  document.getElementById("bottomSheetOverlay")?.classList.remove("show");
  document.getElementById("bottomSheet")?.classList.remove("show");
}

/* ============================================================
   MOBILE TABLES — data-label automático para cards no mobile
   ============================================================ */
function observarTabelas() {
  const aplicar = () => {
    document.querySelectorAll(".table-dashboard").forEach((tabela) => {
      const headers = Array.from(tabela.querySelectorAll("thead th")).map((th) =>
        th.innerText.trim(),
      );
      tabela.querySelectorAll("tbody tr").forEach((tr) => {
        Array.from(tr.children).forEach((td, i) => {
          if (headers[i] && !td.dataset.label && !td.classList.contains("tabela-vazia")) {
            td.dataset.label = headers[i];
          }
        });
      });
    });
  };
  aplicar();
  const obs = new MutationObserver(aplicar);
  document.querySelectorAll(".table-dashboard tbody").forEach((tb) => {
    obs.observe(tb, { childList: true });
  });
  setTimeout(aplicar, 800);
  setTimeout(aplicar, 2000);
}

/* ============================================================
   KPI CAROUSEL — dots no mobile
   ============================================================ */
function observarKpiCarousel() {
  const grid = document.querySelector(".stats-grid");
  if (!grid || grid.dataset.carousel === "1") return;
  grid.dataset.carousel = "1";

  const dotsContainer = document.createElement("div");
  dotsContainer.className = "kpi-dots";
  grid.parentNode.insertBefore(dotsContainer, grid.nextSibling);

  const renderDots = () => {
    const cards = grid.querySelectorAll(".stat-card");
    if (window.innerWidth > 1024) {
      dotsContainer.style.display = "none";
      return;
    }
    dotsContainer.style.display = "flex";
    dotsContainer.innerHTML = "";
    cards.forEach((_, idx) => {
      const dot = document.createElement("span");
      dot.className = "kpi-dot" + (idx === 0 ? " active" : "");
      dotsContainer.appendChild(dot);
    });
  };
  renderDots();

  const onScroll = () => {
    const cards = grid.querySelectorAll(".stat-card");
    const dots = dotsContainer.querySelectorAll(".kpi-dot");
    if (!cards.length || !dots.length) return;
    const cardW = cards[0].offsetWidth + 12;
    const idx = Math.round(grid.scrollLeft / cardW);
    dots.forEach((d, i) => d.classList.toggle("active", i === idx));
  };
  grid.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", renderDots);
}

/* ============================================================
   TOAST
   ============================================================ */
function showToast(msg, type = "success") {
  let toast = document.getElementById("toastEl");
  if (!toast) {
    toast = document.createElement("div");
    toast.id = "toastEl";
    toast.className = "toast";
    document.body.appendChild(toast);
  }
  const icon = type === "success" ? "check_circle" : type === "error" ? "error" : "info";
  toast.className = "toast " + type;
  toast.innerHTML = `<span class="material-icons-round">${icon}</span><span>${esc(msg)}</span>`;
  void toast.offsetWidth;
  toast.classList.add("show");
  clearTimeout(toast._t);
  toast._t = setTimeout(() => toast.classList.remove("show"), 2400);
}

/* ============================================================
   AVATAR CROPPER — upload via clique, drag&drop ou paste (Ctrl+V)
   ============================================================ */
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
  const wrapper = document.querySelector("#modalAvatar .cropper-wrapper");
  if (wrapper) {
    wrapper.classList.remove("has-image", "is-dragging");
    setupAvatarDropzone(wrapper);
  }
}

function fecharModalAvatar() {
  const modal = document.getElementById("modalAvatar");
  if (modal) modal.style.display = "none";
  if (cropper) {
    cropper.destroy();
    cropper = null;
  }
  const wrapper = document.querySelector("#modalAvatar .cropper-wrapper");
  if (wrapper) wrapper.classList.remove("has-image", "is-dragging");
}

function salvarAvatar() {
  if (!cropper) {
    showToast("Selecione e ajuste uma imagem primeiro.", "error");
    return;
  }
  const canvas = cropper.getCroppedCanvas({
    width: 400,
    height: 400,
    fillColor: "#fff",
  });
  const base64 = canvas.toDataURL("image/jpeg", 0.85);
  try {
    localStorage.setItem("userAvatar", base64);
    const img = document.getElementById("avatar-nav");
    if (img) img.src = base64;
    fecharModalAvatar();
    showToast("Foto atualizada.");
  } catch (e) {
    console.error("Quota localStorage:", e);
    showToast("Sem espaço para salvar a foto. Limpe os dados do navegador.", "error");
  }
}

/* Lê um File/Blob de imagem e carrega no cropper */
function _carregarImagemNoCropper(file) {
  if (!file || !file.type.startsWith("image/")) return;
  const reader = new FileReader();
  reader.onload = (ev) => {
    const img = document.getElementById("image-to-crop");
    if (!img) return;
    img.src = ev.target.result;
    img.style.display = "block";
    img.style.maxWidth = "100%";
    const wrapper = document.querySelector("#modalAvatar .cropper-wrapper");
    if (wrapper) wrapper.classList.add("has-image");
    if (cropper) cropper.destroy();
    cropper = new Cropper(img, {
      aspectRatio: 1,
      viewMode: 1,
      background: false,
    });
  };
  reader.readAsDataURL(file);
}

/* Configura drag&drop no wrapper. Roda só uma vez por wrapper. */
function setupAvatarDropzone(wrapper) {
  if (wrapper.dataset.dropzoneReady) return;
  wrapper.dataset.dropzoneReady = "1";

  ["dragenter", "dragover"].forEach((ev) => {
    wrapper.addEventListener(ev, (e) => {
      e.preventDefault();
      e.stopPropagation();
      // Só aceita drag se nenhuma imagem foi carregada ainda
      if (!wrapper.classList.contains("has-image")) {
        wrapper.classList.add("is-dragging");
      }
    });
  });

  ["dragleave", "dragend"].forEach((ev) => {
    wrapper.addEventListener(ev, (e) => {
      e.preventDefault();
      wrapper.classList.remove("is-dragging");
    });
  });

  wrapper.addEventListener("drop", (e) => {
    e.preventDefault();
    e.stopPropagation();
    wrapper.classList.remove("is-dragging");
    const file = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0];
    if (file) _carregarImagemNoCropper(file);
  });
}

/* Input file convencional */
document.addEventListener("change", (e) => {
  if (e.target.id !== "inputImage") return;
  const file = e.target.files[0];
  if (file) _carregarImagemNoCropper(file);
});

/* Paste (Ctrl+V) — só dispara quando o modalAvatar está aberto */
document.addEventListener("paste", (e) => {
  const modal = document.getElementById("modalAvatar");
  if (!modal || modal.style.display !== "flex") return;
  const items = e.clipboardData && e.clipboardData.items;
  if (!items) return;
  for (const item of items) {
    if (item.type && item.type.startsWith("image/")) {
      const file = item.getAsFile();
      if (file) {
        e.preventDefault();
        _carregarImagemNoCropper(file);
        break;
      }
    }
  }
});

/* ============================================================
   ZOOM
   ============================================================ */
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

/* ============================================================
   MODAIS — com focus-trap básico
   ============================================================ */
const _modalLastFocus = new Map();

function abrirModal(id) {
  const m = document.getElementById(id);
  if (!m) return;
  _modalLastFocus.set(id, document.activeElement);
  m.style.display = "flex";
  document.body.style.overflow = "hidden";
  // Focar primeiro input/select/textarea/button do modal
  const focavel = m.querySelector(
    "input:not([type=hidden]):not([readonly]),select,textarea,button.btn-primary",
  );
  if (focavel) {
    setTimeout(() => focavel.focus(), 60);
  }
}

function fecharModal(id) {
  const m = document.getElementById(id);
  if (!m) return;
  m.style.display = "none";
  document.body.style.overflow = "";
  // Restaurar foco
  const last = _modalLastFocus.get(id);
  if (last && typeof last.focus === "function") last.focus();
  _modalLastFocus.delete(id);
}

// Fechar modal clicando no fundo
document.addEventListener("click", (e) => {
  if (e.target.classList && e.target.classList.contains("modal")) {
    e.target.style.display = "none";
    document.body.style.overflow = "";
  }
});

// Fechar modal com ESC + Tab loop dentro do modal aberto
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    document.querySelectorAll(".modal").forEach((m) => {
      if (m.style.display === "flex") m.style.display = "none";
    });
    document.body.style.overflow = "";
    fecharBottomSheet();
    return;
  }
  // Focus trap dentro de modal aberto
  if (e.key === "Tab") {
    const modalAberto = Array.from(document.querySelectorAll(".modal")).find(
      (m) => m.style.display === "flex",
    );
    if (!modalAberto) return;
    const focaveis = modalAberto.querySelectorAll(
      'a[href], button:not([disabled]), textarea, input:not([type="hidden"]):not([disabled]), select:not([disabled])',
    );
    if (!focaveis.length) return;
    const first = focaveis[0];
    const last = focaveis[focaveis.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }
});

/* ============================================================
   FILTROS DE TABELA — usa data-attributes nas linhas para
   filtros precisos por coluna; cai para innerText.includes() se
   não houver data-* (compatibilidade retroativa).
   ============================================================ */
function aplicarFiltros(tabelaId) {
  const busca = (document.getElementById("input-busca")?.value || "").toLowerCase();
  const filtros = {
    status: (document.getElementById("select-filtro")?.value || "").toLowerCase(),
    cargo: (document.getElementById("filtro-cargo")?.value || "").toLowerCase(),
    cat: (document.getElementById("filtro-cat")?.value || "").toLowerCase(),
    "tipo-vei": (document.getElementById("filtro-tipo-vei")?.value || "").toLowerCase(),
    metodo: (document.getElementById("filtro-metodo")?.value || "").toLowerCase(),
    filial: (document.getElementById("filtro-filial")?.value || "").toLowerCase(),
  };
  const dataF = document.getElementById("filtro-data")?.value || "";

  document.querySelectorAll("#" + tabelaId + " tr").forEach((tr) => {
    if (tr.querySelector(".tabela-vazia")) return;
    const txt = tr.innerText.toLowerCase();
    if (busca && !txt.includes(busca)) {
      tr.style.display = "none";
      return;
    }
    let visivel = true;
    for (const [chave, valor] of Object.entries(filtros)) {
      if (!valor) continue;
      // Preferimos data-attributes precisos. Se não houver, faz match aproximado em innerText.
      const dataValue = tr.dataset[_camelizar(chave)];
      if (dataValue !== undefined) {
        if (dataValue.toLowerCase() !== valor) visivel = false;
      } else if (!txt.includes(valor)) {
        visivel = false;
      }
      if (!visivel) break;
    }
    if (visivel && dataF) {
      const dataValue = tr.dataset.data;
      const fmt = dataF.split("-").reverse().join("/");
      if (dataValue) {
        if (dataValue !== dataF && dataValue !== fmt) visivel = false;
      } else if (!txt.includes(fmt)) {
        visivel = false;
      }
    }
    tr.style.display = visivel ? "" : "none";
  });
}

function _camelizar(s) {
  return s.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
}

/* ============================================================
   MÁSCARAS / CEP
   ============================================================ */
function mascaraTelefone(v) {
  v = v.replace(/\D/g, "").slice(0, 11);
  v = v.replace(/^(\d{2})(\d)/g, "($1) $2");
  v = v.replace(/(\d)(\d{4})$/, "$1-$2");
  return v;
}
function mascaraDocumento(v) {
  v = v.replace(/\D/g, "").slice(0, 14);
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
  return v.replace(/\D/g, "").slice(0, 8).replace(/^(\d{5})(\d)/, "$1-$2");
}
function mascaraCNH(v) {
  return v.replace(/\D/g, "").slice(0, 11);
}
function mascaraPlaca(v) {
  // Aceita formato antigo (AAA-9999) ou Mercosul (AAA9A99). Apenas
  // letras/dígitos/hífen, em maiúsculas, máx 8 caracteres.
  return v.replace(/[^A-Za-z0-9-]/g, "").toUpperCase().slice(0, 8);
}
function mascaraUF(v) {
  return v.replace(/[^A-Za-z]/g, "").toUpperCase().slice(0, 2);
}
function mascaraDigitos(v) {
  return v.replace(/\D/g, "");
}

async function buscarEnderecoPorCEP(cep) {
  const c = cep.replace(/\D/g, "");
  if (c.length !== 8) return;
  try {
    const r = await fetch(`https://viacep.com.br/ws/${c}/json/`);
    if (!r.ok) {
      showToast("Erro ao consultar CEP", "error");
      return;
    }
    const d = await r.json();
    if (d.erro) return showToast("CEP não encontrado", "error");
    if (document.getElementById("cli-rua")) document.getElementById("cli-rua").value = d.logradouro || "";
    if (document.getElementById("cli-bairro")) document.getElementById("cli-bairro").value = d.bairro || "";
    if (document.getElementById("cli-cidade")) document.getElementById("cli-cidade").value = d.localidade || "";
    if (document.getElementById("cli-estado")) document.getElementById("cli-estado").value = d.uf || "";
  } catch (e) {
    console.error("Erro CEP:", e);
    showToast("Falha ao buscar CEP — verifique sua conexão.", "error");
  }
}

document.addEventListener("input", (e) => {
  const t = e.target;
  if (!t.dataset || !t.dataset.mask) return;
  switch (t.dataset.mask) {
    case "telefone": t.value = mascaraTelefone(t.value); break;
    case "documento": t.value = mascaraDocumento(t.value); break;
    case "cep":
      t.value = mascaraCEP(t.value);
      if (t.value.length === 9) buscarEnderecoPorCEP(t.value);
      break;
    case "cnh": t.value = mascaraCNH(t.value); break;
    case "placa": t.value = mascaraPlaca(t.value); break;
    case "uf": t.value = mascaraUF(t.value); break;
    case "digitos": t.value = mascaraDigitos(t.value); break;
  }
});

/* ============================================================
   UTIL
   ============================================================ */
function limparFormulario(id) {
  const f = document.getElementById(id);
  if (!f) return;
  f.querySelectorAll("input,select,textarea").forEach((i) => {
    if (i.type === "checkbox" || i.type === "radio") i.checked = false;
    else i.value = "";
  });
}
