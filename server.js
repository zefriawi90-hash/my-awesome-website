const express = require('express');
const initSqlJs = require('sql.js');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || '0.0.0.0';
const JWT_SECRET = process.env.JWT_SECRET || require('crypto').randomBytes(32).toString('hex');
const DB_PATH = path.join(__dirname, 'storage.db');

// Global database variable
let db;

async function initializeDatabase() {
  const SQL = await initSqlJs();

  // Try to load existing database
  if (fs.existsSync(DB_PATH)) {
    const fileBuffer = fs.readFileSync(DB_PATH);
    db = new SQL.Database(fileBuffer);
  } else {
    db = new SQL.Database();
  }

  // Create tables
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT DEFAULT 'user',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      last_login DATETIME
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS user_data (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      content TEXT,
      category TEXT DEFAULT 'general',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS login_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      username TEXT,
      ip_address TEXT,
      user_agent TEXT,
      status TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS admin_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      admin_id INTEGER NOT NULL,
      action TEXT NOT NULL,
      target_user_id INTEGER,
      details TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (admin_id) REFERENCES users(id)
    )
  `);

  // Table for daily finance transactions
  db.run(`
    CREATE TABLE IF NOT EXISTS finance_transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      type TEXT NOT NULL CHECK(type IN ('income', 'expense')),
      category TEXT NOT NULL,
      amount REAL NOT NULL,
      description TEXT,
      transaction_date DATE DEFAULT CURRENT_DATE,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);

  // Table for football matches
  db.run(`
    CREATE TABLE IF NOT EXISTS football_matches (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      league_name TEXT NOT NULL,
      home_team TEXT NOT NULL,
      away_team TEXT NOT NULL,
      home_score INTEGER DEFAULT 0,
      away_score INTEGER DEFAULT 0,
      status TEXT DEFAULT 'scheduled',
      match_date DATE,
      match_time TIME,
      created_by INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (created_by) REFERENCES users(id)
    )
  `);

  // Add sample football matches
  const existingMatches = getOne("SELECT COUNT(*) as count FROM football_matches");
  if (existingMatches.count === 0) {
    const matches = [
      // Premier League
      ['Premier League', 'Manchester City', 'Liverpool', '2026-02-15', '20:00', 2, 1, 'finished'],
      ['Premier League', 'Arsenal', 'Chelsea', '2026-02-15', '22:30', 3, 0, 'finished'],
      ['Premier League', 'Manchester United', 'Tottenham', '2026-02-16', '20:00', 1, 1, 'finished'],
      ['Premier League', 'Newcastle', 'Brighton', '2026-02-16', '22:30', 0, 0, 'scheduled'],
      ['Premier League', 'Aston Villa', 'West Ham', '2026-02-17', '20:00', 0, 0, 'scheduled'],
      // La Liga
      ['La Liga', 'Real Madrid', 'Barcelona', '2026-02-15', '21:00', 2, 3, 'finished'],
      ['La Liga', 'Atletico Madrid', 'Sevilla', '2026-02-16', '21:00', 1, 0, 'finished'],
      ['La Liga', 'Valencia', 'Real Sociedad', '2026-02-17', '21:00', 0, 0, 'scheduled'],
      ['La Liga', 'Villarreal', 'Athletic Bilbao', '2026-02-18', '21:00', 0, 0, 'scheduled'],
      // Serie A
      ['Serie A', 'Inter Milan', 'AC Milan', '2026-02-15', '23:45', 1, 2, 'finished'],
      ['Serie A', 'Juventus', 'Napoli', '2026-02-16', '23:45', 0, 0, 'scheduled'],
      ['Serie A', 'Roma', 'Lazio', '2026-02-17', '23:45', 0, 0, 'scheduled'],
      // Ligue 1
      ['Ligue 1', 'PSG', 'Marseille', '2026-02-16', '22:00', 2, 2, 'finished'],
      ['Ligue 1', 'Monaco', 'Lyon', '2026-02-17', '22:00', 0, 0, 'scheduled'],
      ['Ligue 1', 'Nice', 'Lille', '2026-02-18', '22:00', 0, 0, 'scheduled'],
      // Bundesliga
      ['Bundesliga', 'Bayern Munich', 'Borussia Dortmund', '2026-02-15', '21:30', 3, 2, 'finished'],
      ['Bundesliga', 'RB Leipzig', 'Leverkusen', '2026-02-16', '21:30', 0, 0, 'scheduled'],
      ['Bundesliga', 'Frankfurt', 'Union Berlin', '2026-02-17', '21:30', 0, 0, 'scheduled'],
      // Liga Indonesia
      ['Liga Indonesia', 'Persib Bandung', 'Persija Jakarta', '2026-02-15', '15:00', 2, 0, 'finished'],
      ['Liga Indonesia', 'Arema FC', 'Borneo FC', '2026-02-15', '18:00', 1, 1, 'finished'],
      ['Liga Indonesia', 'PSM Makassar', 'Bali United', '2026-02-16', '15:00', 0, 0, 'scheduled'],
      ['Liga Indonesia', 'Madura United', 'Persebaya', '2026-02-16', '18:00', 0, 0, 'scheduled'],
      ['Liga Indonesia', 'Dewa United', 'Persikabo 1973', '2026-02-17', '15:00', 0, 0, 'scheduled'],
    ];
    
    matches.forEach(m => {
      db.run(
        "INSERT INTO football_matches (league_name, home_team, away_team, match_date, match_time, home_score, away_score, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
        [m[0], m[1], m[2], m[3], m[4], m[5], m[6], m[7]]
      );
    });
  }

  // Table for league standings
  db.run(`
    CREATE TABLE IF NOT EXISTS football_standings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      league_name TEXT NOT NULL,
      team_name TEXT NOT NULL,
      played INTEGER DEFAULT 0,
      won INTEGER DEFAULT 0,
      drawn INTEGER DEFAULT 0,
      lost INTEGER DEFAULT 0,
      goals_for INTEGER DEFAULT 0,
      goals_against INTEGER DEFAULT 0,
      points INTEGER DEFAULT 0,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(league_name, team_name)
    )
  `);

  // Save database to file
  saveDatabase();

  // Create default admin user if not exists
  const adminExists = db.exec("SELECT * FROM users WHERE username = 'admin'");
  if (adminExists.length === 0 || adminExists[0].values.length === 0) {
    const adminPassword = 'admin123';
    const hashedPassword = bcrypt.hashSync(adminPassword, 10);
    db.run("INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, ?)", ['admin', 'admin@example.com', hashedPassword, 'admin']);
    saveDatabase();
    console.log('Default admin user created: admin / ' + adminPassword);
  }
}

