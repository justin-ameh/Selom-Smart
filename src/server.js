require("dotenv").config();
const path = require("path");
const crypto = require("crypto");
const express = require("express");
const helmet = require("helmet");
const jwt = require("jsonwebtoken");
const { rateLimit } = require("express-rate-limit");
const { z } = require("zod");
const { listProducts, findProducts, createOrder, listOrders, saveProduct, getPool } = require("./store");

const app = express();
const PORT = Number(process.env.PORT || 3000);
const SITE_URL = process.env.SITE_URL || `http://localhost:${PORT}`;
const WHATSAPP = (process.env.WHATSAPP_NUMBER || "22899234616").replace(/\D/g, "");

app.set("trust proxy", 1);
app.use(helmet({ contentSecurityPolicy: false }));
app.use(express.json({ limit: "200kb" }));
app.use("/api", rateLimit({ windowMs: 60_000, limit: 120, standardHeaders: "draft-8", legacyHeaders: false }));
app.use(express.static(path.join(__dirname, "..", "public"), {
  extensions: ["html"], maxAge: process.env.NODE_ENV === "production" ? "7d" : 0,
  setHeaders(res, filePath) { if (/\.(?:html|js|json)$/i.test(filePath)) res.setHeader("Cache-Control", "no-cache, must-revalidate"); }
}));

const orderSchema = z.object({
  customerName: z.string().trim().min(2).max(80),
  phone: z.string().trim().min(8).max(25), email: z.string().email().optional().or(z.literal("")),
  city: z.string().trim().min(2).max(60), address: z.string().trim().min(3).max(180),
  paymentMethod: z.enum(["whatsapp", "flooz", "tmoney", "visa", "livraison"]),
  items: z.array(z.object({ productId: z.number().int().positive(), quantity: z.number().int().min(1).max(10) })).min(1).max(30)
});
const productSchema = z.object({
  name: z.string().min(2).max(100), slug: z.string().regex(/^[a-z0-9-]+$/).max(100), brand: z.string().min(1).max(40),
  category: z.string().min(2).max(50), price: z.number().int().nonnegative(), oldPrice: z.number().int().nonnegative().optional(),
  storage: z.string().max(30).optional().default(""), ram: z.string().max(30).optional().default(""), color: z.string().max(50).optional().default(""),
  stock: z.number().int().nonnegative(), featured: z.boolean().optional(), badge: z.string().max(30).optional(),
  description: z.string().min(10).max(500), accent: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(), imageUrl: z.string().url().optional().or(z.literal(""))
});

function reference() { return `SS-${new Date().toISOString().slice(0, 10).replaceAll("-", "")}-${crypto.randomBytes(3).toString("hex").toUpperCase()}`; }
function signAdmin() { return jwt.sign({ role: "admin" }, process.env.JWT_SECRET || "development-secret-change-me-now", { expiresIn: "8h" }); }
function requireAdmin(req, res, next) {
  try {
    const token = req.headers.authorization?.replace(/^Bearer\s+/i, "");
    const payload = jwt.verify(token, process.env.JWT_SECRET || "development-secret-change-me-now");
    if (payload.role !== "admin") throw new Error("role"); next();
  } catch { res.status(401).json({ error: "Authentification administrateur requise." }); }
}

app.get("/api/health", async (_req, res) => {
  const database = getPool() ? "postgresql" : "mémoire-démo";
  res.json({ status: "ok", shop: "SELOM SMART", database, payments: Boolean(process.env.CINETPAY_SITE_ID && process.env.CINETPAY_API_KEY) });
});
app.get("/api/products", async (_req, res, next) => { try { res.json({ products: await listProducts() }); } catch (error) { next(error); } });

