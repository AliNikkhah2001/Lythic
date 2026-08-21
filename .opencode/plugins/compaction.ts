import type { Plugin, ToolResultHookContext } from "@opencode/plugin";


interface CompactionConfig {
  maxDiffLinesPerFile: number;
  maxStackTraceLines: number;
  enableAnsiStripping: boolean;
  rawCharThreshold: number;
}


const DEFAULT_CONFIG: CompactionConfig = {
  maxDiffLinesPerFile: 35,
  maxStackTraceLines: 20,
  enableAnsiStripping: true,
  rawCharThreshold: 1500, // Trigger compression if output exceeds ~375 tokens
};


/**
 * Strips ANSI color and control codes.
 */
function stripAnsi(text: string): string {
  // eslint-disable-next-line no-control-regex
  return text.replace(/\x1B(?:[@-Z\\-_]|\[[0-?]*[ -/]*[@-~])/g, "");
}


/**
 * Compresses unified git diffs by retaining file status, hunk headers,
 * and truncated change context for oversized files.
 */
function compressGitDiff(raw: string, maxLines: number): string {
  const fileDiffs = raw.split(/^diff --git /m);
  if (fileDiffs.length <= 1 && !raw.startsWith("diff --git")) {
    return raw;
  }


  const processedFiles = fileDiffs.map((diffBlock) => {
    if (!diffBlock.trim()) return ";


    const lines = diffBlock.split("\n");
    const headerLines: string[] = [];
    const hunkLines: string[] = [];


    let isHeader = true;
    for (const line of lines) {
      if (line.startsWith("@@")) {
        isHeader = false;
      }
      if (isHeader) {
        headerLines.push(line);
      } else {
        hunkLines.push(line);
      }
    }


    // Keep header concise (target file paths and summary)
    const targetFile =
      headerLines.find((l) => l.startsWith("+++ b/"))?.replace("+++ b/", "") ||
      headerLines[0]?.split(" ").pop() ||
      "unknown";


    if (hunkLines.length <= maxLines) {
      return `--- ${targetFile} ---\n` + hunkLines.join("\n");
    }


    // Retain first half of edits and tail changes with truncation marker
    const headCount = Math.floor(maxLines * 0.6);
    const tailCount = Math.floor(maxLines * 0.4);
    const omittedCount = hunkLines.length - (headCount + tailCount);


    const compressedHunks = [
      ...hunkLines.slice(0, headCount),
      `\n  [... ${omittedCount} diff lines compressed for token optimization ...]\n`,
      ...hunkLines.slice(-tailCount),
    ];


    return `--- ${targetFile} (Diff truncated) ---\n` + compressedHunks.join("\n");
  });


  return processedFiles.filter(Boolean).join("\n\n");
}


/**
 * Extracts failed assertions, error traces, and summary statistics
 * from pytest, vitest/jest, go test, and cargo test outputs.
 */
function compressTestLogs(raw: string, maxTraceLines: number): string {
  const lines = raw.split("\n");
  const failureLines: string[] = [];
  const summaryLines: string[] = [];
  let capturingTrace = false;
  let currentTraceCount = 0;


  // Signatures indicating failed tests or stack traces
  const failTriggers = [
    /FAIL/,
    /FAILED/,
    /ERROR/,
    /AssertionError/,
    /panic:/,
    /--- FAIL:/,
    /Expected:/,
    /Received:/,
    /Error:/,
  ];


  // Signatures indicating test run summaries
  const summaryTriggers = [
    /=== FAILURES ===/,
    /short test summary info/,
    /Tests:.*failed/,
    /FAILURES!/,
    /test result: FAILED/,
    /DONE \d+ tests/,
    /FAIL\t.*\[build failed\]/,
  ];


  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];


    // Filter out verbose passing tests to save tokens
    if (/^\s*(✓|PASS|ok\s+[\w/.-]+|\.\s+|\s*PASSED)/.test(line)) {
      continue;
    }


    const isSummary = summaryTriggers.some((rx) => rx.test(line));
    if (isSummary) {
      summaryLines.push(...lines.slice(i, i + 15));
      i += 15;
      continue;
    }


    const isFailTrigger = failTriggers.some((rx) => rx.test(line));
    if (isFailTrigger) {
      capturingTrace = true;
      currentTraceCount = 0;
    }


    if (capturingTrace) {
      if (currentTraceCount < maxTraceLines) {
        failureLines.push(line);
        currentTraceCount++;
      } else if (currentTraceCount === maxTraceLines) {
        failureLines.push("  [... stack trace truncated ...]");
        capturingTrace = false;
      }
    }
  }


  // If failed signals were captured, return targeted error context
  if (failureLines.length > 0 || summaryLines.length > 0) {
    return [
      "=== TEST SUITE COMPACTED REPORT ===",
      failureLines.length > 0 ? "--- FAILURES & TRACES ---\n" + failureLines.join("\n") : "",
      summaryLines.length > 0 ? "--- SUITE SUMMARY ---\n" + summaryLines.join("\n") : "",
    ]
      .filter(Boolean)
      .join("\n\n");
  }


  // Fallback for massive unclassified test outputs: head + tail slice
  if (lines.length > 60) {
    return [
      "=== TEST LOGS (ABBREVIATED) ===",
      ...lines.slice(0, 20),
      `\n[... ${lines.length - 40} lines omitted ...]\n`,
      ...lines.slice(-20),
    ].join("\n");
  }


  return raw;
}


/**
 * Central compaction dispatcher.
 */
function compactOutput(text: string, config: CompactionConfig): string {
  let cleaned = config.enableAnsiStripping ? stripAnsi(text) : text;


  if (cleaned.length < config.rawCharThreshold) {
    return cleaned;
  }


  // Git diff heuristic
  if (cleaned.includes("diff --git") || (cleaned.includes("--- a/") && cleaned.includes("+++ b/"))) {
    return compressGitDiff(cleaned, config.maxDiffLinesPerFile);
  }


  // Test runner output heuristic
  if (
    /pytest|jest|vitest|go test|cargo test|mocha|phpunit/i.test(cleaned) ||
    /=== RUN|FAILURES|AssertionError|Test Suites:/i.test(cleaned)
  ) {
    return compressTestLogs(cleaned, config.maxStackTraceLines);
  }


  // Generic fallback compression for high-volume logs
  const lines = cleaned.split("\n");
  if (lines.length > 80) {
    return [
      ...lines.slice(0, 30),
      `\n[... ${lines.length - 60} lines omitted for context preservation ...]\n`,
      ...lines.slice(-30),
    ].join("\n");
  }


  return cleaned;
}


/**
 * OpenCode Plugin Export
 */
export const CompactionPlugin: Plugin = {
  name: "token-compaction-plugin",
  version: "1.0.0",


  hooks: {
    /**
     * Intercepts and transforms tool execution output before storing it in context history.
     */
    async afterToolExecution(context: ToolResultHookContext) {
      const { toolName, result } = context;


      // Target execution and bash tools
      if (typeof result === "string" && ["bash", "exec", "terminal", "run_command"].includes(toolName)) {
        return compactOutput(result, DEFAULT_CONFIG);
      }


      if (result && typeof result === "object" && "stdout" in result) {
        return {
          ...result,
          stdout: compactOutput(String(result.stdout), DEFAULT_CONFIG),
          stderr: result.stderr ? compactOutput(String(result.stderr), DEFAULT_CONFIG) : result.stderr,
        };
      }


      return result;
    },
  },
};


export default CompactionPlugin;