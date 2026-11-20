import { useEffect, useState } from "react";
import { BookOpen, Check, Link2, Search, X } from "lucide-react";
import type { Citation, Reference, Slide } from "./model";
import { sourcePosition } from "./model";
import { downloadText } from "./authoring";
import { sourceText } from "./editing";

export default function SourceInspector({
  slide,
  references,
  onChange,
  onEditMaterial,
}: {
  slide: Slide;
  references: Reference[];
  onChange: (citations: Citation[]) => void;
  onEditMaterial: () => void;
}) {
  const [query, setQuery] = useState("");
  const [source, setSource] = useState("all");
  useEffect(() => {
    if (source !== "all" && !references.some((r) => r.id === source))
      setSource("all");
  }, [source, references]);
  const normalized = query.trim().toLocaleLowerCase("az");
  const allPages = references.flatMap((ref) =>
    ref.pages.map((page) => ({ ref, page })),
  );
  const visible = allPages.filter(
    ({ ref, page }) =>
      (source === "all" || ref.id === source) &&
      (!normalized ||
        `${ref.name} ${page.text}`
          .toLocaleLowerCase("az")
          .includes(normalized)),
  );
  function attached(id: string, page: number) {
    return (
      slide.citations?.some((c) => c.sourceId === id && c.page === page) ||
      false
    );
  }
  return (
    <section
      className="source-inspector"
      aria-label="Mənbə materiallarını yoxla"
    >
      <div className="source-title">
        <BookOpen size={17} />
        <h3>Mənbəyə qayıt</h3>
        <span>{references.length} fayl</span>
      </div>
      <p className="source-intro">
        Slaydın fikrini orijinal materialdan çıxarılmış mətnlə tutuşdur. Bu,
        sənədin vizual görüntüsü deyil.
      </p>
      <div className="attached-citations">
        {(slide.citations || []).map((c) => (
          <div
            key={`${c.sourceId}:${c.page}`}
            className={
              allPages.some(
                (p) =>
                  p.ref.id === c.sourceId &&
                  p.ref.name === c.name &&
                  p.page.number === c.page &&
                  !!p.page.text.trim(),
              )
                ? ""
                : "missing"
            }
          >
            <Link2 size={12} />
            <span>
              {c.name} · {sourcePosition(c.name, c.page)}
            </span>
            <button
              className="icon-button"
              aria-label={`${c.name} ${sourcePosition(c.name, c.page, true)} istinadını çıxar`}
              onClick={() =>
                onChange(
                  (slide.citations || []).filter(
                    (item) =>
                      item.sourceId !== c.sourceId || item.page !== c.page,
                  ),
                )
              }
            >
              <X size={12} />
            </button>
          </div>
        ))}
      </div>
      {!references.length ? (
        <div className="source-empty">
          <p>Hələ sənəd əlavə etməmisən.</p>
          <button className="secondary" onClick={onEditMaterial}>
            Material əlavə et
          </button>
        </div>
      ) : (
        <>
          <div className="source-filters">
            <div className="search-field">
              <Search size={14} />
              <input
                aria-label="Mənbə mətnində axtar"
                placeholder="Mətn və ya fayl adı axtar…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
              {query && (
                <button
                  className="icon-button"
                  onClick={() => setQuery("")}
                  aria-label="Mənbə axtarışını təmizlə"
                >
                  <X size={13} />
                </button>
              )}
            </div>
            <select
              aria-label="Mənbə faylını seç"
              value={source}
              onChange={(e) => setSource(e.target.value)}
            >
              <option value="all">Bütün sənədlər</option>
              {references.map((ref) => (
                <option key={ref.id} value={ref.id}>
                  {ref.name}
                </option>
              ))}
            </select>
          </div>
          <div className="source-pages">
            {visible.length ? (
              visible.map(({ ref, page }) => (
                <details
                  key={`${ref.id}:${page.number}`}
                  className={attached(ref.id, page.number) ? "linked" : ""}
                >
                  <summary>
                    <span>
                      <b>{ref.name}</b>
                      <small>{sourcePosition(ref.name, page.number, true)}</small>
                    </span>
                    {attached(ref.id, page.number) && <Check size={14} />}
                  </summary>
                  <p className="source-page-text">
                    {page.text || "Bu səhifədə oxuna bilən mətn yoxdur."}
                  </p>
                  <button
                    className="secondary"
                    disabled={
                      !page.text.trim() || attached(ref.id, page.number)
                    }
                    onClick={() =>
                      onChange([
                        ...(slide.citations || []),
                        { sourceId: ref.id, name: ref.name, page: page.number },
                      ])
                    }
                  >
                    <Link2 size={13} />
                    {attached(ref.id, page.number)
                      ? "İstinad əlavə edilib"
                      : "Slayda istinad əlavə et"}
                  </button>
                </details>
              ))
            ) : (
              <p className="source-empty">Uyğun mətn tapılmadı.</p>
            )}
          </div>
          <button
            className="text-button"
            onClick={() =>
              downloadText("Teqdim", "menbe-metnleri", sourceText(references))
            }
          >
            Mənbə mətnlərini yüklə
          </button>
          <p className="source-footnote">
            İstinad bağlamaq məzmunun doğruluğunu avtomatik təsdiqləmir. Səhifə
            nömrəsi yalnız PDF üçün fayldakı fiziki sıradır. Digər sənədlər bütöv mətn kimi göstərilir.
          </p>
        </>
      )}
    </section>
  );
}
