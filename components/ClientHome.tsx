"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { RichOutput } from "./flows/RichOutput";
import { ErrorBoundary } from "./ErrorBoundary";
import { FlowMetadata, ExecutionResult, FlowCategory } from "@/lib/engine/types";
import { 
  getTemplateOptions, 
  getCategoryOptions, 
  saveCustomClaw, 
  getCustomClaws, 
  deleteCustomClaw, 
  generateCustomClawId,
  createCustomFlowDefinition,
  TemplateType,
  CustomClawConfig
} from "@/lib/flows/customClawTemplates";

interface HistoryEntry {
  id: number;
  flowId: string;
  flowName: string;
  input: string;
  result: ExecutionResult;
}

interface DemoWorkflow {
  id: string;
  title: string;
  description: string;
  icon: string;
  flows: string[];
  input: string;
  color: string;
  featured?: boolean;
}

// Featured hero workflow + supporting demos
const DEMO_WORKFLOWS: DemoWorkflow[] = [
  {
    id: "idea-to-plan",
    title: "Idea → Product Plan",
    description: "Transform raw ideas into structured roadmaps instantly",
    icon: "🚀",
    flows: ["clean", "task", "brain"],
    input: "build an AI app for farmers, include weather alerts, marketplace, and mobile payments",
    color: "#a855f7",
    featured: true
  },
  {
    id: "logs-to-tasks",
    title: "Debug Logs → Tasks",
    description: "Convert errors into actionable fixes",
    icon: "🔧",
    flows: ["debug", "task"],
    input: "Error: connection failed on line 42\nWarning: deprecated API usage\nTypeError: undefined is not a function",
    color: "#f59e0b"
  },
  {
    id: "data-to-notes",
    title: "CSV → Clean Notes",
    description: "Structure messy data automatically",
    icon: "✨",
    flows: ["csv", "clean", "note"],
    input: "Name,Age,City\nJohn,30,NYC\nJane,25,LA",
    color: "#10b981"
  }
];

