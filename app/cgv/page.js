export const metadata = {
  title: "Conditions générales de vente — Myracoustic",
  description: "Conditions générales de vente de Myracoustic.",
};

const ARTICLES = [
  {
    title: '1. Objet et champ d’application',
    body: (
      <p>
        Les présentes Conditions Générales de Vente (ci-après « CGV ») ont pour objet de définir les conditions dans
        lesquelles Myracoustic propose des prestations techniques événementielles incluant sonorisation, éclairage,
        vidéo / écrans LED et régie technique. Ces CGV s'appliquent à toute commande de clients professionnels,
        institutionnels ou consommateurs.
      </p>
    ),
  },
  {
    title: '2. Informations légales',
    body: (
      <p>
        Myracoustic est une Société par actions simplifiée unipersonnelle (SASU) au capital social de 1 000 €,
        dont le siège social est situé 4 bis, La Haute Cosnière, 44390 Nort-sur-Erdre. SIREN : 999 827 579, RCS Nantes.
      </p>
    ),
  },
  {
    title: '3. Devis et commande',
    body: (
      <p>
        Toute prestation fait l'objet d'un devis écrit, précisant la nature des prestations, les moyens techniques
        mobilisés, les dates, lieux, horaires, ainsi que le prix. La commande devient ferme à réception du devis
        signé et du versement de l'acompte.
      </p>
    ),
  },
  {
    title: '4. Conditions financières',
    body: (
      <p>
        60 % du montant total TTC est exigible à la signature du devis à titre d'acompte, le solde de 40 % étant
        exigible le lendemain de la prestation (J+1). Tout retard de paiement entraîne l'application de pénalités
        légales, majorées le cas échéant d'une indemnité forfaitaire pour frais de recouvrement.
      </p>
    ),
  },
  {
    title: '5. Obligations du client',
    body: (
      <p>
        Le client s'engage à fournir les informations nécessaires à la bonne exécution de la prestation, à garantir
        l'accès et la conformité des lieux, à obtenir les autorisations administratives requises et à assurer une
        alimentation électrique adaptée. Le client demeure responsable du public et des tiers présents lors de l'événement.
      </p>
    ),
  },
  {
    title: '6. Exécution des prestations',
    body: (
      <p>
        Myracoustic s'engage à mobiliser des moyens humains et matériels conformes au devis, dans le cadre d'une
        obligation de moyens. Les horaires convenus sont impératifs ; tout dépassement non prévu au devis entraîne
        une facturation complémentaire.
      </p>
    ),
  },
  {
    title: '7. Propriété et responsabilité du matériel',
    body: (
      <p>
        L'ensemble du matériel mis à disposition demeure la propriété exclusive de Myracoustic. Le client est
        responsable des détériorations, pertes ou vols survenus pendant la durée où il en a la garde, sauf faute
        prouvée de Myracoustic.
      </p>
    ),
  },
  {
    title: '8. Annulation / report',
    body: (
      <>
        <p style={{ marginBottom: 10 }}>
          <strong>8.1 Annulation par le client :</strong> l'acompte versé reste acquis à Myracoustic. Toute annulation
          intervenant moins de 7 jours avant la date de l'événement entraîne la facturation de la totalité du montant prévu au devis.
        </p>
        <p>
          <strong>8.2 Annulation par Myracoustic :</strong> Myracoustic peut annuler la prestation en cas de force
          majeure ou d'impossibilité technique avérée. Dans ce cas, les sommes déjà versées par le client sont intégralement remboursées.
        </p>
      </>
    ),
  },
  {
    title: '9. Force majeure',
    body: (
      <p>
        Aucune des parties ne pourra être tenue responsable d'un manquement à ses obligations résultant d'un
        événement de force majeure au sens de l'article 1218 du Code civil et de la jurisprudence des tribunaux français.
      </p>
    ),
  },
  {
    title: '10. Responsabilité et assurances',
    body: (
      <p>
        La responsabilité de Myracoustic est limitée aux dommages directs, à l'exclusion de tout préjudice indirect,
        immatériel ou commercial. Myracoustic est couverte par une assurance responsabilité civile professionnelle
        garantissant les conséquences pécuniaires de sa responsabilité civile dans le cadre de ses activités.
      </p>
    ),
  },
  {
    title: '11. Droit de rétractation (clients consommateurs)',
    body: (
      <p>
        Conformément à l'article L221-28 du Code de la consommation, le droit de rétractation ne s'applique pas aux
        prestations de services relatives à des activités de loisirs devant être fournies à une date ou selon une
        périodicité déterminée.
      </p>
    ),
  },
  {
    title: '12. Médiation de la consommation',
    body: (
      <p>
        Conformément aux articles L.616-1 et R.616-1 du Code de la consommation, les clients consommateurs peuvent
        recourir gratuitement au service de médiation CNPM – Médiation de la consommation
        (<a href="https://www.cnpm-mediation-consommation.eu" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--lime)' }}>www.cnpm-mediation-consommation.eu</a>) en cas de litige non résolu directement avec Myracoustic.
      </p>
    ),
  },
  {
    title: '13. Données personnelles (RGPD)',
    body: (
      <p>
        Les données communiquées dans le cadre d'un devis ou d'une commande sont traitées par Myracoustic aux fins
        de gestion des devis, des commandes, de la facturation et de la relation commerciale. Le client dispose de
        droits d'accès, de rectification, d'effacement, d'opposition et de limitation, qu'il peut exercer en écrivant
        à <a href="mailto:contact@myracoustic.com" style={{ color: 'var(--lime)' }}>contact@myracoustic.com</a>. Pour
        plus de détails, consultez notre <a href="/politique-confidentialite" style={{ color: 'var(--lime)' }}>politique de confidentialité</a>.
      </p>
    ),
  },
  {
    title: '14. Droit applicable et juridiction compétente',
    body: (
      <p>
        Les présentes CGV sont soumises au droit français. Pour les clients professionnels, tout litige relève de la
        compétence des tribunaux du ressort du siège social de Myracoustic. Pour les clients consommateurs, les règles
        légales de compétence territoriale s'appliquent.
      </p>
    ),
  },
];

export default function CgvPage() {
  return (
    <div style={{ padding: '120px 24px 96px' }}>
      <div style={{ maxWidth: 760, margin: '0 auto' }}>
        <h1 style={{
          fontFamily: 'var(--font-display), sans-serif', fontWeight: 700,
          fontSize: 'clamp(28px,4vw,44px)', marginBottom: 12,
        }}>
          Conditions générales de vente
        </h1>
        <p style={{ color: 'var(--text-light)', fontSize: 14, marginBottom: 48 }}>
          Les présentes conditions générales de vente régissent les relations contractuelles entre Myracoustic et ses clients,
          professionnels ou particuliers, dans le cadre de la fourniture de prestations techniques événementielles.
        </p>

        {ARTICLES.map(({ title, body }) => (
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
