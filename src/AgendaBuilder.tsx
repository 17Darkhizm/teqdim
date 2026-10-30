import { useMemo, useState } from "react";
import { agendaCandidates, createAgenda } from "./editing";
import { Slide } from "./model";
export default function AgendaBuilder({
  slides,
  onInsert,
  onClose,
}: {
  slides: Slide[];
  onInsert: (items: Slide[]) => boolean;
  onClose: () => void;
}) {
  const candidates = agendaCandidates(slides);
  const [ids, setIds] = useState(() => candidates.map((item) => item.id));
  const preview = useMemo(() => {
    try {
      return { slides: createAgenda(slides, ids), error: "" };
    } catch (error) {
      return {
        slides: [],
        error: error instanceof Error ? error.message : "Plan hazırlanmadı.",
      };
    }
  }, [slides, ids]);
  const over = slides.length + preview.slides.length > 80;
  return (
    <div className="modal-backdrop">
      <section
        className="modal agenda-builder"
        role="dialog"
        aria-modal="true"
        aria-labelledby="agenda-title"
      >
        <button
          className="modal-close icon-button"
          onClick={onClose}
          aria-label="Başlıqlardan plan pəncərəsini bağla"
        >
          ×
        </button>
        <h2 id="agenda-title">Başlıqlardan plan slaydı</h2>
        <p>
          Seçdiyin başlıqlar mövcud ardıcıllıqla plan olacaq. Bir dəfə əlavə
          edilir; sonradan adi slayd kimi redaktə edə bilərsən.
        </p>
        <div className="agenda-actions">
          <button
            className="text-button"
            onClick={() => setIds(candidates.map((item) => item.id))}
          >
            Hamısını seç
          </button>
          <button className="text-button" onClick={() => setIds([])}>
            Seçimi təmizlə
          </button>
        </div>
        <fieldset className="agenda-choices">
          <legend>Plana daxil ediləcək başlıqlar</legend>
          {candidates.map((item) => (
            <label key={item.id}>
              <input
                type="checkbox"
                checked={ids.includes(item.id)}
                onChange={(e) =>
                  setIds(
                    e.target.checked
                      ? [...ids, item.id]
                      : ids.filter((id) => id !== item.id),
                  )
                }
              />
              {item.index + 1}. {item.title}
            </label>
          ))}
        </fieldset>
        <p role={preview.error || over ? "alert" : "status"}>
          {preview.error ||
            (over
              ? "Plan əlavə ediləndə 80 slayd limiti aşılır. Daha az başlıq seç."
              : `${preview.slides.length} plan slaydı əvvələ (üz qabığı varsa, ondan sonra) əlavə olunacaq.`)}
        </p>
        <div className="agenda-preview">
          {preview.slides.map((slide) => (
            <article key={slide.id}>
              <strong>{slide.title}</strong>
              <p>{slide.body}</p>
            </article>
          ))}
        </div>
        <div className="panel-footer">
          <button className="secondary" onClick={onClose}>
            İmtina et
          </button>
          <button
            className="primary"
            disabled={!!preview.error || over || !preview.slides.length}
            onClick={() => {
              if (onInsert(preview.slides)) onClose();
            }}
          >
            Plan slaydlarını əlavə et
          </button>
        </div>
      </section>
    </div>
  );
}
