const BACKEND_URL = "http://localhost:3000";

async function addProduct() {
  const name = document.getElementById("name").value;
  const price = parseInt(document.getElementById("price").value);
  const stock = parseInt(document.getElementById("stock").value);

  const res = await fetch(`${BACKEND_URL}/api/products`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, price, stock })
  });

  const data = await res.json();
  document.getElementById("adminMessage").textContent =
    res.ok ? "Prodotto aggiunto" : data.error;
}

async function updateStock() {
  const productId = document.getElementById("productId").value;
  const stock = parseInt(document.getElementById("newStock").value);

  const res = await fetch(`${BACKEND_URL}/api/products/${productId}/stock`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ stock })
  });

  const data = await res.json();
  document.getElementById("adminMessage").textContent =
    res.ok ? "Stock aggiornato" : data.error;
}

async function addCredits() {
  const userId = document.getElementById("userId").value;
  const credits = parseInt(document.getElementById("bonusCredits").value);

  const res = await fetch(`${BACKEND_URL}/api/users/${userId}/credits`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ credits })
  });

  const data = await res.json();
  document.getElementById("adminMessage").textContent =
    res.ok ? "Crediti aggiornati" : data.error;
}