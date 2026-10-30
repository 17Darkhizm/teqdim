import type { CSSProperties } from "react";
import {
  AcademicBrief,
  DesignSettings,
  resolveDesign,
  headingFontFor,
  themeColors,
  coverDetails,
  bodyBlocks,
  citationLabel,
  layoutFor,
  Slide,
  textColumns,
  Theme,
} from "./model";
import DataGraphic from "./DataGraphic";
import VisualContent from "./VisualContent";

export default function SlideView({
  slide,
  index,
  total,
  theme,
  subject,
  author,
  mini = false,
  brief,
  design,
}: {
  slide: Slide;
  index: number;
  total: number;
  theme: Theme;
  subject: string;
  author: string;
  mini?: boolean;
  brief?: AcademicBrief;
  design?: DesignSettings;
}) {
  const settings = resolveDesign(design);
  const palette = themeColors[theme];
  const layout = layoutFor(slide, index);
  const columns = layout === "columns" ? textColumns(slide.body) : null;
  return (
    <div
      style={
        {
          "--s-bg": `#${palette.bg}`,
          "--s-fg": `#${palette.fg}`,
          "--s-accent": `#${palette.accent}`,
          backgroundColor: `#${palette.bg}`,
          color: `#${palette.fg}`,
        } as CSSProperties
      }
      className={`slide text-${settings.textSize} decoration-${settings.decoration} ${settings.showNumbers ? "" : "numbers-hidden"} layout-${index % 3} content-${layout} theme-${theme} ${layout === "cover" ? "cover" : ""} ${layout === "cover" && coverDetails(brief) ? "has-cover-details" : ""} ${mini ? "mini" : ""} ${slide.body.length > 350 ? "dense" : ""}`}
    >
      <div className="slide-top">
        <span>{subject || "TƏQDİMAT"}</span>
        <span className="slide-spark">✳</span>
      </div>
      <div className="slide-copy">
        <span className="slide-eyebrow">
          {layout === "cover"
            ? "BİLİKDƏN YENİ FİKİRLƏRƏ"
            : settings.showNumbers
              ? `${String(index).padStart(2, "0")} / ƏSAS MƏQAMLAR`
              : "ƏSAS MƏQAMLAR"}
        </span>
        <h2
          style={
            settings.headingFont !== "default"
              ? { fontFamily: headingFontFor(theme, settings) }
              : undefined
          }
        >
          {slide.title}
        </h2>
        {["comparison", "timeline", "image"].includes(layout) ? (
          <>
            <VisualContent slide={slide} />
            {layout !== "image" && slide.body.trim() && (
              <p className="data-caption">{slide.body}</p>
            )}
          </>
        ) : layout === "table" || layout === "chart" ? (
          <>
            <DataGraphic slide={slide} />
            {slide.body.trim() && <p className="data-caption">{slide.body}</p>}
          </>
        ) : layout === "bullets" ? (
          <ul className="slide-bullets">
            {bodyBlocks(slide.body).map((block, i) => (
              <li key={i}>
                <span>{String(i + 1).padStart(2, "0")}</span>
                <div>{block}</div>
              </li>
            ))}
          </ul>
        ) : columns ? (
          <div className="slide-columns">
            <p>{columns[0]}</p>
            <p>{columns[1]}</p>
          </div>
        ) : (
          <p className="slide-body">{slide.body}</p>
        )}
      </div>
      <div className="theme-motifs" aria-hidden="true">
        <i />
        <i />
        <i />
        <i />
      </div>
      <div className="slide-art" aria-hidden="true">
        <div />
        <div />
        <div />
        <div />
      </div>
      <div className="creative-art" aria-hidden="true">
        <span className="art-number">{String(index + 1).padStart(2, "0")}</span>
        <span className="art-arrow">↗</span>
        <i />
        <i />
        <i />
      </div>
      {!!slide.citations?.length && (
        <div className="slide-citations" title={citationLabel(slide.citations)}>
          {citationLabel(slide.citations)}
        </div>
      )}
      {layout === "cover" && coverDetails(brief) && (
        <div className="slide-cover-details">{coverDetails(brief)}</div>
      )}
      <div className="slide-bottom">
        <span>{author || "Təqdim ilə hazırlanıb"}</span>
        {settings.showNumbers && (
          <span className="page-number">
            {String(index + 1).padStart(2, "0")}{" "}
            <i>/ {String(total).padStart(2, "0")}</i>
          </span>
        )}
      </div>
    </div>
  );
}
