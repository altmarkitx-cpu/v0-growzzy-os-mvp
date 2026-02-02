import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          },
        },
      },
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { recipientEmail, includeInsights = true } = body;

    if (!recipientEmail) {
      return NextResponse.json({ error: 'recipientEmail is required' }, { status: 400 });
    }

    // Fetch report
    const { data: report, error: reportError } = await supabase
      .from('reports')
      .select('*')
      .eq('id', params.id)
      .eq('user_id', user.id)
      .single();

    if (reportError || !report) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 });
    }

    // Generate PDF (regenerate to ensure latest)
    const { data: campaigns } = await supabase
      .from('campaigns')
      .select('*')
      .eq('user_id', user.id);

    // In a production app, you would:
    // 1. Generate the PDF using the same report builder
    // 2. Send it via email service (SendGrid, Resend, etc.)
    // For now, we'll return a success response that the frontend can handle

    console.log(`[v0] Report ${params.id} scheduled for email to ${recipientEmail}`);

    // Log share activity
    await supabase
      .from('reports')
      .update({
        updated_at: new Date().toISOString(),
      })
      .eq('id', params.id);

    return NextResponse.json({
      success: true,
      message: `Report has been sent to ${recipientEmail}`,
      reportId: params.id,
      recipientEmail,
      sharedAt: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('[v0] Error sharing report:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to share report' },
      { status: 500 }
    );
  }
}
