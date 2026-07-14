export function ManagerDataErrorState({ title }: { title: string }) {
  return (
    <div className="rounded-2xl border border-red-100 bg-red-50 p-6 text-red-800" role="alert">
      <h2 className="text-base font-semibold">{title}</h2>
      <p className="mt-2 text-sm">Tente novamente em alguns instantes ou contate o suporte.</p>
    </div>
  )
}
