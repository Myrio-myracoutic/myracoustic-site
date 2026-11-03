import { supabaseAdmin } from '@/app/lib/supabase-admin';
import { uploadClickConversions } from '@/app/lib/google-ads-conversions';

/* Tables de leads réels (hors suivi d'abandon) qui capturent un gclid à la soumission. */
const LEAD_TABLES = ['mariage_leads', 'pro_contact_leads'];

function toConversionDateTime(createdAt) {
  // "2026-10-30T20:07:48.017924+00:00" → "2026-10-30 20:07:48+00:00"
  return createdAt.replace('T', ' ').replace(/\.\d+/, '');
}

export async function runAdsConversionsUpload() {
  const results = [];

  for (const table of LEAD_TABLES) {
    const { data: leads, error } = await supabaseAdmin
      .from(table)
      .select('id, created_at, gclid')
      .not('gclid', 'is', null)
      .is('ads_conversion_uploaded_at', null)
      .order('created_at', { ascending: true })
      .limit(50);

    if (error) {
      results.push({ table, status: 'error', error: error.message });
      continue;
    }

    for (const lead of leads || []) {
      try {
        await uploadClickConversions([{
          gclid: lead.gclid,
          conversionDateTime: toConversionDateTime(lead.created_at),
        }]);
        await supabaseAdmin
          .from(table)
          .update({ ads_conversion_uploaded_at: new Date().toISOString() })
          .eq('id', lead.id);
        results.push({ table, lead: lead.id, status: 'uploaded' });
      } catch (e) {
        results.push({ table, lead: lead.id, status: 'error', error: e.message });
      }
    }
  }

  return { uploaded: results.filter(r => r.status === 'uploaded').length, results };
}
