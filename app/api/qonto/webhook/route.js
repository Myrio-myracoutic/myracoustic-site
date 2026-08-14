import { NextResponse } from 'next/server';
import { parseDateFromHeader } from '@/lib/parse-date-fr';
import { supabaseAdmin } from '@/app/lib/supabase-admin';
import { blockCalendarDay } from '@/lib/google-calendar';

export const dynamic = 'force-dynamic';

const QONTO_BASE = 'https://thirdparty.qonto.com/v2';

function qHeaders() {
  return {
    Authorization: `${process.env.QONTO_LOGIN}:${process.env.QONTO_SECRET_KEY}`,
    'Content-Type': 'application/json',
  };
}

/* Les factures Qonto ne portent aucun champ `quote_id` (vérifié le 14/08/2026 en interrogeant
   l'API en direct — contrairement à ce qu'on supposait ici avant, ce qui empêchait tout
   rattachement à un événement Supabase et donc le blocage automatique de l'agenda). En revanche
   la facture reprend le même en-tête que le devis d'origine ("Événement : ... · Date : ... ·
   Lieu : ..."), et porte l'email du client — on s'appuie sur ces deux infos à la place. */
async function getInvoiceDetails(invoiceId) {
  const res = await fetch(`${QONTO_BASE}/client_invoices/${invoiceId}`, { headers: qHeaders() });
  if (!res.ok) return { date: null, clientEmail: null };
  const data = await res.json();
  const inv = data.client_invoice;

  const date = inv?.performance_start_date
    ? inv.performance_start_date.slice(0, 10)
    : parseDateFromHeader(inv?.header);

  return { date, clientEmail: inv?.client?.email || null };
}

export async function POST(request) {
  try {
    const payload = await request.json();

    // Ignorer tout ce qui n'est pas une facture client payée
    if (payload.type !== 'v1/client-invoices') {
      return NextResponse.json({ ok: true });
    }
    const evt = payload.data?.event;
    const status = payload.data?.status;
    if (evt !== 'updated' || status !== 'paid') {
      return NextResponse.json({ ok: true });
    }

    const invoiceId = payload.data?.id;
    const clientName = payload.data?.client_name || payload.data?.client?.name || 'Client';
    const invoiceNumber = payload.data?.number || invoiceId;

    const { date: eventDate, clientEmail } = await getInvoiceDetails(invoiceId);

    // Mise à jour automatique du statut Supabase — rattachement par email client (+ date
    // d'événement si connue pour désambiguïser un client ayant plusieurs événements).
    if (clientEmail) {
      try {
        const { data: client } = await supabaseAdmin
          .from('clients')
          .select('id')
          .eq('email', clientEmail.toLowerCase())
          .maybeSingle();

        if (client) {
          let eventsQuery = supabaseAdmin
            .from('events')
            .select('id, status')
            .eq('client_id', client.id)
            .neq('status', 'annule');
          if (eventDate) eventsQuery = eventsQuery.eq('event_date', eventDate);

          const { data: matches } = await eventsQuery.order('created_at', { ascending: false }).limit(1);
          const sbEvent = matches?.[0];

          if (sbEvent) {
            // Acompte payé → confirme ; solde payé (déjà confirme) → termine
            const newStatus = sbEvent.status === 'confirme' ? 'termine' : 'confirme';
            await supabaseAdmin.from('events').update({ status: newStatus }).eq('id', sbEvent.id);
            console.log(`Statut événement mis à jour : ${sbEvent.status} → ${newStatus} (client ${clientEmail})`);
          }
        }
      } catch (sbErr) {
        console.error('Supabase status update error:', sbErr.message);
      }
    }

    if (!eventDate) {
      console.log(`Facture ${invoiceNumber} payée — aucune date de prestation trouvée, agenda non mis à jour`);
      return NextResponse.json({ ok: true });
    }

    await blockCalendarDay({
      date: eventDate,
      summary: `🎵 Prestation Myracoustic — ${clientName}`,
      description: `Facture ${invoiceNumber} — Acompte réglé. Date confirmée.`,
    });
    console.log(`Agenda mis à jour : ${eventDate} — ${clientName}`);

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('Qonto webhook error:', err.message);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}
