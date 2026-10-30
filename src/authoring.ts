import {
  citationLabel,
  DesignSettings,
  inspectDeck,
  layoutFor,
  Layout,
  Project,
  Reference,
  safeFileName,
  Slide,
  uid,
  visibleSlideText,
  wordCount,
} from "./model";

export function filterSlides(
  slides: Slide[],
  query: string,
  layout: Layout | "all",
  problemsOnly: boolean,
  references: Reference[] = [],
  design?: DesignSettings,
) {
  const needle = query.trim().toLocaleLowerCase("az");
  const issues = new Set(
    inspectDeck(slides, references, design).map((issue) => issue.slideId),
  );
  return slides
    .map((slide, index) => ({ slide, index, hasIssue: issues.has(slide.id) }))
    .filter(
      ({ slide, index, hasIssue }) =>
        (!needle ||
          `${visibleSlideText(slide)} ${slide.notes || ""}`
            .toLocaleLowerCase("az")
            .includes(needle)) &&
        (layout === "all" || layoutFor(slide, index) === layout) &&
        (!problemsOnly || hasIssue),
    );
}
export function slideStats(slide: Slide) {
  const words = wordCount(visibleSlideText(slide));
  return { words, seconds: Math.ceil((words * 60) / 110) };
}
// A pacing suggestion, not a measurement of the student's speaking speed.
export function allocateSeconds(slides: Slide[], minutes: number): number[] {
  if (!slides.length) return [];
  const target = Math.max(0, Math.round(minutes * 60));
  const weights = slides.map((slide) =>
    Math.max(10, wordCount(slide.notes?.trim() || visibleSlideText(slide))),
  );
  const sum = weights.reduce((a, b) => a + b, 0);
  const exact = weights.map((weight) => (target * weight) / sum);
  const result = exact.map(Math.floor);
  const order = exact
    .map((value, index) => ({ index, fraction: value - result[index] }))
    .sort((a, b) => b.fraction - a.fraction || a.index - b.index);
  const remaining = target - result.reduce((a, b) => a + b, 0);
  for (let i = 0; i < remaining; i++) result[order[i].index]++;
  return result;
}
export function slideText(slide: Slide): string {
  const lines = [slide.title, slide.body];
  if (slide.layout === "table" && slide.table) {
    lines.push(
      slide.table.columns.join(" | "),
      ...slide.table.rows.map((row) => row.join(" | ")),
    );
  }
  if (slide.layout === "chart" && slide.chart) {
    lines.push(
      slide.chart.name,
      ...slide.chart.points.map(
        (point) =>
          `${point.label}: ${point.value}${slide.chart?.unit ? ` ${slide.chart.unit}` : ""}`,
      ),
    );
  }
  if (slide.layout === "comparison" && slide.comparison) {
    const c = slide.comparison;
    lines.push(`${c.leftTitle}: ${c.left}`, `${c.rightTitle}: ${c.right}`);
  }
  if (slide.layout === "timeline" && slide.timeline) {
    lines.push(
      ...slide.timeline.steps.map((step) =>
        [step.label, step.title, step.body].filter(Boolean).join(" — "),
      ),
    );
  }
  if (slide.layout === "image" && slide.image)
    lines.push(
      `Şəkil: ${slide.image.alt}`,
      slide.image.credit ? `Şəkil mənbəyi: ${slide.image.credit}` : "",
    );
  if (slide.citations?.length)
    lines.push(`Mənbələr: ${citationLabel(slide.citations)}`);
  return lines.filter((line) => line.trim()).join("\n\n");
}
const markdown = (text: string) => text.replace(/[\\`*_{}\[\]<>#|~]/g, "\\$&");
export function outlineMarkdown(project: Project): string {
  const metadata = [
    project.subject && `Fənn: ${project.subject}`,
    project.author && `Hazırlayan: ${project.author}`,
  ]
    .filter(Boolean)
    .map((line) => markdown(String(line)))
    .join("\n\n");
  return (
    `# ${markdown(project.topic)}\n\n${metadata}\n\n` +
    project.slides
      .map(
        (slide, i) =>
          `## ${i + 1}. ${markdown(slide.title)}\n\n${markdown(slideText({ ...slide, title: "" }))}`,
      )
      .join("\n\n") +
    "\n"
  );
}
export function speakerText(project: Project): string {
  return (
    [
      project.topic,
      project.author,
      ...project.slides.map(
        (slide, i) =>
          `${i + 1}. ${slide.title}\n\n${slide.notes?.trim() || "Bu slayd üçün çıxış qeydi əlavə edilməyib."}${slide.citations?.length ? `\n\nMənbələr: ${citationLabel(slide.citations)}` : ""}`,
      ),
    ]
      .filter(Boolean)
      .join("\n\n---\n\n") + "\n"
  );
}
export function downloadText(
  topic: string,
  suffix: string,
  content: string,
  markdownFile: boolean | "tsv" = false,
) {
  const safe = safeFileName(topic, 90);
  const blob = new Blob(["\uFEFF", content], {
    type:
      markdownFile === true
        ? "text/markdown;charset=utf-8"
        : markdownFile === "tsv"
          ? "text/tab-separated-values;charset=utf-8"
          : "text/plain;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  try {
    link.href = url;
    link.download = `${safe}-${suffix}.${markdownFile === true ? "md" : markdownFile === "tsv" ? "tsv" : "txt"}`;
    document.body.append(link);
    link.click();
  } finally {
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
}
export function parseOutline(text: string): Slide[] {
  if (text.length > 240000)
    throw new Error("Plan mətni ən çox 240 000 simvol ola bilər.");
  const blocks: { title: string; lines: string[] }[] = [];
  for (const line of text
    .replace(/^\uFEFF/, "")
    .replace(/\r\n?/g, "\n")
    .split("\n")) {
    const heading = line.match(/^#{1,2}\s+(.+?)\s*$/);
    if (heading) {
      if (blocks.length >= 80)
        throw new Error("Bir planda ən çox 80 slayd ola bilər.");
      if (heading[1].length > 160)
        throw new Error("Slayd başlığı ən çox 160 simvol ola bilər.");
      blocks.push({ title: heading[1], lines: [] });
    } else if (blocks.length) blocks.at(-1)!.lines.push(line);
    else if (line.trim())
      throw new Error("Hər slaydı # Başlıq və ya ## Başlıq sətri ilə başlat.");
  }
  if (!blocks.length)
    throw new Error("Ən azı bir slayd başlığı əlavə et: # Başlıq.");
  return blocks.map((block, i) => {
    const body = block.lines.join("\n").trim();
    if (body.length > 3000)
      throw new Error(
        `${i + 1}-ci slaydın mətni 3000 simvolu keçir. Ayrı başlıqlara böl.`,
      );
    if (
      /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(block.title + body)
    )
      throw new Error("Planda dəstəklənməyən idarəetmə simvolları var.");
    return { id: uid(), title: block.title, body, layout: "text" };
  });
}