const CATEGORY_LABELS: Record<FlowCategory, { label: string; icon: string; description: string; color: string }> = {
  text: { label: "Text Processing", icon: "✍️", description: "Clean, summarize, format", color: "#ec4899" },
  planning: { label: "Planning & Thinking", icon: "🧠", description: "Tasks, ideas, workflows", color: "#a855f7" },
  dev: { label: "Developer Tools", icon: "🛠️", description: "Debug, Git, diff, parse", color: "#f59eob" },
  productivity: { label: "Productivity", icon: "📅", description: "Calendar, email, notes", color: "#3b82f6" }
};

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export function ClientHome({ initialFlows }: { initialFlows: FlowMetadata[] }) {
  const [flows] = useState<FlowMetadata[]>(initialFlows);
  const [selectedFlow, setSelectedFlow] = useState<FlowMetadata | null>(null);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ExecutionResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [visibleSteps, setVisibleSteps] = useState(0);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showAddFlowModal, setShowAddFlowModal] = useState(false);
  const [showAdvancedTab, setShowAdvancedTab] = useState(false);
  const [customClaws, setCustomClaws] = useState<CustomClawConfig[]>([]);
  
  // Form state
  const [clawName, setClawName] = useState("");
  const [clawDescription, setClawDescription] = useState("");
  const [clawTemplate, setClawTemplate] = useState<TemplateType>("uppercase");
  const [clawCategory, setClawCategory] = useState<FlowCategory>("text");
  const [clawIcon, setClawIcon] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [activeCategory, setActiveCategory] = useState<FlowCategory | "all">("all");
  const [showHero, setShowHero] = useState(true);
  const [executingDemo, setExecutingDemo] = useState<string | null>(null);
  const [autoDemoComplete, setAutoDemoComplete] = useState(false);
  const [liveStatus, setLiveStatus] = useState<string | null>(null);
  const [demoHasRun, setDemoHasRun] = useState(false);
  
  const heroWorkflow = DEMO_WORKFLOWS[0];
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Load custom claws on mount
  useEffect(() => {
    const stored = getCustomClaws();
    setCustomClaws(stored);
  }, []);

  // Group flows by category (including custom claws)
  const allFlows = [...flows, ...customClaws.map(c => {
    const template = getTemplateOptions().find(t => t.value === c.template);
    return {
      id: c.id,
      name: c.name,
      description: c.description,
      example: template?.description || "Enter your input here",
      icon: c.icon || template?.icon || "⚡",
      color: c.color || "#a855f7",
      category: c.category,
    };
  })];
  
  const groupedFlows = allFlows.reduce((acc, flow) => {
    const cat = flow.category || "text";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(flow);
    return acc;
  }, {} as Record<FlowCategory, FlowMetadata[]>);

  // Load history from DB on mount
  useEffect(() => {
    const loadHistory = async () => {
      try {
        const res = await fetch("/api/history");
        if (res.ok) {
          const dbHistory = await res.json();
          const mapped = dbHistory.map((h: { id: string; flowId: string; input: string; output: unknown; steps: string[]; duration: number; createdAt: Date; success: number }) => ({
            id: h.id,
            flowId: h.flowId,
            flowName: flows.find((f: { id: string; name?: string }) => f.id === h.flowId)?.name || h.flowId,
            input: h.input,
            result: { output: h.output, steps: h.steps, duration: h.duration, flow: h.flowId, success: h.success === 1 },
          }));
          setHistory(mapped.slice(0, 10));
        }
      } catch {
        // Silent fail - history is non-critical
      }
    };
    loadHistory();
  }, [flows]);

  // 🎯 AUTO-DEMO: Run featured workflow on first load
  useEffect(() => {
    const hasSeenDemo = sessionStorage.getItem('clawflow-demo-seen');
    if (!hasSeenDemo && !demoHasRun) {
      runAutoDemo();
      sessionStorage.setItem('clawflow-demo-seen', 'true');
    }
  }, [demoHasRun]);

  // Auto-demo with staged execution animation
  const runAutoDemo = async () => {
    if (demoHasRun) return;
    setDemoHasRun(true);
    setShowHero(false);
    setExecutingDemo(heroWorkflow.id);
    setInput(heroWorkflow.input);
    setLoading(true);
    setResult(null);
    setError(null);
    setVisibleSteps(0);
    setAutoDemoComplete(false);

    // Stage 1: Cleaning
    setLiveStatus("Cleaning input...");
    await delay(250);
    setVisibleSteps(1);

    // Stage 2: Extracting
    setLiveStatus("Extracting tasks...");
    await delay(250);
    setVisibleSteps(2);

    // Stage 3: Structuring
    setLiveStatus("Structuring product plan...");
    await delay(250);
    setVisibleSteps(3);

    // Execute actual pipeline
    try {
      const res = await fetch("/api/run-pipeline", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          input: heroWorkflow.input,
          flows: heroWorkflow.flows
        }),
      });

      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || "Pipeline execution failed");
      }

      // Reveal all steps
      for (let i = 0; i <= data.steps.length; i++) {
        setVisibleSteps(i);
        await delay(80);
      }

      setResult(data);
      setLiveStatus("Complete");
      setAutoDemoComplete(true);
      
      // Persist to history
      try {
        await fetch("/api/history", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            flowId: "pipeline",
            input: heroWorkflow.input,
            output: data.output,
            steps: data.steps,
            duration: data.duration,
            success: data.success
          }),
        });
      } catch {
        // Silent fail
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Auto-demo failed");
      setLiveStatus(null);
    } finally {
      setLoading(false);
      setExecutingDemo(null);
    }
  };

  const runFlow = async () => {
    if (!input.trim() || !selectedFlow) return;

    setLoading(true);
    setResult(null);
    setError(null);
    setVisibleSteps(0);
    setLiveStatus("Executing...");
    setShowHero(false);
    setAutoDemoComplete(false);

    try {
      let data: ExecutionResult;
      
      // Check if this is a custom claw (client-side only)
      const customClaw = customClaws.find(c => c.id === selectedFlow.id);
      if (customClaw) {
        // Execute custom claw client-side
        const startTime = performance.now();
        const flowDef = createCustomFlowDefinition(customClaw);
        const execution = await flowDef.execute(input);
        data = {
          flow: selectedFlow.id,
          success: true,
          steps: execution.steps,
          output: execution.result,
          executedAt: new Date().toISOString(),
          duration: Math.round(performance.now() - startTime),
        };
      } else {
        // Use API for built-in flows
        const res = await fetch("/api/run-flow", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ flowId: selectedFlow.id, input }),
        });
        const responseData = await res.json();
        if (!res.ok) {
          throw new Error(responseData.error || "Execution failed");
        }
        data = responseData;
      }

      // Animate step reveal
      for (let i = 0; i <= data.steps.length; i++) {
        setVisibleSteps(i);
        await delay(60);
      }

      setResult(data);
      setLiveStatus("Complete");

      // Update history
      const newEntry: HistoryEntry = {
        id: Date.now(),
        flowId: selectedFlow.id,
        flowName: selectedFlow.name,
        input,
        result: data,
      };
      setHistory(prev => [newEntry, ...prev].slice(0, 20));

      // Persist to DB (only for built-in flows)
      if (!customClaw) {
        try {
          await fetch("/api/history", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              flowId: selectedFlow.id,
              input,
              output: data.output,
              steps: data.steps,
              duration: data.duration,
              success: data.success
            }),
          });
        } catch {
          // Silent fail
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setLiveStatus(null);
    } finally {
      setLoading(false);
    }
  };

  const runDemoWorkflow = async (demo: DemoWorkflow) => {
    if (executingDemo) return;
    setExecutingDemo(demo.id);
    setInput(demo.input);
    setLoading(true);
    setResult(null);
    setError(null);
    setVisibleSteps(0);
    setShowHero(false);
    setAutoDemoComplete(false);

    try {
      const res = await fetch("/api/run-pipeline", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          input: demo.input,
          flows: demo.flows
        }),
      });

      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || "Pipeline execution failed");
      }

      // Animate step reveal
      for (let i = 0; i <= data.steps.length; i++) {
        setVisibleSteps(i);
        await delay(80);
      }

      setResult(data);
      setAutoDemoComplete(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Demo failed");
    } finally {
      setLoading(false);
      setExecutingDemo(null);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      runFlow();
    }
  };

  useEffect(() => {
    const handleGlobalKey = (e: KeyboardEvent) => {
      if (e.key === '?' && !['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) {
        // Show help modal - could add this feature
      }
    };
    window.addEventListener('keydown', handleGlobalKey);
    return () => window.removeEventListener('keydown', handleGlobalKey);
  }, []);

  const copyOutput = () => {
    if (result?.output) {
      navigator.clipboard.writeText(JSON.stringify(result.output, null, 2));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const selectFlow = (flow: FlowMetadata) => {
    setSelectedFlow(flow);
    setInput(flow.example || "");
    setResult(null);
    setError(null);
    setMobileMenuOpen(false);
    setShowHero(false);
    setAutoDemoComplete(false);
    inputRef.current?.focus();
  };

  const loadHistory = (entry: HistoryEntry) => {
    const flow = flows.find((f) => f.id === entry.flowId);
    if (flow) setSelectedFlow(flow);
    setInput(entry.input);
    setResult(entry.result);
    setShowHistory(false);
    setShowHero(false);
  };

  const flowColor = (flow: FlowMetadata) => flow.color || "#3b82f6";

  const runOwnInput = () => {
    setInput("");
    setResult(null);
    setAutoDemoComplete(false);
    setShowHero(false);
    inputRef.current?.focus();
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#0a0a0a]">
      {/* Header */}
      <header className="glass sticky top-0 z-50 border-b border-zinc-800/60">
        <div className="px-4 sm:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 via-purple-500 to-cyan-500 flex items-center justify-center animate-gradientShift">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight">ClawFlow</h1>
              <p className="text-[10px] text-zinc-500 font-medium tracking-wider">Turn raw input into structured workflows</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <a href="/pipeline" className="hidden sm:flex text-xs font-semibold px-3 py-1.5 rounded-lg bg-gradient-to-r from-blue-600/20 to-purple-600/20 hover:from-blue-600/30 hover:to-purple-600/30 text-blue-400 border border-blue-500/30 transition-all items-center gap-1.5 group">
              <svg className="w-3.5 h-3.5 text-blue-400 group-hover:animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
              <span className="hidden md:inline">Visual Workflow Builder</span>
              <span className="md:hidden">Builder</span>
            </a>
            {history.length > 0 && (
              <button onClick={() => setShowHistory(!showHistory)} className="text-xs px-3 py-1.5 rounded-lg bg-zinc-800/80 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-700/80 transition-all flex items-center gap-1.5">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                <span className="hidden sm:inline">{history.length}</span>
              </button>
            )}
            <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="lg:hidden text-zinc-400 hover:text-white p-2 rounded-lg hover:bg-zinc-800 transition-colors">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
            </button>
          </div>
        </div>
      </header>

      {/* History Dropdown */}
      {showHistory && (
        <div className="fixed inset-0 z-40" onClick={() => setShowHistory(false)}>
          <div className="absolute top-14 right-4 sm:right-6 w-80 glass rounded-xl shadow-2xl border border-zinc-700/50 animate-slideUp overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="p-3 border-b border-zinc-800 text-xs font-medium text-zinc-400 uppercase tracking-wider">Recent Executions</div>
            <div className="max-h-64 overflow-y-auto">
              {history.map((entry) => (
                <button key={entry.id} onClick={() => loadHistory(entry)} className="w-full text-left p-3 hover:bg-zinc-800/60 border-b border-zinc-800/50 transition-colors">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-semibold text-zinc-200">{entry.flowName}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-500">{entry.result.duration}ms</span>
                  </div>
                  <p className="text-xs text-zinc-500 truncate">{entry.input.slice(0, 60)}...</p>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 flex overflow-hidden">
        {/* Sidebar - Collapsed on mobile */}
        <aside className={`${mobileMenuOpen ? 'fixed inset-0 z-30 bg-zinc-950/95' : 'hidden'} lg:block lg:relative lg:bg-transparent w-full lg:w-64 xl:w-72 border-r border-zinc-800/60 overflow-y-auto`}>
          <div className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-[11px] font-semibold text-zinc-500 uppercase tracking-widest">{allFlows.length} Claws</h2>
            </div>
            
            {/* Category Filter */}
            <div className="flex flex-wrap gap-1.5 mb-4">
              <button
                onClick={() => setActiveCategory("all")}
                className={`text-[10px] px-2.5 py-1 rounded-lg transition-all ${activeCategory === "all" ? "bg-zinc-700 text-white" : "bg-zinc-800/50 text-zinc-500 hover:text-zinc-300"}`}
              >
                All
              </button>
              {(Object.keys(CATEGORY_LABELS) as FlowCategory[]).map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`text-[10px] px-2.5 py-1 rounded-lg transition-all flex items-center gap-1 ${activeCategory === cat ? "text-white" : "bg-zinc-800/50 text-zinc-500 hover:text-zinc-300"}`}
                  style={activeCategory === cat ? { background: `${CATEGORY_LABELS[cat].color}40` } : {}}
                >
                  <span>{CATEGORY_LABELS[cat].icon}</span>
                </button>
              ))}
            </div>

            {/* Grouped Flows */}
            <div className="space-y-4">
              {(Object.keys(CATEGORY_LABELS) as FlowCategory[]).map((category) => {
                if (activeCategory !== "all" && activeCategory !== category) return null;
                const catFlows = groupedFlows[category] || [];
                if (catFlows.length === 0) return null;
                
                return (
                  <div key={category} className="animate-slideUp">
                    <div className="flex items-center gap-2 mb-2 px-1">
                      <span className="text-sm">{CATEGORY_LABELS[category].icon}</span>
                      <span className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">{CATEGORY_LABELS[category].label}</span>
                    </div>
                    <div className="space-y-1">
                      {catFlows.map((flow) => {
                        const isSelected = selectedFlow?.id === flow.id;
                        return (
                          <button
                            key={flow.id}
                            onClick={() => selectFlow(flow)}
                            className="w-full text-left p-2.5 rounded-xl border transition-all duration-200 group"
                            style={{
                              borderColor: isSelected ? `${flowColor(flow)}50` : 'rgb(39 39 42 / 0.4)',
                              background: isSelected ? `${flowColor(flow)}10` : 'rgb(24 24 27 / 0.2)',
                            }}
                          >
                            <div className="flex items-center gap-2">
                              <span className="text-base">{flow.icon}</span>
                              <span className="font-medium text-sm text-zinc-200 group-hover:text-white">{flow.name}</span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
            
            {/* Build New Claw */}
            <div className="mt-6 pt-4 border-t border-zinc-800/60">
              <button onClick={() => setShowAddFlowModal(true)} className="w-full py-3 rounded-xl border border-dashed border-zinc-700 text-zinc-400 hover:text-zinc-200 hover:border-zinc-500 hover:bg-zinc-800/50 transition-all flex items-center justify-center gap-2 text-sm font-medium group">
                <svg className="w-4 h-4 group-hover:rotate-90 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                <div className="text-left">
                  <div className="text-sm">Create Custom Claw</div>
                  <div className="text-[9px] text-zinc-500 font-normal">No coding required — instant setup</div>
                </div>
              </button>
            </div>
            
            {/* Custom Claws List */}
            {customClaws.length > 0 && (
              <div className="mt-4 pt-4 border-t border-zinc-800/40">
                <h3 className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider mb-2 px-1 flex items-center gap-1">
                  <span>⭐</span> Your Custom Claws
                </h3>
                <div className="space-y-1">
                  {customClaws.map((claw) => (
                    <div key={claw.id} className="group relative">
                      <button
                        onClick={() => {
                          const flowMeta: FlowMetadata = {
                            id: claw.id,
                            name: claw.name,
                            description: claw.description,
                            example: getTemplateOptions().find(t => t.value === claw.template)?.description || "Enter your input here",
                            icon: claw.icon || getTemplateOptions().find(t => t.value === claw.template)?.icon || "⚡",
                            color: claw.color || "#a855f7",
                            category: claw.category,
                          };
                          selectFlow(flowMeta);
                        }}
                        className="w-full text-left p-2.5 rounded-xl border border-zinc-800/40 bg-zinc-900/20 hover:bg-zinc-800/40 transition-all"
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-base">{claw.icon || getTemplateOptions().find(t => t.value === claw.template)?.icon || "⚡"}</span>
                          <span className="font-medium text-sm text-zinc-300">{claw.name}</span>
                        </div>
                      </button>
                      <button
                        onClick={() => {
                          deleteCustomClaw(claw.id);
                          setCustomClaws(getCustomClaws());
                        }}
                        className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-red-500/20 text-zinc-500 hover:text-red-400 transition-all"
                        title="Delete custom claw"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </aside>

        {/* Execution Area */}
        <section className="flex-1 flex flex-col overflow-hidden">
          {/* Hero / Auto-Demo Section */}
          {showHero && !result && !loading ? (
            <div className="flex-1 overflow-y-auto">
              <div className="max-w-4xl mx-auto px-6 py-8">
                {/* Value Proposition Header */}
                <div className="text-center mb-8 animate-fadeIn">
                  <h2 className="text-2xl sm:text-3xl font-bold mb-2 bg-gradient-to-r from-white via-zinc-200 to-zinc-400 bg-clip-text text-transparent">
                    Turn raw input into structured workflows
                  </h2>
                  <p className="text-zinc-500">Deterministic automation powered by OpenClaw — milliseconds, zero AI cost</p>
                </div>

                {/* Demo Workflow Cards */}
                <div className="grid sm:grid-cols-3 gap-3 mb-8">
                  {DEMO_WORKFLOWS.map((demo, i) => (
                    <button
                      key={demo.id}
                      onClick={() => runDemoWorkflow(demo)}
                      disabled={executingDemo === demo.id}
                      className={`group relative p-4 rounded-xl border transition-all text-left ${demo.featured ? 'border-zinc-600 bg-zinc-800/40 col-span-3 sm:col-span-1' : 'border-zinc-800 bg-zinc-900/30 hover:bg-zinc-900/60 hover:border-zinc-700'}`}
                      style={{ animationDelay: `${i * 100}ms` }}
                    >
                      {demo.featured && (
                        <div className="absolute -top-2 left-4 px-2 py-0.5 rounded bg-gradient-to-r from-purple-500 to-blue-500 text-[9px] font-bold text-white uppercase tracking-wider">
                          Featured
                        </div>
                      )}
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 rounded-lg flex items-center justify-center text-xl" style={{ background: `${demo.color}15` }}>
                          {executingDemo === demo.id ? (
                            <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" style={{ color: demo.color }} />
                          ) : (
                            demo.icon
                          )}
                        </div>
                        <div className="flex gap-0.5">
                          {demo.flows.map((f, j) => (
                            <span key={j} className="w-1.5 h-1.5 rounded-full" style={{ background: demo.color, opacity: 0.3 + j * 0.35 }} />
                          ))}
                        </div>
                      </div>
                      <h3 className="font-semibold text-sm text-zinc-200 mb-1">{demo.title}</h3>
                      <p className="text-xs text-zinc-500">{demo.description}</p>
                    </button>
                  ))}
                </div>

                {/* Pipeline CTA */}
                <div className="text-center">
                  <a href="/pipeline" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 text-white text-sm font-medium hover:from-blue-500 hover:to-purple-500 transition-all shadow-lg shadow-blue-500/20">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
                    Build Custom Workflows
                  </a>
                </div>
              </div>
            </div>
          ) : (
            /* Execution Interface */
            <>
              {/* Input Section */}
              <div className="p-4 sm:p-5 border-b border-zinc-800/60">
                <div className="flex items-center justify-between mb-3">
                  {selectedFlow ? (
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{selectedFlow.icon}</span>
                      <span className="font-medium text-zinc-100">{selectedFlow.name}</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <span className="text-lg">🚀</span>
                      <span className="font-medium text-zinc-100">Pipeline Execution</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    {liveStatus && (
                      <span className="text-[10px] px-2 py-1 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30 animate-pulse flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                        {liveStatus}
                      </span>
                    )}
                    <button
                      onClick={() => setShowHero(true)}
                      className="text-xs px-3 py-1.5 rounded-lg bg-zinc-800/60 text-zinc-400 hover:text-zinc-200 transition-all"
                    >
                      Back to Demos
                    </button>
                  </div>
                </div>
                
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  rows={3}
                  placeholder="Enter your text here..."
                  className="w-full p-3 bg-zinc-900/50 border border-zinc-800 rounded-xl text-zinc-100 placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500/30 resize-none font-mono text-sm transition-all"
                />
                
                <div className="mt-2 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <p className="text-[11px] text-zinc-600">{input.length > 0 ? `${input.length} chars` : "Ctrl+Enter to run"}</p>
                    {selectedFlow && (
                      <button 
                        onClick={() => setInput(selectedFlow.example)} 
                        className="text-[11px] text-zinc-500 hover:text-zinc-300 transition-colors underline underline-offset-2"
                      >
                        Load example
                      </button>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {autoDemoComplete && (
                      <button
                        onClick={runOwnInput}
                        className="text-xs px-3 py-1.5 rounded-lg bg-zinc-800 text-zinc-400 hover:text-white transition-colors"
                      >
                        Try Your Own Input
                      </button>
                    )}
                    <button
                      onClick={selectedFlow ? runFlow : () => runDemoWorkflow(heroWorkflow)}
                      disabled={loading || !input.trim()}
                      className="px-5 py-2 rounded-xl font-semibold text-sm transition-all duration-200 flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-500 hover:to-purple-500 shadow-lg shadow-blue-500/20"
                    >
                      {loading ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          Executing...
                        </>
                      ) : (
                        <>
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /></svg>
                          {selectedFlow ? "Run Claw" : "Run Workflow"}
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* Output Section */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-5">
                {error && (
                  <div className="mb-4 p-4 bg-red-950/30 border border-red-800/40 rounded-xl animate-slideUp">
                    <div className="flex items-center gap-2 text-red-400 text-sm">
                      <svg className="h-4 w-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                      {error}
                    </div>
                  </div>
                )}

                {!result && !loading && !error && !showHero && (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center">
                      <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-zinc-900/80 border border-zinc-800 flex items-center justify-center text-2xl">
                        {selectedFlow?.icon || "🚀"}
                      </div>
                      <p className="text-zinc-500">Enter input and run to see transformation</p>
                    </div>
                  </div>
                )}

                {(result || loading) && (
                  <div className="space-y-5 animate-fadeIn max-w-5xl mx-auto">
                    {/* Live Status Badge */}
                    {liveStatus && liveStatus !== "Complete" && (
                      <div className="flex items-center gap-2 text-xs text-blue-400 mb-2">
                        <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
                        {liveStatus}
                      </div>
                    )}

                    {/* Side-by-side Transformation View */}
                    <div className="grid lg:grid-cols-2 gap-4">
                      {/* Input Panel */}
                      <div className="bg-zinc-900/30 border border-zinc-800/60 rounded-xl overflow-hidden">
                        <div className="px-4 py-2 border-b border-zinc-800/60 bg-zinc-900/50 flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-zinc-600" />
                          <span className="text-[10px] text-zinc-500 uppercase tracking-wider">Original Input</span>
                        </div>
                        <div className="p-4">
                          <pre className="text-sm text-zinc-400 whitespace-pre-wrap font-mono leading-relaxed">{input}</pre>
                        </div>
                      </div>

                      {/* Output Panel */}
                      <div className="bg-zinc-900/30 border border-zinc-800/60 rounded-xl overflow-hidden relative">
                        <div className="px-4 py-2 border-b border-zinc-800/60 bg-zinc-900/50 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                            <span className="text-[10px] text-zinc-500 uppercase tracking-wider">Structured Output</span>
                          </div>
                          {result && visibleSteps >= (result.steps?.length || 0) && (
                            <div className="flex items-center gap-2">
                              <button onClick={copyOutput} className="text-[10px] text-zinc-500 hover:text-white transition-colors flex items-center gap-1 px-2 py-1 rounded bg-zinc-800/50">
                                {copied ? (
                                  <><svg className="h-3 w-3 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>Copied</>
                                ) : (
                                  <><svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>Copy</>
                                )}
                              </button>
                            </div>
                          )}
                        </div>
                        <div className="p-4">
                          {result && visibleSteps >= (result.steps?.length || 0) ? (
                            <ErrorBoundary>
                              <RichOutput flowId={result.flow} output={result.output} />
                            </ErrorBoundary>
                          ) : loading ? (
                            <div className="flex items-center justify-center py-12">
                              <div className="text-center">
                                <div className="w-8 h-8 border-2 border-zinc-700 border-t-blue-500 rounded-full animate-spin mx-auto mb-2" />
                                <p className="text-xs text-zinc-500">Processing...</p>
                              </div>
                            </div>
                          ) : null}
                        </div>
                      </div>
                    </div>

                    {/* Animated Execution Steps */}
                    {(result?.steps || loading) && (
                      <div>
                        <h3 className="text-[11px] font-semibold text-zinc-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>
                          Execution Trace
                        </h3>
                        <div className="bg-zinc-900/30 border border-zinc-800/60 rounded-xl p-4">
                          <div className="space-y-2">
                            {result?.steps?.slice(0, visibleSteps).map((step, i) => {
                              const isNested = step.startsWith("  ↳");
                              return (
                                <div key={i} className="flex items-center gap-2.5 animate-stepReveal" style={{ animationDelay: `${i * 40}ms`, paddingLeft: isNested ? '20px' : '0' }}>
                                  <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 bg-emerald-500/20">
                                    <svg className="h-3 w-3 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                                  </div>
                                  <span className={`text-sm ${isNested ? 'text-zinc-500 text-xs' : 'text-zinc-300'}`}>{isNested ? step.slice(4) : step}</span>
                                </div>
                              );
                            })}
                            {loading && visibleSteps >= (result?.steps?.length || 0) && (
                              <div className="flex items-center gap-2.5 animate-pulse">
                                <div className="w-5 h-5 border-2 border-t-blue-500 border-zinc-700 rounded-full animate-spin" />
                                <span className="text-sm text-zinc-400">Processing...</span>
                              </div>
                            )}
                          </div>
                          {result && visibleSteps >= (result.steps?.length || 0) && (
                            <div className="mt-4 pt-3 border-t border-zinc-800/60 flex items-center gap-2 animate-fadeIn">
                              <div className={`w-2 h-2 rounded-full ${result.success ? 'bg-emerald-500' : 'bg-red-500'}`} />
                              <span className={`text-xs font-medium ${result.success ? 'text-emerald-400' : 'text-red-400'}`}>
                                {result.success ? `Completed in ${result.duration}ms` : "Execution failed"}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </>
          )}
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-800/60 px-6 py-3 flex items-center justify-between text-[11px] text-zinc-600">
        <span>ClawFlow — Modular Workflow Engine</span>
        <span className="flex items-center gap-1.5">Built for <span className="text-zinc-400 font-medium">OpenClaw</span></span>
      </footer>

      {/* Add Flow Modal */}
      {showAddFlowModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setShowAddFlowModal(false)}>
          <div className="w-full max-w-lg glass rounded-2xl shadow-2xl border border-zinc-700/50 p-6 animate-slideUp max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <span className="text-xl">⚡</span> Create Custom Claw
              </h2>
              <button onClick={() => setShowAddFlowModal(false)} className="text-zinc-500 hover:text-white transition-colors">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            
            {/* Tabs */}
            <div className="flex gap-1 mb-5 p-1 bg-zinc-900/50 rounded-lg">
              <button
                onClick={() => setShowAdvancedTab(false)}
                className={`flex-1 py-1.5 px-3 rounded-md text-xs font-medium transition-all ${!showAdvancedTab ? "bg-zinc-700 text-white" : "text-zinc-500 hover:text-zinc-300"}`}
              >
                Quick Create
              </button>
              <button
                onClick={() => setShowAdvancedTab(true)}
                className={`flex-1 py-1.5 px-3 rounded-md text-xs font-medium transition-all ${showAdvancedTab ? "bg-zinc-700 text-white" : "text-zinc-500 hover:text-zinc-300"}`}
              >
                Advanced (Code)
              </button>
            </div>

            {!showAdvancedTab ? (
              /* Quick Create Form */
              <>
                <p className="text-sm text-zinc-400 mb-5 leading-relaxed">
                  Create custom claws in seconds — no setup required. Choose a template and start using it instantly.
                </p>
                
                {showSuccessMessage && (
                  <div className="mb-4 p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex items-center gap-2 animate-fadeIn">
                    <svg className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                    <span className="text-sm text-emerald-400">Claw created successfully! Start using it from the sidebar.</span>
                  </div>
                )}
                
                {formError && (
                  <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-xl flex items-center gap-2">
                    <svg className="w-4 h-4 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    <span className="text-sm text-red-400">{formError}</span>
                  </div>
                )}
                
                <div className="space-y-4">
                  {/* Name Input */}
                  <div>
                    <label className="block text-xs font-medium text-zinc-500 mb-1.5">Claw Name</label>
                    <input
                      type="text"
                      value={clawName}
                      onChange={(e) => setClawName(e.target.value)}
                      placeholder="e.g., My Task Extractor"
                      className="w-full p-2.5 bg-zinc-900/60 border border-zinc-700 rounded-lg text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/30 transition-all"
                    />
                  </div>
                  
                  {/* Description Input */}
                  <div>
                    <label className="block text-xs font-medium text-zinc-500 mb-1.5">Description</label>
                    <input
                      type="text"
                      value={clawDescription}
                      onChange={(e) => setClawDescription(e.target.value)}
                      placeholder="What does this claw do?"
                      className="w-full p-2.5 bg-zinc-900/60 border border-zinc-700 rounded-lg text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/30 transition-all"
                    />
                  </div>
                  
                  {/* Template Selection */}
                  <div>
                    <label className="block text-xs font-medium text-zinc-500 mb-1.5">Template (Pre-built Logic)</label>
                    <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto custom-scrollbar">
                      {getTemplateOptions().map((template) => (
                        <button
                          key={template.value}
                          onClick={() => {
                            setClawTemplate(template.value);
                            if (!clawIcon) setClawIcon(template.icon);
                          }}
                          className={`p-3 rounded-xl border text-left transition-all ${
                            clawTemplate === template.value 
                              ? "border-blue-500/50 bg-blue-500/10" 
                              : "border-zinc-700 bg-zinc-900/40 hover:border-zinc-600"
                          }`}
                        >
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-lg">{template.icon}</span>
                            <span className={`text-xs font-medium ${clawTemplate === template.value ? "text-blue-400" : "text-zinc-300"}`}>
                              {template.label}
                            </span>
                          </div>
                          <p className="text-[10px] text-zinc-500 leading-tight">{template.description}</p>
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  {/* Category Selection */}
                  <div>
                    <label className="block text-xs font-medium text-zinc-500 mb-1.5">Category</label>
                    <div className="flex flex-wrap gap-2">
                      {getCategoryOptions().map((cat) => (
                        <button
                          key={cat.value}
                          onClick={() => setClawCategory(cat.value)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
                            clawCategory === cat.value 
                              ? "bg-zinc-700 text-white" 
                              : "bg-zinc-900/60 text-zinc-500 hover:text-zinc-300"
                          }`}
                        >
                          <span>{cat.icon}</span>
                          {cat.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  {/* Icon Input (Optional) */}
                  <div>
                    <label className="block text-xs font-medium text-zinc-500 mb-1.5">
                      Custom Icon <span className="text-zinc-600 font-normal">(optional)</span>
                    </label>
                    <input
                      type="text"
                      value={clawIcon}
                      onChange={(e) => setClawIcon(e.target.value)}
                      placeholder="⚡ or any emoji"
                      maxLength={2}
                      className="w-20 p-2.5 bg-zinc-900/60 border border-zinc-700 rounded-lg text-lg text-center text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/30 transition-all"
                    />
                  </div>
                </div>
                
                <button 
                  onClick={() => {
                    if (!clawName.trim()) {
                      setFormError("Please enter a name for your claw");
                      return;
                    }
                    if (!clawDescription.trim()) {
                      setFormError("Please enter a description");
                      return;
                    }
                    
                    const newClaw: CustomClawConfig = {
                      id: generateCustomClawId(),
                      name: clawName.trim(),
                      description: clawDescription.trim(),
                      icon: clawIcon || getTemplateOptions().find(t => t.value === clawTemplate)?.icon || "⚡",
                      color: "#a855f7",
                      category: clawCategory,
                      template: clawTemplate,
                      createdAt: Date.now(),
                    };
                    
                    saveCustomClaw(newClaw);
                    setCustomClaws(getCustomClaws());
                    
                    // Reset form
                    setClawName("");
                    setClawDescription("");
                    setClawTemplate("uppercase");
                    setClawCategory("text");
                    setClawIcon("");
                    setFormError(null);
                    setShowSuccessMessage(true);
                    
                    setTimeout(() => setShowSuccessMessage(false), 3000);
                  }}
                  className="w-full mt-5 py-2.5 rounded-xl font-semibold text-sm bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white transition-all flex items-center justify-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                  Create Claw
                </button>
              </>
            ) : (
              /* Advanced Code Tab */
              <>
                <p className="text-sm text-zinc-400 mb-5 leading-relaxed">
                  For developers: Extend ClawFlow with custom TypeScript code for unlimited flexibility.
                </p>
                <div className="bg-zinc-900/80 rounded-xl border border-zinc-800 overflow-hidden mb-5">
                  <div className="px-4 py-2 border-b border-zinc-800/80 text-[11px] font-mono text-zinc-500 bg-zinc-900/50">
                    lib/flows/customClaw.ts
                  </div>
                  <pre className="p-4 text-xs text-zinc-300 overflow-auto font-mono leading-relaxed custom-scrollbar">
{`import { FlowDefinition, FlowResult } from "../engine/types";

export const customClaw: FlowDefinition = {
  id: "custom",
  name: "Custom-Claw",
  description: "My custom automation skill",
  example: "Test input...",
  icon: "✨",
  color: "#3b82f6",
  category: "text",
  async execute(input: string): Promise<FlowResult> {
    return {
      steps: ["Processing input..."],
      result: { output: input.toUpperCase() },
    };
  },
};`}
                  </pre>
                </div>
                <p className="text-sm text-zinc-400 mb-6">
                  Register in <code className="bg-zinc-800 px-1.5 py-0.5 rounded text-zinc-300 font-mono text-[11px]">lib/flows/index.ts</code> to activate.
                </p>
                <button onClick={() => setShowAddFlowModal(false)} className="w-full py-2.5 rounded-xl font-semibold text-sm bg-zinc-100 hover:bg-white text-black transition-all">
                  Close
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
