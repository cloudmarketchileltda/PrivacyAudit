'use client';
import { useRef, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
export type FeaturedResource = { label: string; title: string; description: string; href: string };
export function ResourceCarousel({ items }: { items: readonly FeaturedResource[] }) {
  const track = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);
  function move(next: number) {
    const child = track.current?.children[next] as HTMLElement | undefined;
    if (child && track.current)
      track.current.scrollTo({
        left: child.offsetLeft - (track.current.children[0] as HTMLElement).offsetLeft,
        behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches
          ? 'instant'
          : 'smooth',
      });
  }
  return (
    <section aria-label="Recursos destacados" aria-roledescription="carrusel" className="min-w-0">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <p className="eyebrow">Para acompañar su trabajo</p>
          <h2 className="section-title mb-0">Información destacada</h2>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="icon"
            disabled={index === 0}
            title="Destacado anterior"
            aria-label="Destacado anterior"
            onClick={() => move(index - 1)}
          >
            <ArrowLeft size={17} />
          </Button>
          <Button
            variant="outline"
            size="icon"
            disabled={index === items.length - 1}
            title="Siguiente destacado"
            aria-label="Siguiente destacado"
            onClick={() => move(index + 1)}
          >
            <ArrowRight size={17} />
          </Button>
        </div>
      </div>
      <div
        ref={track}
        className="relative flex snap-x snap-mandatory gap-4 overflow-x-auto rounded-2xl"
        onScroll={() => {
          const el = track.current;
          if (el) setIndex(Math.min(items.length - 1, Math.round(el.scrollLeft / el.clientWidth)));
        }}
      >
        {items.map((item, i) => (
          <article
            key={item.title}
            aria-label={`${i + 1} de ${items.length}`}
            aria-roledescription="diapositiva"
            className="panel w-full shrink-0 snap-start"
          >
            <div className="mb-4 flex items-center gap-2 text-xs font-medium text-blue-700">
              <BookOpen size={17} aria-hidden="true" />
              {item.label}
            </div>
            <h3 className="text-xl font-semibold tracking-tight">{item.title}</h3>
            <p className="muted mt-3 max-w-2xl">{item.description}</p>
            <Link
              href={item.href}
              className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-blue-700"
            >
              Consultar recurso <ArrowRight size={16} aria-hidden="true" />
            </Link>
          </article>
        ))}
      </div>
      <p className="mt-3 text-xs text-slate-500" aria-live="polite">
        Destacado {index + 1} de {items.length} · Deslice o use las flechas
      </p>
    </section>
  );
}