function saveDatabase() {
  const data = db.export();
  const buffer = Buffer.from(data);
  fs.writeFileSync(DB_PATH, buffer);
}

function runQuery(sql, params = []) {
  try {
    db.run(sql, params);
    saveDatabase();
    return { success: true };
  } catch (err) {
    console.error('Query error:', err);
    return { success: false, error: err.message };
  }
}

function getOne(sql, params = []) {
  try {
    const stmt = db.prepare(sql);
    stmt.bind(params);
    if (stmt.step()) {
      const row = stmt.getAsObject();
      stmt.free();
      return row;
    }
    stmt.free();
    return null;
  } catch (err) {
    console.error('Query error:', err);
    return null;
  }
}

function getAll(sql, params = []) {
  try {
    const stmt = db.prepare(sql);
    stmt.bind(params);
    const results = [];
    while (stmt.step()) {
      results.push(stmt.getAsObject());
    }
    stmt.free();
    return results;
  } catch (err) {
    console.error('Query error:', err);
    return [];
  }
}

function getLastInsertRowid() {
  const result = getOne("SELECT last_insert_rowid() as id");
  return result ? result.id : 0;
}

// Middleware
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false
}));
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true
}));
app.use(express.json({ limit: '10kb' }));
app.use(cookieParser());

// Cache headers untuk static files
app.use((req, res, next) => {
  if (req.url.match(/\.(css|js|png|jpg|jpeg|gif|ico|svg|woff|woff2)$/)) {
    res.setHeader('Cache-Control', 'public, max-age=31536000');
    res.setHeader('X-Content-Type-Options', 'nosniff');
  }
  next();
});

// Specific route for club images (must be before general /images)
app.use('/images/clubs', express.static(path.join(__dirname, 'images/clubs'), {
  maxAge: '1d',
  etag: true
}));

// Enable directory listing for images folder
app.use('/images', express.static(path.join(__dirname, 'images'), {
  maxAge: '1d',
  etag: true
}));

// Serve static files from root (public folder)
app.use(express.static(path.join(__dirname), {
  maxAge: '1d',
  etag: true,
  lastModified: true
}));

// Rate limiting untuk auth endpoints (dinaikkan untuk development)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 menit
  max: 50, // maksimal 50 percobaan per IP
  message: { error: 'Terlalu banyak percobaan. Silakan coba lagi setelah 15 menit.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Auth Middleware
const authenticateToken = (req, res, next) => {
  const token = req.cookies.token || req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ success: false, error: 'Akses ditolak. Silakan login terlebih dahulu.' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(403).json({ success: false, error: 'Token tidak valid.' });
  }
};

// Admin Middleware
const requireAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Akses ditolak. Hanya admin yang dapat mengakses.' });
  }
  next();
};

// ============ AUTH ROUTES ============

// Register
app.post('/api/auth/register', authLimiter, async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ error: 'Semua field wajib diisi.' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password minimal 6 karakter.' });
    }

    const existingUser = getOne("SELECT * FROM users WHERE username = ? OR email = ?", [username, email]);
    if (existingUser) {
      return res.status(400).json({ error: 'Username atau email sudah digunakan.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    runQuery("INSERT INTO users (username, email, password) VALUES (?, ?, ?)", [username, email, hashedPassword]);

    const userId = getLastInsertRowid();

    // Log registrasi
    runQuery("INSERT INTO login_logs (username, ip_address, user_agent, status) VALUES (?, ?, ?, ?)", [
      username, req.ip || req.connection.remoteAddress, req.headers['user-agent'], 'registered'
    ]);

    const token = jwt.sign({ id: userId, username, email, role: 'user' }, JWT_SECRET, { expiresIn: '24h' });

    res.cookie('token', token, { 
      httpOnly: true, 
      maxAge: 24 * 60 * 60 * 1000,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict'
    });
    res.json({ success: true, message: 'Registrasi berhasil!', user: { username, email, role: 'user' } });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: 'Terjadi kesalahan saat registrasi.' });
  }
});

