"use strict";

const path = require("node:path");
const express = require("express");
const session = require("express-session");
const connectPgSimple = require("connect-pg-simple");
const helmet = require("helmet");
const { rateLimit } = require("express-rate-limit");
const { pool, ensureSchema } = require("./db");
const { verifyPassword } = require("./auth");
const { getExportDecision, parseExport, parseImport } = require("./validation");

const app = express();
const PORT = Number(process.env.PORT || 3000);
const SESSION_SECRET = process.env.SESSION_SECRET;
const MAX_SAFE_INTEGER = Number.MAX_SAFE_INTEGER;
const PgSessionStore = connectPgSimple(session);
const SESSION_COOKIE_NAME = "warehouse.sid";

if (!SESSION_SECRET || SESSION_SECRET.length < 32) {
  throw new Error("SESSION_SECRET phải được cấu hình và có ít nhất 32 ký tự.");
}

app.disable("x-powered-by");
app.set("trust proxy", 1);
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com", "data:"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:"],
      connectSrc: ["'self'"],
      objectSrc: ["'none'"],
      baseUri: ["'self'"],
      formAction: ["'self'"],
      frameAncestors: ["'none'"]
    }
  }
}));
app.use(express.json({ limit: "16kb" }));
app.use(session({
  name: SESSION_COOKIE_NAME,
  store: new PgSessionStore({
    pool,
    tableName: "user_sessions",
    createTableIfMissing: true
  }),
  secret: SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 8 * 60 * 60 * 1000
  }
}));

function sendError(res, status, message) {
  res.status(status).json({ error: message });
}

function requireAuthentication(req, res, next) {
  if (!req.session.user) {
    return sendError(res, 401, "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.");
  }
  next();
}

function validateSameOrigin(req, res, next) {
  if (!["POST", "PUT", "PATCH", "DELETE"].includes(req.method)) return next();
  const origin = req.get("origin");
  const expectedOrigin = req.protocol + "://" + req.get("host");
  if (!origin || origin !== expectedOrigin) {
    return sendError(res, 403, "Yêu cầu không hợp lệ.");
  }
  next();
}

app.use("/api", validateSameOrigin);

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: { error: "Bạn đã thử đăng nhập quá nhiều lần. Vui lòng thử lại sau." }
});

app.get("/health", async (req, res, next) => {
  try {
    await pool.query("SELECT 1");
    res.status(200).json({ status: "ok" });
  } catch (error) {
    next(error);
  }
});

app.get("/api/session", (req, res) => {
  res.json({ user: req.session.user || null });
});

app.post("/api/login", loginLimiter, async (req, res, next) => {
  try {
    const body = req.body && typeof req.body === "object" ? req.body : {};
    const username = typeof body.username === "string" ? body.username.trim().toLowerCase() : "";
    const password = typeof body.password === "string" ? body.password : "";
    if (password.length > 128) {
      return sendError(res, 401, "Tên đăng nhập hoặc mật khẩu không đúng.");
    }
    const result = await pool.query(
      "SELECT username, password_hash FROM app_users WHERE username = $1",
      [username]
    );
    const user = result.rows[0];
    const passwordMatches = await verifyPassword(password, user && user.password_hash);
    if (!user || !passwordMatches) {
      return sendError(res, 401, "Tên đăng nhập hoặc mật khẩu không đúng.");
    }
    await new Promise((resolve, reject) => {
      req.session.regenerate((error) => error ? reject(error) : resolve());
    });
    req.session.user = { username: user.username };
    await new Promise((resolve, reject) => {
      req.session.save((error) => error ? reject(error) : resolve());
    });
    res.json({ user: req.session.user });
  } catch (error) {
    next(error);
  }
});

app.post("/api/logout", requireAuthentication, (req, res, next) => {
  req.session.destroy((error) => {
    if (error) return next(error);
    res.clearCookie(SESSION_COOKIE_NAME, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict"
    });
    res.status(204).end();
  });
});

app.get("/api/data", requireAuthentication, async (req, res, next) => {
  try {
    const [inventoryResult, activityResult] = await Promise.all([
      pool.query(
        `SELECT id, name, TO_CHAR(import_date, 'YYYY-MM-DD') AS "importDate",
                purchase_price::text AS "purchasePrice",
                sale_price::text AS "salePrice",
                quantity::text AS quantity
         FROM inventory
         ORDER BY name`
      ),
      pool.query(
        `SELECT type, product_id AS id, product_name AS name,
                quantity::text AS quantity, created_at AS timestamp
         FROM activity
         ORDER BY created_at DESC, id DESC
         LIMIT 8`
      )
    ]);
    res.json({
      inventory: inventoryResult.rows.map((product) => ({
        ...product,
        purchasePrice: Number(product.purchasePrice),
        salePrice: Number(product.salePrice),
        quantity: Number(product.quantity)
      })),
      activity: activityResult.rows.map((entry) => ({
        ...entry,
        quantity: Number(entry.quantity)
      })).reverse()
    });
  } catch (error) {
    next(error);
  }
});

