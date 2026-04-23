"use client";

import React from "react";

export interface TaskItem {
  id: string | number;
  task: string;
  priority: string;
  category: string;
}

export interface TaskFlowOutput {
  count: number;
  summary?: { high_priority: number };
  tasks: TaskItem[];
  error?: string;
}

export interface DebugIssue {
  severity: string;
  line_number?: number;
  line: string;
  suggestion: string;
}

export interface DebugFlowOutput {
  health: string;
  total_issues: number;
  issues: DebugIssue[];
  error?: string;
}

export interface BrainFlowOutput {
  title: string;
  tags: string[];
  target_audience: string[];
  complexity: {
    level: string;
    score: number;
    reason: string;
  };
  next_steps: string[];
  error?: string;
}

export interface CleanFlowOutput {
  stats: {
    words: number;
    characters: number;
    sentences: number;
  };
  cleaned_text: string;
  error?: string;
}

export interface SummaryFlowOutput {
  key_points: string[];
  stats: {
    original_sentences: number;
    extracted_points: number;
    compression_ratio: string;
    word_count: number;
    estimated_read_time: string;
  };
  error?: string;
}

export interface PipelineFlowOutput {
  stages: Record<string, unknown>;
  error?: string;
}

export interface CalendarFlowOutput {
  event: {
    title: string;
    date: string;
    time: string;
    participants: string[];
    duration: string;
    type: string;
  };
  raw_input: string;
  error?: string;
}

export interface GitFlowOutput {
  stats: {
    additions: number;
    deletions: number;
    files_changed: number;
  };
  suggested_commits: { type: string; message: string }[];
  files: string[];
  error?: string;
}

export interface CsvFlowOutput {
  meta: {
    rows: number;
    columns: number;
    empty_cells_filled: number;
  };
  headers: string[];
  data: Record<string, string | number | null>[];
  error?: string;
}

export interface EmailFlowOutput {
  points_extracted: number;
  draft: string;
}

export interface NoteFlowOutput {
  tags: string[];
  markdown: string;
}

export interface JsonFlowOutput {
  valid: boolean;
  type?: string;
  root_keys?: number;
  formatted?: string;
  error?: string;
}

export interface DiffFlowOutput {
  added: string[];
  removed: string[];
  unchanged_count: number;
  similarity_score: number;
  error?: string;
}

export interface SentimentFlowOutput {
  sentiment: string;
  score: number;
  metrics: {
    positive_keywords: number;
    negative_keywords: number;
    total_words: number;
  };
}

interface RichOutputProps {
  flowId: string;
  output: unknown;
}

