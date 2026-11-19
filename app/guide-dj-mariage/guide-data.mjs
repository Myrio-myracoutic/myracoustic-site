/* Contenu du guide « 7 questions à poser avant de choisir son DJ de mariage ».
   Utilisé à la fois par la page /guide-dj-mariage (article complet signé Myrio depuis le 19/11)
   et par le script de génération du PDF (scripts/generate-guide-pdf.js) — une seule source
   de vérité pour ne jamais désynchroniser les deux. Le PDF n'utilise pas `chezNous` ni ARTICLE.
   `chezNous` : uniquement des faits déjà validés ailleurs sur le site (formules.js,
   MariageBlocs.js, FAQ mariage) — rien d'inventé, aucun prix. */
export const GUIDE_TITLE = '7 questions à poser avant de choisir son DJ de mariage';
export const GUIDE_SUBTITLE = "Un guide gratuit pour vous aider à comparer les prestataires en toute clarté, sans jargon ni mauvaise surprise.";

export const GUIDE_QUESTIONS = [
  {
    n: 1,
    title: 'Qui sera présent le jour J ?',
    why: "Certaines agences vous font rencontrer un commercial, puis envoient un DJ que vous n'avez jamais vu ni entendu.",
    goodAnswer: "La personne qui anime votre soirée est celle avec qui vous échangez depuis le début — ou, à défaut, vous la rencontrez avant le jour J pour caler l'ambiance ensemble.",
    chezNous: "C'est moi qui vous réponds au premier appel, qui prépare la soirée avec vous et qui l'anime le jour J. Virginie, mon épouse, s'occupe de la vidéo et de la technique. Pas de commercial entre nous, pas de DJ inconnu envoyé à ma place.",
  },
  {
    n: 2,
    title: 'Que se passe-t-il en cas de panne technique ?',
    why: "Un problème de matériel en pleine soirée peut arriver à n'importe qui — la vraie question est de savoir si le prestataire s'y est préparé.",
    goodAnswer: "Le matériel est testé avant l'arrivée des invités, et une solution de secours existe en cas d'imprévu — sans que cela se voie ni ne perturbe la soirée.",
    chezNous: "Nous venons avec du matériel professionnel et un plan de secours, et un technicien reste présent du début à la fin de la soirée. Si quelque chose lâche, on le gère. Notre engagement en cas d'imprévu de notre fait est écrit dans nos conditions générales.",
  },
  {
    n: 3,
    title: 'La sonorisation de la cérémonie est-elle incluse ?',
    why: "Beaucoup de DJ ne gèrent que la soirée dansante — la cérémonie (micro pour l'officiant, musique d'entrée, lectures) est alors à organiser séparément, parfois dans l'urgence.",
    goodAnswer: "Le prestataire peut sonoriser la cérémonie comme la soirée, avec une seule équipe qui connaît déjà le déroulé de votre journée.",
    chezNous: "Nous sonorisons la cérémonie, laïque, religieuse ou symbolique, en salle comme en plein air : micro sans fil pour l'officiant, musiques d'entrée et de sortie, lectures. Elle est comprise dans la formule Mariage d'Exception ; dans les deux autres formules, la cérémonie laïque est proposée en option. C'est écrit dans votre proposition.",
  },
  {
    n: 4,
    title: 'Comment la playlist est-elle construite ?',
    why: "Un DJ qui improvise sans vous consulter peut très bien jouer une soirée réussie sur le papier, mais qui ne vous ressemble pas.",
    goodAnswer: "Vous construisez la playlist ensemble en amont — incontournables, styles à éviter, ouverture de bal préparée et répétée — et le DJ s'adapte ensuite en direct à la piste, sans s'enfermer dans une liste figée.",
    chezNous: "Dans votre application Myracoustic, vous construisez vos playlists à deux, à votre rythme, en écoutant un extrait avant de choisir. Vos invités proposent leurs chansons, et c'est vous qui acceptez ou refusez. Le jour J, je lis la salle et j'adapte la musique pour que la piste reste pleine, des grands-parents aux copains.",
  },
  {
    n: 5,
    title: "Qu'est-ce qui est vraiment inclus dans le prix ?",
    why: "Un devis bas mais avec beaucoup d'options en supplément (éclairage, installation, technicien, heures supplémentaires) peut finir plus cher qu'une offre complète dès le départ.",
    goodAnswer: "Le devis détaille clairement ce qui est inclus — matériel, installation et démontage, présence d'un technicien — et ce qui reste en option, sans ligne cachée.",
    chezNous: "Toutes nos formules comprennent le DJ, une sonorisation adaptée au nombre d'invités, l'éclairage de la piste, la fumée lourde et les étincelles froides, l'installation et le démontage, un technicien, la captation de la soirée, le film souvenir monté et offert sous un mois, et l'application. Après un premier échange téléphonique, vous recevez une proposition détaillée : ce qui est compris et ce qui est en option y est écrit noir sur blanc.",
  },
  {
    n: 6,
    title: 'Le prestataire coordonne-t-il avec vos autres prestataires ?',
    why: "Wedding planner, traiteur, photographe, vidéaste : si personne ne communique entre eux, c'est à vous de tout orchestrer le jour où vous devriez justement penser à autre chose.",
    goodAnswer: "Le prestataire a l'habitude de coordonner les horaires et les transitions avec les autres corps de métier présents à votre mariage.",
    chezNous: "Vous avez un seul interlocuteur pour le son, la lumière, le DJ et la vidéo : vous n'avez plus à coordonner ces métiers entre eux. Nous suivons votre déroulé, du vin d'honneur au repas, aux discours et à l'ouverture de bal, sans temps mort, et nous calons les horaires avec votre traiteur ou votre wedding planner.",
  },
  {
    n: 7,
    title: "Quel est le délai pour réserver, et que couvre l'acompte ?",
    why: "Les meilleures dates partent parfois plus d'un an à l'avance — et un acompte flou peut cacher des conditions d'annulation désavantageuses.",
    goodAnswer: "Le prestataire vous indique clairement le délai recommandé pour votre date, et les conditions de l'acompte sont précisées noir sur blanc, sans avoir à les demander.",
    chezNous: "Nous vous conseillons de nous contacter 12 à 18 mois avant votre mariage, mais n'hésitez pas pour une date plus proche : nous faisons notre possible. Dès réception de l'acompte, votre date est bloquée et nous ne la proposons plus à personne d'autre. Le montant et les conditions de l'acompte figurent dans votre proposition et dans nos conditions générales, à lire avant de signer.",
  },
];