app.post("/api/orders", async (req, res, next) => {
  try {
    const input = orderSchema.parse(req.body);
    const products = await findProducts(input.items.map(item => item.productId));
    if (products.length !== new Set(input.items.map(item => item.productId)).size) return res.status(400).json({ error: "Un produit du panier n’est plus disponible." });
    const items = input.items.map(item => {
      const product = products.find(candidate => candidate.id === item.productId);
      if (item.quantity > product.stock) throw new Error(`Stock insuffisant pour ${product.name}.`);
      return { productId: product.id, name: product.name, price: product.price, quantity: item.quantity, total: product.price * item.quantity };
    });
    const subtotal = items.reduce((sum, item) => sum + item.total, 0);
    const deliveryFee = input.city.toLowerCase().includes("lomé") || input.city.toLowerCase().includes("lome") ? 2000 : 5000;
    const order = await createOrder({ ...input, reference: reference(), items, subtotal, deliveryFee, total: subtotal + deliveryFee, status: "nouvelle", paymentStatus: "en_attente", createdAt: new Date().toISOString() });
    const message = encodeURIComponent(`Bonjour SELOM SMART, je confirme la commande ${order.reference} de ${order.total.toLocaleString("fr-FR")} FCFA. Nom : ${order.customerName}. Paiement : ${order.paymentMethod}.`);
    const response = { order, whatsappUrl: `https://wa.me/${WHATSAPP}?text=${message}`, paymentConfigured: false };
    if (["flooz", "tmoney", "visa"].includes(input.paymentMethod) && process.env.CINETPAY_SITE_ID && process.env.CINETPAY_API_KEY) {
      const payment = await fetch("https://api-checkout.cinetpay.com/v2/payment", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({
        apikey: process.env.CINETPAY_API_KEY, site_id: process.env.CINETPAY_SITE_ID, transaction_id: order.reference.replace(/[^A-Z0-9]/g, ""), amount: order.total,
        currency: "XOF", description: `Commande ${order.reference} - SELOM SMART`, return_url: `${SITE_URL}/merci.html?ref=${order.reference}`,
        notify_url: `${SITE_URL}/api/payments/cinetpay/notify`, channels: input.paymentMethod === "visa" ? "CREDIT_CARD" : "MOBILE_MONEY",
        customer_name: order.customerName, customer_surname: "Client", customer_phone_number: order.phone, customer_email: order.email || "client@selomsmart.tg", customer_address: order.address, customer_city: order.city, customer_country: "TG", customer_state: "TG", customer_zip_code: "00000"
      }) });
      const data = await payment.json();
      if (data.code === "201" && data.data?.payment_url) Object.assign(response, { paymentConfigured: true, paymentUrl: data.data.payment_url });
      else response.paymentError = "Le paiement en ligne est momentanément indisponible. Confirmez par WhatsApp.";
    }
    res.status(201).json(response);
  } catch (error) { next(error); }
});

app.post("/api/payments/cinetpay/notify", express.urlencoded({ extended: false }), async (req, res) => {
  // CinetPay doit être interrogé côté serveur avec les clés marchandes avant de marquer la commande payée.
  console.info("Notification CinetPay reçue", { transaction: req.body.cpm_trans_id || req.body.transaction_id });
  res.sendStatus(200);
});

app.post("/api/admin/login", (req, res) => {
  const email = String(req.body.email || "").toLowerCase();
  const password = String(req.body.password || "");
  const validEmail = process.env.ADMIN_EMAIL || "admin@selomsmart.tg";
  const validPassword = process.env.ADMIN_PASSWORD || "change-this-password";
  if (email !== validEmail.toLowerCase() || password !== validPassword) return res.status(401).json({ error: "Identifiants incorrects." });
  res.json({ token: signAdmin() });
});
app.get("/api/admin/orders", requireAdmin, async (_req, res, next) => { try { res.json({ orders: await listOrders() }); } catch (error) { next(error); } });
app.get("/api/admin/products", requireAdmin, async (_req, res, next) => { try { res.json({ products: await listProducts({ includeInactive: true }) }); } catch (error) { next(error); } });
app.post("/api/admin/products", requireAdmin, async (req, res, next) => { try { res.status(201).json({ product: await saveProduct(productSchema.parse(req.body)) }); } catch (error) { next(error); } });

app.get("/sitemap.xml", async (_req, res, next) => { try { const products = await listProducts(); res.type("application/xml").send(`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>${SITE_URL}/</loc><priority>1.0</priority></url>${products.map(product => `<url><loc>${SITE_URL}/?produit=${product.slug}</loc><priority>0.8</priority></url>`).join("")}</urlset>`); } catch (error) { next(error); } });
app.get("/robots.txt", (_req, res) => res.type("text/plain").send(`User-agent: *\nAllow: /\nDisallow: /admin.html\nSitemap: ${SITE_URL}/sitemap.xml\n`));
app.use((error, _req, res, _next) => {
  console.error(error);
  if (error instanceof z.ZodError) return res.status(400).json({ error: "Informations invalides.", details: error.issues });
  res.status(error.message?.startsWith("Stock insuffisant") ? 409 : 500).json({ error: error.message || "Une erreur interne est survenue." });
});

if (require.main === module) app.listen(PORT, () => console.log(`SELOM SMART disponible sur ${SITE_URL}`));
module.exports = { app, orderSchema, productSchema };
