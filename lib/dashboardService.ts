import { Trade } from "@/types/trade";
import { supabase } from "./supabase";

export interface DashboardStats {
  netProfitLoss: number;
  totalTrades: number;
  winRate: number;
  profitFactor: number;
  avgConfluence: number;
  totalProfit: number;
  winningTrades: number;
  totalLoss: number;
  losingTrades: number;
  largestWin: number;
  largestLoss: number;
  bestStreak: number;
  worstStreak: number;
  longTradesWinRate: number;
  shortTradesWinRate: number;
  breakEvenTrades: number;
}

export interface TradingDay {
  date: string;
  profit: number;
  trades: Trade[];
  winRate: number;
}

export interface PerformingPair {
  pair: string;
  profit: number;
  trades: number;
  wins: number;
  losses: number;
  winRate: number;
}

export interface MonthlyPnL {
  month: string;
  profit: number;
  trades: number;
}

export interface WeeklySummary {
  week: number;
  profit: number;
  days: number;
  trades: number;
}

class DashboardService {
  async getDashboardStats(userId: string): Promise<DashboardStats> {
    const { data: trades, error } = await supabase
      .from("trades")
      .select("*")
      .eq("user_id", userId)
      .eq("status", "CLOSED");

    if (error || !trades) {
      return this.getEmptyStats();
    }

    const closedTrades = trades as Trade[];

    if (closedTrades.length === 0) {
      return this.getEmptyStats();
    }

    // Calculate basic stats
    const totalProfit = closedTrades
      .filter((t) => (t.profit_loss || 0) > 0)
      .reduce((sum, t) => sum + (t.profit_loss || 0), 0);

    const totalLoss = Math.abs(
      closedTrades
        .filter((t) => (t.profit_loss || 0) < 0)
        .reduce((sum, t) => sum + (t.profit_loss || 0), 0)
    );

    const netProfitLoss = closedTrades.reduce(
      (sum, t) => sum + (t.profit_loss || 0),
      0
    );

    const winningTrades = closedTrades.filter(
      (t) => (t.profit_loss || 0) > 0
    ).length;
    const losingTrades = closedTrades.filter(
      (t) => (t.profit_loss || 0) < 0
    ).length;
    const breakEvenTrades = closedTrades.filter(
      (t) => t.profit_loss === 0
    ).length;

    const winRate =
      closedTrades.length > 0
        ? Math.round((winningTrades / closedTrades.length) * 100)
        : 0;

    const profitFactor =
      totalLoss > 0 ? Number((totalProfit / totalLoss).toFixed(2)) : 0;

    const avgConfluence =
      closedTrades.length > 0
        ? Math.round(
            closedTrades.reduce(
              (sum, t) => sum + (t.confluence_score || 0),
              0
            ) / closedTrades.length
          )
        : 0;

    // Largest win and loss
    const largestWin =
      closedTrades.length > 0
        ? Math.max(...closedTrades.map((t) => t.profit_loss || 0))
        : 0;

    const largestLoss =
      closedTrades.length > 0
        ? Math.abs(Math.min(...closedTrades.map((t) => t.profit_loss || 0)))
        : 0;

    // Calculate streaks
    const { bestStreak, worstStreak } = this.calculateStreaks(closedTrades);

    // Long/Short win rates
    const longTrades = closedTrades.filter((t) => t.direction === "LONG");
    const shortTrades = closedTrades.filter((t) => t.direction === "SHORT");

    const longWins = longTrades.filter((t) => (t.profit_loss || 0) > 0).length;
    const shortWins = shortTrades.filter(
      (t) => (t.profit_loss || 0) > 0
    ).length;

    const longTradesWinRate =
      longTrades.length > 0
        ? Math.round((longWins / longTrades.length) * 100)
        : 0;

    const shortTradesWinRate =
      shortTrades.length > 0
        ? Math.round((shortWins / shortTrades.length) * 100)
        : 0;

    return {
      netProfitLoss,
      totalTrades: closedTrades.length,
      winRate,
      profitFactor,
      avgConfluence,
      totalProfit,
      winningTrades,
      totalLoss,
      losingTrades,
      largestWin,
      largestLoss,
      bestStreak,
      worstStreak,
      longTradesWinRate,
      shortTradesWinRate,
      breakEvenTrades,
    };
  }

  async getTradingDays(
    userId: string,
    year?: number,
    month?: number
  ): Promise<Record<string, TradingDay>> {
    let query = supabase
      .from("trades")
      .select("*")
      .eq("user_id", userId)
      .eq("status", "CLOSED")
      .order("created_at", { ascending: true });

    const { data: trades, error } = await query;

    if (error || !trades) {
      return {};
    }

    const tradingDays: Record<string, TradingDay> = {};

    trades.forEach((trade: Trade) => {
      const dateKey = trade.created_at.split("T")[0]; // YYYY-MM-DD

      // Filter by year/month if provided
      if (year !== undefined || month !== undefined) {
        const tradeDate = new Date(trade.created_at);
        if (year !== undefined && tradeDate.getFullYear() !== year) return;
        if (month !== undefined && tradeDate.getMonth() !== month) return;
      }

      if (!tradingDays[dateKey]) {
        tradingDays[dateKey] = {
          date: dateKey,
          profit: 0,
          trades: [],
          winRate: 0,
        };
      }

      tradingDays[dateKey].trades.push(trade);
      tradingDays[dateKey].profit += trade.profit_loss || 0;
    });

    // Calculate win rate for each day
    Object.keys(tradingDays).forEach((dateKey) => {
      const day = tradingDays[dateKey];
      const wins = day.trades.filter((t) => (t.profit_loss || 0) > 0).length;
      day.winRate =
        day.trades.length > 0
          ? Math.round((wins / day.trades.length) * 100)
          : 0;
    });

    return tradingDays;
  }

