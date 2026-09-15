export function agentChatTitle(prompt: string) {
  const text = prompt
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/[*_`#>~]/g, "")
    .replace(/\s+/g, " ")
    .trim();
  if (!text) return "Untitled chat";
  const title = text[0].toLocaleUpperCase() + text.slice(1);
  return title.length <= 80
    ? title
    : `${title
        .slice(0, 79)
        .replace(/[\uD800-\uDBFF]$/, "")
        .trimEnd()}…`;
}
