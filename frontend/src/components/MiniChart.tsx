import { useEffect, useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { BarChart2 } from 'lucide-react';
import { QuoteResponse } from '../types';

interface ChartPoint {
  time: string;
  price: number;
}

interface MiniChartProps {
  quote: QuoteResponse | null;
}

// Generate a plausible intraday price path from open to current using Brownian motion
function generateIntradayPath(quote: QuoteResponse): ChartPoint[] {
  const { openPrice, currentPrice, highPrice, lowPrice } = quote;
  const points: ChartPoint[] = [];
  const steps = 20;
  let price = openPrice;

  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const hour = 9 + Math.floor(t * 6.5);
    const min = Math.floor((t * 6.5 * 60) % 60);
    const time = `${hour}:${String(min).padStart(2, '0')}`;

    if (i === steps) {
      price = currentPrice;
    } else {
      // Drift toward currentPrice with some noise
      const drift = (currentPrice - price) / (steps - i);
      const range = (highPrice - lowPrice) * 0.1;
      const noise = (Math.random() - 0.5) * range;
      price = Math.max(lowPrice, Math.min(highPrice, price + drift + noise));
    }

    points.push({ time, price: parseFloat(price.toFixed(2)) });
  }
  return points;
}

export function MiniChart({ quote }: MiniChartProps) {
  const [data, setData] = useState<ChartPoint[]>([]);

  useEffect(() => {
    if (quote) {
      setData(generateIntradayPath(quote));
    }
  }, [quote]);

  if (!quote || data.length === 0) return null;

  const isPositive = quote.change >= 0;
  const color = isPositive ? '#22c55e' : '#ef4444';
  const min = Math.min(...data.map(d => d.price));
  const max = Math.max(...data.map(d => d.price));
  const domain = [min * 0.9995, max * 1.0005];

  return (
    <div className="panel panel-wide">
      <div className="panel-header">
        <BarChart2 size={16} className="panel-icon" />
        <span>INTRADAY — {quote.symbol}</span>
        <span style={{ marginLeft: 'auto', fontSize: '11px', opacity: 0.5 }}>Simulated path</span>
      </div>
      <div style={{ height: 180 }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 4, right: 8, bottom: 0, left: 8 }}>
            <defs>
              <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={color} stopOpacity={0.3} />
                <stop offset="95%" stopColor={color} stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="time"
              tick={{ fill: '#64748b', fontSize: 10 }}
              tickLine={false}
              axisLine={false}
              interval={4}
            />
            <YAxis
              domain={domain}
              tick={{ fill: '#64748b', fontSize: 10 }}
              tickLine={false}
              axisLine={false}
              tickFormatter={v => `₹${v.toFixed(0)}`}
              width={60}
            />
            <Tooltip
              contentStyle={{
                background: '#0f172a',
                border: `1px solid ${color}44`,
                borderRadius: 6,
                fontSize: 12,
                color: '#e2e8f0',
              }}
              formatter={(v: number) => [`₹${v.toFixed(2)}`, 'Price']}
            />
            <Area
              type="monotone"
              dataKey="price"
              stroke={color}
              strokeWidth={2}
              fill="url(#chartGrad)"
              dot={false}
              activeDot={{ r: 4, fill: color }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
