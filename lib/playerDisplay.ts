/** Display label for a person of interest in selects and links. */
export function formatPlayerLabel(p: {
  discordUser: string;
  discordId: string;
}): string {
  return `@${p.discordUser} (${p.discordId})`;
}
