import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import { goalsTrackingService } from "./goalsTrackingService";
import { supabase } from "./supabase";

// Configure notification handler
Notifications.setNotificationHandler({
  handleNotification: async (notification) => {
    return {
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
      shouldShowBanner: true,
      shouldShowList: true,
    };
  },
});

export interface NotificationSchedule {
  id: string;
  userId: string;
  type: "DAILY_REMINDER" | "INACTIVITY_ALERT" | "GOAL_WARNING";
  scheduledFor: string;
  data?: any;
}

class NotificationService {
  private notificationListener: any;
  private responseListener: any;

  // Request permissions
  async requestPermissions(): Promise<boolean> {
    if (!Device.isDevice) {
      console.log("Must use physical device for Push Notifications");
      return false;
    }

    const { status: existingStatus } =
      await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== "granted") {
      console.log("Failed to get push token for push notification!");
      return false;
    }

    // Get push token for remote notifications (optional)
    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync("default", {
        name: "default",
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: "#00F5D4",
      });
    }

    return true;
  }

  // Get expo push token
  async getExpoPushToken(): Promise<string | null> {
    try {
      const token = (await Notifications.getExpoPushTokenAsync()).data;
      return token;
    } catch (error) {
      console.error("Error getting push token:", error);
      return null;
    }
  }

  // Save token to database
  async savePushToken(userId: string, token: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from("user_settings")
        .update({ push_token: token })
        .eq("user_id", userId);

      if (error) {
        console.error("Error saving push token:", error);
        return false;
      }

      return true;
    } catch (error) {
      console.error("Error in savePushToken:", error);
      return false;
    }
  }

  // Schedule daily reminder
  async scheduleDailyReminder(
    userId: string,
    time: string
  ): Promise<string | null> {
    try {
      // Cancel existing daily reminder
      await this.cancelDailyReminder(userId);

      // Parse time (format: "HH:MM")
      const [hours, minutes] = time.split(":").map(Number);

      const trigger: Notifications.NotificationTriggerInput = {
        type: Notifications.SchedulableTriggerInputTypes.CALENDAR, // ✅ DODAJ OVO
        hour: hours,
        minute: minutes,
        repeats: true,
      };

      const id = await Notifications.scheduleNotificationAsync({
        content: {
          title: "📊 Trading Journal Reminder",
          body: "Don't forget to log your trades today!",
          data: { type: "DAILY_REMINDER", userId },
          sound: true,
        },
        trigger,
      });

      // Save to database
      await this.saveNotificationSchedule(userId, "DAILY_REMINDER", id);

      return id;
    } catch (error) {
      console.error("Error scheduling daily reminder:", error);
      return null;
    }
  }

  // Cancel daily reminder
  async cancelDailyReminder(userId: string): Promise<boolean> {
    try {
      const schedule = await this.getNotificationSchedule(
        userId,
        "DAILY_REMINDER"
      );
      if (schedule) {
        await Notifications.cancelScheduledNotificationAsync(schedule.id);
        await this.deleteNotificationSchedule(schedule.id);
      }
      return true;
    } catch (error) {
      console.error("Error canceling daily reminder:", error);
      return false;
    }
  }

  // Schedule inactivity alert
  async scheduleInactivityAlert(
    userId: string,
    days: number
  ): Promise<boolean> {
    try {
      // This would typically be handled by a backend cron job
      // For now, we'll just save the preference
      const { error } = await supabase
        .from("user_settings")
        .update({
          inactivity_reminder_enabled: true,
          inactivity_days: days,
        })
        .eq("user_id", userId);

      return !error;
    } catch (error) {
      console.error("Error scheduling inactivity alert:", error);
      return false;
    }
  }

  // Send immediate notification for goal warnings
  async sendGoalWarning(
    userId: string,
    title: string,
    body: string,
    type: "DAILY_LOSS" | "MAX_TRADES" | "WIN_RATE"
  ): Promise<void> {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data: { type: "GOAL_WARNING", warningType: type, userId },
          sound: true,
          priority: Notifications.AndroidNotificationPriority.HIGH,
        },
        trigger: null, // Send immediately
      });
    } catch (error) {
      console.error("Error sending goal warning:", error);
    }
  }

  // Check and send goal warnings
  async checkGoalsAndNotify(userId: string): Promise<void> {
    const progress = await goalsTrackingService.getGoalsProgress(userId);

    if (!progress) return;

    // Daily loss warning
    if (progress.dailyLossWarning && !progress.dailyLossExceeded) {
      await this.sendGoalWarning(
        userId,
        "⚠️ Approaching Daily Loss Limit",
        `You've lost $${progress.todayLoss.toFixed(0)} out of $${progress.maxDailyLoss} today. Trade carefully!`,
        "DAILY_LOSS"
      );
    }

    // Daily loss exceeded
    if (progress.dailyLossExceeded) {
      await this.sendGoalWarning(
        userId,
        "🛑 Daily Loss Limit Exceeded",
        `Stop trading! You've exceeded your daily loss limit of $${progress.maxDailyLoss}.`,
        "DAILY_LOSS"
      );
    }

    // Max trades warning
    if (progress.tradesRemainingToday === 1) {
      await this.sendGoalWarning(
        userId,
        "⏰ Last Trade Available",
        `You have only 1 trade remaining today. Make it count!`,
        "MAX_TRADES"
      );
    }

    // Max trades reached
    if (progress.maxTradesReached) {
      await this.sendGoalWarning(
        userId,
        "🛑 Max Trades Reached",
        `You've reached your daily limit of ${progress.maxTradesPerDay} trades. Take a break!`,
        "MAX_TRADES"
      );
    }

    // Win rate below goal
    if (!progress.onTrackForWinRate && progress.currentWinRate > 0) {
      await this.sendGoalWarning(
        userId,
        "📉 Win Rate Below Target",
        `Your win rate is ${progress.currentWinRate}%, below your ${progress.winRateGoal}% goal. Review your strategy.`,
        "WIN_RATE"
      );
    }
  }

  // Send trade result notification
  async sendTradeResultNotification(
    profit: number,
    currencyPair: string,
    isWin: boolean
  ): Promise<void> {
    try {
      const title = isWin ? "✅ Trade Closed - WIN!" : "❌ Trade Closed - LOSS";
      const body = isWin
        ? `+$${profit.toFixed(2)} profit on ${currencyPair}. Well done!`
        : `-$${Math.abs(profit).toFixed(2)} loss on ${currencyPair}. Learn and improve.`;

      await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data: { type: "TRADE_RESULT", profit, currencyPair },
          sound: true,
        },
        trigger: null,
      });
    } catch (error) {
      console.error("Error sending trade result notification:", error);
    }
  }

  // Send monthly goal achievement
  async sendMonthlyGoalAchievement(
    profit: number,
    target: number
  ): Promise<void> {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: "🎉 Monthly Goal Achieved!",
          body: `Congratulations! You've reached $${profit.toFixed(0)} of your $${target} monthly target!`,
          data: { type: "GOAL_ACHIEVED", profit, target },
          sound: true,
        },
        trigger: null,
      });
    } catch (error) {
      console.error("Error sending achievement notification:", error);
    }
  }

  // Setup notification listeners
  setupNotificationListeners(
    onNotificationReceived?: (notification: Notifications.Notification) => void,
    onNotificationTapped?: (
      response: Notifications.NotificationResponse
    ) => void
  ): void {
    // Listener for when notification is received while app is foregrounded
    this.notificationListener = Notifications.addNotificationReceivedListener(
      (notification) => {
        console.log("Notification received:", notification);
        if (onNotificationReceived) {
          onNotificationReceived(notification);
        }
      }
    );

    // Listener for when user taps on notification
    this.responseListener =
      Notifications.addNotificationResponseReceivedListener((response) => {
        console.log("Notification tapped:", response);
        if (onNotificationTapped) {
          onNotificationTapped(response);
        }
      });
  }

  // Remove listeners
  removeNotificationListeners(): void {
    if (this.notificationListener) {
      this.notificationListener.remove(); // ✅ PROMENI OVO
    }
    if (this.responseListener) {
      this.responseListener.remove(); // ✅ PROMENI OVO
    }
  }

  // Get all scheduled notifications
  async getAllScheduledNotifications(): Promise<
    Notifications.NotificationRequest[]
  > {
    return await Notifications.getAllScheduledNotificationsAsync();
  }

  // Cancel all notifications
  async cancelAllNotifications(): Promise<void> {
    await Notifications.cancelAllScheduledNotificationsAsync();
  }

  // Helper: Save notification schedule to database
  private async saveNotificationSchedule(
    userId: string,
    type: string,
    notificationId: string
  ): Promise<boolean> {
    try {
      const { error } = await supabase.from("notification_schedules").upsert({
        user_id: userId,
        type,
        notification_id: notificationId,
        created_at: new Date().toISOString(),
      });

      return !error;
    } catch (error) {
      console.error("Error saving notification schedule:", error);
      return false;
    }
  }

  // Helper: Get notification schedule from database
  private async getNotificationSchedule(
    userId: string,
    type: string
  ): Promise<{ id: string } | null> {
    try {
      const { data, error } = await supabase
        .from("notification_schedules")
        .select("notification_id")
        .eq("user_id", userId)
        .eq("type", type)
        .maybeSingle();

      if (error || !data) return null;

      return { id: data.notification_id };
    } catch (error) {
      console.error("Error getting notification schedule:", error);
      return null;
    }
  }

  // Helper: Delete notification schedule from database
  private async deleteNotificationSchedule(
    notificationId: string
  ): Promise<boolean> {
    try {
      const { error } = await supabase
        .from("notification_schedules")
        .delete()
        .eq("notification_id", notificationId);

      return !error;
    } catch (error) {
      console.error("Error deleting notification schedule:", error);
      return false;
    }
  }
}

export const notificationService = new NotificationService();
