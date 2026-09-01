'use client';
import { useEffect, useState } from 'react';
import { AlertTriangle } from 'lucide-react';

const fmtEur = (v) => v > 0 ? v.toLocaleString('fr-FR', { minimumFractionDigits: 2 }) + ' €' : null;
const fmtDate = (d) => d ? new Date(d + 'T12:00:00').toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }) : '';

/* Bandeau de rappel J-7 → jour J : le solde doit être réglé au plus tard le jour de l'événement,
   mais reste payable en avance (bouton "Payer" actif dès J-7, aligné sur SuiviSection.js
   FacturationTab). Visible sur tous les onglets de l'espace tant que la condition est vraie. */
export default function BillingReminderBanner({ ev, token, visible }) {
  const [invoice, setInvoice] = useState(null);

  useEffect(() => {
    if (!visible || !token || !ev?.id || !ev?.event_date || ev.status === 'annule') return;
    const today    = new Date(); today.setHours(0, 0, 0, 0);
    const eventDay = new Date(ev.event_date + 'T00:00:00');
    const daysLeft = Math.round((eventDay - today) / (1000 * 60 * 60 * 24));
    if (daysLeft < 0 || daysLeft > 7) return;

    fetch(`/api/mon-espace/facturation/${ev.id}`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(d => {
        const balance = (d.invoices || []).find(inv => inv.type === 'balance' && inv.status !== 'paid');
        if (balance) setInvoice(balance);
      })
      .catch(() => {});
  }, [visible, ev?.id, ev?.event_date, ev?.status, token]);

  if (!invoice) return null;

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap',
      background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.25)',
      borderRadius: 12, padding: '14px 20px', marginBottom: 20,
    }}>
      <AlertTriangle size={20} color="#f59e0b" strokeWidth={1.5} style={{ flexShrink: 0 }} />
      <div style={{ flex: 1, minWidth: 220 }}>
        <p style={{ color: '#fff', fontSize: 14, fontWeight: 600, margin: '0 0 2px' }}>
          Votre événement approche !
        </p>
        <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13, margin: 0, lineHeight: 1.5 }}>
          Le solde{invoice.amount > 0 ? ` de ${fmtEur(invoice.amount)}` : ''} doit être réglé au plus tard le jour de votre événement
          {ev.event_date ? ` (${fmtDate(ev.event_date)})` : ''}. Vous pouvez le régler dès maintenant si vous le souhaitez.
        </p>
      </div>
      {invoice.pay_url && (
        <a href={invoice.pay_url} target="_blank" rel="noopener noreferrer" style={{
          flexShrink: 0, background: '#b8ef0b', color: '#060e16', borderRadius: 8, padding: '10px 22px',
          fontFamily: 'var(--font-display), sans-serif', fontWeight: 700, fontSize: 13.5, textDecoration: 'none',
        }}>Payer →</a>
      )}
    </div>
  );
}
