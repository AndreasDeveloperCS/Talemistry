"use client"

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Funnel,
  FunnelChart,
  LabelList,
  Line,
  LineChart,
  Pie,
  PieChart,
  PolarAngleAxis,
  PolarGrid,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"

const AXIS = "var(--color-muted-foreground)"
const GRID = "var(--color-border)"

function TooltipBox({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg border border-border bg-popover px-3 py-2 text-xs shadow-lg">
      {label ? <p className="mb-1 font-semibold text-popover-foreground">{label}</p> : null}
      {payload.map((p: any, i: number) => (
        <p key={i} className="flex items-center gap-2 text-muted-foreground">
          <span className="h-2 w-2 rounded-full" style={{ background: p.color || p.fill }} />
          <span className="text-popover-foreground">{p.name}:</span> {p.value}
        </p>
      ))}
    </div>
  )
}

export function TrendArea({ data }: { data: { label: string; hires: number; applicants: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={240}>
      <AreaChart data={data} margin={{ left: -18, right: 8, top: 8 }}>
        <defs>
          <linearGradient id="gApplicants" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--color-primary)" stopOpacity={0.35} />
            <stop offset="100%" stopColor="var(--color-primary)" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="gHires" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--color-secondary)" stopOpacity={0.4} />
            <stop offset="100%" stopColor="var(--color-secondary)" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke={GRID} vertical={false} />
        <XAxis dataKey="label" stroke={AXIS} fontSize={11} tickLine={false} axisLine={false} />
        <YAxis stroke={AXIS} fontSize={11} tickLine={false} axisLine={false} />
        <Tooltip content={<TooltipBox />} />
        <Area
          type="monotone"
          dataKey="applicants"
          name="Applicants"
          stroke="var(--color-primary)"
          fill="url(#gApplicants)"
          strokeWidth={2}
        />
        <Area
          type="monotone"
          dataKey="hires"
          name="Hires"
          stroke="var(--color-secondary)"
          fill="url(#gHires)"
          strokeWidth={2}
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}

export function FunnelBars({ data }: { data: { label: string; value: number; color: string }[] }) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data} layout="vertical" margin={{ left: 24, right: 24 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={GRID} horizontal={false} />
        <XAxis type="number" stroke={AXIS} fontSize={11} tickLine={false} axisLine={false} />
        <YAxis
          type="category"
          dataKey="label"
          stroke={AXIS}
          fontSize={11}
          width={92}
          tickLine={false}
          axisLine={false}
        />
        <Tooltip content={<TooltipBox />} cursor={{ fill: "var(--color-muted)" }} />
        <Bar dataKey="value" name="Candidates" radius={[0, 6, 6, 0]}>
          {data.map((d, i) => (
            <Cell key={i} fill={d.color} />
          ))}
          <LabelList dataKey="value" position="right" fontSize={11} fill="var(--color-foreground)" />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}

export function SourceDonut({ data }: { data: { label: string; value: number; color: string }[] }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <PieChart>
        <Tooltip content={<TooltipBox />} />
        <Pie
          data={data}
          dataKey="value"
          nameKey="label"
          innerRadius={55}
          outerRadius={85}
          paddingAngle={2}
          stroke="none"
        >
          {data.map((d, i) => (
            <Cell key={i} fill={d.color} />
          ))}
        </Pie>
      </PieChart>
    </ResponsiveContainer>
  )
}

export function TimeToHireLine({ data }: { data: { label: string; days: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <LineChart data={data} margin={{ left: -18, right: 8, top: 8 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={GRID} vertical={false} />
        <XAxis dataKey="label" stroke={AXIS} fontSize={11} tickLine={false} axisLine={false} />
        <YAxis stroke={AXIS} fontSize={11} tickLine={false} axisLine={false} />
        <Tooltip content={<TooltipBox />} />
        <Line
          type="monotone"
          dataKey="days"
          name="Days to hire"
          stroke="var(--color-accent)"
          strokeWidth={2.5}
          dot={{ r: 3, fill: "var(--color-accent)" }}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}

export function FitRadar({ data }: { data: { axis: string; value: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <RadarChart data={data} outerRadius="72%">
        <PolarGrid stroke={GRID} />
        <PolarAngleAxis dataKey="axis" tick={{ fill: AXIS, fontSize: 11 }} />
        <Radar
          dataKey="value"
          stroke="var(--color-primary)"
          fill="var(--color-primary)"
          fillOpacity={0.28}
          strokeWidth={2}
        />
        <Tooltip content={<TooltipBox />} />
      </RadarChart>
    </ResponsiveContainer>
  )
}
