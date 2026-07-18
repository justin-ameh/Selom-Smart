CREATE TABLE IF NOT EXISTS products (
  id BIGSERIAL PRIMARY KEY, slug TEXT UNIQUE NOT NULL, name TEXT NOT NULL, brand TEXT NOT NULL,
  category TEXT NOT NULL, price INTEGER NOT NULL CHECK(price >= 0), old_price INTEGER DEFAULT 0,
  storage TEXT, ram TEXT, color TEXT, stock INTEGER DEFAULT 0 CHECK(stock >= 0), featured BOOLEAN DEFAULT false,
  badge TEXT, description TEXT, accent TEXT DEFAULT '#2f6bff', image_url TEXT, active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(), updated_at TIMESTAMPTZ DEFAULT now()
);
CREATE TABLE IF NOT EXISTS orders (
  id BIGSERIAL PRIMARY KEY, reference TEXT UNIQUE NOT NULL, customer_name TEXT NOT NULL, phone TEXT NOT NULL,
  email TEXT, city TEXT NOT NULL, address TEXT NOT NULL, payment_method TEXT NOT NULL, items JSONB NOT NULL,
  subtotal INTEGER NOT NULL, delivery_fee INTEGER NOT NULL, total INTEGER NOT NULL,
  status TEXT DEFAULT 'nouvelle', payment_status TEXT DEFAULT 'en_attente', created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_products_brand ON products(brand);
CREATE INDEX IF NOT EXISTS idx_orders_reference ON orders(reference);

INSERT INTO products(slug,name,brand,category,price,old_price,storage,ram,color,stock,featured,badge,description,accent,image_url,active) VALUES
('iphone-15-pro-256','iPhone 15 Pro','Apple','Premium',720000,765000,'256 Go','8 Go','Titane naturel',5,true,'Nouveau','Écran Super Retina XDR, puce A17 Pro et système photo professionnel.','#c7c2b7','images/iphone-15-pro.svg',true),
('samsung-galaxy-s24-ultra','Galaxy S24 Ultra','Samsung','Premium',690000,735000,'256 Go','12 Go','Noir titane',4,true,'Top vente','Galaxy AI, S Pen intégré et appareil photo 200 Mpx.','#7c84a3','images/galaxy-s24-ultra.svg',true),
('google-pixel-9','Google Pixel 9','Google','Premium',495000,0,'128 Go','12 Go','Noir volcanique',3,true,'Photo','Expérience Android pure, photo computationnelle et fonctions Gemini.','#4c5964','images/pixel-9.svg',true),
('redmi-note-14-pro','Redmi Note 14 Pro','Xiaomi','Milieu de gamme',195000,220000,'256 Go','8 Go','Bleu océan',9,true,'Promo','Écran AMOLED fluide, grande autonomie et charge rapide.','#329ad6','images/redmi-note-14-pro.svg',true),
('tecno-camon-30','Tecno Camon 30','Tecno','Milieu de gamme',165000,180000,'256 Go','8 Go','Vert émeraude',12,false,'Disponible','Portrait précis, écran AMOLED 120 Hz et batterie longue durée.','#30a584','images/tecno-camon-30.svg',true),
('infinix-note-40','Infinix Note 40','Infinix','Milieu de gamme',145000,0,'256 Go','8 Go','Or vintage',8,false,'Bon prix','Charge All-Round FastCharge et écran AMOLED immersif.','#d7a63d','images/infinix-note-40.svg',true),
('samsung-galaxy-a16','Samsung Galaxy A16','Samsung','Accessible',115000,125000,'128 Go','6 Go','Gris',15,false,'Garantie','Un smartphone fiable avec écran large et mises à jour prolongées.','#9ca6b2','images/galaxy-a16.svg',true),
('itel-s25','itel S25','itel','Accessible',78000,85000,'128 Go','4 Go','Bleu',20,false,'Petit prix','Design fin, écran lumineux et autonomie adaptée au quotidien.','#346fdf','images/itel-s25.svg',true)
ON CONFLICT (slug) DO NOTHING;
