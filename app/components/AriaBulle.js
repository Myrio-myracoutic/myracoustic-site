'use client';
import { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import { MessageCircle, X, Send, ArrowRight } from 'lucide-react';
import { getConsent, CONSENT_EVENT } from '../lib/consent';
import { gtagEvent } from '../lib/gtag';

/*
 * Bulle d'Aria, l'assistante IA du site (22/11). Le cerveau vit sur la plateforme
 * (app.myracoustic.com/api/aria) : ici, seulement la fenêtre de discussion.
 * - N'apparaît que si Aria est allumée dans l'admin de la plateforme (GET de l'API).
 * - Jamais sur les pages des publicités ni dans les parcours de demande (pas de distraction).
 * - Attend que le bandeau cookies soit fermé (jamais de bouton caché par le bandeau).
 * - Conversation gardée le temps de la visite (sessionStorage), côté serveur 180 jours.
 * Passé par ui-ux-pro-max : plein écran sur téléphone, champ toujours visible, Échap pour fermer,
 * focus rendu au bouton, animation coupée si le visiteur l'a demandé. Charte du site.
 */

const API = process.env.NEXT_PUBLIC_ARIA_API || 'https://app.myracoustic.com/api/aria';
const PAGES_SANS_ARIA = ['/mariage-sans-stress', '/dj-mariage', '/organisation-mariage', '/devis', '/rendez-vous'];
const MEMOIRE = 'aria-conversation';
const PROFIL_GA = { mariage: 'mariage', entreprise: 'professionnel', particulier: 'particulier' };

const ACCUEIL = "Bonjour, je suis Aria, l'assistante virtuelle de Myracoustic. Je réponds à vos questions sur nos prestations, et je peux vérifier si votre date est libre.";

function suggestionsPour(page) {
  if (page.startsWith('/evenement-entreprise')) return ['Que proposez-vous pour un séminaire ?', 'Comment se passe une demande ?', 'Pouvez-vous vérifier une date ?'];
  if (page.startsWith('/evenements-prives')) return ['Vous faites les anniversaires ?', 'Pouvez-vous vérifier ma date ?', 'Que comprend une prestation ?'];
  return ['Pouvez-vous vérifier ma date ?', 'Comment ça se passe ?', 'Que comprend une prestation ?'];
}

const pageSansAria = (p) => PAGES_SANS_ARIA.some((x) => p === x || p.startsWith(`${x}/`));

function lireMemoire() {
  try {
    const m = JSON.parse(sessionStorage.getItem(MEMOIRE) || 'null');
    return m && Array.isArray(m.messages) ? m : null;
  } catch { return null; }
}
function ecrireMemoire(m) {
  try { sessionStorage.setItem(MEMOIRE, JSON.stringify(m)); } catch { /* navigation privée : sans mémoire */ }
}

const CSS = `
.aria-lanceur{position:fixed;right:max(16px,env(safe-area-inset-right));bottom:max(16px,env(safe-area-inset-bottom));z-index:150;
  display:inline-flex;align-items:center;gap:10px;min-height:56px;min-width:56px;padding:0 16px;border-radius:999px;border:none;cursor:pointer;
  background:var(--lime);color:var(--bg);font-family:var(--font-display),sans-serif;font-size:15px;font-weight:700;
  box-shadow:0 8px 28px rgba(0,0,0,0.35);transition:transform .2s ease-out,opacity .2s}
.aria-lanceur:hover{transform:translateY(-2px)}
.aria-lanceur:focus-visible,.aria-fenetre button:focus-visible,.aria-fenetre a:focus-visible,.aria-fenetre textarea:focus-visible{outline:3px solid #fff;outline-offset:2px}
.aria-lanceur-texte{display:none}
@media (min-width:768px){.aria-lanceur-texte{display:inline}}
.aria-fenetre{position:fixed;z-index:300;display:flex;flex-direction:column;background:var(--bg);color:var(--text);
  border:1px solid var(--separator);box-shadow:0 18px 60px rgba(0,0,0,0.5);
  right:16px;bottom:16px;width:390px;height:min(620px,calc(100dvh - 32px));border-radius:18px;overflow:hidden;
  animation:aria-entree .22s ease-out}
.aria-voile{display:none}
.aria-poignee{display:none}
.aria-fermer-texte{display:none}
@media (max-width:640px){
  .aria-voile{display:block;position:fixed;inset:0;z-index:290;background:rgba(0,0,0,0.6);animation:aria-fondu .2s ease-out}
  .aria-fenetre{left:0;right:0;bottom:0;top:max(64px,calc(env(safe-area-inset-top) + 48px));width:auto;height:auto;
    border:none;border-top:1px solid var(--separator);border-radius:20px 20px 0 0;animation:aria-volet .25s ease-out}
  .aria-poignee{display:block;width:40px;height:5px;border-radius:3px;background:rgba(255,255,255,0.28);margin:8px auto 0}
  .aria-fermer-texte{display:inline}
}
@keyframes aria-entree{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:none}}
@keyframes aria-volet{from{transform:translateY(100%)}to{transform:none}}
@keyframes aria-fondu{from{opacity:0}to{opacity:1}}
.aria-point{width:8px;height:8px;border-radius:50%;background:var(--text-muted);animation:aria-point 1.2s infinite ease-in-out}
.aria-point:nth-child(2){animation-delay:.15s}.aria-point:nth-child(3){animation-delay:.3s}
@keyframes aria-point{0%,80%,100%{opacity:.3;transform:none}40%{opacity:1;transform:translateY(-3px)}}
@media (prefers-reduced-motion:reduce){.aria-fenetre,.aria-voile,.aria-point,.aria-lanceur{animation:none;transition:none}}
`;

export default function AriaBulle() {
  const pathname = usePathname() || '/';
  const [active, setActive] = useState(false);
  const [cookiesChoisis, setCookiesChoisis] = useState(false);
  const [ouverte, setOuverte] = useState(false);
  const [messages, setMessages] = useState([]);
  const [conversationId, setConversationId] = useState(null);
  const [texte, setTexte] = useState('');
  const [attente, setAttente] = useState(false);
  const [erreur, setErreur] = useState('');
  const lanceurRef = useRef(null);
  const champRef = useRef(null);
  const finRef = useRef(null);
  const departGlisserRef = useRef(null); // téléphone : glisser l'en-tête vers le bas ferme le volet
  const cachee = pageSansAria(pathname);

  // Aria allumée ? (réglage de l'admin, mis en cache une minute par la plateforme)
  useEffect(() => {
    let annule = false;
    fetch(API, { method: 'GET' })
      .then((r) => (r.ok ? r.json() : { active: false }))
      .then((d) => { if (!annule) setActive(Boolean(d.active)); })
      .catch(() => {});
    const m = lireMemoire();
    if (m) { setMessages(m.messages); setConversationId(m.conversationId || null); }
    return () => { annule = true; };
  }, []);

  // Bandeau cookies : la bulle n'apparaît qu'une fois le choix fait, et se cache s'il est rouvert.
  useEffect(() => {
    const maj = () => setCookiesChoisis(getConsent() !== null);
    const rouvert = () => setCookiesChoisis(false);
    maj();
    window.addEventListener(CONSENT_EVENT, maj);
    window.addEventListener('myra-cookie-prefs', rouvert);
    return () => { window.removeEventListener(CONSENT_EVENT, maj); window.removeEventListener('myra-cookie-prefs', rouvert); };
  }, []);

  useEffect(() => { if (ouverte) finRef.current?.scrollIntoView({ block: 'nearest' }); }, [messages, attente, ouverte]);

  // Ouverte : Échap pour fermer, page figée derrière sur téléphone. Focus dans le champ sur
  // ordinateur seulement : sur téléphone, le clavier cachait la moitié de l'écran avant même que
  // le visiteur ait lu l'accueil (retour de Myrio du 22/11).
  useEffect(() => {
    if (!ouverte) return undefined;
    const petitEcran = window.matchMedia('(max-width: 640px)').matches;
    if (!petitEcran) champRef.current?.focus();
    const touche = (e) => { if (e.key === 'Escape') fermer(); };
    window.addEventListener('keydown', touche);
    const avant = document.body.style.overflow;
    if (petitEcran) document.body.style.overflow = 'hidden';
    return () => { window.removeEventListener('keydown', touche); document.body.style.overflow = avant; };
  }, [ouverte]);

  if (!active || !cookiesChoisis || cachee) return null;

  function ouvrir() {
    setOuverte(true);
    gtagEvent('aria_ouverture', { page: pathname });
  }
  function fermer() {
    setOuverte(false);
    setTimeout(() => lanceurRef.current?.focus(), 0);
  }

  async function envoyer(contenu) {
    const message = (contenu ?? texte).trim();
    if (!message || attente) return;
    setTexte(''); setErreur(''); setAttente(true);
    const avecQuestion = [...messages, { role: 'visiteur', texte: message }];
    setMessages(avecQuestion);
    gtagEvent('aria_message', { page: pathname });
    try {
      const res = await fetch(API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, page: pathname, conversationId }),
      });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(d.erreur || "Pardon, je n'ai pas réussi à vous répondre. Réessayez dans un instant.");
      // Date à transmettre au formulaire : la dernière vérifiée LIBRE. Si cette réponse a vérifié des
      // dates sans en trouver de libre, aucune ; si elle n'en a pas vérifié, celle d'avant est gardée.
      const verifiees = d.dates || [];
      const precedente = [...messages].reverse().find((m) => m.role === 'aria')?.date ?? null;
      const dateLibre = verifiees.length ? (verifiees.filter((x) => x.statut === 'libre').at(-1)?.date ?? null) : precedente;
      const suite = [...avecQuestion, { role: 'aria', texte: d.reponse, rendezVous: d.rendezVous, lien: d.lien, date: dateLibre }];
      setMessages(suite);
      setConversationId(d.conversationId || conversationId);
      ecrireMemoire({ conversationId: d.conversationId || conversationId, messages: suite });
      // Date déjà prise : ce visiteur sort des audiences de publicité (même événement que le formulaire).
      if ((d.dates || []).some((x) => x.statut === 'reservee')) {
        gtagEvent('date_indisponible', { profil: PROFIL_GA[d.rendezVous] || 'mariage', source: 'aria' });
      }
    } catch (e) {
      setMessages(messages);
      setTexte(message);
      setErreur(e.message);
    } finally {
      setAttente(false);
    }
  }

  function clicRendezVous(m) {
    gtagEvent('aria_rdv_clic', { parcours: m.rendezVous, page: pathname });
    if (conversationId) {
      // keepalive : la page change juste après, la requête doit partir quand même.
      fetch(API, {
        method: 'POST', keepalive: true, headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'clic', conversationId }),
      }).catch(() => {});
    }
  }

  const sansEchange = !messages.some((m) => m.role === 'visiteur');

  return (
    <>
      <style>{CSS}</style>
      {!ouverte && (
        <button ref={lanceurRef} type="button" className="aria-lanceur" onClick={ouvrir}
          aria-label="Une question ? Discuter avec Aria, l'assistante virtuelle de Myracoustic" aria-haspopup="dialog">
          <MessageCircle size={24} aria-hidden="true" />
          <span className="aria-lanceur-texte">Une question ?</span>
        </button>
      )}

      {/* Téléphone : voile sombre au-dessus de la page (et du menu du site) ; le toucher ferme. */}
      {ouverte && <div className="aria-voile" onClick={fermer} aria-hidden="true" />}
      {ouverte && (
        <div className="aria-fenetre" role="dialog" aria-modal="true" aria-labelledby="aria-titre">
          <div className="aria-poignee" aria-hidden="true" />
          <header
            onTouchStart={(e) => { departGlisserRef.current = e.touches[0]?.clientY ?? null; }}
            onTouchEnd={(e) => {
              const depart = departGlisserRef.current;
              departGlisserRef.current = null;
              if (depart != null && (e.changedTouches[0]?.clientY ?? depart) - depart > 60) fermer();
            }}
            style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px 12px 16px', borderBottom: '1px solid var(--separator)', flexShrink: 0 }}>
            <span aria-hidden="true" style={{ width: 40, height: 40, borderRadius: '50%', display: 'grid', placeItems: 'center', background: 'rgba(184,239,11,0.14)', flexShrink: 0 }}>
              <MessageCircle size={20} color="var(--lime)" />
            </span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p id="aria-titre" style={{ margin: 0, fontFamily: 'var(--font-display), sans-serif', fontWeight: 700, fontSize: 17 }}>Aria</p>
              <p style={{ margin: 0, fontSize: 13, color: 'var(--text-muted)' }}>Assistante virtuelle (IA) de Myracoustic</p>
            </div>
            <button type="button" onClick={fermer} aria-label="Fermer la discussion"
              style={{
                minWidth: 44, height: 44, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '0 12px',
                borderRadius: 10, border: '1px solid var(--separator)', background: 'rgba(255,255,255,0.06)', color: 'var(--text)',
                cursor: 'pointer', fontFamily: 'inherit', fontSize: 14, fontWeight: 600, flexShrink: 0,
              }}>
              <X size={20} aria-hidden="true" />
              <span className="aria-fermer-texte">Fermer</span>
            </button>
          </header>

          <div role="log" aria-live="polite" style={{ flex: 1, overflowY: 'auto', padding: 16, display: 'flex', flexDirection: 'column', gap: 12, overscrollBehavior: 'contain' }}>
            <Bulle aria texte={ACCUEIL} />
            {messages.map((m, i) => (
              <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: m.role === 'aria' ? 'flex-start' : 'flex-end' }}>
                <Bulle aria={m.role === 'aria'} texte={m.texte} />
                {m.role === 'aria' && m.lien && (
                  <a href={m.date ? `${m.lien}?date=${m.date}` : m.lien} onClick={() => clicRendezVous(m)}
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: 8, minHeight: 44, padding: '0 18px', borderRadius: 10,
                      background: 'var(--lime)', color: 'var(--bg)', fontWeight: 700, fontSize: 15, textDecoration: 'none',
                    }}>
                    Prendre rendez-vous <ArrowRight size={18} aria-hidden="true" />
                  </a>
                )}
              </div>
            ))}
            {attente && (
              <div aria-label="Aria écrit" style={{ display: 'flex', gap: 5, padding: '14px 16px', borderRadius: 16, borderBottomLeftRadius: 4, background: 'rgba(255,255,255,0.06)', alignSelf: 'flex-start' }}>
                <span className="aria-point" /><span className="aria-point" /><span className="aria-point" />
              </div>
            )}
            {sansEchange && !attente && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {suggestionsPour(pathname).map((s) => (
                  <button key={s} type="button" onClick={() => envoyer(s)}
                    style={{
                      minHeight: 40, padding: '0 14px', borderRadius: 999, border: '1px solid rgba(184,239,11,0.45)', background: 'transparent',
                      color: 'var(--text)', fontSize: 14, fontFamily: 'inherit', cursor: 'pointer', textAlign: 'left',
                    }}>
                    {s}
                  </button>
                ))}
              </div>
            )}
            <div ref={finRef} />
          </div>

          <form onSubmit={(e) => { e.preventDefault(); envoyer(); }}
            style={{ borderTop: '1px solid var(--separator)', padding: '10px 12px calc(10px + env(safe-area-inset-bottom))', flexShrink: 0 }}>
            {erreur && <p role="alert" style={{ margin: '0 4px 8px', fontSize: 14, color: '#fca5a5' }}>{erreur}</p>}
            <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
              <label htmlFor="aria-champ" style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0 0 0 0)' }}>Votre question</label>
              <textarea id="aria-champ" ref={champRef} rows={1} value={texte} maxLength={800}
                onChange={(e) => setTexte(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); envoyer(); } }}
                placeholder="Écrivez votre question…"
                style={{
                  flex: 1, resize: 'none', maxHeight: 120, minHeight: 44, padding: '11px 14px', borderRadius: 12,
                  border: '1px solid var(--separator)', background: 'rgba(255,255,255,0.06)', color: 'var(--text)',
                  fontSize: 16, lineHeight: 1.4, fontFamily: 'inherit',
                }} />
              <button type="submit" disabled={!texte.trim() || attente} aria-label="Envoyer"
                style={{
                  width: 44, height: 44, flexShrink: 0, display: 'grid', placeItems: 'center', borderRadius: 12, border: 'none',
                  background: 'var(--lime)', color: 'var(--bg)', cursor: 'pointer', opacity: texte.trim() && !attente ? 1 : 0.45,
                }}>
                <Send size={19} aria-hidden="true" />
              </button>
            </div>
            <p style={{ margin: '8px 4px 0', fontSize: 12.5, lineHeight: 1.45, color: 'var(--text-muted)' }}>
              Aria est une intelligence artificielle : elle peut se tromper. Vos messages sont conservés 180 jours.{' '}
              <a href="/politique-confidentialite" style={{ color: 'var(--text-muted)', textDecoration: 'underline' }}>Confidentialité</a>
            </p>
          </form>
        </div>
      )}
    </>
  );
}

function Bulle({ aria, texte }) {
  return (
    <div style={{
      maxWidth: '88%', padding: '10px 14px', borderRadius: 16, fontSize: 16, lineHeight: 1.55, whiteSpace: 'pre-wrap',
      background: aria ? 'var(--card)' : 'rgba(184,239,11,0.16)',
      border: `1px solid ${aria ? 'var(--separator)' : 'rgba(184,239,11,0.35)'}`,
      borderBottomLeftRadius: aria ? 4 : 16, borderBottomRightRadius: aria ? 16 : 4,
      alignSelf: aria ? 'flex-start' : 'flex-end',
    }}>
      {texte}
    </div>
  );
}
