export interface UserSettings {
  id: string;
  user_id: string;
  monthly_target: number;
  max_daily_loss: number;
  win_rate_goal: number;
  max_trades_per_day: number;
  daily_reminder_enabled: boolean;
  daily_reminder_time: string;
  inactivity_reminder_enabled: boolean;
  inactivity_days: number;
  created_at: string;
  updated_at: string;
}
