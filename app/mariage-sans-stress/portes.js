import { Users, Armchair, UtensilsCrossed, MailOpen, ListMusic, ListChecks, Camera, UserPlus, MapPin } from 'lucide-react';

/* Portes d'entrée (16/11, demande de Myrio) : des pages qui captent une autre recherche que
   « dj mariage » — un outil pour organiser son mariage, un vidéaste, un photobooth — et montrent
   que tout est déjà compris avec le DJ. Chaque porte réutilise la page /mariage-sans-stress :
   seuls le haut de page, le bloc dédié et quelques questions changent (voir PorteSection.js).
   Une porte est une page indexée (demande de Myrio du 16/11) : à sa création, l'ajouter à
   app/sitemap.js, au pied de page (Footer.js) et à public/llms.txt, comme /organisation-mariage.

   Captures de l'application : écrans réels du compte de démonstration Camille Test (invités
   d'exemple), pris en 390 × 844 double densité (780 × 1688), comme /app-playlist-propositions.webp.

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
      titre: "Une seule application pour organiser votre mariage.",
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
          capture: { src: '/app-mariage-invites.webp', alt: "Application Myracoustic sur téléphone : 22 invités, 17 présents, 3 en attente, et le rappel automatique activé" },
        },
        {
          cle: 'plan-de-table', icone: Armchair, titre: 'Plan de table', court: 'Plan de table',
          texte: "Vous créez vos tables et placez chaque invité à sa place. Une alerte vous prévient si une table est trop pleine.",
          capture: { src: '/app-mariage-plan-de-table.webp', alt: "Application Myracoustic sur téléphone : plan de table avec la table d'honneur et quatre tables rondes, chaque invité à sa place" },
        },
        {
          cle: 'menu', icone: UtensilsCrossed, titre: 'Menu des invités', court: 'Menu',
          texte: "Chaque invité choisit son plat et signale ses allergies. Vous exportez un récapitulatif prêt pour votre traiteur.",
          capture: { src: '/app-mariage-menu.webp', alt: "Application Myracoustic sur téléphone : feuille pour le traiteur avec 29 couverts, les allergies et le total par plat" },
        },
        {
          cle: 'faire-part', icone: MailOpen, titre: 'Faire-part en ligne', court: 'Faire-part',
          texte: "Vous rédigez votre page d'invitation : horaires, accès, hébergement. Chaque invité la retrouve sur sa page personnelle.",
          capture: { src: '/app-mariage-faire-part.webp', alt: "Page d'invitation vue par un invité sur téléphone : message des mariés, réponse de présence et horaires de la journée" },
        },
        {
          cle: 'playlists', icone: ListMusic, titre: 'Playlists à deux', court: 'Playlists',
          texte: "Vous construisez vos playlists à votre rythme, en écoutant un extrait avant de choisir. Vos invités proposent leurs chansons : à vous d'accepter ou de refuser.",
          capture: { src: '/app-playlist-propositions.webp', alt: "Application Myracoustic sur téléphone : chansons proposées par les invités, à accepter ou refuser, au-dessus de la playlist de la soirée" },
        },
      ],
      // Contenu détaillé (16/11) : ce que cherche quelqu'un qui tape « application pour organiser son
      // mariage ». L'introduction se lit seule (définition), chaque bloc traite une question précise.
      details: {
        titre: "Organiser son mariage en ligne : tout ce que fait l'application",
        intro: "L'application Myracoustic est un espace en ligne pour préparer votre mariage : liste d'invités et réponses, plan de table, menu, faire-part, playlists et déroulé du jour J. Elle s'ouvre sur téléphone comme sur ordinateur, sans rien installer, et elle est comprise dans la prestation de votre DJ.",
        blocs: [
          { icone: Users, titre: "Liste d'invités et réponses en ligne",
            texte: "Vous ajoutez vos invités un par un. Avec une adresse e-mail, leur invitation personnelle part automatiquement ; sinon, vous partagez leur lien vous-même, par WhatsApp ou par SMS. Chacun indique s'il vient, avec combien d'adultes et d'enfants. Une relance automatique peut partir sept jours plus tard vers ceux qui n'ont pas répondu." },
          { icone: Armchair, titre: 'Plan de table',
            texte: "Vous créez vos tables, rondes, carrées ou rectangulaires, à leur taille réelle. Vos invités confirmés apparaissent tout seuls : vous placez chacun à sa place, en le faisant glisser ou en touchant un siège sur téléphone. Une alerte vous prévient si une table dépasse sa capacité, et le plan s'imprime." },
          { icone: UtensilsCrossed, titre: 'Menu, allergies et feuille pour le traiteur',
            texte: "Vous choisissez le service, à table ou en buffet. À table, chaque invité choisit ses plats. Vous pouvez aussi demander les allergies et les régimes, la boisson ou le nombre de parts de gâteau. Les réponses se comptent toutes seules, et vous imprimez une feuille prête pour votre traiteur." },
          { icone: MailOpen, titre: 'Faire-part en ligne et infos pratiques',
            texte: "Vous rédigez votre page d'invitation : un titre, un mot d'accueil, les horaires de la journée, l'adresse, l'accès, l'hébergement, le covoiturage. Un aperçu vous montre le rendu, et chaque invité retrouve ces informations sur sa page personnelle." },
          { icone: ListMusic, titre: 'Playlists de mariage, à deux et avec vos invités',
            texte: "Vous construisez vos playlists à votre rythme, en écoutant un extrait avant de choisir. Vos invités peuvent proposer leurs chansons : à vous d'accepter ou de refuser. Chaque playlist se rattache à un moment de la soirée." },
          { icone: ListChecks, titre: 'Déroulé du jour J, animations et surprises',
            texte: "Vous décrivez votre soirée moment par moment : vin d'honneur, dîner, soirée dansante. Vous y attachez la musique et les animations prévues, avec leurs consignes. Une animation ou une playlist peut rester une surprise pour l'un de vous deux." },
          { icone: Camera, titre: 'Photos des invités, par QR code',
            texte: "Le jour J, vos invités ajoutent leurs photos en scannant un QR code, sans créer de compte. Rien n'est visible pendant la fête : tout se révèle le lendemain, pour vous comme pour eux, à la manière d'un appareil photo jetable." },
          { icone: UserPlus, titre: 'Un accès pour vos proches et votre wedding planner',
            texte: "Vous avez chacun votre compte. Vous pouvez inviter vos témoins, votre famille, l'officiant de votre cérémonie laïque ou votre wedding planner : chacun a son propre accès." },
          { icone: MapPin, titre: 'Votre lieu, votre thème, vos couleurs',
            texte: "Vous indiquez votre lieu, ses contraintes techniques et quelques photos de la salle, ainsi que votre thème et vos couleurs. Nous adaptons le son et la lumière à votre univers." },
        ],
        // Liens vers les pages voisines du site (texte simple, ou lien quand `href` est présent).
        liens: [
          { t: 'Nous accompagnons les mariages à ' },
          { t: 'Nantes', href: '/dj-mariage-nantes' }, { t: ', ' },
          { t: 'Angers', href: '/dj-mariage-angers' }, { t: ', ' },
          { t: 'Rennes', href: '/dj-mariage-rennes' }, { t: ' et ' },
          { t: 'Saint-Nazaire', href: '/dj-mariage-saint-nazaire' },
          { t: '. À lire aussi : ' },
          { t: 'notre prestation de DJ pour votre mariage', href: '/mariage' }, { t: ' et ' },
          { t: 'les 7 questions à poser avant de choisir son DJ', href: '/guide-dj-mariage' }, { t: '.' },
        ],
      },
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
    // Questions propres à la porte : affichées en tête de la FAQ et déclarées à Google (page.js).
    faq: [
      { q: "L'application est-elle payante ?",
        a: "Non. Elle est comprise dans notre prestation, quelle que soit la formule choisie." },
      { q: "Faut-il télécharger une application ?",
        a: "Non. Elle s'ouvre dans le navigateur de votre téléphone, de votre tablette ou de votre ordinateur : il n'y a rien à installer." },
      { q: "Peut-on utiliser l'application sans réserver Myracoustic ?",
        a: "Non. Elle est réservée aux couples que nous accompagnons : elle fait partie de la prestation, avec le DJ, le son, la lumière et le film de votre soirée." },
      { q: "Quand notre accès est-il ouvert ?",
        a: "Dès la signature de votre devis. Vous recevez un lien par e-mail pour créer votre compte, puis vous invitez votre moitié et vos proches." },
      { q: "Nos invités doivent-ils créer un compte ?",
        a: "Non. Chaque invité reçoit un lien personnel : il répond à l'invitation, choisit son menu et propose ses chansons, sans rien installer." },
      { q: "Peut-on imprimer le plan de table et la feuille pour le traiteur ?",
        a: "Oui. Le plan de table s'imprime, et la feuille pour le traiteur reprend le nombre de couverts, le total par plat et les allergies." },
    ],
  },
};
