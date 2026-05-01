// ================= AUTH CORE =================
//
// ⚠️  ATENÇÃO — FAKE AUTH PARA DEMONSTRAÇÃO ACADÊMICA
// ----------------------------------------------------
// As credenciais abaixo estão *hardcoded em JavaScript do cliente*. Qualquer
// pessoa com acesso ao DevTools pode lê-las. Isso é proposital: o projeto
// simula um ERP sem backend real (usa localStorage como banco). Para uso em
// produção, este módulo precisa ser substituído por:
//   1. Endpoint de autenticação no servidor (HTTPS).
//   2. Armazenamento da senha como hash + salt (bcrypt/argon2).
//   3. Token de sessão (JWT ou cookie HttpOnly) com expiração.
//   4. Rate limiting para evitar brute-force.
// ----------------------------------------------------

// pega usuário logado
function getUser() {
  return JSON.parse(sessionStorage.getItem("user"));
}

// verifica se está logado
function isAuthenticated() {
  return !!sessionStorage.getItem("user");
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
    email: "admin@sla.com",
    senha: "admin",
    nome: "França",
  };

  if (email === usuarioPadrao.email && senha === usuarioPadrao.senha) {
    // Não persistimos a senha na sessão — só email e nome.
    const sessao = { email: usuarioPadrao.email, nome: usuarioPadrao.nome };
    sessionStorage.setItem("user", JSON.stringify(sessao));
    return { success: true };
  }

  return { success: false, message: "E-mail ou senha inválidos" };
}

// logout
function logout() {
  sessionStorage.removeItem("user");
  window.location.replace("index.html");
}
