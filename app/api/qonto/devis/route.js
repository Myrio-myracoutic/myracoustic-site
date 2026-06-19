import { NextResponse } from 'next/server';

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
    }

    return NextResponse.json({ quoteId, quoteUrl });
  } catch (err) {
    console.error('Qonto devis error:', err.message);
    return NextResponse.json({ error: 'Erreur lors de la création du devis' }, { status: 500 });
  }
}
