import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  BarChart3,
  Bot,
  Clipboard,
  Copy,
  PanelRightClose,
  PanelRightOpen,
  FileText,
  Lightbulb,
  Loader2,
  MessageSquareText,
  RefreshCw,
  Send,
  Sparkles,
  Target,
  TrendingUp,
  Wand2,
} from "lucide-react";
import { toast } from "sonner";
import { PageHeader, SectionCard } from "@/components/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/lib/auth-context";
import { THRUST_AREAS } from "@/lib/progress";

export const Route = createFileRoute("/_app/employee/ai")({
  beforeLoad: () => {
    throw redirect({ to: "/ai" });
  },
  component: AIAssistantPage,
});

type AssistantMode = "quarterly" | "improve" | "kpis" | "team" | "insights" | "summary";

type Suggestion = {
  title: string;
  thrust: string;
  description: string;
  kpis: string[];
  milestones: string[];
  confidence: number;
};

type ChatMessage = {
  id: number;
  role: "user" | "assistant";
  content: string;
  suggestion?: Suggestion;
  createdAt: string;
};

const quickActions: Array<{
  mode: AssistantMode;
  title: string;
  prompt: string;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  {
    mode: "quarterly",
    title: "Generate Quarterly Goals",
    prompt:
      "Generate three quarterly goals for improving customer response efficiency and automation quality.",
    icon: Target,
  },
  {
    mode: "improve",
    title: "Improve Goal Quality",
    prompt: "Improve this goal: make support faster this quarter.",
    icon: Wand2,
  },
  {
    mode: "kpis",
    title: "Suggest KPIs",
    prompt: "Suggest KPIs for an engineering productivity goal focused on release predictability.",
    icon: BarChart3,
  },
  {
    mode: "team",
    title: "Generate Team Objectives",
    prompt: "Generate team objectives for a cross-functional retention initiative.",
    icon: Lightbulb,
  },
  {
    mode: "insights",
    title: "Performance Insights",
    prompt:
      "Analyze my quarter and suggest practical next actions based on delayed milestones and approval risk.",
    icon: TrendingUp,
  },
  {
    mode: "summary",
    title: "Weekly Summary",
    prompt: "Write a weekly progress summary for my manager with risks, wins, and next steps.",
    icon: FileText,
  },
];

const starterMessages: ChatMessage[] = [
  {
    id: 1,
    role: "assistant",
    content:
      "Tell me what you are trying to improve. I can draft SMART goals, suggest KPIs, rewrite vague goals, or prepare a weekly manager summary.",
    createdAt: new Date().toISOString(),
  },
];

const STORAGE_KEY = "momentum-ai-copilot-conversation";

