'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

const STATUS = {
  devis_envoye: { label: 'Devis envoyé',  color: '#f59e0b' },
  accepte:      { label: 'Accepté',        color: '#b8ef0b' },
  confirme:     { label: 'Confirmé',       color: '#22c55e' },
  termine:      { label: 'Terminé',        color: '#9ca3af' },
  annule:       { label: 'Annulé',         color: '#ef4444' },
};

function StatCard({ label, value, sub, accent }) {
  return (
    <div style={{
      background: '#0d1b2a', borderRadius: 14, padding: '22px 24px',
      border: '1px solid rgba(255,255,255,0.06)', flex: '1 1 180px',
    }}>
      <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', margin: '0 0 10px' }}>{label}</p>
      <p style={{ fontSize: 36, fontWeight: 800, color: accent || '#fff', margin: '0 0 6px', fontFamily: 'var(--font-display), sans-serif', lineHeight: 1 }}>{value}</p>
      {sub && <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.35)', margin: 0 }}>{sub}</p>}
    </div>
  );
}

function BarChart({ data }) {
  const max = Math.max(...data.map(d => d.count), 1);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {data.map(d => (
        <div key={d.key} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', width: 28, textAlign: 'right', flexShrink: 0 }}>{d.label}</span>
          <div style={{ flex: 1, background: 'rgba(255,255,255,0.07)', borderRadius: 6, height: 28, overflow: 'hidden', position: 'relative' }}>
            <div style={{
              width: `${(d.count / max) * 100}%`, minWidth: d.count > 0 ? 4 : 0,
              height: '100%', background: 'linear-gradient(90deg, #b8ef0b, #a0d908)',
              borderRadius: 6, transition: 'width 0.6s ease',
            }} />
          </div>
          <span style={{ fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.7)', width: 16, textAlign: 'right', flexShrink: 0 }}>{d.count}</span>
        </div>
      ))}
    </div>
  );
}

