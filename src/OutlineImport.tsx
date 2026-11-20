import { useMemo, useState } from "react";
import { parseOutline } from "./authoring";
import { Slide } from "./model";
export default function OutlineImport({
  remaining,
  onAppend,
  onClose,
}: {
  remaining: number;
  onAppend: (slides: Slide[]) => boolean;
  onClose: () => void;
}) {
  const [text, setText] = useState("");
  const preview = useMemo(() => {
    try {
      return { slides: parseOutline(text), error: "" };
    } catch (error) {
      return {
        slides: [],
        error: error instanceof Error ? error.message : "Plan oxunmadı.",
      };
    }
  }, [text]);
  const over = preview.slides.length > remaining;
  return (
    <div className="modal-backdrop">
      <section
        className="modal outline-import"
        role="dialog"
        aria-modal="true"
        aria-labelledby="outline-import-title"
      >
        <button
          className="modal-close icon-button"
          onClick={onClose}
          aria-label="Plan idxalını bağla"
        >
          ×
        </button>
        <h2 id="outline-import-title">Öz planını əlavə et</h2>
        <p>
          Hər slaydın başlığını # və ya ## ilə başlat, mətnini altına yaz. Mətn
          yenidən yazılmır, mənbələr avtomatik bağlanmır.
        </p>
        <label htmlFor="outline-import-text">Başlıqlar və slayd mətnləri</label>
        <textarea
          id="outline-import-text"
          autoFocus
          maxLength={240000}
          placeholder={"# Giriş\nMövzunun izahı\n\n# Nəticə\nƏsas nəticələr"}
          value={text}
          onChange={(event) => setText(event.target.value)}
          aria-describedby="outline-import-status"
        />
        <p
          id="outline-import-status"
          role={text && (preview.error || over) ? "alert" : "status"}
        >
          {text
            ? preview.error ||
              (over
                ? `Ən çox ${remaining} əlavə slayd üçün yer var. Planı qısalt.`
                : `${preview.slides.length} slayd planın sonuna əlavə olunacaq.`)
            : "Başlıqları yazdıqca slayd siyahısına burada baxa bilərsən."}
        </p>
        {!!preview.slides.length && (
          <ol className="outline-import-preview">
            {preview.slides.map((slide) => (
              <li key={slide.id}>
                <strong>{slide.title}</strong>
                <p>{slide.body || "Mətn hələ boşdur."}</p>
              </li>
            ))}
          </ol>
        )}
        <div className="panel-footer">
          <button className="secondary" onClick={onClose}>
            İmtina et
          </button>
          <button
            className="primary"
            disabled={!preview.slides.length || over || !!preview.error}
            onClick={() => {
              if (onAppend(preview.slides)) onClose();
            }}
          >
            Planın sonuna əlavə et
          </button>
        </div>
      </section>
    </div>
  );
}
