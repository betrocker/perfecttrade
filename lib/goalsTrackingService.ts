import { Trade } from "@/types/trade";
import { supabase } from "./supabase";

export interface GoalsProgress {
  // Monthly target
  monthlyTarget: number;
  monthlyProgress: number;
  monthlyProgressPercent: number;
  daysLeftInMonth: number;
  dailyTargetRemaining: number;
  onTrackForMonthly: boolean;

  // Daily loss limit
  maxDailyLoss: number;
  todayLoss: number;
  dailyLossPercent: number;
  dailyLossWarning: boolean;
  dailyLossExceeded: boolean;

  // Win rate goal
  winRateGoal: number;
  currentWinRate: number;
  winRateGap: number;
  onTrackForWinRate: boolean;

  // Max trades per day
  maxTradesPerDay: number;
  todayTradesCount: number;
  tradesRemainingToday: number;
  maxTradesReached: boolean;

  // Additional insights
  avgDailyProfit: number;
  projectedMonthlyProfit: number;
}

class GoalsTrackingService {
  async getGoalsProgress(userId: string): Promise<GoalsProgress | null> {
    try {
      // Fetch user settings
      const { data: settings, error: settingsError } = await supabase
        .from("user_settings")
        .select("*")
        .eq("user_id", userId)
        .single();

      if (settingsError || !settings) {
        console.error("Error fetching settings:", settingsError);
        return null;
      }

      // Get current month trades
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

      const { data: monthTrades, error: monthError } = await supabase
        .from("trades")
        .select("*")
        .eq("user_id", userId)
        .eq("status", "CLOSED")
        .gte("created_at", startOfMonth.toISOString())
        .lte("created_at", endOfMonth.toISOString());

      if (monthError) {
        console.error("Error fetching month trades:", monthError);
        return null;
      }

      // Get today's trades
      const startOfDay = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate()
      );
      const endOfDay = new Date(startOfDay);
      endOfDay.setDate(endOfDay.getDate() + 1);

      const { data: todayTrades, error: todayError } = await supabase
        .from("trades")
        .select("*")
        .eq("user_id", userId)
        .gte("created_at", startOfDay.toISOString())
        .lt("created_at", endOfDay.toISOString());

      if (todayError) {
        console.error("Error fetching today trades:", todayError);
        return null;
      }

      // Calculate monthly progress
      const monthlyProfit = (monthTrades || []).reduce(
        (sum: number, trade: Trade) => sum + (trade.profit_loss || 0),
        0
      );

      const monthlyTarget = settings.monthly_target || 0;
      const monthlyProgressPercent =
        monthlyTarget > 0 ? (monthlyProfit / monthlyTarget) * 100 : 0;

      const daysInMonth = endOfMonth.getDate();
      const currentDay = now.getDate();
      const daysLeftInMonth = daysInMonth - currentDay;

      const avgDailyProfit = currentDay > 0 ? monthlyProfit / currentDay : 0;
      const projectedMonthlyProfit = avgDailyProfit * daysInMonth;

      const targetRemaining = Math.max(0, monthlyTarget - monthlyProfit);
      const dailyTargetRemaining =
        daysLeftInMonth > 0
          ? targetRemaining / daysLeftInMonth
          : targetRemaining;

      const onTrackForMonthly = projectedMonthlyProfit >= monthlyTarget;

      // Calculate today's loss
      const todayLoss = Math.abs(
        (todayTrades || [])
          .filter((trade: Trade) => (trade.profit_loss || 0) < 0)
          .reduce(
            (sum: number, trade: Trade) => sum + (trade.profit_loss || 0),
            0
          )
      );

      const maxDailyLoss = settings.max_daily_loss || 0;
      const dailyLossPercent =
        maxDailyLoss > 0 ? (todayLoss / maxDailyLoss) * 100 : 0;
      const dailyLossWarning = dailyLossPercent >= 80;
      const dailyLossExceeded = todayLoss >= maxDailyLoss;

      // Calculate win rate
      const totalTrades = (monthTrades || []).length;
      const winningTrades = (monthTrades || []).filter(
        (trade: Trade) => (trade.profit_loss || 0) > 0
      ).length;
      const currentWinRate =
        totalTrades > 0 ? (winningTrades / totalTrades) * 100 : 0;

      const winRateGoal = settings.win_rate_goal || 0;
      const winRateGap = currentWinRate - winRateGoal;
      const onTrackForWinRate = currentWinRate >= winRateGoal;

      // Calculate trades per day
      const todayTradesCount = (todayTrades || []).length;
      const maxTradesPerDay = settings.max_trades_per_day || 0;
      const tradesRemainingToday = Math.max(
        0,
        maxTradesPerDay - todayTradesCount
      );
      const maxTradesReached = todayTradesCount >= maxTradesPerDay;

      return {
        monthlyTarget,
        monthlyProgress: monthlyProfit,
        monthlyProgressPercent: Math.round(monthlyProgressPercent),
        daysLeftInMonth,
        dailyTargetRemaining,
        onTrackForMonthly,

        maxDailyLoss,
        todayLoss,
        dailyLossPercent: Math.round(dailyLossPercent),
        dailyLossWarning,
        dailyLossExceeded,

        winRateGoal,
        currentWinRate: Math.round(currentWinRate),
        winRateGap: Math.round(winRateGap),
        onTrackForWinRate,

        maxTradesPerDay,
        todayTradesCount,
        tradesRemainingToday,
        maxTradesReached,

        avgDailyProfit,
        projectedMonthlyProfit,
      };
    } catch (error) {
      console.error("Error calculating goals progress:", error);
      return null;
    }
  }

  async shouldBlockTrading(userId: string): Promise<{
    blocked: boolean;
    reason: string;
  }> {
    const progress = await this.getGoalsProgress(userId);

    if (!progress) {
      return { blocked: false, reason: "" };
    }

    // Check if daily loss limit exceeded
    if (progress.dailyLossExceeded) {
      return {
        blocked: true,
        reason: `Daily loss limit of $${progress.maxDailyLoss} exceeded. Stop trading for today.`,
      };
    }

    // Check if max trades per day reached
    if (progress.maxTradesReached) {
      return {
        blocked: true,
        reason: `Maximum ${progress.maxTradesPerDay} trades per day reached. Take a break!`,
      };
    }

    return { blocked: false, reason: "" };
  }
}

export const goalsTrackingService = new GoalsTrackingService();
