import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

export const executions = sqliteTable('executions', {
  id: text('id').primaryKey(),
  flowId: text('flow_id').notNull(),
  input: text('input').notNull(),
  output: text('output', { mode: 'json' }).notNull(),
  steps: text('steps', { mode: 'json' }).notNull(),
  duration: integer('duration').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  success: integer('success', { mode: 'boolean' }).notNull(),
});

export const pipelines = sqliteTable('pipelines', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  flowIds: text('flow_ids', { mode: 'json' }).notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
});
