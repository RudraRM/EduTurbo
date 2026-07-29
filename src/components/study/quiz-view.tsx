"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  BrainCircuit,
  Check,
  ChevronRight,
  CircleCheck,
  CircleX,
  Loader2,
  Plus,
  RotateCcw,
  Trash2,
  X,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { EmptyState } from "@/components/empty-state";
import { MarkdownView } from "@/components/markdown-view";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { useDeleteQuiz, useQuizzes, useSaveQuiz } from "@/hooks/use-study";
import { generateQuiz, gradeShortAnswer } from "@/lib/ai/generate";
import type { Doc, Quiz, QuizKind } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useSettings } from "@/stores/settings-store";
import { useUI } from "@/stores/ui-store";

const QUIZ_KINDS: { kind: QuizKind; label: string; hint: string }[] = [
  { kind: "mcq", label: "Multiple choice", hint: "4 options, 1 correct" },
  { kind: "true_false", label: "True / False", hint: "Judge each statement" },
  { kind: "fill_blank", label: "Fill in the blank", hint: "Recall the missing term" },
  { kind: "short_answer", label: "Short answer", hint: "AI-graded free responses" },
];

const KIND_LABEL: Record<QuizKind, string> = {
  mcq: "Multiple choice",
  true_false: "True / False",
  fill_blank: "Fill in the blank",
  short_answer: "Short answer",
};

type Verdict = "correct" | "partial" | "incorrect";

interface AnswerRecord {
  given: string;
  verdict: Verdict;
  feedback?: string;
}

function normalize(text: string): string {
  return text.trim().toLowerCase().replace(/[.,!?;:'"”“’‘]/g, "").replace(/\s+/g, " ");
}

function ScoreRing({ percent }: { percent: number }) {
  const radius = 52;
  const circumference = 2 * Math.PI * radius;
  return (
    <div className="relative h-32 w-32">
      <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90">
        <circle
          cx="60"
          cy="60"
          r={radius}
          fill="none"
          stroke="hsl(var(--secondary))"
          strokeWidth="10"
        />
        <motion.circle
          cx="60"
          cy="60"
          r={radius}
          fill="none"
          stroke="hsl(var(--primary))"
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: circumference * (1 - percent / 100) }}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center text-2xl font-bold">
        {Math.round(percent)}%
      </div>
    </div>
  );
}

