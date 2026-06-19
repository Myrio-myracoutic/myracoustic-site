import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/app/lib/supabase-admin';

const SENDER_EMAIL = 'contact@myracoustic.com';

async function sendInviteEmail(toEmail, firstName, inviteLink) {
  const html = `
<!DOCTYPE html><html lang="fr"><body style="margin:0;padding:0;background:#060e16;font-family:sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:40px 20px;">
<table width="560" cellpadding="0" cellspacing="0" style="background:#0d1b2a;border-radius:12px;overflow:hidden;">
  <tr><td style="padding:32px 40px;text-align:center;border-bottom:1px solid rgba(255,255,255,0.07);">
    <img src="https://myracoustic.com/logo.png" alt="Myracoustic" height="44" style="height:44px;" />
  </td></tr>
  <tr><td style="padding:40px 40px 32px;">
    <p style="color:rgba(255,255,255,0.6);font-size:15px;margin:0 0 24px;">Bonjour ${firstName},</p>
    <p style="color:rgba(255,255,255,0.85);font-size:15px;line-height:1.7;margin:0 0 16px;">
      Votre devis a été envoyé ! Nous avons créé votre <strong style="color:#b8ef0b;">espace personnel</strong>
      pour suivre et gérer votre événement : statut du devis, programme, liste de musiques et bien plus à venir.
    </p>
    <p style="color:rgba(255,255,255,0.85);font-size:15px;line-height:1.7;margin:0 0 32px;">
      Cliquez sur le bouton ci-dessous pour accéder à votre espace et définir votre mot de passe.
    </p>
    <table cellpadding="0" cellspacing="0" style="margin:0 auto 32px;">
      <tr><td style="background:#b8ef0b;border-radius:8px;padding:14px 32px;text-align:center;">
        <a href="${inviteLink}" style="color:#060e16;font-size:15px;font-weight:700;text-decoration:none;">
          Accéder à mon espace →
        </a>
      </td></tr>
    </table>
    <p style="color:rgba(255,255,255,0.35);font-size:12px;margin:0;">Ce lien est valable 24 h. Si vous ne souhaitez pas créer de compte, ignorez cet email.</p>
  </td></tr>
  <tr><td style="padding:20px 40px;border-top:1px solid rgba(255,255,255,0.07);text-align:center;">
    <p style="color:rgba(255,255,255,0.25);font-size:12px;margin:0;">Myracoustic — Son, Lumière, Vidéo &amp; DJ · <a href="https://myracoustic.com" style="color:rgba(255,255,255,0.25);">myracoustic.com</a></p>
  </td></tr>
</table></td></tr></table>
</body></html>`;

  await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'api-key': process.env.BREVO_API_KEY },
    body: JSON.stringify({
      sender: { name: 'Myracoustic', email: SENDER_EMAIL },
      to: [{ email: toEmail, name: firstName }],
      replyTo: { email: SENDER_EMAIL, name: 'Myracoustic' },
      subject: 'Votre espace client Myracoustic est prêt',
      htmlContent: html,
    }),
  });
}

const QONTO_BASE = 'https://thirdparty.qonto.com/v2';

function qHeaders() {
  return {
    Authorization: `${process.env.QONTO_LOGIN}:${process.env.QONTO_SECRET_KEY}`,
    'Content-Type': 'application/json',
  };
}

function parsePhone(tel) {
  if (!tel) return undefined;
  const c = tel.replace(/[\s().-]/g, '');
  if (c.startsWith('+33')) return { country_code: '+33', number: c.slice(3) };
  if (c.startsWith('0033')) return { country_code: '+33', number: c.slice(4) };
  if (c.startsWith('0') && c.length > 1) return { country_code: '+33', number: c.slice(1) };
  return { country_code: '+33', number: c };
}

