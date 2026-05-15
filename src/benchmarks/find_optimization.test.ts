import { expect, test } from "bun:test";

const QUICK_ACTIONS = [
  { label: 'Tentei Contato', icon: 'PhoneCall', tone: 'text-indigo-600 bg-indigo-50 border-indigo-100' },
  { label: 'Retorno Agendado', icon: 'Clock', tone: 'text-amber-600 bg-amber-50 border-amber-100' },
  { label: 'Agendamento', icon: 'Calendar', tone: 'text-blue-600 bg-blue-50 border-blue-100' },
  { label: 'Visita Feita', icon: 'UserCheck', tone: 'text-emerald-600 bg-emerald-50 border-emerald-100' },
  { label: 'Proposta', icon: 'FileText', tone: 'text-indigo-600 bg-indigo-50 border-indigo-100' },
  { label: 'Perdido', icon: 'XCircle', tone: 'text-rose-600 bg-rose-50 border-rose-100' },
]

const targetLabel = 'Proposta'; // Near the end, to make the find do some work

const findAction = (onVisit: () => void) => {
  return QUICK_ACTIONS.find(action => {
    onVisit();
    return action.label === targetLabel;
  });
};

test('Optimization: Duplicate find vs Single find', () => {
  let unoptimizedVisits = 0;
  const unoptimized = {
    icon: findAction(() => {
      unoptimizedVisits += 1;
    })?.icon || 'FileText',
    color: findAction(() => {
      unoptimizedVisits += 1;
    })?.tone || 'bg-gray-50',
  };

  let optimizedVisits = 0;
  const action = findAction(() => {
    optimizedVisits += 1;
  });
  const optimized = {
    icon: action?.icon || 'FileText',
    color: action?.tone || 'bg-gray-50',
  };

  expect(optimized).toEqual(unoptimized);
  expect(optimizedVisits).toBeGreaterThan(0);
  expect(unoptimizedVisits).toBe(optimizedVisits * 2);
});

test('Optimization: fallback stays equivalent when action is missing', () => {
  const missingLabel = 'Acao inexistente';

  const duplicateFind = () => ({
    icon: QUICK_ACTIONS.find(action => action.label === missingLabel)?.icon || 'FileText',
    color: QUICK_ACTIONS.find(action => action.label === missingLabel)?.tone || 'bg-gray-50',
  });

  const singleFind = () => {
    const action = QUICK_ACTIONS.find(action => action.label === missingLabel);

    return {
      icon: action?.icon || 'FileText',
      color: action?.tone || 'bg-gray-50',
    };
  }

  expect(singleFind()).toEqual(duplicateFind());
});
