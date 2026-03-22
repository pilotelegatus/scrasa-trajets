# SCRASA — Compensations Trajets

Application web RH pour le calcul automatique des compensations de trajet.

---

## Stack technique

- **Next.js 14** — framework fullstack
- **Supabase** — base de données PostgreSQL + authentification
- **OpenRouteService** — calcul d'itinéraires (gratuit)
- **Leaflet** — carte interactive
- **jsPDF** — export PDF
- **Tailwind CSS** — styles

---

## Installation locale

### 1. Prérequis
- Node.js 18+
- Compte Supabase gratuit → https://supabase.com
- Clé ORS gratuite → https://openrouteservice.org/dev/#/signup

### 2. Installer les dépendances
```bash
npm install
```

### 3. Configurer les variables d'environnement
```bash
cp .env.local.example .env.local
```
Remplissez `.env.local` avec :
- `NEXT_PUBLIC_SUPABASE_URL` → Dashboard Supabase > Settings > API
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` → idem
- `SUPABASE_SERVICE_ROLE_KEY` → idem (secret, ne jamais exposer côté client)
- `NEXT_PUBLIC_ORS_API_KEY` → votre clé OpenRouteService

### 4. Initialiser la base de données
Dans le dashboard Supabase > SQL Editor, copiez et exécutez le contenu de :
```
supabase/migrations/001_init.sql
```

### 5. Créer le premier compte admin
Dans Supabase > Authentication > Users > Invite User, créez un utilisateur.
Puis dans SQL Editor :
```sql
UPDATE public.profiles SET role = 'admin' WHERE email = 'votre@email.ch';
```

### 6. Lancer en développement
```bash
npm run dev
```
→ http://localhost:3000

---

## Déploiement sur Vercel

```bash
npm install -g vercel
vercel
```
Ajoutez les variables d'environnement dans le dashboard Vercel.

## Déploiement sur Infomaniak (Node.js)

```bash
npm run build
npm start
```
Configurez les variables d'environnement dans le panneau Infomaniak.

---

## Structure du projet

```
scrasa-app/
├── app/
│   ├── login/          → Page de connexion
│   ├── dashboard/      → Tableau de bord
│   ├── compagnons/     → Liste + formulaire nouveau compagnon
│   ├── rapports/       → Historique mensuel + exports
│   ├── admin/          → Gestion comptes + barème
│   └── api/            → Routes API (création utilisateurs)
├── components/
│   ├── layout/         → Topbar navigation
│   └── ui/             → Composants réutilisables
├── lib/
│   ├── supabase/       → Clients Supabase (browser + server)
│   ├── ors.ts          → Calcul itinéraires OpenRouteService
│   ├── calcul.ts       → Logique de compensation
│   ├── pdf.ts          → Export PDF
│   └── types.ts        → Types TypeScript
└── supabase/
    └── migrations/     → Schéma SQL
```

---

## Rôles utilisateurs

| Rôle | Droits |
|---|---|
| **admin** | Tout — gestion comptes, validation mois, barème |
| **rh** | Saisie compagnons, consultation, export |

---

## Variables d'environnement complètes

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...   # Uniquement côté serveur
NEXT_PUBLIC_ORS_API_KEY=5b3ce3...  # Optionnel, fallback OSRM si absent
NEXT_PUBLIC_SITE_URL=https://trajets.scrasa.ch
```
