// ================= AUTH CORE =================

// pega usuário logado
function getUser() {
  return JSON.parse(localStorage.getItem("user"));
}

// verifica se está logado
function isAuthenticated() {
  return !!localStorage.getItem("user");
}

// força login
function requireAuth() {
  if (!isAuthenticated()) {
    window.location.replace("index.html");
  }
}

// impede voltar pro login
function redirectIfLogged() {
  if (isAuthenticated()) {
    window.location.replace("inicio.html");
  }
}

// login fake (simula backend)
function login(email, senha) {
  const usuarioPadrao = {
    email: "admin@gmail.com",
    senha: "admin",
    nome: "França"
  };

  if (email === usuarioPadrao.email && senha === usuarioPadrao.senha) {

    // salva sessão
    localStorage.setItem("user", JSON.stringify(usuarioPadrao));

    return { success: true };
  }

  return { success: false, message: "Email ou senha inválidos" };
}

// logout
function logout() {
  localStorage.removeItem("user");
  window.location.replace("index.html");
}