const express = require("express");
const cors = require("cors");
const fs = require("fs");
const crypto = require("crypto");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");

const app = express();
const PORT = process.env.PORT || 3000;

const USERS_FILE = "./users.json";
const PRODUCTS_FILE = "./products.json";

// Cambia questi con i tuoi link reali
const ALLOWED_ORIGINS = [
  "http://127.0.0.1:5500",
  "http://localhost:5500",
  "http://localhost:3000",
  "http://127.0.0.1:3000",
  "https://TUOUSERNAME.github.io"
];

// sessioni in memoria
const sessions = new Map();

app.use(helmet());
app.use(express.json());

app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    if (ALLOWED_ORIGINS.includes(origin)) return callback(null, true);
    return callback(new Error("Origine non consentita dal CORS"));
  }
}));

app.use(rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: { error: "Troppe richieste, riprova più tardi" }
}));

function readJson(path) {
  return JSON.parse(fs.readFileSync(path, "utf8"));
}

function writeJson(path, data) {
  fs.writeFileSync(path, JSON.stringify(data, null, 2));
}

function generateSalt() {
  return crypto.randomBytes(16).toString("hex");
}

function hashPassword(password, salt) {
  return crypto.pbkdf2Sync(password, salt, 100000, 64, "sha512").toString("hex");
}

function createStoredPassword(plainPassword) {
  const salt = generateSalt();
  const hash = hashPassword(plainPassword, salt);
  return `${salt}:${hash}`;
}

function verifyPassword(plainPassword, storedPassword) {
  if (!storedPassword.includes(":")) {
    return plainPassword === storedPassword;
  }
  const [salt, originalHash] = storedPassword.split(":");
  const hash = hashPassword(plainPassword, salt);
  return crypto.timingSafeEqual(Buffer.from(hash), Buffer.from(originalHash));
}

function sanitizeUser(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    credits: user.credits,
    role: user.role
  };
}

function getTokenFromRequest(req) {
  const authHeader = req.headers.authorization || "";
  if (!authHeader.startsWith("Bearer ")) return null;
  return authHeader.split(" ")[1];
}

function requireAuth(req, res, next) {
  const token = getTokenFromRequest(req);
  if (!token || !sessions.has(token)) {
    return res.status(401).json({ error: "Accesso non autorizzato" });
  }

  const sessionUserId = sessions.get(token);
  const users = readJson(USERS_FILE);
  const user = users.find(u => u.id === sessionUserId);

  if (!user) {
    sessions.delete(token);
    return res.status(401).json({ error: "Sessione non valida" });
  }

  req.user = user;
  req.token = token;
  next();
}

