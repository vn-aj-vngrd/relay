import Link from "next/link";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import styles from "./answer.module.css";

const plugins = [remarkGfm];
const sourcePath =
  /^\/(?:games\/[a-f0-9-]{36}|groups\/[a-zA-Z0-9_-]+|help\/[a-zA-Z0-9_-]+|courts\/[a-zA-Z0-9_-]+)$/;

// Both user and model content are untrusted. No raw HTML, remote resources,
// arbitrary routes, or executable URLs are rendered.
export function AgentAnswer({ text }: { text: string }) {
  return (
    <div className={styles.markdown}>
      <Markdown
        remarkPlugins={plugins}
        skipHtml
        disallowedElements={["img", "input"]}
        urlTransform={(url) => (sourcePath.test(url) ? url : "")}
        components={{
          a: ({ href, children }) =>
            href && sourcePath.test(href) ? (
              <Link
                href={href}
                prefetch={false}
                className="text-primary underline underline-offset-4"
              >
                {children}
              </Link>
            ) : (
              <span>{children}</span>
            ),
          table: ({ children }) => (
            <div className={styles.tableScroll}>
              <table>{children}</table>
            </div>
          ),
        }}
      >
        {text.trim()}
      </Markdown>
    </div>
  );
}
