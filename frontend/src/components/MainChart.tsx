import { ComposedChart, Line, ReferenceLine, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { OHLCRow, MatchCase } from '../types'

interface Props {
  userOhlc: OHLCRow[]
  appliedMatches: MatchCase[]
}

export function MainChart({ userOhlc, appliedMatches }: Props) {
  const userClose = userOhlc
    .filter(r => r.close !== '' && !isNaN(Number(r.close)))
    .map((r, i) => ({ idx: i, user: Number(r.close) }))

  const splitIdx = userClose.length

  const futureData = appliedMatches.length > 0
    ? appliedMatches[0].futureOhlc.map((b, i) => ({
        idx: splitIdx + i,
        forecast: b.close,
      }))
    : []

  const combined = [...userClose, ...futureData]

  return (
    <ResponsiveContainer width="100%" height={300}>
      <ComposedChart data={combined}>
        <XAxis dataKey="idx" tick={false} />
        <YAxis domain={['auto', 'auto']} tick={{ fill: '#9ca3af', fontSize: 11 }} />
        <Tooltip contentStyle={{ background: '#1f2937', border: '1px solid #374151' }} />
        <Legend />
        <ReferenceLine
          x={splitIdx - 1}
          stroke="#f97316"
          strokeDasharray="6 3"
          label={{ value: 'Now', fill: '#f97316', fontSize: 12 }}
        />
        <Line type="monotone" dataKey="user" stroke="#60a5fa" dot={false} name="Current" />
        <Line type="monotone" dataKey="forecast" stroke="#34d399" dot={false} strokeDasharray="4 2" name="Forecast" />
      </ComposedChart>
    </ResponsiveContainer>
  )
}
