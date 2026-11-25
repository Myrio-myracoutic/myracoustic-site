import CookiePrefsButtonInline from '../components/CookiePrefsButtonInline';

export const metadata = {
  title: "Politique de confidentialité — Myracoustic",
  description: "Comment Myracoustic collecte, utilise et protège vos données : demandes, assistante Aria, cookies, prestataires, durées et droits.",
};

const SECTIONS = [
  {
    title: '1. Responsable du traitement',
    body: (
      <>
        <p style={{ marginBottom: 10 }}>
          Le responsable du traitement est Myracoustic (SASU) – Capital social : 1 000 €, siège social : 4 bis,
          La Haute Cosnière, 44390 Nort-sur-Erdre, France. Email (RGPD) :{' '}
          <a href="mailto:contact@myracoustic.com" style={{ color: 'var(--lime)' }}>contact@myracoustic.com</a>.
        </p>
        <p>
          Le site utilise des outils de mesure d’audience et de publicité. Ceux qui déposent des cookies ne le font
          qu’avec votre accord, donné dans la bannière cookies (voir la section 4).
        </p>
      </>
    ),
  },
  {
    title: '2. Données collectées via les formulaires',
    body: (
      <>
        <p style={{ marginBottom: 10 }}>
          Lorsque vous faites une demande (mariage, entreprise ou particulier), nous collectons :
        </p>
        <ul style={{ margin: '0 0 10px', paddingLeft: 20 }}>
          <li style={{ marginBottom: 6 }}>
            <strong>Vos coordonnées :</strong> nom, prénom, adresse e-mail et numéro de téléphone ; pour les
            professionnels, le nom et le type de votre structure, et votre fonction si vous l’indiquez.
          </li>
          <li style={{ marginBottom: 6 }}>
            <strong>Votre événement :</strong> date, lieu, nombre d’invités ou de participants, type d’événement,
            besoins, budget envisagé (professionnels) et votre message.
          </li>
          <li style={{ marginBottom: 6 }}>
            <strong>Votre rendez-vous :</strong> le créneau que vous choisissez, par téléphone ou en visio, et pour
            une visio le lien de la salle.
          </li>
          <li>
            <strong>L’origine de votre demande :</strong> la façon dont vous nous avez connus et, si vous arrivez par
            une publicité, sa provenance (identifiant du clic, campagne), gardée dans votre navigateur jusqu’à l’envoi
            de votre demande.
          </li>
        </ul>
        <p>
          Des données techniques (adresse IP, journaux du serveur) sont aussi traitées pour la sécurité et le bon
          fonctionnement du site.
        </p>
      </>
    ),
  },
  {
    title: '3. Aria, l’assistante virtuelle du site',
    body: (
      <>
        <p style={{ marginBottom: 10 }}>
          Le site propose une assistante virtuelle, Aria, qui répond à vos questions sur nos prestations et peut
          vérifier si une date est libre dans notre agenda. Aria est une intelligence artificielle : ses réponses
          sont générées automatiquement et peuvent comporter des erreurs. Elle ne remplace pas l’échange avec Myrio.
        </p>
        <ul style={{ margin: '0 0 10px', paddingLeft: 20 }}>
          <li style={{ marginBottom: 6 }}>
            <strong>Données traitées :</strong> les messages que vous écrivez à Aria et ses réponses, la page du site depuis laquelle
            vous l’utilisez, les dates que vous lui demandez de vérifier, la date et l’heure des échanges. Pour
            limiter les abus, une empreinte technique est calculée de façon irréversible à partir de votre adresse IP
            et de votre navigateur : votre adresse IP elle-même n’est pas conservée.
          </li>
          <li style={{ marginBottom: 6 }}>
            <strong>Aria ne vous demande jamais vos coordonnées.</strong> Évitez d’y écrire des informations personnelles (téléphone,
            adresse, santé…) : pour être recontacté, utilisez le formulaire de demande.
          </li>
          <li style={{ marginBottom: 6 }}>
            <strong>Finalités :</strong> répondre à vos questions, vérifier une date, vous orienter vers une demande de rendez-vous,
            améliorer les réponses d’Aria (les conversations peuvent être relues par Myracoustic) et prévenir les abus.
          </li>
          <li style={{ marginBottom: 6 }}>
            <strong>Base légale :</strong> l’intérêt légitime de Myracoustic à répondre aux visiteurs qui utilisent Aria et à améliorer
            ce service, et, lorsque vous préparez une demande, les mesures précontractuelles prises à votre demande.
          </li>
          <li style={{ marginBottom: 6 }}>
            <strong>Prestataire :</strong> pour générer les réponses, vos messages sont transmis à Anthropic (société établie aux
            États-Unis, éditrice des modèles d’intelligence artificielle Claude), qui agit comme sous-traitant.
            Anthropic n’utilise pas ces échanges pour entraîner ses modèles. Elle les supprime automatiquement de ses
            serveurs sous 30 jours, sauf s’ils sont signalés par ses systèmes de sécurité (conservation possible
            jusqu’à 2 ans) ou si la loi l’impose. Ce transfert vers les États-Unis est encadré par les clauses
            contractuelles types de la Commission européenne.
          </li>
          <li style={{ marginBottom: 6 }}>
            <strong>Conservation chez Myracoustic :</strong> les conversations sont enregistrées dans notre base de données, hébergée
            dans l’Union européenne (Irlande), puis supprimées automatiquement au bout de 180 jours.
          </li>
          <li>
            <strong>Mesure d’audience :</strong> selon vos choix dans la bannière cookies, l’affichage de l’invitation d’Aria, son ouverture et le clic sur
            « Prendre rendez-vous » sont comptés dans nos statistiques. Le contenu de vos messages n’y figure jamais.
          </li>
        </ul>
        <p>
          Pour consulter ou faire supprimer une conversation, écrivez à{' '}
          <a href="mailto:contact@myracoustic.com" style={{ color: 'var(--lime)' }}>contact@myracoustic.com</a>{' '}
          en indiquant sa date et son sujet : Aria ne connaît pas votre identité.
        </p>
      </>
    ),
  },
  {
    title: '4. Cookies, mesure d’audience et publicité',
    body: (
      <>
        <p style={{ marginBottom: 10 }}>Le site utilise les outils suivants :</p>
        <ul style={{ margin: '0 0 10px', paddingLeft: 20 }}>
          <li style={{ marginBottom: 6 }}>
            <strong>Google Analytics (GA4) :</strong> fréquentation du site et parcours dans les formulaires de demande.
          </li>
          <li style={{ marginBottom: 6 }}>
            <strong>Microsoft Clarity :</strong> manière dont les pages sont utilisées (clics, défilement), pour les
            améliorer.
          </li>
          <li style={{ marginBottom: 6 }}>
            <strong>Vercel Speed Insights :</strong> mesure technique de la vitesse d’affichage des pages.
          </li>
          <li style={{ marginBottom: 6 }}>
            <strong>Google Ads :</strong> mesure des demandes issues de nos annonces et reciblage publicitaire. Si vous
            l’acceptez, à l’envoi d’une demande, vos coordonnées (e-mail, téléphone, nom, prénom) sont transmises à
            Google sous forme hachée (procédé irréversible), jamais en clair.
          </li>
          <li style={{ marginBottom: 6 }}>
            <strong>Meta (Facebook, Instagram) :</strong> mesure des demandes issues de nos publicités, audiences et
            reciblage publicitaire.
          </li>
          <li>
            <strong>OpenAI (publicités ChatGPT) :</strong> mesure des demandes issues de nos publicités.
          </li>
        </ul>
        <p>
          Tant que vous n’avez pas accepté les cookies, ou si vous les refusez, Google Analytics, Google Ads et
          Microsoft Clarity fonctionnent sans déposer de cookie ni vous attribuer d’identifiant, et les outils de Meta
          et d’OpenAI ne sont pas chargés. Ces deux derniers ne le sont jamais sur les pages personnelles (liens de
          proposition, de rendez-vous ou d’invitation).
        </p>
      </>
    ),
  },
  {
    title: '5. Finalités',
    body: (
      <ul style={{ margin: 0, paddingLeft: 20 }}>
        <li style={{ marginBottom: 6 }}>Répondre à votre demande, organiser l’appel que vous avez réservé et vous adresser une proposition</li>
        <li style={{ marginBottom: 6 }}>Répondre à vos questions avec l’assistante Aria (voir la section 3)</li>
        <li style={{ marginBottom: 6 }}>Mesurer la fréquentation du site et l’améliorer</li>
        <li style={{ marginBottom: 6 }}>Mesurer l’efficacité de nos publicités</li>
        <li style={{ marginBottom: 6 }}>Créer des audiences et proposer du reciblage publicitaire (si vous l’acceptez)</li>
        <li>Assurer la sécurité du site et prévenir la fraude</li>
      </ul>
    ),
  },
  {
    title: '6. Base légale (RGPD)',
    body: (
      <ul style={{ margin: 0, paddingLeft: 20 }}>
        <li style={{ marginBottom: 6 }}><strong>Mesures précontractuelles :</strong> traitement de votre demande, de votre rendez-vous et de notre proposition</li>
        <li style={{ marginBottom: 6 }}><strong>Intérêt légitime :</strong> sécurité et bon fonctionnement du site, assistante Aria (voir la section 3)</li>
        <li style={{ marginBottom: 6 }}><strong>Consentement :</strong> cookies de mesure d’audience et de publicité, reciblage, transmission de vos coordonnées hachées à Google</li>
        <li><strong>Obligation légale :</strong> conservation des devis et des factures</li>
      </ul>
    ),
  },
  {
    title: '7. Destinataires et sous-traitants',
    body: (
      <>
        <p style={{ marginBottom: 10 }}>
          Vos données sont traitées par Myracoustic. Les prestataires suivants y ont accès, uniquement pour les
          besoins indiqués :
        </p>
        <ul style={{ margin: 0, paddingLeft: 20 }}>
          <li style={{ marginBottom: 6 }}>Hébergement du site et de l’espace client : Vercel</li>
          <li style={{ marginBottom: 6 }}>Base de données : Supabase (serveurs dans l’Union européenne, en Irlande)</li>
          <li style={{ marginBottom: 6 }}>E-mails envoyés par le site : Brevo</li>
          <li style={{ marginBottom: 6 }}>Messagerie, agenda des rendez-vous et visio (Google Meet) : Google (Google Workspace)</li>
          <li style={{ marginBottom: 6 }}>Saisie automatique des adresses : Mapbox</li>
          <li style={{ marginBottom: 6 }}>Recherche de votre entreprise (professionnels) : annuaire des entreprises de l’État</li>
          <li style={{ marginBottom: 6 }}>Devis, factures et paiements : Qonto et Mollie</li>
          <li style={{ marginBottom: 6 }}>Assistante virtuelle Aria : Anthropic (voir la section 3)</li>
          <li style={{ marginBottom: 6 }}>Mesure d’audience : Google (Analytics), Microsoft (Clarity), Vercel (Speed Insights)</li>
          <li>Publicité : Google, Meta, OpenAI (selon votre choix dans la bannière cookies)</li>
        </ul>
      </>
    ),
  },
  {
    title: '8. Transferts hors Union européenne',
    body: (
      <p>
        Certains prestataires sont établis aux États-Unis ou peuvent y traiter des données : Vercel, Google,
        Microsoft, Meta, OpenAI, Mapbox et Anthropic. Ces transferts s’appuient sur des garanties reconnues par
        l’Union européenne : clauses contractuelles types de la Commission européenne ou certification « Data
        Privacy Framework », selon le prestataire.
      </p>
    ),
  },
  {
    title: '9. Durées de conservation',
    body: (
      <ul style={{ margin: 0, paddingLeft: 20 }}>
        <li style={{ marginBottom: 6 }}>Demandes envoyées par les formulaires : jusqu’à 3 ans après le dernier échange</li>
        <li style={{ marginBottom: 6 }}>Conversations avec l’assistante Aria : 180 jours, puis suppression automatique</li>
        <li style={{ marginBottom: 6 }}>Devis et factures : durées légales (10 ans pour les pièces comptables)</li>
        <li style={{ marginBottom: 6 }}>Votre choix dans la bannière cookies : 6 mois</li>
        <li style={{ marginBottom: 6 }}>Cookies de mesure d’audience et de publicité : 13 mois au plus</li>
        <li>Journaux techniques : durée limitée, proportionnée aux besoins de sécurité</li>
      </ul>
    ),
  },
  {
    title: '10. Vos droits',
    body: (
      <>
        <p style={{ marginBottom: 10 }}>Vous disposez des droits suivants sur vos données personnelles :</p>
        <ul style={{ margin: '0 0 10px', paddingLeft: 20 }}>
          <li style={{ marginBottom: 6 }}>Accès, rectification, effacement</li>
          <li style={{ marginBottom: 6 }}>Opposition et limitation du traitement</li>
          <li style={{ marginBottom: 6 }}>Portabilité (dans certains cas)</li>
          <li>Retrait du consentement (cookies / traceurs) à tout moment</li>
        </ul>
        <p>
          Pour exercer ces droits, écrivez-nous à{' '}
          <a href="mailto:contact@myracoustic.com" style={{ color: 'var(--lime)' }}>contact@myracoustic.com</a>.
        </p>
      </>
    ),
  },
  {
    title: '11. Gestion des cookies',
    body: (
      <>
        <p style={{ marginBottom: 10 }}>
          Vous pouvez modifier votre choix à tout moment avec le bouton ci-dessous, ou avec le lien « Préférences
          cookies » en bas de chaque page. Vous pouvez aussi gérer les cookies dans les réglages de votre navigateur,
          et vos préférences publicitaires chez chaque régie :
        </p>
        <ul style={{ margin: '0 0 16px', paddingLeft: 20 }}>
          <li style={{ marginBottom: 6 }}>Google : paramètres de publicité de votre compte Google</li>
          <li style={{ marginBottom: 6 }}>Meta : paramètres de publicité Facebook / Instagram</li>
          <li>OpenAI : paramètres de publicité de votre compte ChatGPT</li>
        </ul>
        <CookiePrefsButtonInline />
      </>
    ),
  },
  {
    title: '12. Sécurité',
    body: (
      <p>
        Myracoustic met en œuvre des mesures raisonnables pour protéger vos données (mises à jour, limitation des
        accès, choix d'un hébergement sécurisé). Aucune transmission sur Internet n'étant totalement sécurisée,
        une sécurité absolue ne peut toutefois être garantie.
      </p>
    ),
  },
  {
    title: '13. Réclamation',
    body: (
      <p>
        Si vous estimez, après nous avoir contactés, que vos droits ne sont pas respectés, vous pouvez introduire
        une réclamation auprès de la CNIL (Commission Nationale de l'Informatique et des Libertés). Contact RGPD
        Myracoustic : <a href="mailto:contact@myracoustic.com" style={{ color: 'var(--lime)' }}>contact@myracoustic.com</a>.
      </p>
    ),
  },
];

export default function PolitiqueConfidentialitePage() {
  return (
    <div style={{ padding: '120px 24px 96px' }}>
      <div style={{ maxWidth: 760, margin: '0 auto' }}>
        <h1 style={{
          fontFamily: 'var(--font-display), sans-serif', fontWeight: 700,
          fontSize: 'clamp(28px,4vw,44px)', marginBottom: 12,
        }}>
          Politique de confidentialité
        </h1>
        <p style={{ color: 'var(--text-light)', fontSize: 14, marginBottom: 8 }}>Mise à jour le 22 novembre 2026.</p>
        <p style={{ color: 'var(--text-light)', fontSize: 14, marginBottom: 48 }}>
          Cette politique explique comment Myracoustic collecte, utilise et protège vos données personnelles
          lorsque vous visitez ce site, utilisez nos formulaires de contact et de devis, ou discutez avec
          notre assistante virtuelle Aria. Votre espace client (app.myracoustic.com) et les pages d’invitation
          ont leur propre politique :{' '}
          <a href="https://app.myracoustic.com/confidentialite" style={{ color: 'var(--lime)' }}>la consulter</a>.
        </p>

        {SECTIONS.map(({ title, body }) => (
          <section key={title} style={{ marginBottom: 36 }}>
            <h2 style={{
              fontFamily: 'var(--font-display), sans-serif', fontWeight: 700,
              fontSize: 'clamp(18px,2.4vw,22px)', color: 'var(--lime)', marginBottom: 12,
            }}>
              {title}
            </h2>
            <div style={{ color: 'var(--text-muted)', fontSize: 15, lineHeight: 1.75 }}>
              {body}
            </div>
          </section>
        ))}
      </div>

      <style>{`
        section a:hover { text-decoration: underline; }
      `}</style>
    </div>
  );
}
