import { supabaseAdmin } from '@/lib/supabaseAdmin';

export type TriggerType = 'time_based' | 'roas_threshold' | 'spend_threshold' | 'manual' | 'lead_received';
export type ActionType = 'pause_campaign' | 'adjust_budget' | 'notify_user' | 'create_lead' | 'tag_lead';

export interface Automation {
  id: string;
  name: string;
  user_id: string;
  trigger_type: TriggerType;
  trigger_config: Record<string, any>;
  action_type: ActionType;
  action_config: Record<string, any>;
  is_active: boolean;
  last_executed_at?: string;
  description?: string;
  created_at?: string;
}

export interface AutomationResult {
  automationId: string;
  triggered: boolean;
  executed: boolean;
  message: string;
  result?: any;
  timestamp: string;
}

export class AutomationEngine {
  /**
   * Evaluate if a trigger should fire
   */
  static async evaluateTrigger(automation: Automation): Promise<boolean> {
    const { trigger_type, trigger_config, user_id, last_executed_at } = automation;

    try {
      switch (trigger_type) {
        case 'time_based':
          return this.evaluateTimeTrigger(trigger_config, last_executed_at);

        case 'roas_threshold':
          return await this.evaluateRoasThreshold(user_id, trigger_config);

        case 'spend_threshold':
          return await this.evaluateSpendThreshold(user_id, trigger_config);

        case 'manual':
          return false;

        case 'lead_received':
          return await this.evaluateLeadTrigger(user_id, trigger_config, last_executed_at);

        default:
          return false;
      }
    } catch (error) {
      console.error('[v0] Error evaluating trigger:', error);
      return false;
    }
  }

  /**
   * Execute automation actions
   */
  static async executeActions(automation: Automation): Promise<{ success: boolean; message: string; result?: any }> {
    const { action_type, action_config, user_id } = automation;

    try {
      let result: any = null;

      switch (action_type) {
        case 'pause_campaign':
          result = await this.pauseCampaign(action_config);
          break;

        case 'adjust_budget':
          result = await this.adjustBudget(action_config);
          break;

        case 'notify_user':
          result = await this.notifyUser(user_id, action_config);
          break;

        case 'create_lead':
          result = await this.createLead(user_id, action_config);
          break;

        case 'tag_lead':
          result = await this.tagLead(user_id, action_config);
          break;

        default:
          throw new Error(`Unknown action type: ${action_type}`);
      }

      return {
        success: true,
        message: `Action ${action_type} executed successfully`,
        result,
      };
    } catch (error: any) {
      console.error('[v0] Error executing action:', error);
      return {
        success: false,
        message: `Error executing action: ${error.message}`,
      };
    }
  }

  // Trigger Evaluation Methods

  private static evaluateTimeTrigger(config: any, lastExecuted?: string): boolean {
    const { frequency, time } = config;

    if (!frequency || !time) return false;

    const now = new Date();
    const [hours, minutes] = time.split(':').map(Number);
    const scheduledTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hours, minutes, 0);

    if (lastExecuted) {
      const lastExecutedDate = new Date(lastExecuted);
      const hoursDiff = (now.getTime() - lastExecutedDate.getTime()) / (1000 * 60 * 60);

      switch (frequency) {
        case 'daily':
          return hoursDiff >= 24 && now >= scheduledTime;
        case 'weekly':
          return hoursDiff >= 168 && now >= scheduledTime;
        case 'monthly':
          return hoursDiff >= 720 && now >= scheduledTime;
      }
    }

