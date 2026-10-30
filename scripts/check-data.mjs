import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import ts from "typescript";
import JSZip from "jszip";
import {JSDOM} from "jsdom";

const root = fileURLToPath(new URL("../", import.meta.url));
const scratch = path.join(root, ".checks");
await fs.mkdir(scratch, { recursive: true });
const compiled = ts.transpileModule(
  await fs.readFile(path.join(root, "src/model.ts"), "utf8"),
  {
    compilerOptions: {
      target: ts.ScriptTarget.ES2022,
      module: ts.ModuleKind.ESNext,
    },
  },
);
const modulePath = path.join(scratch, "data-model.mjs");
await fs.writeFile(modulePath, compiled.outputText);
const {
  parseChartNumber,
  chartBounds,
  isTableData,
  isChartData,
  dataProblems,
  emptyChart,
  emptyTable,
  inspectDeck,
  exportPptx,
  themes,
  splitSlide,
} = await import(pathToFileURL(modulePath).href);
for (const [raw, value] of [
  ["12,5", 12.5],
  ["12.5", 12.5],
  ["-2,5", -2.5],
  ["0", 0],
  ["-0", 0],
  [".5", 0.5],
  ["0,000001", 0.000001],
  ["1000000000", 1000000000],
])
  assert.equal(parseChartNumber(raw), value);
for (const raw of [
  "",
  " ",
  "-",
  "NaN",
  "Infinity",
  "1e5",
  "1.234,5",
  "1,2.3",
  "1000000001",
  "0.1234567",
  "=1+1",
])
  assert.equal(parseChartNumber(raw), null, raw);
