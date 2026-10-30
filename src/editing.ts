import {
  BODY_LIMIT,
  ChartData,
  isChartData,
  isTableData,
  layoutFor,
  parseChartNumber,
  Reference,
  sourcePosition,
  Slide,
  TableData,
  uid,
} from "./model";

export type ReplaceField = "title" | "body" | "notes";
export type ReplaceOptions = {
  query: string;
  replacement: string;
  matchCase: boolean;
  wholeWord: boolean;
  scope: "current" | "all";
  fields: ReplaceField[];
};
export type ReplacementChange = {
  index: number;
  field: ReplaceField;
  count: number;
  before: string;
  after: string;
};
export type ReplacementResult = {
  slides: Slide[];
  changes: ReplacementChange[];
  count: number;
  error: string;
};
const forbidden = /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/;
const segmenter = new Intl.Segmenter("az", { granularity: "grapheme" });
// Turkic lowercasing can remove a combining dot. Keep original offsets so a
// length-changing case fold never cuts the wrong part of the user's text.
function foldWithOffsets(text: string) {
  let folded = "";
  const starts: number[] = [],
    ends: number[] = [];
  for (const { segment, index } of segmenter.segment(text)) {
    const lower = segment.toLocaleLowerCase("az");
    for (let i = 0; i < lower.length; i++) {
      starts.push(lower.length === segment.length ? index + i : index);
      ends.push(
        lower.length === segment.length
          ? index + i + 1
          : index + segment.length,
      );
    }
    folded += lower;
  }
  return { folded, starts, ends };
}
function replaceLiteral(text: string, options: ReplaceOptions) {
  const mapped = options.matchCase ? null : foldWithOffsets(text);
  const haystack = mapped?.folded ?? text;
  const needle = options.matchCase
    ? options.query
    : foldWithOffsets(options.query).folded;
  let cursor = 0,
    last = 0,
    count = 0,
    result = "";
  if (!needle) return { text, count: 0 };
  while (cursor <= haystack.length - needle.length) {
    const found = haystack.indexOf(needle, cursor);
    if (found < 0) break;
    const foundEnd = found + needle.length;
    const start = mapped ? mapped.starts[found] : found;
    const end = mapped ? mapped.ends[foundEnd - 1] : foundEnd;
    const boundary =
      !options.wholeWord ||
      (!/[\p{L}\p{N}\p{M}_]$/u.test(text.slice(0, start)) &&
        !/^[\p{L}\p{N}\p{M}_]/u.test(text.slice(end)));
    if (boundary && start >= last) {
      result += text.slice(last, start) + options.replacement;
      last = end;
      count++;
    }
    cursor = foundEnd;
  }
  return { text: count ? result + text.slice(last) : text, count };
}