app.post("/api/inventory/import", requireAuthentication, async (req, res, next) => {
  const input = parseImport(req.body);
  if (!input) return sendError(res, 400, "Thông tin nhập hàng không hợp lệ.");

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query("SELECT pg_advisory_xact_lock(hashtext($1))", [input.id.toLocaleLowerCase("vi")]);
    const existingResult = await client.query(
      "SELECT id, quantity FROM inventory WHERE LOWER(id) = LOWER($1) FOR UPDATE",
      [input.id]
    );
    const existing = existingResult.rows[0];
    const updatedQuantity = (existing ? Number(existing.quantity) : 0) + input.quantity;
    if (!Number.isSafeInteger(updatedQuantity) || updatedQuantity > MAX_SAFE_INTEGER) {
      await client.query("ROLLBACK");
      return sendError(res, 400, "Tổng số lượng tồn vượt giới hạn cho phép.");
    }
    const productId = existing ? existing.id : input.id;
    if (existing) {
      await client.query(
        `UPDATE inventory
         SET name = $1, import_date = $2, purchase_price = $3,
             sale_price = $4, quantity = $5, updated_at = NOW()
         WHERE id = $6`,
        [input.name, input.importDate, input.purchasePrice, input.salePrice, updatedQuantity, productId]
      );
    } else {
      await client.query(
        `INSERT INTO inventory (id, name, import_date, purchase_price, sale_price, quantity)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [productId, input.name, input.importDate, input.purchasePrice, input.salePrice, updatedQuantity]
      );
    }
    await client.query(
      `INSERT INTO activity (type, product_id, product_name, quantity, created_by)
       VALUES ('in', $1, $2, $3, $4)`,
      [productId, input.name, input.quantity, req.session.user.username]
    );
    await client.query("COMMIT");
    res.status(201).json({ message: "Đã nhập hàng thành công." });
  } catch (error) {
    await client.query("ROLLBACK");
    next(error);
  } finally {
    client.release();
  }
});

app.post("/api/inventory/export", requireAuthentication, async (req, res, next) => {
  const input = parseExport(req.body);
  if (!input) {
    return sendError(res, 400, "Thông tin xuất hàng không hợp lệ.");
  }
  const id = input.id;
  const quantity = input.quantity;

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const productResult = await client.query(
      "SELECT id, name, quantity FROM inventory WHERE id = $1 FOR UPDATE",
      [id]
    );
    const product = productResult.rows[0];
    if (!product) {
      await client.query("ROLLBACK");
      return sendError(res, 404, "Không tìm thấy mặt hàng.");
    }
    const currentQuantity = Number(product.quantity);
    const decision = getExportDecision(currentQuantity, quantity);
    if (!decision.allowed) {
      await client.query("ROLLBACK");
      return sendError(res, 409, decision.message);
    }
    await client.query(
      "UPDATE inventory SET quantity = quantity - $1, updated_at = NOW() WHERE id = $2",
      [decision.quantityToDeduct, id]
    );
    await client.query(
      `INSERT INTO activity (type, product_id, product_name, quantity, created_by)
       VALUES ('out', $1, $2, $3, $4)`,
      [product.id, product.name, quantity, req.session.user.username]
    );
    await client.query("COMMIT");
    res.status(200).json({ message: "Đã xuất hàng thành công." });
  } catch (error) {
    await client.query("ROLLBACK");
    next(error);
  } finally {
    client.release();
  }
});

app.get("/", (req, res) => res.sendFile(path.join(__dirname, "index.html")));
app.get("/index.html", (req, res) => res.sendFile(path.join(__dirname, "index.html")));
app.get("/app.js", (req, res) => res.sendFile(path.join(__dirname, "app.js")));
app.get("/style.css", (req, res) => res.sendFile(path.join(__dirname, "style.css")));
app.use((req, res) => sendError(res, 404, "Không tìm thấy tài nguyên."));

app.use((error, req, res, next) => {
  console.error("Request failed:", error);
  if (res.headersSent) return next(error);
  if (error.type === "entity.parse.failed") {
    return sendError(res, 400, "Dữ liệu gửi lên không đúng định dạng JSON.");
  }
  if (error.type === "entity.too.large") {
    return sendError(res, 413, "Dữ liệu gửi lên vượt giới hạn cho phép.");
  }
  sendError(res, 500, "Máy chủ gặp lỗi. Vui lòng thử lại sau.");
});

async function start() {
  await ensureSchema();
  app.listen(PORT, "0.0.0.0", () => {
    console.log("Warehouse app listening on port " + PORT);
  });
}

start().catch((error) => {
  console.error("Application startup failed:", error);
  process.exitCode = 1;
});
