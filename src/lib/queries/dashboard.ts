"use client";

import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";

const supabase = createClient();

export const dashboardKeys = {
  all: ["dashboard"] as const,
  metrics: () => [...dashboardKeys.all, "metrics"] as const,
};

export interface DashboardMetrics {
  totalRevenue: number;
  revenueChange: number;
  activeDeals: number;
  dealsChange: number;
  newClients: number;
  clientsChange: number;
  winRate: number;
  winRateChange: number;
}

export function useDashboardMetrics() {
  return useQuery({
    queryKey: dashboardKeys.metrics(),
    queryFn: async () => {
      // Get current month's deals (closed won)
      const now = new Date();
      const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

      // Total Revenue (closed won deals this month)
      const { data: currentMonthDeals, error: currentRevenueError } = await supabase
        .from("deals")
        .select("value")
        .eq("stage", "closed_won")
        .gte("updated_at", currentMonthStart.toISOString());

      if (currentRevenueError) throw currentRevenueError;

      const totalRevenue = currentMonthDeals?.reduce((sum, deal) => sum + (deal.value || 0), 0) || 0;

      // Last month revenue for comparison
      const { data: lastMonthDeals, error: lastRevenueError } = await supabase
        .from("deals")
        .select("value")
        .eq("stage", "closed_won")
        .gte("updated_at", lastMonthStart.toISOString())
        .lt("updated_at", currentMonthStart.toISOString());

      if (lastRevenueError) throw lastRevenueError;

      const lastMonthRevenue = lastMonthDeals?.reduce((sum, deal) => sum + (deal.value || 0), 0) || 0;
      let revenueChange = 0;
      if (lastMonthRevenue === 0 && totalRevenue > 0) {
        revenueChange = 100;
      } else if (lastMonthRevenue > 0) {
        revenueChange = ((totalRevenue - lastMonthRevenue) / lastMonthRevenue) * 100;
      }

      // Active Deals (not closed)
      const { count: activeDealsCount, error: activeDealsError } = await supabase
        .from("deals")
        .select("*", { count: "exact", head: true })
        .not("stage", "in", '("closed_won","closed_lost")');

      if (activeDealsError) throw activeDealsError;

      // Last month active deals
      const { count: lastMonthActiveDeals, error: lastActiveDealsError } = await supabase
        .from("deals")
        .select("*", { count: "exact", head: true })
        .not("stage", "in", '("closed_won","closed_lost")')
        .lt("created_at", currentMonthStart.toISOString());

      if (lastActiveDealsError) throw lastActiveDealsError;

      const activeDeals = activeDealsCount || 0;
      let dealsChange = 0;
      if (lastMonthActiveDeals === 0 && activeDeals > 0) {
        dealsChange = 100;
      } else if (lastMonthActiveDeals && lastMonthActiveDeals > 0) {
        dealsChange = ((activeDeals - lastMonthActiveDeals) / lastMonthActiveDeals) * 100;
      }

      // New Clients (this month)
      const { count: newClientsCount, error: newClientsError } = await supabase
        .from("clients")
        .select("*", { count: "exact", head: true })
        .gte("created_at", currentMonthStart.toISOString());

      if (newClientsError) throw newClientsError;

      // Last month new clients
      const { count: lastMonthClients, error: lastClientsError } = await supabase
        .from("clients")
        .select("*", { count: "exact", head: true })
        .gte("created_at", lastMonthStart.toISOString())
        .lt("created_at", currentMonthStart.toISOString());

      if (lastClientsError) throw lastClientsError;

      const newClients = newClientsCount || 0;
      // Calculate percentage change, handling edge cases:
      // - If both are 0: no change (0%)
      // - If last month was 0 but current is positive: show as 100% growth
      // - If last month was positive but current is 0: show as -100%
      // - Otherwise: normal percentage calculation
      let clientsChange = 0;
      if (lastMonthClients === 0 && newClients > 0) {
        clientsChange = 100; // Growth from nothing
      } else if (lastMonthClients && lastMonthClients > 0) {
        clientsChange = ((newClients - lastMonthClients) / lastMonthClients) * 100;
      }

      // Win Rate (closed won / total closed)
      const { count: wonDeals, error: wonError } = await supabase
        .from("deals")
        .select("*", { count: "exact", head: true })
        .eq("stage", "closed_won")
        .gte("updated_at", currentMonthStart.toISOString());

      if (wonError) throw wonError;

      const { count: lostDeals, error: lostError } = await supabase
        .from("deals")
        .select("*", { count: "exact", head: true })
        .eq("stage", "closed_lost")
        .gte("updated_at", currentMonthStart.toISOString());

      if (lostError) throw lostError;

      const totalClosed = (wonDeals || 0) + (lostDeals || 0);
      const winRate = totalClosed > 0 ? ((wonDeals || 0) / totalClosed) * 100 : 0;

      // Last month win rate
      const { count: lastWonDeals, error: lastWonError } = await supabase
        .from("deals")
        .select("*", { count: "exact", head: true })
        .eq("stage", "closed_won")
        .gte("updated_at", lastMonthStart.toISOString())
        .lt("updated_at", currentMonthStart.toISOString());

      if (lastWonError) throw lastWonError;

      const { count: lastLostDeals, error: lastLostError } = await supabase
        .from("deals")
        .select("*", { count: "exact", head: true })
        .eq("stage", "closed_lost")
        .gte("updated_at", lastMonthStart.toISOString())
        .lt("updated_at", currentMonthStart.toISOString());

      if (lastLostError) throw lastLostError;

      const lastTotalClosed = (lastWonDeals || 0) + (lastLostDeals || 0);
      const lastWinRate = lastTotalClosed > 0 ? ((lastWonDeals || 0) / lastTotalClosed) * 100 : 0;
      const winRateChange = lastWinRate > 0 ? winRate - lastWinRate : 0;

      return {
        totalRevenue,
        revenueChange,
        activeDeals,
        dealsChange,
        newClients,
        clientsChange,
        winRate,
        winRateChange,
      } as DashboardMetrics;
    },
  });
}
