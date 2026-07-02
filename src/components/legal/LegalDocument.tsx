import fs from "node:fs";
import path from "node:path";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import type { Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import { Logo } from "@/components/ui/Logo";

// Element styling for the rendered markdown. Kept here (rather than a Tailwind
// Typography `prose` block) so the pages stay dependency-light and use the
// site's own brand tokens directly.
const markdownComponents: Components = {
  h1: ({ children }) => (
    <h1 className="text-3xl font-bold tracking-tight text-brand-ink">{children}</h1>
  ),
  h2: ({ children }) => (
    <h2 className="mt-10 mb-3 text-xl font-semibold text-brand-ink">{children}</h2>
  ),
  h3: ({ children }) => (
    <h3 className="mt-6 mb-2 text-base font-semibold text-foreground">{children}</h3>
  ),
  p: ({ children }) => (
    <p className="mb-4 text-[15px] leading-7 text-muted-foreground">{children}</p>
  ),
  ul: ({ children }) => (
    <ul className="mb-4 list-disc space-y-2 pl-6 text-[15px] leading-7 text-muted-foreground">
      {children}
    </ul>
  ),
  ol: ({ children }) => (
    <ol className="mb-4 list-decimal space-y-2 pl-6 text-[15px] leading-7 text-muted-foreground">
      {children}
    </ol>
  ),
  li: ({ children }) => <li className="pl-1">{children}</li>,
  a: ({ href, children }) => (
    <a
      href={href}
      className="break-words text-primary underline underline-offset-2 hover:opacity-80"
    >
      {children}
    </a>
  ),
  strong: ({ children }) => (
    <strong className="font-semibold text-foreground">{children}</strong>
  ),
  em: ({ children }) => <em className="italic">{children}</em>,
  hr: () => <hr className="my-8 border-border" />,
  code: ({ children }) => (
    <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-[0.85em] text-foreground">
      {children}
    </code>
  ),
  table: ({ children }) => (
    <div className="my-6 overflow-x-auto">
      <table className="w-full border-collapse text-left text-sm">{children}</table>
    </div>
  ),
  th: ({ children }) => (
    <th className="border-b border-border py-2.5 pr-4 align-top font-semibold text-foreground">
      {children}
    </th>
  ),
  td: ({ children }) => (
    <td className="border-b border-border py-2.5 pr-4 align-top text-muted-foreground">
      {children}
    </td>
  ),
};

type LegalDocumentProps = {
  /** File name inside `src/content/legal`, e.g. `privacy-policy.md`. */
  file: string;
};

export function LegalDocument({ file }: LegalDocumentProps) {
  const markdown = fs.readFileSync(
    path.join(process.cwd(), "src/content/legal", file),
    "utf8",
  );

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-3xl px-5 py-4">
          <Link href="/" aria-label="Skywage home">
            <Logo variant="color" width={140} height={33} />
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-5 py-10 md:py-14">
        <article>
          <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
            {markdown}
          </ReactMarkdown>
        </article>

        <nav className="mt-12 flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-border pt-6 text-sm">
          <Link href="/privacy" className="text-primary underline underline-offset-2">
            Privacy Policy
          </Link>
          <Link href="/terms" className="text-primary underline underline-offset-2">
            Terms of Service
          </Link>
          <a
            href="mailto:support@skywage.ae"
            className="text-primary underline underline-offset-2"
          >
            support@skywage.ae
          </a>
        </nav>
      </main>
    </div>
  );
}
