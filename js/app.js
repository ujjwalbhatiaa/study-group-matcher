/* StudyCircle — demo UI controller.
 * Wires the profile form, availability grid, match cards, and group view to
 * the matching engine (js/matcher.js). User-created profiles persist in
 * localStorage; the seeded demo cohort comes from js/sample-data.js. */

"use strict";

(function () {
  const M = window.Matcher;
  const LS_KEY = "studycircle.profiles.v1";
  const LS_ME = "studycircle.me.v1";

  /* ------------------------------------------------------------ state */

  function loadUserProfiles() {
    try {
      const raw = localStorage.getItem(LS_KEY);
      const arr = raw ? JSON.parse(raw) : [];
      return Array.isArray(arr) ? arr : [];
    } catch {
      return [];
    }
  }

  function saveUserProfiles(profiles) {
    localStorage.setItem(LS_KEY, JSON.stringify(profiles));
  }

  /** Demo cohort + everything created in this browser. */
  function allStudents() {
    return [...window.SAMPLE_STUDENTS, ...loadUserProfiles()];
  }

  function allCourses() {
    return [...new Set(allStudents().map((s) => s.course))].sort();
  }

  /* ------------------------------------------------------------ dom helpers */

  const $ = (sel) => document.querySelector(sel);

  function el(tag, attrs = {}, children = []) {
    const node = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs)) {
      if (k === "class") node.className = v;
      else if (k === "text") node.textContent = v;
      else node.setAttribute(k, v);
    }
    for (const c of children) node.appendChild(c);
    return node;
  }

  function fillSelect(select, values, labels) {
    select.innerHTML = "";
    values.forEach((v, i) => {
      select.appendChild(el("option", { value: v, text: labels ? labels[i] : v }));
    });
  }

  const pretty = (s) => s.replace(/-/g, " ");

  /* ------------------------------------------------------------ tabs */

  document.querySelectorAll(".tab").forEach((btn) => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".tab").forEach((b) => {
        b.classList.toggle("active", b === btn);
        b.setAttribute("aria-selected", b === btn ? "true" : "false");
      });
      document.querySelectorAll(".tab-panel").forEach((p) => {
        p.classList.toggle("active", p.id === "tab-" + btn.dataset.tab);
      });
    });
  });

  /* ------------------------------------------------------------ availability grid */

  const grid = $("#availability-grid");
  const selectedSlots = new Set();

  function buildGrid() {
    grid.innerHTML = "";
    grid.appendChild(el("div", { class: "corner" }));
    M.DAYS.forEach((d) => grid.appendChild(el("div", { class: "day-h", text: d })));
    const blockLabels = ["Morning", "Afternoon", "Evening", "Night"];
    for (let b = 0; b < 4; b++) {
      grid.appendChild(el("div", { class: "block-h", text: blockLabels[b] }));
      for (let d = 0; d < 7; d++) {
        const slot = M.slotIndex(d, b);
        const cell = el("button", {
          class: "avail-cell",
          type: "button",
          "data-slot": String(slot),
          "aria-label": `${M.DAYS[d]} ${blockLabels[b]}`,
          "aria-pressed": "false",
        });
        cell.addEventListener("click", () => {
          if (selectedSlots.has(slot)) selectedSlots.delete(slot);
          else selectedSlots.add(slot);
          cell.classList.toggle("on", selectedSlots.has(slot));
          cell.setAttribute("aria-pressed", selectedSlots.has(slot) ? "true" : "false");
        });
        grid.appendChild(cell);
      }
    }
  }

  function setGridFromSlots(slots) {
    selectedSlots.clear();
    slots.forEach((s) => selectedSlots.add(s));
    grid.querySelectorAll(".avail-cell").forEach((cell) => {
      const on = selectedSlots.has(Number(cell.dataset.slot));
      cell.classList.toggle("on", on);
      cell.setAttribute("aria-pressed", on ? "true" : "false");
    });
  }

  /* ------------------------------------------------------------ form setup */

  function refreshCourseSelects() {
    const courses = allCourses();
    fillSelect($("#f-course"), courses);
    fillSelect($("#g-course"), courses);
  }

  function setupForm() {
    fillSelect($("#f-style"), M.STYLES, M.STYLES.map(pretty));
    fillSelect($("#f-goal"), M.GOALS, M.GOALS.map(pretty));
    refreshCourseSelects();

    // restore "me" if saved
    try {
      const me = JSON.parse(localStorage.getItem(LS_ME) || "null");
      if (me) {
        $("#f-name").value = me.name || "";
        if (allCourses().includes(me.course)) $("#f-course").value = me.course;
        $("#f-topics").value = (me.topics || []).join(", ");
        $("#f-style").value = me.style;
        $("#f-goal").value = me.goal;
        $("#f-size").value = String(me.groupSize || 4);
        setGridFromSlots(me.availability || []);
      }
    } catch { /* ignore corrupt state */ }
  }

  /* ------------------------------------------------------------ matching */

  function readProfileFromForm() {
    const name = $("#f-name").value.trim();
    const custom = $("#f-course-custom").value.trim();
    const course = (custom || $("#f-course").value || "").toUpperCase();
    const topics = $("#f-topics").value
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
    return {
      id: "me",
      name,
      course,
      topics,
      availability: [...selectedSlots].sort((a, b) => a - b),
      style: $("#f-style").value,
      goal: $("#f-goal").value,
      groupSize: Number($("#f-size").value),
    };
  }

  function renderMatches(me, matches) {
    const box = $("#match-results");
    box.innerHTML = "";
    $("#match-empty").hidden = true;

    if (matches.length === 0) {
      box.appendChild(
        el("p", {
          class: "muted",
          text: `No compatible students found in ${me.course} yet — nobody shares any of your free slots. Try adding more availability, or check back after more people join.`,
        })
      );
      return;
    }

    matches.slice(0, 8).forEach(({ student, score, reasons }) => {
      const badge = el("div", { class: "score-badge", style: `--pct:${score}` }, [
        el("span", { text: String(score) }),
      ]);
      const info = el("div", {}, [
        el("h3", { text: student.name }),
        el("div", {
          class: "meta",
          text: `${pretty(student.style)} · ${pretty(student.goal)} · prefers groups of ${student.groupSize}`,
        }),
        el("ul", { class: "reasons" }, reasons.map((r) => el("li", { text: r }))),
      ]);
      box.appendChild(el("div", { class: "match-card" }, [badge, info]));
    });
  }

  $("#profile-form").addEventListener("submit", (e) => {
    e.preventDefault();
    const err = $("#form-error");
    err.hidden = true;

    const me = readProfileFromForm();
    if (!me.name) return showErr("Please enter your name.");
    if (!me.course) return showErr("Please pick or type a course.");
    if (me.availability.length === 0)
      return showErr("Pick at least one availability slot — matches need a time to meet.");

    // persist: "me" for restore + a copy in the shared pool so groups include you
    localStorage.setItem(LS_ME, JSON.stringify(me));
    const pool = loadUserProfiles().filter((p) => p.id !== "me");
    pool.push(me);
    saveUserProfiles(pool);
    refreshCourseSelects();
    $("#g-course").value = me.course;

    renderMatches(me, M.matchStudent(me, allStudents()));

    function showErr(msg) {
      err.textContent = msg;
      err.hidden = false;
    }
  });

  /* ------------------------------------------------------------ groups */

  function renderGroups(course) {
    const box = $("#group-results");
    box.innerHTML = "";
    const cohort = allStudents().filter((s) => s.course === course);
    const { groups, unmatched } = M.formGroups(cohort);

    if (groups.length === 0) {
      box.appendChild(el("p", { class: "muted", text: "No groups could be formed — not enough compatible students." }));
      return;
    }

    groups.forEach((g, i) => {
      const members = el(
        "div",
        { class: "members" },
        g.members.map((m) =>
          el("span", { class: "chip" + (m.id === "me" ? " you" : ""), text: m.id === "me" ? `${m.name} (you)` : m.name })
        )
      );
      const slots = el("p", { class: "slots" });
      slots.innerHTML =
        g.slots.length > 0
          ? `Whole group free: <strong>${g.slots.join(", ")}</strong>`
          : "No single slot fits everyone — pairs overlap instead.";
      box.appendChild(
        el("div", { class: "group-card" }, [
          el("h3", { text: `Group ${i + 1} — avg compatibility ${g.score}` }),
          members,
          slots,
        ])
      );
    });

    if (unmatched.length > 0) {
      box.appendChild(
        el("p", {
          class: "muted",
          text: `Not yet grouped: ${unmatched.map((u) => u.name).join(", ")} (no pairing reached the compatibility threshold).`,
        })
      );
    }
  }

  $("#g-form").addEventListener("click", () => renderGroups($("#g-course").value));

  /* ------------------------------------------------------------ reset */

  $("#reset-demo").addEventListener("click", () => {
    localStorage.removeItem(LS_KEY);
    localStorage.removeItem(LS_ME);
    location.reload();
  });

  /* ------------------------------------------------------------ init */

  buildGrid();
  setupForm();
})();
