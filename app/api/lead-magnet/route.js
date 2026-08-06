import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/app/lib/supabase-admin';

const SENDER_EMAIL = 'contact@myracoustic.com';
const PDF_URL = 'https://myracoustic.com/guides/7-questions-dj-mariage.pdf';

// POST /api/lead-magnet — { guide, email, firstName } → capte l'email et envoie le guide.
// Best-effort sur l'email (comme les autres envois du site) : un échec Brevo n'empêche
// jamais l'accès immédiat au PDF déjà proposé côté front après la soumission.
export async function POST(request) {
  const { guide = 'dj-mariage-7-questions', email, firstName } = await request.json();

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: 'Email invalide' }, { status: 400 });
  }
  const prenom = firstName?.trim() || '';

  try {
    await supabaseAdmin
      .from('lead_magnet_signups')
      .upsert(
        {
          guide, email: email.toLowerCase().trim(), first_name: prenom || null,
          // 1er email de la séquence de relance dans 3 jours (voir run-lead-magnet-sequence.js).
          sequence_next_at: new Date(Date.now() + 3 * 86400000).toISOString(),
        },
        { onConflict: 'guide,email', ignoreDuplicates: true },
      );
  } catch (dbErr) {
    console.error('lead_magnet_signups insert error:', dbErr.message);
  }

  const html = `
<!DOCTYPE html><html lang="fr"><body style="margin:0;padding:0;background:#060e16;font-family:sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:40px 20px;">
<table width="560" cellpadding="0" cellspacing="0" style="background:#0d1b2a;border-radius:12px;overflow:hidden;">

  <tr><td style="padding:32px 40px 24px;text-align:center;border-bottom:1px solid rgba(255,255,255,0.07);">
    <img src="https://myracoustic.com/logo.png" alt="Myracoustic" height="60" style="height:60px;display:block;margin:0 auto 10px;" />
    <p style="margin:0;font-size:11px;color:rgba(255,255,255,0.25);font-style:italic;">De la vibration sonore à la magie lumineuse</p>
  </td></tr>

  <tr><td style="padding:40px 40px 32px;">
    <p style="color:rgba(255,255,255,0.6);font-size:15px;margin:0 0 20px;">Bonjour${prenom ? ` ${prenom}` : ''},</p>

    <p style="color:rgba(255,255,255,0.85);font-size:15px;line-height:1.8;margin:0 0 28px;">
      Voici votre guide <strong style="color:#b8ef0b;">« 7 questions à poser avant de choisir son DJ de mariage »</strong> —
      de quoi comparer les prestataires en toute clarté, quel que soit celui que vous choisirez.
    </p>

    <table cellpadding="0" cellspacing="0" style="margin:0 auto 28px;">
      <tr><td style="background:#b8ef0b;border-radius:8px;padding:14px 36px;text-align:center;">
        <a href="${PDF_URL}" style="color:#060e16;font-size:15px;font-weight:700;text-decoration:none;">
          Télécharger le guide (PDF) →
        </a>
      </td></tr>
    </table>

    <p style="color:rgba(255,255,255,0.4);font-size:13px;line-height:1.7;margin:0;">
      Une question sur votre mariage ? Répondez simplement à cet email — nous sommes là pour vous accompagner.
    </p>
  </td></tr>

  <tr><td style="padding:24px 40px;border-top:1px solid rgba(255,255,255,0.07);text-align:center;">
    <p style="color:rgba(255,255,255,0.35);font-size:13px;font-weight:600;margin:0 0 6px;">Myracoustic — Son, Lumière, Vidéo &amp; DJ</p>
    <p style="color:rgba(255,255,255,0.2);font-size:11px;margin:0;">07 68 53 33 08 · contact@myracoustic.com · myracoustic.com</p>
  </td></tr>

</table></td></tr></table>
</body></html>`;

  try {
    const res = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'api-key': process.env.BREVO_API_KEY },
      body: JSON.stringify({
        sender: { name: 'Myracoustic', email: SENDER_EMAIL },
        to: [{ email: email.toLowerCase().trim(), name: prenom || undefined }],
        replyTo: { email: SENDER_EMAIL, name: 'Myracoustic' },
        subject: 'Votre guide « 7 questions avant de choisir son DJ de mariage »',
        htmlContent: html,
      }),
    });
    if (!res.ok) console.error('Brevo lead-magnet error:', await res.text().catch(() => ''));
  } catch (err) {
    console.error('Brevo lead-magnet fetch error:', err.message);
  }

  return NextResponse.json({ ok: true, pdfUrl: PDF_URL });
}
