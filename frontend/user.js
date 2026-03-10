const BACKEND_URL = "https://compito-ecommerce.onrender.com";
const USER_ID = 1;

async function loadUser() {
  const res = await fetch(`${BACKEND_URL}/api/users`);
  const users = await res.json();
  const user = users.find(u => u.id === USER_ID);
  document.getElementById("credits").textContent = user.credits;
}

async function loadProducts() {
  const res = await fetch(`${BACKEND_URL}/api/products`);
  const products = await res.json();

  const container = document.getElementById("products");
  container.innerHTML = "";

  products.forEach(product => {
    const div = document.createElement("div");
    div.className = "card";
    div.innerHTML = `
      <h3>${product.name}</h3>
      <p>Prezzo: ${product.price}</p>
      <p>Stock: ${product.stock}</p>
      <button ${product.stock <= 0 ? "disabled" : ""} onclick="buyProduct(${product.id})">
        Acquista
      </button>
    `;
    container.appendChild(div);
  });
}

async function buyProduct(productId) {
  const res = await fetch(`${BACKEND_URL}/api/purchase`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId: USER_ID, productId })
  });

  const data = await res.json();
  const message = document.getElementById("message");

  if (!res.ok) {
    message.textContent = data.error;
  } else {
    message.textContent = data.message;
  }

  loadUser();
  loadProducts();
}

loadUser();
loadProducts();