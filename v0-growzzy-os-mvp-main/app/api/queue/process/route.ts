import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function POST(request: NextRequest) {
  try {
    // Get next job from queue
    const { data: job, error } = await supabaseAdmin
      .from('job_queue')
      .select('*')
      .eq('status', 'pending')
      .lte('delay_until', new Date().toISOString())
      .order('priority', { ascending: false })
      .order('created_at', { ascending: true })
      .limit(1)
      .single();

    if (error || !job) {
      return NextResponse.json({
        success: true,
        message: 'No jobs to process'
      });
    }

    // Mark job as processing
    await supabaseAdmin
      .from('job_queue')
      .update({
        status: 'processing',
        started_at: new Date().toISOString(),
      })
      .eq('id', job.id);

    // Process the job
    const result = await processJob(job);

    // Update job status
    const updateData: any = {
      completed_at: new Date().toISOString(),
      result: result.success ? result.data : null,
      error_message: result.success ? null : result.error,
    };

    if (result.success) {
      updateData.status = 'completed';
    } else {
      updateData.status = 'failed';
      updateData.attempts = job.attempts + 1;
      
      // Retry logic
      if (job.attempts + 1 < job.max_attempts) {
        updateData.status = 'pending';
        updateData.delay_until = new Date(Date.now() + Math.pow(2, job.attempts + 1) * 60000).toISOString(); // Exponential backoff
      }
    }

    await supabaseAdmin
      .from('job_queue')
      .update(updateData)
      .eq('id', job.id);

    return NextResponse.json({
      success: true,
      jobId: job.id,
      result,
      processedAt: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('Queue process error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

async function processJob(job: any) {
  try {
    const { type, data } = job;

    switch (type) {
      case 'send_email':
        return await processEmailJob(data);
      
      case 'send_slack':
        return await processSlackJob(data);
      
      case 'update_analytics':
        return await processAnalyticsJob(data);
      
      case 'sync_platform_data':
        return await processSyncJob(data);
      
      case 'generate_report':
        return await processReportJob(data);
      
      case 'execute_automation':
        return await processAutomationJob(data);
      
      case 'cleanup_data':
        return await processCleanupJob(data);
      
      default:
        throw new Error(`Unknown job type: ${type}`);
    }

  } catch (error: any) {
    return {
      success: false,
      error: error.message
    };
  }
}

async function processEmailJob(data: any) {
  try {
    // In real implementation, use email service like SendGrid, Resend, etc.
    console.log('Sending email:', data);
    
    // Simulate email sending
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    return {
      success: true,
      data: {
        messageId: `email_${Date.now()}`,
        recipient: data.to,
        subject: data.subject,
        sentAt: new Date().toISOString()
      }
    };

  } catch (error: any) {
    return {
      success: false,
      error: `Email sending failed: ${error.message}`
    };
  }
}

async function processSlackJob(data: any) {
  try {
    // In real implementation, use Slack API
    console.log('Sending Slack notification:', data);
    
    // Simulate Slack notification
    await new Promise(resolve => setTimeout(resolve, 500));
    
    return {
      success: true,
      data: {
        messageId: `slack_${Date.now()}`,
        channel: data.channel,
        message: data.message,
        sentAt: new Date().toISOString()
      }
    };

  } catch (error: any) {
    return {
      success: false,
      error: `Slack notification failed: ${error.message}`
    };
  }
}

async function processAnalyticsJob(data: any) {
  try {
    // Update analytics data
    const { error } = await supabaseAdmin
      .from('analytics_history')
      .insert({
        date: new Date().toISOString().split('T')[0],
        platform: data.platform || 'all',
        spend: data.spend || 0,
        revenue: data.revenue || 0,
        conversions: data.conversions || 0,
        impressions: data.impressions || 0,
        clicks: data.clicks || 0,
        leads: data.leads || 0,
        created_at: new Date().toISOString(),
      });

    if (error) throw error;

    return {
      success: true,
      data: {
        analyticsId: `analytics_${Date.now()}`,
        platform: data.platform,
        processedAt: new Date().toISOString()
      }
    };

  } catch (error: any) {
    return {
      success: false,
      error: `Analytics update failed: ${error.message}`
    };
  }
}

async function processSyncJob(data: any) {
  try {
    // Sync platform data
    const settings = localStorage.getItem('growzzy-settings');
    if (!settings) {
      throw new Error('No integration data found');
    }

    const response = await fetch(`${process.env.NEXTAUTH_URL}/api/platforms/data`, {
      headers: { 'x-user-settings': settings }
    });

    if (!response.ok) {
      throw new Error('Failed to sync platform data');
    }

    const platformData = await response.json();

    // Store synced data
    const { error } = await supabaseAdmin
      .from('platform_sync_history')
      .insert({
        sync_date: new Date().toISOString().split('T')[0],
        platforms: Object.keys(platformData),
        campaigns_count: platformData.campaigns?.length || 0,
        leads_count: platformData.leads?.length || 0,
        data: platformData,
        created_at: new Date().toISOString(),
      });

    if (error) throw error;

    return {
      success: true,
      data: {
        syncId: `sync_${Date.now()}`,
        platforms: Object.keys(platformData),
        campaigns: platformData.campaigns?.length || 0,
        leads: platformData.leads?.length || 0,
        syncedAt: new Date().toISOString()
      }
    };

  } catch (error: any) {
    return {
      success: false,
      error: `Platform sync failed: ${error.message}`
    };
  }
}

async function processReportJob(data: any) {
  try {
    // Generate report
    const response = await fetch(`${process.env.NEXTAUTH_URL}/api/reports/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        dateRange: data.dateRange || {
          start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          end: new Date().toISOString().split('T')[0]
        },
        sections: data.sections || ['kpi', 'campaigns', 'platforms'],
        userId: data.userId || 'system'
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to generate report');
    }

    const reportData = await response.json();

    return {
      success: true,
      data: {
        reportId: `report_${Date.now()}`,
        type: data.type || 'daily',
        generatedAt: new Date().toISOString(),
        reportData
      }
    };

  } catch (error: any) {
    return {
      success: false,
      error: `Report generation failed: ${error.message}`
    };
  }
}

async function processAutomationJob(data: any) {
  try {
    // Execute automation
    const response = await fetch(`${process.env.NEXTAUTH_URL}/api/automations/execute`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        automationId: data.automationId,
        triggerData: data.triggerData
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to execute automation');
    }

    const result = await response.json();

    return {
      success: true,
      data: {
        executionId: `execution_${Date.now()}`,
        automationId: data.automationId,
        result: result,
        executedAt: new Date().toISOString()
      }
    };

  } catch (error: any) {
    return {
      success: false,
      error: `Automation execution failed: ${error.message}`
    };
  }
}

async function processCleanupJob(data: any) {
  try {
    // Cleanup old data
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - (data.days || 90));

    // Clean old job queue entries
    const { error: jobError } = await supabaseAdmin
      .from('job_queue')
      .delete()
      .lt('created_at', cutoffDate.toISOString())
      .in('status', ['completed', 'failed']);

    if (jobError) throw jobError;

    // Clean old analytics history
    const { error: analyticsError } = await supabaseAdmin
      .from('analytics_history')
      .delete()
      .lt('date', cutoffDate.toISOString().split('T')[0]);

    if (analyticsError) throw analyticsError;

    return {
      success: true,
      data: {
        cleanupId: `cleanup_${Date.now()}`,
        cutoffDate: cutoffDate.toISOString(),
        cleanedAt: new Date().toISOString()
      }
    };

  } catch (error: any) {
    return {
      success: false,
      error: `Cleanup failed: ${error.message}`
    };
  }
}

// GET endpoint to check queue processor status
export async function GET() {
  try {
    const { data: jobs, error } = await supabaseAdmin
      .from('job_queue')
      .select('type, status, priority, attempts, created_at, started_at, completed_at')
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) throw error;

    const stats = {
      pending: jobs?.filter(j => j.status === 'pending').length || 0,
      processing: jobs?.filter(j => j.status === 'processing').length || 0,
      completed: jobs?.filter(j => j.status === 'completed').length || 0,
      failed: jobs?.filter(j => j.status === 'failed').length || 0,
      avgProcessingTime: calculateAvgProcessingTime(jobs || []),
    };

    return NextResponse.json({
      success: true,
      stats,
      recentJobs: jobs || []
    });

  } catch (error: any) {
    console.error('Queue processor status error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

function calculateAvgProcessingTime(jobs: any[]) {
  const completedJobs = jobs.filter(j => j.status === 'completed' && j.started_at && j.completed_at);
  
  if (completedJobs.length === 0) return 0;

  const totalTime = completedJobs.reduce((sum, job) => {
    const start = new Date(job.started_at).getTime();
    const end = new Date(job.completed_at).getTime();
    return sum + (end - start);
  }, 0);

  return totalTime / completedJobs.length / 1000; // Convert to seconds
}