function requireAdmin(req, res, next) {
  if (req.user.role !== "admin") {
    return res.status(403).json({ error: "Accesso riservato agli admin" });
  }
  next();
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isNonEmptyString(value, min = 1, max = 100) {
  return typeof value === "string" && value.trim().length >= min && value.trim().length <= max;
}

function isValidNumber(value, min = 0) {
  return typeof value === "number" && Number.isFinite(value) && value >= min;
}

// converte password vecchie in hash
function migratePlainPasswords() {
  const users = readJson(USERS_FILE);
  let changed = false;

  const updated = users.map(user => {
    if (!user.password.includes(":")) {
      changed = true;
      return { ...user, password: createStoredPassword(user.password) };
    }
    return user;
  });

  if (changed) {
    writeJson(USERS_FILE, updated);
    console.log("Password migrate in formato hash.");
  }
}

migratePlainPasswords();

app.get("/", (req, res) => {
  res.json({ message: "Backend e-commerce attivo" });
});

// AUTH

app.post("/api/auth/register", (req, res) => {
  const { name, email, password } = req.body;

  if (!isNonEmptyString(name, 2, 50)) {
    return res.status(400).json({ error: "Nome non valido" });
  }

  if (!isValidEmail(email)) {
    return res.status(400).json({ error: "Email non valida" });
  }

  if (!isNonEmptyString(password, 6, 100)) {
    return res.status(400).json({ error: "Password troppo corta" });
  }

  const users = readJson(USERS_FILE);
  const normalizedEmail = email.trim().toLowerCase();

  const existing = users.find(u => u.email.toLowerCase() === normalizedEmail);
  if (existing) {
    return res.status(409).json({ error: "Email già registrata" });
  }

  const newUser = {
    id: users.length ? Math.max(...users.map(u => u.id)) + 1 : 1,
    name: name.trim(),
    email: normalizedEmail,
    password: createStoredPassword(password),
    credits: 100,
    role: "user"
  };

  users.push(newUser);
  writeJson(USERS_FILE, users);

  res.status(201).json({
    message: "Registrazione completata",
    user: sanitizeUser(newUser)
  });
});

app.post("/api/auth/login", (req, res) => {
  const { email, password } = req.body;

  if (!isValidEmail(email) || !isNonEmptyString(password, 1, 100)) {
    return res.status(400).json({ error: "Credenziali non valide" });
  }

  const users = readJson(USERS_FILE);
  const user = users.find(u => u.email.toLowerCase() === email.trim().toLowerCase());

  if (!user || !verifyPassword(password, user.password)) {
    return res.status(401).json({ error: "Email o password errate" });
  }

  const token = crypto.randomBytes(32).toString("hex");
  sessions.set(token, user.id);

  res.json({
    message: "Login effettuato",
    token,
    user: sanitizeUser(user)
  });
});

app.post("/api/auth/logout", requireAuth, (req, res) => {
  sessions.delete(req.token);
  res.json({ message: "Logout effettuato" });
});

app.get("/api/auth/me", requireAuth, (req, res) => {
  res.json(sanitizeUser(req.user));
});

// USER

app.get("/api/products", requireAuth, (req, res) => {
  const products = readJson(PRODUCTS_FILE);
  res.json(products);
});

app.post("/api/purchase", requireAuth, (req, res) => {
  const { productId } = req.body;

  if (!Number.isInteger(productId) || productId <= 0) {
    return res.status(400).json({ error: "ID prodotto non valido" });
  }

  const users = readJson(USERS_FILE);
  const products = readJson(PRODUCTS_FILE);

  const user = users.find(u => u.id === req.user.id);
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

  writeJson(USERS_FILE, users);
  writeJson(PRODUCTS_FILE, products);

  res.json({
    message: `Hai acquistato ${product.name}`,
    user: sanitizeUser(user),
    product
  });
});

// ADMIN

app.get("/api/admin/users", requireAuth, requireAdmin, (req, res) => {
  const users = readJson(USERS_FILE).map(sanitizeUser);
  res.json(users);
});

app.post("/api/products", requireAuth, requireAdmin, (req, res) => {
  const { name, price, stock, description } = req.body;

  if (!isNonEmptyString(name, 2, 80)) {
    return res.status(400).json({ error: "Nome prodotto non valido" });
  }

  if (!isValidNumber(price, 0)) {
    return res.status(400).json({ error: "Prezzo non valido" });
  }

  if (!Number.isInteger(stock) || stock < 0) {
    return res.status(400).json({ error: "Stock non valido" });
  }

  if (!isNonEmptyString(description || "", 4, 250)) {
    return res.status(400).json({ error: "Descrizione non valida" });
  }

  const products = readJson(PRODUCTS_FILE);

  const newProduct = {
    id: products.length ? Math.max(...products.map(p => p.id)) + 1 : 1,
    name: name.trim(),
    price,
    stock,
    description: description.trim()
  };

  products.push(newProduct);
  writeJson(PRODUCTS_FILE, products);

  res.status(201).json({
    message: "Prodotto aggiunto",
    product: newProduct
  });
});

app.put("/api/products/:id", requireAuth, requireAdmin, (req, res) => {
  const id = parseInt(req.params.id);
  const { stock, price, name, description } = req.body;

  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ error: "ID prodotto non valido" });
  }

  const products = readJson(PRODUCTS_FILE);
  const product = products.find(p => p.id === id);

  if (!product) {
    return res.status(404).json({ error: "Prodotto non trovato" });
  }

  if (stock !== undefined) {
    if (!Number.isInteger(stock) || stock < 0) {
      return res.status(400).json({ error: "Stock non valido" });
    }
    product.stock = stock;
  }

  if (price !== undefined) {
    if (!isValidNumber(price, 0)) {
      return res.status(400).json({ error: "Prezzo non valido" });
    }
    product.price = price;
  }

  if (name !== undefined) {
    if (!isNonEmptyString(name, 2, 80)) {
      return res.status(400).json({ error: "Nome non valido" });
    }
    product.name = name.trim();
  }

  if (description !== undefined) {
    if (!isNonEmptyString(description, 4, 250)) {
      return res.status(400).json({ error: "Descrizione non valida" });
    }
    product.description = description.trim();
  }

  writeJson(PRODUCTS_FILE, products);

  res.json({
    message: "Prodotto aggiornato",
    product
  });
});

app.put("/api/users/:id/credits", requireAuth, requireAdmin, (req, res) => {
  const id = parseInt(req.params.id);
  const { credits } = req.body;

  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ error: "ID utente non valido" });
  }

  if (!Number.isInteger(credits) || credits <= 0) {
    return res.status(400).json({ error: "I crediti devono essere un numero intero positivo" });
  }

  const users = readJson(USERS_FILE);
  const user = users.find(u => u.id === id);

  if (!user) {
    return res.status(404).json({ error: "Utente non trovato" });
  }

  user.credits += credits;
  writeJson(USERS_FILE, users);

  res.json({
    message: "Crediti assegnati correttamente",
    user: sanitizeUser(user)
  });
});

app.use((err, req, res, next) => {
  console.error(err.message);
  res.status(500).json({ error: "Errore interno del server" });
});

app.listen(PORT, () => {
  console.log(`Server avviato sulla porta ${PORT}`);
});