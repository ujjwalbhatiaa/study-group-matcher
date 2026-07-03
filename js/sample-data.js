/* Demo cohort for StudyCircle — 16 fictional students across 3 UAlberta courses.
 * Loaded by the demo UI; also usable from Node for manual testing. */
"use strict";

(function (root, factory) {
  const data = factory();
  if (typeof module !== "undefined" && module.exports) module.exports = data;
  if (typeof window !== "undefined") window.SAMPLE_STUDENTS = data;
})(this, function () {
  // slot = day*4 + block; day 0=Mon..6=Sun; block 0=morning,1=afternoon,2=evening,3=night
  const S = (d, b) => d * 4 + b;

  return [
    // ---------------- CMPUT 175 (Intro to the Foundations of Computation II)
    { id: "u01", name: "Aisha K.", course: "CMPUT 175", topics: ["recursion", "linked lists", "stacks"], availability: [S(1, 2), S(3, 2), S(5, 1)], style: "practice-problems", goal: "ace-the-course", groupSize: 4 },
    { id: "u02", name: "Ben T.", course: "CMPUT 175", topics: ["recursion", "big-o", "queues"], availability: [S(1, 2), S(3, 2), S(0, 0)], style: "discussion", goal: "solid-pass", groupSize: 4 },
    { id: "u03", name: "Chen W.", course: "CMPUT 175", topics: ["linked lists", "testing", "recursion"], availability: [S(1, 2), S(4, 1), S(3, 2)], style: "practice-problems", goal: "ace-the-course", groupSize: 3 },
    { id: "u04", name: "Deepa R.", course: "CMPUT 175", topics: ["big-o", "sorting"], availability: [S(2, 0), S(6, 1)], style: "visual", goal: "homework-help", groupSize: 2 },
    { id: "u05", name: "Ethan M.", course: "CMPUT 175", topics: ["stacks", "queues", "sorting"], availability: [S(1, 2), S(2, 0), S(6, 1)], style: "quiet-co-study", goal: "solid-pass", groupSize: 4 },
    { id: "u06", name: "Fatima S.", course: "CMPUT 175", topics: ["recursion", "sorting"], availability: [S(3, 2), S(1, 2)], style: "discussion", goal: "ace-the-course", groupSize: 5 },

    // ---------------- MATH 125 (Linear Algebra I)
    { id: "u07", name: "Grace L.", course: "MATH 125", topics: ["matrix inverses", "determinants", "proofs"], availability: [S(0, 1), S(2, 1), S(4, 2)], style: "visual", goal: "ace-the-course", groupSize: 3 },
    { id: "u08", name: "Hassan A.", course: "MATH 125", topics: ["eigenvalues", "determinants"], availability: [S(0, 1), S(2, 1)], style: "visual", goal: "solid-pass", groupSize: 3 },
    { id: "u09", name: "Ivy N.", course: "MATH 125", topics: ["proofs", "vector spaces", "determinants"], availability: [S(2, 1), S(0, 1), S(5, 0)], style: "discussion", goal: "ace-the-course", groupSize: 4 },
    { id: "u10", name: "Jake P.", course: "MATH 125", topics: ["matrix inverses", "systems of equations"], availability: [S(6, 3)], style: "practice-problems", goal: "homework-help", groupSize: 2 },
    { id: "u11", name: "Kira D.", course: "MATH 125", topics: ["eigenvalues", "proofs"], availability: [S(0, 1), S(4, 2), S(2, 1)], style: "quiet-co-study", goal: "solid-pass", groupSize: 4 },

    // ---------------- CMPUT 267 (Basics of Machine Learning)
    { id: "u12", name: "Liam O.", course: "CMPUT 267", topics: ["gradient descent", "probability", "numpy"], availability: [S(2, 2), S(4, 0), S(5, 2)], style: "practice-problems", goal: "ace-the-course", groupSize: 4 },
    { id: "u13", name: "Maya G.", course: "CMPUT 267", topics: ["probability", "linear regression"], availability: [S(2, 2), S(5, 2)], style: "discussion", goal: "ace-the-course", groupSize: 3 },
    { id: "u14", name: "Noor H.", course: "CMPUT 267", topics: ["numpy", "gradient descent", "overfitting"], availability: [S(2, 2), S(4, 0)], style: "practice-problems", goal: "solid-pass", groupSize: 4 },
    { id: "u15", name: "Omar B.", course: "CMPUT 267", topics: ["probability", "overfitting"], availability: [S(0, 3), S(6, 0)], style: "visual", goal: "homework-help", groupSize: 3 },
    { id: "u16", name: "Priya V.", course: "CMPUT 267", topics: ["linear regression", "gradient descent"], availability: [S(2, 2), S(5, 2), S(4, 0)], style: "quiet-co-study", goal: "solid-pass", groupSize: 4 },
  ];
});
