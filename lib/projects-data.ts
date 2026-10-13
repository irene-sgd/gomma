import type { Project } from "@/lib/types"

export const projects: Project[] = [
  {
    key: "pausa",
    code: "PRJ-7",
    name: "PAUSA",
    notionId: "2fc7286d055f8015b30af3e7ee706666",
    kind: "Thai Cacao Powder · B2B + Consumer",
    location: "Bangkok, TH",
    started: "Jan 17, 2026",
    badges: [
      {
        label: "In Progress",
        tone: "active",
      },
      {
        label: "Pivot: Powder → Primary",
        tone: "active",
      },
      {
        label: "Pre-Revenue",
        tone: "neutral",
      },
    ],
    signals: [
      {
        title: "Product-market resonance confirmed",
        detail:
          "73% of 15 tasters rated 4–5 stars. Refreshing, fruity, and light/clean dominate taste descriptors.",
        tone: "success",
      },
      {
        title: "B2B lead from tasting event",
        detail:
          'Bar industry contact (mmybar.com) flagged product as "perfect for cocktails and mocktails."',
        tone: "success",
      },
      {
        title: "Pitch deck update overdue",
        detail:
          "Cacao powder pivot deck (TSK-246) was due Apr 2. Budget, pricing, and TAMSAMSOM slides outstanding.",
        tone: "active",
      },
      {
        title: "Zero revenue · pre-investment stage",
        detail:
          "฿6,400 spent, ฿0 in. Funding round and first B2B client are the Q2 unlock conditions.",
        tone: "danger",
      },
    ],
    okrs: [
      {
        title: "Pausa gets funding",
        status: "In Progress",
        tone: "active",
      },
      {
        title: "Pitch deck ready for investors",
        status: "In Progress",
        tone: "active",
      },
      {
        title: "First B2B client signed",
        status: "Not Started",
        tone: "neutral",
      },
    ],
    monthly: [
      {
        month: "Jan",
        value: 338,
      },
      {
        month: "Feb",
        value: 420,
      },
      {
        month: "Mar",
        value: 5402,
      },
      {
        month: "Apr",
        value: 240,
      },
    ],
    strategy:
      "Deep recovery without the energy crash. Premium Thai cacao powder · traceable origin · zero-waste · B2B primary.",
    pillars: [
      "Theobromine vs caffeine — smooth energy, no cortisol spike.",
      "Natural bioavailable electrolytes + magnesium from real cacao.",
      "Whole cacao fruit utilisation. Zero-waste sustainability narrative for B2B partners.",
    ],
    roadmap: [
      {
        quarter: "Q1 2026",
        done: true,
        now: false,
        items: ["KNECTD deal", "Tasting event", "Brand MVP", "Domain"],
      },
      {
        quarter: "Q2 2026",
        done: false,
        now: true,
        items: ["Pitch deck", "Website launch", "First B2B client", "Funding"],
      },
      {
        quarter: "Q3 2026",
        done: false,
        now: false,
        items: ["Scale B2B", "2nd client", "Supply chain"],
      },
      {
        quarter: "Q4 2026",
        done: false,
        now: false,
        items: ["Retail partnership", "Revenue milestone"],
      },
    ],
  },
  {
    key: "knectd",
    code: "PRJ-13",
    name: "KNECTD",
    notionId: "3187286d055f803ba0ffc33f8dc4a4a5",
    kind: "Payments Infrastructure · B2B + B2C",
    location: "Bangkok, TH",
    started: "Mar 9, 2026",
    badges: [
      {
        label: "In Progress",
        tone: "active",
      },
      {
        label: "Revenue: ฿35k/mo",
        tone: "success",
      },
      {
        label: "Contract signed",
        tone: "success",
      },
    ],
    signals: [
      {
        title: "Revenue generating — ฿35,000/mo",
        detail:
          "Scope of work signed. KNECTD is the primary income source funding other projects in the workspace.",
        tone: "success",
      },
      {
        title: "Brand positioning established",
        detail:
          "B2B messaging around payout cost reduction and gig economy payouts is defined and in execution.",
        tone: "success",
      },
      {
        title: "Content engine scaling",
        detail:
          "MarCom workstream active: personas, content pillars, and content bank being built out for Q2.",
        tone: "active",
      },
      {
        title: "Website messaging underway",
        detail:
          "Site structure, UX content audit, and homepage (v7.0) copy in production.",
        tone: "info",
      },
    ],
    okrs: [
      {
        title: "Deliver scope of work month 1",
        status: "Done",
        tone: "success",
      },
      {
        title: "Build MarCom content engine",
        status: "In flight",
        tone: "active",
      },
      {
        title: "Website + channel setup live",
        status: "Q2",
        tone: "active",
      },
    ],
    monthly: [
      {
        month: "Jan",
        value: 0,
      },
      {
        month: "Feb",
        value: 0,
      },
      {
        month: "Mar",
        value: 35000,
      },
    ],
    strategy:
      "Payments infrastructure for platforms moving money faster. B2B: reduce payout costs and failures. B2C: gig workers receive payouts faster.",
    pillars: [
      "Outcome-first messaging — cost, speed, compliance before technology.",
      "Stablecoins positioned as infrastructure, not product.",
      "Dual audience: Heads of Payments (B2B) and gig workers (B2C).",
    ],
    roadmap: [
      {
        quarter: "Q1 2026",
        done: true,
        now: false,
        items: [
          "Contract signed",
          "Brand brief",
          "Personas",
          "Content pillars",
        ],
      },
      {
        quarter: "Q2 2026",
        done: false,
        now: true,
        items: [
          "Website live",
          "Ads creative",
          "Content bank",
          "Social channels",
        ],
      },
      {
        quarter: "Q3 2026",
        done: false,
        now: false,
        items: ["Performance reporting", "Campaign optimisation"],
      },
      {
        quarter: "Q4 2026",
        done: false,
        now: false,
        items: ["Expansion scope", "Second workstream"],
      },
    ],
  },
  {
    key: "gomma",
    code: "PRJ-24",
    name: "GOMMA Studio",
    notionId: "3287286d055f80c09ca4f9c214de534c",
    kind: "Creative Studio · MarCom & Automation",
    location: "Bangkok, TH",
    started: "Mar 19, 2026",
    badges: [
      {
        label: "In Progress",
        tone: "active",
      },
      {
        label: "Pre-Revenue",
        tone: "neutral",
      },
      {
        label: "Incubating",
        tone: "active",
      },
    ],
    signals: [
      {
        title: "Studio concept defined",
        detail:
          "GOMMA positions as a creative studio at the intersection of MarCom and AI automation for founders.",
        tone: "success",
      },
      {
        title: "Early stage — no revenue yet",
        detail:
          "Two sub-projects in motion but no client or product signed. First client target is Q2 2026.",
        tone: "active",
      },
      {
        title: "Marketplace sub-project scoped",
        detail:
          "Premium Human AI Agentic Creator marketplace is the flagship product concept in development.",
        tone: "info",
      },
    ],
    okrs: [
      {
        title: "Studio identity defined",
        status: "Done",
        tone: "success",
      },
      {
        title: "Land first GOMMA client",
        status: "In flight",
        tone: "active",
      },
      {
        title: "Marketplace MVP scoped",
        status: "In flight",
        tone: "active",
      },
    ],
    monthly: [
      {
        month: "Jan",
        value: 0,
      },
      {
        month: "Feb",
        value: 0,
      },
      {
        month: "Mar",
        value: 0,
      },
    ],
    strategy:
      "Creative studio for founders. Specialises in MarCom strategy, AI-powered content automation, and a creator marketplace.",
    pillars: [
      "MarCom + automation as a combined service offering.",
      "AI-augmented creators — human quality, machine speed.",
      "Founders as the primary client — lean teams needing full-stack brand execution.",
    ],
    roadmap: [
      {
        quarter: "Q1 2026",
        done: true,
        now: false,
        items: ["Studio setup", "Sub-projects scoped", "Positioning"],
      },
      {
        quarter: "Q2 2026",
        done: false,
        now: true,
        items: ["First client", "Workshop delivery", "Marketplace spec"],
      },
      {
        quarter: "Q3 2026",
        done: false,
        now: false,
        items: ["Marketplace build", "2nd client"],
      },
      {
        quarter: "Q4 2026",
        done: false,
        now: false,
        items: ["Scale studio", "Revenue model locked"],
      },
    ],
  },
  {
    key: "barcamp",
    code: "PRJ-6",
    name: "BarCamp",
    notionId: "2fc7286d055f801289f8c3d8b61066ef",
    kind: "Community Event · Network Building",
    location: "Bangkok, TH",
    started: "Nov 29, 2025",
    badges: [
      {
        label: "In Progress",
        tone: "active",
      },
      {
        label: "Community",
        tone: "neutral",
      },
      {
        label: "GOMMA reputation play",
        tone: "active",
      },
    ],
    signals: [
      {
        title: "10 CRM contacts logged",
        detail:
          "BarCamp is a network-building play. 10 contacts already in CRM — the highest for any non-revenue project.",
        tone: "success",
      },
      {
        title: "Linked to Q1 OKR",
        detail:
          "Building GOMMA reputation through BarCamp was an explicit Q1 objective. In-flight as of Q2.",
        tone: "info",
      },
      {
        title: "Low task count — may need more structure",
        detail:
          "Only 1 task linked. Consider breaking the event into sub-tasks for tracking prep milestones.",
        tone: "active",
      },
    ],
    okrs: [
      {
        title: "Present at BarCamp event",
        status: "In flight",
        tone: "active",
      },
      {
        title: "Build GOMMA public profile",
        status: "In flight",
        tone: "active",
      },
      {
        title: "Expand network from event",
        status: "Planned",
        tone: "neutral",
      },
    ],
    monthly: [
      {
        month: "Nov",
        value: 0,
      },
      {
        month: "Dec",
        value: 0,
      },
      {
        month: "Jan",
        value: 0,
      },
      {
        month: "Mar",
        value: 0,
      },
    ],
    strategy:
      "Community event participation as a reputation and network-building vehicle for GOMMA Studio. Low cost, high relationship ROI.",
    pillars: [
      "Public presence for the GOMMA brand among Bangkok tech founders.",
      "Direct relationship building — 10 CRM contacts already seeded.",
      "Feeds pipeline for GOMMA's first clients via warm introductions.",
    ],
    roadmap: [
      {
        quarter: "Q4 2025",
        done: true,
        now: false,
        items: ["Project opened", "Initial planning"],
      },
      {
        quarter: "Q1 2026",
        done: true,
        now: false,
        items: ["CRM contacts added", "Event prep"],
      },
      {
        quarter: "Q2 2026",
        done: false,
        now: true,
        items: ["Event delivery", "Follow-up outreach"],
      },
      {
        quarter: "Q3 2026",
        done: false,
        now: false,
        items: ["Network activation from leads"],
      },
    ],
  },
  {
    key: "mon",
    code: "PRJ-25",
    name: "Mon Durian",
    notionId: "3307286d055f80cf91e8d87440c7a7c9",
    kind: "Consumer Product · Nicotine / Wellness",
    location: "Bangkok, TH",
    started: null,
    badges: [
      {
        label: "Not Started",
        tone: "neutral",
      },
      {
        label: "Idea stage",
        tone: "neutral",
      },
      {
        label: "10 tasks scoped",
        tone: "active",
      },
    ],
    signals: [
      {
        title: "Idea stage — not yet activated",
        detail:
          "10 tasks have been scoped but no work has started. Queued behind PAUSA and KNECTD.",
        tone: "neutral",
      },
      {
        title: "Persona and MarCom structure pre-built",
        detail:
          "MON Persona, Content Pillar, and MarCom pages already exist. Setup overhead is low when ready to start.",
        tone: "active",
      },
      {
        title: "Linked to two quarterly cycles",
        detail:
          "Project is tied to Q1 and Q2 2026 quarterly DBs — suggesting planned activation in this period.",
        tone: "info",
      },
    ],
    okrs: [
      {
        title: "Activate project and assign tasks",
        status: "Not started",
        tone: "neutral",
      },
      {
        title: "Define product formulation",
        status: "Not started",
        tone: "neutral",
      },
      {
        title: "Brand and persona defined",
        status: "Not started",
        tone: "neutral",
      },
    ],
    monthly: [
      {
        month: "Q1",
        value: 0,
      },
      {
        month: "Q2",
        value: 0,
      },
      {
        month: "Q3",
        value: 0,
      },
    ],
    strategy:
      "Durian-flavoured nicotine pouch targeting Thai wellness and lifestyle consumers. Pre-built brand architecture awaiting activation.",
    pillars: [
      "Flavour differentiation — durian as a distinctive Thai identity angle.",
      "Wellness framing — nicotine replacement or harm-reduction positioning.",
      "Same brand playbook as PAUSA: persona-first, content-driven launch.",
    ],
    roadmap: [
      {
        quarter: "Q1–Q2 2026",
        done: false,
        now: false,
        items: ["Queued — awaiting activation"],
      },
      {
        quarter: "Q2–Q3 2026",
        done: false,
        now: true,
        items: ["Activate", "Product R&D", "Brand setup"],
      },
      {
        quarter: "Q3 2026",
        done: false,
        now: false,
        items: ["Prototype", "Supplier", "Go-to-market"],
      },
      {
        quarter: "Q4 2026",
        done: false,
        now: false,
        items: ["Launch-ready product"],
      },
    ],
  },
  {
    key: "ai",
    code: "PRJ-21",
    name: "AI Agent Assistant",
    notionId: "3237286d055f80d9bd03ef1a67246fc1",
    kind: "Internal Tool · Productivity Infrastructure",
    location: "Personal",
    started: "Mar 14, 2026",
    badges: [
      {
        label: "In Progress",
        tone: "active",
      },
      {
        label: "Internal tool",
        tone: "neutral",
      },
      {
        label: "High priority",
        tone: "danger",
      },
    ],
    signals: [
      {
        title: "Core concept defined",
        detail:
          "Notion as knowledge base, AI as analyst/prioritiser, n8n for automation triggers. Architecture scoped.",
        tone: "success",
      },
      {
        title: "Voice and real execution not yet built",
        detail:
          "Voice call and real task execution remain unchecked. These are the two unlock milestones.",
        tone: "active",
      },
      {
        title: "Multiple agent roles scoped",
        detail:
          "CFO Lommi, CTO, and personal boundary agent define specialist agent functions.",
        tone: "info",
      },
    ],
    okrs: [
      {
        title: "Core assistant architecture live",
        status: "In flight",
        tone: "active",
      },
      {
        title: "Voice call capability",
        status: "Not started",
        tone: "neutral",
      },
      {
        title: "Real task execution loop",
        status: "Not started",
        tone: "neutral",
      },
    ],
    monthly: [
      {
        month: "Mar",
        value: 0,
      },
      {
        month: "Apr",
        value: 0,
      },
    ],
    strategy:
      "Personal AI assistant using Notion as knowledge base, Claude/AI for analysis and prioritisation, n8n for automation triggers.",
    pillars: [
      "Notion = library and knowledge base (human-curated).",
      "AI = analyst, summariser, and perception expander.",
      "n8n = automation triggers connecting both layers.",
    ],
    roadmap: [
      {
        quarter: "Mar 2026",
        done: true,
        now: false,
        items: ["Concept defined", "Architecture scoped"],
      },
      {
        quarter: "Apr 2026",
        done: false,
        now: true,
        items: ["Build core assistant", "n8n triggers", "Agent roles"],
      },
      {
        quarter: "Q3 2026",
        done: false,
        now: false,
        items: ["Voice capability", "Real execution loop"],
      },
      {
        quarter: "Q4 2026",
        done: false,
        now: false,
        items: ["Full agentic operation"],
      },
    ],
  },
]
