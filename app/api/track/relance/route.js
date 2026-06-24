import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/app/lib/supabase-admin';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://myracoustic.com';

// GET /api/track/relance?email=xxx
// Route publique — enregistre le clic puis redirige vers le formulaire avec UTM
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const email = searchParams.get('email');

  if (email) {
    await supabaseAdmin
      .from('devis_particulier_progress')
      .update({ relance_clicked_at: new Date().toISOString() })
      .eq('email', email.toLowerCase());
  }

  const destination = `${APP_URL}/devis/particulier?utm_source=email&utm_medium=relance&utm_campaign=prospects_relance`;
  return NextResponse.redirect(destination, { status: 302 });
}