function StatusBreakdown({ byStatus, total }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {Object.entries(STATUS).map(([key, s]) => {
        const count = byStatus[key] || 0;
        const pct = total > 0 ? Math.round((count / total) * 100) : 0;
        return (
          <div key={key}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
              <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', fontWeight: 500 }}>{s.label}</span>
              <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.35)' }}>{count} <span style={{ color: 'rgba(255,255,255,0.2)' }}>({pct}%)</span></span>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.07)', borderRadius: 4, height: 6 }}>
              <div style={{ width: `${pct}%`, height: '100%', background: s.color, borderRadius: 4, transition: 'width 0.6s ease' }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

// Barres de répartition génériques (même pattern visuel que StatusBreakdown, mais pour des
// segments arbitraires — non convertis/perdu/etc. n'ont pas de vocabulaire fixe comme STATUS).
function SegmentBreakdown({ segments, total }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {segments.map(s => {
        const pct = total > 0 ? Math.round((s.count / total) * 100) : 0;
        return (
          <div key={s.label}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
              <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', fontWeight: 500 }}>{s.label}</span>
              <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.35)' }}>{s.count} <span style={{ color: 'rgba(255,255,255,0.2)' }}>({pct}%)</span></span>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.07)', borderRadius: 4, height: 6 }}>
              <div style={{ width: `${pct}%`, height: '100%', background: s.color, borderRadius: 4, transition: 'width 0.6s ease' }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function fmtDate(d) {
  if (!d) return '—';
  return new Date(d + 'T12:00:00').toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
}

function fmtEuro(n) {
  return `${Math.round(n).toLocaleString('fr-FR')} €`;
}

function DeltaBadge({ pct, label }) {
  if (pct === null || pct === undefined) {
    return <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)' }}>{label} : pas d'historique</span>;
  }
  const positive = pct >= 0;
  const color = pct === 0 ? 'rgba(255,255,255,0.35)' : positive ? '#6fcf7a' : '#ef6f79';
  const arrow = pct === 0 ? '' : positive ? '▲' : '▼';
  return (
    <span style={{ fontSize: 11, color }}>
      {arrow} {Math.abs(pct)}% <span style={{ color: 'rgba(255,255,255,0.3)' }}>{label}</span>
    </span>
  );
}

function KpiCard({ label, value, deltaPrevPct, deltaYearPct, previousYearAvailable, sub }) {
  return (
    <div style={{
      background: '#0d1b2a', borderRadius: 14, padding: '20px 22px',
      border: '1px solid rgba(255,255,255,0.06)', flex: '1 1 200px',
    }}>
      <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', margin: '0 0 8px' }}>{label}</p>
      <p style={{ fontSize: 30, fontWeight: 800, color: '#fff', margin: '0 0 8px', fontFamily: 'var(--font-display), sans-serif', lineHeight: 1 }}>{value}</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        <DeltaBadge pct={deltaPrevPct} label="vs période préc." />
        {previousYearAvailable
          ? <DeltaBadge pct={deltaYearPct} label="vs année préc." />
          : <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.2)' }}>vs année préc. : pas encore d'historique</span>}
      </div>
      {sub && <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)', margin: '8px 0 0' }}>{sub}</p>}
    </div>
  );
}

const VERTICAL_TABS = [
  { key: 'global', label: 'Global' },
  { key: 'mariage', label: 'Mariage' },
  { key: 'particulier', label: 'Particulier' },
  { key: 'professionnel', label: 'Pro' },
];
const PERIOD_TABS = [
  { key: 'week', label: 'Semaine' },
  { key: 'month', label: 'Mois' },
  { key: 'year', label: 'Année' },
];

function TabButton({ active, onClick, children }) {
  return (
    <button onClick={onClick} style={{
      padding: '7px 16px', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer',
      fontFamily: 'var(--font-display), sans-serif',
      background: active ? '#b8ef0b' : 'rgba(255,255,255,0.05)',
      color: active ? '#060e16' : 'rgba(255,255,255,0.6)',
      border: active ? 'none' : '1px solid rgba(255,255,255,0.1)',
    }}>
      {children}
    </button>
  );
}

function KpiDashboard() {
  const [period, setPeriod] = useState('month');
  const [vertical, setVertical] = useState('global');
  const [kpis, setKpis] = useState(null);

  useEffect(() => {
    setKpis(null);
    fetch(`/api/admin/kpis?period=${period}`)
      .then(r => r.json())
      .then(d => setKpis(d));
  }, [period]);

  return (
    <div style={{ background: '#0d1b2a', borderRadius: 14, padding: '24px 28px', border: '1px solid rgba(255,255,255,0.06)', marginBottom: 28 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <h2 style={{ fontSize: 15, fontWeight: 700, color: 'rgba(255,255,255,0.85)', margin: 0, fontFamily: 'var(--font-display), sans-serif' }}>
          Indicateurs clés {kpis ? `— ${kpis.range.label}` : ''}
        </h2>
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', gap: 6 }}>
            {PERIOD_TABS.map(t => <TabButton key={t.key} active={period === t.key} onClick={() => setPeriod(t.key)}>{t.label}</TabButton>)}
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            {VERTICAL_TABS.map(t => <TabButton key={t.key} active={vertical === t.key} onClick={() => setVertical(t.key)}>{t.label}</TabButton>)}
          </div>
        </div>
      </div>

      {!kpis ? (
        <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 13 }}>Chargement…</p>
      ) : (
        <>
          <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginBottom: 14 }}>
            {(() => {
              const k = kpis.kpis[vertical];
              const pya = kpis.previousYearAvailable;
              return (
                <>
                  <KpiCard label="Devis envoyés" value={k.devis_envoyes.value} deltaPrevPct={k.devis_envoyes.deltaPrevPct} deltaYearPct={k.devis_envoyes.deltaYearPct} previousYearAvailable={pya} sub="Propositions/devis chiffrés envoyés au client" />
                  <KpiCard label="Taux de transformation" value={k.taux_transformation.value !== null ? `${k.taux_transformation.value}%` : '—'} deltaPrevPct={k.taux_transformation.deltaPrevPct} deltaYearPct={null} previousYearAvailable={false} sub={k.taux_transformation.caveat} />
                  <KpiCard label="Taux de prise en charge" value={k.taux_prise_en_charge.value !== null ? `${k.taux_prise_en_charge.value}%` : '—'} deltaPrevPct={k.taux_prise_en_charge.deltaPrevPct} deltaYearPct={null} previousYearAvailable={false} sub={k.taux_prise_en_charge.caveat} />
                  <KpiCard label="Taux de conversion" value={k.taux_conversion.value !== null ? `${k.taux_conversion.value}%` : '—'} deltaPrevPct={k.taux_conversion.deltaPrevPct} deltaYearPct={null} previousYearAvailable={false} sub={k.taux_conversion.caveat} />
                  <KpiCard label="Prospects entrants" value={k.prospects_entrants.value} deltaPrevPct={k.prospects_entrants.deltaPrevPct} deltaYearPct={k.prospects_entrants.deltaYearPct} previousYearAvailable={pya} />
                  <KpiCard label="Clients confirmés" value={k.clients_confirmes.value} deltaPrevPct={k.clients_confirmes.deltaPrevPct} deltaYearPct={k.clients_confirmes.deltaYearPct} previousYearAvailable={pya} />
                </>
              );
            })()}
          </div>

          <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginBottom: vertical === 'global' ? 24 : 0 }}>
            {(() => {
              const k = kpis.kpis[vertical];
              const pya = kpis.previousYearAvailable;
              return (
                <>
                  <KpiCard label="CA signé" value={fmtEuro(k.ca_signe.value)} deltaPrevPct={k.ca_signe.deltaPrevPct} deltaYearPct={k.ca_signe.deltaYearPct} previousYearAvailable={pya} sub="Sur la période sélectionnée — devis acceptés, synchronisé depuis Qonto" />
                  <KpiCard label="CA encaissé" value={fmtEuro(k.ca_encaisse.value)} deltaPrevPct={k.ca_encaisse.deltaPrevPct} deltaYearPct={k.ca_encaisse.deltaYearPct} previousYearAvailable={pya} sub="Sur la période sélectionnée — paiements réellement reçus" />
                </>
              );
            })()}
          </div>

          {(() => {
            const k = kpis.kpis[vertical];
            if (k.devis_envoyes.value === 0) return null;
            return (
              <div style={{ marginTop: 4, marginBottom: 24 }}>
                <h3 style={{ fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.6)', margin: '0 0 4px', fontFamily: 'var(--font-display), sans-serif' }}>
                  Devis envoyés — converti / en attente / perdu
                </h3>
                <p style={{ fontSize: 11.5, color: 'rgba(255,255,255,0.25)', margin: '0 0 14px' }}>
                  {k.taux_perte.caveat}
                </p>
                <SegmentBreakdown
                  total={k.devis_envoyes.value}
                  segments={[
                    { label: 'Converti', count: k.devis_envoyes.value - k.devis_en_attente.value - k.devis_perdus.value, color: '#22c55e' },
                    { label: 'En attente', count: k.devis_en_attente.value, color: '#f59e0b' },
                    { label: 'Perdu', count: k.devis_perdus.value, color: '#ef4444' },
                  ]}
                />
              </div>
            );
          })()}

          {(() => {
            const k = kpis.kpis[vertical];
            const entries = Object.entries(k.sources || {});
            if (!entries.length) return null;
            const totalEntrants = entries.reduce((s, [, v]) => s + v.entrants, 0);
            const SOURCE_LABELS = { google_ads: 'Google Ads', recherche_google: 'Recherche Google', reseaux_sociaux: 'Réseaux sociaux', bouche_a_oreille: 'Bouche-à-oreille', salon_du_mariage: 'Salon du mariage', autre: 'Autre', inconnu: 'Inconnu' };
            entries.sort((a, b) => b[1].entrants - a[1].entrants);
            return (
              <div style={{ marginTop: 4, marginBottom: 24 }}>
                <h3 style={{ fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.6)', margin: '0 0 4px', fontFamily: 'var(--font-display), sans-serif' }}>
                  Origine des prospects
                </h3>
                <p style={{ fontSize: 11.5, color: 'rgba(255,255,255,0.25)', margin: '0 0 14px' }}>
                  {kpis.caveats?.sources}
                </p>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                        <th style={{ textAlign: 'left', padding: '8px 10px', color: 'rgba(255,255,255,0.35)', fontWeight: 600 }}>Origine</th>
                        <th style={{ textAlign: 'right', padding: '8px 10px', color: 'rgba(255,255,255,0.35)', fontWeight: 600 }}>Entrants</th>
                        <th style={{ textAlign: 'right', padding: '8px 10px', color: 'rgba(255,255,255,0.35)', fontWeight: 600 }}>Convertis</th>
                        <th style={{ textAlign: 'right', padding: '8px 10px', color: 'rgba(255,255,255,0.35)', fontWeight: 600 }}>Taux</th>
                        <th style={{ textAlign: 'right', padding: '8px 10px', color: 'rgba(255,255,255,0.35)', fontWeight: 600 }}>% du total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {entries.map(([key, v]) => {
                        const taux = v.entrants > 0 ? Math.round((v.convertis / v.entrants) * 1000) / 10 : null;
                        const pctTotal = totalEntrants > 0 ? Math.round((v.entrants / totalEntrants) * 100) : 0;
                        return (
                          <tr key={key} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                            <td style={{ padding: '9px 10px', color: key === 'inconnu' ? 'rgba(255,255,255,0.4)' : 'rgba(255,255,255,0.75)', fontWeight: 600 }}>{SOURCE_LABELS[key] || key}</td>
                            <td style={{ padding: '9px 10px', textAlign: 'right', color: 'rgba(255,255,255,0.7)' }}>{v.entrants}</td>
                            <td style={{ padding: '9px 10px', textAlign: 'right', color: 'rgba(255,255,255,0.7)' }}>{v.convertis}</td>
                            <td style={{ padding: '9px 10px', textAlign: 'right', color: taux === null ? 'rgba(255,255,255,0.2)' : 'var(--lime)', fontWeight: 600 }}>{taux !== null ? `${taux}%` : '—'}</td>
                            <td style={{ padding: '9px 10px', textAlign: 'right', color: 'rgba(255,255,255,0.4)' }}>{pctTotal}%</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })()}

          {vertical === 'global' && (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                    <th style={{ textAlign: 'left', padding: '8px 10px', color: 'rgba(255,255,255,0.35)', fontWeight: 600 }}>Verticale</th>
                    <th style={{ textAlign: 'right', padding: '8px 10px', color: 'rgba(255,255,255,0.35)', fontWeight: 600 }}>Devis envoyés</th>
                    <th style={{ textAlign: 'right', padding: '8px 10px', color: 'rgba(255,255,255,0.35)', fontWeight: 600 }}>CA signé</th>
                    <th style={{ textAlign: 'right', padding: '8px 10px', color: 'rgba(255,255,255,0.35)', fontWeight: 600 }}>CA encaissé</th>
                    <th style={{ textAlign: 'right', padding: '8px 10px', color: 'rgba(255,255,255,0.35)', fontWeight: 600 }}>Clients</th>
                    <th style={{ textAlign: 'right', padding: '8px 10px', color: 'rgba(255,255,255,0.35)', fontWeight: 600 }}>Prospects</th>
                  </tr>
                </thead>
                <tbody>
                  {['mariage', 'particulier', 'professionnel'].map(v => {
                    const k = kpis.kpis[v];
                    const vLabel = VERTICAL_TABS.find(t => t.key === v).label;
                    return (
                      <tr key={v} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                        <td style={{ padding: '9px 10px', color: 'rgba(255,255,255,0.75)', fontWeight: 600 }}>{vLabel}</td>
                        <td style={{ padding: '9px 10px', textAlign: 'right', color: 'rgba(255,255,255,0.7)' }}>{k.devis_envoyes.value}</td>
                        <td style={{ padding: '9px 10px', textAlign: 'right', color: 'rgba(255,255,255,0.7)' }}>{fmtEuro(k.ca_signe.value)}</td>
                        <td style={{ padding: '9px 10px', textAlign: 'right', color: 'rgba(255,255,255,0.7)' }}>{fmtEuro(k.ca_encaisse.value)}</td>
                        <td style={{ padding: '9px 10px', textAlign: 'right', color: 'rgba(255,255,255,0.7)' }}>{k.clients_confirmes.value}</td>
                        <td style={{ padding: '9px 10px', textAlign: 'right', color: 'rgba(255,255,255,0.7)' }}>{k.prospects_entrants.value}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          <div style={{ marginTop: 28, paddingTop: 24, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
            <h3 style={{ fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.6)', margin: '0 0 4px', fontFamily: 'var(--font-display), sans-serif' }}>
              Prévisionnel — {VERTICAL_TABS.find(t => t.key === vertical).label}
            </h3>
            <p style={{ fontSize: 11.5, color: 'rgba(255,255,255,0.25)', margin: '0 0 16px' }}>
              Vue sur l'ensemble des contrats actifs à ce jour, sans filtre de période (semaine/mois/année n'a pas de sens ici).
            </p>
            {(() => {
              const p = kpis.previsionnel[vertical];
              return (
                <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginBottom: 12 }}>
                  <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 10, padding: '14px 18px', flex: '1 1 160px' }}>
                    <p style={{ fontSize: 10.5, color: 'rgba(255,255,255,0.35)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 6px' }}>Total signé</p>
                    <p style={{ fontSize: 22, fontWeight: 800, color: '#fff', margin: 0, fontFamily: 'var(--font-display), sans-serif' }}>{fmtEuro(p.signe)}</p>
                  </div>
                  <div style={{ background: 'rgba(111,207,122,0.06)', borderRadius: 10, padding: '14px 18px', flex: '1 1 160px', border: '1px solid rgba(111,207,122,0.15)' }}>
                    <p style={{ fontSize: 10.5, color: 'rgba(255,255,255,0.35)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 6px' }}>Déjà encaissé</p>
                    <p style={{ fontSize: 22, fontWeight: 800, color: '#6fcf7a', margin: 0, fontFamily: 'var(--font-display), sans-serif' }}>{fmtEuro(p.encaisse)}</p>
                  </div>
                  <div style={{ background: 'rgba(184,239,11,0.06)', borderRadius: 10, padding: '14px 18px', flex: '1 1 160px', border: '1px solid rgba(184,239,11,0.18)' }}>
                    <p style={{ fontSize: 10.5, color: 'rgba(255,255,255,0.35)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 6px' }}>Reste à encaisser</p>
                    <p style={{ fontSize: 22, fontWeight: 800, color: 'var(--lime)', margin: 0, fontFamily: 'var(--font-display), sans-serif' }}>{fmtEuro(p.resteAEncaisser)}</p>
                  </div>
                </div>
              );
            })()}
            {kpis.previsionnel[vertical].incomplet && (
              <p style={{ fontSize: 11.5, color: '#f2b84b', margin: '0 0 20px', display: 'flex', alignItems: 'flex-start', gap: 6 }}>
                ⚠️ L'encaissé dépasse le signé connu ici — pas un vrai dépassement : des contrats antérieurs au 05/08 (avant la mise en place du suivi) ont un encaissement bien réel et compté, mais leur montant "signé" d'origine n'a jamais été enregistré. Rien d'inventé, juste incomplet pour ces anciens dossiers.
              </p>
            )}

            <h3 style={{ fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.6)', margin: '20px 0 4px', fontFamily: 'var(--font-display), sans-serif' }}>
              Devis envoyés par mois, par verticale
            </h3>
            <p style={{ fontSize: 11.5, color: 'rgba(255,255,255,0.25)', margin: '0 0 16px' }}>
              Suivi de cohorte réel : pour les devis envoyés un mois donné, combien ont été convertis à ce jour — peu importe quand la conversion a eu lieu. Les mois récents sont encore susceptibles d'évoluer (réponse du client en attente).
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16 }}>
              {VERTICAL_TABS.filter(t => t.key !== 'global').map(t => (
                <div key={t.key}>
                  <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'rgba(255,255,255,0.4)', margin: '0 0 8px' }}>{t.label}</p>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5 }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                        <th style={{ textAlign: 'left', padding: '5px 6px', color: 'rgba(255,255,255,0.3)', fontWeight: 600 }}>Mois</th>
                        <th style={{ textAlign: 'right', padding: '5px 6px', color: 'rgba(255,255,255,0.3)', fontWeight: 600 }}>Envoyés</th>
                        <th style={{ textAlign: 'right', padding: '5px 6px', color: 'rgba(255,255,255,0.3)', fontWeight: 600 }}>Convertis</th>
                        <th style={{ textAlign: 'right', padding: '5px 6px', color: 'rgba(255,255,255,0.3)', fontWeight: 600 }}>Taux</th>
                      </tr>
                    </thead>
                    <tbody>
                      {kpis.monthlyTrend.map(row => {
                        const m = row[t.key];
                        return (
                          <tr key={row.month} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                            <td style={{ padding: '6px', color: 'rgba(255,255,255,0.6)' }}>{row.label}</td>
                            <td style={{ padding: '6px', textAlign: 'right', color: 'rgba(255,255,255,0.7)' }}>{m.envoyes}</td>
                            <td style={{ padding: '6px', textAlign: 'right', color: 'rgba(255,255,255,0.7)' }}>{m.convertis}</td>
                            <td style={{ padding: '6px', textAlign: 'right', color: m.taux === null ? 'rgba(255,255,255,0.2)' : 'var(--lime)', fontWeight: 600 }}>{m.taux !== null ? `${m.taux}%` : '—'}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function daysUntil(d) {
  if (!d) return null;
  const diff = Math.round((new Date(d + 'T12:00:00') - new Date()) / (1000 * 60 * 60 * 24));
  if (diff === 0) return "Aujourd'hui";
  if (diff === 1) return 'Demain';
  if (diff < 0) return 'Passé';
  return `J-${diff}`;
}

export default function AdminDashboard() {
  const router = useRouter();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/stats')
      .then(r => { if (r.status === 401) { router.replace('/admin/login'); return null; } return r.json(); })
      .then(d => { if (d) { setStats(d); setLoading(false); } });
  }, []);

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
      <div style={{ width: 28, height: 28, border: '3px solid rgba(255,255,255,0.08)', borderTop: '3px solid #b8ef0b', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  const ne = stats.nextEvent;
  const nextDateStr = ne ? fmtDate(ne.event_date) : null;
  const countdown = ne ? daysUntil(ne.event_date) : null;

  return (
    <div style={{ padding: '36px 36px 60px' }}>

      {/* En-tête */}
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontFamily: 'var(--font-display), sans-serif', fontSize: 26, fontWeight: 800, color: '#fff', margin: '0 0 4px' }}>
          Vue d'ensemble
        </h1>
        <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 14, margin: 0 }}>
          {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
        </p>
      </div>

      <KpiDashboard />

      {/* Cartes stats */}
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 28 }}>
        <StatCard label="Total devis" value={stats.total} sub={`${stats.thisMonthCount} ce mois`} />
        <StatCard label="Taux de conversion" value={`${stats.conversionRate}%`} sub={`${stats.converted} acceptés ou confirmés`} accent="#b8ef0b" />
        <StatCard label="Clients" value={stats.totalClients} sub="comptes actifs" />
        {ne ? (
          <div style={{
            background: 'rgba(184,239,11,0.06)', borderRadius: 14, padding: '22px 24px',
            border: '1px solid rgba(184,239,11,0.18)', flex: '1 1 180px',
          }}>
            <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', margin: '0 0 10px' }}>Prochain événement</p>
            <p style={{ fontSize: 28, fontWeight: 800, color: '#b8ef0b', margin: '0 0 4px', fontFamily: 'var(--font-display), sans-serif', lineHeight: 1 }}>{countdown}</p>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', margin: 0 }}>
              {ne.clients?.first_name} · {ne.event_type} · {nextDateStr}
            </p>
          </div>
        ) : (
          <StatCard label="Prochain événement" value="—" sub="Aucun à venir" />
        )}
      </div>

      {/* Graphiques */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20, marginBottom: 28 }}>
        <div style={{ background: '#0d1b2a', borderRadius: 14, padding: '24px 28px', border: '1px solid rgba(255,255,255,0.06)' }}>
          <h2 style={{ fontSize: 15, fontWeight: 700, color: 'rgba(255,255,255,0.85)', margin: '0 0 20px', fontFamily: 'var(--font-display), sans-serif' }}>
            Devis par mois
          </h2>
          <BarChart data={stats.byMonth} />
        </div>
        <div style={{ background: '#0d1b2a', borderRadius: 14, padding: '24px 28px', border: '1px solid rgba(255,255,255,0.06)' }}>
          <h2 style={{ fontSize: 15, fontWeight: 700, color: 'rgba(255,255,255,0.85)', margin: '0 0 20px', fontFamily: 'var(--font-display), sans-serif' }}>
            Répartition par statut
          </h2>
          <StatusBreakdown byStatus={stats.byStatus} total={stats.total} />
        </div>
      </div>

      {/* Activité récente */}
      <div style={{ background: '#0d1b2a', borderRadius: 14, padding: '24px 28px', border: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h2 style={{ fontSize: 15, fontWeight: 700, color: 'rgba(255,255,255,0.85)', margin: 0, fontFamily: 'var(--font-display), sans-serif' }}>
            Activité récente
          </h2>
          <a href="/admin/evenements" style={{ fontSize: 13, color: '#b8ef0b', textDecoration: 'none', fontWeight: 600 }}>Voir tout →</a>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
          {stats.recentEvents.map((ev, i) => {
            const st = STATUS[ev.status] || STATUS.devis_envoye;
            return (
              <div
                key={ev.id}
                onClick={() => router.push(`/admin/evenements/${ev.id}`)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 16, padding: '13px 0', cursor: 'pointer',
                  borderBottom: i < stats.recentEvents.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none',
                  transition: 'background 0.15s', borderRadius: 6,
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <div style={{
                  width: 38, height: 38, borderRadius: '50%',
                  background: `${st.color}18`, color: st.color,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 13, fontWeight: 700, flexShrink: 0,
                }}>
                  {ev.clients?.first_name?.[0]}{ev.clients?.last_name?.[0]}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 14, fontWeight: 600, color: 'rgba(255,255,255,0.85)', margin: '0 0 2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {ev.clients?.first_name} {ev.clients?.last_name}
                  </p>
                  <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', margin: 0 }}>
                    {ev.event_type || '—'} · {fmtDate(ev.event_date)}
                  </p>
                </div>
                <span style={{
                  background: `${st.color}15`, color: st.color,
                  border: `1px solid ${st.color}35`,
                  borderRadius: 20, padding: '3px 10px', fontSize: 11, fontWeight: 600,
                  whiteSpace: 'nowrap', flexShrink: 0,
                }}>{st.label}</span>
                <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: 14 }}>›</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
