import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

import quoteRouter from './routes/quote';
import tradesRouter from './routes/trades';
import portfolioRouter from './routes/portfolio';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000', 'http://127.0.0.1:5173'],
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use((req, _res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// Health check
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    apiKeyConfigured: !!process.env.FINNHUB_API_KEY,
  });
});

// Routes
app.use('/api/quote', quoteRouter);
app.use('/api/trades', tradesRouter);
app.use('/api/portfolio', portfolioRouter);

// 404 handler
app.use((_req, res) => {
  res.status(404).json({ error: 'Not Found', message: 'Route not found' });
});

// Global error handler
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal Server Error', message: err.message });
});

app.listen(PORT, () => {
  console.log(`\n🚀 Paper Trader Backend running on http://localhost:${PORT}`);
  console.log(`   API Key: ${process.env.FINNHUB_API_KEY ? '✅ Configured' : '⚠️  Not set (using mock data)'}`);
  console.log(`   Health:  http://localhost:${PORT}/api/health\n`);
});

export default app;