// Login
app.post('/api/auth/login', authLimiter, async (req, res) => {
  try {
    const { username, password } = req.body;

    const user = getOne("SELECT * FROM users WHERE username = ? OR email = ?", [username, username]);
    
    if (!user) {
      runQuery("INSERT INTO login_logs (username, ip_address, user_agent, status) VALUES (?, ?, ?, ?)", [
        username, req.ip || req.connection.remoteAddress, req.headers['user-agent'], 'failed'
      ]);
      return res.status(400).json({ error: 'Username atau password salah.' });
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      runQuery("INSERT INTO login_logs (user_id, username, ip_address, user_agent, status) VALUES (?, ?, ?, ?, ?)", [
        user.id, user.username, req.ip || req.connection.remoteAddress, req.headers['user-agent'], 'failed'
      ]);
      return res.status(400).json({ error: 'Username atau password salah.' });
    }

    // Update last login
    runQuery("UPDATE users SET last_login = datetime('now') WHERE id = ?", [user.id]);

    // Log login berhasil
    runQuery("INSERT INTO login_logs (user_id, username, ip_address, user_agent, status) VALUES (?, ?, ?, ?, ?)", [
      user.id, user.username, req.ip || req.connection.remoteAddress, req.headers['user-agent'], 'success'
    ]);

    const token = jwt.sign({ id: user.id, username: user.username, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '24h' });

    res.cookie('token', token, { 
      httpOnly: true, 
      maxAge: 24 * 60 * 60 * 1000,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax'
    });
    res.json({ success: true, message: 'Login berhasil!', user: { id: user.id, username: user.username, email: user.email, role: user.role }, token: token });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Terjadi kesalahan saat login.' });
  }
});

// Logout
app.post('/api/auth/logout', (req, res) => {
  res.clearCookie('token');
  res.json({ success: true, message: 'Logout berhasil.' });
});

// Check Auth
app.get('/api/auth/me', authenticateToken, (req, res) => {
  const user = getOne("SELECT id, username, email, role, created_at, last_login FROM users WHERE id = ?", [req.user.id]);
  res.json({ user });
});

// ============ USER DATA ROUTES ============

// Get all user data
app.get('/api/data', authenticateToken, (req, res) => {
  const data = getAll("SELECT * FROM user_data WHERE user_id = ? ORDER BY created_at DESC", [req.user.id]);
  res.json({ data });
});

// Add new data
app.post('/api/data', authenticateToken, (req, res) => {
  const { title, content, category } = req.body;

  if (!title) {
    return res.status(400).json({ error: 'Judul wajib diisi.' });
  }

  runQuery("INSERT INTO user_data (user_id, title, content, category) VALUES (?, ?, ?, ?)", [req.user.id, title, content || '', category || 'general']);
  
  const newId = getLastInsertRowid();
  const newData = getOne("SELECT * FROM user_data WHERE id = ?", [newId]);
  res.json({ success: true, message: 'Data berhasil ditambahkan!', data: newData });
});

// Update data
app.put('/api/data/:id', authenticateToken, (req, res) => {
  const { id } = req.params;
  const { title, content, category } = req.body;

  const existing = getOne("SELECT * FROM user_data WHERE id = ? AND user_id = ?", [id, req.user.id]);
  if (!existing) {
    return res.status(404).json({ error: 'Data tidak ditemukan.' });
  }

  runQuery("UPDATE user_data SET title = ?, content = ?, category = ?, updated_at = datetime('now') WHERE id = ?", [title, content, category, id]);
  
  const updated = getOne("SELECT * FROM user_data WHERE id = ?", [id]);
  res.json({ success: true, message: 'Data berhasil diupdate!', data: updated });
});

// Delete data
app.delete('/api/data/:id', authenticateToken, (req, res) => {
  const { id } = req.params;

  const existing = getOne("SELECT * FROM user_data WHERE id = ? AND user_id = ?", [id, req.user.id]);
  if (!existing) {
    return res.status(404).json({ error: 'Data tidak ditemukan.' });
  }

  runQuery("DELETE FROM user_data WHERE id = ?", [id]);
  res.json({ success: true, message: 'Data berhasil dihapus!' });
});

// ============ FINANCE ROUTES ============