async function findOrCreateClient({ type, firstName, lastName, societe, email, phone, adresse, cp, ville, siret }) {
  const s = await fetch(
    `${QONTO_BASE}/clients?q=${encodeURIComponent(email)}&per_page=50`,
    { headers: qHeaders() }
  );
  const sData = await s.json();
  const existing = sData.clients?.find(c => c.email === email);

  const billing = adresse
    ? { street_address: adresse, city: ville, zip_code: cp, country_code: 'FR' }
    : undefined;

  if (existing) {
    // Mettre à jour l'adresse si elle manque
    if (!existing.billing_address && billing) {
      await fetch(`${QONTO_BASE}/clients/${existing.id}`, {
        method: 'PATCH',
        headers: qHeaders(),
        body: JSON.stringify({ billing_address: billing }),
      });
    }
    return existing.id;
  }

  const phoneObj = parsePhone(phone);

  const payload = type === 'company'
    ? {
        type: 'company',
        name: societe,
        first_name: firstName,
        last_name: lastName,
        email,
        phone: phoneObj,
        locale: 'fr',
        currency: 'EUR',
        tax_identification_number: siret?.slice(0, 9) || undefined,
        billing_address: billing,
      }
    : {
        type: 'individual',
        first_name: firstName,
        last_name: lastName,
        email,
        phone: phoneObj,
        locale: 'fr',
        currency: 'EUR',
        billing_address: billing,
      };

  const res = await fetch(`${QONTO_BASE}/clients`, {
    method: 'POST',
    headers: qHeaders(),
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(`Création client échouée : ${JSON.stringify(data)}`);
  return data.client.id;
}

export async function POST(request) {
  try {
    const { client, event, items, discountPct, remiseDeadline, draft, note } = await request.json();

    const clientId = await findOrCreateClient(client);

    const today = new Date();
    const issueDate = today.toISOString().slice(0, 10);
    const expiryDate = remiseDeadline
      || new Date(today.getTime() + 30 * 86400000).toISOString().slice(0, 10);

    const validItems = items.filter(i => i.priceHT > 0);
    if (validItems.length === 0) {
      return NextResponse.json({ error: 'Aucun article dans le devis' }, { status: 400 });
    }

    const eventDateFr = event?.date
      ? new Date(event.date + 'T12:00:00').toLocaleDateString('fr-FR', {
          day: 'numeric', month: 'long', year: 'numeric',
        })
      : '';

    const headerParts = [
      event?.type && `Événement : ${event.type}`,
      event?.date && `Date : ${eventDateFr}`,
      event?.lieu && `Lieu : ${event.lieu}`,
      note,
    ].filter(Boolean);

    // L'API Qonto v2 n'utilise pas de wrapper — payload plat
    const quotePayload = {
      client_id: clientId,
      issue_date: issueDate,
      expiry_date: expiryDate,
      currency: 'EUR',
      terms_and_conditions: 'Acompte de 60 % à la signature du devis — Solde de 40 % le jour de la prestation.',
      header: headerParts.join(' · '),
      footer: '',
      items: validItems.map(item => ({
        title: item.title,
        description: item.description || '',
        quantity: '1',
        unit: 'unit',
        unit_price: { value: Number(item.priceHT).toFixed(2), currency: 'EUR' },
        vat_rate: '0.2',
      })),
      ...(discountPct > 0 ? { discount: { type: 'percentage', value: String(discountPct) } } : {}),
    };

    const qRes = await fetch(`${QONTO_BASE}/quotes`, {
      method: 'POST',
      headers: qHeaders(),
      body: JSON.stringify(quotePayload),
    });
    const qData = await qRes.json();
    if (!qRes.ok) throw new Error(`Création devis échouée : ${JSON.stringify(qData)}`);

    const quoteId = qData.quote.id;
    const quoteUrl = qData.quote.quote_url;

    if (!draft) {
      const sendRes = await fetch(`${QONTO_BASE}/quotes/${quoteId}/send`, {
        method: 'POST',
        headers: qHeaders(),
        body: JSON.stringify({
          send_to: [client.email],
          email_title: [
            'Votre devis Myracoustic',
            event?.type && `— ${event.type}`,
            eventDateFr && `du ${eventDateFr}`,
          ].filter(Boolean).join(' '),
          copy_to_self: true,
        }),
      });

      if (sendRes.status !== 204 && !sendRes.ok) {
        console.error('Erreur envoi devis :', await sendRes.text().catch(() => ''));
      }

      // ── Création espace client Supabase ──────────────────────────
      try {
        const { data: existing } = await supabaseAdmin
          .from('clients')
          .select('id, auth_id')
          .eq('email', client.email)
          .maybeSingle();

        let supabaseClientId = existing?.id;
        const isNew = !existing;

        if (isNew) {
          // Créer l'utilisateur auth (peut échouer si email déjà dans auth.users)
          const { data: authData, error: authErr } = await supabaseAdmin.auth.admin.createUser({
            email: client.email,
            email_confirm: false,
            user_metadata: { first_name: client.firstName, last_name: client.lastName },
          });

          const authId = authErr ? null : authData.user.id;

          // Insérer le client en base
          const { data: newClient, error: dbErr } = await supabaseAdmin
            .from('clients')
            .insert({
              auth_id: authId,
              email: client.email,
              first_name: client.firstName,
              last_name: client.lastName,
              phone: client.phone || null,
              profil: client.type === 'company' ? 'professionnel' : 'particulier',
            })
            .select('id')
            .single();
          if (dbErr) throw dbErr;
          supabaseClientId = newClient.id;

          // Envoyer l'invitation uniquement si l'auth user vient d'être créé
          if (!authErr && authId) {
            const { data: linkData } = await supabaseAdmin.auth.admin.generateLink({
              type: 'invite',
              email: client.email,
              options: { redirectTo: `${process.env.NEXT_PUBLIC_APP_URL || 'https://myracoustic.com'}/auth/callback` },
            });
            if (linkData?.properties?.action_link) {
              await sendInviteEmail(client.email, client.firstName, linkData.properties.action_link);
            }
          }
        }

        // Enregistrer l'événement
        if (supabaseClientId) {
          await supabaseAdmin.from('events').insert({
            client_id: supabaseClientId,
            event_date: event?.date || null,
            event_type: event?.type || null,
            venue: event?.lieu || null,
            qonto_quote_id: quoteId,
            qonto_quote_url: quoteUrl,
          });
        }
      } catch (sbErr) {
        console.error('Supabase espace client error:', sbErr.message);
      }
    }

    return NextResponse.json({ quoteId, quoteUrl });
  } catch (err) {
    console.error('Qonto devis error:', err.message);
    return NextResponse.json({ error: 'Erreur lors de la création du devis' }, { status: 500 });
  }
}