  async getPerformingPairs(
    userId: string
  ): Promise<{ best: PerformingPair | null; worst: PerformingPair | null }> {
    const { data: trades, error } = await supabase
      .from("trades")
      .select("*")
      .eq("user_id", userId)
      .eq("status", "CLOSED");

    if (error || !trades || trades.length === 0) {
      return { best: null, worst: null };
    }

    const pairStats: Record<string, PerformingPair> = {};

    trades.forEach((trade: Trade) => {
      const pair = trade.currency_pair;

      if (!pairStats[pair]) {
        pairStats[pair] = {
          pair,
          profit: 0,
          trades: 0,
          wins: 0,
          losses: 0,
          winRate: 0,
        };
      }

      pairStats[pair].profit += trade.profit_loss || 0;
      pairStats[pair].trades += 1;

      if ((trade.profit_loss || 0) > 0) {
        pairStats[pair].wins += 1;
      } else if ((trade.profit_loss || 0) < 0) {
        pairStats[pair].losses += 1;
      }
    });

    // Calculate win rates
    Object.keys(pairStats).forEach((pair) => {
      const stats = pairStats[pair];
      stats.winRate =
        stats.trades > 0 ? Math.round((stats.wins / stats.trades) * 100) : 0;
    });

    const pairArray = Object.values(pairStats);

    if (pairArray.length === 0) {
      return { best: null, worst: null };
    }

    const best = pairArray.reduce((max, curr) =>
      curr.profit > max.profit ? curr : max
    );
    const worst = pairArray.reduce((min, curr) =>
      curr.profit < min.profit ? curr : min
    );

    return { best, worst };
  }

  async getMonthlyPnL(
    userId: string,
    monthsBack: number = 6
  ): Promise<MonthlyPnL[]> {
    const { data: trades, error } = await supabase
      .from("trades")
      .select("*")
      .eq("user_id", userId)
      .eq("status", "CLOSED")
      .order("created_at", { ascending: true });

    if (error || !trades) {
      return [];
    }

    const monthlyStats: Record<string, MonthlyPnL> = {};

    trades.forEach((trade: Trade) => {
      const date = new Date(trade.created_at);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      const monthLabel = date.toLocaleDateString("en-US", {
        month: "short",
        year: "numeric",
      });

      if (!monthlyStats[monthKey]) {
        monthlyStats[monthKey] = {
          month: monthLabel,
          profit: 0,
          trades: 0,
        };
      }

      monthlyStats[monthKey].profit += trade.profit_loss || 0;
      monthlyStats[monthKey].trades += 1;
    });

    // Get last N months
    const sortedMonths = Object.keys(monthlyStats).sort().slice(-monthsBack);

    return sortedMonths.map((key) => monthlyStats[key]);
  }

  async getWeeklySummary(
    userId: string,
    year: number,
    month: number
  ): Promise<WeeklySummary[]> {
    const tradingDays = await this.getTradingDays(userId, year, month);

    // Get number of weeks in the month
    const lastDay = new Date(year, month + 1, 0).getDate();
    const numberOfWeeks = Math.ceil(lastDay / 7);

    // Initialize all weeks
    const weeks: Record<number, WeeklySummary> = {};
    for (let i = 1; i <= numberOfWeeks; i++) {
      weeks[i] = {
        week: i,
        profit: 0,
        days: 0,
        trades: 0,
      };
    }

    // Populate with actual trading data
    Object.values(tradingDays).forEach((day) => {
      const date = new Date(day.date);
      const weekNumber = Math.ceil(date.getDate() / 7);

      weeks[weekNumber].profit += day.profit;
      weeks[weekNumber].days += 1;
      weeks[weekNumber].trades += day.trades.length;
    });

    return Object.values(weeks).sort((a, b) => a.week - b.week);
  }

  private calculateStreaks(trades: Trade[]): {
    bestStreak: number;
    worstStreak: number;
  } {
    if (trades.length === 0) return { bestStreak: 0, worstStreak: 0 };

    let currentStreak = 0;
    let bestStreak = 0;
    let worstStreak = 0;
    let lastWasWin = false;

    // Sort by date
    const sortedTrades = [...trades].sort(
      (a, b) =>
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );

    sortedTrades.forEach((trade, index) => {
      const isWin = (trade.profit_loss || 0) > 0;

      if (index === 0) {
        currentStreak = isWin ? 1 : -1;
        lastWasWin = isWin;
      } else {
        if (isWin === lastWasWin) {
          currentStreak = isWin ? currentStreak + 1 : currentStreak - 1;
        } else {
          if (currentStreak > bestStreak) bestStreak = currentStreak;
          if (currentStreak < worstStreak) worstStreak = currentStreak;
          currentStreak = isWin ? 1 : -1;
          lastWasWin = isWin;
        }
      }
    });

    // Check final streak
    if (currentStreak > bestStreak) bestStreak = currentStreak;
    if (currentStreak < worstStreak) worstStreak = currentStreak;

    return {
      bestStreak: Math.max(bestStreak, 0),
      worstStreak: Math.abs(worstStreak),
    };
  }

  private getEmptyStats(): DashboardStats {
    return {
      netProfitLoss: 0,
      totalTrades: 0,
      winRate: 0,
      profitFactor: 0,
      avgConfluence: 0,
      totalProfit: 0,
      winningTrades: 0,
      totalLoss: 0,
      losingTrades: 0,
      largestWin: 0,
      largestLoss: 0,
      bestStreak: 0,
      worstStreak: 0,
      longTradesWinRate: 0,
      shortTradesWinRate: 0,
      breakEvenTrades: 0,
    };
  }
}

export const dashboardService = new DashboardService();
