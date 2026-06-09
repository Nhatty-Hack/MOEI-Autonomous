import 'dotenv/config';
import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import { mockApplications } from './src/data';
import { assessApplication } from './src/services/assessment';
import { processWithAgent } from './src/services/agent';
import { GOVERNANCE } from './src/services/complianceEngine';
import { loadHistoricalData, getHistoricalStats } from './src/services/dataLoader';
import { HistoricalRecord, HistoricalStats } from './src/types';

// ── Async error wrapper ────────────────────────────────────────────────────────
function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<void>,
) {
  return (req: Request, res: Response, next: NextFunction) => {
    fn(req, res, next).catch(next);
  };
}

// ── Historical data (loaded at startup) ────────────────────────────────────────
let historicalRecords: HistoricalRecord[] = [];
let historicalStats: HistoricalStats | null = null;

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // ── Request logger ───────────────────────────────────────────────────────
  app.use((req: Request, _res: Response, next: NextFunction) => {
    console.log(`${req.method} ${req.url}`);
    next();
  });

  // ── Load historical data at startup ──────────────────────────────────────
  const excelPath = '/home/ayal-awa/Downloads/RescheduleArrears.xlsx';
  try {
    if (fs.existsSync(excelPath)) {
      historicalRecords = loadHistoricalData(excelPath);
      historicalStats = getHistoricalStats(historicalRecords);
      console.log(`✓ Loaded ${historicalRecords.length} historical records from ${excelPath}`);
    } else {
      console.log(`⚠ Historical data file not found at ${excelPath}. Historical endpoints will return empty data.`);
    }
  } catch (err) {
    console.error(`⚠ Failed to load historical data: ${(err as Error).message}`);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // API Routes
  // ═══════════════════════════════════════════════════════════════════════════

  // Health check
  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // ── Application endpoints ────────────────────────────────────────────────

  // Get all mock applications
  app.get('/api/applications', (_req, res) => {
    res.json(mockApplications);
  });

  // Governance rules
  app.get('/api/governance-rules', (_req, res) => {
    res.json(GOVERNANCE);
  });

  // Deterministic assessment (single application)
  app.post('/api/assess/:id', (req, res) => {
    const application = mockApplications.find(a => a.application_id === req.params.id);
    if (!application) {
       res.status(404).json({ error: 'Application not found' });
       return;
    }
    const result = assessApplication(application);
    res.json({
      status: "success",
      data: result
    });
  });

  // Agentic LLM assessment (single application) — always returns valid JSON
  app.post('/api/agent-assess/:id', asyncHandler(async (req, res) => {
    const application = mockApplications.find(a => a.application_id === req.params.id);
    if (!application) {
       res.status(404).json({ error: 'Application not found' });
       return;
    }
    try {
      const result = await processWithAgent(application);
      res.json({ status: 'success', data: result });
    } catch (err) {
      console.warn(`Agent failed for ${req.params.id}, using deterministic fallback:`, (err as Error).message?.substring(0, 80));
      const result = assessApplication(application);
      res.json({ status: 'success', data: result });
    }
  }));

  // Batch assess all applications (deterministic)
  app.post('/api/assess', (_req, res) => {
    const results = mockApplications.map(a => ({
      status: "success",
      data: assessApplication(a)
    }));
    res.json(results);
  });

  // ── Historical data endpoints ────────────────────────────────────────────

  // Paginated historical records
  app.get('/api/historical-data', (req, res) => {
    const year = req.query.year as string | undefined;
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 50, 200);

    let filtered = historicalRecords;

    // Filter by year if specified
    if (year) {
      filtered = filtered.filter(r => r.year === year);
    }

    // Paginate
    const totalRecords = filtered.length;
    const totalPages = Math.ceil(totalRecords / limit);
    const offset = (page - 1) * limit;
    const paginatedRecords = filtered.slice(offset, offset + limit);

    res.json({
      records: paginatedRecords,
      pagination: {
        page,
        limit,
        total_records: totalRecords,
        total_pages: totalPages,
        has_next: page < totalPages,
        has_prev: page > 1,
      },
    });
  });

  // Aggregate historical stats
  app.get('/api/historical-stats', (_req, res) => {
    if (historicalStats) {
      res.json(historicalStats);
    } else {
      // Calculate stats on the fly if not cached at startup
      if (historicalRecords.length > 0) {
        historicalStats = getHistoricalStats(historicalRecords);
        res.json(historicalStats);
      } else {
        res.json({
          total_records: 0,
          by_year: {},
          by_request_type: {},
          by_status: {},
          salary_stats: { min: 0, max: 0, avg: 0, median: 0 },
          arrears_stats: { min: 0, max: 0, avg: 0, median: 0 },
          avg_deduction_rate: 0,
          avg_additional_months: 0,
        });
      }
    }
  });

  // ── JSON error handler (must be after routes, before Vite) ─────────────
  app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
    console.error('API error:', err.message);
    res.status(500).json({ error: err.message || 'Internal server error' });
  });

  // ── Vite development middleware ──────────────────────────────────────────
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
