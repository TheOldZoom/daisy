export function getUserId(input: string): string | null {
  const match = input.match(/^\\?<@!?(\d+)>$|^\\?(\d+)$/);
  return match ? match[1] || match[2] : null;
}