assert.deepEqual(chartBounds([-5, 10]), { min: -5, max: 10 });
assert.deepEqual(chartBounds([0, 0]), { min: 0, max: 1 });
assert.ok(isTableData(emptyTable()));
assert.ok(isChartData(emptyChart()));
assert.ok(
  dataProblems({
    id: "x",
    title: "Cədvəl",
    body: "",
    layout: "table",
    table: emptyTable(),
  }).length,
);
assert.ok(
  dataProblems({
    id: "x",
    title: "Diaqram",
    body: "",
    layout: "chart",
    chart: emptyChart(),
  }).length,
);
assert.equal(isTableData({ columns: ["A", "B"], rows: [["only one"]] }), false);
assert.equal(
  isTableData({ columns: ["A", "B"], rows: [["bad\nvalue", "OK"]] }),
  false,
);
assert.equal(
  isChartData({
    ...emptyChart(),
    points: [
      { label: "a", value: 1 },
      { label: "b", value: "2" },
    ],
  }),
  false,
);
const table = {
  columns: ["Mərhələ", "Qiymət"],
  rows: [
    ["İlkin", "12,5"],
    ["Son", "18"],
  ],
};
const tableSlide = {
  id: "table",
  title: "Müqayisə",
  body: "Sınaq üçün daxil edilmiş məlumat.",
  layout: "table",
  table,
};
assert.equal(dataProblems(tableSlide).length, 0);
assert.equal(splitSlide({ ...tableSlide, body: "a".repeat(700) }).length, 1);
assert.equal(inspectDeck([{ ...tableSlide, body: "" }]).length, 0);
const chart = {
  type: "bar",
  name: "Sınaq & müşahidə",
  unit: "ədəd",
  points: [
    { label: "İlkin", value: "-2,5" },
    { label: "Sıfır", value: "0" },
    { label: "=1+1", value: "12.5" },
  ],
};
assert.equal(
  dataProblems({ id: "c", title: "Sınaq", body: "", layout: "chart", chart })
    .length,
  0,
);
const base = {
  id: "data",
  subject: "Sınaq",
  author: "Yoxlama",
  updatedAt: "",
  references: [],
};
const xmlDom=new JSDOM('');const parser=new xmlDom.window.DOMParser();
function xmlDocument(text){const document=parser.parseFromString(text,'application/xml');assert.equal(document.getElementsByTagName('parsererror').length,0,'İxrac XML-i düzgün açılmalıdır');return document;}
const previous = process.cwd();
process.chdir(scratch);
try {
  for (const { id: theme } of themes) {
    for (const type of ["bar", "line"]) {
      const topic = `Məlumat ${theme} ${type}`;
      await exportPptx({
        ...base,
        topic,
        theme,
        slides: [
          tableSlide,
          {
            id: "chart",
            title: "Dəyişmə",
            body: "Texniki sınaq məlumatları.",
            layout: "chart",
            chart: { ...chart, type },
          },
        ],
      });
      const zip = await JSZip.loadAsync(await fs.readFile(`${topic}.pptx`));
      const tableXml = await zip.file("ppt/slides/slide1.xml").async("string");
      assert.ok(
        tableXml.includes("<a:tbl>"),
        "Cədvəl native və redaktə edilən olmalıdır",
      );
      assert.ok(tableXml.includes("Mərhələ") && tableXml.includes("12,5"));
      const chartPaths = Object.keys(zip.files).filter((p) =>
        /^ppt\/charts\/chart\d+\.xml$/.test(p),
      );
      assert.equal(chartPaths.length, 1);
      const chartXml = await zip.file(chartPaths[0]).async("string");
      xmlDocument(tableXml);xmlDocument(chartXml);
      assert.ok(
        chartXml.includes(type === "bar" ? "<c:barChart>" : "<c:lineChart>"),
      );
      assert.ok(
        chartXml.includes("İlkin") &&
          chartXml.includes("Sıfır") &&
          chartXml.includes("=1+1"),
      );
      assert.ok(chartXml.includes("-2.5") && chartXml.includes("12.5"));
      assert.ok(chartXml.includes("Sınaq &amp; müşahidə"));
      const workbookPath = Object.keys(zip.files).find((p) =>
        /^ppt\/embeddings\/.*\.xlsx$/.test(p),
      );
      assert.ok(
        workbookPath,
        "Diaqramın redaktə edilən məlumat faylı saxlanmalıdır",
      );
      const book = await JSZip.loadAsync(
        await zip.file(workbookPath).async("nodebuffer"),
      );
      const sheets = await Promise.all(
        Object.keys(book.files)
          .filter((p) => /^xl\/worksheets\/sheet\d+\.xml$/.test(p))
          .map((p) => book.file(p).async("string")),
      );
      assert.ok(
        sheets.some((xml) => xml.includes("-2.5") && xml.includes("12.5")),
      );
      sheets.forEach(xmlDocument);
      assert.ok(
        sheets.every((xml) => !xml.includes("<f>")),
        "İstifadəçi mətnləri worksheet formulasına çevrilməməlidir",
      );
    }
  }
  const maximumTable={columns:['A','B','C','D','E'],rows:Array.from({length:8},()=>Array.from({length:5},()=> 'W'.repeat(28)))};
  await exportPptx({...base,topic:'Maksimum cədvəl',theme:'sage',slides:[{...tableSlide,table:maximumTable}]});
  const maximumZip=await JSZip.loadAsync(await fs.readFile('Maksimum cədvəl.pptx'));
  const maximumDoc=xmlDocument(await maximumZip.file('ppt/slides/slide1.xml').async('string'));
  const rowElements=[...maximumDoc.getElementsByTagNameNS('http://schemas.openxmlformats.org/drawingml/2006/main','tr')];
  assert.equal(rowElements.length,9);
  const totalHeight=rowElements.reduce((sum,row)=>sum+Number(row.getAttribute('h')),0)/914400;
  assert.ok(2.65+totalHeight<=6.25,`Cədvəl mənbə və alt yazı sahəsini keçməməlidir: ${totalHeight}`);
  await assert.rejects(
    exportPptx({
      ...base,
      topic: "Boş",
      theme: "sage",
      slides: [
        {
          id: "empty",
          title: "Diaqram",
          body: "",
          layout: "chart",
          chart: emptyChart(),
        },
      ],
    }),
    /Slayd 1/,
  );
} finally {
  process.chdir(previous);
  xmlDom.window.close();
}
console.log(
  "Keçdi: onluq/vergül/mənfi/sıfır rəqəmlər, boş/yanlış data, cədvəl strukturu, 10 dizaynda native cədvəl və 2 chart növü, XLSX məlumatları və ixracın xəta qoruması.",
);
