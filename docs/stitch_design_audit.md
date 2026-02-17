# Stitch Design Audit — Second Brain Enterprise UI

Visual comparison of the 8 Stitch designs against the current running UI at `localhost:5177`.

---

## 1. Command Center Dashboard (`/dashboard`)

````carousel
![Stitch Design](/home/hanzla/.gemini/antigravity/brain/7c07c8ec-7900-44ed-9225-4aeb3384839e/stitch_designs/1_command_center.png)
<!-- slide -->
![Current UI](/home/hanzla/.gemini/antigravity/brain/7c07c8ec-7900-44ed-9225-4aeb3384839e/dashboard_page_status_1771306029689.png)
````

| Aspect | Stitch Design | Current UI | Status |
|--------|--------------|------------|--------|
| **KPI Cards** | Total Leads, Conv. Rate, Active Calls, Revenue (HTD) | Total Leads, Conv. Rate, Active Calls, Booking Rate | ⚠️ **Revenue card replaced with Booking Rate** |
| **KPI Sparklines** | Sparklines with trend arrows + % change | Same sparklines with trend indicators | ✅ Match |
| **Pipeline Velocity** | Chart with Week/Month/Quarter tabs | Same chart with same tabs | ✅ Match |
| **Recent Activity** | Activity feed with colored dots + timestamps | Same section, shows "No recent activity" (empty state) | ✅ Match (empty data) |
| **Hot Leads** | Table with Lead Name, Company, Est. Value, Heat Score, Action | Not visible (may be below fold) | ⚠️ **Needs scroll verification** |
| **AI Suggestions** | Sidebar with HIGH PRIORITY/INSIGHT cards + action buttons | Not visible (may be below fold) | ⚠️ **Needs scroll verification** |
| **Card Colors** | Dark navy cards with subtle borders | Light/gray cards on dark background | ❌ **Color scheme mismatch — cards are light instead of dark** |

**Key Discrepancies:**
- Card backgrounds are **light gray** in current UI vs **dark navy** in Stitch design
- 4th KPI metric changed from **Revenue (HTD) $1.2M** → **Booking Rate 0%**
- Overall color contrast is lighter; Stitch uses deeper dark mode

---

## 2. Leads CRM & Intelligence (`/leads`)

````carousel
![Stitch Design](/home/hanzla/.gemini/antigravity/brain/7c07c8ec-7900-44ed-9225-4aeb3384839e/stitch_designs/2_leads_crm.png)
<!-- slide -->
![Current UI](/home/hanzla/.gemini/antigravity/brain/7c07c8ec-7900-44ed-9225-4aeb3384839e/leads_page_status_1771306046402.png)
````

| Aspect | Stitch Design | Current UI | Status |
|--------|--------------|------------|--------|
| **Header** | "Leads" with active count badge, Sort dropdown | Shows loading spinner | ⚠️ **Page stuck on loading** |
| **Search & Filters** | Search bar + Status/Industry/Source dropdowns + Clear All | Not visible (loading) | 🔴 Can't compare |
| **Lead Table** | Full table with Name, Company, Status, Source, Deal Heat, Last Contact | Not visible (loading) | 🔴 Can't compare |
| **Lead Detail Flyout** | Right panel with profile, Intelligence/Activity/Notes tabs, Deal Probability, AI analysis, Budget/Timeline, Pain Points, Next Best Action | Not visible (loading) | 🔴 Can't compare |
| **+ Add Lead Button** | Top right, green accent | Not visible (loading) | 🔴 Can't compare |

**Key Discrepancies:**
- Page is **stuck on "Loading module..."** — can't fully compare
- Stitch shows a rich **lead intelligence flyout** with AI probability scoring — need to verify if that component exists in code

---

## 3. Deal Desk Pipeline (`/dealdesk`)

````carousel
![Stitch Design](/home/hanzla/.gemini/antigravity/brain/7c07c8ec-7900-44ed-9225-4aeb3384839e/stitch_designs/3_deal_desk.png)
<!-- slide -->
![Current UI](/home/hanzla/.gemini/antigravity/brain/7c07c8ec-7900-44ed-9225-4aeb3384839e/dealdesk_page_status_1771306064018.png)
````

