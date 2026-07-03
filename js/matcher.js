/* ============================================================================
 * StudyCircle — matching engine
 * ----------------------------------------------------------------------------
 * Pure, dependency-free functions that score compatibility between students
 * and assemble study groups. Works in the browser (window.Matcher) and in
 * Node (module.exports) so the same code is unit-tested with `node test/`.
 *
 * Model
 * -----
 * A student is a plain object:
 *   {
 *     id:           string  — unique
 *     name:         string
 *     course:       string  — e.g. "CMPUT 175" (groups never cross courses)
 *     topics:       string[] — topics they want help with / can help on
 *     availability: number[] — time-slot indices (see SLOT GRID below)
 *     style:        one of STYLES
 *     goal:         one of GOALS
 *     groupSize:    number  — preferred max group size (2–5)
 *   }
 *
 * SLOT GRID: 7 days × 4 blocks = 28 slots. slot = day*4 + block
 *   day:   0=Mon … 6=Sun
 *   block: 0=Morning (8–12), 1=Afternoon (12–5), 2=Evening (5–9), 3=Night (9–12)
 * ========================================================================== */

"use strict";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const BLOCKS = ["morning", "afternoon", "evening", "night"];
const STYLES = ["discussion", "practice-problems", "visual", "quiet-co-study"];
const GOALS = ["ace-the-course", "solid-pass", "homework-help"];

/** Weights of each compatibility dimension (sum to 1). */
const WEIGHTS = {
  availability: 0.4,
  topics: 0.3,
  style: 0.15,
  goal: 0.15,
};

/** Minimum pairwise score (0–100) for two students to be grouped together. */
const GROUP_THRESHOLD = 40;

/* ------------------------------------------------------------- slot helpers */

/** (day 0–6, block 0–3) -> slot index 0–27 */
function slotIndex(day, block) {
  if (day < 0 || day > 6 || block < 0 || block > 3) {
    throw new RangeError(`invalid day/block: ${day}/${block}`);
  }
  return day * 4 + block;
}

/** slot index -> "Tue evening" */
function slotLabel(slot) {
  if (slot < 0 || slot > 27) throw new RangeError(`invalid slot: ${slot}`);
  return `${DAYS[Math.floor(slot / 4)]} ${BLOCKS[slot % 4]}`;
}

/** Shared availability slots of two students (sorted, deduped). */
function sharedSlots(a, b) {
  const setB = new Set(b.availability);
  return [...new Set(a.availability)].filter((s) => setB.has(s)).sort((x, y) => x - y);
}

/* --------------------------------------------------------- score components */

/**
 * Availability component, 0–1. Zero shared slots means the pair can never
 * meet, which the caller treats as a hard veto. Saturates at 4 shared slots —
 * beyond one solid meeting time per half-week, more overlap barely matters.
 */
function availabilityScore(a, b) {
  return Math.min(sharedSlots(a, b).length, 4) / 4;
}

/** Jaccard similarity of topic sets, 0–1. Neutral 0.5 if either is empty. */
function topicScore(a, b) {
  const A = new Set((a.topics || []).map((t) => t.trim().toLowerCase()));
  const B = new Set((b.topics || []).map((t) => t.trim().toLowerCase()));
  if (A.size === 0 || B.size === 0) return 0.5;
  let inter = 0;
  for (const t of A) if (B.has(t)) inter++;
  return inter / (A.size + B.size - inter);
}

/**
 * Learning-style compatibility, 0–1. Same style is ideal; some different
 * styles still work well together (discussion + practice), others less so
 * (quiet co-study + discussion).
 */
const STYLE_AFFINITY = {
  "discussion|practice-problems": 0.8,
  "discussion|visual": 0.7,
  "practice-problems|visual": 0.7,
  "practice-problems|quiet-co-study": 0.6,
  "visual|quiet-co-study": 0.6,
  "discussion|quiet-co-study": 0.3,
};

function styleScore(a, b) {
  if (a.style === b.style) return 1;
  const key = [a.style, b.style].sort().join("|");
  return STYLE_AFFINITY[key] ?? 0.5;
}

/** Goal alignment, 0–1. */
function goalScore(a, b) {
  if (a.goal === b.goal) return 1;
  // "ace" and "homework-help" are the most mismatched pairing.
  const pair = new Set([a.goal, b.goal]);
  if (pair.has("ace-the-course") && pair.has("homework-help")) return 0.3;
  return 0.6;
}

/* ------------------------------------------------------------ pair scoring */

/**
 * Overall compatibility of two students, 0–100.
 * Different course, or no shared availability -> 0 (hard veto).
 */
function pairScore(a, b) {
  if (a.course !== b.course) return 0;
  const avail = availabilityScore(a, b);
  if (avail === 0) return 0;
  const raw =
    WEIGHTS.availability * avail +
    WEIGHTS.topics * topicScore(a, b) +
    WEIGHTS.style * styleScore(a, b) +
    WEIGHTS.goal * goalScore(a, b);
  return Math.round(raw * 100);
}

