import Link from "next/link";
import { Fragment } from "react";

// Model output is rendered as React text. Only narrow, internal record links
// become navigation; no HTML, images, remote URLs, styles or executable markup.
export function AgentAnswer({ text }: { text: string }) {
  const parts = text.split(
    /(\[[^\]\n]{1,120}\]\(\/(?:games\/[a-f0-9-]{36}|groups\/[a-zA-Z0-9_-]+|help\/[a-zA-Z0-9_-]+)\))/g
  );
  return (
    <div className="whitespace-pre-wrap break-words text-[15px] leading-7">
      {parts.map((part, index) => {
        const link =
          /^\[([^\]\n]{1,120})\]\((\/(?:games\/[a-f0-9-]{36}|groups\/[a-zA-Z0-9_-]+|help\/[a-zA-Z0-9_-]+))\)$/.exec(
            part
          );
        return (
          <Fragment key={`${index}-${part.slice(0, 20)}`}>
            {link ? (
              <Link
                href={link[2]}
                prefetch={false}
                className="text-primary underline underline-offset-4"
              >
                {link[1]}
              </Link>
            ) : (
              part
            )}
          </Fragment>
        );
      })}
    </div>
  );
}
