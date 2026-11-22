import CookiePrefsButtonInline from '../components/CookiePrefsButtonInline';

export const metadata = {
  title: "Politique de confidentialité — Myracoustic",
  description: "Politique de confidentialité du site Myracoustic.",
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
          Le site utilise Elementor Forms ainsi que des traceurs publicitaires Google Ads, Meta Pixel, Pixel OpenAI et TikTok Pixel.
          Ces traceurs sont soumis à votre consentement via la bannière cookies (lorsqu'elle est mise en place).
        </p>
      </>
    ),
  },
  {
    title: '2. Données collectées via les formulaires',
    body: (
      <>
        <p style={{ marginBottom: 10 }}>
          Lorsque vous nous contactez (formulaire de contact ou demande de devis), nous collectons : nom et prénom,
          adresse e-mail, numéro de téléphone, et le contenu de votre message (détails de votre besoin).
        </p>
        <p>
          Des données techniques peuvent également être traitées (par exemple : adresse IP, journaux serveur) à des
          fins de sécurité et de bon fonctionnement du site.
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
            <strong>Mesure d’audience :</strong> selon vos choix dans la bannière cookies, l’ouverture d’Aria et le clic sur
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
    title: '4. Cookies et traceurs publicitaires',
    body: (
      <>
        <p style={{ marginBottom: 10 }}>
          Le site utilise des traceurs permettant de mesurer l'efficacité des campagnes publicitaires et, selon votre
          choix, de proposer du reciblage publicitaire (remarketing) :
        </p>
        <ul style={{ margin: '0 0 10px', paddingLeft: 20 }}>
          <li style={{ marginBottom: 6 }}>Google Ads : conversions, remarketing</li>
          <li style={{ marginBottom: 6 }}>Meta Pixel : conversions, audiences, retargeting</li>
          <li style={{ marginBottom: 6 }}>
            Pixel OpenAI (publicités ChatGPT) : mesure des demandes issues de nos publicités. Les coordonnées saisies
            dans un formulaire peuvent être transmises sous forme hachée (SHA-256, procédé irréversible), jamais en clair
          </li>
          <li>TikTok Pixel : conversions, audiences, retargeting</li>
        </ul>
        <p>Le site n'utilise ni Google Analytics (GA4), ni Google Tag Manager (GTM).</p>
      </>
    ),
  },
  {
    title: '5. Finalités',
    body: (
      <ul style={{ margin: 0, paddingLeft: 20 }}>
        <li style={{ marginBottom: 6 }}>Répondre à votre demande et en assurer le suivi (contact / devis)</li>
        <li style={{ marginBottom: 6 }}>Mesurer l'efficacité des publicités (conversions)</li>
        <li style={{ marginBottom: 6 }}>Créer des audiences et proposer du reciblage publicitaire (si vous l'acceptez)</li>
        <li>Assurer la sécurité du site et prévenir la fraude</li>
      </ul>
    ),
  },
  {
    title: '6. Base légale (RGPD)',
    body: (
      <ul style={{ margin: 0, paddingLeft: 20 }}>
        <li style={{ marginBottom: 6 }}>Mesures précontractuelles : traitement d'une demande de devis ou de contact</li>
        <li style={{ marginBottom: 6 }}>Intérêt légitime : sécurité et bon fonctionnement du site</li>
        <li>Consentement : cookies et traceurs non essentiels (publicité, remarketing, conversions)</li>
      </ul>
    ),
  },
  {
    title: '7. Destinataires et sous-traitants',
    body: (
      <>
        <p style={{ marginBottom: 10 }}>
          Les données sont traitées par Myracoustic et peuvent être accessibles à des prestataires nécessaires au
          fonctionnement du site :
        </p>
        <ul style={{ margin: 0, paddingLeft: 20 }}>
          <li style={{ marginBottom: 6 }}>Hébergement : IONOS</li>
          <li style={{ marginBottom: 6 }}>Site et formulaires : WordPress / Elementor</li>
          <li style={{ marginBottom: 6 }}>Traceurs publicitaires : Google, Meta, OpenAI, TikTok (sous réserve de votre consentement)</li>
          <li>Assistante virtuelle Aria : Anthropic (voir la section 3)</li>
        </ul>
      </>
    ),
  },
  {
    title: '8. Transferts hors Union européenne',
    body: (
      <p>
        Le recours à des services tiers (Google, Meta, OpenAI, TikTok, et Anthropic pour l’assistante Aria) peut entraîner des transferts de données en dehors de
        l'Union européenne. Le cas échéant, ces transferts s'appuient sur des mécanismes de protection adaptés
        (par exemple des clauses contractuelles types) et/ou sur les garanties fournies par ces prestataires.
      </p>
    ),
  },
  {
    title: '9. Durées de conservation',
    body: (
      <ul style={{ margin: 0, paddingLeft: 20 }}>
        <li style={{ marginBottom: 6 }}>Données issues des formulaires : jusqu'à 3 ans après le dernier échange</li>
        <li style={{ marginBottom: 6 }}>Conversations avec l’assistante Aria : 180 jours, puis suppression automatique</li>
        <li style={{ marginBottom: 6 }}>Données contractuelles : durées légales de conservation comptable et de facturation, le cas échéant</li>
        <li style={{ marginBottom: 6 }}>Cookies et traceurs : en principe jusqu'à 13 mois (variable selon les services et vos choix)</li>
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
          Vous pouvez accepter ou refuser les cookies via la bannière de consentement (lorsqu'elle est mise en place)
          et modifier vos choix à tout moment. Vous pouvez également gérer les cookies directement depuis les
          paramètres de votre navigateur :
        </p>
        <ul style={{ margin: '0 0 16px', paddingLeft: 20 }}>
          <li style={{ marginBottom: 6 }}>Google Ads : paramètres de publicité Google</li>
          <li style={{ marginBottom: 6 }}>Meta : paramètres de publicité Facebook / Instagram</li>
          <li style={{ marginBottom: 6 }}>OpenAI : paramètres de publicité de votre compte ChatGPT</li>
          <li>TikTok : paramètres de confidentialité et de publicité TikTok</li>
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
        <p style={{ color: 'var(--text-light)', fontSize: 14, marginBottom: 48 }}>
          Cette politique explique comment Myracoustic collecte, utilise et protège vos données personnelles
          lorsque vous visitez ce site, utilisez nos formulaires de contact et de devis, ou discutez avec
          notre assistante virtuelle Aria.
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
