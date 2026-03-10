const BACKEND_URL = "https://compito-ecommerce.onrender.com";

const authSection = document.getElementById("authSection");
const shopSection = document.getElementById("shopSection");
const messageEl = document.getElementById("message");
const logoutBtn = document.getElementById("logoutBtn");

function getToken() {
  return localStorage.getItem("token");
}

function setToken(token) {
  localStorage.setItem("token", token);
}

function removeToken() {
  localStorage.removeItem("token");
}

function showMessage(text, isError = false) {
  messageEl.textContent = text;
  messageEl.className = isError ? "message error" : "message success";
}

function authHeaders() {
  return {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${getToken()}`
  };
}

function showLoggedOutView() {
  authSection.classList.remove("hidden");
  shopSection.classList.add("hidden");
  logoutBtn.classList.add("hidden");
}

function showLoggedInView() {
  authSection.classList.add("hidden");
  shopSection.classList.remove("hidden");
  logoutBtn.classList.remove("hidden");
}

async function register() {
  const name = document.getElementById("registerName").value.trim();
  const email = document.getElementById("registerEmail").value.trim();
  const password = document.getElementById("registerPassword").value;

  try {
    const res = await fetch(`${BACKEND_URL}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password })
    });

    const data = await res.json();

    if (!res.ok) {
      showMessage(data.error, true);
      return;
    }

    showMessage("Registrazione completata. Ora puoi fare login.");
    document.getElementById("registerName").value = "";
    document.getElementById("registerEmail").value = "";
    document.getElementById("registerPassword").value = "";
  } catch {
    showMessage("Errore di connessione col server", true);
  }
}

async function login() {
  const email = document.getElementById("loginEmail").value.trim();
  const password = document.getElementById("loginPassword").value;

  try {
    const res = await fetch(`${BACKEND_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    });

    const data = await res.json();

    if (!res.ok) {
      showMessage(data.error, true);
      return;
    }

    setToken(data.token);
    showMessage(`Benvenuto, ${data.user.name}`);
    await loadProfile();
    await loadProducts();
  } catch {
    showMessage("Errore di connessione col server", true);
  }
}

async function logout() {
  try {
    await fetch(`${BACKEND_URL}/api/auth/logout`, {
      method: "POST",
      headers: authHeaders()
    });
  } catch {}

  removeToken();
  showLoggedOutView();
  showMessage("Logout effettuato");
}

async function loadProfile() {
  try {
    const res = await fetch(`${BACKEND_URL}/api/auth/me`, {
      headers: authHeaders()
    });

    if (!res.ok) {
      removeToken();
      showLoggedOutView();
      return;
    }

    const user = await res.json();
    document.getElementById("credits").textContent = user.credits;
    document.getElementById("welcomeText").textContent = `Ciao ${user.name}`;
    showLoggedInView();
  } catch {
    showMessage("Impossibile caricare il profilo", true);
  }
}

async function loadProducts() {
  try {
    const res = await fetch(`${BACKEND_URL}/api/products`, {
      headers: authHeaders()
    });

    const data = await res.json();

    if (!res.ok) {
      showMessage(data.error || "Errore caricamento prodotti", true);
      return;
    }

    const container = document.getElementById("products");
    container.innerHTML = "";

    data.forEach(product => {
      const isOut = product.stock <= 0;
      const card = document.createElement("div");
      card.className = "card product-card";
      card.innerHTML = `
        <div class="card-top">
          <span class="tag">${isOut ? "Esaurito" : "Disponibile"}</span>
          <span class="price">${product.price} crediti</span>
        </div>
        <h3>${product.name}</h3>
        <p class="card-description">${product.description}</p>
        <div class="card-bottom">
          <span>Stock: <strong>${product.stock}</strong></span>
          <button class="btn primary" ${isOut ? "disabled" : ""} onclick="buyProduct(${product.id})">
            Acquista
          </button>
        </div>
      `;
      container.appendChild(card);
    });
  } catch {
    showMessage("Errore di connessione col server", true);
  }
}

async function buyProduct(productId) {
  try {
    const res = await fetch(`${BACKEND_URL}/api/purchase`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({ productId })
    });

    const data = await res.json();

    if (!res.ok) {
      showMessage(data.error, true);
      return;
    }

    showMessage(data.message);
    await loadProfile();
    await loadProducts();
  } catch {
    showMessage("Errore durante l'acquisto", true);
  }
}

logoutBtn.addEventListener("click", logout);

async function init() {
  if (!getToken()) {
    showLoggedOutView();
    return;
  }

  await loadProfile();
  await loadProducts();
}

init();