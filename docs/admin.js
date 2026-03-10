const BACKEND_URL = "https://compito-ecommerce.onrender.com";

const adminAuthSection = document.getElementById("adminAuthSection");
const adminSection = document.getElementById("adminSection");
const adminMessageEl = document.getElementById("adminMessage");
const adminLogoutBtn = document.getElementById("adminLogoutBtn");

function getAdminToken() {
  return localStorage.getItem("adminToken");
}

function setAdminToken(token) {
  localStorage.setItem("adminToken", token);
}

function removeAdminToken() {
  localStorage.removeItem("adminToken");
}

function adminHeaders() {
  return {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${getAdminToken()}`
  };
}

function showAdminMessage(text, isError = false) {
  adminMessageEl.textContent = text;
  adminMessageEl.className = isError ? "message error" : "message success";
}

function showAdminLoggedOut() {
  adminAuthSection.classList.remove("hidden");
  adminSection.classList.add("hidden");
  adminLogoutBtn.classList.add("hidden");
}

function showAdminLoggedIn() {
  adminAuthSection.classList.add("hidden");
  adminSection.classList.remove("hidden");
  adminLogoutBtn.classList.remove("hidden");
}

async function adminLogin() {
  const email = document.getElementById("adminEmail").value.trim();
  const password = document.getElementById("adminPassword").value;

  try {
    const res = await fetch(`${BACKEND_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    });

    const data = await res.json();

    if (!res.ok) {
      showAdminMessage(data.error, true);
      return;
    }

    if (data.user.role !== "admin") {
      showAdminMessage("Questo utente non è admin", true);
      return;
    }

    setAdminToken(data.token);
    document.getElementById("adminWelcome").textContent = `Benvenuto ${data.user.name}`;
    showAdminLoggedIn();
    showAdminMessage("Accesso admin effettuato");
    await loadUsers();
    await loadProducts();
  } catch {
    showAdminMessage("Errore di connessione col server", true);
  }
}

async function adminLogout() {
  try {
    await fetch(`${BACKEND_URL}/api/auth/logout`, {
      method: "POST",
      headers: adminHeaders()
    });
  } catch {}

  removeAdminToken();
  showAdminLoggedOut();
  showAdminMessage("Logout admin effettuato");
}

async function checkAdmin() {
  if (!getAdminToken()) {
    showAdminLoggedOut();
    return;
  }

  try {
    const res = await fetch(`${BACKEND_URL}/api/auth/me`, {
      headers: adminHeaders()
    });

    if (!res.ok) {
      removeAdminToken();
      showAdminLoggedOut();
      return;
    }

    const user = await res.json();

    if (user.role !== "admin") {
      removeAdminToken();
      showAdminLoggedOut();
      showAdminMessage("Accesso negato: non sei admin", true);
      return;
    }

    document.getElementById("adminWelcome").textContent = `Benvenuto ${user.name}`;
    showAdminLoggedIn();
    await loadUsers();
    await loadProducts();
  } catch {
    showAdminMessage("Impossibile verificare la sessione", true);
  }
}

async function addProduct() {
  const name = document.getElementById("name").value.trim();
  const price = Number(document.getElementById("price").value);
  const stock = Number(document.getElementById("stock").value);
  const description = document.getElementById("description").value.trim();

  try {
    const res = await fetch(`${BACKEND_URL}/api/products`, {
      method: "POST",
      headers: adminHeaders(),
      body: JSON.stringify({ name, price, stock, description })
    });

    const data = await res.json();

    if (!res.ok) {
      showAdminMessage(data.error, true);
      return;
    }

    showAdminMessage(data.message);
    document.getElementById("name").value = "";
    document.getElementById("price").value = "";
    document.getElementById("stock").value = "";
    document.getElementById("description").value = "";
    await loadProducts();
  } catch {
    showAdminMessage("Errore durante l'aggiunta del prodotto", true);
  }
}

async function updateProduct() {
  const productId = Number(document.getElementById("productId").value);
  const name = document.getElementById("editName").value.trim();
  const priceRaw = document.getElementById("editPrice").value;
  const stockRaw = document.getElementById("newStock").value;
  const description = document.getElementById("editDescription").value.trim();

  const payload = {};

  if (name) payload.name = name;
  if (priceRaw !== "") payload.price = Number(priceRaw);
  if (stockRaw !== "") payload.stock = Number(stockRaw);
  if (description) payload.description = description;

  try {
    const res = await fetch(`${BACKEND_URL}/api/products/${productId}`, {
      method: "PUT",
      headers: adminHeaders(),
      body: JSON.stringify(payload)
    });

    const data = await res.json();

    if (!res.ok) {
      showAdminMessage(data.error, true);
      return;
    }

    showAdminMessage(data.message);
    document.getElementById("productId").value = "";
    document.getElementById("editName").value = "";
    document.getElementById("editPrice").value = "";
    document.getElementById("newStock").value = "";
    document.getElementById("editDescription").value = "";
    await loadProducts();
  } catch {
    showAdminMessage("Errore durante la modifica del prodotto", true);
  }
}

async function addCredits() {
  const userId = Number(document.getElementById("userId").value);
  const credits = Number(document.getElementById("bonusCredits").value);

  try {
    const res = await fetch(`${BACKEND_URL}/api/users/${userId}/credits`, {
      method: "PUT",
      headers: adminHeaders(),
      body: JSON.stringify({ credits })
    });

    const data = await res.json();

    if (!res.ok) {
      showAdminMessage(data.error, true);
      return;
    }

    showAdminMessage(data.message);
    document.getElementById("userId").value = "";
    document.getElementById("bonusCredits").value = "";
    await loadUsers();
  } catch {
    showAdminMessage("Errore durante l'assegnazione crediti", true);
  }
}

async function loadUsers() {
  try {
    const res = await fetch(`${BACKEND_URL}/api/admin/users`, {
      headers: adminHeaders()
    });

    const data = await res.json();

    if (!res.ok) {
      showAdminMessage(data.error || "Errore utenti", true);
      return;
    }

    const usersList = document.getElementById("usersList");
    usersList.innerHTML = "";

    data.forEach(user => {
      const item = document.createElement("div");
      item.className = "list-item";
      item.innerHTML = `
        <div>
          <strong>#${user.id} - ${user.name}</strong>
          <p>${user.email}</p>
        </div>
        <div class="list-meta">
          <span>${user.role}</span>
          <span>${user.credits} crediti</span>
        </div>
      `;
      usersList.appendChild(item);
    });
  } catch {
    showAdminMessage("Errore caricamento utenti", true);
  }
}

async function loadProducts() {
  try {
    const res = await fetch(`${BACKEND_URL}/api/products`, {
      headers: adminHeaders()
    });

    const data = await res.json();

    if (!res.ok) {
      showAdminMessage(data.error || "Errore prodotti", true);
      return;
    }

    const productsList = document.getElementById("productsList");
    productsList.innerHTML = "";

    data.forEach(product => {
      const item = document.createElement("div");
      item.className = "list-item";
      item.innerHTML = `
        <div>
          <strong>#${product.id} - ${product.name}</strong>
          <p>${product.description}</p>
        </div>
        <div class="list-meta">
          <span>${product.price} crediti</span>
          <span>Stock: ${product.stock}</span>
        </div>
      `;
      productsList.appendChild(item);
    });
  } catch {
    showAdminMessage("Errore caricamento prodotti", true);
  }
}

adminLogoutBtn.addEventListener("click", adminLogout);

checkAdmin();