# SELOM SMART

Boutique e-commerce full-stack de téléphones pour Lomé : catalogue, panier, commandes WhatsApp, paiements CinetPay, administration, PostgreSQL et SEO.

## Fonctions

- catalogue responsive avec recherche, marques, catégories et tri ;
- panier persistant dans le navigateur ;
- commande avec livraison à Lomé ;
- redirection WhatsApp vers le +228 99 23 46 16 ;
- intégration CinetPay préparée pour Flooz, TMoney et Visa/Mastercard ;
- API REST sécurisée, validation Zod, limitation de débit et en-têtes Helmet ;
- espace administrateur pour consulter les commandes et ajouter des produits ;
- PostgreSQL en production, données de démonstration en local ;
- sitemap XML, robots.txt, données structurées Schema.org et balises sociales ;
- déploiement serverless Vercel, Dockerfile et configuration Render de secours.

## Lancer localement

```bash
npm install
cp .env.example .env
npm start
```

Ouvrez `http://localhost:3000`. L’administration est sur `http://localhost:3000/admin.html`.

Sans `DATABASE_URL`, l’application utilise un catalogue de démonstration en mémoire. Les commandes seront perdues au redémarrage : PostgreSQL est obligatoire en production.

## Base PostgreSQL

1. Créez une base PostgreSQL chez Neon, Supabase ou un autre hébergeur.
2. Exécutez le fichier `schema.sql` dans l’éditeur SQL.
3. Définissez `DATABASE_URL` et `DATABASE_SSL=true`.
4. Les produits peuvent ensuite être ajoutés depuis l’administration.

## Paiements réels

Créez et faites valider un compte marchand CinetPay. Ajoutez ensuite `CINETPAY_SITE_ID` et `CINETPAY_API_KEY` dans les variables privées de l’hébergeur. Ne placez jamais les clés dans GitHub ni dans le code frontend.

Tant que les clés ne sont pas configurées, Flooz, TMoney et Visa enregistrent la commande puis proposent une confirmation WhatsApp. Aucun prélèvement réel n’est effectué.

Avant la mise en production, complétez la vérification serveur de la notification CinetPay selon les identifiants et la procédure fournis au compte marchand.

## Déploiement principal sur Vercel

1. Publiez le projet dans un nouveau dépôt GitHub nommé `Selom-Smart`.
2. Créez un compte Vercel, cliquez sur **Add New > Project**, puis importez ce dépôt.
3. Gardez les réglages détectés automatiquement et cliquez sur **Deploy**.
4. Dans **Storage**, ajoutez une base PostgreSQL Neon, puis exécutez `schema.sql` dans l’éditeur SQL Neon.
5. Dans **Settings > Environment Variables**, ajoutez `DATABASE_URL`, `DATABASE_SSL=true`, `SITE_URL`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `JWT_SECRET` et `WHATSAPP_NUMBER=22899234616`.
6. Redéployez après l’ajout des variables, puis contrôlez `/api/health` et passez une commande test.

Le fichier `vercel.json` redirige les pages et les API vers l’application Express serverless. Le fichier `api/index.js` exporte l’application sans démarrer un serveur permanent, conformément au fonctionnement de Vercel.

Ne laissez pas l’application en mode mémoire sur Vercel : les fonctions serverless peuvent redémarrer et perdre les commandes. Une base Neon ou Supabase est indispensable.

## Hébergement alternatif sur Render

1. Publiez le projet dans un dépôt GitHub public ou privé.
2. Sur Render, choisissez **New > Blueprint** et sélectionnez le dépôt.
3. Renseignez les variables demandées par `render.yaml`.
4. Définissez `SITE_URL` avec l’URL finale, sans barre oblique terminale.
5. Vérifiez `/api/health`, passez une commande test, puis testez l’administration.

Le plan gratuit peut mettre le serveur en veille. Pour une boutique active, prévoyez ensuite un hébergement payant et un nom de domaine professionnel.

## Référencement Google

Après le déploiement :

1. remplacez l’URL canonique temporaire dans `public/index.html` par le domaine final ;
2. ajoutez le site à Google Search Console ;
3. envoyez `https://votre-domaine/sitemap.xml` ;
4. créez une fiche Google Business Profile avec l’adresse, les horaires et le téléphone ;
5. publiez des pages et descriptions originales pour chaque téléphone.

L’indexation n’est jamais instantanée ni garantie. Google doit explorer le site et évaluer la qualité du contenu.

## Sécurité avant vente

- changez immédiatement le mot de passe administrateur ;
- utilisez un `JWT_SECRET` aléatoire d’au moins 32 caractères ;
- activez la double authentification chez l’hébergeur, GitHub, CinetPay et le fournisseur de base ;
- réalisez une vraie commande de faible montant avant d’ouvrir la boutique ;
- ajoutez conditions de vente, politique de confidentialité, retours, garantie et mentions légales adaptées à l’activité.
