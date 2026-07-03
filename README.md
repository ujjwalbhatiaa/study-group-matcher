# StudyCircle — study-group matcher for university students

Find the study partners you'd actually want to study with. StudyCircle matches
students in the same course by **when they're free**, **what they're studying**,
**how they like to study**, and **what they're aiming for** — then assembles
cohesive study groups automatically and explains every match in plain English.

Built with **vanilla JavaScript** — no frameworks, no build step, no backend.
The matching engine is a pure, fully unit-tested module that runs identically
in the browser and in Node.

## Why

Most students find study groups through luck: a Discord ping, a hallway
conversation, whoever sits nearby. Course Discords have hundreds of members but
no way to find the three people who are also free Tuesday evenings, also stuck
on recursion, and also want to practice problems rather than talk theory.
StudyCircle turns that search into an algorithm.

## How matching works

Every pair of students in the same course gets a **compatibility score (0–100)**:

| Dimension | Weight | Method |
|---|---|---|
| Availability overlap | 40% | Shared slots on a 7-day × 4-block time grid, saturating at 4 (one solid meeting time matters more than ten) |
| Topic overlap | 30% | Jaccard similarity of topic sets, case-insensitive |
| Study-style fit | 15% | Affinity matrix — e.g. *discussion* pairs well with *practice-problems* (0.8) but poorly with *quiet co-study* (0.3) |
| Goal alignment | 15% | Same goal = 1.0; *ace-the-course* vs *homework-help* = 0.3 |

Two hard vetoes: different courses, and zero shared availability (a 100%
topic match is useless if you can never meet).

**Group formation** is greedy max-min: seed with the highest-scoring unmatched
pair, then repeatedly add the student whose *minimum* pairwise score against
all current members is highest (and above threshold), until the group reaches
the smallest preferred size among its members. Optimizing the minimum — not
the average — keeps groups cohesive: nobody gets added who's a bad fit for
even one member. Each group reports the times when the *entire* group is free.

Every match comes with human-readable reasons:
> *You're both free Tue evening, Thu evening · Shared topics: recursion ·
> Same goal (ace the course)*

## Try the demo

Open `index.html` in a browser (or serve the folder with any static server).
Create a profile — name, course, topics, a tap-to-toggle weekly availability
grid, study style, and goal — and get ranked match cards with plain-English
reasons. The **Cohort groups** tab runs the group-formation algorithm over a
whole course. Profiles you create are stored in `localStorage` only; the
16-student cohort is seeded demo data.

## Run the tests

```bash
node test/test_matcher.js
```

18 tests cover the slot grid, every score component, hard vetoes, symmetry,
ranking, group disjointness, size caps, determinism, and whole-group
availability. The UI is additionally covered by a jsdom smoke test exercising
the grid, form validation, match rendering, persistence, and group view.

## Project structure

```
index.html           # interactive demo UI
css/style.css        # mobile-first styles, no framework
js/matcher.js        # the matching engine (pure functions, browser + Node)
js/sample-data.js    # 16-student demo cohort across 3 courses
js/app.js            # UI controller (form, availability grid, cards, groups)
test/test_matcher.js # unit tests (plain Node asserts, no dependencies)
```

## Roadmap

- [x] Matching engine + tests
- [x] Interactive demo UI (profile form, availability grid picker, match cards, group view)
- [ ] Deploy demo to GitHub Pages
- [ ] Shareable group "meeting card" export

## License

MIT
