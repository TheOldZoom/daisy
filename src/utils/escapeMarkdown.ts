export default function escapeMarkdown(text: string): string {
  return text.replace(/([*_`~|\\])/g, "\\$1");
}
