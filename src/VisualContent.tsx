import { useEffect, useState } from "react";
import { emptyComparison, emptyTimeline, Slide } from "./model";

export default function VisualContent({ slide }: { slide: Slide }) {
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [slide.image?.data]);
  if (slide.layout === "comparison") {
    const d = slide.comparison || emptyComparison();
    return (
      <div className="comparison-view">
        {[
          { title: d.leftTitle, body: d.left },
          { title: d.rightTitle, body: d.right },
        ].map((s, i) => (
          <div key={i}>
            <span>{String(i + 1).padStart(2, "0")}</span>
            <h3>{s.title || "Başlıq əlavə et"}</h3>
            <p>{s.body || "İzah əlavə et"}</p>
          </div>
        ))}
      </div>
    );
  }
  if (slide.layout === "timeline") {
    const d = slide.timeline || emptyTimeline();
    return (
      <div
        className={`timeline-view ${d.steps.length > 3 ? "timeline-compact" : ""}`}
      >
        {d.steps.map((s, i) => (
          <div key={i}>
            <span>{s.label || String(i + 1).padStart(2, "0")}</span>
            <i />
            <div>
              <h3>{s.title || "Mərhələnin adı"}</h3>
              {s.body && <p>{s.body}</p>}
            </div>
          </div>
        ))}
      </div>
    );
  }
  if (slide.layout === "image")
    return (
      <div className={`image-view ${!slide.body.trim() ? "image-only" : ""}`}>
        <div>
          {slide.image && !failed ? (
            <img
              src={slide.image.data}
              alt={slide.image.alt}
              onError={() => setFailed(true)}
            />
          ) : (
            <span>
              {failed
                ? "Şəkil açıla bilmədi. Faylı yenidən əlavə et."
                : "Öz PNG/JPEG şəklini əlavə et"}
            </span>
          )}
        </div>
        <div>
          {slide.body.trim() && <p>{slide.body}</p>}
          {slide.image?.credit && <small>{slide.image.credit}</small>}
        </div>
      </div>
    );
  return null;
}
