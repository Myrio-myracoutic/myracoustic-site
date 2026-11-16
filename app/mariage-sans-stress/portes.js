import { Users, Armchair, UtensilsCrossed, MailOpen, ListMusic } from 'lucide-react';

/* Portes d'entrée (16/11, demande de Myrio) : des pages qui captent une autre recherche que
   « dj mariage » — un outil pour organiser son mariage, un vidéaste, un photobooth — et montrent
   que tout est déjà compris avec le DJ. Chaque porte réutilise la page /mariage-sans-stress :
   seuls le haut de page, le bloc dédié et quelques questions changent (voir PorteSection.js).

   Règles de contenu : rien d'inventé. Chaque phrase vient de docs/plateforme-fonctionnement.md
   ou de lib/formules.js, et chaque capture est un écran réel de l'application.
   La clé d'une porte doit exister dans PORTES_LABELS (app/lib/lead-source.js) : c'est elle
   qui est notée sur la demande (« porte-<clé> »). */
export const PORTES = {
  organisation: {
    slug: 'organisation',
    suivi: 'porte_organisation', // préfixe des événements de clic (GA4)
    navLabel: "L'application",
    hero: {
      label: 'Organisation de mariage',
      titre: "Votre mariage s'organise dans une seule application.",
      sousTitre: "Invités, plan de table, menu, faire-part et playlists. Elle est comprise dans la prestation Myracoustic, avec le DJ, le son, la lumière et le film de votre soirée.",
    },
    section: {
      id: 'application',
      label: "L'application Myracoustic",
      titre: 'Tout ce qui se prépare avant le jour J, dans votre téléphone',
      intro: "Vous l'ouvrez à deux, sur téléphone ou sur ordinateur. Vos proches vous aident, vos invités répondent en ligne, et vous savez toujours où vous en êtes.",
      ecrans: [
        {
          cle: 'invites', icone: Users, titre: 'Invités et réponses', court: 'Invités',
          texte: "Vous ajoutez vos invités : leur invitation part par e-mail, ou par un lien à partager. Chacun répond en ligne, et une relance peut partir toute seule vers ceux qui n'ont pas répondu.",
          capture: { src: '/app-mariage-invites.webp', alt: "Application Myracoustic sur téléphone : liste des invités et suivi de leurs réponses" },
        },
        {
          cle: 'plan-de-table', icone: Armchair, titre: 'Plan de table', court: 'Plan de table',
          texte: "Vous créez vos tables et placez chaque invité à sa place. Une alerte vous prévient si une table est trop pleine.",
          capture: { src: '/app-mariage-plan-de-table.webp', alt: "Application Myracoustic sur téléphone : plan de table avec les invités placés" },
        },
        {
          cle: 'menu', icone: UtensilsCrossed, titre: 'Menu des invités', court: 'Menu',
          texte: "Chaque invité choisit son plat et signale ses allergies. Vous exportez un récapitulatif prêt pour votre traiteur.",
          capture: { src: '/app-mariage-menu.webp', alt: "Application Myracoustic sur téléphone : choix du menu par les invités" },
        },
        {
          cle: 'faire-part', icone: MailOpen, titre: 'Faire-part en ligne', court: 'Faire-part',
          texte: "Vous rédigez votre page d'invitation : horaires, accès, hébergement. Chaque invité la retrouve sur sa page personnelle.",
          capture: { src: '/app-mariage-faire-part.webp', alt: "Application Myracoustic sur téléphone : faire-part en ligne avec les infos pratiques" },
        },
        {
          cle: 'playlists', icone: ListMusic, titre: 'Playlists à deux', court: 'Playlists',
          texte: "Vous construisez vos playlists à votre rythme, en écoutant un extrait avant de choisir. Vos invités proposent leurs chansons : à vous d'accepter ou de refuser.",
          capture: { src: '/app-playlist-propositions.webp', alt: "Application Myracoustic sur téléphone : chansons proposées par les invités, à accepter ou refuser, au-dessus de la playlist de la soirée" },
        },
      ],
      pivot: {
        titre: 'Elle fait partie de la prestation, comme tout le reste',
        texte: "L'application n'est pas vendue seule : elle est ouverte aux couples que nous accompagnons, dès la signature. Avec elle, une seule équipe s'occupe de votre soirée.",
        inclus: [
          'DJ et animation de votre soirée',
          'Sonorisation adaptée à votre lieu',
          'Mise en lumière de la piste de danse',
          'Film souvenir de votre soirée, monté et offert sous un mois',
          "Application d'organisation, pour vous et vos proches",
        ],
      },
    },
    faq: [
      { q: "L'application est-elle payante ?",
        a: "Non. Elle est comprise dans notre prestation, quelle que soit la formule choisie." },
      { q: "Peut-on utiliser l'application sans réserver Myracoustic ?",
        a: "Non. Elle est réservée aux couples que nous accompagnons : votre accès est ouvert dès la signature de votre devis." },
      { q: "Nos invités doivent-ils créer un compte ?",
        a: "Non. Chaque invité reçoit un lien personnel : il répond à l'invitation, choisit son menu et propose ses chansons, sans rien installer." },
    ],
  },
};