export function AIAssistantPage() {
  const { role } = useAuth();
  const [prompt, setPrompt] = useState(
    "Generate three quarterly goals for improving customer response efficiency and automation quality.",
  );
  const [mode, setMode] = useState<AssistantMode>("quarterly");
  const [busy, setBusy] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>(() => readConversation());
  const [lastSuggestion, setLastSuggestion] = useState<Suggestion | null>(null);
  const [contextOpen, setContextOpen] = useState(true);
  const messageEndRef = useRef<HTMLDivElement | null>(null);

  const selectedAction = useMemo(
    () => quickActions.find((action) => action.mode === mode) ?? quickActions[0],
    [mode],
  );
  const workspaceLink =
    role === "admin"
      ? "/admin/analytics"
      : role === "manager"
        ? "/manager/shared"
        : "/employee/goals";
  const workspaceLabel =
    role === "admin" ? "Open analytics" : role === "manager" ? "Open shared goals" : "Open goals";

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(messages.slice(-40)));
    messageEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, busy]);

  const runAssistant = (nextPrompt = prompt, nextMode = mode) => {
    if (!nextPrompt.trim()) {
      toast.error("Add a prompt first");
      return;
    }

    const userMessage: ChatMessage = {
      id: Date.now(),
      role: "user",
      content: nextPrompt.trim(),
      createdAt: new Date().toISOString(),
    };

    setMessages((current) => [...current, userMessage]);
    setBusy(true);

    setTimeout(() => {
      const suggestion = buildSuggestion(nextPrompt.trim(), nextMode);
      const assistantMessage: ChatMessage = {
        id: Date.now() + 1,
        role: "assistant",
        content: buildNarrative(nextMode, suggestion),
        suggestion,
        createdAt: new Date().toISOString(),
      };
      setMessages((current) => [...current, assistantMessage]);
      setLastSuggestion(suggestion);
      setBusy(false);
    }, 850);
  };

  const applyQuickAction = (nextMode: AssistantMode, nextPrompt: string) => {
    setMode(nextMode);
    setPrompt(nextPrompt);
    runAssistant(nextPrompt, nextMode);
  };

  const copySuggestion = async (suggestion: Suggestion | null) => {
    if (!suggestion) return;
    const text = [
      suggestion.title,
      "",
      suggestion.description,
      "",
      "KPIs:",
      ...suggestion.kpis.map((kpi) => `- ${kpi}`),
      "",
      "Milestones:",
      ...suggestion.milestones.map((milestone) => `- ${milestone}`),
    ].join("\n");
    await navigator.clipboard.writeText(text);
    toast.success("AI suggestion copied");
  };

  const clearConversation = () => {
    setMessages(starterMessages);
    setLastSuggestion(null);
    toast.success("Conversation reset");
  };

  return (
    <div className="flex min-h-0 flex-col">
      <PageHeader
        title="Momentum AI Copilot"
        description="Generate goals, sharpen KPIs, explain analytics, prepare check-ins, and surface manager-ready performance insights."
        actions={
          <Button asChild variant="outline">
            <Link to={workspaceLink}>
              <Target className="mr-1.5 h-4 w-4" /> {workspaceLabel}
            </Link>
          </Button>
        }
      />

      <div className="grid min-h-0 gap-4 xl:grid-cols-[320px_minmax(0,1fr)]">
        <div className="space-y-4 xl:max-h-[calc(100vh-8.5rem)] xl:overflow-y-auto xl:pr-1">
          <SectionCard title="AI actions" description="Pick a workflow and refine the prompt.">
            <div className="grid gap-2">
              {quickActions.map((action) => (
                <button
                  key={action.mode}
                  onClick={() => applyQuickAction(action.mode, action.prompt)}
                  className={`flex w-full items-center gap-3 rounded-lg border p-3 text-left text-sm transition hover:bg-muted/60 ${
                    mode === action.mode ? "border-accent bg-accent/10" : "bg-background"
                  }`}
                >
                  <div className="grid h-9 w-9 shrink-0 place-items-center rounded-md bg-primary text-primary-foreground">
                    <action.icon className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="font-medium">{action.title}</div>
                    <div className="text-xs text-muted-foreground line-clamp-1">
                      {action.prompt}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </SectionCard>

          <SectionCard title="Suggestion quality">
            <div className="space-y-3">
              {[
                ["Specific", lastSuggestion ? 92 : 68],
                ["Measurable", lastSuggestion ? 88 : 61],
                ["Quarter-ready", lastSuggestion ? 95 : 72],
              ].map(([label, value]) => (
                <div key={label as string}>
                  <div className="mb-1 flex justify-between text-xs">
                    <span className="text-muted-foreground">{label as string}</span>
                    <span className="font-medium">{value as number}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-muted">
                    <div className="h-2 rounded-full bg-accent" style={{ width: `${value}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </SectionCard>
        </div>

        <div
          className={`grid min-h-0 gap-4 ${contextOpen ? "lg:grid-cols-[minmax(0,1fr)_360px]" : "lg:grid-cols-[minmax(0,1fr)]"}`}
        >
          <Card className="flex h-[calc(100vh-8.5rem)] min-h-[620px] flex-col overflow-hidden">
            <div className="flex shrink-0 items-center justify-between border-b bg-muted/35 p-4">
              <div className="flex items-center gap-2">
                <div className="grid h-9 w-9 place-items-center rounded-lg bg-accent text-accent-foreground">
                  <Sparkles className="h-4 w-4" />
                </div>
                <div>
                  <div className="text-sm font-semibold">Momentum AI Copilot</div>
                  <div className="text-xs text-muted-foreground">{selectedAction.title}</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="secondary">Persistent</Badge>
                <Button size="sm" variant="ghost" onClick={clearConversation}>
                  Reset
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => setContextOpen((open) => !open)}
                  aria-label="Toggle context panel"
                >
                  {contextOpen ? (
                    <PanelRightClose className="h-4 w-4" />
                  ) : (
                    <PanelRightOpen className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            <div className="min-h-0 flex-1 space-y-4 overflow-y-auto scroll-smooth p-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[88%] animate-in fade-in-0 slide-in-from-bottom-1 rounded-xl p-4 text-sm shadow-sm ${
                      message.role === "user"
                        ? "bg-primary text-primary-foreground"
                        : "border bg-card text-card-foreground"
                    }`}
                  >
                    <div className="mb-2 flex items-center gap-2 text-xs opacity-80">
                      {message.role === "assistant" ? (
                        <Bot className="h-3.5 w-3.5" />
                      ) : (
                        <MessageSquareText className="h-3.5 w-3.5" />
                      )}
                      {message.role === "assistant" ? "Assistant" : "You"}
                      <span>-</span>
                      <span>{formatTime(message.createdAt)}</span>
                    </div>
                    <p className="leading-6">{message.content}</p>
                    {message.suggestion && (
                      <SuggestionCard
                        suggestion={message.suggestion}
                        onCopy={() => copySuggestion(message.suggestion ?? null)}
                      />
                    )}
                  </div>
                </div>
              ))}

              {busy && (
                <div className="flex justify-start">
                  <div className="rounded-xl border bg-card p-4 text-sm shadow-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <span className="flex gap-1">
                        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-accent [animation-delay:-0.2s]" />
                        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-accent [animation-delay:-0.1s]" />
                        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-accent" />
                      </span>
                      Thinking through SMART structure, KPIs, and milestones...
                    </div>
                  </div>
                </div>
              )}
              <div ref={messageEndRef} />
            </div>

            <div className="shrink-0 border-t bg-background p-4">
              <div className="space-y-3">
                <Textarea
                  rows={3}
                  value={prompt}
                  onChange={(event) => setPrompt(event.target.value)}
                  placeholder="Ask Momentum AI to draft, improve, summarize, or suggest KPIs..."
                />
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div className="text-xs text-muted-foreground">
                    Tip: include the team, metric, timeframe, and business outcome.
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      disabled={!lastSuggestion || busy}
                      onClick={() => runAssistant(prompt, mode)}
                    >
                      <RefreshCw className="mr-1.5 h-4 w-4" /> Regenerate
                    </Button>
                    <Button disabled={busy} onClick={() => runAssistant()}>
                      {busy ? (
                        <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                      ) : (
                        <Send className="mr-1.5 h-4 w-4" />
                      )}
                      Send
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {contextOpen && (
            <div className="space-y-4 lg:max-h-[calc(100vh-8.5rem)] lg:overflow-y-auto lg:pr-1">
              <SectionCard
                title="Structured output"
                description="Ready to paste into a goal sheet."
              >
                {lastSuggestion ? (
                  <div className="space-y-4">
                    <SuggestionCard
                      suggestion={lastSuggestion}
                      compact
                      onCopy={() => copySuggestion(lastSuggestion)}
                    />
                    <Button className="w-full" onClick={() => copySuggestion(lastSuggestion)}>
                      <Clipboard className="mr-1.5 h-4 w-4" /> Copy to goal draft
                    </Button>
                  </div>
                ) : (
                  <div className="rounded-lg border border-dashed p-6 text-center">
                    <Sparkles className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
                    <div className="text-sm font-medium">No generated draft yet</div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Run an AI action to produce a structured goal.
                    </p>
                  </div>
                )}
              </SectionCard>

              <SectionCard title="Prompt recipes">
                <Tabs defaultValue="goal">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="goal">Goal</TabsTrigger>
                    <TabsTrigger value="kpi">KPI</TabsTrigger>
                    <TabsTrigger value="review">Review</TabsTrigger>
                  </TabsList>
                  {[
                    [
                      "goal",
                      "Turn 'improve onboarding' into a SMART quarterly goal for a product team.",
                    ],
                    ["kpi", "Suggest leading and lagging KPIs for a customer retention objective."],
                    [
                      "review",
                      "Summarize weekly progress with wins, risks, blockers, and next actions.",
                    ],
                  ].map(([value, text]) => (
                    <TabsContent key={value} value={value} className="mt-3">
                      <button
                        className="w-full rounded-lg border bg-muted/30 p-3 text-left text-sm leading-6 hover:bg-muted/60"
                        onClick={() => setPrompt(text)}
                      >
                        {text}
                      </button>
                    </TabsContent>
                  ))}
                </Tabs>
              </SectionCard>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function readConversation() {
  if (typeof window === "undefined") return starterMessages;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return starterMessages;
    const parsed = JSON.parse(raw) as ChatMessage[];
    return parsed.length ? parsed : starterMessages;
  } catch {
    return starterMessages;
  }
}

function formatTime(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function SuggestionCard({
  suggestion,
  compact = false,
  onCopy,
}: {
  suggestion: Suggestion;
  compact?: boolean;
  onCopy: () => void;
}) {
  return (
    <div className={`mt-4 rounded-lg border bg-background/80 p-4 ${compact ? "mt-0" : ""}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <Badge variant="outline">{suggestion.thrust}</Badge>
          <h3 className="mt-3 text-base font-semibold leading-6">{suggestion.title}</h3>
        </div>
        <Button size="icon" variant="ghost" onClick={onCopy} aria-label="Copy suggestion">
          <Copy className="h-4 w-4" />
        </Button>
      </div>
      <p className="mt-3 text-sm leading-6 text-muted-foreground">{suggestion.description}</p>
      <div className="mt-4 grid gap-3">
        <div>
          <div className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            KPIs
          </div>
          <div className="grid gap-2">
            {suggestion.kpis.map((kpi) => (
              <div key={kpi} className="rounded-md bg-muted/50 px-3 py-2 text-xs">
                {kpi}
              </div>
            ))}
          </div>
        </div>
        {!compact && (
          <div>
            <div className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Milestones
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              {suggestion.milestones.map((milestone) => (
                <div
                  key={milestone}
                  className="rounded-md border bg-card px-3 py-2 text-xs leading-5"
                >
                  {milestone}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
        <span>Confidence score</span>
        <span className="font-medium text-foreground">{suggestion.confidence}%</span>
      </div>
    </div>
  );
}

function buildSuggestion(prompt: string, mode: AssistantMode): Suggestion {
  const lower = prompt.toLowerCase();
  const thrust = inferThrust(lower);
  const subject = inferSubject(prompt);

  const templates: Record<AssistantMode, Omit<Suggestion, "thrust" | "confidence">> = {
    quarterly: {
      title: `Improve ${subject} through quarterly operating discipline`,
      description: `Create a measurable quarterly plan to improve ${subject.toLowerCase()} with a defined baseline, weekly operating reviews, and milestone-based execution across all four quarters.`,
      kpis: [
        "Primary KPI: 20% improvement against baseline",
        "Leading KPI: weekly milestone completion above 85%",
        "Quality KPI: stakeholder satisfaction above 4.5/5",
      ],
      milestones: [
        "Q1: Confirm baseline and publish owner map",
        "Q2: Pilot process changes with one team",
        "Q3: Scale the playbook across the function",
        "Q4: Hit target and document operating rhythm",
      ],
    },
    improve: {
      title: `Rewrite ${subject} as a SMART outcome`,
      description: `Convert the broad intent into a specific, measurable, achievable, relevant, and time-bound goal with clear ownership and an evidence-based target.`,
      kpis: [
        "Specific outcome metric with current baseline",
        "Target threshold due by quarter end",
        "Review cadence with manager sign-off",
      ],
      milestones: [
        "Clarify business outcome and target audience",
        "Define baseline and reporting source",
        "Add quarterly checkpoints",
        "Confirm target and approval owner",
      ],
    },
    kpis: {
      title: `KPI model for ${subject}`,
      description: `Use a balanced KPI set that combines outcome, leading, quality, and adoption metrics so progress is visible before quarter-end.`,
      kpis: [
        "Outcome: target attainment percentage",
        "Leading: weekly delivery predictability",
        "Quality: defect or rework rate",
        "Adoption: stakeholder usage or participation",
      ],
      milestones: [
        "Select source system",
        "Set baseline",
        "Create weekly dashboard",
        "Review variance and corrective actions",
      ],
    },
    team: {
      title: `Team objective system for ${subject}`,
      description: `Align a cross-functional team around one department-level outcome, shared KPIs, clear owners, and visible dependencies.`,
      kpis: [
        "Team progress: weighted average above 80%",
        "Dependency SLA: blockers resolved within 3 business days",
        "Engagement: check-in completion above 95%",
      ],
      milestones: [
        "Map owners and dependencies",
        "Create shared goal records",
        "Run midpoint review",
        "Publish executive summary",
      ],
    },
    insights: {
      title: `Performance insight plan for ${subject}`,
      description: `Focus on the most actionable risks: delayed milestones, unclear KPIs, missed check-ins, and goals waiting on manager decisions.`,
      kpis: [
        "Delayed goal count reduced by 30%",
        "Approval age below 2 business days",
        "Check-in completeness above 95%",
      ],
      milestones: [
        "Identify top three blockers",
        "Create recovery actions",
        "Notify owners",
        "Review trend next week",
      ],
    },
    summary: {
      title: `Weekly summary for ${subject}`,
      description: `This week showed steady movement with clear wins, two manageable risks, and a focused plan for next week. Share progress in business terms and call out decisions needed.`,
      kpis: [
        "Wins: milestones completed",
        "Risks: delayed dependencies",
        "Next steps: owner and due date",
      ],
      milestones: [
        "Summarize wins",
        "Name blockers",
        "Request manager decision",
        "Confirm next update date",
      ],
    },
  };

  return {
    ...templates[mode],
    thrust,
    confidence: mode === "improve" ? 94 : mode === "kpis" ? 91 : 89,
  };
}

function inferThrust(lower: string) {
  if (lower.includes("customer") || lower.includes("support") || lower.includes("retention"))
    return "Customer Experience";
  if (lower.includes("revenue") || lower.includes("sales")) return "Revenue Growth";
  if (lower.includes("cost") || lower.includes("save")) return "Cost Optimization";
  if (lower.includes("quality") || lower.includes("compliance")) return "Quality & Compliance";
  if (lower.includes("team") || lower.includes("people") || lower.includes("manager"))
    return "People & Culture";
  return THRUST_AREAS.includes("Digital Transformation")
    ? "Digital Transformation"
    : THRUST_AREAS[0];
}

function inferSubject(prompt: string) {
  const cleaned = prompt
    .replace(/^(generate|improve|suggest|analyze|write|turn)\s+/i, "")
    .replace(/[.!?]+$/g, "")
    .trim();
  if (!cleaned) return "quarterly performance";
  return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
}

function buildNarrative(mode: AssistantMode, suggestion: Suggestion) {
  if (mode === "summary") {
    return "Here is a concise weekly summary your manager can scan quickly. I kept it outcome-led and added next-step language.";
  }
  if (mode === "kpis") {
    return "I built a balanced KPI model with leading and lagging indicators so this goal is measurable before the end of the quarter.";
  }
  if (mode === "improve") {
    return "I tightened the wording into a SMART goal, added evidence points, and made the approval criteria easier for a manager to review.";
  }
  return "I drafted a structured goal with a thrust area, measurable KPIs, quarterly milestones, and a practical confidence score.";
}
