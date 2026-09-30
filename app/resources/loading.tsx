export default function Loading() {
  return (
    <main className="min-h-screen bg-[#F8FAFC]">
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-6 py-16 lg:px-8">
          <div className="h-5 w-48 animate-pulse rounded bg-slate-200" />
          <div className="mt-5 h-12 w-full max-w-3xl animate-pulse rounded bg-slate-200" />
          <div className="mt-4 h-6 w-full max-w-2xl animate-pulse rounded bg-slate-200" />
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-10 lg:px-8">
        <div className="mb-8 h-16 w-full animate-pulse rounded-2xl bg-slate-200" />

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <div
              key={index}
              className="rounded-2xl border border-slate-200 bg-white p-6"
            >
              <div className="h-5 w-28 animate-pulse rounded bg-slate-200" />
              <div className="mt-5 h-7 w-full animate-pulse rounded bg-slate-200" />
              <div className="mt-3 h-5 w-4/5 animate-pulse rounded bg-slate-200" />
              <div className="mt-8 h-4 w-24 animate-pulse rounded bg-slate-200" />
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}