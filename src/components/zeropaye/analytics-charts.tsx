"use client";

import { useMemo } from "react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, BarChart, Bar,
} from "recharts";

// Generate simulated 7-day revenue data for the demo
function generateRevenueData() {
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  return days.map((day, i) => ({
    day,
    revenue: Math.floor(Math.random() * 8000 + 2000),
    fees: Math.floor(Math.random() * 200 + 50),
    transactions: Math.floor(Math.random() * 15 + 5),
  }));
}

const STATUS_COLORS: Record<string, string> = {
  Success: "#10b981",
  Active: "#14b8a6",
  Queued: "#06b6d4",
  Failed: "#f43f5e",
  Expired: "#f59e0b",
};

interface AnalyticsChartsProps {
  stats?: {
    total: number;
    success: number;
    active: number;
    queued: number;
    failed: number;
    totalSettledPaise: number;
    feesSavedPaise: number;
    successRate: number;
  };
  sessions?: any[];
}

export function AnalyticsCharts({ stats, sessions }: AnalyticsChartsProps) {
  const revenueData = useMemo(() => generateRevenueData(), []);

  const statusData = useMemo(() => {
    if (!stats) return [];
    return [
      { name: "Success", value: stats.success, color: STATUS_COLORS.Success },
      { name: "Active", value: stats.active, color: STATUS_COLORS.Active },
      { name: "Queued", value: stats.queued, color: STATUS_COLORS.Queued },
      { name: "Failed", value: stats.failed, color: STATUS_COLORS.Failed },
    ].filter(d => d.value > 0);
  }, [stats]);

  const txVolumeData = useMemo(() => {
    if (!stats) return [];
    return [
      { hour: "6am", tx: 2 },
      { hour: "9am", tx: 5 },
      { hour: "12pm", tx: 8 },
      { hour: "3pm", tx: 12 },
      { hour: "6pm", tx: 15 },
      { hour: "9pm", tx: 7 },
      { hour: "12am", tx: 3 },
    ];
  }, [stats]);

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {/* Revenue Area Chart */}
      <div className="rounded-xl border border-border/40 bg-card p-4">
        <h4 className="mb-3 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Revenue (7 days)
        </h4>
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={revenueData}>
            <defs>
              <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#0d9488" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#0d9488" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
            <XAxis dataKey="day" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
            <YAxis tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "8px",
                fontSize: "12px",
              }}
              formatter={(value: any) => [`₹${value}`, "Revenue"]}
            />
            <Area
              type="monotone"
              dataKey="revenue"
              stroke="#0d9488"
              strokeWidth={2}
              fill="url(#revGrad)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Status Pie Chart */}
      {statusData.length > 0 && (
        <div className="rounded-xl border border-border/40 bg-card p-4">
          <h4 className="mb-3 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Payment Status Distribution
          </h4>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={statusData}
                cx="50%"
                cy="50%"
                innerRadius={45}
                outerRadius={75}
                paddingAngle={3}
                dataKey="value"
              >
                {statusData.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                  fontSize: "12px",
                }}
              />
              <Legend
                wrapperStyle={{ fontSize: "10px", paddingTop: "8px" }}
                iconType="circle"
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Transaction Volume Bar Chart */}
      <div className="rounded-xl border border-border/40 bg-card p-4 lg:col-span-2">
        <h4 className="mb-3 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Transaction Volume (hourly)
        </h4>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={txVolumeData}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
            <XAxis dataKey="hour" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
            <YAxis tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "8px",
                fontSize: "12px",
              }}
            />
            <Bar dataKey="tx" fill="#0891b2" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
