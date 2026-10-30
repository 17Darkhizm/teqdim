# Layihə xəritəsi

Təqdim Azərbaycan dilində təqdimat redaktorudur. React 18, TypeScript və Vite istifadə edir. Hesab/server/AI/ödəniş yoxdur. Mətn bölgüsü deterministikdir; fakt və xülasə yaratmır. İnkişaf mühiti Node.js 24-dür. Əmrlər repo kökündən işlədilir.

## Əsas fayllar

| Sahə | Fayllar (src/ daxilində) |
| --- | --- |
| Ümumi axın və vəziyyət | App.tsx |
| Tiplər, limitlər, mətn bölgüsü, dizaynlar, PPTX | model.ts |
| Slayd və struktur blokları | SlideView.tsx, DataGraphic.tsx, VisualContent.tsx |
| Redaktorlar | DataEditor.tsx, VisualEditor.tsx, BriefForm.tsx |
| Sənəd emalı və istinadlar | documents.ts, pdf.ts, PdfUpload.tsx, SourceInspector.tsx |
| Şəkil yoxlaması və ölçüləndirmə | raster.ts |
| Yaddaş və ehtiyat nüsxəsi | storage.ts, backup.ts, useDraft.ts |
| Geri alma və modal klaviaturası | useHistory.ts, useDialogKeyboard.ts |
| Mətn, plan, axtarış və TSV | authoring.ts, editing.ts və uyğun komponentlər |
| Dizayn qalereyası və ayarlar | design.ts, DesignGallery.tsx, DesignControls.tsx |
| Məşq, kitabxana, son baxış | PracticeMode.tsx, ProjectLibrary.tsx, QualityPanel.tsx |
| İnterfeys rəngləri | aic-brand.css — main.tsx-də son CSS qatı |
| Slayd görünüşü | style.css, design-studio.css və struktur CSS faylları |

Slaydın --s-* rəngləri ilə interfeysin --aic-* rənglərini qarışdırma. PDF.js worker yerli yığımdadır. PPTX ixracı pptxgenjs istifadə edir; palitra və həndəsə həm CSS, həm PPTX tərəfində saxlanır.

## Məlumat müqaviləsi

- Project slaydları, dizaynı, akademik məlumatları və sənədlərdən çıxarılmış mətnləri saxlayır. Orijinal fayllar saxlanmır. Reference.pages PDF üçün fiziki səhifələrdir; başqa sənədlər bir mətn qeydi (number=1, pageCount=1) saxlayır. Bu, fiziki səhifə deyil. sourcePosition fayl adına görə PDF səhifəsini və sənəd mətnini fərqləndirir; backup v4 dəyişmir.
- 10 dizayn, 10 düzülüş, ən çox 80 slayd. Düzülüş dəyişəndə struktur məlumatları itirilməməlidir.
- Ehtiyat nüsxə ixracı v4-dür; v1–v4 idxalı qorunur. Naməlum sahələr açıq siyahı üzrə atılır, struktur və həcm yoxlanır.
- localStorage qaralaması əl ilə saxlanmış kitabxana nüsxəsindən ayrıdır. Yeni iş açılarkən saxlanmamış redaktə qorunur.
- Gizli slaydlar redaktorda qalır; təqdimat, məşq, çap və PPTX görünən slaydlardan istifadə edir.
- Asinxron PDF/şəkil/idxal işləri köhnə layihənin nəticəsini yeni vəziyyətə yazmamalıdır.

## Yoxlama

npm ci, npm run check, npm run build. scripts/check-*.mjs altında 11 ardıcıl skript var: model/PPTX, cədvəl/diaqram, şəkil/blok, PDF, iş məkanı, mətn redaktəsi, dizayn studiyası, mərhələ 9–11 və sənəd idxalı. check-documents.mjs formatları, kodlaşdırmanı, arxiv/həcm xətalarını, təsdiq və köhnə async nəticə qorumasını, mənbələrin backup/PPTX-də saxlanmasını yoxlayır. jsdom real səhifə düzülüşü yaratmır. Görünüş dəyişəndə brauzerdə açıq/tünd və dar/geniş ekranı, uyğun olduqda PPTX və çapı ayrıca yoxla. İmkan yoxdursa bunu qeyd et.

CONTEXT.md, SESSION_HANDOFF.md və WORKFLOW*.md əvvəlki işlərin tarixçəsidir. Yerli yollar və köhnə server/icazə qeydləri yeni istifadəçi üçün tələb deyil. Məhsul istiqaməti ROADMAP.md-dədir. Repo AIC saytından ayrıdır; saytın deploy əmrləri burada tətbiq edilmir.
