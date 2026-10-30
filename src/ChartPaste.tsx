import { useMemo, useState } from "react";
import { parseChartPaste } from "./editing";
import { ChartData } from "./model";
export default function ChartPaste({
  chart,
  onApply,
}: {
  chart: ChartData;
  onApply: (chart: ChartData) => void;
}) {
  const [text, setText] = useState("");
  const [message, setMessage] = useState("");
  const preview = useMemo(() => {
    try {
      return { points: parseChartPaste(text), error: "" };
    } catch (error) {
      return {
        points: [],
        error: error instanceof Error ? error.message : "Məlumat oxunmadı.",
      };
    }
  }, [text]);
  return (
    <details className="chart-paste">
      <summary>Cədvəldən diaqram məlumatı əlavə et</summary>
      <p>
        İlk sətir Etiket və Qiymət başlıqları, sonra 2–8 sətir olsun. Sütunları
        Tab ilə ayır.
      </p>
      <label htmlFor="chart-paste-text">Etiketlər və qiymətlər</label>
      <textarea
        id="chart-paste-text"
        maxLength={6000}
        placeholder={"Etiket\tQiymət\nBirinci\t12,5\nİkinci\t18"}
        value={text}
        onChange={(e) => {
          setText(e.target.value);
          setMessage("");
        }}
        aria-describedby="chart-paste-status"
      />
      <p
        id="chart-paste-status"
        role={text && preview.error ? "alert" : "status"}
      >
        {message ||
          (text
            ? preview.error ||
              `${preview.points.length} göstərici tətbiq üçün hazırdır.`
            : "Məlumatı yapışdırdıqda əvvəlcə önizləmə görünəcək.")}
      </p>
      {!!preview.points.length && (
        <table className="chart-paste-preview">
          <thead>
            <tr>
              <th>Etiket</th>
              <th>Qiymət</th>
            </tr>
          </thead>
          <tbody>
            {preview.points.map((point, i) => (
              <tr key={i}>
                <td>{point.label}</td>
                <td>{point.value}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      <button
        type="button"
        className="secondary"
        disabled={!!preview.error || !preview.points.length}
        onClick={() => {
          onApply({ ...chart, points: preview.points });
          setMessage(
            "Göstəricilər tətbiq edildi. “Geri al” ilə bərpa edə bilərsən.",
          );
        }}
      >
        Göstəriciləri tətbiq et
      </button>
    </details>
  );
}
