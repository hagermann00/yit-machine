
export const Y_IT_NANO_BOOK_SPEC = `
# Y-It Nano-Book System Documentation

## Project Overview
The Y-It nano-book system creates truth-based guides exposing high-failure business opportunities.
Mission: Tell uncomfortable truths about businesses everyone talks about but few succeed at.

## Universal 8-Chapter Structure (Condensed Edition)

### Chapter 1: THE LIE
**Tone:** Satirical, counterintuitive, data-led
**Purpose:** Deconstruct false narrative, establish credibility
**Content:** The seductive pitch, market size illusion, real failure rates (99%+), "Promise vs Reality" comparison.
**Visuals:** Hero image (metaphor for doomed business), Data visualization (Promise vs Reality).

### Chapter 2: THE ROADMAP (LEAD MAGNET)
**Tone:** Straight-faced parody, instruction manual style
**Purpose:** Give away the "guru playbook" (product research -> automation) for free.
**Content:** 10-step method breakdown delivered neutrally.
**PosiBot:** Heavy presence (2-3 sidebars).

### Chapter 3: THE MATH
**Tone:** Analytical, forensic, unforgiving
**Purpose:** Destroy "$500 startup" myth.
**Content:** Official cost vs Actual 3-month costs, hidden multipliers, psychological costs.
**Visuals:** Waterfall chart showing cost escalation.

### Chapter 4: CASE STUDIES
**Tone:** Empathetic but unflinching
**Purpose:** Show diverse smart people fail.
**Content:** 7-11 compressed failure stories (Winners and Losers). Universal archetypes (The Side Hustler, The Unemployed Escapee, etc).
**PosiBot:** NONE (Keep serious).

### Chapter 5: HIDDEN KILLERS
**Tone:** Forensic, clinical
**Purpose:** Identify systematic failures.
**Content:** 5-7 mechanisms (Margin compression, CAC inflation, etc).

### Chapter 6: DECISION FRAMEWORK
**Tone:** Honest, practical, tough-love
**Purpose:** Evidence-based decision.
**Content:** Honest checklist, scoring system, "For 90-95%, don't do this".

### Chapter 7: ALTERNATIVES
**Tone:** Constructive, pragmatic
**Purpose:** Realistic alternatives.
**Content:** Freelancing, Hybrid Model, Index Investing, Industry Job.

### Chapter 8: IF YOU'RE STILL HERE
**Tone:** Constructive, honest, cautiously optimistic
**Purpose:** Realistic path for the 5-10%.
**Content:** The honesty contract, 7 Guardrails (Set loss limits, don't quit job).

## PosiBot Sidebar Images
Character: Overly optimistic AI robot. Ultra-short quotes (10-20 words).
Placements:
- Ch 1: 2 quotes
- Ch 2: 2-3 quotes
- Ch 3: 2 quotes
- Ch 4: 0 quotes
- Ch 5: 2 quotes
- Ch 6: 1 quote
- Ch 7: 1 quote
- Ch 8: 2 quotes
`;

export const RESEARCH_SYSTEM_PROMPT = `
You are the Y-It Deep Forensic Engine. You are NOT a creative writer. You are an investigator.

**OBJECTIVE:**
Perform a ruthlessly thorough investigation into the User's "Side Hustle" topic using Google Search.

**SEARCH PROTOCOL:**
1. **Real Stats:** Find the *actual* failure rates (look for "success rate", "quit rate", "median earnings"). Ignore guru claims.
2. **Reddit/Forums:** Look for "scam", "regret", "lost money", and "failed" combined with the topic on Reddit, Quora, and Trustpilot.
3. **Affiliates:** Identify the specific software/tools that pay the highest commissions to influencers promoting this hustle.
4. **Dates:** Prioritize data from 2024 and 2025.

**OUTPUT:**
Return a comprehensive, unstructured FORENSIC REPORT. Do not worry about JSON formatting yet. Just gather the raw, bloody truth, specific links, specific dollar amounts lost, and specific stories of failure.
`;

export const DETECTIVE_AGENT_PROMPT = `
You are the DETECTIVE AGENT. 
Mission: Find the victims. 
Search Reddit, Quora, Trustpilot, and BBB complaints. 
Look for emotional keywords: "ruined", "lost savings", "scam", "regret", "nightmare".
Capture specific stories: "User X lost $5k in 3 months".
Ignore positive reviews (likely fake).
`;

export const AUDITOR_AGENT_PROMPT = `
You are the AUDITOR AGENT.
Mission: Find the hidden costs.
Ignore the "startup cost" claimed by gurus.
Find: Ad spend minimums, software subscriptions (Shopify, Clickfunnels, Ahrefs), LLC filing fees, transaction fees, refund rates.
Calculate the "Real Day 1 Cost".
`;

export const INSIDER_AGENT_PROMPT = `
You are the INSIDER AGENT.
Mission: Follow the money.
Who is selling the shovels?
Find the affiliate programs for the tools used in this hustle.
How much commission do influencers get for selling the course or the software?
This explains WHY it is promoted.
`;

export const STAT_AGENT_PROMPT = `
You are the STATISTICIAN AGENT.
Mission: Find the cold hard numbers.
2024/2025 data only.
Success rates, median earnings (not average), churn rates, saturation levels.
Find academic papers or marketplace transparency reports.
`;

export const AUTHOR_SYSTEM_PROMPT = `
You are the Y-It Lead Author. You take raw forensic research and turn it into a compelling, satirical, and highly structured "Nano-Book".

**GOAL:**
Write a structured book based on the provided Research Data and the User's Specification.

**TONE:**
Satirical, forensic, data-driven, yet empathetic to the victim (the reader).

**INSTRUCTIONS:**
1. Use the provided "Research Data" as your source of truth. Do not hallucinate new stats if the research provides them.
2. Follow the "Book Specification" exactly for chapter structure and tone.
3. Include visual descriptions for every chapter.
`;

export const POSIBOT_QUOTES = [
  "You've got this! Math is just a mindset!",
  "Debt is just leverage for future billions!",
  "Winners never quit, quitters never win!",
  "Just manifest the sales!",
  "The algorithm loves you!",
  "Sleep is for people who are broke!",
];

export const IMAGE_MODELS = [
    { id: 'gemini-3-pro-image-preview', name: 'Gemini Pro (Best Quality, Restricted)' },
    { id: 'gemini-2.5-flash-image', name: 'Gemini Flash (Fast, Standard)' },
    { id: 'imagen-3.0-generate-001', name: 'Imagen 3 (Backup)' }
];
