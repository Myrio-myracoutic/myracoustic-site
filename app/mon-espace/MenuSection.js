'use client';
import { useEffect, useState, useCallback } from 'react';
import { UtensilsCrossed, Plus, X, Trash2, Check, FileDown, ChevronDown, ChevronUp, Wine, AlertTriangle, Cake } from 'lucide-react';
import { printMenu } from '@/app/lib/menu-pdf';

/* Génère une clé stable pour un plat */
function newKey() {
  return 'c_' + Math.random().toString(36).slice(2, 9);
}

const card = {
  background: '#0d1b2a', border: '1px solid rgba(255,255,255,0.07)',
  borderRadius: 14, padding: '20px', marginBottom: 16,
};
const h3 = {
  fontFamily: 'var(--font-display), sans-serif', fontSize: 13, fontWeight: 700,
  color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 14px',
};
const input = {
  background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: 7, padding: '8px 12px', color: '#fff', fontSize: 13, fontFamily: 'inherit', outline: 'none',
};
const limeBtn = {
  background: '#b8ef0b', color: '#060e16', border: 'none', borderRadius: 8,
  padding: '9px 18px', cursor: 'pointer', fontWeight: 800, fontSize: 13,
  fontFamily: 'var(--font-display), sans-serif', display: 'inline-flex', alignItems: 'center', gap: 6,
};

function Toggle({ on, onChange, label, hint }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '10px 0' }}>
      <button onClick={() => onChange(!on)} style={{
        width: 42, height: 24, borderRadius: 12, border: 'none', cursor: 'pointer', flexShrink: 0, marginTop: 2,
        background: on ? '#b8ef0b' : 'rgba(255,255,255,0.12)', position: 'relative', transition: 'background 0.15s',
      }}>
        <span style={{
          position: 'absolute', top: 3, left: on ? 21 : 3, width: 18, height: 18, borderRadius: '50%',
          background: on ? '#060e16' : '#fff', transition: 'left 0.15s',
        }} />
      </button>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.85)', fontWeight: 600 }}>{label}</div>
        {hint && <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', marginTop: 2 }}>{hint}</div>}
      </div>
    </div>
  );
}

/* Éditeur d'une liste d'options textuelles (réutilisé : plats + boissons) */
function OptionList({ options, onChange, placeholder }) {
  const set = (i, v) => onChange(options.map((o, idx) => idx === i ? v : o));
  const add = () => onChange([...options, '']);
  const del = (i) => onChange(options.filter((_, idx) => idx !== i));
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {options.map((o, i) => (
        <div key={i} style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <input value={o} onChange={e => set(i, e.target.value)} placeholder={placeholder}
            style={{ ...input, flex: 1 }} />
          <button onClick={() => del(i)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.25)', padding: 4 }}
            onMouseEnter={e => e.currentTarget.style.color = '#ef4444'}
            onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.25)'}>
            <X size={15} />
          </button>
        </div>
      ))}
      <button onClick={add} style={{
        alignSelf: 'flex-start', background: 'none', border: 'none', cursor: 'pointer',
        color: '#b8ef0b', fontSize: 12, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4, padding: '4px 0',
      }}>
        <Plus size={13} /> Ajouter un choix possible
      </button>
    </div>
  );
}