export function RichOutput({ flowId, output }: RichOutputProps) {
  if (!output) return null;
  
  if (output && typeof output === 'object' && 'error' in output && output.error) {
    return <div className="p-4 text-red-400">{String(output.error)}</div>;
  }

  switch (flowId) {
    case 'task': {
      const o = output as TaskFlowOutput;
      return (
        <div className="p-4 space-y-3">
          <div className="flex gap-4 text-xs text-zinc-500 mb-4">
            <span className="bg-zinc-800 px-2 py-1 rounded">Total: {o.count}</span>
            <span className="bg-emerald-900/30 text-emerald-400 px-2 py-1 rounded border border-emerald-500/20">High Priority: {o.summary?.high_priority || 0}</span>
          </div>
          {o.tasks?.map((t) => (
            <div key={t.id} className="flex items-start gap-3 bg-zinc-800/40 p-3 rounded-lg border border-zinc-700/50">
              <div className="mt-0.5">
                <input type="checkbox" className="w-4 h-4 rounded border-zinc-600 bg-zinc-900 accent-emerald-500" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-zinc-200">{t.task}</p>
                <div className="flex gap-2 mt-2">
                  <span className={`text-[10px] px-2 py-0.5 rounded uppercase ${t.priority === 'high' ? 'bg-red-500/20 text-red-400 border border-red-500/20' : t.priority === 'medium' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/20' : 'bg-blue-500/20 text-blue-400 border border-blue-500/20'}`}>
                    {t.priority}
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded uppercase bg-zinc-700/50 text-zinc-400 border border-zinc-600/50">
                    {t.category}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      );
    }
    case 'debug': {
      const o = output as DebugFlowOutput;
      return (
        <div className="p-4 space-y-4">
          <div className="flex gap-3">
            <div className={`px-3 py-1.5 rounded-lg text-xs font-semibold border ${o.health === 'healthy' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/20' : o.health === 'degraded' ? 'bg-amber-500/20 text-amber-400 border-amber-500/20' : 'bg-red-500/20 text-red-400 border-red-500/20'}`}>
              Status: {o.health?.toUpperCase() || 'UNKNOWN'}
            </div>
            <div className="px-3 py-1.5 rounded-lg bg-zinc-800/80 text-xs text-zinc-400 border border-zinc-700/50">
              {o.total_issues} Issues Found
            </div>
          </div>
          <div className="space-y-2">
            {o.issues?.map((issue, idx) => (
              <div key={idx} className="bg-zinc-800/40 p-3 rounded-lg border border-zinc-700/50">
                <div className="flex items-center gap-2 mb-2">
                  <span className={`text-[10px] px-1.5 py-0.5 rounded uppercase font-bold border ${issue.severity === 'critical' ? 'bg-red-500/20 text-red-400 border-red-500/20' : issue.severity === 'warning' ? 'bg-amber-500/20 text-amber-400 border-amber-500/20' : 'bg-blue-500/20 text-blue-400 border-blue-500/20'}`}>
                    {issue.severity}
                  </span>
                  {issue.line_number && <span className="text-xs text-zinc-500 font-mono">Line {issue.line_number}</span>}
                </div>
                <p className="text-sm text-zinc-200 font-mono mb-2 bg-zinc-900/80 p-2.5 rounded border border-zinc-800 break-all">{issue.line}</p>
                <div className="flex items-start gap-2 text-sm text-emerald-400 bg-emerald-950/30 p-2.5 rounded border border-emerald-900/30">
                  <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                  <p>{issue.suggestion}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    }
    case 'brain': {
      const o = output as BrainFlowOutput;
      return (
        <div className="p-5 space-y-6">
          <div className="text-center pb-4 border-b border-zinc-800/60">
            <h2 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-cyan-400">{o.title}</h2>
            <div className="flex flex-wrap justify-center gap-2 mt-3">
              {o.tags?.map((tag) => <span key={tag} className="text-xs px-2 py-1 bg-purple-500/10 text-purple-400 rounded-md border border-purple-500/20">#{tag}</span>)}
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-zinc-800/30 p-3 rounded-lg border border-zinc-700/40">
              <span className="block text-[10px] text-zinc-500 uppercase mb-1.5 font-semibold">Target Audience</span>
              <div className="flex flex-wrap gap-1">
                {o.target_audience?.map((aud) => <span key={aud} className="text-xs text-zinc-300 capitalize bg-zinc-800/80 px-2 py-0.5 rounded border border-zinc-700/50">{aud}</span>)}
              </div>
            </div>
            <div className="bg-zinc-800/30 p-3 rounded-lg border border-zinc-700/40">
              <span className="block text-[10px] text-zinc-500 uppercase mb-1.5 font-semibold">Complexity</span>
              <div className="flex items-center gap-2">
                <span className={`text-sm font-bold capitalize ${o.complexity?.level === 'high' ? 'text-red-400' : o.complexity?.level === 'medium' ? 'text-amber-400' : 'text-emerald-400'}`}>
                  {o.complexity?.level} <span className="opacity-70 text-xs">({o.complexity?.score}/100)</span>
                </span>
              </div>
              <p className="text-[10px] text-zinc-500 mt-1.5 leading-relaxed">{o.complexity?.reason}</p>
            </div>
          </div>

          <div>
            <span className="block text-[11px] font-semibold text-zinc-500 uppercase tracking-wider mb-3">Actionable Next Steps</span>
            <div className="space-y-2">
              {o.next_steps?.map((step, idx) => (
                <div key={idx} className="flex gap-3 items-center bg-zinc-900/60 p-3 rounded-lg border border-zinc-800/80">
                  <div className="w-6 h-6 rounded-full bg-purple-500/20 text-purple-400 flex items-center justify-center text-xs font-bold shrink-0 border border-purple-500/20">{idx + 1}</div>
                  <span className="text-sm text-zinc-300">{step}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      );
    }
    case 'clean': {
      const o = output as CleanFlowOutput;
      return (
        <div className="p-4 space-y-5">
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-zinc-800/40 p-3 rounded-lg text-center border border-zinc-700/50">
              <div className="text-2xl font-light text-cyan-400">{o.stats?.words || 0}</div>
              <div className="text-[10px] text-zinc-500 uppercase tracking-wider mt-1 font-semibold">Words</div>
            </div>
            <div className="bg-zinc-800/40 p-3 rounded-lg text-center border border-zinc-700/50">
              <div className="text-2xl font-light text-cyan-400">{o.stats?.characters || 0}</div>
              <div className="text-[10px] text-zinc-500 uppercase tracking-wider mt-1 font-semibold">Characters</div>
            </div>
            <div className="bg-zinc-800/40 p-3 rounded-lg text-center border border-zinc-700/50">
              <div className="text-2xl font-light text-cyan-400">{o.stats?.sentences || 0}</div>
              <div className="text-[10px] text-zinc-500 uppercase tracking-wider mt-1 font-semibold">Sentences</div>
            </div>
          </div>
          <div>
            <span className="block text-[10px] font-semibold text-zinc-500 uppercase tracking-wider mb-2">Cleaned Text</span>
            <div className="bg-zinc-900/80 p-4 rounded-lg border border-zinc-800 text-sm text-zinc-300 whitespace-pre-wrap leading-relaxed max-h-60 overflow-y-auto">
              {o.cleaned_text}
            </div>
          </div>
        </div>
      );
    }
    case 'summary': {
      const o = output as SummaryFlowOutput;
      return (
        <div className="p-4 space-y-4">
          <div className="flex gap-3 text-xs text-zinc-400 mb-2">
            <span className="bg-zinc-800/60 px-2 py-1 rounded border border-zinc-700/50">Read time: {o.stats?.estimated_read_time || '< 1 min'}</span>
            <span className="bg-zinc-800/60 px-2 py-1 rounded border border-zinc-700/50">Compression: {o.stats?.compression_ratio || 'N/A'}</span>
            <span className="bg-zinc-800/60 px-2 py-1 rounded border border-zinc-700/50">{o.stats?.word_count || 0} words</span>
          </div>
          <div className="space-y-3">
            {o.key_points?.map((point, idx) => (
              <div key={idx} className="flex gap-3 items-start bg-zinc-800/40 p-3.5 rounded-lg border border-zinc-700/50">
                <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-cyan-400 shrink-0 shadow-[0_0_8px_rgba(34,211,238,0.6)]" />
                <p className="text-sm text-zinc-200 leading-relaxed">{typeof point === 'string' ? point : String(point)}</p>
              </div>
            ))}
          </div>
        </div>
      );
    }
    case 'pipeline': {
      const o = output as PipelineFlowOutput;
      return (
        <div className="p-4 space-y-5">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-[10px] font-semibold bg-zinc-800 text-zinc-400 px-2.5 py-1 rounded-md uppercase tracking-wider border border-zinc-700/50">
              {Object.keys(o.stages || {}).length} Stages Complete
            </span>
            <span className="text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 px-2.5 py-1 rounded-md uppercase tracking-wider border border-emerald-500/20 flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Pipeline Success
            </span>
          </div>
          
          <div className="space-y-4 relative before:absolute before:inset-y-0 before:left-[11px] before:w-[2px] before:bg-zinc-800/60 before:z-0">
            {Object.entries(o.stages || {}).map(([stageName, stageData], idx) => (
              <div key={stageName} className="relative pl-8 animate-slideUp" style={{ animationDelay: `${idx * 150}ms` }}>
                <div className="absolute left-0 top-1.5 w-6 h-6 rounded-full bg-zinc-900 border-2 border-zinc-700 flex items-center justify-center text-[10px] font-bold text-zinc-400 z-10 shadow-sm">
                  {idx + 1}
                </div>
                <div className="bg-zinc-800/40 p-3.5 rounded-lg border border-zinc-700/50">
                  <h4 className="text-[11px] font-bold text-zinc-300 uppercase tracking-widest mb-3 capitalize">{stageName} Stage</h4>
                  <div className="bg-zinc-900/80 p-3 rounded-md border border-zinc-800 text-xs text-zinc-400 font-mono overflow-auto max-h-40 custom-scrollbar">
                    {JSON.stringify(stageData, null, 2)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    }
    case 'calendar': {
      const o = output as CalendarFlowOutput;
      return (
        <div className="p-5 space-y-4">
          <div className="flex items-center gap-4 border-b border-zinc-800/60 pb-4">
            <div className="bg-amber-500/20 text-amber-400 p-3 rounded-xl border border-amber-500/30 text-2xl">📅</div>
            <div>
              <h3 className="text-lg font-bold text-white">{o.event.title}</h3>
              <p className="text-sm text-zinc-400">{o.event.type}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-zinc-800/30 p-3 rounded-lg border border-zinc-700/50">
              <span className="text-[10px] text-zinc-500 uppercase font-semibold">Date & Time</span>
              <p className="text-sm text-zinc-200 mt-1">{o.event.date} at {o.event.time}</p>
              <p className="text-xs text-zinc-500 mt-0.5">{o.event.duration}</p>
            </div>
            <div className="bg-zinc-800/30 p-3 rounded-lg border border-zinc-700/50">
              <span className="text-[10px] text-zinc-500 uppercase font-semibold">Participants</span>
              {o.event.participants.length > 0 ? (
                <div className="mt-2 flex flex-wrap gap-2">
                  {o.event.participants.map(p => <span key={p} className="text-xs bg-zinc-800 px-2 py-1 rounded-md text-zinc-300 border border-zinc-700">{p}</span>)}
                </div>
              ) : (
                <p className="text-sm text-zinc-500 mt-1">None mentioned</p>
              )}
            </div>
          </div>
        </div>
      );
    }
    case 'git': {
      const o = output as GitFlowOutput;
      return (
        <div className="p-4 space-y-5">
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-zinc-800/40 p-3 rounded-lg text-center border border-zinc-700/50">
              <div className="text-xl font-mono text-emerald-400">+{o.stats.additions}</div>
              <div className="text-[10px] text-zinc-500 uppercase tracking-wider mt-1 font-semibold">Additions</div>
            </div>
            <div className="bg-zinc-800/40 p-3 rounded-lg text-center border border-zinc-700/50">
              <div className="text-xl font-mono text-rose-400">-{o.stats.deletions}</div>
              <div className="text-[10px] text-zinc-500 uppercase tracking-wider mt-1 font-semibold">Deletions</div>
            </div>
            <div className="bg-zinc-800/40 p-3 rounded-lg text-center border border-zinc-700/50">
              <div className="text-xl font-mono text-zinc-300">{o.stats.files_changed}</div>
              <div className="text-[10px] text-zinc-500 uppercase tracking-wider mt-1 font-semibold">Files</div>
            </div>
          </div>
          <div>
            <span className="block text-[11px] font-semibold text-zinc-500 uppercase tracking-wider mb-3">Suggested Commits</span>
            <div className="space-y-3">
              {o.suggested_commits.map((commit, idx) => (
                <div key={idx} className="bg-zinc-900/60 p-3 rounded-lg border border-zinc-800/80 group hover:border-zinc-700 transition-colors cursor-pointer relative" onClick={() => navigator.clipboard.writeText(commit.message)}>
                  <div className="text-[10px] text-zinc-500 mb-1.5 uppercase tracking-wider">{commit.type}</div>
                  <pre className="text-sm text-zinc-300 font-mono whitespace-pre-wrap">{commit.message}</pre>
                  <div className="absolute right-3 top-3 opacity-0 group-hover:opacity-100 transition-opacity">
                    <svg className="w-4 h-4 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      );
    }
    case 'csv': {
      const o = output as CsvFlowOutput;
      if (o.error) return <div className="p-4 text-red-400">{o.error}</div>;
      return (
        <div className="p-4 space-y-4">
          <div className="flex gap-3 text-xs text-zinc-400 mb-2">
            <span className="bg-zinc-800/60 px-2 py-1 rounded border border-zinc-700/50">{o.meta.rows} Rows</span>
            <span className="bg-zinc-800/60 px-2 py-1 rounded border border-zinc-700/50">{o.meta.columns} Columns</span>
          </div>
          <div className="overflow-x-auto rounded-lg border border-zinc-700/50 bg-zinc-900/50">
            <table className="w-full text-left text-sm text-zinc-300">
              <thead className="bg-zinc-800/80 text-xs uppercase text-zinc-400">
                <tr>
                  {o.headers.map(h => (
                    <th key={h} className="px-4 py-3 font-semibold">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {o.data.slice(0, 10).map((row, idx) => (
                  <tr key={idx} className="border-b border-zinc-800/50 hover:bg-zinc-800/30">
                    {o.headers.map(h => (
                      <td key={h} className="px-4 py-3">{row[h] === null ? <span className="text-zinc-600 italic">null</span> : row[h]}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
            {o.data.length > 10 && (
              <div className="text-center py-2 text-xs text-zinc-500 bg-zinc-800/20">
                Showing first 10 of {o.data.length} rows
              </div>
            )}
          </div>
        </div>
      );
    }
    case 'email': {
      const o = output as EmailFlowOutput;
      return (
        <div className="p-4 space-y-4">
          <div className="flex items-center justify-between text-xs text-zinc-500 mb-2">
            <span className="bg-zinc-800/60 px-2 py-1 rounded">Parsed {o.points_extracted} points</span>
            <button onClick={() => navigator.clipboard.writeText(o.draft)} className="text-blue-400 hover:text-blue-300">Copy Draft</button>
          </div>
          <div className="bg-zinc-900/80 p-4 rounded-lg border border-zinc-800 text-sm text-zinc-300 whitespace-pre-wrap leading-relaxed">
            {o.draft}
          </div>
        </div>
      );
    }
    case 'note': {
      const o = output as NoteFlowOutput;
      return (
        <div className="p-4 space-y-4">
          <div className="flex flex-wrap gap-2 mb-2">
            {o.tags.map(t => <span key={t} className="text-xs px-2 py-1 bg-purple-500/20 text-purple-400 rounded-md border border-purple-500/30">#{t}</span>)}
          </div>
          <div className="bg-zinc-900/80 p-4 rounded-lg border border-zinc-800">
            <pre className="text-sm text-zinc-300 whitespace-pre-wrap font-mono custom-scrollbar">{o.markdown}</pre>
          </div>
        </div>
      );
    }
    case 'json': {
      const o = output as JsonFlowOutput;
      if (!o.valid) return <div className="p-4 text-red-400 font-mono">❌ {o.error}</div>;
      return (
        <div className="p-4 space-y-4">
          <div className="flex gap-3 text-xs mb-2">
            <span className="bg-emerald-500/20 text-emerald-400 px-2 py-1 rounded border border-emerald-500/30">✅ Valid JSON</span>
            <span className="bg-zinc-800/60 text-zinc-400 px-2 py-1 rounded">Type: {o.type}</span>
            <span className="bg-zinc-800/60 text-zinc-400 px-2 py-1 rounded">Keys/Items: {o.root_keys}</span>
            <button 
              onClick={() => o.formatted && navigator.clipboard.writeText(o.formatted)}
              className="ml-auto text-blue-400 hover:text-blue-300 transition-colors"
            >
              Copy JSON
            </button>
          </div>
          <pre className="bg-zinc-900/80 p-4 rounded-lg border border-zinc-800 text-sm text-zinc-300 overflow-auto font-mono max-h-96 custom-scrollbar">
            {o.formatted}
          </pre>
        </div>
      );
    }
    case 'diff': {
      const o = output as DiffFlowOutput;
      if (o.error) return <div className="p-4 text-red-400">{o.error}</div>;
      return (
        <div className="p-4 space-y-5">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full flex items-center justify-center border-4 border-cyan-500/30 relative">
              <span className="text-lg font-bold text-cyan-400">{o.similarity_score}%</span>
            </div>
            <div>
              <h3 className="text-sm font-bold text-zinc-200">Similarity Score</h3>
              <p className="text-xs text-zinc-500">{o.unchanged_count} matching words</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-emerald-500/10 p-3 rounded-lg border border-emerald-500/20">
              <h4 className="text-[10px] text-emerald-500 uppercase tracking-wider mb-2 font-bold">Added ({o.added.length})</h4>
              <div className="flex flex-wrap gap-1">
                {o.added.slice(0, 10).map((w, i) => <span key={i} className="text-xs bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded">{w}</span>)}
                {o.added.length > 10 && <span className="text-xs text-emerald-500/60 px-1.5 py-0.5">+{o.added.length - 10} more</span>}
              </div>
            </div>
            <div className="bg-rose-500/10 p-3 rounded-lg border border-rose-500/20">
              <h4 className="text-[10px] text-rose-500 uppercase tracking-wider mb-2 font-bold">Removed ({o.removed.length})</h4>
              <div className="flex flex-wrap gap-1">
                {o.removed.slice(0, 10).map((w, i) => <span key={i} className="text-xs bg-rose-500/20 text-rose-400 px-1.5 py-0.5 rounded line-through">{w}</span>)}
                {o.removed.length > 10 && <span className="text-xs text-rose-500/60 px-1.5 py-0.5">+{o.removed.length - 10} more</span>}
              </div>
            </div>
          </div>
        </div>
      );
    }
    case 'sentiment': {
      const o = output as SentimentFlowOutput;
      const isPos = o.score > 20;
      const isNeg = o.score < -20;
      const colorClass = isPos ? "text-emerald-400 border-emerald-500/30 bg-emerald-500/10" : isNeg ? "text-rose-400 border-rose-500/30 bg-rose-500/10" : "text-zinc-400 border-zinc-500/30 bg-zinc-500/10";
      
      return (
        <div className="p-4 space-y-4 text-center">
          <div className={`mx-auto w-24 h-24 rounded-full flex flex-col items-center justify-center border-4 ${colorClass}`}>
            <span className="text-3xl">{isPos ? '😊' : isNeg ? '😞' : '😐'}</span>
            <span className="text-xs font-bold mt-1">{o.score > 0 ? `+${o.score}` : o.score}</span>
          </div>
          <h3 className="text-lg font-bold text-white">{o.sentiment}</h3>
          <div className="flex justify-center gap-4 text-xs mt-4">
            <div className="text-emerald-400 bg-emerald-900/30 px-3 py-1.5 rounded-lg">{o.metrics.positive_keywords} Positive Words</div>
            <div className="text-rose-400 bg-rose-900/30 px-3 py-1.5 rounded-lg">{o.metrics.negative_keywords} Negative Words</div>
          </div>
        </div>
      );
    }
    default:
      return (
        <pre className="p-4 text-sm text-zinc-300 overflow-auto max-h-96 font-mono leading-relaxed">
          {JSON.stringify(output, null, 2)}
        </pre>
      );
  }
}
