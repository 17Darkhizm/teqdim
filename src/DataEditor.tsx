import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { downloadText } from "./authoring";
import { tableTsv, chartTsv, parseTsvRows } from "./editing";
import ChartPaste from "./ChartPaste";
import {
  ChartData,
  dataProblems,
  emptyChart,
  emptyTable,
  isTableData,
  Slide,
  TableData,
} from "./model";

export function parseTablePaste(text: string): TableData {
  const cells = parseTsvRows(text).map((row) => row.map((cell) => cell.trim()));
  if (cells.length < 2 || cells.length > 9)
    throw new Error("Başlıq və 1–8 məlumat sətiri əlavə et.");
  const width = cells[0].length;
  if (width < 2 || width > 5 || cells.some((row) => row.length !== width))
    throw new Error(
      "Hər sətirdə eyni sayda, 2–5 sütun olmalıdır. Sütunlar Tab ilə ayrılır.",
    );
  if (cells.some((row) => row.some((cell) => cell.length > 80)))
    throw new Error("Bir xana ən çox 80 simvol ola bilər.");
  const table = { columns: cells[0], rows: cells.slice(1) };
  if (!isTableData(table))
    throw new Error(
      "Cədvəldə dəstəklənməyən idarəetmə simvolları var. Mətni təmizləyib yenidən əlavə et.",
    );
  return table;
}
export default function DataEditor({
  slide,
  onTable,
  onChart,
}: {
  slide: Slide;
  onTable: (table: TableData, group?: string) => void;
  onChart: (chart: ChartData, group?: string) => void;
}) {
  const [paste, setPaste] = useState("");
  const [message, setMessage] = useState("");
  const [exportError, setExportError] = useState("");
  const problems = dataProblems(slide);
  function exportData() {
    setExportError("");
    try {
      downloadText(
        slide.title,
        "melumat",
        slide.layout === "table"
          ? tableTsv(slide.table || emptyTable())
          : chartTsv(slide.chart || emptyChart()),
        "tsv",
      );
    } catch (error) {
      setExportError(
        error instanceof Error ? error.message : "Məlumat yüklənmədi.",
      );
    }
  }
  if (slide.layout !== "table" && slide.layout !== "chart") return null;
  if (slide.layout === "table") {
    const table = slide.table || emptyTable();
    function cell(row: number, col: number, value: string) {
      onTable(
        {
          ...table,
          rows: table.rows.map((r, i) =>
            i === row ? r.map((c, j) => (j === col ? value : c)) : r,
          ),
        },
        `cell:${row}:${col}`,
      );
    }
    return (
      <section className="data-editor" aria-label="Cədvəl məlumatları">
        <div className="data-editor-title">
          <h3>Cədvəlin məlumatları</h3>
          <span>
            {table.rows.length}/8 sətir · {table.columns.length}/5 sütun
          </span>
        </div>
        <div className="table-input-scroll">
          <table>
            <thead>
              <tr>
                {table.columns.map((column, i) => (
                  <th key={i}>
                    <input
                      aria-label={`${i + 1}-ci sütunun başlığı`}
                      placeholder={`Başlıq ${i + 1}`}
                      value={column}
                      maxLength={80}
                      onChange={(e) =>
                        onTable(
                          {
                            ...table,
                            columns: table.columns.map((c, j) =>
                              j === i ? e.target.value : c,
                            ),
                          },
                          `column:${i}`,
                        )
                      }
                    />
                    <button
                      type="button"
                      className="icon-button danger"
                      aria-label={`${i + 1}-ci sütunu çıxar`}
                      disabled={table.columns.length <= 2}
                      onClick={() =>
                        onTable({
                          columns: table.columns.filter((_, j) => j !== i),
                          rows: table.rows.map((r) =>
                            r.filter((_, j) => j !== i),
                          ),
                        })
                      }
                    >
                      <Trash2 size={12} />
                    </button>
                  </th>
                ))}
                <th />
              </tr>
            </thead>
            <tbody>
              {table.rows.map((row, i) => (
                <tr key={i}>
                  {row.map((value, j) => (
                    <td key={j}>
                      <input
                        aria-label={`${i + 1}-ci sətir, ${j + 1}-ci sütun`}
                        value={value}
                        placeholder="Məlumat"
                        maxLength={80}
                        onChange={(e) => cell(i, j, e.target.value)}
                      />
                    </td>
                  ))}
                  <td>
                    <button
                      type="button"
                      className="icon-button danger"
                      aria-label={`${i + 1}-ci sətiri çıxar`}
                      disabled={table.rows.length <= 1}
                      onClick={() =>
                        onTable({
                          ...table,
                          rows: table.rows.filter((_, j) => j !== i),
                        })
                      }
                    >
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="data-actions">
          <button
            type="button"
            className="text-button"
            disabled={table.rows.length >= 8}
            onClick={() =>
              onTable({
                ...table,
                rows: [...table.rows, table.columns.map(() => "")],
              })
            }
          >
            <Plus size={14} />
            Sətir əlavə et
          </button>
          <button
            type="button"
            className="text-button"
            disabled={table.columns.length >= 5}
            onClick={() =>
              onTable({
                columns: [...table.columns, ""],
                rows: table.rows.map((row) => [...row, ""]),
              })
            }
          >
            <Plus size={14} />
            Sütun əlavə et
          </button>
        </div>
        <details className="table-paste">
          <summary>Excel-dən və ya başqa cədvəldən köçür</summary>
          <p>
            İlk sətir başlıqdır. Sütunları Tab, sətirləri yeni sətirlə ayır.
            Tətbiq etdikdə hazırkı cədvəl əvəz olunur; “Geri al” ilə bərpa edə
            bilərsən.
          </p>
          <textarea
            aria-label="Tab ilə ayrılmış cədvəl mətni"
            value={paste}
            maxLength={6000}
            onChange={(e) => {
              setPaste(e.target.value);
              setMessage("");
            }}
            placeholder={"Başlıq 1\tBaşlıq 2\nMəlumat 1\tMəlumat 2"}
          />
          <button
            type="button"
            className="secondary"
            disabled={!paste.trim()}
            onClick={() => {
              try {
                onTable(parseTablePaste(paste));
                setMessage("Cədvəl tətbiq edildi.");
              } catch (e) {
                setMessage(e instanceof Error ? e.message : "Cədvəl oxunmadı.");
              }
            }}
          >
            Cədvəli tətbiq et
          </button>
          {message && <p role="status">{message}</p>}
        </details>
        <button type="button" className="text-button" onClick={exportData}>
          Cədvəli TSV kimi yüklə
        </button>
        {exportError && <p role="alert">{exportError}</p>}
        {problems.map((p) => (
          <p key={p} className="data-warning">
            {p}
          </p>
        ))}
      </section>
    );
  }
  const chart = slide.chart || emptyChart();
  return (
    <section className="data-editor" aria-label="Diaqram məlumatları">
      <div className="data-editor-title">
        <h3>Diaqramın məlumatları</h3>
        <span>{chart.points.length}/8 göstərici</span>
      </div>
      <div
        className="chart-type-options"
        role="group"
        aria-label="Diaqramın növü"
      >
        {[
          { type: "bar" as const, name: "Sütun" },
          { type: "line" as const, name: "Xətt" },
        ].map((c) => (
          <button
            type="button"
            key={c.type}
            className={chart.type === c.type ? "chosen" : ""}
            aria-pressed={chart.type === c.type}
            onClick={() => onChart({ ...chart, type: c.type })}
          >
            {c.name}
          </button>
        ))}
      </div>
      <div className="field-row">
        <div>
          <label htmlFor="chart-name">Göstəricinin adı</label>
          <input
            id="chart-name"
            maxLength={80}
            placeholder="Məsələn, iştirakçı sayı"
            value={chart.name}
            onChange={(e) =>
              onChart({ ...chart, name: e.target.value }, "name")
            }
          />
        </div>
        <div>
          <label htmlFor="chart-unit">Ölçü vahidi</label>
          <input
            id="chart-unit"
            maxLength={20}
            placeholder="Məsələn, nəfər və ya %"
            value={chart.unit}
            onChange={(e) =>
              onChart({ ...chart, unit: e.target.value }, "unit")
            }
          />
        </div>
      </div>
      <div className="chart-points">
        {chart.points.map((point, i) => (
          <div key={i}>
            <span>{String(i + 1).padStart(2, "0")}</span>
            <input
              aria-label={`${i + 1}-ci göstəricinin etiketi`}
              placeholder="Etiket"
              maxLength={40}
              value={point.label}
              onChange={(e) =>
                onChart(
                  {
                    ...chart,
                    points: chart.points.map((p, j) =>
                      j === i ? { ...p, label: e.target.value } : p,
                    ),
                  },
                  `label:${i}`,
                )
              }
            />
            <input
              aria-label={`${i + 1}-ci göstəricinin qiyməti`}
              placeholder="Rəqəm"
              inputMode="decimal"
              maxLength={32}
              value={point.value}
              onChange={(e) =>
                onChart(
                  {
                    ...chart,
                    points: chart.points.map((p, j) =>
                      j === i ? { ...p, value: e.target.value } : p,
                    ),
                  },
                  `value:${i}`,
                )
              }
            />
            <button
              type="button"
              className="icon-button danger"
              disabled={chart.points.length <= 2}
              aria-label={`${i + 1}-ci göstəricini çıxar`}
              onClick={() =>
                onChart({
                  ...chart,
                  points: chart.points.filter((_, j) => j !== i),
                })
              }
            >
              <Trash2 size={14} />
            </button>
          </div>
        ))}
      </div>
      <button
        type="button"
        className="text-button"
        disabled={chart.points.length >= 8}
        onClick={() =>
          onChart({
            ...chart,
            points: [...chart.points, { label: "", value: "" }],
          })
        }
      >
        <Plus size={14} />
        Göstərici əlavə et
      </button>
      <p className="data-hint">
        Yalnız öz mənbəndə olan rəqəmləri yaz. 12,5 və 12.5 qəbul edilir; boş
        xana sıfır sayılmır. Xətt diaqramı göstəriciləri yazdığın ardıcıllıqla
        birləşdirir.
      </p>
      <ChartPaste chart={chart} onApply={onChart} />
      <button type="button" className="text-button" onClick={exportData}>
        Diaqram məlumatını TSV kimi yüklə
      </button>
      {exportError && <p role="alert">{exportError}</p>}
      {problems.map((p) => (
        <p key={p} className="data-warning">
          {p}
        </p>
      ))}
    </section>
  );
}
