import { supabaseAdmin } from './supabase-admin';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://myracoustic.com';
const SENDER  = 'contact@myracoustic.com';

/**
 * Onboarding par mot de passe (au lieu des liens magiques à usage unique).
 *
 * Pourquoi : les antivirus email (Yahoo, La Poste, Orange…) "cliquent"
 * automatiquement les liens à usage unique pour les scanner, ce qui consomme
 * le jeton avant que l'utilisateur ne clique → "lien invalide". Un mot de passe
 * est du texte : il ne peut pas être consommé. On envoie donc des identifiants
 * et l'utilisateur se connecte sur une page classique (réutilisable).
 */

/** Mot de passe temporaire lisible : Myra-xxxxxx (évite 0/O/1/l/I). */
export function genTempPassword() {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  let r = '';
  for (let i = 0; i < 6; i++) r += chars[Math.floor(Math.random() * chars.length)];
  return `Myra-${r}`;
}

/**
 * Garantit qu'un compte auth existe pour cet email.
 * @returns {{ authId: string|null, isNew: boolean }}
 */
export async function ensureAuthUser(email, firstName = '', lastName = '') {
  const lower = email.toLowerCase();
  const { data: authData, error } = await supabaseAdmin.auth.admin.createUser({
    email: lower,
    email_confirm: true,
    user_metadata: { first_name: firstName, last_name: lastName },
  });
  if (!error && authData?.user) return { authId: authData.user.id, isNew: true };

  // Email déjà utilisé → retrouver l'utilisateur (listUsers ne filtre pas réellement en v2)
  const { data: allUsers } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 });
  const existing = (allUsers?.users || []).find(u => u.email?.toLowerCase() === lower);
  return existing ? { authId: existing.id, isNew: false } : { authId: null, isNew: false };
}

/**
 * Définit un mot de passe temporaire + le flag must_set_password sur un compte.
 * Confirme aussi l'email (au cas où). Retourne le mot de passe en clair.
 */
export async function setupTempPassword(authId) {
  const { data: { user } } = await supabaseAdmin.auth.admin.getUserById(authId);
  const tempPassword = genTempPassword();
  const { error } = await supabaseAdmin.auth.admin.updateUserById(authId, {
    password: tempPassword,
    email_confirm: true,
    user_metadata: { ...(user?.user_metadata || {}), must_set_password: true },
  });
  if (error) throw new Error(error.message);
  return tempPassword;
}

/**
 * Envoie l'email d'identifiants (email + mot de passe temporaire).
 * @param {object} p
 * @param {string} p.toEmail
 * @param {string} p.firstName
 * @param {string} p.tempPassword
 * @param {string} p.intro  Phrase d'introduction (contexte : collaborateur / client)
 */
export async function sendCredentialsEmail({ toEmail, firstName, tempPassword, intro }) {
  const loginUrl = `${APP_URL}/mon-espace/connexion`;
  const html = `
<!DOCTYPE html><html lang="fr"><body style="margin:0;padding:0;background:#060e16;font-family:sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:40px 20px;">
<table width="560" cellpadding="0" cellspacing="0" style="background:#0d1b2a;border-radius:12px;overflow:hidden;">
  <tr><td style="padding:32px 40px 24px;text-align:center;border-bottom:1px solid rgba(255,255,255,0.07);">
    <img src="https://myracoustic.com/logo.png" alt="Myracoustic" height="60" style="height:60px;display:block;margin:0 auto 10px;" />
    <p style="margin:0;font-size:11px;color:rgba(255,255,255,0.25);font-style:italic;">De la vibration sonore à la magie lumineuse</p>
  </td></tr>
  <tr><td style="padding:40px 40px 32px;">
    <p style="color:rgba(255,255,255,0.6);font-size:15px;margin:0 0 8px;">Bonjour ${firstName},</p>
    <p style="color:rgba(255,255,255,0.85);font-size:15px;line-height:1.8;margin:0 0 24px;">${intro}</p>

    <table width="100%" cellpadding="0" cellspacing="0" style="background:rgba(184,239,11,0.06);border:1px solid rgba(184,239,11,0.2);border-radius:10px;margin:0 0 28px;">
      <tr><td style="padding:18px 22px;">
        <p style="margin:0 0 10px;font-size:12px;color:rgba(255,255,255,0.4);text-transform:uppercase;letter-spacing:0.06em;">Vos identifiants</p>
        <p style="margin:0 0 6px;font-size:14px;color:rgba(255,255,255,0.85);">Email&nbsp;: <strong style="color:#fff;">${toEmail}</strong></p>
        <p style="margin:0;font-size:14px;color:rgba(255,255,255,0.85);">Mot de passe temporaire&nbsp;: <strong style="color:#b8ef0b;font-size:16px;letter-spacing:0.5px;">${tempPassword}</strong></p>
      </td></tr>
    </table>

    <table cellpadding="0" cellspacing="0" style="margin:0 auto 24px;">
      <tr><td style="background:#b8ef0b;border-radius:8px;padding:14px 32px;text-align:center;">
        <a href="${loginUrl}" style="color:#060e16;font-size:15px;font-weight:700;text-decoration:none;">
          Accéder à mon espace →
        </a>
      </td></tr>
    </table>

    <p style="color:rgba(255,255,255,0.4);font-size:13px;line-height:1.7;margin:0;">
      Sur la page de connexion, choisissez l'onglet <strong style="color:rgba(255,255,255,0.6);">Mot de passe</strong>,
      saisissez vos identifiants ci-dessus. À la première connexion, vous choisirez votre propre mot de passe.
    </p>
  </td></tr>
  <tr><td style="padding:24px 40px;border-top:1px solid rgba(255,255,255,0.07);text-align:center;">
    <p style="color:rgba(255,255,255,0.35);font-size:13px;font-weight:600;margin:0 0 6px;">Myracoustic — Son, Lumière, Vidéo &amp; DJ</p>
    <p style="color:rgba(255,255,255,0.2);font-size:11px;margin:0;">07 68 53 33 08 · contact@myracoustic.com · myracoustic.com</p>
  </td></tr>
</table></td></tr></table>
</body></html>`;

  await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'api-key': process.env.BREVO_API_KEY },
    body: JSON.stringify({
      sender:      { name: 'Myracoustic', email: SENDER },
      to:          [{ email: toEmail, name: firstName }],
      replyTo:     { email: SENDER, name: 'Myracoustic' },
      subject:     'Vos identifiants de connexion Myracoustic',
      htmlContent: html,
    }),
  });
}
