const productImages = ["iphone-15-pro.svg","galaxy-s24-ultra.svg","pixel-9.svg","redmi-note-14-pro.svg","tecno-camon-30.svg","infinix-note-40.svg","galaxy-a16.svg","itel-s25.svg"];

const seedProducts = [
  { id: 1, slug: "iphone-15-pro-256", name: "iPhone 15 Pro", brand: "Apple", category: "Premium", price: 720000, oldPrice: 765000, storage: "256 Go", ram: "8 Go", color: "Titane naturel", stock: 5, featured: true, badge: "Nouveau", description: "Écran Super Retina XDR, puce A17 Pro et système photo professionnel.", accent: "#c7c2b7" },
  { id: 2, slug: "samsung-galaxy-s24-ultra", name: "Galaxy S24 Ultra", brand: "Samsung", category: "Premium", price: 690000, oldPrice: 735000, storage: "256 Go", ram: "12 Go", color: "Noir titane", stock: 4, featured: true, badge: "Top vente", description: "Galaxy AI, S Pen intégré et appareil photo 200 Mpx.", accent: "#7c84a3" },
  { id: 3, slug: "google-pixel-9", name: "Google Pixel 9", brand: "Google", category: "Premium", price: 495000, oldPrice: 0, storage: "128 Go", ram: "12 Go", color: "Noir volcanique", stock: 3, featured: true, badge: "Photo", description: "Expérience Android pure, photo computationnelle et fonctions Gemini.", accent: "#4c5964" },
  { id: 4, slug: "redmi-note-14-pro", name: "Redmi Note 14 Pro", brand: "Xiaomi", category: "Milieu de gamme", price: 195000, oldPrice: 220000, storage: "256 Go", ram: "8 Go", color: "Bleu océan", stock: 9, featured: true, badge: "Promo", description: "Écran AMOLED fluide, grande autonomie et charge rapide.", accent: "#329ad6" },
  { id: 5, slug: "tecno-camon-30", name: "Tecno Camon 30", brand: "Tecno", category: "Milieu de gamme", price: 165000, oldPrice: 180000, storage: "256 Go", ram: "8 Go", color: "Vert émeraude", stock: 12, featured: false, badge: "Disponible", description: "Portrait précis, écran AMOLED 120 Hz et batterie longue durée.", accent: "#30a584" },
  { id: 6, slug: "infinix-note-40", name: "Infinix Note 40", brand: "Infinix", category: "Milieu de gamme", price: 145000, oldPrice: 0, storage: "256 Go", ram: "8 Go", color: "Or vintage", stock: 8, featured: false, badge: "Bon prix", description: "Charge All-Round FastCharge et écran AMOLED immersif.", accent: "#d7a63d" },
  { id: 7, slug: "samsung-galaxy-a16", name: "Samsung Galaxy A16", brand: "Samsung", category: "Accessible", price: 115000, oldPrice: 125000, storage: "128 Go", ram: "6 Go", color: "Gris", stock: 15, featured: false, badge: "Garantie", description: "Un smartphone fiable avec écran large et mises à jour prolongées.", accent: "#9ca6b2" },
  { id: 8, slug: "itel-s25", name: "itel S25", brand: "itel", category: "Accessible", price: 78000, oldPrice: 85000, storage: "128 Go", ram: "4 Go", color: "Bleu", stock: 20, featured: false, badge: "Petit prix", description: "Design fin, écran lumineux et autonomie adaptée au quotidien.", accent: "#346fdf" }
].map((product, index) => ({ ...product, imageUrl: `images/${productImages[index]}` }));

function normalizeProduct(row) {
  return {
    id: Number(row.id), slug: row.slug, name: row.name, brand: row.brand,
    category: row.category, price: Number(row.price), oldPrice: Number(row.old_price ?? row.oldPrice ?? 0),
    storage: row.storage, ram: row.ram, color: row.color, stock: Number(row.stock),
    featured: Boolean(row.featured), badge: row.badge, description: row.description,
    accent: row.accent || "#2f6bff", imageUrl: row.image_url || row.imageUrl || "", active: row.active !== false
  };
}

module.exports = { seedProducts, normalizeProduct };
