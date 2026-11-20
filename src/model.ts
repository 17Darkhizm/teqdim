export type Theme =
  | "sage"
  | "violet"
  | "paper"
  | "atelier"
  | "blueprint"
  | "sunset"
  | "noir"
  | "caspian"
  | "heritage"
  | "prism";
export type DesignSettings = {
  headingFont: "default" | "sans" | "serif";
  textSize: "regular" | "large";
  decoration: "full" | "minimal";
  showNumbers: boolean;
};
export const defaultDesign: DesignSettings = {
  headingFont: "default",
  textSize: "regular",
  decoration: "full",
  showNumbers: true,
};
export function isDesignSettings(value: unknown): value is DesignSettings {
  if (!value || typeof value !== "object") return false;
  const design = value as DesignSettings;
  return (
    ["default", "sans", "serif"].includes(design.headingFont) &&
    ["regular", "large"].includes(design.textSize) &&
    ["full", "minimal"].includes(design.decoration) &&
    typeof design.showNumbers === "boolean"
  );
}
export const resolveDesign = (value?: DesignSettings): DesignSettings =>
  value || defaultDesign;
export function headingFontFor(theme: Theme, design?: DesignSettings): string {
  const preference = resolveDesign(design).headingFont;
  return preference === "serif" ||
    (preference === "default" && ["sunset", "heritage"].includes(theme))
    ? "Georgia"
    : "Arial";
}
export type Citation = { sourceId: string; name: string; page: number };
export type Reference = {
  id: string;
  name: string;
  pageCount: number;
  pages: { number: number; text: string }[];
};
export type Layout =
  | "cover"
  | "text"
  | "bullets"
  | "columns"
  | "statement"
  | "table"
  | "chart"
  | "comparison"
  | "timeline"
  | "image";
export type ComparisonData = {
  leftTitle: string;
  rightTitle: string;
  left: string;
  right: string;
};
export type TimelineData = {
  steps: { label: string; title: string; body: string }[];
};
export type ImageAsset = {
  data: string;
  width: number;
  height: number;
  alt: string;
  credit: string;
};
export type TableData = { columns: string[]; rows: string[][] };
export type ChartData = {
  type: "bar" | "line";
  name: string;
  unit: string;
  points: { label: string; value: string }[];
};
export type Slide = {
  id: string;
  title: string;
  body: string;
  citations?: Citation[];
  layout?: Layout;
  notes?: string;
  citationReview?: boolean;
  /** Kept in the editor but left out of presenting, practice, PPTX and print. */
  hidden?: boolean;
  table?: TableData;
  chart?: ChartData;
  comparison?: ComparisonData;
  timeline?: TimelineData;
  image?: ImageAsset;
};
export type Project = {
  id: string;
  topic: string;
  subject: string;
  author: string;
  theme: Theme;
  design?: DesignSettings;
  slides: Slide[];
  references?: Reference[];
  material?: string;
  updatedAt: string;
  brief?: AcademicBrief;
};
export type AcademicBrief = {
  purpose: "seminar" | "coursework" | "project";
  audience: "classmates" | "teacher" | "general";
  institution: string;
  teacher: string;
  group: string;
  goal: string;
  targetMinutes: number;
};
export const defaultBrief: AcademicBrief = {
  purpose: "seminar",
  audience: "classmates",
  institution: "",
  teacher: "",
  group: "",
  goal: "",
  targetMinutes: 5,
};
export const purposes = [
  { id: "seminar", name: "Seminar", detail: "Mövzunu izah et, müzakirə aç" },
  {
    id: "coursework",
    name: "Kurs işi",
    detail: "Araşdırmanı və nəticələrini müdafiə et",
  },
  {
    id: "project",
    name: "Layihə",
    detail: "Həlli, nəticəni və növbəti addımı göstər",
  },
] as const;
export const audiences = [
  { id: "classmates", name: "Tələbələr" },
  { id: "teacher", name: "Müəllim / komissiya" },
  { id: "general", name: "Ümumi auditoriya" },
] as const;
export const coverDetails = (brief?: AcademicBrief) =>
  brief
    ? [
        brief.institution.trim(),
        brief.group.trim() ? `Qrup: ${brief.group.trim()}` : "",
        brief.teacher.trim() ? `Müəllim: ${brief.teacher.trim()}` : "",
      ]
        .filter(Boolean)
        .join(" · ")
    : "";
