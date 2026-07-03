export function formatBRL(value) {
  const num = isNaN(value) ? 0 : (value || 0);
  return num.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}