"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { FlowMetadata, ExecutionResult, FlowCategory } from "@/lib/engine/types";
import { RichOutput } from "./flows/RichOutput";

const CATEGORY_ORDER: FlowCategory[] = ["planning", "text", "dev", "productivity"];

const CATEGORY_CONFIG: Record<FlowCategory, { label: string; icon: string; color: string; bgColor: string }> = {
  planning: { label: "Planning & Thinking", icon: "🧠", color: "#a855f7", bgColor: "rgba(168, 85, 247, 0.1)" },
  text: { label: "Text Processing", icon: "✍️", color: "#ec4899", bgColor: "rgba(236, 72, 153, 0.1)" },
  dev: { label: "Developer Tools", icon: "🛠️", color: "#f59e0b", bgColor: "rgba(245, 158, 11, 0.1)" },
  productivity: { label: "Productivity", icon: "📅", color: "#3b82f6", bgColor: "rgba(59, 130, 246, 0.1)" }
};

const DEMO_PIPELINES = [
  {
    name: "Voice Memo → Roadmap",
    flows: ["clean", "task", "brain"],
    description: "Transform messy voice notes into a structured product plan"
  },
  {
    name: "Debug → Tasks",
    flows: ["debug", "task"],
    description: "Convert error logs into actionable development tasks"
  },
  {
    name: "Data Cleanup → Notes",
    flows: ["csv", "clean", "note"],
    description: "Clean CSV data and format as structured notes"
  }
];

