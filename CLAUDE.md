@AGENTS.md

# site/ — l'application Myracoustic

Next.js 16 App Router, JavaScript SANS TypeScript, React 19, Supabase, hébergé sur Vercel.

## Commandes
`npm run dev` · `npm run build` (obligatoire avant tout push) · `npm run lint`

## Zones
- `app/(devis)/` tunnel de devis · `app/mon-espace/` espace client · `app/admin/` back-office
- `app/api/` routes serveur (Qonto, Google Calendar, musique, crons)
- `app/components/` composants partagés — réutiliser avant d'en créer un nouveau
- `supabase-migrations/` — toute modif de schéma = fichier SQL daté ici (AAAA-MM-JJ_nom.sql)

## Pièges connus (chacun a déjà coûté une session)
- Apostrophe française « ' » dans une string à guillemets simples → casse le build Vercel.
- Nouvelle table Supabase exposée au client : la policy RLS ne suffit PAS —
  `GRANT` à `authenticated` obligatoire.
- Menu/dropdown en `position:fixed` → à rendre dans `document.body` via `createPortal`,
  sinon il sort de l'écran dans les longues listes.
- Jamais de hook dans un `.map()`, jamais de composant défini dans le render du parent
  (crashs silencieux) : les étapes de `DevisFlow` sont des fonctions de rendu, l'état vit dans le parent.
- Liens Qonto côté client : PDF devis = attachment S3 (valide 30 min), facture = pay.qonto.com.
  Jamais portal.qonto.com (portail privé).

## Conventions
- Couleurs uniquement via les variables de `app/globals.css`
  (`--bg #0d1b2a`, `--lime #b8ef0b`, `--indigo-vif #4245b8` réservé au B2B) — jamais en dur.
- Fonts : Space Grotesk (titres), Hanken Grotesk (texte).
- Page publique = page serveur (metadata dédiées : title, description, OG, canonical)
  + composant client `XxxClient.js` + entrée dans `app/sitemap.js`.
