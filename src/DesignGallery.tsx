import { useState } from "react";
import { contrastRatio, filterThemes, themeTone } from "./design";
import { Project, Theme, themes, themeColors } from "./model";
import SlideView from "./SlideView";
export default function DesignGallery({
  project,
  selected,
  onApply,
  onClose,
}: {
  project: Project;
  selected: number;
  onApply: (theme: Theme) => void;
  onClose: () => void;
}) {
  const [query, setQuery] = useState(""),
    [category, setCategory] = useState("all"),
    [tone, setTone] = useState("all");
  const [choice, setChoice] = useState(project.theme);
  const [preview, setPreview] = useState("current");
  const index = preview === "first" ? 0 : selected;
  const visible = filterThemes(query, category, tone);
  return (
    <div className="modal-backdrop">
      <section
        className="modal design-gallery"
        role="dialog"
        aria-modal="true"
        aria-labelledby="design-gallery-title"
      >
        <button
          className="modal-close icon-button"
          onClick={onClose}
          aria-label="Dizayn qalereyasını bağla"
        >
          ×
        </button>
        <h2 id="design-gallery-title">Öz dizaynını seç</h2>
        <p>
          {themes.length} dizayn · Seçim önizləmədir. Tətbiq edəndə bütün
          slaydlara keçəcək.
        </p>
        <div className="gallery-filters">
          <input
            autoFocus
            aria-label="Dizaynlarda axtar"
            placeholder="Dizayn və ya üslub axtar…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <select
            aria-label="Dizayn kateqoriyası"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            <option value="all">Bütün kateqoriyalar</option>
            {[...new Set(themes.map((theme) => theme.category))].map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
          <select
            aria-label="Dizayn fonu"
            value={tone}
            onChange={(e) => setTone(e.target.value)}
          >
            <option value="all">Bütün fonlar</option>
            <option value="light">Açıq fon</option>
            <option value="dark">Tünd fon</option>
          </select>
          <select
            aria-label="Önizləmə slaydı"
            value={preview}
            onChange={(e) => setPreview(e.target.value)}
          >
            <option value="current">Seçilmiş slayd</option>
            <option value="first">İlk slayd</option>
          </select>
        </div>
        <div className="gallery-summary">
          <span role="status">
            {visible.length} / {themes.length} dizayn
          </span>
          {(query || category !== "all" || tone !== "all") && (
            <button
              className="text-button"
              onClick={() => {
                setQuery("");
                setCategory("all");
                setTone("all");
              }}
            >
              Dizayn filtrlərini sıfırla
            </button>
          )}
        </div>
        <div className="gallery-grid">
          {visible.map((theme) => {
            const palette = themeColors[theme.id];
            return (
              <button
                className={`gallery-card ${choice === theme.id ? "chosen" : ""}`}
                key={theme.id}
                aria-pressed={choice === theme.id}
                aria-label={`${theme.name} dizaynına bax`}
                onClick={() => setChoice(theme.id)}
              >
                <div className="gallery-preview">
                  <SlideView
                    slide={project.slides[index]}
                    index={index}
                    total={project.slides.length}
                    theme={theme.id}
                    design={project.design}
                    subject={project.subject}
                    author={project.author}
                    brief={project.brief}
                    mini
                  />
                </div>
                <div className="gallery-card-copy">
                  <strong>{theme.name}</strong>
                  <span>{theme.note}</span>
                  <small>
                    {theme.category} ·{" "}
                    {themeTone(theme.id) === "light" ? "Açıq fon" : "Tünd fon"}
                  </small>
                  <div
                    className="palette-dots"
                    aria-label="Fon, mətn və aksent rəngləri"
                  >
                    {Object.values(palette).map((color, i) => (
                      <i
                        key={i}
                        style={{ backgroundColor: `#${color}` }}
                        title={`#${color}`}
                      />
                    ))}
                    <small>
                      Mətn/fon:{" "}
                      {contrastRatio(palette.bg, palette.fg).toFixed(1)}:1
                    </small>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
        {!visible.length && <p>Uyğun dizayn tapılmadı. Filtrləri dəyiş.</p>}
        <div className="gallery-apply">
          <span>
            Seçim: {themes.find((theme) => theme.id === choice)?.name}
          </span>
          <div>
            <button className="secondary" onClick={onClose}>
              İmtina et
            </button>
            <button
              className="primary"
              onClick={() => {
                onApply(choice);
                onClose();
              }}
            >
              Dizaynı tətbiq et
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