| Aspect | Stitch Design | Current UI | Status |
|--------|--------------|------------|--------|
| **Header** | Breadcrumb "Second Brain > Pipeline Management", "Deal Desk" title | "Deal Desk" with icon, no breadcrumb | ⚠️ Missing breadcrumb |
| **Tabs** | Pipeline, Closed Won, Analytics, Settings | Pipeline, Proposals (only 2 tabs) | ❌ **Missing: Closed Won, Analytics, Settings tabs** |
| **KPI Cards** | Total Pipeline Value, Deals in Progress, Win Rate, Avg Close Time | Same 4 KPIs | ✅ Match |
| **KPI Icons** | Colored trend icons | Same colored icons | ✅ Match |
| **Kanban Columns** | Critical Intent, High Intent, Medium Intent, Low Intent | Same 4 columns | ✅ Match |
| **Deal Cards** | Cards with deal value, contact, days indicator, stage tags, "Proposal →" links | Shows "No deals" empty state | ✅ Match (empty data) |
| **Kanban/List Toggle** | Kanban/List toggle in header | Present in Stitch design | ⚠️ Not visible in current UI |
| **Card Colors** | Dark navy cards | Light/white cards | ❌ **Color scheme mismatch** |

**Key Discrepancies:**
- Missing **Closed Won**, **Analytics**, and **Settings** tabs (only has Pipeline + Proposals)
- No breadcrumb navigation
- Card colors are light instead of dark navy

---

## 4. AI Calling Center (`/calling`)

````carousel
![Stitch Design](/home/hanzla/.gemini/antigravity/brain/7c07c8ec-7900-44ed-9225-4aeb3384839e/stitch_designs/4_ai_calling.png)
<!-- slide -->
![Current UI](/home/hanzla/.gemini/antigravity/brain/7c07c8ec-7900-44ed-9225-4aeb3384839e/calling_page_status_1771306081456.png)
````

| Aspect | Stitch Design | Current UI | Status |
|--------|--------------|------------|--------|
| **Header** | "AI Calling" with subtitle, breadcrumb | "AI Calling System" with icon | ⚠️ Different title wording |
| **KPI Strip** | Calls Today, Booking Rate, Avg Duration, Active Agents (with Vapi tag + avatars) | Not present — goes straight to tab navigation | ❌ **Missing KPI metric strip** |
| **Tabs** | Not shown (content area fills main view) | Schedule, Overview, Call Logs, Scripts, AI Agents, Batch Calls, Activity, Analytics, Settings | ✅ Richer tab structure in current UI |
| **Recent Calls Table** | Table with Lead, Status, Outcome, Duration, Sentiment, Actions | Not visible on Schedule tab | ⚠️ May be on different tab |
| **Agent Panel** | Right sidebar with Agent Luna live voice, latency/success/queue/cost metrics, script preview, voice settings | Not present on Schedule tab | ❌ **Agent sidebar panel missing from Schedule view** |
| **Calendar View** | Not in Stitch design | Current UI defaults to Schedule tab with full week calendar | ✅ Current UI has extra feature |

**Key Discrepancies:**
- Stitch design shows a **dashboard-style view** with KPIs, Recent Calls table, and Agent sidebar
- Current UI shows a **multi-tab interface** with Schedule as default (which is a full calendar)
- The Stitch design's content may correspond to the **Overview** or **Analytics** tabs
- Missing **KPI metrics strip** (Calls Today, Booking Rate, etc.) on any visible tab
- Missing **Agent live monitoring panel** with voice waveform and real-time statistics

---

## 5. Automation Engine (`/automation`)

````carousel
![Stitch Design](/home/hanzla/.gemini/antigravity/brain/7c07c8ec-7900-44ed-9225-4aeb3384839e/stitch_designs/5_automation.png)
<!-- slide -->
![Current UI](/home/hanzla/.gemini/antigravity/brain/7c07c8ec-7900-44ed-9225-4aeb3384839e/automation_page_status_1771306101517.png)
````

