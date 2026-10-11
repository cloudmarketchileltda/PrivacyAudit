type DistributionItem = { label: string; value: number; color: string };

/** Each bar uses the same denominator: all records in this distribution. */
export function DistributionChart({
  title,
  description,
  items,
}: {
  title: string;
  description: string;
  items: DistributionItem[];
}) {
  const total = items.reduce((sum, item) => sum + item.value, 0);
  return (
    <figure className="panel min-w-0" aria-label={title}>
      <figcaption>
        <h2 className="section-title">{title}</h2>
        <p className="muted">{description}</p>
      </figcaption>
      {total === 0 ? (
        <p className="mt-5 text-sm text-slate-500">Sin registros para mostrar.</p>
      ) : (
        <ul className="mt-5 space-y-4">
          {items.map(({ label, value, color }) => {
            const percentage = (value * 100) / total;
            return (
              <li key={label}>
                <div className="mb-1.5 flex flex-wrap justify-between gap-x-3 gap-y-1 text-sm">
                  <span>{label}</span>
                  <span className="font-semibold tabular-nums">
                    {value}{' '}
                    <span className="font-normal text-slate-500">({Math.round(percentage)}%)</span>
                  </span>
                </div>
                <div aria-hidden="true" className="h-3 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className={`h-full rounded-full ${color}`}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </li>
            );
          })}
        </ul>
      )}
      <p className="muted mt-5">Total: {total}. Porcentajes sobre este total, redondeados.</p>
    </figure>
  );
}
