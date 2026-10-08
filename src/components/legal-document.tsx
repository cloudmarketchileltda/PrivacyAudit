export function LegalDocument({
  title,
  introduction,
  sections,
}: {
  title: string;
  introduction: string;
  sections: readonly { title: string; text: string }[];
}) {
  return (
    <article className="panel space-y-7">
      <header className="space-y-3">
        <h1 className="page-title">{title}</h1>
        <p className="muted">Texto inicial · Actualizado el 8 de octubre de 2026</p>
        <p className="text-sm leading-7 text-slate-700">{introduction}</p>
      </header>
      {sections.map((section) => (
        <section key={section.title}>
          <h2 className="section-title">{section.title}</h2>
          <p className="text-sm leading-7 text-slate-700">{section.text}</p>
        </section>
      ))}
    </article>
  );
}
