import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function POST(request: NextRequest) {
  try {
    const { automationId, triggerData } = await request.json();
    
    // Get automation details
    const { data: automation, error: automationError } = await supabaseAdmin
      .from('automations')
      .select('*')
      .eq('id', automationId)
      .single();

    if (automationError || !automation) {
      throw new Error('Automation not found');
    }

    // Log execution start
    const { data: execution, error: executionError } = await supabaseAdmin
      .from('automation_executions')
      .insert({
        automation_id: automationId,
        status: 'running',
        trigger_data: triggerData,
        started_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (executionError) throw executionError;

    // Execute automation logic based on trigger type
    const result = await executeAutomationLogic(automation, triggerData);

    // Update execution status
    await supabaseAdmin
      .from('automation_executions')
      .update({
        status: result.success ? 'completed' : 'failed',
        result: result.data,
        error_message: result.error,
        completed_at: new Date().toISOString(),
      })
      .eq('id', execution.id);

    // Update next run time
    const nextRun = calculateNextRun(automation.trigger);
    await supabaseAdmin
      .from('automations')
      .update({
        last_run: new Date().toISOString(),
        next_run: nextRun,
        status: automation.status === 'paused' ? 'paused' : 'active',
      })
      .eq('id', automationId);

    return NextResponse.json({
      success: result.success,
      execution: execution,
      result: result.data,
      nextRun
    });

  } catch (error: any) {
    console.error('Automation execution error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

async function executeAutomationLogic(automation: any, triggerData: any) {
  try {
    const { trigger, condition, action } = automation;
    
    // Evaluate conditions
    const conditionMet = await evaluateCondition(condition, triggerData);
    
    if (!conditionMet) {
      return {
        success: true,
        data: { message: 'Condition not met, no action taken' }
      };
    }

    // Execute actions
    const actionResult = await executeAction(action, triggerData);
    
    return {
      success: true,
      data: actionResult
    };

  } catch (error: any) {
    return {
      success: false,
      error: error.message
    };
  }
}

async function evaluateCondition(condition: string, triggerData: any) {
  try {
    // Parse condition (e.g., "spend > 1000", "roas < 2.0", "conversions < 10")
    const operators = ['>', '<', '>=', '<=', '==', '!='];
    let operator = null;
    let field = '';
    let value = '';

    for (const op of operators) {
      if (condition.includes(op)) {
        operator = op;
        [field, value] = condition.split(op).map(s => s.trim());
        break;
      }
    }

    if (!operator || !field || !value) {
      return false;
    }

    // Get actual value from trigger data
    const actualValue = getFieldValue(field, triggerData);
    const expectedValue = parseFloat(value);

    // Evaluate condition
    switch (operator) {
      case '>': return actualValue > expectedValue;
      case '<': return actualValue < expectedValue;
      case '>=': return actualValue >= expectedValue;
      case '<=': return actualValue <= expectedValue;
      case '==': return actualValue === expectedValue;
      case '!=': return actualValue !== expectedValue;
      default: return false;
    }

  } catch (error) {
    console.error('Condition evaluation error:', error);
    return false;
  }
}

function getFieldValue(field: string, data: any) {
  // Handle nested field access (e.g., "campaign.spend", "metrics.roas")
  const parts = field.split('.');
  let value = data;
  
  for (const part of parts) {
    value = value?.[part];
  }
  
  return typeof value === 'number' ? value : parseFloat(value) || 0;
}

async function executeAction(action: string, triggerData: any) {
  try {
    const actionType = action.split(':')[0]?.trim();
    const actionParams = action.split(':')[1]?.trim() || '';

    switch (actionType) {
      case 'pause_campaign':
        return await pauseCampaign(actionParams, triggerData);
      
      case 'send_email':
        return await sendEmailNotification(actionParams, triggerData);
      
      case 'send_slack':
        return await sendSlackNotification(actionParams, triggerData);
      
      case 'adjust_budget':
        return await adjustBudget(actionParams, triggerData);
      
      case 'create_alert':
        return await createAlert(actionParams, triggerData);
      
      default:
        return { message: `Unknown action type: ${actionType}` };
    }

  } catch (error: any) {
    throw new Error(`Action execution failed: ${error.message}`);
  }
}

async function pauseCampaign(campaignId: string, triggerData: any) {
  // In real implementation, this would call the platform API
  // For now, we'll simulate the action
  
  console.log(`Pausing campaign: ${campaignId}`);
  
  // Log the action
  return {
    action: 'pause_campaign',
    campaignId,
    timestamp: new Date().toISOString(),
    status: 'paused',
    reason: triggerData.reason || 'Automation trigger'
  };
}

async function sendEmailNotification(recipient: string, triggerData: any) {
  // In real implementation, this would use an email service
  console.log(`Sending email to: ${recipient}`);
  
  return {
    action: 'send_email',
    recipient,
    subject: `Automation Alert: ${triggerData.trigger}`,
    message: `Campaign performance alert: ${JSON.stringify(triggerData)}`,
    timestamp: new Date().toISOString()
  };
}

async function sendSlackNotification(webhook: string, triggerData: any) {
  // In real implementation, this would call Slack API
  console.log(`Sending Slack notification: ${webhook}`);
  
  return {
    action: 'send_slack',
    webhook,
    message: `🚨 Automation Alert: ${triggerData.trigger}`,
    details: triggerData,
    timestamp: new Date().toISOString()
  };
}

async function adjustBudget(adjustment: string, triggerData: any) {
  // In real implementation, this would call platform API
  console.log(`Adjusting budget: ${adjustment}`);
  
  return {
    action: 'adjust_budget',
    adjustment,
    campaignId: triggerData.campaignId,
    newBudget: triggerData.recommendedBudget,
    timestamp: new Date().toISOString()
  };
}

async function createAlert(alertType: string, triggerData: any) {
  // Store alert in database
  const { data, error } = await supabaseAdmin
    .from('alerts')
    .insert({
      type: alertType,
      message: `Automation alert: ${triggerData.trigger}`,
      data: triggerData,
      created_at: new Date().toISOString(),
      read: false,
    })
    .select()
    .single();

  if (error) throw error;

  return {
    action: 'create_alert',
    alertId: data.id,
    alertType,
    timestamp: new Date().toISOString()
  };
}

function calculateNextRun(trigger: string): string {
  const now = new Date();
  
  // Simple cron-like scheduling
  if (trigger.includes('hourly')) {
    now.setHours(now.getHours() + 1);
  } else if (trigger.includes('daily')) {
    now.setDate(now.getDate() + 1);
  } else if (trigger.includes('weekly')) {
    now.setDate(now.getDate() + 7);
  } else if (trigger.includes('monthly')) {
    now.setMonth(now.getMonth() + 1);
  } else {
    // Default to hourly
    now.setHours(now.getHours() + 1);
  }
  
  return now.toISOString();
}
