import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import Database from "better-sqlite3";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const db = new Database("database.db");
const JWT_SECRET = process.env.JWT_SECRET || "fallback_secret";

// Initialize Database
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE,
    email TEXT UNIQUE,
    password TEXT,
    balance REAL DEFAULT 10000.0,
    role TEXT DEFAULT 'USER'
  );

  CREATE TABLE IF NOT EXISTS stocks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    symbol TEXT UNIQUE,
    name TEXT,
    price REAL,
    change REAL DEFAULT 0.0,
    last_updated DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    stock_id INTEGER,
    type TEXT,
    quantity INTEGER,
    price REAL,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id),
    FOREIGN KEY(stock_id) REFERENCES stocks(id)
  );

  CREATE TABLE IF NOT EXISTS portfolios (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    stock_id INTEGER,
    quantity INTEGER,
    FOREIGN KEY(user_id) REFERENCES users(id),
    FOREIGN KEY(stock_id) REFERENCES stocks(id),
    UNIQUE(user_id, stock_id)
  );
`);

// Seed initial stocks if empty
const stockCount = db.prepare("SELECT COUNT(*) as count FROM stocks").get() as { count: number };
if (stockCount.count === 0) {
  const initialStocks = [
    { symbol: 'AAPL', name: 'Apple Inc.', price: 185.92 },
    { symbol: 'GOOGL', name: 'Alphabet Inc.', price: 142.71 },
    { symbol: 'MSFT', name: 'Microsoft Corp.', price: 402.56 },
    { symbol: 'AMZN', name: 'Amazon.com Inc.', price: 174.42 },
    { symbol: 'TSLA', name: 'Tesla Inc.', price: 193.57 },
    { symbol: 'NVDA', name: 'NVIDIA Corp.', price: 726.13 },
    { symbol: 'META', name: 'Meta Platforms Inc.', price: 484.03 },
    { symbol: 'NFLX', name: 'Netflix Inc.', price: 583.56 },
  ];

  const insertStock = db.prepare("INSERT INTO stocks (symbol, name, price) VALUES (?, ?, ?)");
  initialStocks.forEach(s => insertStock.run(s.symbol, s.name, s.price));
}

// Seed default admin if empty
const userCount = db.prepare("SELECT COUNT(*) as count FROM users").get() as { count: number };
if (userCount.count === 0) {
  const hashedPassword = await bcrypt.hash("admin123", 10);
  db.prepare("INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, ?)").run("admin", "admin@shopez.com", hashedPassword, "ADMIN");
}

async function startServer() {
  const app = express();
  app.use(express.json());

  // Auth Middleware
  const authenticateToken = (req: any, res: any, next: any) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) return res.sendStatus(401);

    jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
      if (err) return res.sendStatus(403);
      req.user = user;
      next();
    });
  };

  // Auth Routes
  app.post("/api/auth/register", async (req, res) => {
    const { username, email, password } = req.body;
    try {
      const hashedPassword = await bcrypt.hash(password, 10);
      const result = db.prepare("INSERT INTO users (username, email, password) VALUES (?, ?, ?)").run(username, email, hashedPassword);
      res.status(201).json({ id: result.lastInsertRowid });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    const { email, password } = req.body;
    const user = db.prepare("SELECT * FROM users WHERE email = ?").get(email) as any;
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ error: "Invalid credentials" });
    }
    const token = jwt.sign({ id: user.id, username: user.username, role: user.role }, JWT_SECRET);
    res.json({ token, user: { id: user.id, username: user.username, email: user.email, balance: user.balance, role: user.role } });
  });

  app.get("/api/auth/me", authenticateToken, (req: any, res) => {
    const user = db.prepare("SELECT id, username, email, balance, role FROM users WHERE id = ?").get(req.user.id);
    res.json(user);
  });

  // Stock Routes
  app.get("/api/stocks", (req, res) => {
    const stocks = db.prepare("SELECT * FROM stocks").all();
    res.json(stocks);
  });

  app.get("/api/stocks/:symbol", (req, res) => {
    const stock = db.prepare("SELECT * FROM stocks WHERE symbol = ?").get(req.params.symbol);
    if (!stock) return res.status(404).json({ error: "Stock not found" });
    res.json(stock);
  });

  // Trading Routes
  app.post("/api/trade", authenticateToken, (req: any, res) => {
    const { symbol, type, quantity } = req.body;
    const userId = req.user.id;

    const stock = db.prepare("SELECT * FROM stocks WHERE symbol = ?").get(symbol) as any;
    if (!stock) return res.status(404).json({ error: "Stock not found" });

    const user = db.prepare("SELECT * FROM users WHERE id = ?").get(userId) as any;
    const totalCost = stock.price * quantity;

    if (type === 'BUY') {
      if (user.balance < totalCost) return res.status(400).json({ error: "Insufficient balance" });

      db.transaction(() => {
        db.prepare("UPDATE users SET balance = balance - ? WHERE id = ?").run(totalCost, userId);
        db.prepare("INSERT INTO transactions (user_id, stock_id, type, quantity, price) VALUES (?, ?, ?, ?, ?)")
          .run(userId, stock.id, 'BUY', quantity, stock.price);
        
        const existing = db.prepare("SELECT * FROM portfolios WHERE user_id = ? AND stock_id = ?").get(userId, stock.id) as any;
        if (existing) {
          db.prepare("UPDATE portfolios SET quantity = quantity + ? WHERE id = ?").run(quantity, existing.id);
        } else {
          db.prepare("INSERT INTO portfolios (user_id, stock_id, quantity) VALUES (?, ?, ?)").run(userId, stock.id, quantity);
        }
      })();
    } else if (type === 'SELL') {
      const existing = db.prepare("SELECT * FROM portfolios WHERE user_id = ? AND stock_id = ?").get(userId, stock.id) as any;
      if (!existing || existing.quantity < quantity) return res.status(400).json({ error: "Insufficient stock quantity" });

      db.transaction(() => {
        db.prepare("UPDATE users SET balance = balance + ? WHERE id = ?").run(totalCost, userId);
        db.prepare("INSERT INTO transactions (user_id, stock_id, type, quantity, price) VALUES (?, ?, ?, ?, ?)")
          .run(userId, stock.id, 'SELL', quantity, stock.price);
        
        if (existing.quantity === quantity) {
          db.prepare("DELETE FROM portfolios WHERE id = ?").run(existing.id);
        } else {
          db.prepare("UPDATE portfolios SET quantity = quantity - ? WHERE id = ?").run(quantity, existing.id);
        }
      })();
    }

    res.json({ message: "Trade successful" });
  });

  app.get("/api/portfolio", authenticateToken, (req: any, res) => {
    const portfolio = db.prepare(`
      SELECT p.quantity, s.symbol, s.name, s.price as current_price
      FROM portfolios p
      JOIN stocks s ON p.stock_id = s.id
      WHERE p.user_id = ?
    `).all(req.user.id);
    res.json(portfolio);
  });

  app.get("/api/transactions", authenticateToken, (req: any, res) => {
    const transactions = db.prepare(`
      SELECT t.*, s.symbol
      FROM transactions t
      JOIN stocks s ON t.stock_id = s.id
      WHERE t.user_id = ?
      ORDER BY t.timestamp DESC
    `).all(req.user.id);
    res.json(transactions);
  });

  // Admin Routes
  app.get("/api/admin/users", authenticateToken, (req: any, res) => {
    if (req.user.role !== 'ADMIN') return res.sendStatus(403);
    const users = db.prepare("SELECT id, username, email, balance, role FROM users").all();
    res.json(users);
  });

  // Simulation: Update stock prices periodically
  setInterval(() => {
    const stocks = db.prepare("SELECT * FROM stocks").all() as any[];
    const updateStock = db.prepare("UPDATE stocks SET price = ?, change = ?, last_updated = CURRENT_TIMESTAMP WHERE id = ?");
    
    stocks.forEach(stock => {
      const changePercent = (Math.random() - 0.5) * 0.02; // +/- 1%
      const newPrice = stock.price * (1 + changePercent);
      updateStock.run(newPrice, changePercent * 100, stock.id);
    });
  }, 5000);

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  const PORT = 3000;
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
