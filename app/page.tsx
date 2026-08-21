"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type Skill = "Writing" | "Speaking" | "Listening" | "Reading";
type WritingTask = "Task 1" | "Task 2";
type ResultFilter = "All" | Skill | WritingTask;
type ChartSeries = Exclude<Skill, "Writing"> | "Writing Task 1" | "Writing Task 2";
type PracticeEntry = {
  id: string;
  skill: Skill;
  attempt: number;
  title: string;
  score: number;
  notes: string;
  writingTask?: WritingTask;
};

const storageKey = "ielts-score-tracker.practice-entries";
const seedKey = "ielts-score-tracker.initial-scores-seeded";
const scores = Array.from({ length: 19 }, (_, index) => index / 2);
const skills: Skill[] = ["Writing", "Speaking", "Listening", "Reading"];
const colors: Record<ChartSeries, string> = {
  "Writing Task 1": "#22d3ee",
  "Writing Task 2": "#c084fc",
  Speaking: "#f472b6",
  Listening: "#38bdf8",
  Reading: "#a3e635",
};
const filters: { id: ResultFilter; label: string }[] = [
  { id: "All", label: "All results" },
  { id: "Task 1", label: "Writing · Task 1" },
  { id: "Task 2", label: "Writing · Task 2" },
  { id: "Speaking", label: "Speaking" },
  { id: "Listening", label: "Listening" },
  { id: "Reading", label: "Reading" },
];
const taskOneTitles = new Set([
  "Graph essay",
  "Bar chart essay",
  "Pie chart essay",
  "Maps essay",
]);
const emptyForm = (): Omit<PracticeEntry, "id"> => ({
  skill: "Writing",
  attempt: 1,
  title: "",
  score: 0,
  notes: "",
  writingTask: "Task 1",
});
const initialEntries: PracticeEntry[] = [
  { id: "seed-listening-1", skill: "Listening", attempt: 1, title: "Listening practice", score: 8, notes: "" },
  { id: "seed-listening-2", skill: "Listening", attempt: 2, title: "Listening practice", score: 8.5, notes: "" },
  { id: "seed-listening-3", skill: "Listening", attempt: 3, title: "Listening practice", score: 8.5, notes: "" },
  { id: "seed-reading-1", skill: "Reading", attempt: 1, title: "Reading practice", score: 8.5, notes: "" },
  { id: "seed-reading-2", skill: "Reading", attempt: 2, title: "Reading practice", score: 8.5, notes: "" },
  { id: "seed-reading-3", skill: "Reading", attempt: 3, title: "Reading practice", score: 9, notes: "" },
  { id: "seed-speaking-1", skill: "Speaking", attempt: 1, title: "Speaking practice", score: 7.5, notes: "" },
  { id: "seed-speaking-2", skill: "Speaking", attempt: 2, title: "Speaking practice", score: 8, notes: "" },
  { id: "seed-speaking-3", skill: "Speaking", attempt: 3, title: "Speaking practice", score: 8.5, notes: "" },
  { id: "seed-writing-task-1-1", skill: "Writing", writingTask: "Task 1", attempt: 1, title: "Line graph", score: 6, notes: "" },
  { id: "seed-writing-task-1-2", skill: "Writing", writingTask: "Task 1", attempt: 2, title: "Bar chart", score: 6, notes: "" },
  { id: "seed-writing-task-1-3", skill: "Writing", writingTask: "Task 1", attempt: 3, title: "Pie chart", score: 7, notes: "" },
  { id: "seed-writing-task-1-4", skill: "Writing", writingTask: "Task 1", attempt: 4, title: "Maps", score: 6.5, notes: "" },
  { id: "seed-writing-task-2-1", skill: "Writing", writingTask: "Task 2", attempt: 1, title: "Opinion essay", score: 5.5, notes: "" },
  { id: "seed-writing-task-2-2", skill: "Writing", writingTask: "Task 2", attempt: 2, title: "Solution essay", score: 5.5, notes: "" },
  { id: "seed-writing-task-2-3", skill: "Writing", writingTask: "Task 2", attempt: 3, title: "Discussion essay", score: 6, notes: "" },
  { id: "seed-writing-task-2-4", skill: "Writing", writingTask: "Task 2", attempt: 4, title: "Advantages essay", score: 7, notes: "" },
  { id: "seed-writing-task-2-5", skill: "Writing", writingTask: "Task 2", attempt: 5, title: "Question essay", score: 6.5, notes: "" },
];
const band = (value: number) => value.toFixed(1);
const inferTask = (entry: PracticeEntry): WritingTask | undefined =>
  entry.skill === "Writing"
    ? (entry.writingTask ??
      (taskOneTitles.has(entry.title) ? "Task 1" : "Task 2"))
    : undefined;
