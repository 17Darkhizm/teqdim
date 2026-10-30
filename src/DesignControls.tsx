import { defaultDesign, DesignSettings } from "./model";
export default function DesignControls({
  design,
  onChange,
}: {
  design: DesignSettings;
  onChange: (design: DesignSettings) => void;
}) {
  return (
    <section className="design-controls" aria-label="Üslub ayarları">
      <h3>Üslub ayarları</h3>
      <label htmlFor="design-font">Başlıq yazı tipi</label>
      <select
        id="design-font"
        value={design.headingFont}
        onChange={(e) =>
          onChange({
            ...design,
            headingFont: e.target.value as DesignSettings["headingFont"],
          })
        }
      >
        <option value="default">Dizaynın seçimi</option>
        <option value="sans">Sadə · Arial</option>
        <option value="serif">Klassik · Georgia</option>
      </select>
      <label htmlFor="design-text-size">Mətn ölçüsü</label>
      <select
        id="design-text-size"
        value={design.textSize}
        onChange={(e) =>
          onChange({
            ...design,
            textSize: e.target.value as DesignSettings["textSize"],
          })
        }
      >
        <option value="regular">Adi</option>
        <option value="large">İri</option>
      </select>
      <p>
        Ölçü mətn slaydlarına aiddir. Cədvəl və diaqram etiketləri öz ölçüsünü
        saxlayır.
      </p>
      <label htmlFor="design-decoration">Dekor</label>
      <select
        id="design-decoration"
        value={design.decoration}
        onChange={(e) =>
          onChange({
            ...design,
            decoration: e.target.value as DesignSettings["decoration"],
          })
        }
      >
        <option value="full">Tam kompozisiya</option>
        <option value="minimal">Sadə fon</option>
      </select>
      <label className="number-toggle">
        <input
          type="checkbox"
          checked={design.showNumbers}
          onChange={(e) =>
            onChange({ ...design, showNumbers: e.target.checked })
          }
        />
        Slayd nömrələrini göstər
      </label>
      <button
        className="text-button"
        onClick={() => onChange({ ...defaultDesign })}
        disabled={JSON.stringify(design) === JSON.stringify(defaultDesign)}
      >
        Üslub ayarlarını sıfırla
      </button>
    </section>
  );
}
