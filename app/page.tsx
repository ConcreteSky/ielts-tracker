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

type ScoreKey = "listening" | "reading" | "writing" | "speaking";
type TestEntry = {
  id: string;
  attempt: number;
  writingTask: "Task 1" | "Task 2";
  listening: number;
  reading: number;
  writing: number;
  speaking: number;
  overall: number;
  notes: string;
};
type FormValues = Omit<TestEntry, "id" | "overall">;
const storageKey = "ielts-score-tracker.entries";
const scores = Array.from({ length: 19 }, (_, index) => index / 2);
const sectionNames: Record<ScoreKey, string> = {
  listening: "Listening",
  reading: "Reading",
  writing: "Writing",
  speaking: "Speaking",
};
const colors: Record<ScoreKey | "overall", string> = {
  listening: "#8b5cf6",
  reading: "#38bdf8",
  writing: "#f59e0b",
  speaking: "#f472b6",
  overall: "#a3e635",
};
const emptyForm = (attempt = 1): FormValues => ({
  attempt,
  writingTask: "Task 1",
  listening: 0,
  reading: 0,
  writing: 0,
  speaking: 0,
  notes: "",
});
const overallScore = (v: Pick<TestEntry, ScoreKey>) =>
  Math.round(((v.listening + v.reading + v.writing + v.speaking) / 4) * 2) / 2;
const band = (v: number) => v.toFixed(1);