| Aspect | Stitch Design | Current UI | Status |
|--------|--------------|------------|--------|
| **Header** | "Automation Engine ⚡" | "Automation Hub ⚡" | ⚠️ Different title |
| **KPI Cards** | Active Rules (7), Total Executions (342), Success Rate (98.5%) | Leads count, Sent count (top-right badges) | ❌ **Completely different KPI structure** |
| **Content** | Rule-based automation cards (trigger → action) with execution counts + "Create Rule" button | Lead Scraper tab with search input for finding leads | ❌ **Fundamentally different feature** |
| **Tabs** | None (single view with rules list + execution log) | Lead Scraper, Auto-Outreach, History | ❌ **Different tab structure** |
| **Execution Log** | Table with Timestamp, Rule Name, Trigger, Action, Status | No execution log visible | ❌ **Missing execution log** |
| **Create Rule Button** | Green "Create Rule" button + Active Only toggle | Search button instead | ❌ **Missing rule creation** |

**Key Discrepancies:**
- **Completely different module purpose** — Stitch shows an **event-driven automation engine** with rules (trigger → action) while current UI is a **Lead Scraper/Outreach tool**
- The Stitch design has rule-based automation (e.g., "Call Booked → Create Follow-up Task") 
- Current UI focuses on lead scraping and auto-outreach — entirely different functionality
- This is the **biggest gap** in the audit

---

## 6. Calendar & Task Orchestration (`/` — Home/Schedule)

````carousel
![Stitch Design](/home/hanzla/.gemini/antigravity/brain/7c07c8ec-7900-44ed-9225-4aeb3384839e/stitch_designs/6_calendar_tasks.png)
<!-- slide -->
![Current UI](/home/hanzla/.gemini/antigravity/brain/7c07c8ec-7900-44ed-9225-4aeb3384839e/calendar_page_status_1771306120779.png)
````

| Aspect | Stitch Design | Current UI | Status |
|--------|--------------|------------|--------|
| **Header** | "📅 Schedule" with icon | No title (goes straight to controls) | ⚠️ Missing "Schedule" title |
| **View Toggles** | Month, Week, Day | Month, Week, Day | ✅ Match |
| **Navigation** | Today + < > arrows + month/year | Today + < > arrows + month/year | ✅ Match |
| **+ Add Event** | Blue button top-right | Blue button top-right | ✅ Match |
| **Week Calendar Grid** | Full weekly grid with time slots and colored events | Full weekly grid with time slots (empty) | ✅ Match |
| **Today's Agenda** | Right sidebar panel | Right sidebar "Today's Agenda" | ✅ Match |
| **Upcoming Tasks** | Right sidebar with task cards (assignee, priority badges) | Right sidebar "Upcoming Tasks" | ✅ Match |
| **Quick Task Entry** | Bottom input "Add a task quickly..." | Bottom input "Add a task quickly..." | ✅ Match |
| **"+ Suggest Time"** | Dashed boxes for AI time suggestions | Same dashed "+ Suggest Time" boxes | ✅ Match |
| **Event Colors** | Purple, teal, green, yellow events | No events present (empty state) | ✅ Match (empty data) |

**Key Discrepancies:**
- Minor: Missing "📅 Schedule" title/header text — current UI goes straight to controls
- Overall **very close match** — this is the best-implemented screen

---

## 7. Neural Brain Intelligence (`/brain`) — Variant 1

````carousel
![Stitch Design](/home/hanzla/.gemini/antigravity/brain/7c07c8ec-7900-44ed-9225-4aeb3384839e/stitch_designs/7_neural_brain.png)
<!-- slide -->
![Current UI](/home/hanzla/.gemini/antigravity/brain/7c07c8ec-7900-44ed-9225-4aeb3384839e/brain_page_status_1771306142008.png)
````

| Aspect | Stitch Design | Current UI | Status |
|--------|--------------|------------|--------|
| **Header** | "🧠 Neural Brain" with GET STARTED badge | No Neural Brain title header | ⚠️ Missing branded header |
| **Subtitle** | "Intelligence Overview" + "Real-time AI analysis of your pipeline signals." | Same subtitle text | ✅ Match |
| **Date Filter** | "Last 7 Days" dropdown | "Last 7 Days" dropdown | ✅ Match |
| **Sync Data** | Blue "Sync Data" button | Blue "Sync Data" button | ✅ Match |
| **KPI Cards** | Leads Analyzed (34), Avg Deal Heat (67%), Hot Leads (8), AI Actions Generated (23) | Same 4 KPIs (all 0 — empty) | ✅ Match |
| **Buying Intent Distribution** | Bar chart with Decision/Consideration/Awareness + legend | Same chart (empty 0%) | ✅ Match |
| **AI Suggestions** | Cards with HIGH/MED/LOW PRIORITY, action buttons (Send, Mark Urgent, Auto-Update) | Same section, "No suggestions yet" empty state | ✅ Match |
| **Hot Leads Leaderboard** | Table below fold with Company, Contact, Deal Size, Heat Score, Action | Not visible (below fold) | ⚠️ Need to scroll |
| **Card Colors** | Dark navy cards with subtle purple/orange accents | Light/gray cards | ❌ **Color scheme mismatch** |

