import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import {
  ArrowRight,
  BarChart3,
  Bell,
  CheckCircle2,
  ChevronDown,
  ClipboardCheck,
  FileSearch,
  LockKeyhole,
  Menu,
  MessageSquareText,
  PanelsTopLeft,
  ShieldCheck,
  Sparkles,
  Target,
  Users,
  X,
  Zap,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useAuth, roleDashboardPath } from "@/lib/auth-context";
import { Logo } from "@/components/Logo";

export const Route = createFileRoute("/")({
  component: LandingPage,
});

const nav = [
  { label: "Features", id: "features" },
  { label: "Workflow", id: "workflow" },
  { label: "AI", id: "ai" },
  { label: "Analytics", id: "analytics" },
  { label: "Security", id: "security" },
  { label: "FAQ", id: "faq" },
];

const metrics = [
  { label: "Goal completion", value: "91%", tone: "bg-emerald-500" },
  { label: "Approval SLA", value: "1.8d", tone: "bg-sky-500" },
  { label: "Audit coverage", value: "100%", tone: "bg-amber-500" },
];

function LandingPage() {
  const { user, role } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const dashboardPath = roleDashboardPath(role);

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
    setMobileOpen(false);
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-50 border-b border-white/10 bg-slate-950/88 text-white backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          {/* <Link to="/" className="flex items-center gap-2">
            <div className="grid h-9 w-9 place-items-center rounded-lg bg-white text-slate-950">
              <PanelsTopLeft className="h-5 w-5" />
            </div>
            <div>
              <div className="text-sm font-semibold leading-none">Momentum AI</div>
              <div className="text-[11px] text-slate-400">Workflow OS</div>
            </div>
          </Link> */}
          <Link to="/" className="flex items-center">
  <Logo className="text-white" />
</Link>

          <nav className="hidden items-center gap-1 md:flex">
            {nav.map((item) => (
              <button
                key={item.id}
                onClick={() => scrollTo(item.id)}
                className="rounded-md px-3 py-2 text-sm text-slate-300 transition hover:bg-white/10 hover:text-white"
              >
                {item.label}
              </button>
            ))}
          </nav>

          <div className="hidden items-center gap-2 md:flex">
            <Button
              asChild
              variant="ghost"
              className="text-white hover:bg-white/10 hover:text-white"
            >
              <Link to={user ? dashboardPath : "/login"}>{user ? "Open dashboard" : "Login"}</Link>
            </Button>
            <Button asChild className="bg-white text-slate-950 hover:bg-slate-200">
              <Link to="/login">
                Get started <ArrowRight className="ml-1.5 h-4 w-4" />
              </Link>
            </Button>
          </div>

          <Button
            variant="ghost"
            size="icon"
            className="md:hidden text-white hover:bg-white/10 hover:text-white"
            onClick={() => setMobileOpen((open) => !open)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
        {mobileOpen && (
          <div className="border-t border-white/10 px-4 pb-4 md:hidden">
            <div className="grid gap-1 pt-2">
              {nav.map((item) => (
                <button
                  key={item.id}
                  onClick={() => scrollTo(item.id)}
                  className="rounded-md px-3 py-2 text-left text-sm text-slate-300 hover:bg-white/10 hover:text-white"
                >
                  {item.label}
                </button>
              ))}
              <Button asChild className="mt-2 bg-white text-slate-950 hover:bg-slate-200">
                <Link to="/login">Get started</Link>
              </Button>
            </div>
          </div>
        )}
      </header>

      <main>
        <section className="relative overflow-hidden bg-slate-950 text-white">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(14,165,233,0.18),transparent_28%),radial-gradient(circle_at_78%_10%,rgba(16,185,129,0.16),transparent_24%),linear-gradient(135deg,rgba(15,23,42,1),rgba(17,24,39,0.95))]" />
          <div className="relative mx-auto grid max-w-7xl gap-10 px-4 py-20 sm:px-6 lg:grid-cols-[1.02fr_0.98fr] lg:px-8 lg:py-24">
            <div className="flex flex-col justify-center">
              <Badge className="mb-5 w-fit border-white/15 bg-white/10 text-white hover:bg-white/10">
                <Sparkles className="mr-1.5 h-3.5 w-3.5" /> AI-assisted performance operations
              </Badge>
              <h1 className="max-w-4xl text-4xl font-semibold tracking-tight sm:text-6xl">
                Momentum AI
              </h1>
              <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-300">
                Enterprise workflow management for goals, check-ins, approvals, audit trails, and
                executive analytics in one polished operating layer.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Button asChild size="lg" className="bg-white text-slate-950 hover:bg-slate-200">
                  <Link to="/login">
                    Get started <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="border-white/20 bg-white/5 text-white hover:bg-white/10 hover:text-white"
                  onClick={() => scrollTo("analytics")}
                >
                  View product tour
                </Button>
              </div>
              <div className="mt-10 grid max-w-xl grid-cols-3 gap-3">
                {metrics.map((metric) => (
                  <div
                    key={metric.label}
                    className="rounded-lg border border-white/10 bg-white/[0.06] p-3 backdrop-blur"
                  >
                    <div className="flex items-center gap-2">
                      <span className={`h-2 w-2 rounded-full ${metric.tone}`} />
                      <span className="text-xs text-slate-400">{metric.label}</span>
                    </div>
                    <div className="mt-2 text-2xl font-semibold tabular-nums">{metric.value}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative min-h-[520px]">
              <div className="absolute right-0 top-0 w-full max-w-xl rounded-xl border border-white/12 bg-white/[0.08] p-4 shadow-2xl backdrop-blur-xl">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium">Executive Command Center</div>
                    <div className="text-xs text-slate-400">
                      Live goal health across departments
                    </div>
                  </div>
                  <Badge className="bg-emerald-500/15 text-emerald-200 hover:bg-emerald-500/15">
                    Live
                  </Badge>
                </div>
                <div className="grid gap-3 sm:grid-cols-3">
                  {[
                    ["78%", "On-track goals"],
                    ["42", "Pending reviews"],
                    ["6", "At-risk teams"],
                  ].map(([value, label]) => (
                    <div
                      key={label}
                      className="rounded-lg border border-white/10 bg-slate-950/45 p-3"
                    >
                      <div className="text-2xl font-semibold">{value}</div>
                      <div className="text-xs text-slate-400">{label}</div>
                    </div>
                  ))}
                </div>
                <div className="mt-4 rounded-lg border border-white/10 bg-slate-950/45 p-4">
                  <div className="mb-4 flex items-center justify-between text-xs text-slate-400">
                    <span>Department completion</span>
                    <span>Q2 FY26</span>
                  </div>
                  <div className="space-y-3">
                    {[
                      ["Engineering", 86, "bg-sky-400"],
                      ["Customer Success", 74, "bg-emerald-400"],
                      ["Finance", 67, "bg-amber-400"],
                      ["People Ops", 92, "bg-fuchsia-400"],
                    ].map(([label, value, color]) => (
                      <div key={label as string}>
                        <div className="mb-1 flex justify-between text-xs">
                          <span>{label}</span>
                          <span>{value}%</span>
                        </div>
                        <div className="h-2 rounded-full bg-white/10">
                          <div
                            className={`h-2 rounded-full ${color}`}
                            style={{ width: `${value}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-lg border border-white/10 bg-slate-950/45 p-4">
                    <MessageSquareText className="mb-3 h-5 w-5 text-sky-300" />
                    <div className="text-sm font-medium">AI goal draft</div>
                    <p className="mt-1 text-xs leading-5 text-slate-400">
                      Reduce enterprise support resolution time by 22% with Q3 automation
                      milestones.
                    </p>
                  </div>
                  <div className="rounded-lg border border-white/10 bg-slate-950/45 p-4">
                    <FileSearch className="mb-3 h-5 w-5 text-emerald-300" />
                    <div className="text-sm font-medium">Audit ready</div>
                    <p className="mt-1 text-xs leading-5 text-slate-400">
                      Every approval, edit, and check-in event is searchable and exportable.
                    </p>
                  </div>
                </div>
              </div>
              <div className="absolute bottom-0 left-0 hidden w-72 rounded-xl border border-white/12 bg-white/[0.09] p-4 shadow-2xl backdrop-blur-xl sm:block">
                <div className="mb-3 flex items-center gap-2">
                  <div className="grid h-8 w-8 place-items-center rounded-lg bg-amber-400 text-slate-950">
                    <Bell className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="text-sm font-medium">Approval alert</div>
                    <div className="text-xs text-slate-400">Manager queue updated</div>
                  </div>
                </div>
                <p className="text-xs leading-5 text-slate-300">
                  3 quarterly goal sheets need review before Friday SLA.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section id="features" className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <SectionIntro
            eyebrow="Platform"
            title="Everything performance teams need to run the quarter"
          />
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[
              [
                Target,
                "Goal architecture",
                "Create individual, shared, and department goals with weightage, targets, and quarterly milestones.",
              ],
              [
                ClipboardCheck,
                "Approval workflows",
                "Managers review, approve, reject, or request rework with clear status transitions.",
              ],
              [
                Sparkles,
                "AI assistance",
                "Draft SMART goals, KPIs, performance feedback, and weekly summaries in seconds.",
              ],
              [
                BarChart3,
                "Executive analytics",
                "Track completion, delayed goals, department health, and approval velocity.",
              ],
              [
                ShieldCheck,
                "Audit automation",
                "Every meaningful workflow event is captured for HR and compliance review.",
              ],
              [
                Users,
                "Role portals",
                "Employees, managers, and admins each get focused dashboards and action queues.",
              ],
            ].map(([Icon, title, body]) => (
              <Card
                key={title as string}
                className="border-border/70 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
              >
                <CardContent className="p-5">
                  <div className="mb-4 grid h-10 w-10 place-items-center rounded-lg bg-primary text-primary-foreground">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="font-semibold">{title as string}</h3>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">{body as string}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section id="workflow" className="bg-slate-950 py-20 text-white">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <SectionIntro
              eyebrow="Workflow"
              title="From goal creation to audit-ready outcomes"
              inverse
            />
            <div className="grid gap-4 lg:grid-cols-4">
              {[
                ["01", "Create", "Employees draft goals or accept shared department objectives."],
                ["02", "Approve", "Managers review weightage, KPIs, and alignment before lock-in."],
                ["03", "Check in", "Quarterly updates capture actuals, comments, and status."],
                [
                  "04",
                  "Analyze",
                  "Admins monitor risk, delays, audit trails, and performance trends.",
                ],
              ].map(([step, title, body]) => (
                <div key={step} className="rounded-xl border border-white/10 bg-white/[0.06] p-5">
                  <div className="mb-8 text-sm text-slate-400">{step}</div>
                  <h3 className="font-semibold">{title}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-400">{body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section
          id="ai"
          className="mx-auto grid max-w-7xl gap-8 px-4 py-20 sm:px-6 lg:grid-cols-[0.92fr_1.08fr] lg:px-8"
        >
          <div>
            <SectionIntro
              eyebrow="AI Assistance"
              title="A Notion-style assistant for better goals and better reviews"
            />
            <p className="text-sm leading-7 text-muted-foreground">
              Momentum AI gives teams structured, believable support even without a live model
              backend: goal generation, KPI suggestions, feedback prompts, and weekly summaries.
            </p>
            <div className="mt-6 flex flex-wrap gap-2">
              {[
                "Generate quarterly goals",
                "Improve goal quality",
                "Suggest KPIs",
                "Performance insights",
              ].map((item) => (
                <Badge key={item} variant="secondary">
                  {item}
                </Badge>
              ))}
            </div>
            <Button asChild className="mt-6 w-fit">
              <Link to={user ? "/ai" : "/login"}>
                Open AI Copilot <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
          <Card className="overflow-hidden border-border/70 shadow-xl">
            <div className="border-b bg-muted/40 p-4">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-accent" />
                <span className="text-sm font-medium">Momentum AI Copilot</span>
              </div>
            </div>
            <CardContent className="space-y-4 p-5">
              <div className="rounded-lg bg-muted/60 p-4 text-sm">
                Generate team objectives for a support organization focused on customer retention.
              </div>
              <div className="rounded-lg border bg-background p-4">
                <div className="mb-2 flex items-center gap-2 text-sm font-medium">
                  <Sparkles className="h-4 w-4 text-accent" /> Suggested objective
                </div>
                <p className="text-sm leading-6 text-muted-foreground">
                  Improve enterprise customer retention by reducing high-severity ticket reopen
                  rates by 18% and publishing two proactive health-review playbooks by Q4.
                </p>
                <div className="mt-4 grid gap-2 sm:grid-cols-3">
                  {["KPI: Reopen rate", "Target: -18%", "Owner: CS Ops"].map((item) => (
                    <div key={item} className="rounded-md bg-muted/50 px-3 py-2 text-xs">
                      {item}
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        <section id="analytics" className="bg-muted/40 py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <SectionIntro eyebrow="Analytics" title="Executive-ready reporting from day one" />
            <div className="grid gap-4 lg:grid-cols-3">
              {[
                ["Completion", "84%", "Weighted progress across active goals"],
                ["Turnaround", "1.8 days", "Median manager approval cycle"],
                ["Risk", "12 goals", "Delayed or missing check-ins"],
              ].map(([title, value, body]) => (
                <Card key={title} className="border-border/70">
                  <CardContent className="p-5">
                    <div className="text-sm text-muted-foreground">{title}</div>
                    <div className="mt-2 text-3xl font-semibold">{value}</div>
                    <p className="mt-2 text-sm text-muted-foreground">{body}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section id="security" className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <div className="grid gap-8 lg:grid-cols-2">
            <div>
              <SectionIntro eyebrow="Security" title="Built for enterprise review habits" />
              <div className="space-y-3">
                {[
                  "Role-based portals for employee, manager, and admin workflows",
                  "Searchable audit logs with event expansion and CSV export",
                  "Configurable notifications, data export, and session controls",
                  "Approval states that keep submitted and locked goals protected",
                ].map((item) => (
                  <div
                    key={item}
                    className="flex items-start gap-3 rounded-lg border bg-card p-3 text-sm"
                  >
                    <CheckCircle2 className="mt-0.5 h-4 w-4 text-success" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>
            <Card className="border-border/70">
              <CardContent className="p-5">
                <div className="mb-4 flex items-center gap-2">
                  <LockKeyhole className="h-5 w-5 text-accent" />
                  <h3 className="font-semibold">Enterprise controls</h3>
                </div>
                <div className="space-y-3 text-sm">
                  {[
                    ["SOC2-ready audit exports", "Enabled"],
                    ["Role permission matrix", "Configured"],
                    ["Quarterly data retention", "36 months"],
                    ["Session timeout policy", "8 hours"],
                  ].map(([label, value]) => (
                    <div
                      key={label}
                      className="flex items-center justify-between rounded-md bg-muted/50 px-3 py-2"
                    >
                      <span className="text-muted-foreground">{label}</span>
                      <span className="font-medium">{value}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        <section className="bg-slate-950 py-20 text-white">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid gap-4 lg:grid-cols-4">
              {[
                ["2.4x", "faster review cycles"],
                ["38%", "fewer delayed goals"],
                ["96%", "employee check-in adoption"],
                ["4.8/5", "manager demo rating"],
              ].map(([value, label]) => (
                <div key={label} className="rounded-xl border border-white/10 bg-white/[0.06] p-5">
                  <div className="text-3xl font-semibold">{value}</div>
                  <div className="mt-2 text-sm text-slate-400">{label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <SectionIntro
            eyebrow="Plans"
            title="Flexible enough for a hackathon demo and an MVP story"
          />
          <div className="grid gap-4 md:grid-cols-3">
            {[
              [
                "Starter",
                "Portfolio demo",
                ["Role dashboards", "AI assistant mock", "Responsive workflow UI"],
              ],
              ["Growth", "MVP pilot", ["Supabase workflows", "Audit exports", "Admin analytics"]],
              [
                "Enterprise",
                "Recruiter walkthrough",
                ["Security controls", "Escalations", "Executive reporting"],
              ],
            ].map(([name, caption, features]) => (
              <Card key={name as string} className="border-border/70">
                <CardContent className="p-5">
                  <h3 className="font-semibold">{name as string}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{caption as string}</p>
                  <div className="mt-5 space-y-2">
                    {(features as string[]).map((feature) => (
                      <div key={feature} className="flex items-center gap-2 text-sm">
                        <Zap className="h-3.5 w-3.5 text-accent" /> {feature}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section id="faq" className="bg-muted/40 py-20">
          <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
            <SectionIntro eyebrow="FAQ" title="Common questions" center />
            <Accordion type="single" collapsible className="rounded-xl border bg-card px-4">
              {[
                [
                  "Does this require a live AI backend?",
                  "No. The current assistant simulates realistic structured AI responses and can be connected to a model API later.",
                ],
                [
                  "Can each role see different workflows?",
                  "Yes. Employees, managers, and admins have separate dashboards, navigation, and action queues.",
                ],
                [
                  "Is the app demo-ready without full production data?",
                  "Yes. Key pages use polished mock fallbacks where live data is not available, so dashboards never feel empty.",
                ],
              ].map(([q, a], index) => (
                <AccordionItem key={q} value={`item-${index}`}>
                  <AccordionTrigger className="text-left">
                    <span>{q}</span>
                    <ChevronDown className="h-4 w-4 shrink-0 transition-transform duration-200" />
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">{a}</AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </section>
      </main>

      <footer className="border-t bg-slate-950 text-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-8 sm:px-6 md:flex-row md:items-center md:justify-between lg:px-8">
          <div className="flex items-center gap-2">
            <div className="grid h-8 w-8 place-items-center rounded-lg bg-white text-slate-950">
              <PanelsTopLeft className="h-4 w-4" />
            </div>
            <span className="text-sm font-medium">Momentum AI</span>
          </div>
          <div className="text-sm text-slate-400">
            Enterprise workflow management for modern teams.
          </div>
          <Button
            asChild
            variant="outline"
            className="border-white/20 bg-white/5 text-white hover:bg-white/10 hover:text-white"
          >
            <Link to="/login">Login</Link>
          </Button>
        </div>
      </footer>
    </div>
  );
}

function SectionIntro({
  eyebrow,
  title,
  inverse = false,
  center = false,
}: {
  eyebrow: string;
  title: string;
  inverse?: boolean;
  center?: boolean;
}) {
  return (
    <div className={center ? "mb-10 text-center" : "mb-10"}>
      <div
        className={`text-xs font-semibold uppercase tracking-[0.18em] ${inverse ? "text-sky-300" : "text-accent"}`}
      >
        {eyebrow}
      </div>
      <h2
        className={`mt-3 max-w-3xl text-3xl font-semibold tracking-tight sm:text-4xl ${inverse ? "text-white" : "text-foreground"} ${center ? "mx-auto" : ""}`}
      >
        {title}
      </h2>
    </div>
  );
}
