'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Check, ChevronDown } from 'lucide-react';
import { SectionLabel } from '../components/AnimatedWave';
import Reveal from '../components/Reveal';

/* Bloc propre à une porte d'entrée (voir portes.js), placé juste sous le héro :
   1. ce que la personne cherchait — ici les écrans de l'application, un par un ;
   2. le détail — une définition, puis un bloc par usage (contenu pour la recherche classique) ;
   3. le pivot — « ce n'est pas vendu seul, c'est compris avec votre DJ ».
   Le cadre de téléphone reprend les classes .mss-tel de MariageSansStressClient.js.

   Ordinateur : la liste (titre + texte) à gauche, le téléphone à droite.
   Téléphone : des pastilles à toucher (libellé court), le texte de l'écran choisi, puis le téléphone. */

// Espace insécable devant la ponctuation double : jamais de « : » ou « ? » en début de ligne.
const insecable = (texte) => texte.replace(/ ([:;?!])/g, ' $1');

export default function PorteSection({ porte, cta }) {
  const { section } = porte;
  const [actif, setActif] = useState(0);
  // Sur téléphone, les blocs de détail au-delà du 4e se déplient à la demande (ils restent dans la page).
  const [toutVoir, setToutVoir] = useState(false);
  const total = section.ecrans.length;
  const ecran = section.ecrans[actif];

  // Flèches du clavier : même comportement que des onglets (un seul arrêt de tabulation).
  const auClavier = (e, i) => {
    const pas = (e.key === 'ArrowDown' || e.key === 'ArrowRight') ? 1
      : (e.key === 'ArrowUp' || e.key === 'ArrowLeft') ? -1 : 0;
    if (!pas) return;
    e.preventDefault();
    const suivant = (i + pas + total) % total;
    setActif(suivant);
    document.getElementById(`porte-onglet-${section.ecrans[suivant].cle}`)?.focus();
  };

  return (
    <section id={section.id} style={{ padding: 'clamp(56px,7vw,88px) 32px' }}>
      <style>{`
        .porte-grille {
          display: grid;
          grid-template-columns: minmax(0, 1.15fr) minmax(0, 0.85fr);
          gap: clamp(32px,5vw,72px);
          align-items: center;
        }
        .porte-liste { display: flex; flex-direction: column; gap: 10px; }
        .porte-item {
          display: flex; gap: 14px; align-items: flex-start;
          width: 100%; text-align: left;
          padding: 16px 18px; border-radius: 14px;
          border: 1px solid var(--separator); background: transparent;
          color: var(--text); font: inherit; cursor: pointer;
          transition: background 0.2s ease-out, border-color 0.2s ease-out;
        }
        .porte-item:hover { background: color-mix(in srgb, var(--text) 4%, transparent); }
        .porte-item-actif, .porte-item-actif:hover {
          background: color-mix(in srgb, var(--lime) 8%, transparent);
          border-color: color-mix(in srgb, var(--lime) 55%, transparent);
        }
        .porte-item-icone {
          flex-shrink: 0; width: 40px; height: 40px; border-radius: 10px;
          display: inline-flex; align-items: center; justify-content: center;
          background: color-mix(in srgb, var(--text) 7%, transparent); color: var(--text-muted);
          transition: background 0.2s ease-out, color 0.2s ease-out;
        }
        .porte-item-actif .porte-item-icone { background: var(--lime); color: var(--bg); }
        .porte-item-corps { display: flex; flex-direction: column; gap: 4px; min-width: 0; }
        .porte-item-titre {
          font-family: var(--font-display), sans-serif; font-weight: 700;
          font-size: 17px; line-height: 1.25;
        }
        .porte-item-titre-court { display: none; }
        .porte-item-texte { color: var(--text-muted); font-size: 15px; line-height: 1.6; }
        .porte-captures { position: relative; width: 100%; height: 100%; }
        .porte-capture {
          position: absolute; inset: 0; width: 100%; height: 100%;
          object-fit: cover; object-position: top; display: block;
          transition: opacity 0.25s ease-out;
        }
        .porte-legende { display: none; }
        .porte-details { margin-top: clamp(56px,8vw,96px); }
        .porte-details-grille {
          display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 16px;
        }
        .porte-detail {
          padding: 22px; border-radius: 16px;
          border: 1px solid var(--separator); background: var(--card);
        }
        .porte-detail-icone {
          width: 40px; height: 40px; border-radius: 10px; margin-bottom: 14px;
          display: inline-flex; align-items: center; justify-content: center;
          background: color-mix(in srgb, var(--lime) 12%, transparent); color: var(--lime);
        }
        .porte-detail h3 {
          font-family: var(--font-display), sans-serif; font-weight: 700;
          font-size: 17.5px; line-height: 1.3; margin: 0 0 8px;
        }
        .porte-detail p { color: var(--text-muted); font-size: 15px; line-height: 1.65; margin: 0; }
        .porte-liens {
          margin: 28px auto 0; max-width: 760px; text-align: center;
          color: var(--text-muted); font-size: 15px; line-height: 1.9;
        }
        .porte-liens a {
          color: var(--text); text-decoration: underline; text-underline-offset: 3px;
          transition: color 0.2s ease-out;
        }
        .porte-liens a:hover { color: var(--lime); }
        .porte-pivot {
          margin-top: clamp(40px,6vw,72px);
          display: grid; grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: clamp(24px,4vw,56px); align-items: center;
          padding: clamp(24px,4vw,40px);
          border-radius: 18px; border: 1px solid var(--separator); background: var(--card);
        }
        .porte-inclus { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 14px; }
        .porte-inclus li { display: flex; gap: 12px; align-items: flex-start; font-size: 16px; line-height: 1.5; }
        .porte-inclus-coche {
          flex-shrink: 0; width: 24px; height: 24px; border-radius: 50%; margin-top: 1px;
          display: inline-flex; align-items: center; justify-content: center;
          background: color-mix(in srgb, var(--lime) 16%, transparent); color: var(--lime);
        }
        @media (max-width: 1020px) {
          .porte-details-grille { grid-template-columns: repeat(2, minmax(0, 1fr)); }
        }
        .porte-details-plus { display: none; }
        @media (max-width: 640px) {
          .porte-details-grille { grid-template-columns: minmax(0, 1fr); gap: 12px; }
          .porte-detail { padding: 18px; }
          .porte-details-grille:not(.porte-details-tout) .porte-detail:nth-child(n+5) { display: none; }
          .porte-details-plus {
            display: flex; align-items: center; justify-content: center; gap: 8px;
            width: 100%; min-height: 48px; margin-top: 12px; padding: 0 18px;
            border-radius: 12px; border: 1px solid var(--separator); background: transparent;
            color: var(--text); font: inherit; font-size: 15px; font-weight: 600; cursor: pointer;
          }
        }
        @media (max-width: 860px) {
          .porte-grille { grid-template-columns: minmax(0, 1fr); gap: 24px; }
          .porte-liste { flex-direction: row; flex-wrap: wrap; justify-content: center; gap: 8px; }
          .porte-item {
            width: auto; align-items: center;
            min-height: 48px; padding: 0 18px; border-radius: 999px;
          }
          .porte-item-actif, .porte-item-actif:hover { background: var(--lime); border-color: var(--lime); color: var(--bg); }
          .porte-item-icone, .porte-item-titre-long, .porte-item-texte { display: none; }
          .porte-item-titre-court { display: inline; font-size: 15px; }
          .porte-visuel { display: flex; flex-direction: column; }
          .porte-legende {
            display: block; order: -1; margin: 0 auto 22px; max-width: 440px; min-height: 6.6em;
            text-align: center; color: var(--text-muted); font-size: 15.5px; line-height: 1.65;
          }
          .porte-pivot { grid-template-columns: minmax(0, 1fr); }
        }
        @media (prefers-reduced-motion: reduce) {
          .porte-item, .porte-item-icone, .porte-capture, .porte-liens a { transition: none; }
        }
      `}</style>

      <div style={{ maxWidth: 1180, margin: '0 auto' }}>
        <Reveal style={{ textAlign: 'center', maxWidth: 720, margin: '0 auto clamp(36px,5vw,56px)' }}>
          <SectionLabel style={{ justifyContent: 'center' }}>{section.label}</SectionLabel>
          <h2 style={{ fontFamily: 'var(--font-display), sans-serif', fontSize: 'clamp(26px,3.5vw,42px)', fontWeight: 700, marginBottom: 14 }}>
            {section.titre}
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: 16, lineHeight: 1.7 }}>
            {insecable(section.intro)}
          </p>
        </Reveal>

        <Reveal className="porte-grille">
          <div className="porte-liste" role="tablist" aria-label="Écrans de l'application" aria-orientation="vertical">
            {section.ecrans.map((e, i) => {
              const Icone = e.icone;
              const choisi = i === actif;
              return (
                <button
                  key={e.cle} type="button" role="tab" id={`porte-onglet-${e.cle}`}
                  aria-selected={choisi} aria-controls="porte-ecran" tabIndex={choisi ? 0 : -1}
                  className={`porte-item mss-focusable${choisi ? ' porte-item-actif' : ''}`}
                  onClick={() => setActif(i)} onKeyDown={(ev) => auClavier(ev, i)}
                >
                  <span className="porte-item-icone" aria-hidden="true"><Icone size={20} strokeWidth={1.8} /></span>
                  <span className="porte-item-corps">
                    <span className="porte-item-titre porte-item-titre-long">{e.titre}</span>
                    <span className="porte-item-titre porte-item-titre-court">{e.court}</span>
                    <span className="porte-item-texte">{insecable(e.texte)}</span>
                  </span>
                </button>
              );
            })}
          </div>

          <div id="porte-ecran" className="porte-visuel" role="tabpanel" aria-labelledby={`porte-onglet-${ecran.cle}`}>
            <div className="mss-tel">
              <div className="mss-tel-ecran">
                <span className="mss-tel-ilot" aria-hidden="true" />
                <div className="porte-captures">
                  {section.ecrans.map((e, i) => (
                    // Captures WebP déjà à la bonne taille (390 × 844, double densité) : pas d'optimisation Next à refaire
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      // Description toujours présente (Bing signale les alt vides, 19/11) ; les captures
                      // cachées restent masquées aux lecteurs d'écran par aria-hidden.
                      key={e.cle} src={e.capture.src} alt={e.capture.alt} aria-hidden={i === actif ? undefined : true}
                      width={780} height={1688} loading="lazy" decoding="async"
                      className="porte-capture" style={{ opacity: i === actif ? 1 : 0 }}
                    />
                  ))}
                </div>
              </div>
            </div>
            {/* Sur téléphone, les pastilles n'affichent que le titre : le texte de l'écran choisi vient ici. */}
            <p className="porte-legende" aria-live="polite">{insecable(ecran.texte)}</p>
          </div>
        </Reveal>

        {section.details && (
          <div className="porte-details">
            <Reveal style={{ textAlign: 'center', maxWidth: 780, margin: '0 auto clamp(28px,4vw,44px)' }}>
              <h2 style={{ fontFamily: 'var(--font-display), sans-serif', fontSize: 'clamp(24px,3.2vw,38px)', fontWeight: 700, marginBottom: 14 }}>
                {insecable(section.details.titre)}
              </h2>
              <p style={{ color: 'var(--text-muted)', fontSize: 16, lineHeight: 1.75 }}>
                {insecable(section.details.intro)}
              </p>
            </Reveal>
            <Reveal id="porte-details-grille" className={`porte-details-grille${toutVoir ? ' porte-details-tout' : ''}`}>
              {section.details.blocs.map((b) => {
                const Icone = b.icone;
                return (
                  <article key={b.titre} className="porte-detail">
                    <span className="porte-detail-icone" aria-hidden="true"><Icone size={20} strokeWidth={1.8} /></span>
                    <h3>{b.titre}</h3>
                    <p>{insecable(b.texte)}</p>
                  </article>
                );
              })}
            </Reveal>
            {!toutVoir && section.details.blocs.length > 4 && (
              <button type="button" className="porte-details-plus mss-focusable" aria-expanded="false" aria-controls="porte-details-grille" onClick={() => setToutVoir(true)}>
                <ChevronDown size={18} aria-hidden="true" />
                Voir les {section.details.blocs.length - 4} autres usages
              </button>
            )}
            <p className="porte-liens">
              {section.details.liens.map((l, i) => (l.href
                ? <Link key={i} href={l.href} className="mss-focusable">{l.t}</Link>
                : <span key={i}>{insecable(l.t)}</span>))}
            </p>
          </div>
        )}

        <Reveal className="porte-pivot">
          <div>
            <h2 style={{ fontFamily: 'var(--font-display), sans-serif', fontWeight: 700, fontSize: 'clamp(22px,2.6vw,30px)', lineHeight: 1.2, marginBottom: 14 }}>
              {section.pivot.titre}
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: 16, lineHeight: 1.75 }}>
              {insecable(section.pivot.texte)}
            </p>
            {/* Sur téléphone, la barre fixe du bas porte déjà le bouton. */}
            <div className="hide-mobile" style={{ marginTop: 28 }}>{cta}</div>
          </div>
          <ul className="porte-inclus">
            {section.pivot.inclus.map((ligne) => (
              <li key={ligne}>
                <span className="porte-inclus-coche" aria-hidden="true"><Check size={15} strokeWidth={2.6} /></span>
                <span>{ligne}</span>
              </li>
            ))}
          </ul>
        </Reveal>
      </div>
    </section>
  );
}
