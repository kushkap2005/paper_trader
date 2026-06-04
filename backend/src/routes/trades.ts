import { Router, Request, Response } from 'express';
import { fetchQuote } from '../stockApi';
import {
  getCash,
  updateCash,
  getHolding,
  upsertHolding,
  logTrade,
  getTrades,
} from '../database';
import { TradeRequest, Trade } from '../types';

const router = Router();

// GET /api/trades — trade history
router.get('/', (_req: Request, res: Response) => {
  try {
    const rows = getTrades(100);
    const trades: Trade[] = rows.map((r) => ({
      id: r.id,
      symbol: r.symbol,
      type: r.type,
      quantity: r.quantity,
      price: r.price,
      total: r.total,
      timestamp: r.timestamp,
    }));
    res.json(trades);
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ error: 'Internal Server Error', message: msg });
  }
});

// POST /api/trades — execute a buy or sell
router.post('/', async (req: Request, res: Response) => {
  const body = req.body as Partial<TradeRequest>;

  // Validate request body
  if (!body.symbol || !body.type || body.quantity === undefined) {
    return res.status(400).json({
      error: 'Bad Request',
      message: 'Missing required fields: symbol, type, quantity',
    });
  }

  if (!['buy', 'sell'].includes(body.type)) {
    return res.status(400).json({
      error: 'Bad Request',
      message: 'Type must be "buy" or "sell"',
    });
  }

  const quantity = Number(body.quantity);
  if (isNaN(quantity) || quantity <= 0 || !Number.isFinite(quantity)) {
    return res.status(400).json({
      error: 'Bad Request',
      message: 'Quantity must be a positive number',
    });
  }

  const symbol = body.symbol.toUpperCase();
  const type = body.type as 'buy' | 'sell';

  try {
    // Fetch current price
    const quote = await fetchQuote(symbol);
    const price = quote.currentPrice;
    const total = price * quantity;

    if (type === 'buy') {
      const cash = getCash();
      if (cash < total) {
        return res.status(400).json({
          error: 'Insufficient Funds',
          message: `Need ₹${total.toFixed(2)} but only have ₹${cash.toFixed(2)} cash`,
        });
      }

      // Deduct cash
      updateCash(cash - total);

      // Update holding with new avg buy price
      const existing = getHolding(symbol);
      if (existing && existing.quantity > 0) {
        const newQuantity = existing.quantity + quantity;
        const newAvgPrice =
          (existing.avg_buy_price * existing.quantity + price * quantity) / newQuantity;
        upsertHolding(symbol, newQuantity, newAvgPrice);
      } else {
        upsertHolding(symbol, quantity, price);
      }

      // Log the trade
      logTrade(symbol, 'buy', quantity, price);

      return res.status(201).json({
        message: `Successfully bought ${quantity} share(s) of ${symbol} at ₹${price.toFixed(2)}`,
        symbol,
        type: 'buy',
        quantity,
        price,
        total,
      });
    } else {
      // SELL
      const existing = getHolding(symbol);
      if (!existing || existing.quantity < quantity) {
        const owned = existing?.quantity ?? 0;
        return res.status(400).json({
          error: 'Insufficient Shares',
          message: `You own ${owned} share(s) of ${symbol} but tried to sell ${quantity}`,
        });
      }

      // Add cash
      const cash = getCash();
      updateCash(cash + total);

      // Reduce holding
      const newQuantity = existing.quantity - quantity;
      if (newQuantity === 0) {
        upsertHolding(symbol, 0, 0);
      } else {
        upsertHolding(symbol, newQuantity, existing.avg_buy_price);
      }

      // Log the trade
      logTrade(symbol, 'sell', quantity, price);

      return res.status(201).json({
        message: `Successfully sold ${quantity} share(s) of ${symbol} at ₹${price.toFixed(2)}`,
        symbol,
        type: 'sell',
        quantity,
        price,
        total,
      });
    }
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    if (msg.includes('not found')) {
      return res.status(404).json({ error: 'Not Found', message: msg });
    }
    return res.status(500).json({ error: 'Internal Server Error', message: msg });
  }
});

export default router;
