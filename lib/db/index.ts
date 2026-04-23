/**
 * Dual-Mode Database Layer
 * 
 * This module provides a unified database interface that works both:
 * - Locally: Uses SQLite with better-sqlite3 for persistence
 * - On Vercel: Uses in-memory storage (serverless-compatible)
 * 
 * The API remains consistent across both environments.
 */

import { executions, pipelines } from './schema';
import { desc } from 'drizzle-orm';
export { executions, pipelines, desc };

// Detect Vercel environment or force memory mode if SQLite fails
const isVercel = process.env.VERCEL === '1' || process.env.VERCEL_ENV !== undefined;
let useMemoryMode = isVercel;

// Check if we're in a test environment
const isTest = process.env.NODE_ENV === 'test' || process.env.VITEST === 'true';

// Type definitions
interface ExecutionRecord {
  id: string;
  flow_id: string;
  input: string;
  output: unknown;
  steps: string[];
  duration: number;
  created_at: number;
  success: number;
}

interface PipelineRecord {
  id: string;
  name: string;
  flow_ids: string[];
  created_at: number;
}

// In-memory storage for Vercel deployment
const memoryStore: { executions: ExecutionRecord[]; pipelines: PipelineRecord[] } = {
  executions: [],
  pipelines: [],
};

// SQLite database (lazy-loaded for local development)
let sqliteDb: ReturnType<typeof import('drizzle-orm/better-sqlite3').drizzle> | null = null;

function getSQLiteDb() {
  if (sqliteDb) return sqliteDb;
  if (useMemoryMode) throw new Error('Memory mode active, SQLite not available');
  
  try {
    // Lazy-load better-sqlite3 only when needed (not on Vercel)
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { default: Database } = require('better-sqlite3');
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { drizzle } = require('drizzle-orm/better-sqlite3');
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const path = require('path');
    
    // Verify Database is a valid constructor
    if (typeof Database !== 'function') {
      throw new Error('better-sqlite3 Database is not a constructor - native module may not be built');
    }
    
    const sqlite = new Database(path.join(process.cwd(), 'sqlite.db'));
    
    // Ensure tables exist
    sqlite.exec(`
      CREATE TABLE IF NOT EXISTS executions (
        id TEXT PRIMARY KEY,
        flow_id TEXT NOT NULL,
        input TEXT NOT NULL,
        output TEXT NOT NULL,
        steps TEXT NOT NULL,
        duration INTEGER NOT NULL,
        created_at INTEGER NOT NULL,
        success INTEGER NOT NULL
      );
      CREATE TABLE IF NOT EXISTS pipelines (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        flow_ids TEXT NOT NULL,
        created_at INTEGER NOT NULL
      );
    `);
    
    sqliteDb = drizzle(sqlite, { schema: { executions, pipelines } });
    return sqliteDb!;
  } catch (err) {
    console.warn('[DB] Failed to initialize SQLite, falling back to memory mode:', err instanceof Error ? err.message : 'Unknown error');
    useMemoryMode = true;
    throw err;
  }
}

// Helper to map execution record
function mapExecutionRecord(item: ExecutionRecord) {
  return {
    id: item.id,
    flowId: item.flow_id,
    flow_id: item.flow_id,
    input: item.input,
    output: item.output,
    steps: item.steps,
    duration: item.duration,
    createdAt: new Date(item.created_at * 1000),
    created_at: item.created_at,
    success: item.success === 1,
  };
}

// Helper to map pipeline record
function mapPipelineRecord(item: PipelineRecord) {
  return {
    id: item.id,
    name: item.name,
    flowIds: item.flow_ids,
    flow_ids: item.flow_ids,
    createdAt: new Date(item.created_at * 1000),
    created_at: item.created_at,
  };
}

// Unified database interface
export const db = {
  // Insert operation
  insert: (table: typeof executions | typeof pipelines) => ({
    values: (data: { id: string; flowId?: string; flowIds?: string[]; name?: string; input?: string; output?: unknown; steps?: string[]; duration?: number; createdAt: Date; success?: boolean }) => ({
      run: () => {
        if (useMemoryMode || isTest) {
          // In-memory storage
          if (table === executions && data.flowId !== undefined) {
            const record: ExecutionRecord = {
              id: data.id,
              flow_id: data.flowId,
              input: data.input || '',
              output: data.output,
              steps: data.steps || [],
              duration: data.duration || 0,
              created_at: Math.floor(data.createdAt.getTime() / 1000),
              success: data.success ? 1 : 0,
            };
            memoryStore.executions.unshift(record);
            // Keep only last 100 executions
            if (memoryStore.executions.length > 100) {
              memoryStore.executions = memoryStore.executions.slice(0, 100);
            }
          } else if (table === pipelines && data.name !== undefined && data.flowIds !== undefined) {
            const record: PipelineRecord = {
              id: data.id,
              name: data.name,
              flow_ids: data.flowIds,
              created_at: Math.floor(data.createdAt.getTime() / 1000),
            };
            memoryStore.pipelines.push(record);
          }
        } else {
          // SQLite storage
          const db = getSQLiteDb();
          try {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            db.insert(table as any).values(data as any).run();
          } catch (dbErr) {
            console.warn('[DB] SQLite insert failed, switching to memory mode');
            useMemoryMode = true;
            // Retry with memory mode
            db.insert(table as any).values(data as any).run();
          }
        }
      },
    }),
  }),
  
  // Select operation
  select: () => ({
    from: (table: typeof executions | typeof pipelines) => ({
      orderBy: (..._orderClauses: unknown[]) => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        void _orderClauses;
        return {
          limit: (n: number) => ({
            all: () => {
            if (useMemoryMode || isTest) {
              if (table === executions) {
                // Simple sort by created_at desc
                const sorted = [...memoryStore.executions].sort((a, b) => b.created_at - a.created_at);
                return sorted.slice(0, n).map(mapExecutionRecord);
              } else {
                return memoryStore.pipelines.map(mapPipelineRecord);
              }
            } else {
              const db = getSQLiteDb();
              // Use desc from drizzle-orm for SQLite
              return db.select().from(table as never).orderBy(desc((table as typeof executions).createdAt)).limit(n).all();
            }
            },
          }),
        };
      },
      all: () => {
        if (useMemoryMode || isTest) {
          if (table === executions) {
            return memoryStore.executions.map(mapExecutionRecord);
          } else {
            return memoryStore.pipelines.map(mapPipelineRecord);
          }
        } else {
          const db = getSQLiteDb();
          return db.select().from(table as never).all();
        }
      },
    }),
  }),
};

// Log which mode we're using
if (useMemoryMode) {
  console.log('[DB] Running in memory mode (Vercel or fallback)');
} else {
  console.log('[DB] Running in local mode (SQLite storage) - will fallback to memory on errors');
}