export function replaceAcross(
  slides: Slide[],
  selected: number,
  options: ReplaceOptions,
): ReplacementResult {
  const unchanged = (error: string): ReplacementResult => ({
    slides,
    changes: [],
    count: 0,
    error,
  });
  if (!options.query) return unchanged("Axtarılacaq mətni yaz.");
  if (!options.fields.length) return unchanged("Ən azı bir mətn sahəsi seç.");
  if (options.query.length > 160 || options.replacement.length > 8000)
    return unchanged("Axtarış 160, əvəzləyən mətn 8000 simvolu keçə bilməz.");
  if (forbidden.test(options.query + options.replacement))
    return unchanged("Dəstəklənməyən idarəetmə simvolları var.");
  const changes: ReplacementChange[] = [];
  const limits = { title: 160, body: 3000, notes: 8000 };
  let error = "";
  const next = slides.map((slide, index) => {
    if (options.scope === "current" && index !== selected) return slide;
    let updated = slide;
    for (const field of new Set(options.fields)) {
      const before = slide[field] || "";
      const replacement = replaceLiteral(before, options);
      if (replacement.text === before) continue;
      if (replacement.text.length > limits[field]) {
        error = `${index + 1} nömrəli slaydda ${field === "title" ? "başlıq" : field === "body" ? "mətn" : "qeyd"} ${limits[field]} simvol limitini aşır. Heç bir dəyişiklik tətbiq edilmədi.`;
        continue;
      }
      updated = { ...updated, [field]: replacement.text };
      if (field !== "notes" && slide.citations?.length)
        updated.citationReview = true;
      changes.push({
        index,
        field,
        count: replacement.count,
        before,
        after: replacement.text,
      });
    }
    return updated;
  });
  return error
    ? unchanged(error)
    : {
        slides: changes.length ? next : slides,
        changes,
        count: changes.reduce((n, c) => n + c.count, 0),
        error: "",
      };
}
export function agendaCandidates(slides: Slide[]) {
  return slides
    .map((slide, index) => ({ id: slide.id, title: slide.title.trim(), index }))
    .filter(
      (item) =>
        item.title && layoutFor(slides[item.index], item.index) !== "cover",
    );
}
export function createAgenda(slides: Slide[], ids: string[]): Slide[] {
  const selected = new Set(ids);
  const titles = agendaCandidates(slides)
    .filter((item) => selected.has(item.id))
    .map((item) => item.title);
  if (!titles.length) throw new Error("Plan üçün ən azı bir başlıq seç.");
  const groups: string[][] = [];
  let group: string[] = [];
  for (const title of titles) {
    if (title.length > BODY_LIMIT)
      throw new Error(
        "Başlıqlardan biri plan slaydı üçün çox uzundur. Əvvəlcə başlığı qısalt.",
      );
    if (
      group.length &&
      (group.length >= 5 || [...group, title].join("\n\n").length > BODY_LIMIT)
    ) {
      groups.push(group);
      group = [];
    }
    group.push(title);
  }
  if (group.length) groups.push(group);
  return groups.map((items, i) => ({
    id: uid(),
    title: `Təqdimatın planı${groups.length > 1 ? ` · ${i + 1}` : ""}`,
    body: items.join("\n\n"),
    layout: "bullets",
  }));
}
function tsvCell(value: string) {
  if (/[\u0000-\u001f\u007f]/.test(value))
    throw new Error("Xanada dəstəklənməyən idarəetmə simvolu var.");
  const literal = /^\s*[=+@-]/.test(value) ? "'" + value : value;
  return literal.includes('"')
    ? '"' + literal.replace(/"/g, '""') + '"'
    : literal;
}
export function parseTsvRows(text: string): string[][] {
  if (text.length > 6000)
    throw new Error("Cədvəl mətni ən çox 6000 simvol ola bilər.");
  const input = text.replace(/^\uFEFF/, "").replace(/\r\n?/g, "\n");
  const rows: string[][] = [];
  let row: string[] = [],
    cell = "",
    quoted = false,
    closed = false;
  const pushCell = () => {
    row.push(cell);
    cell = "";
    closed = false;
  };
  for (let i = 0; i < input.length; i++) {
    const char = input[i];
    if (quoted) {
      if (char === '"') {
        if (input[i + 1] === '"') {
          cell += '"';
          i++;
        } else {
          quoted = false;
          closed = true;
        }
      } else cell += char;
      continue;
    }
    if (char === "\t") {
      pushCell();
      continue;
    }
    if (char === "\n") {
      pushCell();
      rows.push(row);
      row = [];
      continue;
    }
    if (closed)
      throw new Error(
        "Dırnaqla bağlanmış xanadan sonra yalnız Tab və ya yeni sətir olmalıdır.",
      );
    if (char === '"' && !cell.length) {
      quoted = true;
      continue;
    }
    cell += char;
  }
  if (quoted) throw new Error("Cədvəldə xananın bağlanan dırnağı yoxdur.");
  pushCell();
  rows.push(row);
  while (rows.length && rows.at(-1)!.length === 1 && rows.at(-1)![0] === "")
    rows.pop();
  return rows;
}

export function tableTsv(table: TableData): string {
  if (!isTableData(table)) throw new Error("Cədvəlin quruluşu düzgün deyil.");
  return (
    [table.columns, ...table.rows]
      .map((row) => row.map(tsvCell).join("\t"))
      .join("\n") + "\n"
  );
}
export function chartTsv(chart: ChartData): string {
  if (
    !isChartData(chart) ||
    chart.points.some(
      (point) => !point.label.trim() || parseChartNumber(point.value) === null,
    )
  )
    throw new Error("Diaqramın etiketlərini və rəqəmlərini tamamla.");
  return (
    "Etiket\tQiymət\n" +
    chart.points
      .map(
        (point) => `${tsvCell(point.label)}\t${parseChartNumber(point.value)}`,
      )
      .join("\n") +
    "\n"
  );
}
export function parseChartPaste(text: string): ChartData["points"] {
  if (text.length > 6000)
    throw new Error("Diaqram mətni ən çox 6000 simvol ola bilər.");
  const rows = parseTsvRows(text).map((row) => row.map((cell) => cell.trim()));
  if (
    rows[0]?.length !== 2 ||
    rows[0][0].toLocaleLowerCase("az") !== "etiket" ||
    rows[0][1].toLocaleLowerCase("az") !== "qiymət"
  )
    throw new Error(
      "İlk sətir Tab ilə ayrılmış Etiket və Qiymət başlıqları olmalıdır.",
    );
  if (rows.length < 3 || rows.length > 9)
    throw new Error("Başlıqdan sonra 2–8 məlumat sətiri əlavə et.");
  const points = rows.slice(1).map((row, i) => {
    if (row.length !== 2)
      throw new Error(`${i + 2} nömrəli sətirdə iki sütun olmalıdır.`);
    const [label, value] = row;
    if (!label || label.length > 40 || /[\u0000-\u001f\u007f]/.test(label))
      throw new Error(
        `${i + 2} nömrəli sətirdə etiket boş olmamalı və 40 simvolu keçməməlidir.`,
      );
    if (value.length > 32 || parseChartNumber(value) === null)
      throw new Error(
        `${i + 2} nömrəli sətirdə qiymət düzgün deyil. Vergül/nöqtə ilə rəqəm yaz; ən çox 6 onluq və ±1 milyard.`,
      );
    return { label, value };
  });
  return points;
}
export function sourceText(references: Reference[]): string {
  return (
    references
      .map(
        (ref) =>
          `${ref.name}\n${/\.pdf$/i.test(ref.name) ? `${ref.pageCount} fiziki səhifəli fayldan əlavə edilmiş mətn` : "Sənəddən çıxarılmış mətn"}\n\n` +
          ref.pages
            .map(
              (page) =>
                `${sourcePosition(ref.name, page.number, true)}\n\n${page.text || "Oxuna bilən mətn yoxdur."}`,
            )
            .join("\n\n---\n\n"),
      )
      .join("\n\n================\n\n") + "\n"
  );
}
