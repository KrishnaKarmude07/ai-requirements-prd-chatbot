// Select the relevant tail of a chronological conversation within a character budget.
export function buildContext(chronological, charBudget) {
  const usable = chronological.filter((m) => m.role === 'user' || m.role === 'assistant');
  const kept = [];
  let used = 0;
  for (let i = usable.length - 1; i >= 0; i--) {
    const len = usable[i].content.length;
    if (kept.length > 0 && used + len > charBudget) break; // always keep the newest message
    kept.push(usable[i]);
    used += len;
  }
  kept.reverse();
  const truncated = kept.length < usable.length;
  while (kept.length && kept[0].role !== 'user') kept.shift(); // API requires a leading user turn
  const merged = [];
  for (const m of kept) {
    const last = merged[merged.length - 1];
    if (last && last.role === m.role) last.content += '\n\n' + m.content; // e.g. user msg whose AI call failed
    else merged.push({ role: m.role, content: m.content });
  }
  return { messages: merged, truncated };
}
