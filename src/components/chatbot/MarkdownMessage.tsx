import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";

interface MarkdownMessageProps {
  content: string;
}

function isSafeHref(href?: string): boolean {
  if (!href) return false;
  return (
    href.startsWith("https://") ||
    href.startsWith("http://") ||
    href.startsWith("/")
  );
}

const markdownComponents: Components = {
  h1: ({ children }) => (
    <h1 className="mt-3 mb-1.5 text-base font-bold text-[#0F172A] first:mt-0">
      {children}
    </h1>
  ),
  h2: ({ children }) => (
    <h2 className="mt-3 mb-1.5 text-sm font-bold text-[#0F172A] first:mt-0">
      {children}
    </h2>
  ),
  h3: ({ children }) => (
    <h3 className="mt-2.5 mb-1 text-sm font-semibold text-[#0F172A] first:mt-0">
      {children}
    </h3>
  ),
  p: ({ children }) => (
    <p className="mb-2 text-justify leading-relaxed text-[#0F172A] last:mb-0">
      {children}
    </p>
  ),
  strong: ({ children }) => (
    <strong className="font-semibold text-[#0F172A]">{children}</strong>
  ),
  ul: ({ children }) => (
    <ul className="mb-2 list-disc space-y-1 pl-5 text-[#0F172A] last:mb-0">
      {children}
    </ul>
  ),
  ol: ({ children }) => (
    <ol className="mb-2 list-decimal space-y-1 pl-5 text-[#0F172A] last:mb-0">
      {children}
    </ol>
  ),
  li: ({ children }) => <li className="text-justify leading-relaxed">{children}</li>,
  blockquote: ({ children }) => (
    <blockquote className="my-2 border-l-2 border-[#93C5FD] bg-[#F8FAFC] py-1 pl-3 pr-2 text-xs text-[#475569]">
      {children}
    </blockquote>
  ),
  pre: ({ children }) => (
    <pre className="my-2 overflow-x-auto rounded-lg bg-[#0F172A] p-3 text-xs text-[#F8FAFC]">
      {children}
    </pre>
  ),
  code: ({ className, children, ...props }) => {
    const isCodeBlock = Boolean(className && className.includes("language-"));
    if (isCodeBlock) {
      return (
        <code className="font-mono text-xs" {...props}>
          {children}
        </code>
      );
    }
    return (
      <code
        className="rounded bg-[#F1F5F9] px-1.5 py-0.5 font-mono text-[12px] text-[#1E3A8A]"
        {...props}
      >
        {children}
      </code>
    );
  },
  table: ({ children }) => (
    <div className="my-2 overflow-x-auto rounded-lg border border-[#E2E8F0]">
      <table className="w-full border-collapse text-left text-xs">{children}</table>
    </div>
  ),
  thead: ({ children }) => (
    <thead className="bg-[#F8FAFC] text-[#0F172A]">{children}</thead>
  ),
  th: ({ children }) => (
    <th className="border-b border-[#E2E8F0] px-3 py-2 font-semibold">{children}</th>
  ),
  td: ({ children }) => (
    <td className="border-b border-[#F1F5F9] px-3 py-2 text-[#334155]">{children}</td>
  ),
  hr: () => <hr className="my-3 border-[#E2E8F0]" />,
  a: ({ href, children }) =>
    isSafeHref(href) ? (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="font-medium text-[#1D4ED8] underline hover:text-[#1E40AF]"
      >
        {children}
      </a>
    ) : (
      <span>{children}</span>
    ),
};

export function MarkdownMessage({ content }: MarkdownMessageProps) {
  return (
    <div className="min-w-0 break-words text-sm">
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
        {content}
      </ReactMarkdown>
    </div>
  );
}