// Get all finance transactions for user
app.get('/api/finance', authenticateToken, (req, res) => {
  const { date } = req.query;
  let query = "SELECT * FROM finance_transactions WHERE user_id = ?";
  let params = [req.user.id];

  if (date) {
    query += " AND transaction_date = ?";
    params.push(date);
  }

  query += " ORDER BY created_at DESC";
  const transactions = getAll(query, params);

  // Calculate totals
  const incomeTotal = getOne("SELECT COALESCE(SUM(amount), 0) as total FROM finance_transactions WHERE user_id = ? AND type = 'income'", [req.user.id]).total;
  const expenseTotal = getOne("SELECT COALESCE(SUM(amount), 0) as total FROM finance_transactions WHERE user_id = ? AND type = 'expense'", [req.user.id]).total;
  const todayIncome = date ? getOne("SELECT COALESCE(SUM(amount), 0) as total FROM finance_transactions WHERE user_id = ? AND type = 'income' AND transaction_date = ?", [req.user.id, date]).total : 0;
  const todayExpense = date ? getOne("SELECT COALESCE(SUM(amount), 0) as total FROM finance_transactions WHERE user_id = ? AND type = 'expense' AND transaction_date = ?", [req.user.id, date]).total : 0;

  res.json({
    transactions,
    summary: {
      totalIncome: incomeTotal,
      totalExpense: expenseTotal,
      balance: incomeTotal - expenseTotal,
      todayIncome,
      todayExpense,
      todayBalance: todayIncome - todayExpense
    }
  });
});

// Add new transaction
app.post('/api/finance', authenticateToken, (req, res) => {
  const { type, category, amount, description, transaction_date } = req.body;

  if (!type || !category || !amount) {
    return res.status(400).json({ error: 'Type, kategori, dan jumlah wajib diisi.' });
  }

  if (amount <= 0) {
    return res.status(400).json({ error: 'Jumlah harus lebih dari 0.' });
  }

  runQuery("INSERT INTO finance_transactions (user_id, type, category, amount, description, transaction_date) VALUES (?, ?, ?, ?, ?, ?)",
    [req.user.id, type, category, amount, description || '', transaction_date || new Date().toISOString().split('T')[0]]);

  const newId = getLastInsertRowid();
  const newTransaction = getOne("SELECT * FROM finance_transactions WHERE id = ?", [newId]);
  res.json({ success: true, message: 'Transaksi berhasil ditambahkan!', transaction: newTransaction });
});

// Update transaction
app.put('/api/finance/:id', authenticateToken, (req, res) => {
  const { id } = req.params;
  const { type, category, amount, description, transaction_date } = req.body;

  const existing = getOne("SELECT * FROM finance_transactions WHERE id = ? AND user_id = ?", [id, req.user.id]);
  if (!existing) {
    return res.status(404).json({ error: 'Transaksi tidak ditemukan.' });
  }

  runQuery("UPDATE finance_transactions SET type = ?, category = ?, amount = ?, description = ?, transaction_date = ? WHERE id = ?",
    [type, category, amount, description, transaction_date, id]);

  const updated = getOne("SELECT * FROM finance_transactions WHERE id = ?", [id]);
  res.json({ success: true, message: 'Transaksi berhasil diupdate!', transaction: updated });
});

// Delete transaction
app.delete('/api/finance/:id', authenticateToken, (req, res) => {
  const { id } = req.params;

  const existing = getOne("SELECT * FROM finance_transactions WHERE id = ? AND user_id = ?", [id, req.user.id]);
  if (!existing) {
    return res.status(404).json({ error: 'Transaksi tidak ditemukan.' });
  }

  runQuery("DELETE FROM finance_transactions WHERE id = ?", [id]);
  res.json({ success: true, message: 'Transaksi berhasil dihapus!' });
});

// Get finance summary by date range
app.get('/api/finance/summary', authenticateToken, (req, res) => {
  const { start_date, end_date } = req.query;

  let query = "SELECT * FROM finance_transactions WHERE user_id = ?";
  let params = [req.user.id];

  if (start_date && end_date) {
    query += " AND transaction_date BETWEEN ? AND ?";
    params.push(start_date, end_date);
  }

  query += " ORDER BY transaction_date DESC";
  const transactions = getAll(query, params);

  const incomeTotal = getOne("SELECT COALESCE(SUM(amount), 0) as total FROM finance_transactions WHERE user_id = ? AND type = 'income'" + (start_date && end_date ? " AND transaction_date BETWEEN ? AND ?" : ""), [...params.filter((_, i) => i < 1), ...(start_date && end_date ? [start_date, end_date] : [])]).total;

  res.json({ transactions, summary: { incomeTotal } });
});

// Get chart data (expense by category and weekly trend)
app.get('/api/finance/charts', authenticateToken, (req, res) => {
  // Get expense by category
  const expensesByCategory = getAll(`
    SELECT category, COALESCE(SUM(amount), 0) as total 
    FROM finance_transactions 
    WHERE user_id = ? AND type = 'expense' 
    GROUP BY category 
    ORDER BY total DESC
  `, [req.user.id]);
  
  const expenseByCategory = {};
  expensesByCategory.forEach(row => {
    expenseByCategory[row.category] = row.total;
  });
  
  // Get weekly trend (last 7 days)
  const weeklyTrend = getAll(`
    SELECT 
      transaction_date,
      COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0) as income,
      COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) as expense
    FROM finance_transactions 
    WHERE user_id = ? AND transaction_date >= date('now', '-7 days')
    GROUP BY transaction_date 
    ORDER BY transaction_date ASC
  `, [req.user.id]);
  
  res.json({
    success: true,
    expenseByCategory,
    weeklyTrend
  });
});

