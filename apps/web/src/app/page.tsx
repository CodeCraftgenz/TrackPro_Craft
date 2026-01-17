import Link from 'next/link';
import { Route } from 'next';

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl font-bold text-primary">TrackPro</span>
          </div>
          <nav className="hidden gap-6 md:flex">
            <Link href={"/#features" as Route} className="text-sm font-medium text-muted-foreground hover:text-primary">
              Features
            </Link>
            <Link href={"/#pricing" as Route} className="text-sm font-medium text-muted-foreground hover:text-primary">
              Pricing
            </Link>
            <Link href={"/#blog" as Route} className="text-sm font-medium text-muted-foreground hover:text-primary">
              Blog
            </Link>
          </nav>
          <div className="flex items-center gap-4">
            <Link
              href="/login"
              className="text-sm font-medium text-muted-foreground hover:text-primary"
            >
              Login
            </Link>
            <Link
              href="/register"
              className="inline-flex h-9 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90"
            >
              Comece Grátis
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <section className="container flex flex-col items-center justify-center gap-6 pb-8 pt-6 md:py-10 lg:py-32">
          <div className="mx-auto flex max-w-[980px] flex-col items-center gap-4 text-center">
            <span className="rounded-full bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary">
              First-Party Analytics
            </span>
            <h1 className="text-4xl font-bold leading-tight tracking-tighter md:text-6xl lg:leading-[1.1]">
              Tracking de alta precisão,
              <br />
              <span className="text-primary">100% server-side</span>
            </h1>
            <p className="max-w-[750px] text-lg text-muted-foreground sm:text-xl">
              Capture dados first-party sem depender de cookies de terceiros.
              Integração nativa com Meta CAPI para máxima atribuição de conversões.
              LGPD compliant desde o primeiro pixel.
            </p>
          </div>
          <div className="flex gap-4">
            <Link
              href="/register"
              className="inline-flex h-11 items-center justify-center rounded-md bg-primary px-8 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90"
            >
              Começar Agora
            </Link>
            <Link
              href={"/#features" as Route}
              className="inline-flex h-11 items-center justify-center rounded-md border border-input bg-background px-8 text-sm font-medium shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground"
            >
              Ver Features
            </Link>
          </div>
        </section>

        <section className="container py-12 md:py-24">
          <div className="mx-auto grid max-w-5xl gap-8 md:grid-cols-3">
            <div className="flex flex-col gap-2 rounded-lg border p-6">
              <h3 className="text-lg font-semibold">First-Party Data</h3>
              <p className="text-sm text-muted-foreground">
                Dados coletados diretamente do seu domínio. Sem bloqueios de ad blockers,
                sem dependência de cookies de terceiros.
              </p>
            </div>
            <div className="flex flex-col gap-2 rounded-lg border p-6">
              <h3 className="text-lg font-semibold">Meta CAPI Nativo</h3>
              <p className="text-sm text-muted-foreground">
                Envio server-side automático para Conversions API do Meta.
                Melhore seu Event Match Quality e reduza custo por conversão.
              </p>
            </div>
            <div className="flex flex-col gap-2 rounded-lg border p-6">
              <h3 className="text-lg font-semibold">LGPD Compliant</h3>
              <p className="text-sm text-muted-foreground">
                Gestão de consentimento integrada. Respeite a privacidade dos usuários
                com controles granulares por categoria.
              </p>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t py-6 md:py-0">
        <div className="container flex flex-col items-center justify-between gap-4 md:h-16 md:flex-row">
          <p className="text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} TrackPro. Todos os direitos reservados.
          </p>
          <div className="flex gap-4">
            <Link href={"/#privacy" as Route} className="text-sm text-muted-foreground hover:text-primary">
              Privacidade
            </Link>
            <Link href={"/#terms" as Route} className="text-sm text-muted-foreground hover:text-primary">
              Termos
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
