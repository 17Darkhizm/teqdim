import { useEffect, useRef, useState } from "react";
import { Plus, Trash2, Upload, Loader2 } from "lucide-react";
import {
  ComparisonData,
  emptyComparison,
  emptyTimeline,
  ImageAsset,
  Slide,
  TimelineData,
} from "./model";

export default function VisualEditor({
  slide,
  onComparison,
  onTimeline,
  onImage,
}: {
  slide: Slide;
  onComparison: (data: ComparisonData, group?: string) => void;
  onTimeline: (data: TimelineData, group?: string) => void;
  onImage: (image: ImageAsset | undefined, group?: string) => boolean;
}) {
  const [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const input = useRef<HTMLInputElement>(null);
  const generation = useRef(0);
  const latestImage = useRef(onImage);
  latestImage.current = onImage;
  useEffect(() => {
    // Changing layout or restoring another image cancels an earlier upload.
    generation.current++;
    setBusy(false);
    setError("");
  }, [slide.layout, slide.image]);
  useEffect(
    () => () => {
      generation.current++;
    },
    [],
  );
  if (slide.layout === "comparison") {
    const data = slide.comparison || emptyComparison();
    return (
      <section className="visual-editor" aria-label="Müqayisə məlumatları">
        <h3>İki yanaşmanı aydınlaşdır</h3>
        <div className="comparison-inputs">
          {(["left", "right"] as const).map((side) => (
            <div key={side}>
              <label htmlFor={`compare-${side}-title`}>
                {side === "left" ? "Birinci" : "İkinci"} tərəfin başlığı
              </label>
              <input
                id={`compare-${side}-title`}
                value={side === "left" ? data.leftTitle : data.rightTitle}
                maxLength={60}
                onChange={(e) =>
                  onComparison(
                    {
                      ...data,
                      [side === "left" ? "leftTitle" : "rightTitle"]:
                        e.target.value,
                    },
                    `${side}:title`,
                  )
                }
              />
              <label htmlFor={`compare-${side}`}>İzah</label>
              <textarea
                id={`compare-${side}`}
                maxLength={220}
                placeholder="Öz materialından izah əlavə et…"
                value={data[side]}
                onChange={(e) =>
                  onComparison({ ...data, [side]: e.target.value }, side)
                }
              />
              <small>{data[side].length}/220</small>
            </div>
          ))}
        </div>
      </section>
    );
  }
  if (slide.layout === "timeline") {
    const data = slide.timeline || emptyTimeline();
    function update(
      i: number,
      field: "label" | "title" | "body",
      value: string,
    ) {
      onTimeline(
        {
          steps: data.steps.map((s, j) =>
            i === j ? { ...s, [field]: value } : s,
          ),
        },
        `${i}:${field}`,
      );
    }
    return (
      <section className="visual-editor" aria-label="Mərhələlərin məlumatları">
        <div className="data-editor-title">
          <h3>Ardıcıllığı özün qur</h3>
          <span>{data.steps.length}/5 mərhələ</span>
        </div>
        <div className="timeline-inputs">
          {data.steps.map((step, i) => (
            <div key={i}>
              <span>{String(i + 1).padStart(2, "0")}</span>
              <div>
                <div className="field-row">
                  <div>
                    <label htmlFor={`step-label-${i}`}>
                      Tarix / etiket (istəyə bağlı)
                    </label>
                    <input
                      id={`step-label-${i}`}
                      maxLength={30}
                      value={step.label}
                      placeholder="Öz tarixini və ya etiketini yaz"
                      onChange={(e) => update(i, "label", e.target.value)}
                    />
                  </div>
                  <div>
                    <label htmlFor={`step-title-${i}`}>Başlıq</label>
                    <input
                      id={`step-title-${i}`}
                      maxLength={60}
                      value={step.title}
                      placeholder="Mərhələnin adı"
                      onChange={(e) => update(i, "title", e.target.value)}
                    />
                  </div>
                </div>
                <label htmlFor={`step-body-${i}`}>Qısa izah</label>
                <input
                  id={`step-body-${i}`}
                  maxLength={120}
                  value={step.body}
                  onChange={(e) => update(i, "body", e.target.value)}
                />
              </div>
              <button
                type="button"
                className="icon-button danger"
                disabled={data.steps.length <= 2}
                aria-label={`${i + 1}-ci mərhələni çıxar`}
                onClick={() =>
                  onTimeline({ steps: data.steps.filter((_, j) => i !== j) })
                }
              >
                <Trash2 size={15} />
              </button>
            </div>
          ))}
        </div>
        <button
          type="button"
          className="text-button"
          disabled={data.steps.length >= 5}
          onClick={() =>
            onTimeline({
              steps: [...data.steps, { label: "", title: "", body: "" }],
            })
          }
        >
          <Plus size={14} />
          Mərhələ əlavə et
        </button>
        <p className="data-hint">
          Tarixlər avtomatik hesablanmır. Mərhələlər yazdığın ardıcıllıqla
          göstərilir.
        </p>
      </section>
    );
  }
  if (slide.layout !== "image") return null;
  async function select(file?: File) {
    if (!file || busy) return;
    const current = ++generation.current;
    setBusy(true);
    setError("");
    try {
      const { normalizeRaster } = await import("./raster");
      const asset = await normalizeRaster(file);
      if (
        current === generation.current &&
        !latestImage.current({
          ...asset,
          alt: slide.image?.alt || "",
          credit: slide.image?.credit || "",
        })
      )
        setError(
          "Şəkil layihənin yaddaş limitini aşır. Digər şəkillərdən birini çıxar.",
        );
    } catch (e) {
      if (current === generation.current)
        setError(e instanceof Error ? e.message : "Şəkil əlavə olunmadı.");
    } finally {
      if (current === generation.current) setBusy(false);
      if (input.current) input.current.value = "";
    }
  }
  return (
    <section className="visual-editor" aria-label="Şəkil məlumatları">
      <h3>Öz şəklinlə izah et</h3>
      <input
        ref={input}
        className="sr-only"
        type="file"
        accept=".png,.jpg,.jpeg,image/png,image/jpeg"
        aria-label="Slayd üçün PNG və ya JPEG seç"
        disabled={busy}
        onChange={(e) => void select(e.target.files?.[0])}
      />
      <button
        type="button"
        className="secondary"
        disabled={busy}
        onClick={() => input.current?.click()}
      >
        {busy ? <Loader2 className="spin" size={16} /> : <Upload size={16} />}{" "}
        {busy
          ? "Şəkil hazırlanır…"
          : slide.image
            ? "Şəkli dəyiş"
            : "Şəkil əlavə et"}
      </button>
      {slide.image && (
        <>
          <p className="image-meta">
            {slide.image.width} × {slide.image.height} px · təxminən{" "}
            {Math.round((slide.image.data.length * 0.75) / 1024)} KB
          </p>
          <label htmlFor="image-alt">Alt mətn</label>
          <input
            id="image-alt"
            disabled={busy}
            maxLength={160}
            placeholder="Şəkildə nə göründüyünü qısa izah et"
            value={slide.image.alt}
            onChange={(e) =>
              onImage({ ...slide.image!, alt: e.target.value }, "alt")
            }
          />
          <label htmlFor="image-credit">Mənbə / müəllif (istəyə bağlı)</label>
          <input
            id="image-credit"
            disabled={busy}
            maxLength={200}
            placeholder="Müəllif və ya mənbə ünvanı"
            value={slide.image.credit}
            onChange={(e) =>
              onImage({ ...slide.image!, credit: e.target.value }, "credit")
            }
          />
          <button
            type="button"
            className="text-button danger"
            disabled={busy}
            onClick={() => onImage(undefined)}
          >
            <Trash2 size={14} />
            Şəkli çıxar
          </button>
        </>
      )}
      {error && (
        <p className="data-warning" role="alert">
          {error}
        </p>
      )}
      <p className="data-hint">
        PNG/JPEG, ən çox 5 MB. Şəkil bu brauzerdə ölçüyə və yaddaşa
        uyğunlaşdırılır, serverə göndərilmir. Orijinal fayl saxlanmır.
      </p>
    </section>
  );
}
