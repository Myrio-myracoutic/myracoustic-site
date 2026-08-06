import { supabaseAdmin } from '@/app/lib/supabase-admin';

function page(message) {
  return `<!DOCTYPE html><html lang="fr"><head><meta charset="utf-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<title>Désinscription — Myracoustic</title></head>
<body style="margin:0;padding:0;background:#060e16;font-family:sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;">
  <div style="max-width:420px;padding:40px 32px;text-align:center;color:#fff;">
    <img src="https://myracoustic.com/logo.png" alt="Myracoustic" height="48" style="height:48px;margin-bottom:24px;" />
    <p style="font-size:15px;line-height:1.7;color:rgba(255,255,255,0.8);">${message}</p>
    <a href="https://myracoustic.com" style="display:inline-block;margin-top:20px;color:#b8ef0b;font-size:13px;text-decoration:none;">← Retour au site</a>
  </div>
</body></html>`;
}

// GET /api/lead-magnet/unsubscribe?id=... — arrête la séquence de relance pour cette fiche.
export async function GET(request) {
  const id = new URL(request.url).searchParams.get('id');
  if (!id) {
    return new Response(page("Lien invalide."), { status: 400, headers: { 'Content-Type': 'text/html; charset=utf-8' } });
  }

  await supabaseAdmin
    .from('lead_magnet_signups')
    .update({ sequence_stopped_at: new Date().toISOString() })
    .eq('id', id);

  return new Response(
    page("Vous ne recevrez plus d'emails de notre part sur ce guide. Merci de votre intérêt pour Myracoustic."),
    { headers: { 'Content-Type': 'text/html; charset=utf-8' } },
  );
}
