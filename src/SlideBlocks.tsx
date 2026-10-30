import { useState } from "react";
import { ArrowRight, Layers, X } from "lucide-react";
import { BlockKind, slideBlocks } from "./model";

export default function SlideBlocks({
  open,
  onClose,
  onInsert,
  disabled,
}: {
  open: boolean;
  onClose: () => void;
  onInsert: (kind: BlockKind) => void;
  disabled: boolean;
}) {
  const [query, setQuery] = useState("");
  if (!open) return null;
  const visible = slideBlocks.filter((b) =>
    `${b.name} ${b.detail}`
      .toLocaleLowerCase("az")
      .includes(query.trim().toLocaleLowerCase("az")),
  );
  return (
    <div className="modal-backdrop">
      <section
        className="modal block-library"
        role="dialog"
        aria-modal="true"
        aria-labelledby="block-library-title"
      >
        <button
          className="modal-close icon-button"
          onClick={onClose}
          aria-label="Blok kitabxanasını bağla"
        >
          <X size={20} />
        </button>
        <Layers size={27} />
        <h2 id="block-library-title">Fikrini hansı formada göstərək?</h2>
        <p>Hazır struktur seç, məzmununu öz materialından əlavə et.</p>
        <input
          autoFocus
          aria-label="Slayd bloklarında axtar"
          placeholder="Məsələn, müqayisə və ya yol xəritəsi"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <div className="block-grid">
          {visible.map((b) => (
            <button
              key={b.id}
              className={`block-card block-${b.id}`}
              disabled={disabled}
              onClick={() => onInsert(b.id)}
            >
              <div className="block-sketch" aria-hidden="true">
                <i />
                <i />
                <i />
              </div>
              <strong>{b.name}</strong>
              <span>{b.detail}</span>
              <ArrowRight size={16} />
            </button>
          ))}
        </div>
        {!visible.length && <p>Uyğun blok tapılmadı. Başqa sözlə axtar.</p>}
        {disabled && <p>Layihə 80 slayd limitinə çatıb.</p>}
      </section>
    </div>
  );
}
