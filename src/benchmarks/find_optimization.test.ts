import { expect, test } from "bun:test";

const QUICK_ACTIONS = [
  { label: 'Tentei Contato', icon: 'PhoneCall', tone: 'text-[#00A89D] bg-[#E8F3F2] border-[#E8F3F2]' },
  { label: 'Retorno Agendado', icon: 'Clock', tone: 'text-[#F59F0A] bg-[#FFF7E6] border-[#FFF7E6]' },
  { label: 'Agendamento', icon: 'Calendar', tone: 'text-[#00A89D] bg-[#E8F3F2] border-[#E8F3F2]' },
  { label: 'Visita Feita', icon: 'UserCheck', tone: 'text-[#00A89D] bg-[#E8F3F2] border-[#E8F3F2]' },
  { label: 'Proposta', icon: 'FileText', tone: 'text-[#00A89D] bg-[#E8F3F2] border-[#E8F3F2]' },
  { label: 'Perdido', icon: 'XCircle', tone: 'text-[#EF4343] bg-[#FEECEC] border-[#FEECEC]' },
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