**Key Discrepancies:**
- Missing "🧠 Neural Brain" branded header badge
- Card backgrounds are light instead of dark navy
- Below-fold content needs scroll verification

---

## 8. Neural Brain Intelligence — Variant 2

![Stitch Design v2](/home/hanzla/.gemini/antigravity/brain/7c07c8ec-7900-44ed-9225-4aeb3384839e/stitch_designs/8_neural_brain_v2.png)

This is an **alternative design** for the Neural Brain page with a more detailed, information-dense layout:

| Feature | Variant 2 Design | Current UI | Status |
|---------|-----------------|------------|--------|
| **AI Intelligence Score** | 92.4 with gauge | Not present | ❌ Not implemented |
| **Insights Generated** | 1,842 count | Not present | ❌ Not implemented |
| **Data Sources Connected** | Salesforce CRM, Google Analytics, Zendesk API | Not present | ❌ Not implemented |
| **Automation Suggestions** | 14 count | Not present | ❌ Not implemented |
| **Intelligence Feed** | Priority-sorted feed with HIGH/MED/LOW cards + action buttons (Dismiss, Apply AI Fix, Details, Execute Campaign, View Report) | Not present | ❌ Not implemented |
| **Quick Intelligence Actions** | Analyze Leads, Optimize Schedule, Graph Connectivity, Cleanse Dataset | Not present | ❌ Not implemented |
| **Recent Analyses** | Neural Scan, Prediction Model, External API Sync | Not present | ❌ Not implemented |
| **Trend Analysis** | Performance bar charts (Lead Scoring, Pipeline Velocity, Automation Accuracy) | Not present | ❌ Not implemented |

**Status:** This variant is **entirely unimplemented** — the current UI follows Variant 1's structure instead.

---

## Overall Audit Summary

| Module | Match Level | Critical Gaps |
|--------|-------------|---------------|
| **Calendar** | 🟢 **95%** | Missing title header only |
| **Dashboard** | 🟡 **75%** | Card colors light vs dark, Revenue → Booking Rate |
| **Deal Desk** | 🟡 **70%** | Missing 3 tabs (Closed Won, Analytics, Settings) |
| **Neural Brain v1** | 🟡 **70%** | Card colors, missing branded header |
| **AI Calling** | 🟠 **50%** | Missing KPI strip, Agent panel; has extra tabs instead |
| **Leads** | 🔴 **???** | Page stuck loading — can't evaluate |
| **Automation** | 🔴 **15%** | Completely different feature (Lead Scraper vs Automation Engine) |
| **Neural Brain v2** | 🔴 **0%** | Not implemented at all |

### Priority Action Items

1. **🔴 CRITICAL: Automation Engine** — Current "Automation Hub" is a Lead Scraper, not the event-driven rule engine from the Stitch design. This needs a complete rethink or a decision on which direction to go.
2. **🔴 CRITICAL: Leads Page** — Stuck on "Loading module..." — needs debugging before further comparison
3. **🟠 HIGH: AI Calling** — Missing KPI dashboard metrics strip and Agent monitoring sidebar
4. **🟡 MEDIUM: Global Card Styling** — All pages use light/gray card backgrounds instead of the dark navy design from Stitch
5. **🟡 MEDIUM: Deal Desk Tabs** — Missing Closed Won, Analytics, and Settings tabs
6. **🟡 MEDIUM: Neural Brain Header** — Missing branded "🧠 Neural Brain" header element
7. **🟢 LOW: Dashboard KPI** — Revenue (HTD) → Booking Rate is likely intentional
8. **⚪ DEFERRED: Neural Brain v2** — Alternative design, not prioritized unless desired
