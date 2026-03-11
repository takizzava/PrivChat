/**
 * AI Chat Coach skeleton.
 * For MVP: returns static hints; real model integration later.
 */

export type CoachHint = {
  kind: "tone" | "clarity" | "safety";
  message: string;
};

export function generateCoachHints(draft: string): CoachHint[] {
  const hints: CoachHint[] = [];
  if (draft.length > 200) {
    hints.push({
      kind: "clarity",
      message: "Сообщение довольно длинное — подумайте, можно ли упростить."
    });
  }
  if (/[A-ZА-Я]{6,}/.test(draft)) {
    hints.push({
      kind: "tone",
      message:
        "Много ЗАГЛАВНЫХ букв может восприниматься как крик. Уточните тон."
    });
  }
  return hints;
}

