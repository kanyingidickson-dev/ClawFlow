# OpenClaw Integration Guide

## Architecture Positioning

ClawFlow is designed as a **deterministic execution backend for OpenClaw agents**.

Rather than embedding OpenClaw directly, ClawFlow provides the missing execution layer that OpenClaw agents can call via webhooks for fast, predictable workflow execution.

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   OpenClaw      │────▶│   Webhook Call   │────▶│   ClawFlow      │
│   Agent         │     │   POST /api/     │     │   Execution     │
│   (Orchestrate) │     │   webhook/       │     │   (Deterministic│
│                 │     │   openclaw       │     │   Skills)       │
└─────────────────┘     └──────────────────┘     └─────────────────┘
                              │                          │
                              │◀─────────────────────────│
                              │   Structured Result      │
                              │   (< 5ms response)       │
```

## Webhook Integration

### Endpoint

```
POST /api/webhook/openclaw
```

### Request Format

```json
{
  "flow": "task",
  "input": "build landing page urgently, setup auth by Friday",
  "options": {
    "priority": "high"
  }
}
```

### Response Format

```json
{
  "success": true,
  "output": {
    "tasks": [
      { "task": "Build landing page", "priority": "high", "category": "dev" },
      { "task": "Setup authentication", "priority": "high", "category": "security" }
    ],
    "count": 2
  },
  "steps": ["Parsing input", "Detecting priorities", "Structuring tasks"],
  "duration": 3
}
```

## OpenClaw Agent Configuration

### Example Agent Config

```yaml
# openclaw-agent.yml
agent:
  name: task-extraction-agent
  description: Extracts actionable tasks from messy input
  
skills:
  - name: deterministic-extraction
    type: webhook
    endpoint: http://localhost:3000/api/webhook/openclaw
    timeout: 5000
    
  - name: fallback-llm
    type: openclaw-native
    model: gpt-4
    
routing:
  - condition: input.length < 1000
    skill: deterministic-extraction
    reason: "Fast, predictable execution for structured tasks"
    
  - condition: input.length >= 1000
    skill: fallback-llm
    reason: "Complex input requires LLM reasoning"
```

## Why This Architecture?

### OpenClaw's Strength
- High-level orchestration
- Agent reasoning
- Complex decision-making

### ClawFlow's Complement
- Deterministic execution (< 5ms)
- Structured output guarantee
- Zero AI cost for predictable tasks
- Modular, testable skills

### Combined Value
```
OpenClaw decides WHAT to do
        ↓
ClawFlow executes HOW to do it fast
        ↓
Result returned to OpenClaw for next orchestration step
```

## Concrete Examples

### Example 1: Voice Memo → Product Roadmap

**OpenClaw Agent receives:**
> "build an AI app for farmers with weather alerts marketplace and payments need it by next sprint"

**Calls ClawFlow:**
```json
{
  "flow": "pipeline",
  "input": "build an AI app for farmers with weather alerts marketplace and payments need it by next sprint",
  "flows": ["clean", "task", "brain"]
}
```

**ClawFlow returns in 4ms:**
```json
{
  "output": {
    "stages": {
      "clean": { "cleaned_text": "Build an AI app for farmers..." },
      "task": { "tasks": [
        { "task": "Build weather alert system", "priority": "high" },
        { "task": "Implement marketplace", "priority": "medium" },
        { "task": "Integrate mobile payments", "priority": "high" }
      ]},
      "brain": {
        "title": "AgriTech AI Platform",
        "target_audience": ["small-scale farmers", "agricultural cooperatives"],
        "complexity": { "level": "medium-high", "score": 72 },
        "next_steps": ["Define MVP scope", "Research payment providers", "Design UX"]
      }
    }
  },
  "duration": 4
}
```

**OpenClaw continues:** Uses structured output for next orchestration step

---

### Example 2: Error Logs → Actionable Tasks

**OpenClaw Agent receives:**
> "Error: connection failed on line 42\nWarning: deprecated API usage\nTypeError: undefined is not a function"

**Calls ClawFlow:**
```json
{
  "flow": "debug",
  "input": "Error: connection failed on line 42\nWarning: deprecated API usage\nTypeError: undefined is not a function"
}
```

**ClawFlow returns in 2ms:**
```json
{
  "output": {
    "health": "critical",
    "total_issues": 2,
    "issues": [
      {
        "severity": "critical",
        "line": "Error: connection failed on line 42",
        "suggestion": "Check database connection string and network connectivity"
      },
      {
        "severity": "warning",
        "line": "TypeError: undefined is not a function",
        "suggestion": "Verify function exists before calling; check import statements"
      }
    ]
  },
  "duration": 2
}
```

---

### Example 3: CSV → Structured Data

**OpenClaw Agent receives messy CSV:**
> "Name,Age,City\nJohn,30,NYC\nJane,25,LA\nBob,35,"

**Calls ClawFlow:**
```json
{
  "flow": "csv",
  "input": "Name,Age,City\nJohn,30,NYC\nJane,25,LA\nBob,35,"
}
```

**ClawFlow returns in 1ms:**
```json
{
  "output": {
    "meta": { "rows": 3, "columns": 3, "empty_cells_filled": 1 },
    "headers": ["Name", "Age", "City"],
    "data": [
      { "Name": "John", "Age": 30, "City": "NYC" },
      { "Name": "Jane", "Age": 25, "City": "LA" },
      { "Name": "Bob", "Age": 35, "City": null }
    ]
  },
  "duration": 1
}
```

## Key Insight

> **ClawFlow doesn't replace OpenClaw — it accelerates it.**

For tasks that don't require LLM reasoning (parsing, formatting, extracting, validating), ClawFlow provides:
- 100x faster execution (1-5ms vs 500-2000ms)
- 100% deterministic output
- Zero token cost
- Guaranteed structure

OpenClaw agents can route simple tasks to ClawFlow, reserving LLM calls for tasks requiring reasoning.
