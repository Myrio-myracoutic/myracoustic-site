import { verifyAdminCookie } from '@/app/lib/admin-auth';
import { supabaseAdmin } from '@/app/lib/supabase-admin';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://myracoustic.com';
const SENDER  = 'contact@myracoustic.com';

async function sendInviteEmail(toEmail, firstName, inviteLink, eventType, clientFirstName) {
  const html = `
<!DOCTYPE html><html lang="fr"><body style="margin:0;padding:0;background:#060e16;font-family:sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:40px 20px;">
<table width="560" cellpadding="0" cellspacing="0" style="background:#0d1b2a;border-radius:12px;overflow:hidden;">
  <tr><td style="padding:32px 40px 24px;text-align:center;border-bottom:1px solid rgba(255,255,255,0.07);">
    <img src="https://myracoustic.com/logo.png" alt="Myracoustic" height="60" style="display:block;margin:0 auto 10px;" />
  </td></tr>
  <tr><td style="padding:40px 40px 32px;">
    <p style="color:rgba(255,255,255,0.6);font-size:15px;margin:0 0 20px;">Bonjour ${firstName},</p>
    <p style="color:rgba(255,255,255,0.85);font-size:15px;line-height:1.7;margin:0 0 16px;">
      <strong style="color:#b8ef0b;">${clientFirstName}</strong> a le plaisir de vous convier à son ${eventType || 'événement'} et vous a préparé une invitation personnelle en ligne.
    </p>
    <p style="color:rgba(255,255,255,0.85);font-size:15px;line-height:1.7;margin:0 0 14px;">
      En quelques clics, et selon ce qui a été prévu, vous pourrez :
    </p>
    <ul style="color:rgba(255,255,255,0.8);font-size:15px;line-height:1.9;margin:0 0 28px;padding-left:20px;">
      <li><strong style="color:#ffffff;">Confirmer votre présence</strong> et le nombre de convives</li>
      <li>Découvrir le <strong style="color:#ffffff;">faire-part</strong> et les <strong style="color:#ffffff;">infos pratiques</strong> du jour J</li>
      <li>Indiquer vos <strong style="color:#ffffff;">choix de menu</strong></li>
      <li>Proposer vos <strong style="color:#ffffff;">chansons préférées</strong> pour la playlist</li>
    </ul>
    <table cellpadding="0" cellspacing="0" style="margin:0 auto 32px;">
      <tr><td style="background:#b8ef0b;border-radius:8px;padding:14px 32px;text-align:center;">
        <a href="${inviteLink}" style="color:#060e16;font-size:15px;font-weight:700;text-decoration:none;">
          Voir mon invitation →
        </a>
      </td></tr>
    </table>
    <p style="color:rgba(255,255,255,0.35);font-size:12px;margin:0;">Ce lien est permanent — conservez cet email pour y revenir à tout moment.</p>
  </td></tr>
  <tr><td style="padding:24px 40px;border-top:1px solid rgba(255,255,255,0.07);text-align:center;">
    <p style="color:rgba(255,255,255,0.35);font-size:13px;font-weight:600;margin:0 0 4px;">Myracoustic — Son, Lumière, Vidéo &amp; DJ</p>
    <p style="color:rgba(255,255,255,0.2);font-size:11px;margin:0;">07 68 53 33 08 · contact@myracoustic.com · myracoustic.com</p>
  </td></tr>
</table></td></tr></table>
</body></html>`;

  await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'api-key': process.env.BREVO_API_KEY },
    body: JSON.stringify({
      sender: { name: 'Myracoustic', email: SENDER },
      to: [{ email: toEmail, name: firstName }],
      replyTo: { email: SENDER, name: 'Myracoustic' },
      subject: `Vous êtes invité(e) au ${eventType || 'événement'} de ${clientFirstName} !`,
      htmlContent: html,
    }),
  });
}

export async function GET(req, { params }) {
  if (!(await verifyAdminCookie())) return Response.json({ error: 'Non autorisé' }, { status: 401 });
  const { id } = await params;

  const { data: guests } = await supabaseAdmin
    .from('event_guests')
    .select('*')
    .eq('event_id', id)
    .order('created_at');

  const { data: suggestions } = await supabaseAdmin
    .from('guest_song_suggestions')
    .select('guest_id, status')
    .eq('event_id', id);

  const countsByGuest = {};
  for (const s of (suggestions || [])) {
    if (!countsByGuest[s.guest_id]) countsByGuest[s.guest_id] = { pending: 0, approved: 0, rejected: 0 };
    countsByGuest[s.guest_id][s.status] = (countsByGuest[s.guest_id][s.status] || 0) + 1;
  }

  return Response.json({
    guests: (guests || []).map(g => ({
      ...g,
      suggestions: countsByGuest[g.id] || { pending: 0, approved: 0, rejected: 0 },
    })),
  });
}

export async function POST(req, { params }) {
  if (!(await verifyAdminCookie())) return Response.json({ error: 'Non autorisé' }, { status: 401 });
  const { id } = await params;
  const { email, firstName, phone, playlistIds, maxSongs } = await req.json();

  if (!firstName) return Response.json({ error: 'firstName requis' }, { status: 400 });

  const { data: ev } = await supabaseAdmin
    .from('events')
    .select('id, event_type, clients(first_name)')
    .eq('id', id)
    .single();
  if (!ev) return Response.json({ error: 'Événement introuvable' }, { status: 404 });

  const cleanEmail = email ? email.toLowerCase() : null;
  const guestRow = {
    event_id: id, email: cleanEmail, first_name: firstName, phone: phone || null,
    playlist_ids: playlistIds || [], max_songs: maxSongs ?? 10,
  };

  const { data: guest, error } = cleanEmail
    ? await supabaseAdmin.from('event_guests')
        .upsert(guestRow, { onConflict: 'event_id,email', ignoreDuplicates: false })
        .select().single()
    : await supabaseAdmin.from('event_guests').insert(guestRow).select().single();

  if (error) return Response.json({ error: error.message }, { status: 500 });

  if (cleanEmail) {
    const inviteLink = `${APP_URL}/invitation/${guest.token}`;
    await sendInviteEmail(
      cleanEmail,
      firstName,
      inviteLink,
      ev.event_type,
      ev.clients?.first_name || 'Votre hôte'
    );
  }

  return Response.json({ ok: true, guest });
}
