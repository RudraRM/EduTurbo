export function AuthShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="flex items-center justify-center px-6 py-12 sm:px-10">
        <div className="w-full max-w-sm">{children}</div>
      </div>

      <aside className="relative hidden overflow-hidden lg:block" aria-hidden="true">
        <div className="absolute inset-0 gradient-primary" />
        <div className="absolute -left-24 top-1/4 h-96 w-96 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -bottom-32 right-0 h-[28rem] w-[28rem] rounded-full bg-sky-300/20 blur-3xl" />
        <div className="relative flex h-full flex-col justify-center p-16 text-white">
          <blockquote className="max-w-md">
            <p className="text-balance text-3xl font-semibold leading-snug tracking-tight">
              &ldquo;I dropped in a 90-minute lecture and had notes, a flashcard
              deck and a quiz before my coffee cooled.&rdquo;
            </p>
            <footer className="mt-6 text-white/80">
              The kind of study session Lumen is built for
            </footer>
          </blockquote>
          <div className="mt-16 grid max-w-md grid-cols-3 gap-4">
            {[
              ["8+", "source formats"],
              ["4", "quiz types"],
              ["~1s", "to first token"],
            ].map(([stat, label]) => (
              <div
                key={label}
                className="rounded-2xl bg-white/10 p-4 backdrop-blur-sm"
              >
                <div className="text-2xl font-bold">{stat}</div>
                <div className="mt-1 text-xs text-white/75">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </aside>
    </div>
  );
}
