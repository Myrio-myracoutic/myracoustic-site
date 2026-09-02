-- Fige le contenu de la formule (specs/inclusions) au moment où une proposition est créée ou
-- modifiée par l'admin. Avant ce chantier, la page client (/proposition/[token]) et le devis
-- Qonto relisaient FORMULES en direct depuis app/lib/formules.js : toute modif du contenu d'un
-- pack (ex : ajout du Photobooth en Prestige, 02/09/2026) changeait rétroactivement ce qu'affichaient
-- les propositions déjà envoyées, pas encore validées par le client.
alter table public.devis_proposals add column if not exists formule_snapshot jsonb;

-- Rétro-remplissage des propositions existantes avec le contenu EXACT des formules tel qu'il
-- était avant la modification du 02/09/2026 (ajout Photobooth Prestige, retrait cérémonie
-- laïque + ajout étincelles froides incluses en Signature) — pour qu'elles n'affichent aucun
-- changement.
update public.devis_proposals set formule_snapshot = $snap$
{
  "key": "essentiel", "name": "Essentiel", "price": 1000, "featured": false,
  "accroche": "Une belle soirée dansante, faite avec exigence.",
  "specs": {
    "dj": "6h · heures supplémentaires en option",
    "son": "Adaptée au nombre d’invités",
    "lumiere": "Piste de danse",
    "video": null,
    "effets": "En option (fumée lourde, étincelles froides)",
    "ceremonie": "En option (cérémonie laïque, vin d’honneur)",
    "jourJ": "Installation & technicien inclus"
  },
  "platform": "Playlists collaboratives + programmation musicale du déroulé",
  "options": [
    { "key": "karaoke",       "label": "Karaoké & blind test",          "price": 100, "category": "animation" },
    { "key": "ceremonie",     "label": "Sonorisation cérémonie laïque", "price": 190, "category": "sonorisation" },
    { "key": "vin",           "label": "Sonorisation vin d’honneur",    "price": 120, "category": "sonorisation" },
    { "key": "reception",     "label": "Grande réception (150-300 pers.)", "price": 150, "category": "sonorisation" },
    { "key": "lumiere_salle", "label": "Mise en lumière de la salle",   "price": 50,  "category": "eclairage" },
    { "key": "videoproj",     "label": "Vidéoprojecteur / diaporama",   "price": 50,  "category": "video" },
    { "key": "murled2",       "label": "Mur LED 2 m²",                  "price": 300, "category": "video" },
    { "key": "murled4",       "label": "Mur LED 4 m²",                  "price": 600, "category": "video" },
    { "key": "fumee",         "label": "Machine à fumée lourde",        "price": 50,  "category": "effets", "note": "Danse dans les nuages — effet mariés" },
    { "key": "etincelles",    "label": "Machines à étincelles froides", "price": 100, "category": "effets", "note": "Lot de 2 machines" }
  ]
}
$snap$::jsonb
where formule = 'essentiel' and formule_snapshot is null;

update public.devis_proposals set formule_snapshot = $snap$
{
  "key": "signature", "name": "Signature", "price": 1500, "featured": true, "badge": "Le plus choisi",
  "accroche": "Votre soirée, jusque dans ses moindres émotions.",
  "specs": {
    "dj": "8h · heures supplémentaires en option",
    "son": "Adaptée au nombre d’invités",
    "lumiere": "Piste + mise en lumière de la salle",
    "video": "Vidéoprojecteur / diaporama inclus",
    "effets": "Fumée lourde incluse · étincelles en option",
    "ceremonie": "Cérémonie laïque + vin d’honneur inclus",
    "jourJ": "Installation & technicien inclus"
  },
  "platform": "Plateforme complète : invités & RSVP, menu, plan de table, faire-part + infos pratiques, accès collaborateurs",
  "options": [
    { "key": "karaoke",     "label": "Karaoké & blind test",          "price": 100, "category": "animation" },
    { "key": "reception",   "label": "Grande réception (150-300 pers.)", "price": 150, "category": "sonorisation" },
    { "key": "murled2",     "label": "Mur LED 2 m²",                  "price": 300, "category": "video" },
    { "key": "murled4",     "label": "Mur LED 4 m²",                  "price": 600, "category": "video" },
    { "key": "etincelles",  "label": "Machines à étincelles froides", "price": 100, "category": "effets", "note": "Lot de 2 machines" }
  ]
}
$snap$::jsonb
where formule = 'signature' and formule_snapshot is null;
