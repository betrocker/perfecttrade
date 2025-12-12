import { UserSettings } from "@/types/userSettings";
import { supabase } from "./supabase";

class UserSettingsService {
  async getUserSettings(userId: string): Promise<UserSettings | null> {
    try {
      const { data, error } = await supabase
        .from("user_settings")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle();

      if (error) {
        console.error("Error fetching user settings:", error);
        return null;
      }

      // If no settings exist, create default ones
      if (!data) {
        return await this.createDefaultSettings(userId);
      }

      return data;
    } catch (error) {
      console.error("Error in getUserSettings:", error);
      return null;
    }
  }

  async createDefaultSettings(userId: string): Promise<UserSettings | null> {
    try {
      const defaultSettings = {
        user_id: userId,
        monthly_target: 5000,
        max_daily_loss: 500,
        win_rate_goal: 65,
        max_trades_per_day: 5,
        daily_reminder_enabled: false,
        daily_reminder_time: "20:00",
        inactivity_reminder_enabled: false,
        inactivity_days: 3,
      };

      const { data, error } = await supabase
        .from("user_settings")
        .insert(defaultSettings)
        .select()
        .single();

      if (error) {
        console.error("Error creating default settings:", error);
        return null;
      }

      return data;
    } catch (error) {
      console.error("Error in createDefaultSettings:", error);
      return null;
    }
  }

  async updateSettings(
    userId: string,
    settings: Partial<UserSettings>
  ): Promise<boolean> {
    try {
      // First check if settings exist
      const { data: existing } = await supabase
        .from("user_settings")
        .select("id")
        .eq("user_id", userId)
        .maybeSingle();

      // If no settings exist, create them first
      if (!existing) {
        await this.createDefaultSettings(userId);
      }

      const { error } = await supabase
        .from("user_settings")
        .update(settings)
        .eq("user_id", userId);

      if (error) {
        console.error("Error updating settings:", error);
        return false;
      }

      return true;
    } catch (error) {
      console.error("Error in updateSettings:", error);
      return false;
    }
  }

  async updateMonthlyTarget(userId: string, target: number): Promise<boolean> {
    return await this.updateSettings(userId, { monthly_target: target });
  }

  async updateMaxDailyLoss(userId: string, loss: number): Promise<boolean> {
    return await this.updateSettings(userId, { max_daily_loss: loss });
  }

  async updateWinRateGoal(userId: string, goal: number): Promise<boolean> {
    return await this.updateSettings(userId, { win_rate_goal: goal });
  }

  async updateMaxTradesPerDay(userId: string, max: number): Promise<boolean> {
    return await this.updateSettings(userId, { max_trades_per_day: max });
  }

  async updateDailyReminder(
    userId: string,
    enabled: boolean,
    time?: string
  ): Promise<boolean> {
    const updates: Partial<UserSettings> = { daily_reminder_enabled: enabled };
    if (time) {
      updates.daily_reminder_time = time;
    }
    return await this.updateSettings(userId, updates);
  }

  async updateInactivityReminder(
    userId: string,
    enabled: boolean,
    days?: number
  ): Promise<boolean> {
    const updates: Partial<UserSettings> = {
      inactivity_reminder_enabled: enabled,
    };
    if (days) {
      updates.inactivity_days = days;
    }
    return await this.updateSettings(userId, updates);
  }
}

export const userSettingsService = new UserSettingsService();
