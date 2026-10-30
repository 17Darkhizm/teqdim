import { useState } from "react";
import { filterSlides } from "./authoring";
import { Layout, layouts, Project } from "./model";
import SlideView from "./SlideView";

export default function SlideNavigator({
  project,
  selected,
  onSelect,
}: {
  project: Project;
  selected: number;
  onSelect: (index: number) => void;
}) {
  const [query, setQuery] = useState("");
  const [layout, setLayout] = useState<Layout | "all">("all");
  const [problems, setProblems] = useState(false);
  const visible = filterSlides(
    project.slides,
    query,
    layout,
    problems,
    project.references,
    project.design,
  );
  return (
    <section className="slide-navigator" aria-label="Slayd siyahısı">
      <div className="navigator-tools">
        <input
          aria-label="Slaydlarda axtar"
          placeholder="Slayd axtar…"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
        <select
          aria-label="Slayd düzülüşünü süz"
          value={layout}
          onChange={(event) => setLayout(event.target.value as Layout | "all")}
        >
          <option value="all">Bütün düzülüşlər</option>
          {layouts.map((item) => (
            <option value={item.id} key={item.id}>
              {item.name}
            </option>
          ))}
        </select>
        <label>
          <input
            type="checkbox"
            checked={problems}
            onChange={(event) => setProblems(event.target.checked)}
          />{" "}
          Yoxlanmalı
        </label>
        <span role="status">
          {visible.length} / {project.slides.length} slayd
        </span>
        {(query || layout !== "all" || problems) && (
          <button
            className="text-button"
            onClick={() => {
              setQuery("");
              setLayout("all");
              setProblems(false);
            }}
          >
            Filtrləri sıfırla
          </button>
        )}
      </div>
      <div className="slide-rail">
        {visible.map(({ slide, index, hasIssue }) => (
          <button
            key={slide.id}
            className={index === selected ? "selected" : ""}
            onClick={() => onSelect(index)}
            aria-current={index === selected ? "true" : undefined}
            aria-label={`${index + 1} nömrəli slaydı seç`}
            aria-describedby={hasIssue ? `slide-issue-${index}` : undefined}
            title={`${slide.title}${hasIssue ? " · Yoxlanmalı məqam var" : ""}`}
          >
            <span>
              {String(index + 1).padStart(2, "0")}
              {hasIssue && (
                <i className="slide-issue-dot" aria-hidden="true">
                  !
                </i>
              )}
            </span>
            {hasIssue && (
              <small className="sr-only" id={`slide-issue-${index}`}>
                Yoxlanmalı məqam var
              </small>
            )}
            <SlideView
              slide={slide}
              index={index}
              total={project.slides.length}
              theme={project.theme}
              subject={project.subject}
              author={project.author}
              brief={project.brief}
              design={project.design}
              mini
            />
          </button>
        ))}
        {!visible.length && (
          <p className="navigator-empty">
            Uyğun slayd tapılmadı. Filtrləri dəyiş.
          </p>
        )}
      </div>
    </section>
  );
}
export function SlideJump({
  total,
  selected,
  onSelect,
}: {
  total: number;
  selected: number;
  onSelect: (index: number) => void;
}) {
  const [value, setValue] = useState("");
  const [error, setError] = useState("");
  function go() {
    const n = Number(value);
    if (!Number.isInteger(n) || n < 1 || n > total) {
      setError(`1–${total} arasında tam nömrə yaz.`);
      return;
    }
    onSelect(n - 1);
    setError("");
    setValue("");
  }
  return (
    <div className="slide-jump">
      <label htmlFor="slide-jump">Slayda keç</label>
      <input
        id="slide-jump"
        type="number"
        min={1}
        max={total}
        placeholder={String(selected + 1)}
        value={value}
        onChange={(e) => {
          setValue(e.target.value);
          setError("");
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            go();
          }
        }}
        aria-invalid={!!error}
        aria-describedby={error ? "slide-jump-error" : undefined}
      />
      <button className="secondary" onClick={go}>
        Keç
      </button>
      {error && (
        <small id="slide-jump-error" role="alert">
          {error}
        </small>
      )}
    </div>
  );
}
