import type { ReactNode } from 'react';
import { Link } from 'react-router';

interface PageProps {
  title: string;
  /** Ruta a la que vuelve la flecha; si no se indica, no hay flecha. */
  back?: string;
  actions?: ReactNode;
  children: ReactNode;
}

export function Page({ title, back, actions, children }: PageProps) {
  return (
    <>
      <header className="app-bar">
        {back ? (
          <Link to={back} className="app-bar__icon" aria-label="Volver">
            ←
          </Link>
        ) : (
          <img src="./icons/icon.svg" alt="" width={32} height={32} style={{ borderRadius: 8 }} />
        )}
        <h1 className="app-bar__title" style={{ margin: 0, fontSize: '1.05rem' }}>
          {title}
        </h1>
        {actions}
      </header>
      <main className="page">{children}</main>
    </>
  );
}

export function EmptyState({ children }: { children: ReactNode }) {
  return <div className="empty">{children}</div>;
}

export function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <label className="field">
      <span className="field__label">{label}</span>
      {children}
      {hint ? <span className="field__hint">{hint}</span> : null}
    </label>
  );
}

export function Loading() {
  return <p className="muted center" style={{ padding: '2rem' }}>Cargando…</p>;
}

export function NotFound({ what, back = '/' }: { what: string; back?: string }) {
  return (
    <Page title="No encontrado" back={back}>
      <EmptyState>
        <p>No se ha encontrado {what}.</p>
        <Link to={back} className="btn">
          Volver
        </Link>
      </EmptyState>
    </Page>
  );
}