/** Human-readable reasons why a and b match (used in the UI). */
function explainMatch(a, b) {
  const reasons = [];
  const slots = sharedSlots(a, b);
  if (slots.length > 0) {
    const labels = slots.slice(0, 3).map(slotLabel);
    reasons.push(
      `You're both free ${labels.join(", ")}${slots.length > 3 ? ` (+${slots.length - 3} more)` : ""}`
    );
  }
  const A = new Set((a.topics || []).map((t) => t.trim().toLowerCase()));
  const common = [...new Set((b.topics || []).map((t) => t.trim().toLowerCase()))].filter((t) =>
    A.has(t)
  );
  if (common.length > 0) reasons.push(`Shared topics: ${common.join(", ")}`);
  if (a.style === b.style) reasons.push(`Same study style (${a.style.replace(/-/g, " ")})`);
  if (a.goal === b.goal) reasons.push(`Same goal (${a.goal.replace(/-/g, " ")})`);
  return reasons;
}

/**
 * Rank everyone in `pool` (same course, id ≠ student.id) against `student`.
 * Returns [{student, score, reasons}] sorted by score desc, zero-scores dropped.
 */
function matchStudent(student, pool) {
  return pool
    .filter((p) => p.id !== student.id)
    .map((p) => ({ student: p, score: pairScore(student, p), reasons: explainMatch(student, p) }))
    .filter((m) => m.score > 0)
    .sort((x, y) => y.score - x.score || String(x.student.id).localeCompare(String(y.student.id)));
}

/* ---------------------------------------------------------- group formation */

/**
 * Greedy group formation for one course cohort.
 *
 * Repeatedly: seed a group with the highest-scoring unmatched pair, then grow
 * it by adding the unmatched student whose MINIMUM pairwise score with all
 * current members is highest (and ≥ threshold), until the group reaches the
 * smallest preferred size among its members (capped 2–5). Students left over
 * are returned in `unmatched`.
 *
 * Greedy max-min keeps groups cohesive (no member is a bad fit for anyone)
 * and runs in O(n³) worst case — fine for class-sized cohorts.
 *
 * Returns { groups: [{members, score, slots}], unmatched: [student] }.
 * `score` is the average pairwise score inside the group; `slots` are labels
 * of times when the WHOLE group is free.
 */
function formGroups(cohort, threshold = GROUP_THRESHOLD) {
  const students = [...cohort];
  const score = new Map(); // "idA|idB" sorted -> pairScore
  const key = (a, b) => [a.id, b.id].sort().join("|");
  for (let i = 0; i < students.length; i++) {
    for (let j = i + 1; j < students.length; j++) {
      score.set(key(students[i], students[j]), pairScore(students[i], students[j]));
    }
  }
  const s = (a, b) => score.get(key(a, b)) ?? 0;

  const unmatched = new Set(students);
  const groups = [];

  for (;;) {
    // 1. best remaining pair as seed
    let best = null;
    for (const a of unmatched) {
      for (const b of unmatched) {
        if (a.id >= b.id) continue;
        const sc = s(a, b);
        if (sc >= threshold && (!best || sc > best.sc)) best = { a, b, sc };
      }
    }
    if (!best) break;

    const members = [best.a, best.b];
    unmatched.delete(best.a);
    unmatched.delete(best.b);

    // 2. grow: add student maximizing the min score to all members
    const targetSize = () => Math.max(2, Math.min(5, Math.min(...members.map((m) => m.groupSize || 4))));
    while (members.length < targetSize()) {
      let cand = null;
      for (const p of unmatched) {
        const minScore = Math.min(...members.map((m) => s(m, p)));
        if (minScore >= threshold && (!cand || minScore > cand.minScore)) {
          cand = { p, minScore };
        }
      }
      if (!cand) break;
      members.push(cand.p);
      unmatched.delete(cand.p);
    }

    // 3. group stats
    let total = 0;
    let pairs = 0;
    for (let i = 0; i < members.length; i++) {
      for (let j = i + 1; j < members.length; j++) {
        total += s(members[i], members[j]);
        pairs++;
      }
    }
    const common = members
      .map((m) => new Set(m.availability))
      .reduce((acc, set) => acc.filter((x) => set.has(x)), [...Array(28).keys()]);

    groups.push({
      members,
      score: Math.round(total / pairs),
      slots: common.map(slotLabel),
    });
  }

  return { groups, unmatched: [...unmatched] };
}

/* ------------------------------------------------------------------ exports */

const Matcher = {
  DAYS,
  BLOCKS,
  STYLES,
  GOALS,
  WEIGHTS,
  GROUP_THRESHOLD,
  slotIndex,
  slotLabel,
  sharedSlots,
  availabilityScore,
  topicScore,
  styleScore,
  goalScore,
  pairScore,
  explainMatch,
  matchStudent,
  formGroups,
};

if (typeof module !== "undefined" && module.exports) module.exports = Matcher;
if (typeof window !== "undefined") window.Matcher = Matcher;
