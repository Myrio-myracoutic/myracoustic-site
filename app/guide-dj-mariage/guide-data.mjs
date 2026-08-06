/* Contenu du guide « 7 questions à poser avant de choisir son DJ de mariage ».
   Utilisé à la fois par la page /guide-dj-mariage (aperçu des titres) et par le
   script de génération du PDF (scripts/generate-guide-pdf.js) — une seule source
   de vérité pour ne jamais désynchroniser les deux. */
export const GUIDE_TITLE = '7 questions à poser avant de choisir son DJ de mariage';
export const GUIDE_SUBTITLE = "Un guide gratuit pour vous aider à comparer les prestataires en toute clarté, sans jargon ni mauvaise surprise.";

export const GUIDE_QUESTIONS = [
  {
    n: 1,
    title: 'Qui sera présent le jour J ?',
    why: "Certaines agences vous font rencontrer un commercial, puis envoient un DJ que vous n'avez jamais vu ni entendu.",
    goodAnswer: "La personne qui anime votre soirée est celle avec qui vous échangez depuis le début — ou, à défaut, vous la rencontrez avant le jour J pour caler l'ambiance ensemble.",
  },
  {
    n: 2,
    title: 'Que se passe-t-il en cas de panne technique ?',
    why: "Un problème de matériel en pleine soirée peut arriver à n'importe qui — la vraie question est de savoir si le prestataire s'y est préparé.",
    goodAnswer: "Le matériel est testé avant l'arrivée des invités, et une solution de secours existe en cas d'imprévu — sans que cela se voie ni ne perturbe la soirée.",
  },
  {
    n: 3,
    title: 'La sonorisation de la cérémonie est-elle incluse ?',
    why: "Beaucoup de DJ ne gèrent que la soirée dansante — la cérémonie (micro pour l'officiant, musique d'entrée, lectures) est alors à organiser séparément, parfois dans l'urgence.",
    goodAnswer: "Le prestataire peut sonoriser la cérémonie comme la soirée, avec une seule équipe qui connaît déjà le déroulé de votre journée.",
  },
  {
    n: 4,
    title: 'Comment la playlist est-elle construite ?',
    why: "Un DJ qui improvise sans vous consulter peut très bien jouer une soirée réussie sur le papier, mais qui ne vous ressemble pas.",
    goodAnswer: "Vous construisez la playlist ensemble en amont — incontournables, styles à éviter, ouverture de bal préparée et répétée — et le DJ s'adapte ensuite en direct à la piste, sans s'enfermer dans une liste figée.",
  },
  {
    n: 5,
    title: "Qu'est-ce qui est vraiment inclus dans le prix ?",
    why: "Un devis bas mais avec beaucoup d'options en supplément (éclairage, installation, technicien, heures supplémentaires) peut finir plus cher qu'une offre complète dès le départ.",
    goodAnswer: "Le devis détaille clairement ce qui est inclus — matériel, installation et démontage, présence d'un technicien — et ce qui reste en option, sans ligne cachée.",
  },
  {
    n: 6,
    title: 'Le prestataire coordonne-t-il avec vos autres prestataires ?',
    why: "Wedding planner, traiteur, photographe, vidéaste : si personne ne communique entre eux, c'est à vous de tout orchestrer le jour où vous devriez justement penser à autre chose.",
    goodAnswer: "Le prestataire a l'habitude de coordonner les horaires et les transitions avec les autres corps de métier présents à votre mariage.",
  },
  {
    n: 7,
    title: "Quel est le délai pour réserver, et que couvre l'acompte ?",
    why: "Les meilleures dates partent parfois plus d'un an à l'avance — et un acompte flou peut cacher des conditions d'annulation désavantageuses.",
    goodAnswer: "Le prestataire vous indique clairement le délai recommandé pour votre date, et les conditions de l'acompte sont précisées noir sur blanc, sans avoir à les demander.",
  },
];

export const GUIDE_CREDIBILITY = "Myracoustic accompagne les mariages en Pays de la Loire depuis 26 ans — plus de 200 mariages animés, noté 5/5 sur Google. Ce guide reprend les questions que nous trouvons normal qu'on nous pose.";
