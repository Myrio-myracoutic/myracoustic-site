/* Upload de conversions hors-ligne vers Google Ads, à partir du gclid stocké en base.
   Contourne le trou de suivi du 03/11 : un lead soumis sans avoir cliqué "Accepter" sur le
   bandeau cookies est invisible pour l'action generate_lead (importée depuis GA4, soumise au
   Consent Mode). Celle-ci part des propres données first-party de Myracoustic (Supabase),
   indépendamment du consentement cookies du navigateur. */

const TOKEN_URL = 'https://oauth2.googleapis.com/token';
const API_VERSION = 'v19';

async function getAccessToken() {
  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_ADS_CLIENT_ID,
      client_secret: process.env.GOOGLE_ADS_CLIENT_SECRET,
      refresh_token: process.env.GOOGLE_ADS_REFRESH_TOKEN,
      grant_type: 'refresh_token',
    }),
  });
  if (!res.ok) throw new Error(`Google OAuth refresh: ${res.status} ${await res.text()}`);
  const data = await res.json();
  return data.access_token;
}

/* conversions: [{ gclid, conversionDateTime }] — conversionDateTime au format
   "YYYY-MM-DD HH:MM:SS+TZ" (ex: "2026-10-30 20:07:48+00:00") */
export async function uploadClickConversions(conversions) {
  if (!conversions.length) return { results: [], partialFailureErrors: [] };

  const customerId = process.env.GOOGLE_ADS_CUSTOMER_ID;
  const conversionAction = `customers/${customerId}/conversionActions/${process.env.GOOGLE_ADS_CONVERSION_ACTION_ID}`;
  const accessToken = await getAccessToken();

  const res = await fetch(
    `https://googleads.googleapis.com/${API_VERSION}/customers/${customerId}:uploadClickConversions`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
        'developer-token': process.env.GOOGLE_ADS_DEVELOPER_TOKEN,
        'login-customer-id': process.env.GOOGLE_ADS_LOGIN_CUSTOMER_ID,
      },
      body: JSON.stringify({
        conversions: conversions.map(c => ({
          gclid: c.gclid,
          conversionAction,
          conversionDateTime: c.conversionDateTime,
        })),
        partialFailure: true,
      }),
    }
  );

  const data = await res.json();
  if (!res.ok) throw new Error(`Google Ads uploadClickConversions: ${res.status} ${JSON.stringify(data)}`);
  return data;
}
