export const metadata = {
  title: "Mentions légales — Myracoustic",
  description: "Mentions légales du site Myracoustic.",
};

const SECTIONS = [
  {
    title: '1. Éditeur du site',
    body: (
      <>
        <p><strong>Myracoustic</strong> – Société par actions simplifiée unipersonnelle (SASU)</p>
        <ul>
          <li>Capital social : 1 000 €</li>
          <li>Siège social : 4 bis, La Haute Cosnière, 44390 Nort-sur-Erdre, France</li>
          <li>SIREN : 999 827 579</li>
          <li>SIRET (siège) : 999 827 579 00015</li>
          <li>TVA intracommunautaire : FR55 999827579</li>
          <li>Code APE / NAF : 90.02Z – Activités de soutien au spectacle vivant</li>
          <li>Président : Myrio Sophie</li>
        </ul>
      </>
    ),
  },
  {
    title: '2. Directeur de la publication',
    body: <p>Le directeur de la publication est Monsieur Myrio Sophie, en qualité de Président de la société Myracoustic.</p>,
  },
  {
    title: '3. Hébergement',
    body: (
      <ul>
        <li>Hébergeur : IONOS by 1&amp;1</li>
        <li>Adresse : 7 place de la Gare, 57200 Sarreguemines, France</li>
        <li>Téléphone : +33 (0)9 70 80 89 11</li>
        <li>Site : ionos.fr</li>
      </ul>
    ),
  },
  {
    title: '4. Propriété intellectuelle',
    body: (
      <p>
        L'ensemble des contenus présents sur ce site (textes, images, graphismes, logos, vidéos, icônes, sons, code, structure)
        est protégé par le droit de la propriété intellectuelle. Toute reproduction, modification ou adaptation nécessite
        une autorisation écrite préalable de Myracoustic.
      </p>
    ),
  },
  {
    title: '5. Données personnelles (RGPD)',
    body: (
      <p>
        Les données collectées sont utilisées exclusivement par Myracoustic. Vous disposez de droits d'accès, de rectification,
        de suppression et d'opposition sur vos données personnelles. Pour les exercer, contactez-nous à l'adresse{' '}
        <a href="mailto:contact@myracoustic.com" style={{ color: 'var(--lime)' }}>contact@myracoustic.com</a>.
      </p>
    ),
  },
  {
    title: '6. Cookies',
    body: (
      <p>
        Le site utilise des cookies pour améliorer l'expérience utilisateur, mesurer l'audience et activer certaines
        fonctionnalités. Vous pouvez refuser les cookies à tout moment via les réglages de votre navigateur.
      </p>
    ),
  },
  {
    title: '7. Responsabilité',
    body: <p>Myracoustic ne saurait être tenue responsable des omissions, inexactitudes ou carences de mise à jour du site.</p>,
  },
  {
    title: '8. Droit applicable',
    body: <p>Le présent site est soumis au droit français. En cas de litige, les tribunaux français seront seuls compétents.</p>,
  },
];

export default function MentionsLegalesPage() {
  return (
    <div style={{ padding: '120px 24px 96px' }}>
      <div style={{ maxWidth: 760, margin: '0 auto' }}>
        <h1 style={{
          fontFamily: 'var(--font-display), sans-serif', fontWeight: 700,
          fontSize: 'clamp(28px,4vw,44px)', marginBottom: 12,
        }}>
          Mentions légales
        </h1>
        <p style={{ color: 'var(--text-light)', fontSize: 14, marginBottom: 48 }}>
          Conformément aux dispositions des articles 6-III et 19 de la loi n° 2004-575 du 21 juin 2004 pour la confiance
          dans l'économie numérique, dite L.C.E.N., il est porté à la connaissance des utilisateurs et visiteurs du site
          les présentes mentions légales.
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
        section ul { margin: 0; padding-left: 20px; }
        section li { margin-bottom: 6px; }
        section a:hover { text-decoration: underline; }
      `}</style>
    </div>
  );
}
