import { useEffect, useRef, useState } from "react";
import {
  ArrowRight,
  Copy,
  Download,
  FolderOpen,
  Loader2,
  Search,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { BACKUP_LIMIT, decodeBackup, downloadBackup } from "./backup";
import { Project, themes, Theme } from "./model";
import SlideView from "./SlideView";

export default function ProjectLibrary({
  projects,
  onOpen,
  onDelete,
  onNew,
  onImport,
  onClone,
}: {
  projects: Project[];
  onOpen: (p: Project) => void;
  onDelete: (id: string) => void;
  onNew: () => void;
  onImport: (p: Project) => boolean;
  onClone: (p: Project) => void;
}) {
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<"recent" | "name">("recent");
  const [subjectFilter, setSubjectFilter] = useState("");
  const [themeFilter, setThemeFilter] = useState<Theme | "all">("all");
  const [busy, setBusy] = useState(false);
  const subjects = [
    ...new Set(projects.map((project) => project.subject.trim())),
  ].sort((a, b) => a.localeCompare(b, "az"));
  function clearFilters() {
    setQuery("");
    setSubjectFilter("");
    setThemeFilter("all");
  }
  const [message, setMessage] = useState("");
  const input = useRef<HTMLInputElement>(null);
  const importing = useRef(false);
  const mounted = useRef(false);
  const latestImport = useRef(onImport);
  latestImport.current = onImport;
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);
  const normalized = query.trim().toLocaleLowerCase("az");
  const visible = projects
    .filter(
      (project) =>
        (!subjectFilter ||
          JSON.stringify(project.subject.trim()) === subjectFilter) &&
        (themeFilter === "all" || project.theme === themeFilter),
    )
    .filter((p) =>
      `${p.topic} ${p.subject} ${p.author}`
        .toLocaleLowerCase("az")
        .includes(normalized),
    )
    .sort((a, b) =>
      sort === "name"
        ? a.topic.localeCompare(b.topic, "az")
        : (Date.parse(b.updatedAt) || 0) - (Date.parse(a.updatedAt) || 0),
    );
  async function importFile(file?: File) {
    if (!file || importing.current) return;
    importing.current = true;
    setMessage("");
    setBusy(true);
    try {
      if (file.size > BACKUP_LIMIT)
        throw new Error("Ehtiyat nüsxə ən çox 2 MB ola bilər.");
      const text = await file.text();
      if (!mounted.current) return;
      if (!latestImport.current(decodeBackup(text)))
        throw new Error(
          "Brauzer yaddaşı doludur. Əvvəlcə digər təqdimatlarının ehtiyat nüsxəsini saxla.",
        );
      setQuery("");
      setSort("recent");
      setSubjectFilter("");
      setThemeFilter("all");
      setMessage("Ehtiyat nüsxə yeni təqdimat kimi əlavə edildi.");
    } catch (error) {
      if (!mounted.current) return;
      setMessage(
        error instanceof Error ? error.message : "Fayl açıla bilmədi.",
      );
    } finally {
      importing.current = false;
      if (mounted.current) setBusy(false);
      if (input.current) input.current.value = "";
    }
  }
  return (
    <section className="workspace library">
      <div className="library-header">
        <div className="page-title">
          <div className="eyebrow">FİKİRLƏRİN BİR ARADA</div>
          <h1>
            Təqdimatlarım<span>.</span>
          </h1>
          <p>Bu brauzerdə saxladığın təqdimatlara davam et.</p>
        </div>
        <button
          className="secondary"
          disabled={busy}
          onClick={() => input.current?.click()}
        >
          {busy ? <Loader2 size={16} className="spin" /> : <Upload size={16} />}
          Ehtiyat nüsxəni aç
        </button>
        <input
          ref={input}
          type="file"
          className="sr-only"
          accept=".json,application/json"
          aria-label="Təqdim ehtiyat nüsxəsi seç"
          onChange={(e) => void importFile(e.target.files?.[0])}
        />
      </div>
      <div className="library-tools">
        <div className="search-field">
          <Search size={16} />
          <input
            aria-label="Təqdimatlarda axtar"
            placeholder="Mövzu, fənn və ya ad axtar…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          {query && (
            <button
              className="icon-button"
              aria-label="Axtarışı təmizlə"
              onClick={() => setQuery("")}
            >
              <X size={14} />
            </button>
          )}
        </div>
        <label className="sr-only" htmlFor="project-sort">
          Sıralama
        </label>
        <select
          id="project-sort"
          value={sort}
          onChange={(e) => setSort(e.target.value as "recent" | "name")}
        >
          <option value="recent">Son dəyişiklik</option>
          <option value="name">Ada görə</option>
        </select>
        <select
          aria-label="Təqdimatları fənnə görə süz"
          value={subjectFilter}
          onChange={(e) => setSubjectFilter(e.target.value)}
        >
          <option value="">Bütün fənlər</option>
          {subjects.map((subject) => (
            <option key={subject} value={JSON.stringify(subject)}>
              {subject || "Fənn seçilməyib"}
            </option>
          ))}
        </select>
        <select
          aria-label="Təqdimatları dizayna görə süz"
          value={themeFilter}
          onChange={(e) => setThemeFilter(e.target.value as Theme | "all")}
        >
          <option value="all">Bütün dizaynlar</option>
          {themes.map((theme) => (
            <option key={theme.id} value={theme.id}>
              {theme.name}
            </option>
          ))}
        </select>
        {(query || subjectFilter || themeFilter !== "all") && (
          <button className="text-button" onClick={clearFilters}>
            Filtrləri sıfırla
          </button>
        )}
        <span>{visible.length} təqdimat</span>
      </div>
      {message && (
        <p role="status" className="library-message">
          {message}
        </p>
      )}
      {!projects.length ? (
        <div className="empty">
          <FolderOpen size={42} />
          <h2>İlk təqdimatın səni gözləyir</h2>
          <p>Hazırladığın təqdimatı saxla və ya əvvəlki ehtiyat nüsxəni aç.</p>
          <button className="primary" onClick={onNew}>
            Təqdimat hazırla
            <ArrowRight size={16} />
          </button>
        </div>
      ) : !visible.length ? (
        <div className="empty">
          <Search size={35} />
          <h2>Uyğun təqdimat tapılmadı</h2>
          <p>Başqa sözlə axtar və ya filtri təmizlə.</p>
          <button className="secondary" onClick={clearFilters}>
            Bütün təqdimatları göstər
          </button>
        </div>
      ) : (
        <div className="project-grid">
          {visible.map((p) => (
            <article className="project-card" key={p.id}>
              <button
                className="project-preview"
                onClick={() => onOpen(p)}
                aria-label={`${p.topic} təqdimatını aç`}
              >
                <SlideView
                  slide={p.slides[0]}
                  index={0}
                  total={p.slides.length}
                  theme={p.theme}
                  subject={p.subject}
                  author={p.author}
                  brief={p.brief}
                  design={p.design}
                  mini
                />
              </button>
              <div className="project-meta">
                <button onClick={() => onOpen(p)}>
                  <strong>{p.topic}</strong>
                  <span>
                    {p.slides.length} slayd · {p.subject || "Fənn seçilməyib"}
                    <br />
                    {Number.isNaN(Date.parse(p.updatedAt))
                      ? "Tarix məlum deyil"
                      : new Date(p.updatedAt).toLocaleDateString("az-AZ")}
                  </span>
                </button>
              </div>
              <div className="project-actions">
                <button className="text-button" onClick={() => onClone(p)}>
                  <Copy size={13} />
                  Surət
                </button>
                <button
                  className="text-button"
                  onClick={() => {
                    try {
                      downloadBackup(p);
                    } catch (error) {
                      setMessage(
                        error instanceof Error
                          ? error.message
                          : "Ehtiyat nüsxə hazırlanmadı.",
                      );
                    }
                  }}
                  title="Slayd, dizayn, qeydlər və sənədlərdən çıxarılmış mətnləri yüklə"
                >
                  <Download size={13} />
                  Ehtiyat nüsxə
                </button>
                <button
                  className="icon-button danger"
                  aria-label={`${p.topic} təqdimatını sil`}
                  onClick={() => onDelete(p.id)}
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
      <p className="library-privacy">
        Ehtiyat nüsxə .teqdim.json faylıdır. Slaydlar, çıxış qeydləri və sənədlərdən
        çıxarılmış mətnləri saxlayır; orijinal sənəd faylları daxil edilmir.
      </p>
    </section>
  );
}