export function PipelineBuilder({ availableFlows }: { availableFlows: FlowMetadata[] }) {
  const [pipeline, setPipeline] = useState<FlowMetadata[]>([]);
  const [saved, setSaved] = useState(false);
  const [input, setInput] = useState("");
  const [isRunning, setIsRunning] = useState(false);
  const [result, setResult] = useState<ExecutionResult | null>(null);
  const [activeStep, setActiveStep] = useState<number | null>(null);
  const [showDemoHint, setShowDemoHint] = useState(true);
  
  // Group flows by category
  const groupedFlows = availableFlows.reduce((acc, flow) => {
    const cat = flow.category || "text";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(flow);
    return acc;
  }, {} as Record<FlowCategory, FlowMetadata[]>);

  const addFlow = useCallback((flow: FlowMetadata) => {
    setPipeline(prev => [...prev, flow]);
    setSaved(false);
    setShowDemoHint(false);
  }, []);
  
  const removeFlow = useCallback((index: number) => {
    setPipeline(prev => prev.filter((_, i) => i !== index));
    setSaved(false);
  }, []);

  const loadDemo = useCallback((demo: typeof DEMO_PIPELINES[0]) => {
    const flows = demo.flows.map(id => availableFlows.find(f => f.id === id)).filter(Boolean) as FlowMetadata[];
    if (flows.length === demo.flows.length) {
      setPipeline(flows);
      setInput("Demo input ready - modify or run directly");
      setSaved(false);
      setShowDemoHint(false);
    }
  }, [availableFlows]);

  const clearPipeline = useCallback(() => {
    setPipeline([]);
    setResult(null);
    setSaved(false);
    setShowDemoHint(true);
  }, []);

  const handleSave = async () => {
    if (pipeline.length === 0) return;
    
    try {
      const response = await fetch("/api/pipelines", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: `Custom Pipeline ${new Date().toLocaleTimeString()}`,
          flowIds: pipeline.map(f => f.id)
        }),
      });
      
      if (response.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      }
    } catch (err) {
      console.error("Failed to save pipeline:", err);
    }
  };

  const runPipeline = async () => {
    if (!input || pipeline.length === 0) return;
    
    setIsRunning(true);
    setResult(null);
    setActiveStep(0);
    
    try {
      const response = await fetch("/api/run-pipeline", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          input,
          flows: pipeline.map(f => f.id)
        }),
      });
      
      const data = await response.json();
      
      // Animate through steps
      for (let i = 0; i < pipeline.length; i++) {
        setActiveStep(i);
        await new Promise(r => setTimeout(r, 400));
      }
      
      setResult(data);
      setActiveStep(null);
    } catch (err) {
      console.error("Pipeline execution failed:", err);
    } finally {
      setIsRunning(false);
    }
  };
  
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-zinc-300 font-sans selection:bg-zinc-800 selection:text-white">
      {/* Header */}
      <header className="border-b border-zinc-800/60 px-6 py-4 glass z-10 sticky top-0">
        <div className="flex items-center justify-between max-w-[1600px] mx-auto">
          <div className="flex items-center gap-4">
            <Link href="/" className="w-9 h-9 rounded-xl bg-zinc-800/50 hover:bg-zinc-700 border border-zinc-700 flex items-center justify-center transition-colors group">
              <svg className="w-4 h-4 text-zinc-300 group-hover:-translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-lg">⚡</span>
                <h1 className="text-lg font-bold text-white">
                  Visual Workflow Builder
                </h1>
                <span className="px-2 py-0.5 rounded-md bg-gradient-to-r from-blue-500/20 to-purple-500/20 text-[10px] text-blue-400 font-medium border border-blue-500/20">
                  CORE FEATURE
                </span>
              </div>
              <p className="text-xs text-zinc-500">Chain multiple claws into real automation pipelines</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {pipeline.length > 0 && (
              <button 
                onClick={clearPipeline}
                className="text-xs font-medium px-3 py-2 rounded-lg text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50 transition-all"
              >
                Clear
              </button>
            )}
            <button 
              onClick={handleSave}
              disabled={pipeline.length === 0}
              className={`text-xs font-bold px-4 py-2 rounded-lg transition-all ${
                saved 
                  ? "bg-emerald-500 text-white" 
                  : pipeline.length > 0 
                    ? "bg-zinc-800 text-zinc-300 hover:bg-zinc-700 border border-zinc-700" 
                    : "bg-zinc-900 text-zinc-600 cursor-not-allowed"
              }`}
            >
              {saved ? "Saved!" : "Save Pipeline"}
            </button>
            <button 
              onClick={runPipeline}
              disabled={pipeline.length === 0 || !input || isRunning}
              className={`text-xs font-bold px-4 py-2 rounded-lg transition-all flex items-center gap-2 ${
                isRunning 
                  ? "bg-zinc-800 text-zinc-500" 
                  : pipeline.length > 0 && input 
                    ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-500 hover:to-purple-500 shadow-lg shadow-blue-500/20" 
                    : "bg-zinc-900 text-zinc-600 cursor-not-allowed"
              }`}
            >
              {isRunning ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Running...
                </>
              ) : (
                <>
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /></svg>
                  Execute Pipeline
                </>
              )}
            </button>
          </div>
        </div>
      </header>

      <div className="flex h-[calc(100vh-73px)] overflow-hidden max-w-[1600px] mx-auto">
        {/* Sidebar - Available Flows */}
        <div className="w-80 border-r border-zinc-800/60 bg-zinc-900/10 flex flex-col">
          <div className="p-4 border-b border-zinc-800/60 bg-zinc-900/30">
            <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
              Available Tools — {availableFlows.length} Claws
            </h2>
          </div>
          <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-4">
            {CATEGORY_ORDER.map((category) => {
              const catFlows = groupedFlows[category] || [];
              if (catFlows.length === 0) return null;
              const config = CATEGORY_CONFIG[category];
              
              return (
                <div key={category} className="space-y-2">
                  <div 
                    className="flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider"
                    style={{ background: config.bgColor, color: config.color }}
                  >
                    <span>{config.icon}</span>
                    <span>{config.label}</span>
                    <span className="ml-auto text-[10px] opacity-60">{catFlows.length}</span>
                  </div>
                  <div className="space-y-1">
                    {catFlows.map(flow => (
                      <button 
                        key={flow.id} 
                        onClick={() => addFlow(flow)} 
                        className="w-full p-2.5 bg-zinc-900/40 border border-zinc-800/40 rounded-xl text-left hover:border-zinc-600 hover:bg-zinc-800/30 transition-all group flex items-center gap-3"
                      >
                        <div 
                          className="w-9 h-9 rounded-lg flex items-center justify-center text-lg flex-shrink-0 transition-transform group-hover:scale-110"
                          style={{ background: `${flow.color}15` }}
                        >
                          {flow.icon}
                        </div>
                        <div className="min-w-0">
                          <h3 className="text-sm font-medium text-zinc-200 group-hover:text-white transition-colors truncate">{flow.name}</h3>
                          <p className="text-[10px] text-zinc-500 line-clamp-1">{flow.description}</p>
                        </div>
                        <svg className="w-4 h-4 text-zinc-600 opacity-0 group-hover:opacity-100 transition-all ml-auto flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Main Canvas - Pipeline */}
        <div className="flex-1 bg-[url('/grid.svg')] bg-center bg-repeat relative overflow-y-auto custom-scrollbar">
          <div className="absolute inset-0 bg-gradient-to-b from-[#0a0a0a]/95 to-[#0a0a0a] pointer-events-none" />
          
          <div className="relative z-10 max-w-2xl mx-auto py-10 px-6">
            {/* Input Section */}
            <div className="w-full mb-8">
              <div className="flex items-center justify-between mb-2">
                <label className="flex items-center gap-2 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                  Initial Input Data
                </label>
                {showDemoHint && (
                  <span className="text-[10px] text-zinc-600">Try a demo pipeline below ↓</span>
                )}
              </div>
              <textarea 
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Paste your source text, data, or content here to feed into the pipeline..."
                className="w-full h-28 bg-zinc-900/60 border border-zinc-800 rounded-xl p-4 text-sm text-zinc-300 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 transition-all custom-scrollbar resize-none"
              />
            </div>

            {/* Demo Pipelines */}
            {showDemoHint && (
              <div className="mb-8 animate-slideUp">
                <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-3">Quick Start Demos</p>
                <div className="grid grid-cols-3 gap-3">
                  {DEMO_PIPELINES.map((demo, i) => (
                    <button
                      key={demo.name}
                      onClick={() => loadDemo(demo)}
                      className="p-3 rounded-xl border border-zinc-800 bg-zinc-900/30 hover:border-zinc-600 hover:bg-zinc-800/30 transition-all text-left group"
                      style={{ animationDelay: `${i * 100}ms` }}
                    >
                      <div className="flex items-center gap-1.5 mb-2">
                        {demo.flows.map((f, j) => {
                          const flow = availableFlows.find(flow => flow.id === f);
                          return (
                            <span key={j} className="text-xs" title={flow?.name}>{flow?.icon}</span>
                          );
                        })}
                      </div>
                      <h4 className="text-xs font-medium text-zinc-300 group-hover:text-white mb-1">{demo.name}</h4>
                      <p className="text-[10px] text-zinc-600 line-clamp-2">{demo.description}</p>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {pipeline.length === 0 ? (
              <div className="text-center mt-16 p-10 border-2 border-dashed border-zinc-800 rounded-3xl bg-zinc-900/10">
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-zinc-800/50 flex items-center justify-center">
                  <span className="text-3xl opacity-40">⚡</span>
                </div>
                <h3 className="text-lg font-bold text-zinc-400 mb-2">Build Your Automation</h3>
                <p className="text-sm text-zinc-600 max-w-sm mx-auto leading-relaxed mb-4">
                  Select tools from the left sidebar to chain them into a powerful workflow.
                </p>
                <p className="text-xs text-zinc-700">Click any claw to add it to your pipeline</p>
              </div>
            ) : (
              <div className="w-full space-y-5">
                <div className="text-center mb-6">
                  <span className="inline-flex items-center gap-2 text-[10px] font-bold bg-emerald-500/10 text-emerald-500/70 px-3 py-1.5 rounded-full border border-emerald-500/20 uppercase tracking-widest">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Pipeline Start
                  </span>
                </div>

                {pipeline.map((flow, i) => (
                  <div 
                    key={i} 
                    className="relative group w-full animate-slideUp"
                    style={{ animationDelay: `${i * 50}ms` }}
                  >
                    {/* Connection Line */}
                    {i > 0 && (
                      <div className="absolute -top-5 left-1/2 -ml-px w-0.5 h-5 bg-gradient-to-b from-zinc-700/50 to-zinc-600/50" />
                    )}
                    
                    {/* Arrow down */}
                    {i > 0 && (
                      <div className="absolute -top-1.5 left-1/2 -ml-1 w-2 h-2 rotate-45 border-r border-b border-zinc-600/50 z-10" />
                    )}

                    {/* Step Card */}
                    <div 
                      className={`relative border p-4 rounded-2xl transition-all ${
                        activeStep === i 
                          ? 'border-blue-500/50 bg-blue-500/5 shadow-lg shadow-blue-500/10' 
                          : activeStep !== null && activeStep > i
                            ? 'border-emerald-500/30 bg-emerald-500/5'
                            : 'border-zinc-800/60 bg-zinc-900/40 hover:border-zinc-600'
                      }`}
                    >
                      {/* Step Number */}
                      <div 
                        className="absolute -left-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold border"
                        style={{ 
                          background: activeStep === i ? '#3b82f6' : activeStep !== null && activeStep > i ? '#10b981' : '#27272a',
                          borderColor: activeStep === i ? '#3b82f6' : activeStep !== null && activeStep > i ? '#10b981' : '#3f3f46',
                          color: (activeStep !== null && activeStep >= i) ? '#fff' : '#71717a'
                        }}
                      >
                        {activeStep !== null && activeStep > i ? (
                          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                        ) : (
                          i + 1
                        )}
                      </div>

                      <div className="flex items-center justify-between pl-4">
                        <div className="flex items-center gap-4">
                          <div 
                            className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
                            style={{ background: `${flow.color}15` }}
                          >
                            {flow.icon}
                          </div>
                          <div>
                            <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-0.5">
                              {flow.category && CATEGORY_CONFIG[flow.category as FlowCategory]?.label.split(' ')[0]}
                            </div>
                            <h3 className="text-base font-bold text-white tracking-tight">{flow.name}</h3>
                          </div>
                        </div>
                        
                        <button 
                          onClick={() => removeFlow(i)} 
                          className="w-8 h-8 rounded-full bg-rose-500/5 text-rose-500/40 border border-rose-500/10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all hover:bg-rose-500 hover:text-white hover:border-rose-500"
                          title="Remove step"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                      </div>
                      
                      {/* Data flow indicator */}
                      {i < pipeline.length - 1 && (
                        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 z-10">
                          <div className="w-5 h-5 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center">
                            <svg className="w-3 h-3 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" /></svg>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                
                {/* Pipeline End */}
                <div className="text-center mt-8 pt-2">
                  <span className="inline-flex items-center gap-2 text-[10px] font-bold bg-blue-500/10 text-blue-400/70 px-3 py-1.5 rounded-full border border-blue-500/20 uppercase tracking-widest">
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                    Final Output
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Results Panel */}
        {result && (
          <div className="w-96 border-l border-zinc-800/60 bg-zinc-900/30 flex flex-col animate-slideRight">
            <div className="p-4 border-b border-zinc-800/60 bg-zinc-900/50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-300">Execution Results</h2>
              </div>
              <button onClick={() => setResult(null)} className="text-zinc-500 hover:text-white transition-colors p-1 rounded-lg hover:bg-zinc-800/50">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto custom-scrollbar p-4">
              {/* Stats */}
              <div className="grid grid-cols-2 gap-2 mb-4">
                <div className="p-3 rounded-xl bg-zinc-800/40 border border-zinc-700/30">
                  <div className="text-[10px] text-zinc-500 uppercase">Duration</div>
                  <div className="text-lg font-mono text-emerald-400">{result.duration}ms</div>
                </div>
                <div className="p-3 rounded-xl bg-zinc-800/40 border border-zinc-700/30">
                  <div className="text-[10px] text-zinc-500 uppercase">Status</div>
                  <div className={`text-lg font-medium ${result.success ? 'text-emerald-400' : 'text-red-400'}`}>
                    {result.success ? 'Success' : 'Failed'}
                  </div>
                </div>
              </div>

              {/* Steps Log */}
              <div className="mb-4">
                <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-2">Execution Log</div>
                <div className="space-y-1 bg-zinc-950/30 rounded-xl p-3 border border-zinc-800/40">
                  {result.steps.map((step, i) => (
                    <div key={i} className="text-[11px] text-zinc-400 font-mono leading-relaxed flex gap-2">
                      <span className="text-zinc-600 shrink-0 w-5">{i + 1}.</span>
                      <span className={step.startsWith('  ↳') ? 'text-zinc-500' : ''}>{step}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Output */}
              <div className="border-t border-zinc-800/60 pt-4">
                <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" /></svg>
                  Structured Output
                </div>
                <div className="bg-zinc-950/60 rounded-xl border border-zinc-800 overflow-hidden">
                  <RichOutput flowId="pipeline" output={result.output} />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
