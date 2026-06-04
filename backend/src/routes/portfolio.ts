import { Router, Request, Response } from 'express';
import { fetchQuote } from '../stockApi';
import {
  getCash,
  getHoldings,
  HoldingRow,
} from '../database';
import { Portfolio, Holding } from '../types';

const router = Router();

// GET /api/portfolio — current holdings + cash + total value
router.get('/', async (_req: Request, res: Response) => {
  try {
    const cash = getCash();
    const holdingRows: HoldingRow[] = getHoldings();

    // Fetch current prices for all holdings in parallel
    const holdingsWithPrices: Holding[] = await Promise.all(
      holdingRows.map(async (row) => {
        try {
          const quote = await fetchQuote(row.symbol);
          const currentValue = quote.currentPrice * row.quantity;
          const invested = row.avg_buy_price * row.quantity;
          const profitLoss = currentValue - invested;
          const profitLossPercent = invested > 0 ? (profitLoss / invested) * 100 : 0;

          return {
            id: row.id,
            symbol: row.symbol,
            quantity: row.quantity,
            avgBuyPrice: row.avg_buy_price,
            currentPrice: quote.currentPrice,
            currentValue,
            profitLoss,
            profitLossPercent,
          };
        } catch {
          // If price fetch fails, return holding without current price
          return {
            id: row.id,
            symbol: row.symbol,
            quantity: row.quantity,
            avgBuyPrice: row.avg_buy_price,
            currentPrice: row.avg_buy_price,
            currentValue: row.avg_buy_price * row.quantity,
            profitLoss: 0,
            profitLossPercent: 0,
          };
        }
      })
    );

    const totalInvested = holdingsWithPrices.reduce(
      (sum, h) => sum + h.avgBuyPrice * h.quantity,
      0
    );
    const holdingsValue = holdingsWithPrices.reduce(
      (sum, h) => sum + (h.currentValue ?? 0),
      0
    );
    const totalValue = cash + holdingsValue;
    const totalProfitLoss = holdingsValue - totalInvested;
    const totalProfitLossPercent =
      totalInvested > 0 ? (totalProfitLoss / totalInvested) * 100 : 0;

    const portfolio: Portfolio = {
      cash,
      holdings: holdingsWithPrices,
      totalValue,
      totalInvested,
      totalProfitLoss,
      totalProfitLossPercent,
    };

    res.json(portfolio);
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ error: 'Internal Server Error', message: msg });
  }
});

export default router;
