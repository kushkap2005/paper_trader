import { Router, Request, Response } from 'express';
import { fetchQuote } from '../stockApi';

const router = Router();

// GET /api/quote/:symbol — fetch current stock price
router.get('/:symbol', async (req: Request, res: Response) => {
  const { symbol } = req.params;

  if (!symbol || symbol.length > 10) {
    return res.status(400).json({
      error: 'Bad Request',
      message: 'Invalid stock symbol',
    });
  }

  try {
    const quote = await fetchQuote(symbol);
    return res.json(quote);
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    if (msg.includes('not found')) {
      return res.status(404).json({ error: 'Not Found', message: msg });
    }
    return res.status(500).json({ error: 'Internal Server Error', message: msg });
  }
});

export default router;
