import { test, expect } from "bun:test";

const QUICK_ACTIONS = [
  { label: 'Tentei Contato', icon: 'PhoneCall', tone: 'text-indigo-600 bg-indigo-50 border-indigo-100' },
  { label: 'Retorno Agendado', icon: 'Clock', tone: 'text-amber-600 bg-amber-50 border-amber-100' },
  { label: 'Agendamento', icon: 'Calendar', tone: 'text-blue-600 bg-blue-50 border-blue-100' },
  { label: 'Visita Feita', icon: 'UserCheck', tone: 'text-emerald-600 bg-emerald-50 border-emerald-100' },
  { label: 'Proposta', icon: 'FileText', tone: 'text-indigo-600 bg-indigo-50 border-indigo-100' },
  { label: 'Perdido', icon: 'XCircle', tone: 'text-rose-600 bg-rose-50 border-rose-100' },
]

const ITERATIONS = 1_000_000;
const targetLabel = 'Proposta'; // Near the end, to make the find do some work

test('Benchmark: Duplicate find vs Single find', () => {
  // Scenario 1: Unoptimized (Duplicate find)
  const startUnoptimized = performance.now();
  for (let i = 0; i < ITERATIONS; i++) {
    const obj = {
      icon: QUICK_ACTIONS.find(a => a.label === targetLabel)?.icon || 'FileText',
      color: QUICK_ACTIONS.find(a => a.label === targetLabel)?.tone || 'bg-gray-50',
    };
  }
  const endUnoptimized = performance.now();
  const timeUnoptimized = endUnoptimized - startUnoptimized;

  // Scenario 2: Optimized (Single find)
  const startOptimized = performance.now();
  for (let i = 0; i < ITERATIONS; i++) {
    const action = QUICK_ACTIONS.find(a => a.label === targetLabel);
    const obj = {
      icon: action?.icon || 'FileText',
      color: action?.tone || 'bg-gray-50',
    };
  }
  const endOptimized = performance.now();
  const timeOptimized = endOptimized - startOptimized;

  console.log(`\n--- BENCHMARK RESULTS (${ITERATIONS} iterations) ---`);
  console.log(`Unoptimized (2 finds): ${timeUnoptimized.toFixed(2)} ms`);
  console.log(`Optimized (1 find):    ${timeOptimized.toFixed(2)} ms`);
  console.log(`Improvement:           ${((timeUnoptimized - timeOptimized) / timeUnoptimized * 100).toFixed(2)}% faster`);
  console.log(`Speedup multiplier:    ${(timeUnoptimized / timeOptimized).toFixed(2)}x`);
  console.log(`------------------------------------------------\n`);

  // It's technically possible for unoptimized to occasionally match or barely beat optimized due to JIT and small array size
  // but logically optimized is O(N) vs 2*O(N).
  expect(timeOptimized).toBeLessThanOrEqual(timeUnoptimized * 1.5); // Allow some JIT variance, but optimized should generally be faster
});
