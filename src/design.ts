import { Theme, themeColors, themes } from "./model";
function luminance(hex: string): number {
  const c = [0, 2, 4]
    .map((index) => parseInt(hex.slice(index, index + 2), 16) / 255)
    .map((value) =>
      value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4,
    );
  return c[0] * 0.2126 + c[1] * 0.7152 + c[2] * 0.0722;
}
export function contrastRatio(first: string, second: string): number {
  const a = luminance(first),
    b = luminance(second);
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
}
export const themeTone = (theme: Theme) =>
  luminance(themeColors[theme].bg) > 0.4 ? "light" : "dark";
export function filterThemes(query: string, category: string, tone: string) {
  const needle = query.trim().toLocaleLowerCase("az");
  return themes.filter(
    (theme) =>
      (category === "all" || theme.category === category) &&
      (tone === "all" || themeTone(theme.id) === tone) &&
      (!needle ||
        `${theme.name} ${theme.note} ${theme.category}`
          .toLocaleLowerCase("az")
          .includes(needle)),
  );
}
