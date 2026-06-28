/* Génère un PDF du récapitulatif menu (via la fenêtre d'impression du navigateur),
   destiné au traiteur. Même procédé que le Programme PDF — aucune dépendance.
   Signature : printMenu({ courses, ask, present, event })
   - courses : [{ key, label, options }]
   - ask     : { dietary, cake, drinks, comment }
   - present : invités présents (avec menu_response.people)
   - event   : { type, client, date, city }                                    */
export function printMenu({ courses, ask, present, event }) {
  const esc = (s) => String(s ?? '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  const peopleOf = (g) => {
    const list = g.menu_response?.people || [];
    let a = 0, c = 0;
    return list.map(p => ({ ...p, label: p.kind === 'adult' ? `Adulte ${++a}` : `Enfant ${++c}` }));
  };
  const answered = (p) => (p.choices && Object.keys(p.choices).length > 0) || p.dietary || p.drink;

  // Totaux par plat (par personne)
  const summary = courses.map(c => {
    const counts = {};
    for (const g of present) for (const p of peopleOf(g)) {
      const ch = p.choices?.[c.key];
      if (ch) counts[ch] = (counts[ch] || 0) + 1;
    }
    return { label: c.label, counts };
  });
  const totalCake   = present.reduce((s, g) => s + (parseInt(g.menu_response?.cake) || 0), 0);
  const totalPeople = present.reduce((s, g) => s + peopleOf(g).filter(answered).length, 0);

  // Cartes de totaux
  const totalsCards = summary
    .filter(s => Object.keys(s.counts).length > 0)
    .map(s => `
      <div class="tcard">
        <div class="tcard-title">${esc(s.label)}</div>
        ${Object.entries(s.counts).map(([opt, n]) =>
          `<div class="tline"><span>${esc(opt)}</span><span class="tn">${n}</span></div>`).join('')}
      </div>`).join('')
    + (ask.cake && totalCake > 0
        ? `<div class="tcard"><div class="tcard-title">Gâteau</div><div class="tline"><span>Parts</span><span class="tn">${totalCake}</span></div></div>`
        : '');

  // Lignes du tableau par convive
  let rows = '';
  for (const g of present) {
    const ppl = peopleOf(g).filter(answered);
    ppl.forEach((p, i) => {
      const who = p.name ? `${p.label} · ${p.name}` : p.label;
      const courseCells = courses.map(c => `<td>${esc(p.choices?.[c.key] || '—')}</td>`).join('');
      rows += `<tr>
        <td class="guest">${i === 0 ? esc(g.first_name) : ''}</td>
        <td>${esc(who)}</td>
        ${courseCells}
        ${ask.dietary ? `<td class="${p.dietary ? 'warn' : 'muted'}">${esc(p.dietary || '—')}</td>` : ''}
        ${ask.drinks  ? `<td>${esc(p.drink || '—')}</td>` : ''}
      </tr>`;
    });
  }

  // Allergies (mises en avant)
  const allergies = [];
  for (const g of present) for (const p of peopleOf(g)) if (p.dietary)
    allergies.push(`<li><strong>${esc(g.first_name)} · ${esc(p.name ? `${p.label} (${p.name})` : p.label)}</strong> — ${esc(p.dietary)}</li>`);

  // Commentaires
  const comments = present.filter(g => g.menu_response?.comment)
    .map(g => `<li><strong>${esc(g.first_name)}</strong> : « ${esc(g.menu_response.comment)} »</li>`);

  const headCols = ['Invité', 'Convive', ...courses.map(c => esc(c.label))];
  if (ask.dietary) headCols.push('Allergies / régime');
  if (ask.drinks)  headCols.push('Boisson');

  const date = event?.date
    ? new Date(event.date + 'T12:00:00').toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
    : '';

  const html = `<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8"><title>Menu — ${esc(event?.type || 'Événement')}</title>
<style>
  @page { size: A4; margin: 0; }
  * { box-sizing: border-box; margin: 0; padding: 0; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  body { font-family: 'Helvetica Neue', Arial, sans-serif; background: #fff; color: #1a1a2e; }
  .header { background: #060e16; padding: 28px 36px 24px; display: flex; align-items: flex-start; justify-content: space-between; }
  .brand-name { font-size: 18px; font-weight: 900; letter-spacing: 0.15em; text-transform: uppercase; color: #b8ef0b; }
  .brand-tag { font-size: 10px; color: rgba(255,255,255,0.4); letter-spacing: 0.08em; margin-top: 3px; text-transform: uppercase; }
  .header-contact p { font-size: 11px; color: rgba(255,255,255,0.45); line-height: 1.8; text-align: right; }
  .accent-bar { height: 4px; background: #b8ef0b; }
  .event-block { padding: 28px 36px 20px; border-bottom: 1px solid #e8e8f0; }
  .event-type { font-size: 26px; font-weight: 800; color: #060e16; letter-spacing: -0.02em; margin-bottom: 6px; text-transform: uppercase; }
  .client-name { font-size: 15px; color: #444; font-weight: 500; margin-bottom: 10px; }
  .meta-pills { display: flex; gap: 10px; flex-wrap: wrap; }
  .pill { font-size: 11px; font-weight: 600; color: #060e16; background: #f0f0f5; border-radius: 20px; padding: 4px 12px; }
  .pill-accent { background: #b8ef0b; }
  .section-title { padding: 22px 36px 10px; font-size: 10px; font-weight: 800; color: #999; letter-spacing: 0.15em; text-transform: uppercase; }
  .totals { display: flex; flex-wrap: wrap; gap: 10px; padding: 0 36px; }
  .tcard { border: 1px solid #e8e8f0; border-radius: 8px; padding: 10px 14px; min-width: 150px; }
  .tcard-title { font-size: 10px; font-weight: 800; color: #999; letter-spacing: 0.05em; text-transform: uppercase; margin-bottom: 6px; }
  .tline { display: flex; justify-content: space-between; font-size: 13px; padding: 2px 0; gap: 16px; }
  .tn { font-weight: 800; color: #4a6c0a; }
  table { width: calc(100% - 72px); margin: 0 36px; border-collapse: collapse; font-size: 12px; }
  thead th { background: #060e16; color: #fff; font-size: 10px; text-transform: uppercase; letter-spacing: 0.04em; padding: 8px 10px; text-align: left; }
  tbody td { border-bottom: 1px solid #ececf2; padding: 7px 10px; vertical-align: top; }
  tbody tr:nth-child(even) td { background: #fafafc; }
  td.guest { font-weight: 700; color: #060e16; }
  td.warn { color: #b45309; font-weight: 600; background: #fff7ed !important; }
  td.muted { color: #bbb; }
  .alert { margin: 18px 36px 0; border: 1px solid #fed7aa; background: #fff7ed; border-radius: 8px; padding: 12px 16px; }
  .alert-title { font-size: 11px; font-weight: 800; color: #b45309; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 6px; }
  .alert ul, .notes ul { list-style: none; }
  .alert li { font-size: 12px; color: #7c2d12; padding: 2px 0; }
  .notes { margin: 14px 36px 0; }
  .notes-title { font-size: 10px; font-weight: 800; color: #999; letter-spacing: 0.1em; text-transform: uppercase; margin-bottom: 6px; }
  .notes li { font-size: 12px; color: #555; padding: 2px 0; font-style: italic; }
  .footer { margin-top: 28px; background: #f7f7fa; border-top: 1px solid #e8e8f0; padding: 16px 36px; display: flex; align-items: center; justify-content: space-between; }
  .footer-brand { font-size: 11px; font-weight: 700; color: #060e16; letter-spacing: 0.08em; text-transform: uppercase; }
  .footer-info { font-size: 10px; color: #999; text-align: right; line-height: 1.7; }
</style></head><body>
  <div class="header">
    <div><div class="brand-name">Myracoustic</div><div class="brand-tag">De la vibration sonore à la magie lumineuse</div></div>
    <div class="header-contact"><p>07 68 53 33 08</p><p>contact@myracoustic.com</p><p>myracoustic.com</p></div>
  </div>
  <div class="accent-bar"></div>
  <div class="event-block">
    <div class="event-type">Menu — ${esc(event?.type || 'Événement')}</div>
    ${event?.client ? `<div class="client-name">${esc(event.client)}</div>` : ''}
    <div class="meta-pills">
      ${date ? `<span class="pill pill-accent">${date}</span>` : ''}
      ${event?.city ? `<span class="pill">${esc(event.city)}</span>` : ''}
      <span class="pill">${totalPeople} convive${totalPeople > 1 ? 's' : ''}</span>
    </div>
  </div>

  ${totalsCards ? `<div class="section-title">Totaux par plat</div><div class="totals">${totalsCards}</div>` : ''}

  <div class="section-title">Détail par convive</div>
  <table>
    <thead><tr>${headCols.map(h => `<th>${h}</th>`).join('')}</tr></thead>
    <tbody>${rows || `<tr><td colspan="${headCols.length}" style="color:#999;font-style:italic;">Aucune réponse pour l'instant.</td></tr>`}</tbody>
  </table>

  ${allergies.length ? `<div class="alert"><div class="alert-title">⚠ Allergies & régimes à respecter</div><ul>${allergies.join('')}</ul></div>` : ''}
  ${ask.comment && comments.length ? `<div class="notes"><div class="notes-title">Notes des invités</div><ul>${comments.join('')}</ul></div>` : ''}

  <div class="footer">
    <div class="footer-brand">Myracoustic</div>
    <div class="footer-info">Récapitulatif menu — à transmettre au traiteur<br>Généré le ${new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
  </div>
  <script>window.onload = () => { window.print(); window.onafterprint = () => window.close(); }<\/script>
</body></html>`;

  const w = window.open('', '_blank');
  if (!w) { alert('Veuillez autoriser les fenêtres pop-up pour générer le PDF.'); return; }
  w.document.write(html);
  w.document.close();
}
