export const LEDGER_QUOTES = ["Because I knew you.\nWait just a clock tick."] as const;

export function getRandomQuote(currentQuote?: string | null) {
  if (LEDGER_QUOTES.length === 1) {
    return LEDGER_QUOTES[0];
  }

  const availableQuotes = currentQuote
    ? LEDGER_QUOTES.filter((quote) => quote !== currentQuote)
    : LEDGER_QUOTES;

  const nextIndex = Math.floor(Math.random() * availableQuotes.length);

  return availableQuotes[nextIndex];
}
