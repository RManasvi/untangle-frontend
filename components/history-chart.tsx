'use client'

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { StressData } from '@/app/page'

interface HistoryChartProps {
  data: StressData[]
}

export default function HistoryChart({ data }: HistoryChartProps) {
  // Prepare data for chart
  const chartData = data.map((d) => ({
    time: new Date(d.timestamp).toLocaleTimeString(),
    stress_score: parseFloat(d.stress_score.toFixed(2)),
    eyebrow_raise: parseFloat((d.eyebrow_raise * 10).toFixed(2)), // Scale for visibility
    blink_rate: parseFloat((d.blink_rate / 5).toFixed(2)), // Scale for visibility
    lip_tension: parseFloat((d.lip_tension * 100).toFixed(2)), // Scale for visibility
  }))

  return (
    <Card>
      <CardHeader>
        <CardTitle>Emotion Trends</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={350}>
          <LineChart
            data={chartData}
            margin={{ top: 5, right: 30, left: 0, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(210 40% 90%)" />
            <XAxis
              dataKey="time"
              stroke="hsl(210 10% 45%)"
              style={{ fontSize: '12px' }}
              tick={{ fill: 'hsl(210 10% 45%)' }}
            />
            <YAxis
              stroke="hsl(210 10% 45%)"
              style={{ fontSize: '12px' }}
              tick={{ fill: 'hsl(210 10% 45%)' }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#ffffff',
                border: '1px solid hsl(210 40% 90%)',
                borderRadius: '8px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
              }}
              labelStyle={{ color: 'hsl(210 15% 20%)' }}
              formatter={(value) => value.toFixed(2)}
            />
            <Legend
              wrapperStyle={{ color: 'hsl(210 10% 45%)' }}
              iconType="line"
            />
            <Line
              type="monotone"
              dataKey="stress_score"
              stroke="hsl(210 100% 50%)"
              dot={false}
              strokeWidth={2.5}
              name="Stress Level"
              isAnimationActive={false}
            />
            <Line
              type="monotone"
              dataKey="eyebrow_raise"
              stroke="hsl(180 100% 41%)"
              dot={false}
              strokeWidth={2}
              name="Attention"
              isAnimationActive={false}
              opacity={0.6}
            />
            <Line
              type="monotone"
              dataKey="blink_rate"
              stroke="hsl(210 80% 65%)"
              dot={false}
              strokeWidth={2}
              name="Alertness"
              isAnimationActive={false}
              opacity={0.6}
            />
            <Line
              type="monotone"
              dataKey="lip_tension"
              stroke="hsl(200 90% 62%)"
              dot={false}
              strokeWidth={2}
              name="Tension"
              isAnimationActive={false}
              opacity={0.6}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