export default function Home() {
  const [entries, setEntries] = useState<TestEntry[]>([]);
  const [form, setForm] = useState<FormValues>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const previousEntries = JSON.parse(saved) as Array<
          TestEntry & { date?: string }
        >;
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setEntries(
          previousEntries.map((entry, index) => ({
            ...entry,
            attempt: entry.attempt ?? index + 1,
            writingTask: entry.writingTask ?? "Task 1",
          })),
        );
      }
    } catch {
      localStorage.removeItem(storageKey);
    } finally {
      setHydrated(true);
    }
  }, []);
  useEffect(() => {
    if (hydrated) localStorage.setItem(storageKey, JSON.stringify(entries));
  }, [entries, hydrated]);
  const overall = overallScore(form);
  const sorted = useMemo(
    () => [...entries].sort((a, b) => b.attempt - a.attempt),
    [entries],
  );
  const chartData = useMemo(
    () =>
      [...entries]
        .sort((a, b) => a.attempt - b.attempt)
        .map((entry) => ({ ...entry, label: `Writing #${entry.attempt}` })),
    [entries],
  );
  const keys = Object.keys(sectionNames) as ScoreKey[];
  function updateScore(key: ScoreKey, value: string) {
    setForm((v) => ({ ...v, [key]: Number(value) }));
  }
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const entry: TestEntry = {
      ...form,
      id: editingId ?? crypto.randomUUID(),
      overall: overallScore(form),
    };
    setEntries((v) =>
      editingId
        ? v.map((item) => (item.id === editingId ? entry : item))
        : [...v, entry],
    );
    setForm(emptyForm(Math.max(0, ...entries.map((item) => item.attempt)) + 1));
    setEditingId(null);
  }
  function edit(entry: TestEntry) {
    const { id, overall: ignored, ...values } = entry;
    void ignored;
    setForm(values);
    setEditingId(id);
    scrollTo({ top: 0, behavior: "smooth" });
  }
  function cancel() {
    setForm(
      emptyForm(Math.max(0, ...entries.map((entry) => entry.attempt)) + 1),
    );
    setEditingId(null);
  }
  function remove(id: string) {
    if (confirm("Delete this IELTS test entry?")) {
      setEntries((v) => v.filter((entry) => entry.id !== id));
      if (editingId === id) cancel();
    }
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
              IELTS score tracker
            </h1>
            <p className="mt-2 max-w-xl text-sm leading-6 text-zinc-400">
              Keep every exam result, spot your progress, and leave a note for
              your future self.
            </p>
          </div>
          <div className="rounded-2xl border border-violet-400/20 bg-violet-400/[0.08] px-4 py-3 text-sm text-violet-100">
            <span className="text-violet-300">{entries.length}</span>{" "}
            {entries.length === 1 ? "attempt logged" : "attempts logged"}
          </div>
        </header>
        <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
          <form
            onSubmit={submit}
            className="rounded-2xl border border-white/[0.09] bg-zinc-900/70 p-5 shadow-2xl shadow-black/20 sm:p-7"
          >
            <div className="mb-7 flex items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-white">
                  {editingId ? "Edit writing attempt" : "Log a writing attempt"}
                </h2>
                <p className="mt-1 text-sm text-zinc-500">
                  Scores use official half-band increments.
                </p>
              </div>
              {editingId && (
                <button
                  type="button"
                  onClick={cancel}
                  className="text-sm text-zinc-400 hover:text-white"
                >
                  Cancel
                </button>
              )}
            </div>
            <div className="grid max-w-md grid-cols-2 gap-4">
            <label className="text-sm font-medium text-zinc-300">
              Writing attempt #
              <input
                required
                type="number"
                min="1"
                value={form.attempt}
                onChange={(e) =>
                  setForm((v) => ({ ...v, attempt: Number(e.target.value) }))
                }
                className="field mt-2"
              />
            </label>
            <label className="text-sm font-medium text-zinc-300">
              Writing task
              <select value={form.writingTask} onChange={(e) => setForm((v) => ({ ...v, writingTask: e.target.value as TestEntry["writingTask"] }))} className="field mt-2">
                <option>Task 1</option>
                <option>Task 2</option>
              </select>
            </label>
            </div>
            <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
              {keys.map((key) => (
                <label key={key} className="text-sm font-medium text-zinc-300">
                  {sectionNames[key]}
                  <select
                    value={form[key]}
                    onChange={(e) => updateScore(key, e.target.value)}
                    className="field mt-2"
                  >
                    {scores.map((score) => (
                      <option key={score} value={score}>
                        {band(score)}
                      </option>
                    ))}
                  </select>
                </label>
              ))}
            </div>
            <div className="mt-6 flex items-center justify-between rounded-xl border border-lime-300/15 bg-lime-300/[0.06] px-4 py-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-lime-300/80">
                  Overall band
                </p>
                <p className="mt-1 text-xs text-zinc-500">
                  Automatically rounded to nearest 0.5
                </p>
              </div>
              <span className="text-3xl font-semibold tracking-tight text-lime-300">
                {band(overall)}
              </span>
            </div>
            <label className="mt-6 block text-sm font-medium text-zinc-300">
              Mistakes & improvements{" "}
              <span className="font-normal text-zinc-600">(optional)</span>
              <textarea
                value={form.notes}
                onChange={(e) =>
                  setForm((v) => ({ ...v, notes: e.target.value }))
                }
                placeholder="What mistakes did you make? What will you change in your next writing attempt?"
                rows={4}
                className="field mt-2 resize-y"
              />
            </label>
            <button
              type="submit"
              className="mt-6 w-full rounded-xl bg-violet-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-300 focus:ring-offset-2 focus:ring-offset-zinc-900"
            >
              {editingId ? "Save changes" : "Add writing attempt"}
            </button>
          </form>
          <aside className="rounded-2xl border border-white/[0.09] bg-zinc-900/50 p-5 sm:p-7">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
              Current best
            </p>
            {entries.length ? (
              <>
                <p className="mt-4 text-5xl font-semibold tracking-tight text-lime-300">
                  {band(Math.max(...entries.map((e) => e.overall)))}
                </p>
                <p className="mt-2 text-sm text-zinc-500">overall band score</p>
                <div className="mt-8 space-y-4 border-t border-white/[0.08] pt-5 text-sm">
                  {keys.map((key) => (
                    <div key={key} className="flex justify-between">
                      <span className="text-zinc-500">{sectionNames[key]}</span>
                      <span className="font-medium text-zinc-200">
                        {band(Math.max(...entries.map((e) => e[key])))}
                      </span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <p className="mt-4 text-sm leading-6 text-zinc-500">
                Your strongest scores will appear here after you log your first
                writing attempt.
              </p>
            )}
          </aside>
        </section>
        <section className="mt-6 rounded-2xl border border-white/[0.09] bg-zinc-900/50 p-5 sm:p-7">
          <h2 className="text-lg font-semibold text-white">
            Progress by writing attempt
          </h2>
          <p className="mt-1 text-sm text-zinc-500">
            Every section, plus your overall band.
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
                  {keys.map((key) => (
                    <Line
                      key={key}
                      type="monotone"
                      dataKey={key}
                      name={sectionNames[key]}
                      stroke={colors[key]}
                      strokeWidth={2}
                      dot={{ r: 3, fill: colors[key] }}
                      activeDot={{ r: 5 }}
                    />
                  ))}
                  <Line
                    type="monotone"
                    dataKey="overall"
                    name="Overall"
                    stroke={colors.overall}
                    strokeWidth={3}
                    dot={{ r: 4, fill: colors.overall }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center rounded-xl border border-dashed border-white/[0.1] text-sm text-zinc-600">
                Add your first writing attempt to see your score history.
              </div>
            )}
          </div>
        </section>
        <section className="mt-10">
          <div className="mb-5">
            <h2 className="text-lg font-semibold text-white">Writing history</h2>
            <p className="mt-1 text-sm text-zinc-500">
              Highest attempt number first.
            </p>
          </div>
          {sorted.length ? (
            <div className="space-y-3">
              {sorted.map((entry) => (
                <article
                  key={entry.id}
                  className="overflow-hidden rounded-2xl border border-white/[0.09] bg-zinc-900/50"
                >
                  <button
                    onClick={() =>
                      setExpandedId((v) => (v === entry.id ? null : entry.id))
                    }
                    className="grid w-full grid-cols-[1fr_auto] gap-4 p-5 text-left transition hover:bg-white/[0.02] sm:grid-cols-[180px_1fr_auto] sm:items-center"
                  >
                    <div>
                      <p className="font-medium text-white">
                        Writing #{entry.attempt} · {entry.writingTask}
                      </p>
                      <p className="mt-1 text-xs text-zinc-500">
                        {entry.notes ? "Notes saved" : "No notes"}
                      </p>
                    </div>
                    <div className="hidden gap-4 sm:flex">
                      {keys.map((key) => (
                        <div key={key}>
                          <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-600">
                            {sectionNames[key].slice(0, 3)}
                          </p>
                          <p className="mt-1 text-sm font-medium text-zinc-200">
                            {band(entry[key])}
                          </p>
                        </div>
                      ))}
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="rounded-lg bg-lime-300/10 px-3 py-2 text-sm font-semibold text-lime-300">
                        {band(entry.overall)}
                      </span>
                      <span className="text-zinc-600">
                        {expandedId === entry.id ? "−" : "+"}
                      </span>
                    </div>
                  </button>
                  {expandedId === entry.id && (
                    <div className="border-t border-white/[0.07] px-5 py-5 sm:px-6">
                      <div className="grid grid-cols-4 gap-3 sm:hidden">
                        {keys.map((key) => (
                          <div
                            key={key}
                            className="rounded-lg bg-white/[0.03] p-2"
                          >
                            <p className="text-[10px] uppercase text-zinc-600">
                              {sectionNames[key].slice(0, 3)}
                            </p>
                            <p className="mt-1 text-sm text-zinc-200">
                              {band(entry[key])}
                            </p>
                          </div>
                        ))}
                      </div>
                      <p className="mt-4 whitespace-pre-wrap text-sm leading-6 text-zinc-400">
                        {entry.notes ||
                          "No mistakes or improvement notes were added for this attempt."}
                      </p>
                      <div className="mt-5 flex gap-3">
                        <button
                          onClick={() => edit(entry)}
                          className="rounded-lg border border-white/[0.12] px-3 py-2 text-sm text-zinc-300 hover:bg-white/[0.06]"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => remove(entry.id)}
                          className="rounded-lg px-3 py-2 text-sm text-rose-300 hover:bg-rose-400/10"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  )}
                </article>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-white/[0.1] py-12 text-center text-sm text-zinc-600">
              Your logged exams will appear here.
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