// Get monthly summary
app.get('/api/finance/monthly', authenticateToken, (req, res) => {
  const { month, year } = req.query;
  
  const monthNum = parseInt(month) + 1;
  const yearNum = parseInt(year);
  const monthStr = monthNum.toString().padStart(2, '0');
  
  const income = getOne(`
    SELECT COALESCE(SUM(amount), 0) as total 
    FROM finance_transactions 
    WHERE user_id = ? AND type = 'income'
    AND strftime('%m', transaction_date) = ? 
    AND strftime('%Y', transaction_date) = ?
  `, [req.user.id, monthStr, yearNum.toString()]).total;
  
  const expense = getOne(`
    SELECT COALESCE(SUM(amount), 0) as total 
    FROM finance_transactions 
    WHERE user_id = ? AND type = 'expense'
    AND strftime('%m', transaction_date) = ? 
    AND strftime('%Y', transaction_date) = ?
  `, [req.user.id, monthStr, yearNum.toString()]).total;
  
  res.json({
    success: true,
    income,
    expense,
    balance: income - expense
  });
});

// ============ ADMIN ROUTES ============

// Get all users
app.get('/api/admin/users', authenticateToken, requireAdmin, (req, res) => {
  const users = getAll("SELECT id, username, email, role, created_at, last_login FROM users ORDER BY created_at DESC");
  res.json({ users });
});

// Get user data (admin view)
app.get('/api/admin/user/:id/data', authenticateToken, requireAdmin, (req, res) => {
  const { id } = req.params;
  const user = getOne("SELECT id, username, email FROM users WHERE id = ?", [id]);
  
  if (!user) {
    return res.status(404).json({ error: 'User tidak ditemukan.' });
  }

  const data = getAll("SELECT * FROM user_data WHERE user_id = ? ORDER BY created_at DESC", [id]);
  res.json({ user, data });
});

// Get all login logs
app.get('/api/admin/logs', authenticateToken, requireAdmin, (req, res) => {
  const logs = getAll(`
    SELECT ll.*, u.role 
    FROM login_logs ll 
    LEFT JOIN users u ON ll.user_id = u.id 
    ORDER BY ll.created_at DESC 
    LIMIT 1000
  `);
  res.json({ logs });
});

// Get admin statistics
app.get('/api/admin/stats', authenticateToken, requireAdmin, (req, res) => {
  const totalUsers = getOne("SELECT COUNT(*) as count FROM users").count;
  const totalData = getOne("SELECT COUNT(*) as count FROM user_data").count;
  const todayLogins = getOne("SELECT COUNT(*) as count FROM login_logs WHERE status = 'success' AND date(created_at) = date('now')").count;
  const todayRegistrations = getOne("SELECT COUNT(*) as count FROM login_logs WHERE status = 'registered' AND date(created_at) = date('now')").count;

  const activeUsers = getAll(`
    SELECT DISTINCT user_id FROM login_logs 
    WHERE status = 'success' AND created_at > datetime('now', '-7 days')
  `).length;

  res.json({
    stats: { totalUsers, totalData, todayLogins, todayRegistrations, activeUsers }
  });
});

// Delete user
app.delete('/api/admin/user/:id', authenticateToken, requireAdmin, (req, res) => {
  const { id } = req.params;
  
  if (parseInt(id) === req.user.id) {
    return res.status(400).json({ error: 'Tidak dapat menghapus akun sendiri.' });
  }

  const user = getOne("SELECT * FROM users WHERE id = ?", [id]);
  if (!user) {
    return res.status(404).json({ error: 'User tidak ditemukan.' });
  }

  runQuery("DELETE FROM user_data WHERE user_id = ?", [id]);
  runQuery("DELETE FROM users WHERE id = ?", [id]);

  // Log admin action
  runQuery("INSERT INTO admin_logs (admin_id, action, target_user_id, details) VALUES (?, ?, ?, ?)", [
    req.user.id, 'delete_user', id, `Deleted user: ${user.username}`
  ]);

  res.json({ success: true, message: 'User berhasil dihapus!' });
});

// ============ MARKET DATA ROUTES (Forex & Crypto) ============

// Cache untuk market data (avoid API rate limit)
let marketCache = {
  crypto: { data: null, timestamp: 0 },
  forex: { data: null, timestamp: 0 }
};

const CACHE_DURATION = 60000; // 1 minute cache