    return now >= scheduledTime;
  }

  private static async evaluateRoasThreshold(userId: string, config: any): Promise<boolean> {
    const { operator, value, platform, period = 'daily' } = config;

    if (!operator || value === undefined) return false;

    const startDate = this.getPeriodStartDate(period);

    const { data: campaigns } = await supabaseAdmin
      .from('campaigns')
      .select('spend, revenue')
      .eq('user_id', userId)
      .eq('platform', platform || 'meta')
      .gte('updated_at', startDate.toISOString());

    if (!campaigns || campaigns.length === 0) return false;

    const totalSpend = campaigns.reduce((sum: number, c: any) => sum + (c.spend || 0), 0);
    const totalRevenue = campaigns.reduce((sum: number, c: any) => sum + (c.revenue || 0), 0);
    const roas = totalSpend > 0 ? totalRevenue / totalSpend : 0;

    return this.compareValues(roas, operator, value);
  }

  private static async evaluateSpendThreshold(userId: string, config: any): Promise<boolean> {
    const { operator, value, period = 'daily' } = config;

    if (!operator || value === undefined) return false;

    const startDate = this.getPeriodStartDate(period);

    const { data: analytics } = await supabaseAdmin
      .from('analytics')
      .select('spend')
      .eq('user_id', userId)
      .gte('created_at', startDate.toISOString());

    if (!analytics || analytics.length === 0) return false;

    const totalSpend = analytics.reduce((sum: number, a: any) => sum + (a.spend || 0), 0);

    return this.compareValues(totalSpend, operator, value);
  }

  private static async evaluateLeadTrigger(userId: string, config: any, lastExecuted?: string): Promise<boolean> {
    const { source } = config;

    if (!lastExecuted) return true;

    const { data: leads } = await supabaseAdmin
      .from('leads')
      .select('id')
      .eq('user_id', userId)
      .eq('source', source || 'any')
      .gt('created_at', lastExecuted);

    return (leads?.length || 0) > 0;
  }

  private static getPeriodStartDate(period: string): Date {
    const now = new Date();
    switch (period) {
      case 'daily':
        return new Date(now.getTime() - 24 * 60 * 60 * 1000);
      case 'weekly':
        return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      case 'monthly':
        return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      default:
        return new Date(now.getTime() - 24 * 60 * 60 * 1000);
    }
  }

  private static compareValues(actual: number, operator: string, expected: number): boolean {
    switch (operator) {
      case 'below':
        return actual < expected;
      case 'above':
        return actual > expected;
      case 'equals':
        return actual === expected;
      default:
        return false;
    }
  }

  // Action Execution Methods

  private static async pauseCampaign(config: any): Promise<any> {
    const { campaignId } = config;

    const { data, error } = await supabaseAdmin
      .from('campaigns')
      .update({ status: 'paused' })
      .eq('id', campaignId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  private static async adjustBudget(config: any): Promise<any> {
    const { campaignId, budgetValue, budgetType } = config;

    const { data: campaign } = await supabaseAdmin
      .from('campaigns')
      .select('budget')
      .eq('id', campaignId)
      .single();

    if (!campaign) throw new Error('Campaign not found');

    let newBudget = campaign.budget;
    if (budgetType === 'percentage') {
      newBudget = campaign.budget * (1 + budgetValue / 100);
    } else if (budgetType === 'fixed') {
      newBudget = budgetValue;
    }

    const { data, error } = await supabaseAdmin
      .from('campaigns')
      .update({ budget: newBudget })
      .eq('id', campaignId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  private static async notifyUser(userId: string, config: any): Promise<any> {
    const { message } = config;

    console.log('[v0] Notification sent for user:', userId, 'Message:', message);

    return {
      notified: true,
      message,
      sentAt: new Date().toISOString(),
    };
  }

  private static async createLead(userId: string, config: any): Promise<any> {
    const { leadData } = config;

    const { data, error } = await supabaseAdmin
      .from('leads')
      .insert({
        user_id: userId,
        ...leadData,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  private static async tagLead(userId: string, config: any): Promise<any> {
    const { leadId, tags } = config;

    const { data, error } = await supabaseAdmin
      .from('leads')
      .update({
        notes: `Tags: ${tags?.join(', ')}`,
      })
      .eq('id', leadId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }
}

// Singleton instance
export const automationEngine = new AutomationEngine();
