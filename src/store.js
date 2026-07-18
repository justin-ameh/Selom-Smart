const { Pool } = require("pg");
const { seedProducts, normalizeProduct } = require("./catalog");

const memory = { products: seedProducts.map(product => ({ ...product, active: true })), orders: [] };
let pool;

function getPool() {
  if (!process.env.DATABASE_URL) return null;
  if (!pool) pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: process.env.DATABASE_SSL === "true" ? { rejectUnauthorized: false } : false });
  return pool;
}

async function listProducts({ includeInactive = false } = {}) {
  const db = getPool();
  if (!db) return memory.products.filter(product => includeInactive || product.active).map(normalizeProduct);
  try {
    const { rows } = await db.query(`SELECT * FROM products ${includeInactive ? "" : "WHERE active = true"} ORDER BY featured DESC, created_at DESC`);
    // Une nouvelle base Neon peut être encore vide : le catalogue reste visible.
    return rows.length ? rows.map(normalizeProduct) : memory.products.filter(product => includeInactive || product.active).map(normalizeProduct);
  } catch (error) {
    console.warn("Catalogue PostgreSQL indisponible, utilisation du catalogue intégré.", error.message);
    return memory.products.filter(product => includeInactive || product.active).map(normalizeProduct);
  }
}

async function findProducts(ids) {
  const products = await listProducts();
  return products.filter(product => ids.includes(product.id));
}

async function createOrder(order) {
  const db = getPool();
  if (!db) { memory.orders.unshift(order); return order; }
  const { rows } = await db.query(
    `INSERT INTO orders(reference, customer_name, phone, email, city, address, payment_method, items, subtotal, delivery_fee, total, status, payment_status)
     VALUES($1,$2,$3,$4,$5,$6,$7,$8::jsonb,$9,$10,$11,$12,$13) RETURNING *`,
    [order.reference, order.customerName, order.phone, order.email || null, order.city, order.address, order.paymentMethod, JSON.stringify(order.items), order.subtotal, order.deliveryFee, order.total, order.status, order.paymentStatus]
  );
  return { ...order, id: rows[0].id };
}

async function listOrders() {
  const db = getPool();
  if (!db) return memory.orders;
  const { rows } = await db.query("SELECT * FROM orders ORDER BY created_at DESC LIMIT 200");
  return rows.map(row => ({ ...row, customerName: row.customer_name, paymentMethod: row.payment_method, paymentStatus: row.payment_status, deliveryFee: Number(row.delivery_fee), subtotal: Number(row.subtotal), total: Number(row.total) }));
}

async function saveProduct(product) {
  const db = getPool();
  if (!db) {
    const nextId = Math.max(0, ...memory.products.map(item => item.id)) + 1;
    const saved = normalizeProduct({ ...product, id: nextId, active: true });
    memory.products.unshift(saved); return saved;
  }
  const { rows } = await db.query(
    `INSERT INTO products(slug,name,brand,category,price,old_price,storage,ram,color,stock,featured,badge,description,accent,image_url,active)
     VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,true) RETURNING *`,
    [product.slug, product.name, product.brand, product.category, product.price, product.oldPrice || 0, product.storage, product.ram, product.color, product.stock, product.featured || false, product.badge || "Disponible", product.description, product.accent || "#2f6bff", product.imageUrl || ""]
  );
  return normalizeProduct(rows[0]);
}

module.exports = { getPool, listProducts, findProducts, createOrder, listOrders, saveProduct };
