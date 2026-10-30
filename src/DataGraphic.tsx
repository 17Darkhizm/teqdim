import { chartBounds, dataProblems, parseChartNumber, Slide } from "./model";

export const formatDataNumber = (value: number) =>
  new Intl.NumberFormat("az-AZ", { maximumFractionDigits: 9 }).format(value);
export default function DataGraphic({ slide }: { slide: Slide }) {
  if (slide.layout === "table") {
    const table = slide.table;
    return table ? (
      <div
        className={`data-table-view ${table.rows.length > 5 ? "data-dense" : ""}`}
      >
        <table>
          <thead>
            <tr>
              {table.columns.map((c, i) => (
                <th key={i}>{c.trim() || <em>Başlıq əlavə et</em>}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {table.rows.map((row, i) => (
              <tr key={i}>
                {row.map((cell, j) => (
                  <td key={j}>{cell.trim() || <em>—</em>}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    ) : (
      <div className="data-placeholder">Cədvəl məlumatlarını əlavə et.</div>
    );
  }
  const chart = slide.chart;
  if (!chart || dataProblems(slide).length)
    return (
      <div className="data-placeholder">
        Diaqram üçün etiketləri və rəqəmləri əlavə et.
      </div>
    );
  const values = chart.points.map((p) => parseChartNumber(p.value)!);
  const bounds = chartBounds(values);
  const x = 64,
    y = 28,
    width = 466,
    height = 148;
  const projectY = (value: number) =>
    y + height - ((value - bounds.min) / (bounds.max - bounds.min)) * height;
  const baseline = projectY(0);
  const step = width / chart.points.length;
  const summary = chart.points
    .map(
      (p, i) =>
        `${p.label}: ${formatDataNumber(values[i])}${chart.unit ? ` ${chart.unit}` : ""}`,
    )
    .join("; ");
  return (
    <div className="data-chart-view">
      <svg
        viewBox="0 0 560 236"
        role="img"
        aria-label={`${chart.name || slide.title}. ${summary}`}
      >
        <title>{summary}</title>
        <text x={x} y={12} className="chart-name">
          {chart.name}
          {chart.unit ? ` (${chart.unit})` : ""}
        </text>
        {Array.from({ length: 5 }, (_, i) => {
          const tick = bounds.min + ((bounds.max - bounds.min) * i) / 4;
          const pos = projectY(tick);
          return (
            <g key={i}>
              <line
                x1={x}
                x2={x + width}
                y1={pos}
                y2={pos}
                className="chart-grid"
              />
              <text
                x={x - 9}
                y={pos + 3}
                textAnchor="end"
                className="chart-tick"
              >
                {formatDataNumber(tick)}
              </text>
            </g>
          );
        })}
        <line
          x1={x}
          x2={x + width}
          y1={baseline}
          y2={baseline}
          className="chart-baseline"
        />
        {chart.type === "line" && (
          <polyline
            fill="none"
            className="chart-path"
            points={values
              .map((v, i) => `${x + step * (i + 0.5)},${projectY(v)}`)
              .join(" ")}
          />
        )}{" "}
        {chart.points.map((point, i) => {
          const px = x + step * (i + 0.5),
            py = projectY(values[i]);
          return (
            <g key={i}>
              <title>
                {point.label}: {formatDataNumber(values[i])}
              </title>
              {chart.type === "bar" ? (
                <rect
                  className="chart-bar"
                  x={px - step * 0.29}
                  y={Math.min(py, baseline)}
                  width={step * 0.58}
                  height={Math.abs(py - baseline)}
                  rx={2}
                />
              ) : (
                <circle className="chart-point" cx={px} cy={py} r={4} />
              )}
              <text
                x={px}
                y={values[i] >= 0 ? py - 7 : py + 14}
                textAnchor="middle"
                className="chart-value"
              >
                {formatDataNumber(values[i])}
              </text>
              <text x={px} y={205} textAnchor="middle" className="chart-label">
                {point.label.length > (chart.points.length > 5 ? 9 : 15)
                  ? point.label.slice(0, chart.points.length > 5 ? 7 : 13) + "…"
                  : point.label}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
