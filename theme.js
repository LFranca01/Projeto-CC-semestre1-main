/* ========== GERENCIAMENTO DE TEMA ESCURO ========== */

// Inicializar tema ao carregar a página
document.addEventListener('DOMContentLoaded', function() {
    const temaSalvo = localStorage.getItem('theme') || 'light';
    aplicarTema(temaSalvo);
    
    // Se houver botão de tema, adicionar listener
    const botaoTema = document.getElementById('theme-toggle-btn');
    if (botaoTema) {
        botaoTema.addEventListener('click', alternarTema);
    }
});

function aplicarTema(tema) {
    if (tema === 'dark') {
        document.documentElement.setAttribute('data-theme', 'dark');
        localStorage.setItem('theme', 'dark');
    } else {
        document.documentElement.removeAttribute('data-theme');
        localStorage.setItem('theme', 'light');
    }
    atualizarIconeTema(tema === 'dark');
}

function alternarTema() {
    const temaAtual = localStorage.getItem('theme') || 'light';
    const novoTema = temaAtual === 'light' ? 'dark' : 'light';
    aplicarTema(novoTema);
}

function atualizarIconeTema(isDark) {
    const botaoTema = document.getElementById('theme-toggle-btn');
    if (botaoTema) {
        if (isDark) {
            botaoTema.innerHTML = '<span class="material-icons-round">light_mode</span>';
        } else {
            botaoTema.innerHTML = '<span class="material-icons-round">dark_mode</span>';
        }
    }
}
