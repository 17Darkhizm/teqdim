import { AcademicBrief, audiences, purposes } from "./model";
import { GraduationCap } from "lucide-react";

export default function BriefForm({
  value,
  onChange,
}: {
  value: AcademicBrief;
  onChange: (brief: AcademicBrief) => void;
}) {
  function update<K extends keyof AcademicBrief>(
    key: K,
    field: AcademicBrief[K],
  ) {
    onChange({ ...value, [key]: field });
  }
  return (
    <section
      className="brief-form"
      aria-label="Təqdimatın məqsədi və akademik məlumatlar"
    >
      <div className="brief-heading">
        <GraduationCap size={17} />
        <span>Təqdimatı özünə uyğunlaşdır</span>
        <span>İstəyə bağlı</span>
      </div>
      <label>Təqdimatın növü</label>
      <div
        className="purpose-options"
        role="group"
        aria-label="Təqdimatın növü"
      >
        {purposes.map((p) => (
          <button
            key={p.id}
            type="button"
            title={p.detail}
            className={value.purpose === p.id ? "chosen" : ""}
            aria-pressed={value.purpose === p.id}
            onClick={() => update("purpose", p.id)}
          >
            <b>{p.name}</b>
            <span>{p.detail}</span>
          </button>
        ))}
      </div>
      <div className="field-row">
        <div>
          <label htmlFor="audience">Kimə təqdim edəcəksən?</label>
          <select
            id="audience"
            value={value.audience}
            onChange={(e) =>
              update("audience", e.target.value as AcademicBrief["audience"])
            }
          >
            {audiences.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="target-minutes">Hədəf çıxış vaxtı</label>
          <select
            id="target-minutes"
            value={value.targetMinutes}
            onChange={(e) => update("targetMinutes", Number(e.target.value))}
          >
            {[3, 5, 7, 10, 15, 20].map((n) => (
              <option key={n} value={n}>
                {n} dəqiqə
              </option>
            ))}
          </select>
        </div>
      </div>
      <label htmlFor="presentation-goal">Təqdimatın əsas məqsədi</label>
      <input
        id="presentation-goal"
        placeholder="Dinləyici çıxışından hansı fikirlə ayrılmalıdır?"
        value={value.goal}
        maxLength={160}
        onChange={(e) => update("goal", e.target.value)}
      />
      <details className="academic-details">
        <summary>Universitet, müəllim və qrup əlavə et</summary>
        <label htmlFor="institution">Universitet / təhsil müəssisəsi</label>
        <input
          id="institution"
          value={value.institution}
          placeholder="Təhsil müəssisəsinin adı"
          maxLength={120}
          onChange={(e) => update("institution", e.target.value)}
        />
        <div className="field-row">
          <div>
            <label htmlFor="teacher">Müəllim</label>
            <input
              id="teacher"
              value={value.teacher}
              placeholder="Ad və soyad"
              maxLength={90}
              onChange={(e) => update("teacher", e.target.value)}
            />
          </div>
          <div>
            <label htmlFor="student-group">Qrup</label>
            <input
              id="student-group"
              value={value.group}
              placeholder="Qrupun adı və ya nömrəsi"
              maxLength={40}
              onChange={(e) => update("group", e.target.value)}
            />
          </div>
        </div>
        <p>Yazdığın məlumatlar üz qabığında göstərilir.</p>
      </details>
    </section>
  );
}
