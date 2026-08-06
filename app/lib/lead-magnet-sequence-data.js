/* Contenu de la séquence de relance envoyée après le téléchargement du guide
   « 7 questions avant de choisir son DJ de mariage » (app/lib/run-lead-magnet-sequence.js).
   Chaque email doit se suffire à lui-même : la personne a pu tomber directement sur
   /guide-dj-mariage (recherche, partage) sans jamais voir /mariage — donc aucune
   référence à une page ou un contenu qu'elle n'a pas forcément vu. */
export const SEQUENCE_EMAILS = [
  {
    subject: 'Le bon moment pour réserver votre DJ de mariage',
    title: 'Le bon moment pour réserver',
    body: [
      "Une question revient souvent : « on a le temps, non ? » Pour la sonorisation et l'animation d'un mariage, la réponse dépend surtout de votre date. Les samedis de printemps et d'été partent les premiers, parfois plus d'un an à l'avance.",
      "En pratique, mieux vaut contacter les prestataires qui vous intéressent 6 à 12 mois avant votre mariage. Cela ne veut pas dire signer tout de suite — juste vérifier que votre date est encore disponible, et comprendre comment chacun travaille avant de vous décider.",
      "Si vous êtes déjà dans cette fenêtre, ce n'est pas un problème : contactez les prestataires qui vous plaisent et demandez-leur simplement si votre date est encore libre.",
    ],
  },
  {
    subject: "Cérémonie laïque : ce qu'il ne faut pas oublier côté son",
    title: "Cérémonie laïque : ce qu'il faut prévoir côté son",
    body: [
      "Quand on pense « DJ de mariage », on pense d'abord à la soirée dansante. Mais si vous prévoyez une cérémonie laïque, elle a ses propres besoins techniques — et ils sont parfois oubliés jusqu'au dernier moment.",
      "Concrètement : un micro sans fil pour l'officiant (et souvent pour vos témoins), une musique d'entrée et de sortie bien calée, et l'amplification des lectures si vos invités sont nombreux ou le lieu extérieur. Rien de compliqué en soi, mais ça demande d'y penser en amont, pas la veille.",
      "Bonne question à poser à un prestataire : est-ce que la sonorisation de la cérémonie est comprise dans sa prestation, ou faut-il l'organiser à part ? La réponse change parfois beaucoup l'organisation de votre journée.",
    ],
  },
  {
    subject: 'Construire votre playlist sans y passer des heures',
    title: 'Construire sa playlist sans stress',
    body: [
      "Beaucoup de couples redoutent cette étape : des heures à éplucher des playlists Spotify en se demandant si tel morceau va plaire à la famille ou vider la piste.",
      "Une méthode plus simple : listez d'abord vos incontournables (les morceaux que vous voulez à tout prix), puis les styles ou artistes à éviter, et enfin travaillez l'ouverture de bal en particulier — c'est souvent le moment le plus préparé de la soirée. Pour le reste, un bon DJ sait lire une piste et ajuster en direct — inutile de tout figer à l'avance.",
      "N'hésitez pas à demander à votre prestataire comment il travaille la playlist avec vous : certains improvisent entièrement, d'autres construisent une vraie base avec vous en amont. Les deux approches existent, à vous de savoir laquelle vous rassure.",
    ],
  },
  {
    subject: 'Faire en sorte que tous vos prestataires se parlent',
    title: 'Coordonner tous vos prestataires',
    body: [
      "Wedding planner, traiteur, photographe, vidéaste, DJ : un mariage rassemble souvent 4 à 6 prestataires différents le même jour, avec des horaires qui s'imbriquent (service, discours, ouverture de bal, coupure de gâteau...).",
      "Si personne ne communique entre ces prestataires, c'est vous qui devenez le chef d'orchestre — le jour même, en robe ou en costume, quand vous devriez justement penser à autre chose.",
      "C'est une question simple mais qui change beaucoup : votre prestataire a-t-il l'habitude de coordonner directement avec les autres corps de métier présents, ou attend-il que vous lui transmettiez tout ?",
    ],
  },
  {
    subject: 'Un mois avant : la checklist à valider avec votre prestataire',
    title: 'Le mois qui précède : la checklist finale',
    body: [
      "À l'approche du jour J, quelques points valent la peine d'être confirmés noir sur blanc avec votre prestataire, plutôt que de les supposer acquis.",
      "Le déroulé précis de la soirée (horaires des temps forts), la confirmation du matériel prévu selon le nombre d'invités et le lieu, et surtout : qui contacter et comment en cas d'imprévu le jour même. Un bon prestataire vous répond sans détour sur ces trois points.",
      "C'est le dernier email de cette série. Si une question vous trotte encore dans la tête sur votre mariage, écrivez-nous simplement — on se fera un plaisir d'y répondre, que vous travailliez avec nous ou pas.",
    ],
  },
];