export const GUIDE_CREDIBILITY = "Myracoustic accompagne les mariages en Pays de la Loire depuis 26 ans — plus de 200 mariages animés, noté 5/5 sur Google. Ce guide reprend les questions que nous trouvons normal qu'on nous pose.";

/* Article en ligne (/guide-dj-mariage), signé Myrio. */
export const ARTICLE = {
  auteur: 'Myrio',
  fonction: 'DJ et fondateur de Myracoustic',
  publie: '2026-11-19',
  modifie: '2026-11-19',
  intro: "Je suis Myrio, DJ depuis 26 ans et fondateur de Myracoustic. Avec Virginie, mon épouse, nous avons animé plus de 200 mariages. Avant de signer avec un DJ, ces 7 questions vous évitent la plupart des mauvaises surprises. Posez-les à chaque prestataire que vous rencontrez, nous compris : un bon DJ y répond sans hésiter.",
  conclusion: "Ces questions, nous trouvons normal qu'on nous les pose. Si vous voulez en parler pour votre mariage, commencez par vérifier que votre date est libre : je vous rappelle ensuite pour faire connaissance et comprendre ce que vous imaginez.",
  // Vrai avis Google (juillet 2026), déjà affiché sur /mariage. Extrait fidèle, coupé avant la fin.
  temoignage: {
    texte: "Un immense merci à Myrio et sa femme Virginie qui nous ont clairement sauvé notre mariage. 2 semaines avant notre DJ initial nous a informé qu'il ne s'assurerait pas la prestation (pour des raisons de santé) et Myrio a été incroyable et rassurant. 2 semaines pour se caler avec nous et l'animation a été parfaite.",
    auteur: 'Carine et Sébastien',
    source: 'Avis Google',
    date: 'Juillet 2026',
  },
};