export function isAcademicBrief(value: unknown): value is AcademicBrief {
  if (!value || typeof value !== "object") return false;
  const b = value as AcademicBrief;
  return (
    purposes.some((p) => p.id === b.purpose) &&
    audiences.some((a) => a.id === b.audience) &&
    [3, 5, 7, 10, 15, 20].includes(b.targetMinutes) &&
    typeof b.institution === "string" &&
    b.institution.length <= 120 &&
    typeof b.teacher === "string" &&
    b.teacher.length <= 90 &&
    typeof b.group === "string" &&
    b.group.length <= 40 &&
    typeof b.goal === "string" &&
    b.goal.length <= 160
  );
}
export const uid = () => crypto.randomUUID();
// Windows-safe download name: no reserved/control characters or trailing dots.
export const safeFileName = (topic: string, max = 80) =>
  topic
    .replace(/[<>:"/\\|?*\u0000-\u001f\u007f]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, max)
    .replace(/[. ]+$/g, "") || "Teqdim";
export const themes: {
  id: Theme;
  name: string;
  note: string;
  category: string;
}[] = [
  {
    id: "sage",
    name: "Botanika",
    note: "Sakit və düşünülmüş",
    category: "Minimal",
  },
  {
    id: "atelier",
    name: "Atelye",
    note: "Jurnal üslubu, iri hərflər",
    category: "Yaradıcı",
  },
  {
    id: "blueprint",
    name: "Çertyoj",
    note: "Texniki və dəqiq",
    category: "Texnologiya",
  },
  {
    id: "sunset",
    name: "Şəfəq",
    note: "İsti rənglər, sərbəst formalar",
    category: "Yaradıcı",
  },
  {
    id: "noir",
    name: "İmpuls",
    note: "Kəskin kontrast, güclü fikir",
    category: "Cəsarətli",
  },
  {
    id: "violet",
    name: "Orbita",
    note: "Cəsarətli və müasir",
    category: "Müasir",
  },
  { id: "paper", name: "Akademik", note: "Sadə və aydın", category: "Klassik" },
  {
    id: "caspian",
    name: "Xəzər",
    note: "Dəniz rəngləri və axıcı xətlər",
    category: "Minimal",
  },
  {
    id: "heritage",
    name: "İrs",
    note: "İsti kağız, çərçivə və həndəsi künclər",
    category: "Klassik",
  },
  {
    id: "prism",
    name: "Prizma",
    note: "Ofset həndəsə və aydın mavi aksent",
    category: "Müasir",
  },
];
export const themeColors = {
  sage: { bg: "163D35", fg: "F5F4E9", accent: "D9EF9C" },
  violet: { bg: "30235C", fg: "FAF7FF", accent: "D6BEFF" },
  paper: { bg: "F1EDE3", fg: "282B29", accent: "47735F" },
  atelier: { bg: "F5EBDD", fg: "342D29", accent: "DB4D2E" },
  blueprint: { bg: "112F60", fg: "F0F6FF", accent: "86DCEB" },
  sunset: { bg: "F8D3C3", fg: "522E48", accent: "A64360" },
  noir: { bg: "181B1A", fg: "F1F4EC", accent: "C9F66B" },
  caspian: { bg: "073C4A", fg: "F2FAF7", accent: "71E1CF" },
  heritage: { bg: "FAF1DE", fg: "452637", accent: "8E2949" },
  prism: { bg: "F4F6FF", fg: "17234F", accent: "294FD8" },
};
export const citationLabel = (citations: Citation[] = []) =>
  citations.map((c) => `${c.name} · ${sourcePosition(c.name, c.page)}`).join("; ");
export const sourcePosition = (name: string, page: number, full = false) =>
  /\.pdf$/i.test(name) ? `${full ? "Səhifə" : "səh."} ${page}` : "Sənəd mətni";
export const layouts: { id: Layout; name: string; detail: string }[] = [
  { id: "cover", name: "Üz qabığı", detail: "İri başlıq və qısa giriş" },
  { id: "text", name: "Mətn", detail: "Başlıq və əsas izah" },
  { id: "bullets", name: "Məqamlar", detail: "Hər abzas ayrıca məqam" },
  { id: "columns", name: "İki sütun", detail: "Mətn iki hissədə göstərilir" },
  { id: "statement", name: "Vurğu", detail: "Bir fikri ön plana çıxar" },
  {
    id: "table",
    name: "Cədvəl",
    detail: "Məlumatları sətir və sütunlarda göstər",
  },
  {
    id: "chart",
    name: "Diaqram",
    detail: "Öz rəqəmlərini sütun və ya xətt diaqramında göstər",
  },
  {
    id: "comparison",
    name: "Müqayisə",
    detail: "İki yanaşmanı ayrı kartlarda müqayisə et",
  },
  {
    id: "timeline",
    name: "Mərhələlər",
    detail: "Proses və ya ardıcıllığı mərhələlərlə göstər",
  },
  {
    id: "image",
    name: "Şəkilli izah",
    detail: "Şəxsi şəklini izah və mənbə sətri ilə təqdim et",
  },
];
export const emptyComparison = (): ComparisonData => ({
  leftTitle: "Birinci yanaşma",
  rightTitle: "İkinci yanaşma",
  left: "",
  right: "",
});
export const emptyTimeline = (): TimelineData => ({
  steps: [
    { label: "", title: "", body: "" },
    { label: "", title: "", body: "" },
    { label: "", title: "", body: "" },
  ],
});
export function isComparisonData(value: unknown): value is ComparisonData {
  if (!value || typeof value !== "object") return false;
  const c = value as ComparisonData;
  return (
    typeof c.leftTitle === "string" &&
    c.leftTitle.length <= 60 &&
    typeof c.rightTitle === "string" &&
    c.rightTitle.length <= 60 &&
    typeof c.left === "string" &&
    c.left.length <= 220 &&
    typeof c.right === "string" &&
    c.right.length <= 220
  );
}
export function isTimelineData(value: unknown): value is TimelineData {
  if (!value || typeof value !== "object") return false;
  const t = value as TimelineData;
  return (
    Array.isArray(t.steps) &&
    t.steps.length >= 2 &&
    t.steps.length <= 5 &&
    t.steps.every(
      (s) =>
        s &&
        typeof s.label === "string" &&
        s.label.length <= 30 &&
        typeof s.title === "string" &&
        s.title.length <= 60 &&
        typeof s.body === "string" &&
        s.body.length <= 120,
    )
  );
}
export const IMAGE_LIMIT = 300000;
export const PROJECT_IMAGE_LIMIT = 1200000;
export function rasterInfo(
  bytes: Uint8Array,
): { mime: "image/png" | "image/jpeg"; width: number; height: number } | null {
  if (
    bytes.length >= 33 &&
    [137, 80, 78, 71, 13, 10, 26, 10].every((v, i) => bytes[i] === v) &&
    String.fromCharCode(...bytes.slice(12, 16)) === "IHDR"
  ) {
    const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    let pos = 8,
      hasData = false,
      ended = false;
    while (pos + 12 <= bytes.length) {
      const size = view.getUint32(pos);
      if (pos + 12 + size > bytes.length) return null;
      const kind = String.fromCharCode(...bytes.slice(pos + 4, pos + 8));
      if (kind === "IDAT" && size > 0) hasData = true;
      if (kind === "IEND") {
        ended = size === 0 && pos + 12 === bytes.length;
        break;
      }
      pos += size + 12;
    }
    const width = view.getUint32(16),
      height = view.getUint32(20);
    return hasData && ended && width > 0 && height > 0
      ? { mime: "image/png", width, height }
      : null;
  }
  if (
    bytes.length >= 12 &&
    bytes[0] === 255 &&
    bytes[1] === 216 &&
    bytes.at(-2) === 255 &&
    bytes.at(-1) === 217
  ) {
    let pos = 2;
    while (pos + 4 <= bytes.length) {
      if (bytes[pos++] !== 255) return null;
      while (bytes[pos] === 255) pos++;
      const marker = bytes[pos++];
      if (marker === 218 || marker === 217) return null;
      if (marker === 1 || (marker >= 208 && marker <= 215)) continue;
      const size = (bytes[pos] << 8) | bytes[pos + 1];
      if (size < 2 || pos + size > bytes.length) return null;
      if (
        [
          192, 193, 194, 195, 197, 198, 199, 201, 202, 203, 205, 206, 207,
        ].includes(marker) &&
        size >= 8
      ) {
        const height = (bytes[pos + 3] << 8) | bytes[pos + 4],
          width = (bytes[pos + 5] << 8) | bytes[pos + 6];
        return width > 0 && height > 0
          ? { mime: "image/jpeg", width, height }
          : null;
      }
      pos += size;
    }
  }
  return null;
}
export function isImageAsset(value: unknown): value is ImageAsset {
  if (!value || typeof value !== "object") return false;
  const a = value as ImageAsset;
  if (
    typeof a.data !== "string" ||
    a.data.length > IMAGE_LIMIT ||
    !/^data:image\/(?:png|jpeg);base64,[A-Za-z0-9+/]+={0,2}$/.test(a.data) ||
    typeof a.alt !== "string" ||
    a.alt.length > 160 ||
    typeof a.credit !== "string" ||
    a.credit.length > 200 ||
    !Number.isInteger(a.width) ||
    !Number.isInteger(a.height) ||
    a.width < 1 ||
    a.height < 1 ||
    Math.max(a.width, a.height) > 1280
  )
    return false;
  try {
    const info = rasterInfo(
      Uint8Array.from(atob(a.data.split(",")[1]), (c) => c.charCodeAt(0)),
    );
    return (
      !!info &&
      a.data.startsWith(`data:${info.mime};`) &&
      info.width === a.width &&
      info.height === a.height
    );
  } catch {
    return false;
  }
}
export const projectImageSize = (slides: Slide[]) =>
  slides.reduce((n, s) => n + (s.image?.data.length || 0), 0);
export type BlockKind =
  | "plan"
  | "problem"
  | "comparison"
  | "timeline"
  | "image"
  | "table"
  | "chart"
  | "statement"
  | "closing";
export const slideBlocks: { id: BlockKind; name: string; detail: string }[] = [
  {
    id: "plan",
    name: "Məqsəd və plan",
    detail: "Çıxışda danışacağın mövzuları sırala",
  },
  {
    id: "problem",
    name: "Problem və həll",
    detail: "Problemi və təklifini yan-yana göstər",
  },
  {
    id: "comparison",
    name: "İki yanaşma",
    detail: "Fərqləri iki kartda aydınlaşdır",
  },
  {
    id: "timeline",
    name: "Yol xəritəsi",
    detail: "Mərhələləri və ardıcıllığı izah et",
  },
  { id: "image", name: "Şəkilli izah", detail: "Öz şəklini mətnlə tamamla" },
  {
    id: "table",
    name: "Məlumat cədvəli",
    detail: "Məlumatları sətir və sütuna yerləşdir",
  },
  {
    id: "chart",
    name: "Rəqəmlərlə müqayisə",
    detail: "Öz rəqəmlərinlə diaqram qur",
  },
  {
    id: "statement",
    name: "Əsas fikir",
    detail: "Yadda qalmalı bir fikri vurğula",
  },
  {
    id: "closing",
    name: "Yekun və sual",
    detail: "Nəticəni bağla, müzakirə aç",
  },
];
export function createBlock(kind: BlockKind): Slide {
  const base = {
    id: uid(),
    title: slideBlocks.find((b) => b.id === kind)!.name,
    body: "",
  };
  if (kind === "comparison" || kind === "problem")
    return {
      ...base,
      layout: "comparison",
      comparison:
        kind === "problem"
          ? {
              leftTitle: "Problem",
              rightTitle: "Təklif edilən həll",
              left: "",
              right: "",
            }
          : emptyComparison(),
    };
  if (kind === "timeline")
    return { ...base, layout: "timeline", timeline: emptyTimeline() };
  if (kind === "image") return { ...base, layout: "image" };
  if (kind === "table")
    return { ...base, layout: "table", table: emptyTable() };
  if (kind === "chart")
    return { ...base, layout: "chart", chart: emptyChart() };
  return {
    ...base,
    layout:
      kind === "statement" ? "statement" : kind === "plan" ? "bullets" : "text",
    body:
      kind === "plan"
        ? "Birinci məqamı buraya yaz.\n\nİkinci məqamı buraya yaz."
        : kind === "statement"
          ? "Əsas fikrini buraya yaz."
          : "Nəticəni və müzakirə sualını buraya yaz.",
  };
}
export const emptyTable = (): TableData => ({
  columns: ["", ""],
  rows: [
    ["", ""],
    ["", ""],
  ],
});
export const emptyChart = (): ChartData => ({
  type: "bar",
  name: "",
  unit: "",
  points: [
    { label: "", value: "" },
    { label: "", value: "" },
  ],
});
export function isTableData(value: unknown): value is TableData {
  if (!value || typeof value !== "object") return false;
  const t = value as TableData;
  return (
    Array.isArray(t.columns) &&
    t.columns.length >= 2 &&
    t.columns.length <= 5 &&
    t.columns.every(
      (s) =>
        typeof s === "string" &&
        s.length <= 80 &&
        !/[\u0000-\u001f\u007f]/.test(s),
    ) &&
    Array.isArray(t.rows) &&
    t.rows.length >= 1 &&
    t.rows.length <= 8 &&
    t.rows.every(
      (r) =>
        Array.isArray(r) &&
        r.length === t.columns.length &&
        r.every(
          (s) =>
            typeof s === "string" &&
            s.length <= 80 &&
            !/[\u0000-\u001f\u007f]/.test(s),
        ),
    )
  );
}
export function isChartData(value: unknown): value is ChartData {
  if (!value || typeof value !== "object") return false;
  const c = value as ChartData;
  return (
    ["bar", "line"].includes(c.type) &&
    typeof c.name === "string" &&
    c.name.length <= 80 &&
    typeof c.unit === "string" &&
    c.unit.length <= 20 &&
    Array.isArray(c.points) &&
    c.points.length >= 2 &&
    c.points.length <= 8 &&
    c.points.every(
      (p) =>
        p &&
        typeof p.label === "string" &&
        p.label.length <= 40 &&
        !/[\u0000-\u001f\u007f]/.test(p.label) &&
        typeof p.value === "string" &&
        p.value.length <= 32,
    )
  );
}
export function parseChartNumber(raw: string): number | null {
  const text = raw.trim();
  if (!/^[+-]?(?:\d+(?:[.,]\d{0,6})?|[.,]\d{1,6})$/.test(text)) return null;
  const value = Number(text.replace(",", "."));
  return Number.isFinite(value) && Math.abs(value) <= 1000000000
    ? value === 0
      ? 0
      : value
    : null;
}
export function chartBounds(values: number[]) {
  const min = Math.min(0, ...values);
  const max = Math.max(0, ...values);
  return { min, max: min === max ? min + 1 : max };
}
export function dataProblems(slide: Slide): string[] {
  if (slide.layout === "comparison") {
    if (!isComparisonData(slide.comparison))
      return ["Müqayisənin iki tərəfini əlavə et."];
    if (
      !slide.comparison.leftTitle.trim() ||
      !slide.comparison.rightTitle.trim() ||
      !slide.comparison.left.trim() ||
      !slide.comparison.right.trim()
    )
      return ["Müqayisənin başlıqlarını və hər iki izahını tamamla."];
  }
  if (slide.layout === "timeline") {
    if (!isTimelineData(slide.timeline)) return ["Mərhələləri əlavə et."];
    if (slide.timeline.steps.some((step) => !step.title.trim()))
      return ["Hər mərhələnin başlığını tamamla."];
  }
  if (slide.layout === "image") {
    if (!isImageAsset(slide.image)) return ["PNG və ya JPEG şəkli əlavə et."];
    if (!slide.image.alt.trim()) return ["Şəkil üçün qısa alt mətn yaz."];
  }

  if (slide.layout === "table") {
    if (!isTableData(slide.table)) return ["Cədvəl məlumatlarını əlavə et."];
    if (slide.table.columns.some((c) => !c.trim()))
      return ["Cədvəlin bütün sütun başlıqlarını yaz."];
    if (slide.table.rows.some((row) => row.some((cell) => !cell.trim())))
      return [
        "Cədvəldə boş xanalar var. Məlumat yoxdursa, bunu “—” ilə göstər.",
      ];
    const limit = tableCellLimit(slide.table);
    if (
      [...slide.table.columns, ...slide.table.rows.flat()].some(
        (cell) => cell.length > limit,
      )
    )
      return [
        `Bu ölçülü cədvəldə xanaları ${limit} simvola qədər qısalt və ya sətir/sütun sayını azalt.`,
      ];
  }
  if (slide.layout === "chart") {
    if (!isChartData(slide.chart)) return ["Diaqram məlumatlarını əlavə et."];
    if (slide.chart.points.some((p) => !p.label.trim()))
      return ["Diaqramın bütün etiketlərini yaz."];
    if (slide.chart.points.some((p) => parseChartNumber(p.value) === null))
      return [
        "Diaqram qiymətlərini rəqəmlə yaz: vergül və ya nöqtə, ən çox 6 onluq rəqəm; qiymət ±1 milyard aralığında olmalıdır.",
      ];
  }
  return [];
}
export const tableCellLimit = (table: TableData) =>
  table.columns.length > 4 && table.rows.length > 5
    ? 28
    : table.columns.length > 3
      ? 40
      : 60;
export function visibleSlideText(slide: Slide): string {
  let extra = "";
  if (slide.layout === "table" && slide.table)
    extra = [...slide.table.columns, ...slide.table.rows.flat()].join(" ");
  if (slide.layout === "chart" && slide.chart)
    extra = [
      slide.chart.name,
      slide.chart.unit,
      ...slide.chart.points.flatMap((p) => [p.label, p.value]),
    ].join(" ");
  if (slide.layout === "comparison" && slide.comparison)
    extra = Object.values(slide.comparison).join(" ");
  if (slide.layout === "timeline" && slide.timeline)
    extra = slide.timeline.steps
      .flatMap((s) => [s.label, s.title, s.body])
      .join(" ");
  if (slide.layout === "image" && slide.image)
    extra = `${slide.image.alt} ${slide.image.credit}`;
  return `${slide.title} ${slide.body} ${extra}`;
}

// Slides the audience sees, with their position in the full editor deck.
export const shownSlides = (slides: Slide[]) =>
  slides.flatMap((slide, index) => (slide.hidden ? [] : [{ slide, index }]));
export const layoutFor = (slide: Slide, index: number): Layout =>
  slide.layout || (index === 0 ? "cover" : "text");
export const bodyBlocks = (body: string) =>
  body
    .split(/\n\s*\n|\n(?=[•\-–]\s)/)
    .map((s) => s.replace(/^[•\-–]\s/, "").trim())
    .filter(Boolean);
const BULLET_AREA_HEIGHT = 3.2;
const MIN_BULLET_BOX_HEIGHT = 0.3;
const bulletBoxHeight = (count: number) =>
  BULLET_AREA_HEIGHT / Math.max(1, count) - 0.04;
export function textColumns(body: string): [string, string] {
  const blocks = bodyBlocks(body);
  if (blocks.length > 1) {
    const mid = Math.ceil(blocks.length / 2);
    return [blocks.slice(0, mid).join("\n\n"), blocks.slice(mid).join("\n\n")];
  }
  const words = body.trim().split(/\s+/);
  const mid = Math.ceil(words.length / 2);
  return [words.slice(0, mid).join(" "), words.slice(mid).join(" ")];
}
export const BODY_LIMIT = 460;
export function splitText(text: string, limit = BODY_LIMIT): string[] {
  let rest = text.trim();
  const chunks: string[] = [];
  while (rest.length > limit) {
    const window = rest.slice(0, limit + 1);
    const sentences = [...window.matchAll(/[.!?](?:[”"'])?\s+/g)];
    const sentence = sentences.at(-1);
    let cut =
      sentence && sentence.index! > limit * 0.4
        ? sentence.index! + sentence[0].trimEnd().length
        : window.lastIndexOf(" ");
    if (cut < limit * 0.3) cut = limit;
    if (/[\uD800-\uDBFF]/.test(rest[cut - 1])) cut--;
    chunks.push(rest.slice(0, cut).trim());
    rest = rest.slice(cut).trim();
  }
  if (rest) chunks.push(rest);
  return chunks;
}
export function splitSlideBodies(slide: Slide): string[] {
  if (
    ["table", "chart", "comparison", "timeline", "image"].includes(
      slide.layout || "",
    )
  )
    return [slide.body];
  return splitText(slide.body);
}
export function splitSlide(slide: Slide): Slide[] {
  const chunks = splitSlideBodies(slide);
  if (chunks.length < 2) return [slide];
  return chunks.map((body, i) => ({
    ...slide,
    id: i === 0 ? slide.id : uid(),
    title:
      i === 0 ? slide.title : `${slide.title.slice(0, 100)} (davamı ${i + 1})`,
    body,
    layout:
      slide.layout === "cover" || slide.layout === "statement"
        ? "text"
        : slide.layout,
    notes: i === 0 ? slide.notes : "",
    citationReview: !!slide.citations?.length || slide.citationReview,
  }));
}
export const wordCount = (text: string) =>
  (text.match(/[\p{L}\p{N}]+(?:['’\-][\p{L}\p{N}]+)*/gu) || []).length;
export type QualityIssue = {
  slideId: string;
  index: number;
  kind: "empty" | "length" | "placeholder" | "citation" | "data";
  message: string;
};
export function inspectDeck(
  slides: Slide[],
  references?: Reference[],
  design?: DesignSettings,
): QualityIssue[] {
  return slides.flatMap((s, index) => {
    const issues: QualityIssue[] = [];
    const add = (kind: QualityIssue["kind"], message: string) =>
      issues.push({ slideId: s.id, index, kind, message });
    const dataLayout = [
      "table",
      "chart",
      "comparison",
      "timeline",
      "image",
    ].includes(s.layout || "");
    for (const message of dataProblems(s)) add("data", message);
    if (dataLayout && s.body.length > 160)
      add("length", "Slaydın açıqlamasını 160 simvola qədər qısalt.");
    if (!s.title.trim() || (!dataLayout && !s.body.trim()))
      add("empty", "Başlıq və ya mətn boşdur.");
    if (
      resolveDesign(design).textSize === "large" &&
      !dataLayout &&
      s.body.length > 300
    )
      add(
        "length",
        "İri mətn seçilib: slaydın mətnini 300 simvola qədər qısaltmağı düşün.",
      );
    if (s.title.length > 100)
      add("length", "Başlığı qısalt: 100 simvoldan uzundur.");
    if (!dataLayout && (s.body.length > BODY_LIMIT || wordCount(s.body) > 85))
      add("length", "Mətn sıxdır. Slaydı iki və ya daha çox hissəyə böl.");
    if (layoutFor(s, index) === "bullets") {
      const count = bodyBlocks(s.body).length;
      if (!s.hidden && bulletBoxHeight(count) < MIN_BULLET_BOX_HEIGHT)
        add(
          "length",
          "Məqamlar PowerPoint-də oxunaqlı ölçüdə yerləşməyə bilər. Slaydı bir neçə hissəyə böl.",
        );
      else if (count > 5)
        add("length", "Məqamları azalt: beşdən çox məqam var.");
    }
    if (layoutFor(s, index) === "statement" && s.body.length > 180)
      add("length", "Vurğu düzülüşündə bir qısa fikir saxla.");
    if (
      /buraya yaz|buraya əlavə|öz izahını əlavə|əsas nəticələrini/i.test(s.body)
    )
      add("placeholder", "Nümunə göstərişi qalıb. Öz mətninlə əvəz et.");
    if (
      references &&
      s.citations?.some(
        (c) =>
          !references.some(
            (r) =>
              r.id === c.sourceId &&
              r.name === c.name &&
              r.pages.some((p) => p.number === c.page && !!p.text.trim()),
          ),
      )
    )
      add(
        "citation",
        "İstinadın mətni əlavə edilmiş materiallarda tapılmır.",
      );
    if (s.citationReview && s.citations?.length)
      add("citation", "Mətn dəyişib: mənbə istinadını yoxla.");
    return issues;
  });
}
// Rendered-size check (SlideView.clippedText) has no model equivalent, so the
// UI passes the clipped slide ids in and they become ordinary length issues.
export const CLIPPED_MESSAGE =
  "Önizləmədə mətnin bir hissəsi slayda sığmır və görünmür.";
export function withClippedIssues(
  issues: QualityIssue[],
  slides: Slide[],
  clipped?: ReadonlySet<string>,
): QualityIssue[] {
  if (!clipped?.size) return issues;
  const extra = slides.flatMap((s, index) =>
    clipped.has(s.id)
      ? [
          {
            slideId: s.id,
            index,
            kind: "length" as const,
            message: CLIPPED_MESSAGE,
          },
        ]
      : [],
  );
  return [...issues, ...extra].sort((a, b) => a.index - b.index);
}
export const sample = {
  topic: "Süni intellektin təhsildə rolu",
  subject: "İnformatika",
  material:
    "Süni intellekt təhsildə öyrənmə və tədris prosesini dəstəkləyən vasitədir. O, müəllimi əvəz etməkdən çox, gündəlik işlərə kömək etmək üçün istifadə oluna bilər.\n\nFərdiləşdirilmiş öyrənmə zamanı tapşırıqlar şagirdin hazırlıq səviyyəsinə uyğunlaşdırıla bilər. Çətin mövzuların müxtəlif nümunələrlə izahı öyrənməyə kömək edir.\n\nMüəllimlər süni intellektdən dərs planı, tapşırıq nümunələri və ilkin rəy hazırlamaq üçün istifadə edə bilərlər. Hazırlanan material müəllim tərəfindən yoxlanmalıdır.\n\nYanlış məlumat, şəxsi məlumatların qorunması və akademik dürüstlük əsas risklərdəndir. Süni intellektin cavabları etibarlı mənbələrlə tutuşdurulmalıdır.\n\nMəsuliyyətli istifadə üçün aydın qaydalar lazımdır. Tələbə öz töhfəsini qorumalı, istifadə etdiyi alətləri bildirməli və nəticələri yoxlamalıdır.",
};
export function createCover(topic: string, brief?: AcademicBrief): Slide {
  return {
    id: uid(),
    title: topic,
    body:
      brief?.goal.trim() ||
      (brief
        ? purposes.find((p) => p.id === brief.purpose)!.name + " təqdimatı"
        : "Mövzuya baxış və əsas məqamlar"),
    layout: "cover",
    notes: brief
      ? [
          `Təqdimat növü: ${purposes.find((p) => p.id === brief.purpose)!.name}`,
          `Auditoriya: ${audiences.find((a) => a.id === brief.audience)!.name}`,
          `Hədəf vaxt: ${brief.targetMinutes} dəqiqə`,
          brief.goal.trim() ? `Məqsəd: ${brief.goal.trim()}` : "",
        ]
          .filter(Boolean)
          .join("\n")
      : undefined,
  };
}
export function createManualDeck(
  topic: string,
  brief: AcademicBrief = defaultBrief,
): Slide[] {
  if (!topic.trim()) throw new Error("Əvvəlcə təqdimatın mövzusunu yaz.");
  return [createCover(topic.trim(), brief), createBlock("closing")];
}
export function createSlides(
  topic: string,
  material: string,
  count: number,
  references: Reference[] = [],
  brief?: AcademicBrief,
): Slide[] {
  const parts = material
    .split(/\n\s*\n/)
    .map((p) => ({ text: p.trim(), citations: [] as Citation[] }))
    .filter((p) => p.text);
  for (const ref of references)
    for (const page of ref.pages)
      for (const text of page.text
        .split(/\n\s*\n/)
        .map((p) => p.trim())
        .filter(Boolean))
        parts.push({
          text,
          citations: [{ sourceId: ref.id, name: ref.name, page: page.number }],
        });
  const overhead = references.length ? 3 : 2;
  const target = Math.max(1, count - overhead);
  const limit = Math.max(
    240,
    Math.min(
      BODY_LIMIT,
      Math.ceil(parts.reduce((n, p) => n + p.text.length, 0) / target),
    ),
  );
  const groups: { body: string; citations: Citation[] }[] = [];
  for (const part of parts)
    for (const text of splitText(part.text, limit)) {
      const last = groups.at(-1);
      if (last && last.body.length + text.length + 2 <= limit) {
        last.body += "\n\n" + text;
        last.citations.push(...part.citations);
      } else groups.push({ body: text, citations: [...part.citations] });
    }
  if (!groups.length)
    throw new Error(
      "Təqdimat üçün mətn və ya oxuna bilən sənəd əlavə et.",
    );
  if (groups.length + overhead > 80)
    throw new Error(
      "Material 80-dən çox slayd tələb edir. Daha az material seç və ya mətni qısalt.",
    );
  const slides: Slide[] = [createCover(topic, brief)];
  groups.forEach((group, i) => {
    const firstSentence = group.body
      .replace(/^(?:\d+[.)]|[•–-])\s*/, "")
      .split(/[.!?]\s/)[0]
      .replace(/\s+/g, " ");
    const title =
      firstSentence.length > 65
        ? `${firstSentence.slice(0, 62)}…`
        : firstSentence.replace(/[.!?]$/, "");
    const citations = [
      ...new Map(
        group.citations.map((c) => [`${c.sourceId}:${c.page}`, c]),
      ).values(),
    ];
    slides.push({
      id: uid(),
      title: title || `Əsas məqam ${i + 1}`,
      body: group.body,
      citations,
      layout:
        bodyBlocks(group.body).length > 1 && i % 2 === 1 ? "bullets" : "text",
    });
  });
  slides.push({
    id: uid(),
    title: "Yekun və müzakirə",
    body:
      brief?.purpose === "coursework"
        ? "İşin əsas nəticəsini, məhdudiyyətlərini və təkliflərini buraya yaz."
        : brief?.purpose === "project"
          ? "Layihənin nəticəsini, sınaqdan öyrəndiklərini və növbəti addımı buraya yaz."
          : "Əsas nəticələrini və müzakirə sualını buraya yaz.",
    layout: "text",
  });
  slides.push(...sourcesSlides(references));
  if (slides.length > 80)
    throw new Error("Material çox uzundur. Daha az material seç.");
  return slides;
}

/** Closing slides that list the added documents; no bibliographic data is invented. */
export function sourcesSlides(references: Reference[]): Slide[] {
  if (!references.length) return [];
  const sourceText = references
    .map(
      (r) =>
        `${r.name}\n${/\.pdf$/i.test(r.name) ? `Səhifələr: ${r.pages.map((p) => p.number).join(", ")}` : "Sənəddən çıxarılmış mətn"}`,
    )
    .join("\n\n");
  return splitText(sourceText).map((body, i) => ({
    id: uid(),
    title: i
      ? "İstifadə olunan materiallar (davamı)"
      : "İstifadə olunan materiallar",
    body,
    layout: "text",
  }));
}

export class PptxSlideError extends Error {
  constructor(readonly slideId: string, index: number, problem: string) {
    super(`Slayd ${index + 1}: ${problem}`);
  }
}

export async function exportPptx(project: Project) {
  const shown = shownSlides(project.slides);
  if (!shown.length)
    throw new Error("Bütün slaydlar gizlədilib. Ən azı bir slaydı göstər.");
  // Hidden slides may be unfinished drafts; they must not block the export.
  for (const { slide: item, index } of shown) {
    const problem = dataProblems(item)[0];
    if (problem) throw new PptxSlideError(item.id, index, problem);
  }
  const { default: PptxGenJS } = await import("pptxgenjs");
  const pptx = new PptxGenJS();
  pptx.layout = "LAYOUT_WIDE";
  pptx.author = project.author || "Təqdim";
  pptx.subject = project.subject;
  pptx.title = project.topic;
  const design = resolveDesign(project.design);
  const headingFont = headingFontFor(project.theme, design);
  const bodyScale = design.textSize === "large" ? 1.18 : 1;
  pptx.theme = { headFontFace: headingFont, bodyFontFace: "Arial" };
  const colors = themeColors[project.theme];
  const lowContrastAccent = project.theme === "atelier" || project.theme === "sunset";
  shown.forEach(({ slide: item, index: deckIndex }, i) => {
    const slide = pptx.addSlide();
    slide.background = { color: colors.bg };
    const shape = pptx.ShapeType;
    if (design.decoration === "full") {
      if (project.theme === "atelier") {
        slide.addShape(shape.rect, {
          x: 10.8,
          y: 0,
          w: 2.54,
          h: 7.5,
          fill: { color: colors.accent },
          line: { color: colors.accent, transparency: 100 },
        });
        if (design.showNumbers)
          slide.addText(String(i + 1).padStart(2, "0"), {
            x: 10.9,
            y: 0.8,
            w: 2.2,
            h: 2,
            fontSize: 96,
            bold: true,
            color: colors.bg,
            rotate: 90,
          });
        slide.addShape(shape.line, {
          x: 0.7,
          y: 0.95,
          w: 9.4,
          h: 0,
          line: { color: colors.fg, width: 1 },
        });
      } else if (project.theme === "blueprint") {
        for (let x = 0; x < 13.34; x += 0.45)
          slide.addShape(shape.line, {
            x,
            y: 0,
            w: 0,
            h: 7.5,
            line: { color: colors.accent, transparency: 90, width: 0.3 },
          });
        for (let y = 0; y < 7.5; y += 0.45)
          slide.addShape(shape.line, {
            x: 0,
            y,
            w: 13.34,
            h: 0,
            line: { color: colors.accent, transparency: 90, width: 0.3 },
          });
        slide.addShape(shape.rect, {
          x: 0.35,
          y: 0.3,
          w: 12.6,
          h: 6.9,
          fill: { color: colors.bg, transparency: 100 },
          line: { color: colors.accent, transparency: 45, width: 0.6 },
        });
      } else if (project.theme === "sunset") {
        slide.addShape(shape.ellipse, {
          x: 9.3,
          y: -0.9,
          w: 5,
          h: 5,
          fill: { color: "EDA287" },
          line: { color: colors.accent, transparency: 100 },
        });
        slide.addShape(shape.arc, {
          x: 10.4,
          y: 3.1,
          w: 3.6,
          h: 3.6,
          line: { color: colors.accent, transparency: 65, width: 25 },
          rotate: 35,
        });
      } else if (project.theme === "noir") {
        slide.addShape(shape.rect, {
          x: 0,
          y: 0,
          w: 0.16,
          h: 7.5,
          fill: { color: colors.accent },
          line: { color: colors.accent, transparency: 100 },
        });
        slide.addText("↗", {
          x: 10.6,
          y: 0.8,
          w: 2.2,
          h: 2,
          fontSize: 110,
          color: colors.accent,
          bold: true,
        });
        slide.addShape(shape.line, {
          x: 0.7,
          y: 6.7,
          w: 11.9,
          h: 0,
          line: { color: colors.accent, transparency: 55, width: 1 },
        });
      }
      if (project.theme === "caspian") {
        slide.addShape(shape.rect, {
          x: 11.4,
          y: 0,
          w: 1.94,
          h: 7.5,
          fill: { color: "0C5360" },
          line: { color: "0C5360", transparency: 100 },
        });
        [0, 1].forEach((n) =>
          slide.addShape(shape.ellipse, {
            x: 10.55 + n * 0.45,
            y: 0.8 + n * 0.4,
            w: 2.3 - n * 0.25,
            h: 5.7 - n * 0.7,
            fill: { color: colors.bg, transparency: 100 },
            line: {
              color: colors.accent,
              transparency: 45 + n * 15,
              width: 1.4,
            },
          }),
        );
        slide.addShape(shape.line, {
          x: 0.7,
          y: 6.72,
          w: 9.8,
          h: 0,
          line: { color: colors.accent, transparency: 65, width: 0.6 },
        });
      } else if (project.theme === "heritage") {
        slide.addShape(shape.rect, {
          x: 0.28,
          y: 0.25,
          w: 12.77,
          h: 7,
          fill: { color: colors.bg, transparency: 100 },
          line: { color: colors.accent, width: 0.8 },
        });
        [
          [0.4, 0.38],
          [12.7, 0.38],
          [0.4, 6.94],
          [12.7, 6.94],
        ].forEach(([x, y]) =>
          slide.addShape(shape.rect, {
            x,
            y,
            w: 0.15,
            h: 0.15,
            rotate: 45,
            fill: { color: colors.accent },
            line: { color: colors.accent, transparency: 100 },
          }),
        );
        slide.addShape(shape.line, {
          x: 0.7,
          y: 0.93,
          w: 11.5,
          h: 0,
          line: { color: colors.accent, transparency: 65, width: 0.5 },
        });
      } else if (project.theme === "prism") {
        slide.addShape(shape.rect, {
          x: 10.9,
          y: 1.1,
          w: 1.7,
          h: 5.1,
          fill: { color: "DFE5FF" },
          line: { color: "DFE5FF", transparency: 100 },
        });
        slide.addShape(shape.rect, {
          x: 11.15,
          y: 1.4,
          w: 1.5,
          h: 4.8,
          fill: { color: colors.accent },
          line: { color: colors.accent, transparency: 100 },
        });
        slide.addShape(shape.rect, {
          x: 11.7,
          y: 5.6,
          w: 0.7,
          h: 0.7,
          fill: { color: "E87D3E" },
          line: { color: "E87D3E", transparency: 100 },
        });
      }
    }
    const creative =
      design.decoration === "full" &&
      ["atelier", "sunset", "noir", "caspian", "prism"].includes(project.theme);
    const textWidth = creative ? 9.2 : 11.5;
    slide.addText(project.subject.toLocaleUpperCase("az"), {
      x: 0.7,
      y: 0.45,
      w: 10,
      h: 0.3,
      color: colors.accent,
      fontSize: 11,
      charSpacing: 2,
    });
    const layout = layoutFor(item, deckIndex);
    const isCover = layout === "cover";
    const isStatement = layout === "statement";
    slide.addText(item.title, {
      x: 0.7,
      y: isCover ? 1.65 : 1.1,
      w: textWidth,
      h: isCover ? 2.2 : 1.4,
      color: colors.fg,
      fontSize: isCover ? 42 : isStatement ? 24 : 30,
      fontFace: headingFont,
      bold: true,
      breakLine: false,
      fit: "shrink",
    });
    if (layout === "comparison" && item.comparison) {
      const c = item.comparison,
        gap = 0.35,
        cardW = (textWidth - gap) / 2;
      [
        { title: c.leftTitle, body: c.left },
        { title: c.rightTitle, body: c.right },
      ].forEach((card, n) => {
        const x = 0.7 + n * (cardW + gap);
        slide.addShape(shape.roundRect, {
          x,
          y: 2.65,
          w: cardW,
          h: 3.25,
          rectRadius: 0.12,
          fill: { color: colors.bg },
          line: { color: colors.accent, width: 0.8 },
        });
        slide.addText(card.title, {
          x: x + 0.22,
          y: 2.9,
          w: cardW - 0.44,
          h: 0.55,
          color: colors.accent,
          fontSize: 20,
          bold: true,
          fit: "shrink",
        });
        slide.addText(card.body, {
          x: x + 0.22,
          y: 3.58,
          w: cardW - 0.44,
          h: 2.03,
          color: colors.fg,
          fontSize: 17,
          fit: "shrink",
          valign: "top",
        });
      });
      if (item.body.trim())
        slide.addText(item.body, {
          x: 0.7,
          y: 6,
          w: textWidth,
          h: 0.25,
          color: colors.fg,
          fontSize: 10,
          fit: "shrink",
        });
    } else if (layout === "timeline" && item.timeline) {
      const steps = item.timeline.steps,
        rowH = 3.2 / steps.length;
      slide.addShape(shape.line, {
        x: 1.95,
        y: 2.8,
        w: 0,
        h: rowH * (steps.length - 1),
        line: { color: colors.accent, width: 1.1 },
      });
      steps.forEach((step, n) => {
        const y = 2.65 + n * rowH;
        slide.addText(step.label || String(n + 1).padStart(2, "0"), {
          x: 0.7,
          y: y + 0.02,
          w: 1.0,
          h: 0.35,
          color: colors.accent,
          fontSize: 10,
          fit: "shrink",
        });
        slide.addShape(shape.ellipse, {
          x: 1.88,
          y: y + 0.08,
          w: 0.14,
          h: 0.14,
          fill: { color: colors.accent },
          line: { color: colors.accent, width: 0 },
        });
        slide.addText(step.title, {
          x: 2.25,
          y,
          w: textWidth - 1.55,
          h: 0.27,
          color: colors.fg,
          fontSize: 13,
          bold: true,
          fit: "shrink",
        });
        if (step.body.trim())
          slide.addText(step.body, {
            x: 2.25,
            y: y + 0.29,
            w: textWidth - 1.55,
            h: rowH - 0.35,
            color: colors.fg,
            fontSize: 10,
            fit: "shrink",
            valign: "top",
          });
      });
      if (item.body.trim())
        slide.addText(item.body, {
          x: 0.7,
          y: 6,
          w: textWidth,
          h: 0.25,
          color: colors.fg,
          fontSize: 10,
          fit: "shrink",
        });
    } else if (layout === "image" && item.image) {
      const asset = item.image,
        boxW = item.body.trim() ? textWidth * 0.54 : textWidth,
        boxH = 3.25;
      const scale = Math.min(boxW / asset.width, boxH / asset.height),
        w = asset.width * scale,
        h = asset.height * scale;
      slide.addImage({
        data: asset.data,
        x: 0.7 + (boxW - w) / 2,
        y: 2.65 + (boxH - h) / 2,
        w,
        h,
        altText: asset.alt,
      });
      if (item.body.trim())
        slide.addText(item.body, {
          x: 0.7 + boxW + 0.3,
          y: 2.8,
          w: textWidth - boxW - 0.3,
          h: 2.8,
          color: colors.fg,
          fontSize: 18,
          fit: "shrink",
          valign: "top",
        });
      if (asset.credit.trim())
        slide.addText(asset.credit, {
          x: 0.7,
          y: 6,
          w: textWidth,
          h: 0.25,
          color: colors.accent,
          fontSize: 8,
          fit: "shrink",
        });
    } else if (layout === "table" && item.table) {
      const table = item.table;
      const rows = [
        table.columns.map((text) => ({
          text,
          options: {
            bold: true,
            fill: { color: lowContrastAccent ? colors.bg : colors.accent },
            color: lowContrastAccent ? colors.fg : colors.bg,
          },
        })),
        ...table.rows.map((row) => row.map((text) => ({ text }))),
      ];
      slide.addTable(rows, {
        x: 0.7,
        y: 2.65,
        w: textWidth,
        h: 3.15,
        rowH: 3.15 / (table.rows.length + 1),
        border: { type: "solid", color: colors.accent, pt: 0.5 },
        fill: { color: colors.bg },
        color: colors.fg,
        fontFace: "Arial",
        fontSize: table.rows.length > 5 ? 9 : 13,
        margin: table.rows.length > 5 ? 1 : 2,
        autoPage: false,
        valign: "middle",
      });
      if (item.body.trim())
        slide.addText(item.body, {
          x: 0.7,
          y: 5.98,
          w: textWidth,
          h: 0.28,
          color: colors.fg,
          fontSize: 10,
          fit: "shrink",
        });
    } else if (layout === "chart" && item.chart) {
      const chart = item.chart;
      const values = chart.points.map((p) => parseChartNumber(p.value)!);
      const bounds = chartBounds(values);
      slide.addChart(
        chart.type === "bar" ? pptx.ChartType.bar : pptx.ChartType.line,
        [
          {
            name: chart.name || "Göstərici",
            labels: chart.points.map((p) => p.label),
            values,
          },
        ],
        {
          x: 0.7,
          y: 2.6,
          w: textWidth,
          h: 3.2,
          showLegend: false,
          showTitle: !!chart.name,
          title: chart.name,
          titleColor: colors.fg,
          titleFontSize: 13,
          chartColors: [colors.accent],
          chartArea: {
            fill: { color: colors.bg },
            border: { color: colors.bg, pt: 0 },
          },
          plotArea: {
            fill: { color: colors.bg },
            border: { color: colors.bg, pt: 0 },
          },
          catAxisLabelColor: colors.fg,
          catAxisLabelFontSize: 10,
          catAxisLabelRotate: chart.points.length > 5 ? -20 : 0,
          catAxisLineColor: colors.accent,
          valAxisLabelColor: colors.fg,
          valAxisLabelFontSize: 9,
          valAxisLineColor: colors.accent,
          valAxisMinVal: bounds.min,
          valAxisMaxVal: bounds.max,
          valAxisTitle: chart.unit,
          showValAxisTitle: !!chart.unit,
          valAxisTitleColor: colors.fg,
          valAxisTitleFontSize: 10,
          showValue: true,
          dataLabelColor: colors.fg,
          dataLabelFontSize: 10,
          dataLabelFormatCode: "0.######",
          valAxisLabelFormatCode: "0.#########",
          barDir: "col",
          lang: "az-AZ",
          altText: chart.points
            .map((p, i) => `${p.label}: ${values[i]} ${chart.unit}`.trim())
            .join("; "),
        },
      );
      if (item.body.trim())
        slide.addText(item.body, {
          x: 0.7,
          y: 5.98,
          w: textWidth,
          h: 0.28,
          color: colors.fg,
          fontSize: 10,
          fit: "shrink",
        });
    } else if (layout === "columns") {
      const [left, right] = textColumns(item.body);
      const colWidth = (textWidth - 0.5) / 2;
      slide.addShape(shape.line, {
        x: 0.7 + colWidth + 0.25,
        y: 2.8,
        w: 0,
        h: 3.2,
        line: { color: colors.accent, transparency: 60, width: 0.8 },
      });
      for (const [col, text] of [left, right].entries())
        slide.addText(text, {
          x: 0.7 + col * (colWidth + 0.5),
          y: 2.8,
          w: colWidth,
          h: 3.2,
          color: colors.fg,
          fontSize: 20 * bodyScale,
          fit: "shrink",
          valign: "top",
          paraSpaceAfter: 10,
        });
    } else if (layout === "bullets") {
      const blocks = bodyBlocks(item.body);
      const boxHeight = bulletBoxHeight(blocks.length);
      if (boxHeight < MIN_BULLET_BOX_HEIGHT) {
        slide.addText(
          blocks
            .map((block, n) => `${String(n + 1).padStart(2, "0")}  ${block}`)
            .join("\n"),
          {
            x: 0.7,
            y: 2.8,
            w: textWidth,
            h: BULLET_AREA_HEIGHT,
            color: colors.fg,
            fontSize: 20 * bodyScale,
            fit: "shrink",
            valign: "top",
          },
        );
      } else {
        blocks.forEach((block, n) => {
          const y = 2.8 + n * (BULLET_AREA_HEIGHT / blocks.length);
          slide.addText(String(n + 1).padStart(2, "0"), {
            x: 0.7,
            y,
            w: 0.42,
            h: boxHeight,
            color: colors.accent,
            fontSize: 12,
            bold: true,
            fit: "shrink",
            valign: "top",
          });
          slide.addText(block, {
            x: 1.27,
            y,
            w: textWidth - 0.57,
            h: boxHeight,
            color: colors.fg,
            fontSize: 20 * bodyScale,
            fit: "shrink",
            valign: "top",
          });
        });
      }
    } else {
      slide.addText(item.body, {
        x: 0.7,
        y: isCover ? 4.2 : 2.8,
        w: textWidth,
        h: isCover ? 1.6 : 3.2,
        color: isStatement ? colors.accent : colors.fg,
        fontSize: (isStatement ? 32 : 21) * bodyScale,
        breakLine: false,
        fit: "shrink",
        valign: isStatement ? "middle" : "top",
        paraSpaceAfter: 14,
      });
    }
    if (isCover && coverDetails(project.brief))
      slide.addText(coverDetails(project.brief), {
        x: 0.7,
        y: 5.85,
        w: textWidth,
        h: 0.45,
        color: colors.accent,
        fontSize: 10,
        fit: "shrink",
        valign: "top",
      });
    if (item.citations?.length)
      slide.addText(citationLabel(item.citations), {
        x: 0.7,
        y: 6.35,
        w: textWidth,
        h: 0.35,
        color: lowContrastAccent ? colors.fg : colors.accent,
        fontSize: 8,
        fit: "shrink",
      });
    const notes = [
      item.notes?.trim(),
      item.citations?.length
        ? `Mənbələr: ${citationLabel(item.citations)}`
        : "",
    ]
      .filter(Boolean)
      .join("\n\n");
    if (notes) slide.addNotes(notes);
    slide.addText(project.author || "Təqdim · AIC tərəfindən hazırlanıb", {
      x: 0.7,
      y: 6.93,
      w: 10,
      h: 0.2,
      color: colors.accent,
      fontSize: 10,
    });
    if (design.showNumbers)
      slide.addText(`${i + 1} / ${shown.length}`, {
        x: 11.6,
        y: 6.9,
        w: 1,
        h: 0.25,
        // Atelier's accent block covers this corner; accent text would vanish.
        color:
          design.decoration === "full" && project.theme === "atelier"
            ? colors.bg
            : colors.accent,
        fontSize: 10,
        align: "right",
      });
  });
  await pptx.writeFile({
    fileName: `${safeFileName(project.topic)}.pptx`,
  });
}
