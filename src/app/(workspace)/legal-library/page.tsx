import Link from 'next/link';
import { LegalAiPanel, type LegalAiStatus } from '@/features/legal-library/ai-panel';
import { BookOpen, Download, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { generalConfig } from '@/config/general';
import { requireUser } from '@/features/auth/queries';
import { filterLegalFaqs, legalFaqs } from '@/features/legal-library/content';

export default async function LegalLibraryPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string | string[]; category?: string | string[] }>;
}) {
  const { db, profile } = await requireUser();
  const { data: aiStatus, error: aiStatusError } = await db.rpc('legal_ai_status');
  const params = await searchParams;
  const query =
    typeof params.q === 'string' ? params.q.slice(0, generalConfig.search.maxLength) : '';
  const categories = [...new Set(legalFaqs.map((faq) => faq.category))];
  const category =
    typeof params.category === 'string' && categories.includes(params.category)
      ? params.category
      : '';
  const faqs = filterLegalFaqs(query, category);
  const config = generalConfig.legalLibrary;
  const document = config.document;
  const effective = new Date().toISOString().slice(0, 10) >= document.effectiveFrom;
  return (
    <>
      <div>
        <h1 className="flex items-center gap-3 text-2xl font-semibold">
          <BookOpen aria-hidden="true" />
          {config.title}
        </h1>
        <p className="mt-2 text-slate-600">
          Consulte la ley y encuentre orientación por tema en las preguntas frecuentes.
        </p>
      </div>
      <nav aria-label="Secciones del centro normativo" className="flex flex-wrap gap-2">
        <Button asChild variant="outline">
          <a href="#ley">Ley en PDF</a>
        </Button>
        <Button asChild variant="outline">
          <a href="#preguntas">Preguntas frecuentes</a>
        </Button>
        <Button asChild variant="outline">
          <a href="#consultar-ia">Consultar con IA</a>
        </Button>
      </nav>
      <LegalAiPanel
        status={aiStatusError ? null : (aiStatus as unknown as LegalAiStatus)}
        admin={profile.role === 'SUPER_ADMIN'}
      />
      <section
        id="ley"
        aria-labelledby="ley-title"
        className="rounded-xl border border-slate-200 bg-white p-5 space-y-4"
      >
        <div className="flex flex-wrap justify-between gap-4">
          <div>
            <h2 id="ley-title" className="text-xl font-semibold">
              {document.title}
            </h2>
            <p className="text-sm text-slate-600">
              Protección y tratamiento de datos personales · {document.pageCount} páginas
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button asChild>
              <a href={`${config.pdfHref}?download=1`}>
                <Download size={16} aria-hidden="true" />
                Descargar PDF
              </a>
            </Button>
            <Button asChild variant="outline">
              <a href={config.pdfHref} target="_blank" rel="noopener noreferrer">
                <ExternalLink size={16} aria-hidden="true" />
                Abrir PDF
              </a>
            </Button>
          </div>
        </div>
        <dl className="grid gap-3 text-sm sm:grid-cols-2 xl:grid-cols-4">
          <div>
            <dt className="text-slate-500">Publicación</dt>
            <dd>{document.publicationLabel}</dd>
          </div>
          <div>
            <dt className="text-slate-500">Vigencia del régimen reformado</dt>
            <dd>{document.effectiveLabel}</dd>
          </div>
          <div>
            <dt className="text-slate-500">Copia BCN generada</dt>
            <dd>{document.generatedLabel}</dd>
          </div>
          <div>
            <dt className="text-slate-500">Última modificación indicada en la copia</dt>
            <dd>{document.amendmentLabel}</dd>
          </div>
        </dl>
        <p className="rounded-lg bg-blue-50 p-3 text-sm text-blue-950">
          {effective
            ? 'El régimen reformado tiene vigencia desde la fecha indicada.'
            : 'Régimen reformado con vigencia diferida: hasta su entrada en vigor, estas FAQ sirven para preparar la adaptación.'}{' '}
          Esta es una copia versionada; consulte BCN para comprobar cambios posteriores. Los
          artículos reformados se integran en la Ley 19.628.
        </p>
        <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm">
          <a
            className="text-blue-700 underline"
            href={generalConfig.site.privacyLaw.href}
            target="_blank"
            rel="noopener noreferrer"
          >
            Ley 21.719 en BCN
          </a>
          <a
            className="text-blue-700 underline"
            href={config.currentLawHref}
            target="_blank"
            rel="noopener noreferrer"
          >
            Ley 19.628 en BCN
          </a>
          <a
            className="text-blue-700 underline"
            href={config.consolidatedLawHref}
            target="_blank"
            rel="noopener noreferrer"
          >
            Texto consolidado al 1 de diciembre de 2026
          </a>
        </div>
        <iframe
          title="Ley 21.719 en PDF"
          src={config.pdfHref}
          className="h-[65vh] min-h-96 w-full rounded-lg border border-slate-200"
        />
        <p className="text-sm text-slate-500">
          Si el visor no aparece en su dispositivo, utilice Abrir PDF o Descargar PDF. La búsqueda
          dentro del documento depende del visor del navegador.
        </p>
      </section>
      <section id="preguntas" aria-labelledby="faq-title" className="space-y-4 scroll-mt-5">
        <div>
          <h2 id="faq-title" className="text-xl font-semibold">
            Preguntas frecuentes
          </h2>
          <p className="text-sm text-slate-500">
            Actualización editorial: {config.faqUpdatedLabel} · Referencias al régimen reformado
          </p>
        </div>
        <p className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-950">
          {config.editorialNotice}
        </p>
        <form
          action={config.href}
          className="flex flex-wrap items-end gap-3 rounded-xl border border-slate-200 bg-white p-4"
        >
          <div className="min-w-48 flex-1">
            <label htmlFor="faq-search" className="mb-1 block text-sm font-medium">
              Buscar en preguntas y respuestas
            </label>
            <Input
              id="faq-search"
              name="q"
              type="search"
              defaultValue={query}
              maxLength={generalConfig.search.maxLength}
              placeholder="Por ejemplo: consentimiento, datos sensibles"
            />
          </div>
          <div>
            <label htmlFor="faq-category" className="mb-1 block text-sm font-medium">
              Tema
            </label>
            <select id="faq-category" name="category" defaultValue={category} className="field">
              <option value="">Todos los temas</option>
              {categories.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
          </div>
          <Button type="submit">Buscar</Button>
          <Button asChild variant="outline">
            <Link href={`${config.href}#preguntas`}>Limpiar</Link>
          </Button>
        </form>
        <p role="status" className="text-sm text-slate-500">
          {faqs.length} de {legalFaqs.length} preguntas
        </p>
        {faqs.length === 0 && (
          <p className="rounded-lg bg-white p-5">
            No hay coincidencias. Pruebe otras palabras o seleccione Todos los temas.
          </p>
        )}
        <div className="space-y-3">
          {faqs.map((faq) => (
            <details
              key={faq.id}
              id={`faq-${faq.id}`}
              className="rounded-xl border border-slate-200 bg-white p-4"
            >
              <summary className="cursor-pointer font-semibold">{faq.question}</summary>
              <div className="mt-3 space-y-3 text-sm">
                <p className="text-slate-500">{faq.category}</p>
                <p className="leading-relaxed text-slate-700">{faq.answer}</p>
                <p className="text-slate-500">Fundamento: {faq.reference}.</p>
                <a
                  className="text-blue-700 underline"
                  href={`${config.pdfHref}#page=${faq.page}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Ver fundamento en el PDF · página {faq.page}
                </a>
              </div>
            </details>
          ))}
        </div>
        <p className="text-sm text-slate-600">
          Para aplicar estas orientaciones a un caso concreto, contacte a su consultor por el medio
          acordado. Las FAQ son contenido editorial. El asistente IA es un piloto independiente y no
          envía consultas al consultor.
        </p>
      </section>
    </>
  );
}
