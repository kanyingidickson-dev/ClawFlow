import { FlowDefinition, FlowResult } from "../engine/types";

/**
 * Debug-Claw: Analyzes text for error patterns and issues
 * Detects errors, warnings, and info-level messages with
 * severity classification and suggested remediation
 */

interface PatternMatch {
  keyword: string;
  severity: "critical" | "warning" | "info";
  suggestion: string;
}

const ERROR_PATTERNS: PatternMatch[] = [
  { keyword: "error", severity: "critical", suggestion: "Check stack trace and isolate the failing module" },
  { keyword: "exception", severity: "critical", suggestion: "Wrap in try/catch and handle the edge case" },
  { keyword: "crash", severity: "critical", suggestion: "Review memory usage and unhandled promise rejections" },
  { keyword: "fail", severity: "critical", suggestion: "Verify input data and external service availability" },
  { keyword: "fatal", severity: "critical", suggestion: "Immediate investigation required — system may be down" },
  { keyword: "undefined", severity: "warning", suggestion: "Add null checks or default values" },
  { keyword: "null", severity: "warning", suggestion: "Validate data before accessing properties" },
  { keyword: "timeout", severity: "warning", suggestion: "Increase timeout or optimize the slow operation" },
  { keyword: "rejected", severity: "warning", suggestion: "Add .catch() handler or check auth/permissions" },
  { keyword: "deprecated", severity: "info", suggestion: "Plan migration to the recommended alternative" },
  { keyword: "warning", severity: "info", suggestion: "Monitor and address before it becomes an error" },
  { keyword: "warn", severity: "info", suggestion: "Review warning context for potential issues" },
];

function extractLineNumber(line: string): number | null {
  const match = line.match(/(?:line\s*|:)(\d+)/i);
  return match ? parseInt(match[1], 10) : null;
}

export const debugClaw: FlowDefinition = {
  id: "debug",
  name: "Debug-Claw",
  description: "Scans input for error patterns with severity classification and fix suggestions",
  example: "Error: connection failed on line 42\nWarning: deprecated API usage\nTypeError: undefined is not a function",
  icon: "🔍",
  color: "#f59e0b",
  category: "dev",

  execute(input: string): FlowResult {
    const steps: string[] = [
      "Reading input lines",
      "Scanning for error patterns",
      "Classifying severity levels",
      "Extracting line references",
      "Generating fix suggestions",
      "Compiling diagnostic report",
    ];

    const lines = input.split("\n").filter((l) => l.trim().length > 0);

    const issues = lines
      .map((line) => {
        const lower = line.toLowerCase();
        const matchedPattern = ERROR_PATTERNS.find((p) =>
          lower.includes(p.keyword)
        );

        if (!matchedPattern) return null;

        return {
          line: line.trim(),
          severity: matchedPattern.severity,
          matched_keyword: matchedPattern.keyword,
          line_number: extractLineNumber(line),
          suggestion: matchedPattern.suggestion,
        };
      })
      .filter(Boolean);

    const critical = issues.filter((i) => i!.severity === "critical").length;
    const warnings = issues.filter((i) => i!.severity === "warning").length;
    const info = issues.filter((i) => i!.severity === "info").length;

    return {
      steps,
      result: {
        total_issues: issues.length,
        total_lines_scanned: lines.length,
        breakdown: { critical, warnings, info },
        issues,
        health: critical > 0 ? "unhealthy" : warnings > 0 ? "degraded" : "healthy",
      },
    };
  },
};
