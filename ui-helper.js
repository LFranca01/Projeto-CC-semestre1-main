/* ============================================================
   UI-HELPER.JS - Versão Final Consolidada
   ============================================================ */
let cropper; 

document.addEventListener("DOMContentLoaded", () => {
    inicializarUI();
});

function inicializarUI() {
    const user = getUser();
    if (user && document.getElementById('user-name-display')) {
        document.getElementById('user-name-display').innerText = user.nome;
    }
    const savedAvatar = localStorage.getItem('userAvatar');
    const avatarImg = document.getElementById('avatar-nav');
    if (avatarImg && savedAvatar) avatarImg.src = savedAvatar;

    const toggle = document.getElementById('dropdownToggle');
    const dropdown = document.getElementById('profileDropdown');
    if (toggle && dropdown) {
        toggle.onclick = (e) => { e.stopPropagation(); dropdown.classList.toggle('show'); };
        window.onclick = () => dropdown.classList.remove('show');
    }
}

// --- LÓGICA DO AVATAR (CROPPER) ---

function abrirModalAvatar() {
    const modal = document.getElementById('modalAvatar');
    if (modal) modal.style.display = 'flex';
}

function fecharModalAvatar() {
    const modal = document.getElementById('modalAvatar');
    if (modal) modal.style.display = 'none';
    if (cropper) {
        cropper.destroy();
        cropper = null;
    }
}

// --- ZOOM ---
function abrirZoom(src) {
    const modal = document.getElementById('modalZoom');
    const img = document.getElementById('imgZoom');
    if (modal && img) {
        img.src = src;
        modal.style.display = 'flex';
    }
}
function fecharZoom() { 
    const modal = document.getElementById('modalZoom');
    if(modal) modal.style.display = 'none'; 
}

// --- MÁSCARAS E CEP ---
function mascaraTelefone(v) {
    v = v.replace(/\D/g, "");
    v = v.replace(/^(\d{2})(\d)/g, "($1) $2");
    v = v.replace(/(\d)(\d{4})$/, "$1-$2");
    return v;
}

function mascaraDocumento(v) {
    v = v.replace(/\D/g, "");
    if (v.length <= 11) {
        v = v.replace(/(\d{3})(\d)/, "$1.$2").replace(/(\d{3})(\d)/, "$1.$2").replace(/(\d{3})(\d{1,2})$/, "$1-$2");
    } else {
        v = v.replace(/^(\d{2})(\d)/, "$1.$2").replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3").replace(/\.(\d{3})(\d)/, ".$1/$2").replace(/(\d{4})(\d)/, "$1-$2");
    }
    return v;
}

function mascaraCEP(v) {
    return v.replace(/\D/g, "").replace(/^(\d{5})(\d)/, "$1-$2");
}

async function buscarEnderecoPorCEP(cep) {
    const cleanCEP = cep.replace(/\D/g, "");
    if (cleanCEP.length !== 8) return;
    try {
        const response = await fetch(`https://viacep.com.br/ws/${cleanCEP}/json/`);
        const data = await response.json();
        if (data.erro) return alert("CEP não encontrado.");
        
        // Preenche os campos ocultos no modal
        if(document.getElementById('cli-rua')) document.getElementById('cli-rua').value = data.logradouro;
        if(document.getElementById('cli-bairro')) document.getElementById('cli-bairro').value = data.bairro;
        if(document.getElementById('cli-cidade')) document.getElementById('cli-cidade').value = data.localidade;
    } catch (e) { console.error("Erro CEP:", e); }
}

document.addEventListener('input', (e) => {
    const target = e.target;
    if (target.dataset.mask === 'telefone') target.value = mascaraTelefone(target.value);
    if (target.dataset.mask === 'documento') target.value = mascaraDocumento(target.value);
    if (target.dataset.mask === 'cep') {
        target.value = mascaraCEP(target.value);
        if (target.value.length === 9) buscarEnderecoPorCEP(target.value);
    }
});

// --- UTILITÁRIOS ---
function limparFormulario(id) {
    const f = document.getElementById(id);
    if (f) f.querySelectorAll('input').forEach(i => i.value = '');
}
function abrirModal(id) { document.getElementById(id).style.display = 'flex'; }
function fecharModal(id) { document.getElementById(id).style.display = 'none'; }