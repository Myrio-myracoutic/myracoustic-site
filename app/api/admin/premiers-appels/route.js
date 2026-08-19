import { verifyAdminCookie } from '@/app/lib/admin-auth';
import { supabaseAdmin } from '@/app/lib/supabase-admin';

/* Vue agrégée en lecture seule des 3 sources de premiers contacts (mariage, particulier/pro
   chiffrés, contact pro simple) — ne fusionne PAS les données, juste un point d'entrée unique
   pour savoir qui rappeler. Le traitement réel (devis builder, détail funnel) reste sur les
   pages d'origine, atteignables via `lienDossier`. lead_magnet_signups exclu : pas de téléphone,
   rien à "rappeler". */
export async function GET() {
  if (!(await verifyAdminCookie())) {
    return Response.json({ error: 'Non autorisé' }, { status: 401 });
  }

  const [{ data: mariageLeads }, { data: quotes }, { data: proContacts }] = await Promise.all([
    supabaseAdmin.from('mariage_leads')
      .select('id, created_at, prenom, nom, tel, email, event_date, call_scheduled_at, call_cancelled_at')
      .order('created_at', { ascending: false }).limit(100),
    supabaseAdmin.from('qonto_quotes_tracking')
      .select('id, created_at, client_first_name, client_last_name, client_phone, client_email, client_kind, event_date, call_scheduled_at, call_cancelled_at')
      .or('event_type.is.null,event_type.neq.Mariage')
      .order('created_at', { ascending: false }).limit(100),
    supabaseAdmin.from('pro_contact_leads')
      .select('id, created_at, prenom, nom, tel, email, event_date, call_scheduled_at, call_cancelled_at')
      .order('created_at', { ascending: false }).limit(100),
  ]);

  const rows = [
    ...(mariageLeads || []).map(l => ({
      id: l.id, source: 'mariage_leads', kind: 'mariage', vertical: 'mariage',
      nom: `${l.prenom || ''} ${l.nom || ''}`.trim(), tel: l.tel, email: l.email,
      dateActivite: l.created_at, eventDate: l.event_date,
      callScheduledAt: l.call_scheduled_at, callCancelledAt: l.call_cancelled_at,
      lienDossier: '/admin/leads-mariage',
    })),
    ...(quotes || []).map(q => ({
      id: q.id, source: 'qonto_quotes_tracking', kind: 'devis', vertical: q.client_kind === 'company' ? 'professionnel' : 'particulier',
      nom: `${q.client_first_name || ''} ${q.client_last_name || ''}`.trim(), tel: q.client_phone, email: q.client_email,
      dateActivite: q.created_at, eventDate: q.event_date,
      callScheduledAt: q.call_scheduled_at, callCancelledAt: q.call_cancelled_at,
      lienDossier: '/admin/prospects',
    })),
    ...(proContacts || []).map(p => ({
      id: p.id, source: 'pro_contact_leads', kind: 'pro_contact', vertical: 'professionnel',
      nom: `${p.prenom || ''} ${p.nom || ''}`.trim(), tel: p.tel, email: p.email,
      dateActivite: p.created_at, eventDate: p.event_date,
      callScheduledAt: p.call_scheduled_at, callCancelledAt: p.call_cancelled_at,
      lienDossier: '/admin/prospects',
    })),
  ];

  // Tri par urgence : appel programmé (non annulé) le plus proche d'abord, puis plus récent d'abord.
  const now = Date.now();
  rows.sort((a, b) => {
    const aCall = a.callScheduledAt && !a.callCancelledAt ? new Date(a.callScheduledAt).getTime() : null;
    const bCall = b.callScheduledAt && !b.callCancelledAt ? new Date(b.callScheduledAt).getTime() : null;
    if (aCall !== null && bCall !== null) return aCall - bCall;
    if (aCall !== null) return -1;
    if (bCall !== null) return 1;
    return new Date(b.dateActivite).getTime() - new Date(a.dateActivite).getTime();
  });

  return Response.json({ rows });
}
