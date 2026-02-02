import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function POST(request: NextRequest) {
  try {
    const { type, data, priority = 'normal', delay = 0 } = await request.json();
    
    // Add job to queue
    const { data: job, error } = await supabaseAdmin
      .from('job_queue')
      .insert({
        type,
        data,
        priority,
        status: 'pending',
        attempts: 0,
        max_attempts: 3,
        delay_until: new Date(Date.now() + delay * 1000).toISOString(),
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({
      success: true,
      jobId: job.id,
      message: 'Job added to queue successfully'
    });

  } catch (error: any) {
    console.error('Queue add error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    // Get queue status
    const { data: jobs, error } = await supabaseAdmin
      .from('job_queue')
      .select('type, status, priority, created_at')
      .order('created_at', { ascending: false });

    if (error) throw error;

    const status = {
      pending: jobs?.filter(j => j.status === 'pending').length || 0,
      processing: jobs?.filter(j => j.status === 'processing').length || 0,
      completed: jobs?.filter(j => j.status === 'completed').length || 0,
      failed: jobs?.filter(j => j.status === 'failed').length || 0,
      total: jobs?.length || 0,
    };

    return NextResponse.json({
      success: true,
      status,
      recentJobs: jobs?.slice(0, 10) || []
    });

  } catch (error: any) {
    console.error('Queue status error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
