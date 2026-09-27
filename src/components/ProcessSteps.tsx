import { steps } from "@/lib/content";

export default function ProcessSteps() {
  return (
    <ol className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {steps.map((step, i) => (
        <li key={step.title} className="rounded-2xl border border-line bg-white p-6">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-brand text-sm font-bold text-white">
            {i + 1}
          </span>
          <h3 className="mt-4 text-lg font-bold text-navy">{step.title}</h3>
          <p className="mt-1 text-sm leading-relaxed text-slate">{step.description}</p>
        </li>
      ))}
    </ol>
  );
}
