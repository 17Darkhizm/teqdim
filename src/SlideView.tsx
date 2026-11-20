import { useLayoutEffect, useRef } from "react";
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

// Slide CSS clips long text (max-height + overflow:hidden). This finds text the
// viewer cannot see. Elements without layout (jsdom) report 0 and never match.
const CLIPPABLE =
  ".slide-copy, .slide-copy h2, .slide-copy p, .slide-copy li > div, " +
  // Comparison titles have their own max-height; cards can also clip a title
  // and body that each fit individually. Neither reaches slide-copy's bounds.
  ".slide-copy .comparison-view, .slide-copy .comparison-view > div, .slide-copy .comparison-view h3";
export function clippedText(root: HTMLElement): boolean {
  return [...root.querySelectorAll<HTMLElement>(CLIPPABLE)].some(
    (el) =>
      el.scrollHeight - el.clientHeight > 2 ||
      el.scrollWidth - el.clientWidth > 2,
  );
}

export default function SlideView({
  slide,
  index,
  layoutIndex = index,
  total,
  theme,
  subject,
  author,
  mini = false,
  brief,
  design,
  onOverflow,
}: {
  slide: Slide;
  index: number;
  layoutIndex?: number;
  total: number;
  theme: Theme;
  subject: string;
  author: string;
  mini?: boolean;
  brief?: AcademicBrief;
  design?: DesignSettings;
  /** Reports whether rendered text is clipped; only the main editor needs it. */
  onOverflow?: (clipped: boolean) => void;
}) {
  const rootRef = useRef<HTMLDivElement>(null);
  const reported = useRef<boolean | null>(null);
  const latest = useRef(onOverflow);
  latest.current = onOverflow;
  const measure = () => {
    const root = rootRef.current;
    if (!root || !latest.current) return;
    const clipped = clippedText(root);
    if (clipped === reported.current) return;
    reported.current = clipped;
    latest.current(clipped);
  };
  // Content and theme change on every edit, so measure after each render.
  useLayoutEffect(measure);
  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root || !onOverflow) return;
    const observer =
      typeof ResizeObserver === "undefined" ? null : new ResizeObserver(measure);
    observer?.observe(root);
    // Web fonts change line breaks once they finish loading.
    void document.fonts?.ready.then(measure);
    return () => observer?.disconnect();
  }, [!!onOverflow]);
  const settings = resolveDesign(design);
  const palette = themeColors[theme];
  const layout = layoutFor(slide, layoutIndex);
  const columns = layout === "columns" ? textColumns(slide.body) : null;
  return (
    <div
      ref={rootRef}
      style={
        {
          "--s-bg": `#${palette.bg}`,
          "--s-fg": `#${palette.fg}`,
          "--s-accent": `#${palette.accent}`,
          backgroundColor: `#${palette.bg}`,
          color: `#${palette.fg}`,
        } as CSSProperties
      }
      className={`slide text-${settings.textSize} decoration-${settings.decoration} ${settings.showNumbers ? "" : "numbers-hidden"} layout-${layoutIndex % 3} content-${layout} theme-${theme} ${layout === "cover" ? "cover" : ""} ${layout === "cover" && coverDetails(brief) ? "has-cover-details" : ""} ${mini ? "mini" : ""} ${slide.body.length > 350 ? "dense" : ""}`}
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
