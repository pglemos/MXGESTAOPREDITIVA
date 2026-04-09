export const TARGET_ROLES = ['todos', 'dono', 'gerente', 'vendedor'] as const;
export type TargetRole = typeof TARGET_ROLES[number];
