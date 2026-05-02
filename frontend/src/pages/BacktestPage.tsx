import UnifiedNavBar from '../components/UnifiedNavBar'
import Footer from '../components/shared/Footer'
import SummaryCard from '../components/backtest/SummaryCard'
import PerTrendTable from '../components/backtest/PerTrendTable'
import TimeSeriesChart from '../components/backtest/TimeSeriesChart'
import ActiveParamsCard from '../components/backtest/ActiveParamsCard'
import { useBacktestData } from '../hooks/useBacktestData'

export default function BacktestPage() {
  const { summary, params, chartPoints, status, error } = useBacktestData()

  return (
    <div className="min-h-screen bg-paper text-ink">
      <UnifiedNavBar />
      <main className="mx-auto max-w-5xl px-6 py-12">
        <header className="mb-10">
          <h1 className="font-display text-3xl font-bold text-ink">Backtest Dashboard</h1>
          <p className="mt-2 font-mono text-sm text-ink/50">
            30-day rolling accuracy — ETH/USDT pattern predictions vs realized outcomes
          </p>
        </header>
        <div className="flex flex-col gap-8">
          <SummaryCard summary={summary} status={status} error={error} />
          <PerTrendTable summary={summary} status={status} />
          <TimeSeriesChart chartPoints={chartPoints} status={status} />
          <ActiveParamsCard params={params} status={status} error={error} />
        </div>
      </main>
      <Footer />
    </div>
  )
}