// Helper function to fetch from CoinGecko API
async function fetchCryptoData() {
  const https = require('https');
  
  return new Promise((resolve, reject) => {
    const coins = ['bitcoin', 'ethereum', 'solana', 'cardano', 'ripple', 'polkadot', 'dogecoin', 'binancecoin'];
    const options = {
      hostname: 'api.coingecko.com',
      path: `/api/v3/coins/markets?vs_currency=usd&ids=${coins.join('%2C')}&order=market_cap_desc&sparkline=false&price_change_percentage=24h,7d`,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    };
    
    https.get(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve(parsed);
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });
}

// Get Crypto Prices
app.get('/api/market/crypto', authenticateToken, async (req, res) => {
  try {
    const now = Date.now();
    
    // Use cache if still valid
    if (marketCache.crypto.data && (now - marketCache.crypto.timestamp) < CACHE_DURATION) {
      return res.json({ success: true, data: marketCache.crypto.data, cached: true });
    }
    
    const cryptoData = await fetchCryptoData();
    
    // Validate that cryptoData is an array
    if (!Array.isArray(cryptoData)) {
      console.error('Crypto API returned non-array:', cryptoData);
      return res.status(502).json({ success: false, error: 'Invalid response from crypto API' });
    }
    
    const formatted = cryptoData.map(coin => ({
      id: coin.id,
      symbol: coin.symbol.toUpperCase(),
      name: coin.name,
      image: coin.image,
      current_price: coin.current_price,
      price_change_24h: coin.price_change_percentage_24h,
      price_change_7d: coin.price_change_percentage_7d,
      market_cap: coin.market_cap,
      volume: coin.total_volume,
      high_24h: coin.high_24h,
      low_24h: coin.low_24h,
      last_updated: coin.last_updated
    }));
    
    // Update cache
    marketCache.crypto = { data: formatted, timestamp: now };
    
    res.json({ success: true, data: formatted, cached: false });
  } catch (err) {
    console.error('Crypto API error:', err);
    
    // Return mock data if API fails
    const mockData = [
      { id: 'bitcoin', symbol: 'BTC', name: 'Bitcoin', current_price: 43250.00, price_change_24h: 2.5, price_change_7d: 5.2, market_cap: 845000000000, volume: 28500000000 },
      { id: 'ethereum', symbol: 'ETH', name: 'Ethereum', current_price: 2280.00, price_change_24h: 1.8, price_change_7d: 3.5, market_cap: 275000000000, volume: 12500000000 },
      { id: 'solana', symbol: 'SOL', name: 'Solana', current_price: 98.50, price_change_24h: 4.2, price_change_7d: 12.5, market_cap: 42000000000, volume: 2100000000 },
      { id: 'cardano', symbol: 'ADA', name: 'Cardano', current_price: 0.55, price_change_24h: -1.2, price_change_7d: -2.8, market_cap: 19500000000, volume: 450000000 },
      { id: 'ripple', symbol: 'XRP', name: 'XRP', current_price: 0.62, price_change_24h: 0.8, price_change_7d: 1.5, market_cap: 33500000000, volume: 1200000000 }
    ];
    
    res.json({ success: true, data: mockData, cached: false, fallback: true });
  }
});

// Get Forex Rates (simulated data with market trends)
app.get('/api/market/forex', authenticateToken, async (req, res) => {
  try {
    const now = Date.now();
    
    // Use cache if still valid
    if (marketCache.forex.data && (now - marketCache.forex.timestamp) < CACHE_DURATION) {
      return res.json({ success: true, data: marketCache.forex.data, cached: true });
    }
    
    // Simulated forex data (in production, use API like exchangerate-api.com)
    const forexData = {
      pairs: [
        { 
          pair: 'USD/IDR', 
          name: 'US Dollar to Indonesian Rupiah',
          bid: 15650.00, 
          ask: 15670.00, 
          change_24h: 0.35,
          trend: 'up',
          high: 15720.00,
          low: 15580.00,
          open: 15620.00
        },
        { 
          pair: 'USD/JPY', 
          name: 'US Dollar to Japanese Yen',
          bid: 149.85, 
          ask: 149.95, 
          change_24h: -0.12,
          trend: 'down',
          high: 150.50,
          low: 149.20,
          open: 149.80
        },
        { 
          pair: 'EUR/USD', 
          name: 'Euro to US Dollar',
          bid: 1.0850, 
          ask: 1.0860, 
          change_24h: 0.22,
          trend: 'up',
          high: 1.0890,
          low: 1.0820,
          open: 1.0840
        },
        { 
          pair: 'GBP/USD', 
          name: 'British Pound to US Dollar',
          bid: 1.2650, 
          ask: 1.2660, 
          change_24h: 0.45,
          trend: 'up',
          high: 1.2700,
          low: 1.2580,
          open: 1.2620
        },
        { 
          pair: 'USD/THB', 
          name: 'US Dollar to Thai Baht',
          bid: 35.80, 
          ask: 35.95, 
          change_24h: -0.25,
          trend: 'down',
          high: 36.10,
          low: 35.60,
          open: 35.85
        }
      ],
      last_updated: new Date().toISOString()
    };
    
    // Update cache
    marketCache.forex = { data: forexData, timestamp: now };
    
    res.json({ success: true, data: forexData, cached: false });
  } catch (err) {
    console.error('Forex data error:', err);
    res.status(500).json({ error: 'Gagal mengambil data forex' });
  }
});

// Technical Analysis endpoint
app.get('/api/market/analysis/:symbol', authenticateToken, (req, res) => {
  const { symbol } = req.params;
  const { type = 'crypto' } = req.query;
  
  // Generate technical analysis (simplified - in production use proper indicators)
  const analysis = {
    symbol,
    type,
    indicators: {
      rsi: Math.random() * 100, // 0-100
      macd: {
        macd_line: (Math.random() - 0.5) * 10,
        signal: (Math.random() - 0.5) * 10,
        histogram: (Math.random() - 0.5) * 2
      },
      moving_average: {
        sma_20: Math.random() * 1000,
        sma_50: Math.random() * 1000,
        ema_12: Math.random() * 1000,
        ema_26: Math.random() * 1000
      },
      bollinger_bands: {
        upper: Math.random() * 1000,
        middle: Math.random() * 1000,
        lower: Math.random() * 1000
      }
    },
    sentiment: {
      score: Math.random() * 100,
      label: Math.random() > 0.5 ? 'Bullish' : 'Bearish',
      fear_greed_index: Math.floor(Math.random() * 100)
    },
    support_resistance: {
      support: [Math.random() * 1000, Math.random() * 800],
      resistance: [Math.random() * 1200, Math.random() * 1500]
    },
    recommendation: {
      action: ['BUY', 'SELL', 'HOLD'][Math.floor(Math.random() * 3)],
      confidence: Math.floor(50 + Math.random() * 40),
      reason: 'Berdasarkan analisis teknikal dan pola harga terkini'
    },
    generated_at: new Date().toISOString()
  };
  
  res.json({ success: true, analysis });
});

// AI Analysis endpoint (sentiment analysis simulation)
app.get('/api/market/ai/:symbol', authenticateToken, async (req, res) => {
  const { symbol } = req.params;
  
  // Simulated AI analysis (in production, use ML model or external API)
  const direction = ['UP', 'DOWN', 'NEUTRAL'][Math.floor(Math.random() * 3)];
  const action = direction === 'UP' ? 'BUY' : direction === 'DOWN' ? 'SELL' : 'HOLD';
  const sentiment = Math.random() > 0.5 ? 'POSITIVE' : 'NEGATIVE';
  const riskLevel = ['LOW', 'MEDIUM', 'HIGH'][Math.floor(Math.random() * 3)];
  
  const aiAnalysis = {
    symbol,
    prediction: {
      direction,
      probability: 45 + Math.random() * 30, // 45-75%
      timeframe: '7d'
    },
    recommendation: {
      action,
      confidence: Math.floor(50 + Math.random() * 40),
      reason: 'Berdasarkan analisis teknikal dan pola harga terkini'
    },
    sentiment_analysis: {
      overall: sentiment,
      score: Math.floor(40 + Math.random() * 40),
      news_count: Math.floor(10 + Math.random() * 50)
    },
    risk_assessment: {
      level: ['LOW', 'MEDIUM', 'HIGH'][Math.floor(Math.random() * 3)],
      volatility: Math.floor(20 + Math.random() * 60),
      score: Math.floor(30 + Math.random() * 50)
    },
    insights: [
      'Harga menunjukkan momentum positif dalam 24 jam terakhir',
      'Volume perdagangan meningkat dibandingkan rata-rata',
      'Support level terdekat di area harga saat ini',
      'Perhatikan resistensi kunci untuk breakout'
    ],
    disclaimer: '⚠️ Analisis ini bersifat EDUKATIF saja. Bukan saran investasi. Selalu lakukan riset sendiri.',
    generated_at: new Date().toISOString()
  };
  
  res.json({ success: true, ai: aiAnalysis });
});

// ============ FOOTBALL MATCHES ROUTES ============

// Get all matches (for admin and users)
app.get('/api/football/matches', authenticateToken, (req, res) => {
  const { league, status, date } = req.query;
  let query = "SELECT * FROM football_matches WHERE 1=1";
  let params = [];
  
  if (league) {
    query += " AND league_name = ?";
    params.push(league);
  }
  
  if (status) {
    query += " AND status = ?";
    params.push(status);
  }
  
  if (date) {
    query += " AND match_date = ?";
    params.push(date);
  }
  
  query += " ORDER BY match_date DESC, match_time DESC";
  
  const matches = getAll(query, params);
  
  // Get unique leagues for filter dropdown
  const leagues = getAll("SELECT DISTINCT league_name FROM football_matches ORDER BY league_name");
  
  res.json({ success: true, matches, leagues: leagues.map(l => l.league_name) });
});

// Get match by ID
app.get('/api/football/matches/:id', authenticateToken, (req, res) => {
  const { id } = req.params;
  const match = getOne("SELECT * FROM football_matches WHERE id = ?", [id]);
  
  if (!match) {
    return res.status(404).json({ error: 'Pertandingan tidak ditemukan.' });
  }
  
  res.json({ match });
});

// Add new match (ADMIN ONLY)
app.post('/api/football/matches', authenticateToken, requireAdmin, (req, res) => {
  const { league_name, home_team, away_team, match_date, match_time } = req.body;
  
  if (!league_name || !home_team || !away_team || !match_date) {
    return res.status(400).json({ error: 'Semua field wajib diisi.' });
  }
  
  runQuery("INSERT INTO football_matches (league_name, home_team, away_team, match_date, match_time, created_by) VALUES (?, ?, ?, ?, ?, ?)", 
    [league_name, home_team, away_team, match_date, match_time || null, req.user.id]);
  
  const newId = getLastInsertRowid();
  const newMatch = getOne("SELECT * FROM football_matches WHERE id = ?", [newId]);
  
  // Log admin action
  runQuery("INSERT INTO admin_logs (admin_id, action, details) VALUES (?, ?, ?)", 
    [req.user.id, 'ADD_FOOTBALL_MATCH', `Added match: ${home_team} vs ${away_team} (${league_name})`]);
  
  res.json({ success: true, message: 'Pertandingan berhasil ditambahkan!', match: newMatch });
});

// Update match score (ADMIN ONLY)
app.put('/api/football/matches/:id', authenticateToken, requireAdmin, (req, res) => {
  const { id } = req.params;
  const { home_score, away_score, status } = req.body;
  
  const existing = getOne("SELECT * FROM football_matches WHERE id = ?", [id]);
  if (!existing) {
    return res.status(404).json({ error: 'Pertandingan tidak ditemukan.' });
  }
  
  runQuery("UPDATE football_matches SET home_score = ?, away_score = ?, status = ?, updated_at = datetime('now') WHERE id = ?", 
    [home_score, away_score, status, id]);
  
  const updated = getOne("SELECT * FROM football_matches WHERE id = ?", [id]);
  
  // Log admin action
  runQuery("INSERT INTO admin_logs (admin_id, action, details) VALUES (?, ?, ?)", 
    [req.user.id, 'UPDATE_FOOTBALL_SCORE', `Updated score: ${updated.home_team} ${updated.home_score}-${updated.away_score} ${updated.away_team}`]);
  
  res.json({ success: true, message: 'Skor berhasil diupdate!', match: updated });
});

// Delete match (ADMIN ONLY)
app.delete('/api/football/matches/:id', authenticateToken, requireAdmin, (req, res) => {
  const { id } = req.params;
  
  const existing = getOne("SELECT * FROM football_matches WHERE id = ?", [id]);
  if (!existing) {
    return res.status(404).json({ error: 'Pertandingan tidak ditemukan.' });
  }
  
  runQuery("DELETE FROM football_matches WHERE id = ?", [id]);
  
  // Log admin action
  runQuery("INSERT INTO admin_logs (admin_id, action, details) VALUES (?, ?, ?)", 
    [req.user.id, 'DELETE_FOOTBALL_MATCH', `Deleted match: ${existing.home_team} vs ${existing.away_team}`]);
  
  res.json({ success: true, message: 'Pertandingan berhasil dihapus!' });
});

// ==================== LEAGUE STANDINGS API ====================

// Get standings for a league
app.get('/api/football/standings', authenticateToken, (req, res) => {
  const { league } = req.query;
  
  if (!league) {
    return res.status(400).json({ error: 'Nama liga diperlukan.' });
  }
  
  // Calculate standings from matches
  const standings = calculateStandings(league);
  
  res.json({ success: true, standings });
});

// Calculate standings based on matches
function calculateStandings(leagueName) {
  const matches = getAll(`SELECT * FROM football_matches WHERE league_name = ? AND status = 'finished'`, [leagueName]);
  
  // Get all teams in the league
  const teams = new Set();
  matches.forEach(m => {
    teams.add(m.home_team);
    teams.add(m.away_team);
  });
  
  const standings = {};
  
  teams.forEach(team => {
    standings[team] = {
      team_name: team,
      played: 0,
      won: 0,
      drawn: 0,
      lost: 0,
      goals_for: 0,
      goals_against: 0,
      goal_diff: 0,
      points: 0
    };
  });
  
  // Calculate stats from matches
  matches.forEach(match => {
    const home = standings[match.home_team];
    const away = standings[match.away_team];
    
    home.played++;
    away.played++;
    
    home.goals_for += match.home_score;
    home.goals_against += match.away_score;
    
    away.goals_for += match.away_score;
    away.goals_against += match.home_score;
    
    if (match.home_score > match.away_score) {
      home.won++;
      home.points += 3;
      away.lost++;
    } else if (match.home_score < match.away_score) {
      away.won++;
      away.points += 3;
      home.lost++;
    } else {
      home.drawn++;
      away.drawn++;
      home.points += 1;
      away.points += 1;
    }
  });
  
  // Convert to array and sort
  const result = Object.values(standings).map(s => ({
    ...s,
    goal_diff: s.goals_for - s.goals_against
  })).sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    if (b.goal_diff !== a.goal_diff) return b.goal_diff - a.goal_diff;
    return b.goals_for - a.goals_for;
  });
  
  return result;
}

// Get live matches
app.get('/api/football/live', authenticateToken, (req, res) => {
  const matches = getAll(`SELECT * FROM football_matches WHERE status = 'live'`);
  res.json({ success: true, matches });
});

// Serve index.html for all routes (SPA support)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Initialize database and start server
initializeDatabase().then(() => {
  app.listen(PORT, HOST, () => {
    console.log(`\n🚀 Private Storage System berjalan di http://localhost:${PORT}`);
    console.log(`   Atau akses dari jaringan: http://<IP-ANDA>:${PORT}`);
    console.log(`\n📋 Default Admin:`);
    console.log(`   Username: admin`);
    console.log(`   Password: admin123\n`);
  });
}).catch(err => {
  console.error('Failed to initialize database:', err);
  process.exit(1);
});