const chartSeries = (entry: PracticeEntry): ChartSeries =>
  entry.skill === "Writing"
    ? `Writing ${inferTask(entry) ?? "Task 2"}`
    : entry.skill;

export default function Home() {
  const [entries, setEntries] = useState<PracticeEntry[]>([]);
  const [form, setForm] = useState<Omit<PracticeEntry, "id">>(emptyForm);
  const [selectedFilter, setSelectedFilter] = useState<ResultFilter>("All");
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      const restored = saved ? (JSON.parse(saved) as PracticeEntry[]) : [];
      const normalized = restored.map((entry) => ({
        ...entry,
        writingTask: inferTask(entry),
      }));
      const shouldSeed = !localStorage.getItem(seedKey);
      if (shouldSeed) localStorage.setItem(seedKey, "true");
      const shouldApplyInitialEntries = shouldSeed && normalized.length === 0;
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setEntries(
        shouldApplyInitialEntries ? [...normalized, ...initialEntries] : normalized,
      );
    } catch {
      localStorage.removeItem(storageKey);
    } finally {
      setHydrated(true);
    }
  }, []);
  useEffect(() => {
    if (hydrated) localStorage.setItem(storageKey, JSON.stringify(entries));
  }, [entries, hydrated]);

  const sortedEntries = useMemo(
    () =>
      [...entries].sort(
        (a, b) => a.skill.localeCompare(b.skill) || a.attempt - b.attempt,
      ),
    [entries],
  );
  const visibleEntries = useMemo(
    () =>
      sortedEntries.filter((entry) => {
        if (selectedFilter === "All") return true;
        if (selectedFilter === "Task 1" || selectedFilter === "Task 2")
          return entry.skill === "Writing" && inferTask(entry) === selectedFilter;
        return entry.skill === selectedFilter;
      }),
    [selectedFilter, sortedEntries],
  );
  const chartData = useMemo(
    () =>
      visibleEntries.map((entry) => ({
        label: `${entry.skill} #${entry.attempt}`,
        [chartSeries(entry)]: entry.score,
      })),
    [visibleEntries],
  );
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setEntries((current) => [
      ...current,
      {
        ...form,
        id: crypto.randomUUID(),
        writingTask: form.skill === "Writing" ? form.writingTask : undefined,
      },
    ]);
    setForm((current) => ({
      ...emptyForm(),
      skill: current.skill,
      attempt: current.attempt + 1,
      writingTask:
        current.skill === "Writing" ? current.writingTask : undefined,
    }));
  }
  function remove(id: string) {
    if (confirm("Delete this practice entry?"))
      setEntries((current) => current.filter((entry) => entry.id !== id));
  }

  return (
    <main className="min-h-screen bg-[#09090b] text-zinc-100 selection:bg-violet-500/40">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
        <header className="mb-10 flex flex-col gap-5 border-b border-white/[0.08] pb-8 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.22em] text-violet-300">
              Personal analytics
            </p>
            <h1 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
              IELTS practice tracker
            </h1>
            <p className="mt-2 max-w-xl text-sm leading-6 text-zinc-400">
              Track every individual essay and skill attempt — no combined
              overall scores.
            </p>
          </div>
          <div className="rounded-2xl border border-violet-400/20 bg-violet-400/[0.08] px-4 py-3 text-sm text-violet-100">
            <span className="text-violet-300">{entries.length}</span>{" "}
            {entries.length === 1 ? "piece logged" : "pieces logged"}
          </div>
        </header>
        <section className="rounded-2xl border border-violet-400/20 bg-violet-400/[0.05] p-5 sm:p-7">
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-white">
              Log a practice result
            </h2>
            <p className="mt-1 text-sm text-zinc-400">
              Add the score for one specific essay, speaking, listening, or
              reading attempt.
            </p>
          </div>
          <form
            onSubmit={submit}
            className="grid gap-4 sm:grid-cols-2 lg:grid-cols-6"
          >
            <label className="text-sm font-medium text-zinc-300">
              Skill
              <select
                aria-label="Skill"
                value={form.skill}
                onChange={(e) =>
                  setForm((current) => ({
                    ...current,
                    skill: e.target.value as Skill,
                    writingTask:
                      e.target.value === "Writing"
                        ? (current.writingTask ?? "Task 1")
                        : undefined,
                  }))
                }
                className="field mt-2"
              >
                {skills.map((skill) => (
                  <option key={skill}>{skill}</option>
                ))}
              </select>
            </label>
            <label className="text-sm font-medium text-zinc-300">
              Attempt #
              <input
                aria-label="Attempt number"
                required
                min="1"
                type="number"
                value={form.attempt}
                onChange={(e) =>
                  setForm((current) => ({
                    ...current,
                    attempt: Number(e.target.value),
                  }))
                }
                className="field mt-2"
              />
            </label>
            <label className="text-sm font-medium text-zinc-300">
              Essay type / label
              <input
                aria-label="Practice label"
                required
                value={form.title}
                onChange={(e) =>
                  setForm((current) => ({ ...current, title: e.target.value }))
                }
                placeholder="e.g. Opinion essay"
                className="field mt-2"
              />
            </label>
            <label className="text-sm font-medium text-zinc-300">
              Band score
              <select
                aria-label="Band score"
                value={form.score}
                onChange={(e) =>
                  setForm((current) => ({
                    ...current,
                    score: Number(e.target.value),
                  }))
                }
                className="field mt-2"
              >
                {scores.map((score) => (
                  <option key={score} value={score}>
                    {band(score)}
                  </option>
                ))}
              </select>
            </label>
            {form.skill === "Writing" && (
              <label className="text-sm font-medium text-zinc-300">
                Writing task
                <select
                  aria-label="Writing task"
                  value={form.writingTask}
                  onChange={(e) =>
                    setForm((current) => ({
                      ...current,
                      writingTask: e.target.value as WritingTask,
                    }))
                  }
                  className="field mt-2"
                >
                  <option>Task 1</option>
                  <option>Task 2</option>
                </select>
              </label>
            )}
            <label className="text-sm font-medium text-zinc-300 sm:col-span-2 lg:col-span-3">
              Notes & improvements
              <textarea
                aria-label="Notes and improvements"
                value={form.notes}
                onChange={(e) =>
                  setForm((current) => ({ ...current, notes: e.target.value }))
                }
                placeholder="What went well? What will you improve next time?"
                rows={3}
                className="field mt-2"
              />
            </label>
            <button
              type="submit"
              className="self-end rounded-xl bg-violet-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-violet-400 lg:col-span-1"
            >
              Add result
            </button>
          </form>
        </section>
        <section className="mt-6 rounded-2xl border border-white/[0.09] bg-zinc-900/50 p-5 sm:p-7">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-white">View results</h2>
              <p className="mt-1 text-sm text-zinc-500">
                Choose the practice results you want to review.
              </p>
            </div>
            <p className="text-sm text-zinc-400">
              {visibleEntries.length} {visibleEntries.length === 1 ? "result" : "results"}
            </p>
          </div>
          <div className="mt-5 flex flex-wrap gap-2" aria-label="Result filters">
            {filters.map((filter) => (
              <button
                key={filter.id}
                type="button"
                aria-pressed={selectedFilter === filter.id}
                onClick={() => setSelectedFilter(filter.id)}
                className={`rounded-full border px-3 py-2 text-sm font-medium transition ${
                  selectedFilter === filter.id
                    ? "border-violet-400 bg-violet-400/15 text-violet-100"
                    : "border-white/[0.1] bg-zinc-950/40 text-zinc-400 hover:border-white/20 hover:text-zinc-200"
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </section>
        <section className="mt-6 rounded-2xl border border-white/[0.09] bg-zinc-900/50 p-5 sm:p-7">
          <h2 className="text-lg font-semibold text-white">
            Progress by practice piece
          </h2>
          <p className="mt-1 text-sm text-zinc-500">
            Each line tracks one skill independently.
          </p>
          <div className="mt-7 h-72 w-full sm:h-80">
            {chartData.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={chartData}
                  margin={{ top: 8, right: 8, left: -22 }}
                >
                  <CartesianGrid stroke="#27272a" vertical={false} />
                  <XAxis
                    dataKey="label"
                    tick={{ fill: "#a1a1aa", fontSize: 12 }}
                    axisLine={false}
                    tickLine={false}
                    minTickGap={28}
                  />
                  <YAxis
                    domain={[0, 9]}
                    ticks={[0, 2, 4, 6, 8, 9]}
                    tick={{ fill: "#a1a1aa", fontSize: 12 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      background: "#18181b",
                      border: "1px solid #3f3f46",
                      borderRadius: 12,
                    }}
                    labelStyle={{ color: "#fafafa" }}
                    itemStyle={{ color: "#e4e4e7" }}
                  />
                  <Legend wrapperStyle={{ paddingTop: 16, fontSize: 12 }} />
                  {(Object.keys(colors) as ChartSeries[]).map((skill) => (
                    <Line
                      key={skill}
                      type="monotone"
                      dataKey={skill}
                      connectNulls
                      name={skill}
                      stroke={colors[skill]}
                      strokeWidth={2}
                      dot={{ r: 3, fill: colors[skill] }}
                      activeDot={{ r: 5 }}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center rounded-xl border border-dashed border-white/[0.1] text-sm text-zinc-600">
                Add your first practice result to see progress.
              </div>
            )}
          </div>
        </section>
        <section className="mt-10">
          <h2 className="text-lg font-semibold text-white">Practice history</h2>
          <p className="mt-1 text-sm text-zinc-500">
            Each piece is kept separate. Writing entries show Task 1 or Task 2.
          </p>
          {visibleEntries.length ? (
            <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {visibleEntries.map((entry) => (
                <article
                  key={entry.id}
                  className={`rounded-2xl border bg-zinc-900/50 p-5 ${
                    inferTask(entry) === "Task 1"
                      ? "border-cyan-400/30"
                      : inferTask(entry) === "Task 2"
                        ? "border-violet-400/30"
                        : "border-white/[0.09]"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-xs font-semibold uppercase tracking-wider text-violet-300">
                          {entry.skill} · Attempt #{entry.attempt}
                        </p>
                        {inferTask(entry) && (
                          <span
                            className={`rounded-full px-2 py-1 text-[10px] font-bold uppercase tracking-wider ${
                              inferTask(entry) === "Task 1"
                                ? "bg-cyan-400/15 text-cyan-200"
                                : "bg-violet-400/15 text-violet-200"
                            }`}
                          >
                            {inferTask(entry)}
                          </span>
                        )}
                      </div>
                      <p className="mt-2 font-medium text-white">
                        {entry.title}
                      </p>
                    </div>
                    <span className="rounded-lg bg-lime-300/10 px-3 py-2 text-sm font-semibold text-lime-300">
                      {band(entry.score)}
                    </span>
                  </div>
                  {entry.notes && (
                    <div className="mt-4 rounded-xl bg-white/[0.04] p-3">
                      <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">
                        Notes & improvements
                      </p>
                      <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-zinc-300">
                        {entry.notes}
                      </p>
                    </div>
                  )}
                  <button
                    onClick={() => remove(entry.id)}
                    className="mt-3 text-sm text-rose-300 hover:text-rose-200"
                  >
                    Delete
                  </button>
                </article>
              ))}
            </div>
          ) : (
            <div className="mt-5 rounded-2xl border border-dashed border-white/[0.1] py-12 text-center text-sm text-zinc-600">
              {entries.length
                ? "No practice results match this filter."
                : "Your practice scores will appear here."}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
