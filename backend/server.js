const express = require("express");
const cors = require("cors");
const fs = require("fs");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

const usersFile = "./users.json";
const productsFile = "./products.json";

function readJson(path) {
  return JSON.parse(fs.readFileSync(path, "utf8"));
}

function writeJson(path, data) {
  fs.writeFileSync(path, JSON.stringify(data, null, 2));
}

app.get("/", (req, res) => {
  res.send("Backend e-commerce attivo");
});

app.get("/api/users", (req, res) => {
  const users = readJson(usersFile);
  res.json(users);
});

app.get("/api/products", (req, res) => {
  const products = readJson(productsFile);
  res.json(products);
});

app.post("/api/purchase", (req, res) => {
  const { userId, productId } = req.body;

  const users = readJson(usersFile);
  const products = readJson(productsFile);

  const user = users.find(u => u.id === userId);
  const product = products.find(p => p.id === productId);

  if (!user || !product) {
    return res.status(404).json({ error: "Utente o prodotto non trovato" });
  }

  if (product.stock <= 0) {
    return res.status(400).json({ error: "Prodotto esaurito" });
  }

  if (user.credits < product.price) {
    return res.status(400).json({ error: "Crediti insufficienti" });
  }

  user.credits -= product.price;
  product.stock -= 1;

  writeJson(usersFile, users);
  writeJson(productsFile, products);

  res.json({ message: "Acquisto completato", user, product });
});

app.post("/api/products", (req, res) => {
  const { name, price, stock } = req.body;
  const products = readJson(productsFile);

  const newProduct = {
    id: products.length ? products[products.length - 1].id + 1 : 1,
    name,
    price,
    stock
  };

  products.push(newProduct);
  writeJson(productsFile, products);

  res.status(201).json(newProduct);
});

app.put("/api/products/:id/stock", (req, res) => {
  const id = parseInt(req.params.id);
  const { stock } = req.body;

  const products = readJson(productsFile);
  const product = products.find(p => p.id === id);

  if (!product) {
    return res.status(404).json({ error: "Prodotto non trovato" });
  }

  product.stock = stock;
  writeJson(productsFile, products);

  res.json(product);
});

app.put("/api/users/:id/credits", (req, res) => {
  const id = parseInt(req.params.id);
  const { credits } = req.body;

  const users = readJson(usersFile);
  const user = users.find(u => u.id === id);

  if (!user) {
    return res.status(404).json({ error: "Utente non trovato" });
  }

  user.credits += credits;
  writeJson(usersFile, users);

  res.json(user);
});

app.listen(PORT, () => {
  console.log(`Server avviato sulla porta ${PORT}`);
});