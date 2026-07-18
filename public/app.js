const state = { products: Array.isArray(window.SELOM_PRODUCTS) ? window.SELOM_PRODUCTS : [], cart: JSON.parse(localStorage.getItem("selom-cart") || "[]"), category: "", search: "", brand: "", sort: "featured" };
const $ = selector => document.querySelector(selector);
const money = value => `${Number(value).toLocaleString("fr-FR")} FCFA`;
const escapeHtml = value => String(value).replace(/[&<>'"]/g, char => ({ "&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",'"':"&quot;" })[char]);
function populateBrands() { const brands = [...new Set(state.products.map(product => product.brand))].sort(); $("#brand-filter").innerHTML = '<option value="">Toutes les marques</option>' + brands.map(brand => `<option value="${escapeHtml(brand)}">${escapeHtml(brand)}</option>`).join(""); }

async function loadProducts() {
  // Affichage immédiat : le catalogue reste visible même sans API ou en ouverture locale.
  if (state.products.length) { populateBrands(); renderProducts(); renderCart(); }
  try {
    const response = await fetch("api/products");
    if (!response.ok) throw new Error("Catalogue indisponible");
    state.products = (await response.json()).products;
    if (!state.products.length) throw new Error("Catalogue vide");
    populateBrands();
    renderProducts(); renderCart();
  } catch { if (!state.products.length) $("#product-grid").innerHTML = '<div class="loading">Impossible de charger le catalogue. Réessayez dans quelques instants.</div>'; }
}

const normalizeSearch = value => String(value || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim().toLowerCase();

function filteredProducts() {
  let products = state.products.filter(product => (!state.category || product.category === state.category) && (!state.brand || product.brand === state.brand) && (!state.search || normalizeSearch(`${product.name} ${product.brand} ${product.storage} ${product.ram} ${product.color}`).includes(state.search)));
  if (state.sort === "price-asc") products.sort((a,b) => a.price - b.price);
  if (state.sort === "price-desc") products.sort((a,b) => b.price - a.price);
  if (state.sort === "featured") products.sort((a,b) => Number(b.featured) - Number(a.featured));
  return products;
}

function renderProducts() {
  const products = filteredProducts();
  $("#product-grid").innerHTML = products.length ? products.map(product => `<article class="product-card">
    <div class="product-visual" style="--accent:${escapeHtml(product.accent)}"><span class="product-badge">${escapeHtml(product.badge)}</span>${product.imageUrl ? `<img src="${escapeHtml(product.imageUrl)}" alt="Illustration du ${escapeHtml(product.name)}" loading="lazy" onerror="this.hidden=true;this.nextElementSibling.hidden=false"><div class="mini-phone" hidden></div>` : '<div class="mini-phone"></div>'}</div>
    <div class="product-info"><span class="product-brand">${escapeHtml(product.brand.toUpperCase())}</span><h3>${escapeHtml(product.name)}</h3><div class="specs"><span>${escapeHtml(product.storage)}</span><span>${escapeHtml(product.ram)}</span><span>${product.stock} en stock</span></div><div class="product-price"><b>${money(product.price)}</b>${product.oldPrice ? `<del>${money(product.oldPrice)}</del>` : ""}</div><div class="product-actions"><button class="detail-button" data-detail="${product.id}">Voir les détails</button><button class="add-button" data-add="${product.id}">Ajouter</button></div></div></article>`).join("") : '<div class="loading">Aucun téléphone ne correspond à votre recherche.</div>';
  document.querySelectorAll("[data-add]").forEach(button => button.addEventListener("click", () => addToCart(Number(button.dataset.add))));
  document.querySelectorAll("[data-detail]").forEach(button => button.addEventListener("click", () => showProduct(Number(button.dataset.detail))));
}

function showProduct(productId) {
  const product = state.products.find(item => item.id === productId); if (!product) return;
  $("#product-detail").innerHTML = `<div class="detail-layout"><div class="detail-image" style="--accent:${escapeHtml(product.accent)}"><img src="${escapeHtml(product.imageUrl)}" alt="Illustration du ${escapeHtml(product.name)}"></div><div class="detail-copy"><span class="product-brand">${escapeHtml(product.brand.toUpperCase())}</span><h2>${escapeHtml(product.name)}</h2><p>${escapeHtml(product.description)}</p><dl><div><dt>Stockage</dt><dd>${escapeHtml(product.storage)}</dd></div><div><dt>Mémoire RAM</dt><dd>${escapeHtml(product.ram)}</dd></div><div><dt>Couleur</dt><dd>${escapeHtml(product.color)}</dd></div><div><dt>Disponibilité</dt><dd>${product.stock} en stock</dd></div></dl><div class="detail-price"><b>${money(product.price)}</b>${product.oldPrice ? `<del>${money(product.oldPrice)}</del>` : ""}</div><button class="primary full" id="detail-add">Ajouter au panier <span>→</span></button><a class="whatsapp-detail" href="https://wa.me/22899234616?text=${encodeURIComponent(`Bonjour SELOM SMART, je souhaite avoir des informations sur le ${product.name}.`)}" target="_blank" rel="noopener">Poser une question sur WhatsApp</a></div></div>`;
  $("#detail-add").onclick = () => { $("#product-dialog").close(); addToCart(product.id); };
  $("#product-dialog").showModal();
}

function saveCart() { localStorage.setItem("selom-cart", JSON.stringify(state.cart)); renderCart(); }
function addToCart(productId) { const item = state.cart.find(line => line.productId === productId); if (item) item.quantity = Math.min(10, item.quantity + 1); else state.cart.push({ productId, quantity: 1 }); saveCart(); openCart(); }
function changeQuantity(productId, delta) { const item = state.cart.find(line => line.productId === productId); if (!item) return; item.quantity += delta; if (item.quantity <= 0) state.cart = state.cart.filter(line => line !== item); saveCart(); }
function renderCart() {
  const lines = state.cart.map(item => ({ ...item, product: state.products.find(product => product.id === item.productId) })).filter(item => item.product);
  $("#cart-count").textContent = lines.reduce((sum,line) => sum + line.quantity, 0);
  $("#cart-items").innerHTML = lines.length ? lines.map(line => `<article class="cart-line"><div class="cart-thumb" style="--accent:${line.product.accent}"></div><div><h4>${escapeHtml(line.product.name)}</h4><small>${money(line.product.price)}</small><div class="quantity"><button data-quantity="${line.productId}" data-delta="-1">−</button><b>${line.quantity}</b><button data-quantity="${line.productId}" data-delta="1">+</button></div></div><div><b>${money(line.product.price * line.quantity)}</b><button class="remove" data-remove="${line.productId}">Retirer</button></div></article>`).join("") : '<div class="empty-cart"><b>Votre panier est vide</b><p>Ajoutez un téléphone pour commencer.</p></div>';
  $("#cart-subtotal").textContent = money(lines.reduce((sum,line) => sum + line.product.price * line.quantity, 0));
  document.querySelectorAll("[data-quantity]").forEach(button => button.onclick = () => changeQuantity(Number(button.dataset.quantity), Number(button.dataset.delta)));
  document.querySelectorAll("[data-remove]").forEach(button => button.onclick = () => { state.cart = state.cart.filter(line => line.productId !== Number(button.dataset.remove)); saveCart(); });
}
function openCart(){ $("#cart-drawer").classList.add("open"); $("#drawer-overlay").classList.add("open"); $("#cart-drawer").setAttribute("aria-hidden","false"); }
function closeCart(){ $("#cart-drawer").classList.remove("open"); $("#drawer-overlay").classList.remove("open"); $("#cart-drawer").setAttribute("aria-hidden","true"); }

$("#search-input").addEventListener("input", event => { state.search = normalizeSearch(event.target.value); renderProducts(); });
$("#brand-filter").addEventListener("change", event => { state.brand = event.target.value; renderProducts(); });
$("#sort-filter").addEventListener("change", event => { state.sort = event.target.value; renderProducts(); });
document.querySelectorAll("[data-category]").forEach(button => button.onclick = () => { document.querySelectorAll("[data-category]").forEach(item => item.classList.remove("active")); button.classList.add("active"); state.category = button.dataset.category; renderProducts(); });
$("#cart-open").onclick = openCart; $("#cart-close").onclick = closeCart; $("#drawer-overlay").onclick = closeCart;
$("#search-toggle").onclick = () => { location.hash = "boutique"; $("#search-input").focus(); };
$("#checkout-open").onclick = () => { if (!state.cart.length) return; closeCart(); $("#checkout-dialog").showModal(); };
$("#checkout-close").onclick = () => $("#checkout-dialog").close();
$("#product-close").onclick = () => $("#product-dialog").close();
$("#checkout-form").addEventListener("submit", async event => {
  event.preventDefault(); const button = $("#order-submit"); const message = $("#form-message"); button.disabled = true; button.textContent = "Traitement en cours…"; message.textContent = "";
  const data = Object.fromEntries(new FormData(event.currentTarget));
  try {
    const response = await fetch("api/orders", { method:"POST", headers:{"content-type":"application/json"}, body:JSON.stringify({ ...data, items:state.cart }) });
    const result = await response.json(); if (!response.ok) throw new Error(result.error || "Commande impossible");
    state.cart = []; saveCart(); message.className = "form-message success"; message.textContent = `Commande ${result.order.reference} enregistrée.`;
    setTimeout(() => { if (result.paymentUrl) location.href = result.paymentUrl; else location.href = result.whatsappUrl; }, 900);
  } catch (error) { message.className = "form-message"; message.textContent = error.message; button.disabled = false; button.innerHTML = "Confirmer ma commande <span>→</span>"; }
});
$("#year").textContent = new Date().getFullYear();
loadProducts();