export default function MenuSection({ ev, token }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving]   = useState(false);
  const [saved, setSaved]     = useState(false);
  const [guests, setGuests]   = useState([]);

  const [isActive, setIsActive]       = useState(false);
  const [introText, setIntroText]     = useState('');
  const [courses, setCourses]         = useState([]);
  const [askDietary, setAskDietary]   = useState(true);
  const [askCake, setAskCake]         = useState(false);
  const [askDrinks, setAskDrinks]     = useState(false);
  const [drinkOptions, setDrinkOptions] = useState([]);
  const [askComment, setAskComment]   = useState(false);
  const [serviceType, setServiceType] = useState('plated'); // 'plated' (service à table) | 'buffet'

  const load = useCallback(async () => {
    const res = await fetch(`/api/mon-espace/menu/${ev.id}`, { headers: { Authorization: `Bearer ${token}` } });
    const data = await res.json();
    const c = data.config;
    if (c) {
      setIsActive(c.is_active);
      setServiceType(c.service_type || 'plated');
      setIntroText(c.intro_text || '');
      setCourses(Array.isArray(c.courses) ? c.courses : []);
      setAskDietary(c.ask_dietary);
      setAskCake(c.ask_cake);
      setAskDrinks(c.ask_drinks);
      setDrinkOptions(Array.isArray(c.drink_options) ? c.drink_options : []);
      setAskComment(c.ask_comment);
    }
    setGuests(data.guests || []);
    setLoading(false);
  }, [ev.id, token]);

  useEffect(() => { load(); }, [load]);

  const save = async () => {
    setSaving(true); setSaved(false);
    const cleanCourses = courses
      .map(c => ({ key: c.key || newKey(), label: (c.label || '').trim(), options: (c.options || []).map(o => o.trim()).filter(Boolean) }))
      .filter(c => c.label);
    const res = await fetch(`/api/mon-espace/menu/${ev.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        isActive, serviceType, introText, courses: cleanCourses,
        askDietary, askCake, askDrinks,
        drinkOptions: drinkOptions.map(o => o.trim()).filter(Boolean),
        askComment,
      }),
    });
    setSaving(false);
    if (res.ok) { setSaved(true); setTimeout(() => setSaved(false), 2500); load(); }
  };

  const addCourse = () => setCourses(cs => [...cs, { key: newKey(), label: '', options: [] }]);
  const setCourse = (i, patch) => setCourses(cs => cs.map((c, idx) => idx === i ? { ...c, ...patch } : c));
  const delCourse = (i) => setCourses(cs => cs.filter((_, idx) => idx !== i));

  /* À l'activation, on pré-remplit la structure classique d'un repas pour que le couple
     comprenne le principe au premier coup d'œil — chaque plat est modifiable / supprimable. */
  const activate = (on) => {
    setIsActive(on);
    if (on && courses.length === 0) {
      setCourses([
        { key: newKey(), label: 'Entrée',         options: [] },
        { key: newKey(), label: 'Plat principal', options: [] },
        { key: newKey(), label: 'Dessert',        options: [] },
      ]);
    }
  };

  const present = guests.filter(g => g.attending === true);

  if (loading) return <p style={{ color: 'rgba(255,255,255,0.2)', fontSize: 13 }}>Chargement…</p>;

  return (
    <div>
      {/* Intro */}
      <div style={{ ...card, background: 'linear-gradient(135deg, rgba(184,239,11,0.06), rgba(184,239,11,0.02))', border: '1px solid rgba(184,239,11,0.15)' }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
          <UtensilsCrossed size={20} color="#b8ef0b" strokeWidth={1.5} style={{ flexShrink: 0, marginTop: 2 }} />
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#fff', marginBottom: 4 }}>Choix du menu par vos invités</div>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)', lineHeight: 1.6, margin: 0 }}>
              Composez votre menu, puis choisissez le type de service : <strong style={{ color: 'rgba(255,255,255,0.75)' }}>service à table</strong> (vos invités choisissent leurs plats) ou <strong style={{ color: 'rgba(255,255,255,0.75)' }}>buffet</strong> (le menu est simplement affiché).
            </p>
          </div>
        </div>
      </div>

      {/* Activation */}
      <div style={card}>
        <Toggle on={isActive} onChange={activate}
          label="Activer le menu"
          hint="Tant que c'est désactivé, vos invités ne voient rien sur le repas." />
      </div>

      {isActive && (
        <>
          {/* Type de service : service à table (sélection) vs buffet (affichage) */}
          <div style={card}>
            <h3 style={h3}>Type de service</h3>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              {[
                { id: 'plated', title: 'Service à table', desc: 'Vos invités choisissent leurs plats' },
                { id: 'buffet', title: 'Buffet', desc: 'Le menu est affiché, sans choix à faire' },
              ].map(m => {
                const active = serviceType === m.id;
                return (
                  <button key={m.id} onClick={() => setServiceType(m.id)} style={{
                    flex: '1 1 200px', textAlign: 'left', cursor: 'pointer',
                    background: active ? 'rgba(184,239,11,0.1)' : 'rgba(255,255,255,0.03)',
                    border: `1px solid ${active ? 'rgba(184,239,11,0.5)' : 'rgba(255,255,255,0.1)'}`,
                    borderRadius: 10, padding: '12px 14px',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ width: 16, height: 16, borderRadius: '50%', flexShrink: 0, border: `2px solid ${active ? '#b8ef0b' : 'rgba(255,255,255,0.25)'}`, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                        {active && <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#b8ef0b' }} />}
                      </span>
                      <span style={{ fontSize: 14, fontWeight: 700, color: active ? '#b8ef0b' : 'rgba(255,255,255,0.8)' }}>{m.title}</span>
                    </div>
                    <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginTop: 4, marginLeft: 24 }}>{m.desc}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Consigne d'intro affichée au-dessus du menu (≠ faire-part) */}
          <div style={card}>
            <h3 style={h3}>Consigne pour le menu (facultatif)</h3>
            <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', margin: '0 0 10px', lineHeight: 1.6 }}>
              S'affiche <strong style={{ color: 'rgba(255,255,255,0.6)' }}>au-dessus des questions du repas</strong> sur l'invitation.
              Ce n'est pas le faire-part (à gérer dans la section « Faire-part »). À enregistrer avec le bouton en bas.
            </p>
            <textarea value={introText} onChange={e => setIntroText(e.target.value)} rows={2}
              placeholder="Ex. : Merci de nous indiquer vos choix de repas avant le 1er août."
              style={{ ...input, width: '100%', resize: 'vertical' }} />
          </div>

          {/* Constructeur de plats */}
          <div style={card}>
            <h3 style={h3}>{serviceType === 'buffet' ? 'Votre buffet' : 'Les plats de votre menu'}</h3>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', margin: '0 0 14px', lineHeight: 1.6 }}>
              {serviceType === 'buffet' ? (
                <>Chaque ligne est un moment du repas (entrée, plat, dessert…). Sous chacun, listez <strong style={{ color: 'rgba(255,255,255,0.7)' }}>ce qui sera proposé</strong> au buffet. Vos invités le verront affiché, <strong style={{ color: 'rgba(255,255,255,0.7)' }}>sans rien sélectionner</strong>.</>
              ) : (
                <>Chaque plat est un moment du repas (entrée, plat, dessert…). Sous chaque plat, ajoutez les <strong style={{ color: 'rgba(255,255,255,0.7)' }}>choix possibles</strong> entre lesquels vos invités décident (ex. Viande / Poisson / Végétarien).</>
              )}
            </p>
            {courses.length === 0 && (
              <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.3)', fontStyle: 'italic', margin: '0 0 12px' }}>
                Aucun plat pour l'instant. Ajoutez-en un ci-dessous.
              </p>
            )}
            {courses.map((c, i) => (
              <div key={c.key} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 10, padding: 14, marginBottom: 10 }}>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 10 }}>
                  <input value={c.label} onChange={e => setCourse(i, { label: e.target.value })}
                    placeholder="Nom du plat (ex. Entrée, Plat, Dessert)"
                    style={{ ...input, flex: 1, fontWeight: 600 }} />
                  <button onClick={() => delCourse(i)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.25)', padding: 4 }}
                    onMouseEnter={e => e.currentTarget.style.color = '#ef4444'}
                    onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.25)'}>
                    <Trash2 size={15} />
                  </button>
                </div>
                <OptionList options={c.options || []} onChange={opts => setCourse(i, { options: opts })} placeholder={serviceType === 'buffet' ? 'Plat proposé (ex. Rôti, Salade…)' : 'Choix possible (ex. Viande)'} />
              </div>
            ))}
            <button onClick={addCourse} style={{
              background: 'rgba(184,239,11,0.08)', border: '1px dashed rgba(184,239,11,0.3)', borderRadius: 10,
              padding: '10px 18px', cursor: 'pointer', color: '#b8ef0b', fontSize: 13, fontWeight: 600,
              display: 'flex', alignItems: 'center', gap: 8, width: '100%', justifyContent: 'center',
            }}>
              <Plus size={15} /> Ajouter un plat
            </button>
          </div>

          {/* Options complémentaires — uniquement en service à table (le buffet est un simple affichage) */}
          {serviceType === 'plated' ? (
            <div style={card}>
              <h3 style={h3}>Options complémentaires</h3>
              <Toggle on={askDietary} onChange={setAskDietary}
                label="Allergies & régimes alimentaires" hint="Recommandé — l'invité signale ses allergies ou son régime (végétarien, sans gluten…)." />
              <Toggle on={askCake} onChange={setAskCake}
                label="Parts de gâteau" hint="L'invité indique combien de parts il souhaite." />
              <Toggle on={askDrinks} onChange={setAskDrinks}
                label="Boissons" hint="L'invité choisit sa boisson parmi celles que vous proposez." />
              {askDrinks && (
                <div style={{ paddingLeft: 54, paddingBottom: 8 }}>
                  <OptionList options={drinkOptions} onChange={setDrinkOptions} placeholder="Boisson (ex. Vin rouge)" />
                </div>
              )}
              <Toggle on={askComment} onChange={setAskComment}
                label="Commentaire libre" hint="Un champ libre pour un mot de chaque invité." />
            </div>
          ) : (
            <div style={{ ...card, display: 'flex', gap: 12, alignItems: 'flex-start' }}>
              <UtensilsCrossed size={18} color="#b8ef0b" strokeWidth={1.5} style={{ flexShrink: 0, marginTop: 2 }} />
              <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)', lineHeight: 1.6, margin: 0 }}>
                <strong style={{ color: 'rgba(255,255,255,0.8)' }}>Mode buffet</strong> — vos invités verront ce menu affiché sur leur invitation, sans rien à sélectionner. Aucune réponse à collecter.
              </p>
            </div>
          )}
        </>
      )}

      {/* Barre d'enregistrement */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <button onClick={save} disabled={saving} style={limeBtn}>
          {saved ? <><Check size={14} /> Enregistré</> : saving ? 'Enregistrement…' : 'Enregistrer'}
        </button>
        {isActive && <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)' }}>Vos invités verront les modifications immédiatement.</span>}
      </div>

      {/* Réponses consolidées — uniquement en service à table (le buffet n'a pas de sélection) */}
      {isActive && serviceType === 'plated' && <Responses courses={courses} askDietary={askDietary} askCake={askCake} askDrinks={askDrinks} askComment={askComment} present={present} ev={ev} />}
    </div>
  );
}

/* Énumère les convives d'un invité avec leur étiquette (Adulte 1, Enfant 1…) */
function peopleOf(g) {
  const list = (g.menu_response?.people) || [];
  let a = 0, c = 0;
  return list.map(p => ({
    ...p,
    label: p.kind === 'adult' ? `Adulte ${++a}` : `Enfant ${++c}`,
  }));
}
function personAnswered(p) {
  return (p.choices && Object.keys(p.choices).length > 0) || p.dietary || p.drink;
}

function Responses({ courses, askDietary, askCake, askDrinks, askComment, present, ev }) {
  const [open, setOpen] = useState(true);

  const answered = present.filter(g => peopleOf(g).some(personAnswered));

  // Récapitulatif par plat — compté par PERSONNE
  const summary = courses.map(c => {
    const counts = {};
    for (const g of present) {
      for (const p of peopleOf(g)) {
        const choice = p.choices?.[c.key];
        if (choice) counts[choice] = (counts[choice] || 0) + 1;
      }
    }
    return { label: c.label, counts };
  });
  const totalCake = present.reduce((s, g) => s + (parseInt(g.menu_response?.cake) || 0), 0);

  const exportPDF = () => printMenu({
    courses,
    ask: { dietary: askDietary, cake: askCake, drinks: askDrinks, comment: askComment },
    present,
    event: { type: ev?.event_type, date: ev?.event_date, city: ev?.venue_city },
  });

  const totalPeople = present.reduce((s, g) => s + peopleOf(g).filter(personAnswered).length, 0);

  return (
    <div style={card}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: open ? 14 : 0 }}>
        <h3 style={{ ...h3, margin: 0 }}>Réponses ({answered.length}/{present.length} invités · {totalPeople} convives)</h3>
        <div style={{ display: 'flex', gap: 8 }}>
          {answered.length > 0 && (
            <button onClick={exportPDF} style={{
              background: 'rgba(184,239,11,0.1)', border: '1px solid rgba(184,239,11,0.25)', borderRadius: 7,
              padding: '6px 12px', cursor: 'pointer', color: '#b8ef0b', fontSize: 12, fontWeight: 600,
              display: 'flex', alignItems: 'center', gap: 6,
            }}><FileDown size={13} /> PDF traiteur</button>
          )}
          <button onClick={() => setOpen(v => !v)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.4)', padding: 4 }}>
            {open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
        </div>
      </div>

      {open && (
        present.length === 0 ? (
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.3)', fontStyle: 'italic', margin: 0 }}>
            Aucun invité confirmé pour l'instant.
          </p>
        ) : (
          <>
            {/* Totaux par plat (par personne) */}
            {(summary.some(s => Object.keys(s.counts).length > 0) || totalCake > 0) && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 10, marginBottom: 16 }}>
                {summary.map(s => Object.keys(s.counts).length > 0 && (
                  <div key={s.label} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 10, padding: '10px 14px' }}>
                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>{s.label}</div>
                    {Object.entries(s.counts).map(([opt, n]) => (
                      <div key={opt} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, padding: '2px 0' }}>
                        <span style={{ color: 'rgba(255,255,255,0.7)' }}>{opt}</span>
                        <span style={{ color: '#b8ef0b', fontWeight: 700 }}>{n}</span>
                      </div>
                    ))}
                  </div>
                ))}
                {askCake && totalCake > 0 && (
                  <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 10, padding: '10px 14px' }}>
                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>Gâteau</div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                      <span style={{ color: 'rgba(255,255,255,0.7)' }}>Parts</span>
                      <span style={{ color: '#b8ef0b', fontWeight: 700 }}>{totalCake}</span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Détail par invité → par personne */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {present.map(g => {
                const ppl = peopleOf(g);
                const r = g.menu_response || {};
                const anyAnswer = ppl.some(personAnswered);
                return (
                  <div key={g.id} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 8, padding: '10px 14px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: anyAnswer ? 8 : 0 }}>
                      <span style={{ fontSize: 14, fontWeight: 600, color: 'rgba(255,255,255,0.85)' }}>{g.first_name}</span>
                      {!anyAnswer && <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)', fontStyle: 'italic' }}>· n'a pas encore répondu</span>}
                    </div>
                    {ppl.filter(personAnswered).map((p, i) => (
                      <div key={i} style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 6, padding: '4px 0' }}>
                        <span style={{ fontSize: 11, fontWeight: 700, color: p.kind === 'adult' ? '#b8ef0b' : '#60a5fa', minWidth: 64 }}>
                          {p.name ? `${p.label} · ${p.name}` : p.label}
                        </span>
                        {courses.map(c => p.choices?.[c.key] && (
                          <span key={c.key} style={{ fontSize: 12, padding: '2px 10px', borderRadius: 10, background: 'rgba(184,239,11,0.08)', color: '#b8ef0b', border: '1px solid rgba(184,239,11,0.2)' }}>
                            {c.label} : {p.choices[c.key]}
                          </span>
                        ))}
                        {p.drink && <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12, padding: '2px 10px', borderRadius: 10, background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.6)' }}><Wine size={11} strokeWidth={1.8} /> {p.drink}</span>}
                        {p.dietary && <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12, padding: '2px 10px', borderRadius: 10, background: 'rgba(245,158,11,0.12)', color: '#f59e0b' }}><AlertTriangle size={11} strokeWidth={2} /> {p.dietary}</span>}
                      </div>
                    ))}
                    {(r.cake != null && parseInt(r.cake) > 0) || r.comment ? (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 6 }}>
                        {r.cake != null && parseInt(r.cake) > 0 && <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12, padding: '2px 10px', borderRadius: 10, background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.6)' }}><Cake size={11} strokeWidth={1.8} /> {r.cake} part{parseInt(r.cake) > 1 ? 's' : ''}</span>}
                        {r.comment && <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', fontStyle: 'italic' }}>« {r.comment} »</span>}
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </>
        )
      )}
    </div>
  );
}
