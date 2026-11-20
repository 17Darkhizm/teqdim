import { useMemo, useState } from "react";
import { ReplaceField, ReplacementResult, replaceAcross } from "./editing";
import { Slide } from "./model";
const fields: { id: ReplaceField; label: string }[] = [
  { id: "title", label: "Başlıqlar" },
  { id: "body", label: "Slayd mətnləri" },
  { id: "notes", label: "Çıxış qeydləri" },
];
export default function ReplaceDialog({
  slides,
  selected,
  onApply,
  onClose,
}: {
  slides: Slide[];
  selected: number;
  onApply: (result: ReplacementResult) => void;
  onClose: () => void;
}) {
  const [query, setQuery] = useState(""),
    [replacement, setReplacement] = useState("");
  const [matchCase, setMatchCase] = useState(false),
    [wholeWord, setWholeWord] = useState(false);
  const [scope, setScope] = useState<"all" | "current">("all");
  const [chosen, setChosen] = useState<ReplaceField[]>([
    "title",
    "body",
    "notes",
  ]);
  const result = useMemo(
    () =>
      replaceAcross(slides, selected, {
        query,
        replacement,
        matchCase,
        wholeWord,
        scope,
        fields: chosen,
      }),
    [slides, selected, query, replacement, matchCase, wholeWord, scope, chosen],
  );
  return (
    <div className="modal-backdrop">
      <section
        className="modal replace-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="replace-text-title"
      >
        <button
          className="modal-close icon-button"
          aria-label="Əvəzləmə pəncərəsini bağla"
          onClick={onClose}
        >
          ×
        </button>
        <h2 id="replace-text-title">Mətni tap və əvəzlə</h2>
        <p>
          Əvvəlcə dəyişikliklərə bax. Cədvəl, diaqram, şəkil və mənbə
          məlumatları burada dəyişmir.
        </p>
        <label htmlFor="replace-query">Tap</label>
        <input
          id="replace-query"
          autoFocus
          maxLength={160}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <label htmlFor="replace-value">Bununla əvəzlə</label>
        <input
          id="replace-value"
          maxLength={8000}
          value={replacement}
          onChange={(e) => setReplacement(e.target.value)}
        />
        <label htmlFor="replace-scope">Harada axtaraq?</label>
        <select
          id="replace-scope"
          value={scope}
          onChange={(e) => setScope(e.target.value as "all" | "current")}
        >
          <option value="all">Bütün təqdimat</option>
          <option value="current">Yalnız seçilən slayd</option>
        </select>
        <div className="editing-checkboxes">
          <label>
            <input
              type="checkbox"
              checked={matchCase}
              onChange={(e) => setMatchCase(e.target.checked)}
            />
            Böyük və kiçik hərfləri fərqləndir
          </label>
          <label>
            <input
              type="checkbox"
              checked={wholeWord}
              onChange={(e) => setWholeWord(e.target.checked)}
            />
            Yalnız bütöv sözləri tap
          </label>
        </div>
        <fieldset>
          <legend>Dəyişəcək sahələr</legend>
          <div className="editing-checkboxes">
            {fields.map((field) => (
              <label key={field.id}>
                <input
                  type="checkbox"
                  checked={chosen.includes(field.id)}
                  onChange={(e) =>
                    setChosen(
                      e.target.checked
                        ? [...chosen, field.id]
                        : chosen.filter((id) => id !== field.id),
                    )
                  }
                />
                {field.label}
              </label>
            ))}
          </div>
        </fieldset>
        <p role={query && result.error ? "alert" : "status"}>
          {result.error ||
            `${new Set(result.changes.map((change) => change.index)).size} slaydda ${result.count} əvəzləmə.`}
        </p>
        {!!result.changes.length && (
          <div className="replace-preview">
            {result.changes.map((change) => (
              <article key={`${change.index}-${change.field}`}>
                <strong>
                  Slayd {change.index + 1} ·{" "}
                  {fields.find((field) => field.id === change.field)?.label} ·{" "}
                  {change.count} uyğunluq
                </strong>
                <p>
                  <span>Əvvəl:</span> {change.before}
                </p>
                <p>
                  <span>Sonra:</span> {change.after}
                </p>
              </article>
            ))}
          </div>
        )}
        <div className="panel-footer">
          <button className="secondary" onClick={onClose}>
            İmtina et
          </button>
          <button
            className="primary"
            disabled={!!result.error || !result.count}
            onClick={() => {
              onApply(result);
              onClose();
            }}
          >
            Əvəzləmələri tətbiq et
          </button>
        </div>
      </section>
    </div>
  );
}
