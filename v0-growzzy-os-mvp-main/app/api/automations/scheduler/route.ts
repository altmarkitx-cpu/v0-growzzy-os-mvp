import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function POST(request: NextRequest) {
  try {
    // Get all active automations
    const { data: automations, error } = await supabaseAdmin
      .from('automations')
      .select('*')
      .eq('status', 'active')
      .lt('next_run', new Date().toISOString());

    if (error) throw error;

    const results = [];
    
    // Process each automation
    for (const automation of automations) {
      try {
        // Check if automation should run now
        if (new Date(automation.next_run) <= new Date()) {
          // Get trigger data
          const triggerData = await getTriggerData(automation);
          
          // Execute automation
          const executeResponse = await fetch(`${process.env.NEXTAUTH_URL}/api/automations/execute`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              automationId: automation.id,
              triggerData
            }),
          });

          if (executeResponse.ok) {
            const result = await executeResponse.json();
            results.push({
              automationId: automation.id,
              automationName: automation.name,
              success: true,
              result: result
            });
          } else {
            results.push({
              automationId: automation.id,
              automationName: automation.name,
              success: false,
              error: 'Execution failed'
            });
          }
        }
      } catch (error: any) {
        results.push({
          automationId: automation.id,
          automationName: automation.name,
          success: false,
          error: error.message
        });
      }
    }

    return NextResponse.json({
      success: true,
      processed: results.length,
      results,
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('Scheduler error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

async function getTriggerData(automation: any) {
  try {
    const { trigger } = automation;
    
    // Get real campaign data for trigger evaluation
    const settings = await getUserSettings(automation.user_id);
    if (!settings) {
      throw new Error('User settings not found');
    }

    const platformsResponse = await fetch(`${process.env.NEXTAUTH_URL}/api/platforms/data`, {
      headers: { 'x-user-settings': settings }
    });

    if (!platformsResponse.ok) {
      throw new Error('Failed to fetch platform data');
    }

    const platformData = await platformsResponse.json();
    
    // Build trigger data based on trigger type
    const triggerData = {
      trigger: trigger,
      timestamp: new Date().toISOString(),
      campaigns: platformData.campaigns || [],
      metrics: {
        totalSpend: platformData.campaigns?.reduce((sum: number, c: any) => sum + (c.spend || 0), 0) || 0,
        totalRevenue: platformData.campaigns?.reduce((sum: number, c: any) => sum + (c.revenue || 0), 0) || 0,
        totalConversions: platformData.campaigns?.reduce((sum: number, c: any) => sum + (c.conversions || 0), 0) || 0,
        avgRoas: platformData.campaigns?.length > 0 
          ? platformData.campaigns.reduce((sum: number, c: any) => sum + (c.roas || 0), 0) / platformData.campaigns.length 
          : 0,
      }
    };

    // Add campaign-specific data for specific campaigns
    if (trigger.includes('campaign')) {
      const campaignId = trigger.match(/campaign['"]?\s*[:=]\s*['"]?(\w+)/)?.[1];
      if (campaignId) {
        const campaign = platformData.campaigns?.find((c: any) => c.id === campaignId);
        if (campaign) {
          triggerData.campaign = campaign;
        }
      }
    }

    return triggerData;

  } catch (error) {
    console.error('Failed to get trigger data:', error);
    return {
      trigger: automation.trigger,
      timestamp: new Date().toISOString(),
      error: 'Failed to fetch trigger data'
    };
  }
}

async function getUserSettings(userId: string) {
  try {
    // In a real implementation, this would fetch user-specific settings
    // For now, we'll use a default or fetch from a user settings table
    const { data, error } = await supabaseAdmin
      .from('user_settings')
      .select('settings')
      .eq('user_id', userId)
      .single();

    if (error || !data) {
      // Return default settings for demo
      return localStorage.getItem('growzzy-settings');
    }

    return data.settings;
  } catch (error) {
    console.error('Failed to get user settings:', error);
    return null;
  }
}

// GET endpoint to check scheduler status
export async function GET() {
  try {
    const { data: automations, error } = await supabaseAdmin
      .from('automations')
      .select('id, name, status, next_run, last_run')
      .eq('status', 'active')
      .order('next_run', { ascending: true });

    if (error) throw error;

    const now = new Date();
    const pending = automations?.filter(a => new Date(a.next_run) <= now).length || 0;
    const upcoming = automations?.filter(a => new Date(a.next_run) > now).length || 0;

    return NextResponse.json({
      status: 'active',
      totalAutomations: automations?.length || 0,
      pendingExecution: pending,
      upcomingExecutions: upcoming,
      nextExecution: automations?.[0]?.next_run || null,
      timestamp: now.toISOString()
    });

  } catch (error: any) {
    console.error('Scheduler status error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