function QuizPlayer({ quiz, onExit }: { quiz: Quiz; onExit: () => void }) {
  const { apiKey, model } = useSettings();
  const [index, setIndex] = useState(0);
  const [records, setRecords] = useState<AnswerRecord[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [textAnswer, setTextAnswer] = useState("");
  const [grading, setGrading] = useState(false);
  const [revealed, setRevealed] = useState(false);

  const question = quiz.questions[index];
  const current = records[index];

  function record(given: string, verdict: Verdict, feedback?: string) {
    setRecords((r) => {
      const next = [...r];
      next[index] = { given, verdict, feedback };
      return next;
    });
    setRevealed(true);
  }

  function submitChoice(value: string) {
    if (revealed) return;
    setSelected(value);
    let correct = false;
    if (quiz.kind === "mcq") {
      correct = value === question.answer;
    } else {
      correct = normalize(value) === normalize(question.answer);
    }
    record(value, correct ? "correct" : "incorrect");
  }

  function submitFillBlank() {
    if (revealed || !textAnswer.trim()) return;
    const correct = normalize(textAnswer) === normalize(question.answer);
    record(textAnswer, correct ? "correct" : "incorrect");
  }

  async function submitShortAnswer() {
    if (revealed || !textAnswer.trim()) return;
    setGrading(true);
    try {
      const result = await gradeShortAnswer(
        { apiKey, model },
        question.question,
        question.answer,
        textAnswer
      );
      record(textAnswer, result.verdict, result.feedback);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Grading failed.");
    } finally {
      setGrading(false);
    }
  }

  function next() {
    setRevealed(false);
    setSelected(null);
    setTextAnswer("");
    setIndex((i) => i + 1);
  }

  // Results screen
  if (index >= quiz.questions.length) {
    const points = records.reduce(
      (sum, r) => sum + (r.verdict === "correct" ? 1 : r.verdict === "partial" ? 0.5 : 0),
      0
    );
    const percent = (points / quiz.questions.length) * 100;
    return (
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="mx-auto max-w-xl pt-4"
      >
        <div className="rounded-3xl border bg-card p-8 text-center shadow-soft">
          <div className="flex justify-center">
            <ScoreRing percent={percent} />
          </div>
          <h3 className="mt-4 text-2xl font-bold tracking-tight">
            {percent >= 90 ? "Outstanding! 🎉" : percent >= 70 ? "Nice work! 💪" : "Good practice 📚"}
          </h3>
          <p className="mt-1.5 text-muted-foreground">
            {points % 1 === 0 ? points : points.toFixed(1)} of {quiz.questions.length} points ·{" "}
            {KIND_LABEL[quiz.kind]}
          </p>
          <div className="mt-6 flex justify-center gap-3">
            <Button
              onClick={() => {
                setRecords([]);
                setIndex(0);
                setRevealed(false);
                setSelected(null);
                setTextAnswer("");
              }}
            >
              <RotateCcw />
              Retake quiz
            </Button>
            <Button variant="outline" onClick={onExit}>
              Back to quizzes
            </Button>
          </div>
        </div>

        <div className="mt-6 space-y-3">
          {quiz.questions.map((q, i) => {
            const r = records[i];
            return (
              <div key={i} className="rounded-2xl border bg-card p-4 shadow-soft">
                <div className="flex items-start gap-3">
                  {r?.verdict === "correct" ? (
                    <CircleCheck className="mt-0.5 h-5 w-5 flex-none text-emerald-500" />
                  ) : r?.verdict === "partial" ? (
                    <CircleCheck className="mt-0.5 h-5 w-5 flex-none text-amber-500" />
                  ) : (
                    <CircleX className="mt-0.5 h-5 w-5 flex-none text-destructive" />
                  )}
                  <div className="min-w-0">
                    <p className="text-sm font-medium">{q.question}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Your answer: <span className="font-medium">{quiz.kind === "mcq" ? q.options?.[Number(r?.given)] ?? r?.given : r?.given}</span>
                      {r?.verdict !== "correct" && (
                        <>
                          {" · "}Correct:{" "}
                          <span className="font-medium text-foreground">
                            {quiz.kind === "mcq" ? q.options?.[Number(q.answer)] : q.answer}
                          </span>
                        </>
                      )}
                    </p>
                    {q.explanation && (
                      <p className="mt-1.5 text-xs leading-5 text-muted-foreground">
                        {q.explanation}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </motion.div>
    );
  }

  return (
    <div className="mx-auto max-w-xl pt-2">
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={onExit}
          className="flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <X className="h-4 w-4" />
          Exit
        </button>
        <span className="text-sm font-medium text-muted-foreground">
          {index + 1} / {quiz.questions.length}
        </span>
      </div>
      <Progress value={((index + (revealed ? 1 : 0)) / quiz.questions.length) * 100} className="mt-3" />

      <AnimatePresence mode="wait">
        <motion.div
          key={index}
          initial={{ opacity: 0, x: 32 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -32 }}
          transition={{ duration: 0.25 }}
          className="mt-6 rounded-3xl border bg-card p-6 shadow-soft sm:p-8"
        >
          <Badge variant="secondary" className="mb-4">
            {KIND_LABEL[quiz.kind]}
          </Badge>
          <h3 className="text-lg font-semibold leading-relaxed">{question.question}</h3>

          {/* MCQ */}
          {quiz.kind === "mcq" && (
            <div className="mt-6 space-y-2.5">
              {(question.options ?? []).map((option, optionIndex) => {
                const value = String(optionIndex);
                const isCorrect = value === question.answer;
                const isSelected = selected === value;
                return (
                  <button
                    key={optionIndex}
                    type="button"
                    disabled={revealed}
                    onClick={() => submitChoice(value)}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left text-sm font-medium transition-all",
                      !revealed && "hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-soft",
                      revealed && isCorrect && "border-emerald-400/60 bg-emerald-500/10",
                      revealed && isSelected && !isCorrect && "border-destructive/60 bg-destructive/10",
                      revealed && !isSelected && !isCorrect && "opacity-50"
                    )}
                  >
                    <span
                      className={cn(
                        "flex h-6 w-6 flex-none items-center justify-center rounded-full border text-xs font-semibold",
                        revealed && isCorrect && "border-transparent bg-emerald-500 text-white",
                        revealed && isSelected && !isCorrect && "border-transparent bg-destructive text-white"
                      )}
                    >
                      {revealed && isCorrect ? (
                        <Check className="h-3.5 w-3.5" />
                      ) : revealed && isSelected && !isCorrect ? (
                        <X className="h-3.5 w-3.5" />
                      ) : (
                        String.fromCharCode(65 + optionIndex)
                      )}
                    </span>
                    {option}
                  </button>
                );
              })}
            </div>
          )}

          {/* True / False */}
          {quiz.kind === "true_false" && (
            <div className="mt-6 grid grid-cols-2 gap-3">
              {["true", "false"].map((value) => {
                const isCorrect = normalize(question.answer) === value;
                const isSelected = selected === value;
                return (
                  <button
                    key={value}
                    type="button"
                    disabled={revealed}
                    onClick={() => submitChoice(value)}
                    className={cn(
                      "rounded-xl border px-4 py-4 text-sm font-semibold capitalize transition-all",
                      !revealed && "hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-soft",
                      revealed && isCorrect && "border-emerald-400/60 bg-emerald-500/10",
                      revealed && isSelected && !isCorrect && "border-destructive/60 bg-destructive/10",
                      revealed && !isSelected && !isCorrect && "opacity-50"
                    )}
                  >
                    {value}
                  </button>
                );
              })}
            </div>
          )}

          {/* Fill in the blank */}
          {quiz.kind === "fill_blank" && (
            <div className="mt-6">
              <div className="flex gap-2">
                <Input
                  value={textAnswer}
                  disabled={revealed}
                  onChange={(event) => setTextAnswer(event.target.value)}
                  onKeyDown={(event) => event.key === "Enter" && submitFillBlank()}
                  placeholder="Type the missing word…"
                  aria-label="Your answer"
                />
                {!revealed && (
                  <Button onClick={submitFillBlank} disabled={!textAnswer.trim()}>
                    Check
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* Short answer */}
          {quiz.kind === "short_answer" && (
            <div className="mt-6">
              <Textarea
                value={textAnswer}
                disabled={revealed || grading}
                onChange={(event) => setTextAnswer(event.target.value)}
                placeholder="Write your answer in a sentence or two…"
                rows={3}
                aria-label="Your answer"
              />
              {!revealed && (
                <Button
                  className="mt-3"
                  onClick={() => void submitShortAnswer()}
                  disabled={!textAnswer.trim() || grading}
                >
                  {grading && <Loader2 className="animate-spin" />}
                  {grading ? "Grading…" : "Submit answer"}
                </Button>
              )}
            </div>
          )}

          {/* Feedback */}
          <AnimatePresence>
            {revealed && current && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="overflow-hidden"
              >
                <div
                  className={cn(
                    "mt-6 rounded-2xl p-4 text-sm leading-6",
                    current.verdict === "correct" && "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
                    current.verdict === "partial" && "bg-amber-500/10 text-amber-700 dark:text-amber-300",
                    current.verdict === "incorrect" && "bg-destructive/10 text-destructive"
                  )}
                >
                  <p className="font-semibold">
                    {current.verdict === "correct"
                      ? "Correct!"
                      : current.verdict === "partial"
                        ? "Partially right"
                        : "Not quite"}
                  </p>
                  {(quiz.kind === "fill_blank" || quiz.kind === "short_answer") &&
                    current.verdict !== "correct" && (
                      <p className="mt-1">
                        Expected: <span className="font-medium">{question.answer}</span>
                      </p>
                    )}
                  {current.feedback && <p className="mt-1">{current.feedback}</p>}
                  {question.explanation && (
                    <p className="mt-1 opacity-90">{question.explanation}</p>
                  )}
                </div>
                <Button className="mt-4 w-full" onClick={next}>
                  {index + 1 >= quiz.questions.length ? "See results" : "Next question"}
                  <ChevronRight />
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

export function QuizView({ doc, material }: { doc: Doc; material: string }) {
  const { apiKey, model } = useSettings();
  const setApiKeyDialogOpen = useUI((s) => s.setApiKeyDialogOpen);
  const { data: quizzes, isLoading } = useQuizzes(doc.id);
  const saveQuiz = useSaveQuiz(doc.id);
  const deleteQuiz = useDeleteQuiz(doc.id);

  const [generatingKind, setGeneratingKind] = useState<QuizKind | null>(null);
  const [activeQuiz, setActiveQuiz] = useState<Quiz | null>(null);

  const sorted = useMemo(() => quizzes ?? [], [quizzes]);

  async function generate(kind: QuizKind) {
    if (!apiKey) {
      setApiKeyDialogOpen(true);
      return;
    }
    setGeneratingKind(kind);
    try {
      const result = await generateQuiz({ apiKey, model }, kind, material);
      await saveQuiz.mutateAsync({ kind, title: result.title, questions: result.questions });
      toast.success(`Quiz ready — ${result.questions.length} questions`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Couldn't generate the quiz.");
    } finally {
      setGeneratingKind(null);
    }
  }

  if (activeQuiz) {
    return <QuizPlayer quiz={activeQuiz} onExit={() => setActiveQuiz(null)} />;
  }

  return (
    <div className="mx-auto max-w-2xl pt-2">
      {/* Generate row */}
      <div className="grid gap-3 sm:grid-cols-2">
        {QUIZ_KINDS.map((entry) => (
          <button
            key={entry.kind}
            type="button"
            disabled={generatingKind !== null}
            onClick={() => void generate(entry.kind)}
            className="group flex items-center gap-3.5 rounded-2xl border bg-card p-4 text-left shadow-soft transition-all hover:-translate-y-0.5 hover:shadow-raised disabled:opacity-60"
          >
            <span className="flex h-10 w-10 flex-none items-center justify-center rounded-xl bg-accent">
              {generatingKind === entry.kind ? (
                <Loader2 className="h-5 w-5 animate-spin text-accent-foreground" />
              ) : (
                <Plus className="h-5 w-5 text-accent-foreground" />
              )}
            </span>
            <span>
              <span className="block text-sm font-semibold">{entry.label}</span>
              <span className="block text-xs text-muted-foreground">{entry.hint}</span>
            </span>
          </button>
        ))}
      </div>

      {/* Saved quizzes */}
      <div className="mt-8">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground/80">
          Your quizzes
        </h3>
        {isLoading ? (
          <div className="mt-3 space-y-3">
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="h-20 animate-pulse-soft rounded-2xl bg-muted skeleton-shimmer" />
            ))}
          </div>
        ) : sorted.length === 0 ? (
          <div className="mt-3">
            <EmptyState
              icon={BrainCircuit}
              title="No quizzes yet"
              description="Pick a format above and Lumen will write a quiz from this exact document."
            />
          </div>
        ) : (
          <ul className="mt-3 space-y-3">
            {sorted.map((quiz) => (
              <li key={quiz.id} className="group relative">
                <button
                  type="button"
                  onClick={() => setActiveQuiz(quiz)}
                  className="flex w-full items-center gap-4 rounded-2xl border bg-card p-4 text-left shadow-soft transition-all hover:-translate-y-0.5 hover:shadow-raised"
                >
                  <span className="flex h-10 w-10 flex-none items-center justify-center rounded-xl bg-[hsl(var(--pastel-mint))]">
                    <BrainCircuit className="h-5 w-5 text-foreground/70" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold">{quiz.title}</span>
                    <span className="block text-xs text-muted-foreground">
                      {KIND_LABEL[quiz.kind]} · {quiz.questions.length} questions
                    </span>
                  </span>
                  <ChevronRight className="h-4 w-4 flex-none text-muted-foreground" />
                </button>
                <button
                  type="button"
                  aria-label={`Delete quiz ${quiz.title}`}
                  onClick={() => deleteQuiz.mutate(quiz.id)}
                  className="absolute right-12 top-1/2 hidden -translate-y-1/2 rounded-md p-1.5 text-muted-foreground hover:text-destructive group-hover:block"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
