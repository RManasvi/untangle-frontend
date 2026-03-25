'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { StressData } from '@/app/page'

interface MetricsDisplayProps {
  metrics: StressData
}

export default function MetricsDisplay({ metrics }: MetricsDisplayProps) {
  const metricConfigs = [
    {
      label: 'Eyebrow Raise',
      value: metrics.eyebrow_raise,
      max: 0.08,
      description: 'Indicates surprise or focus',
      emotion: 'Attention',
    },
    {
      label: 'Lip Tension',
      value: metrics.lip_tension,
      max: 1.0,
      description: 'Mouth tension levels',
      emotion: 'Tension',
    },
    {
      label: 'Head Movement',
      value: metrics.head_nod_intensity,
      max: 1.5,
      description: 'Movement intensity',
      emotion: 'Engagement',
    },
    {
      label: 'Face Symmetry',
      value: metrics.symmetry_delta,
      max: 0.05,
      description: 'Expression balance',
      emotion: 'Equilibrium',
    },
    {
      label: 'Blink Rate',
      value: metrics.blink_rate,
      max: 30.0,
      description: 'Blinks per minute',
      emotion: 'Alertness',
    },
  ]

  const getBarColor = (ratio: number) => {
    if (ratio < 0.33) return 'bg-chart-1'
    if (ratio < 0.66) return 'bg-chart-2'
    return 'bg-chart-3'
  }

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>Emotion Indicators</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          {metricConfigs.map((metric) => {
            const ratio = Math.min(metric.value / metric.max, 1.5) * 0.67
            return (
              <div key={metric.label} className="space-y-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="font-semibold text-sm text-foreground">{metric.label}</h4>
                    <span className="text-xs font-mono text-muted-foreground">
                      {metric.value.toFixed(2)}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mb-2">{metric.emotion}</p>
                  <p className="text-xs text-muted-foreground/70">{metric.description}</p>
                </div>
                <div className="relative bg-secondary h-2 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${getBarColor(ratio)} transition-all duration-300`}
                    style={{ width: `${ratio * 100}%` }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
