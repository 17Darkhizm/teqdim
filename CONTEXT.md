# Təqdim — layihə vəziyyəti

Son yenilənmə: 2026-10-30.

## Məqsəd

Tələbələrin Azərbaycan dilində rahat və peşəkar təqdimatlar hazırlaması üçün ayrıca SaaS. Ad istifadəçi tərəfindən təsdiqlənib: **Təqdim**. Brend etiketi: **AIC tərəfindən hazırlanıb**. AIC saytına əlavə deyil, ayrıca məhsuldur. İş qovluğu: C:\Users\Asus\Desktop\Teqdim.

## İlk versiya

React + TypeScript + Vite. Lokal iş məkanı. Öz materialını daxil et → abzaslar əsasında slayd planı → redaktə → dizayn seç → PowerPoint və ya brauzer çapı ilə PDF. Saxlama əl ilədir, bu brauzerin localStorage yaddaşındadır. Yeddi dizayn: Botanika, Atelye, Çertyoj, Şəfəq, İmpuls, Orbita, Akademik. Atelye jurnal tipoqrafiyası və yan rəng bloku, Çertyoj texniki tor, Şəfəq sərbəst isti formalar, İmpuls qara-lime kontrast istifadə edir. Giriş, ödəniş və backend yoxdur. Süni intellekt hələ qoşulmayıb; interfeysdə bu açıq bildirilir. Plan alqoritmi yalnız daxil edilən abzasları bölür, xülasə yaratmır, mənbə axtarmır.

## Növbəti mərhələ

1. İbrahimlə ilkin interfeysi və iş axınını yoxlamaq.
2. Serverdə AI provayderi bağlantısı: strukturlaşdırılmış slayd nəticəsi, Azərbaycan dili keyfiyyət yoxlaması, istinadların saxtalaşdırılmaması, xəta halları və limitlər.
3. Mətn həcminə uyğun slayd düzülüşləri; şəkil, cədvəl və diaqram blokları; PPTX və PDF vizual uyğunluğunu artırmaq.
4. Hesab və verilənlər bazası; istifadəçiyə aid layihələr, autentifikasiya və giriş yoxlamaları.
5. Faktiki xərclərə əsasən planlar və ödəniş. Qiymətlər hələ müəyyən edilməyib.

## Əmrlər

`npm run dev` — 127.0.0.1:5174

`npm run build` — TypeScript yoxlaması və production yığımı.

Canlı yayımlama aparılmayıb. Heç bir API açarı tələb olunmur.

## Yoxlama nəticələri (2026-10-29)

- `npm run build` uğurludur: TypeScript və Vite yığımı.
- `npm run check` uğurludur: 4/6/12 slayd, mətnin qorunması, unikal ID-lər, yeddi dizaynda PowerPoint ZIP/XML quruluşu, Azərbaycan hərfləri və redaktə edilən mətn.
- `npm audit`: 0 məlum zəiflik. `image-size` üçün təhlükəsizlik yeniləməsi override ilə tətbiq edilib.
- Yerli server HTTP 200 qaytardı.
- Brauzer aləti yerli ünvana girişi icazə səbəbindən rədd etdi. Vizual və interaktiv brauzer yoxlaması aparılmayıb; PDF nəticəsi vizual yoxlanmayıb.
- `Baslat.cmd` layihəni işə salmaq üçün əlavə edilib. Önizləmə serveri yoxlamadan sonra dayandırılıb; istifadəçi bu faylla yenidən işə sala bilər.


## PDF istinad materialları (2026-10-29)

İstifadəçi daha yaradıcı dizaynlar və PDF istinad materiallarının yüklənməsini istədi. `PdfUpload.tsx` fayl seçimini, sürükləməyi, səhifə aralığını, irəliləyişi və çıxarılan mətnə baxışı təmin edir. `pdf.ts` Mozilla PDF.js-in uyğunluq (legacy) yığımını yerli worker ilə tənbəl yükləyir. Yeni Node/brauzer API-ləri üçün legacy polyfill lazımdır. PDF 6.x-də resurslar `doc.loadingTask.destroy()` ilə bağlanır.

Limitlər: 3 PDF, hərəsi 20 MB; bir fayldan 50 səhifə və 60 000 simvol; ümumilikdə 100 000 simvol. Səssiz kəsmə yoxdur. Parollu/zədələnmiş/boş PDF və oxuna bilən mətni olmayan səhifələr üçün aydın xəta. OCR yoxdur. PDF-dən dizayn köçürülmür; məzmun üçün istinad kimi işləyir.

`Project.references` çıxarılan səhifə mətnlərini, `Project.material` ayrıca qeydləri saxlayır. Orijinal PDF faylı saxlanmır. `Slide.citations` faktiki mətnin götürüldüyü fayl və fiziki səhifəni göstərir; PDF-dən istifadə ediləndə son slayd mənbələr siyahısıdır (seçilmiş slayd sayına daxildir). Mətn əl ilə dəyişdirilsə mənbəni yenidən yoxlama bildirişi var. Köhnə üç dizaynlı localStorage layihələri oxunmağa davam edir.

Son yoxlamalar: `npm run check` (7 dizaynda PPTX və səhifə istinadları + PDF parser sınaqları), `npm run build`, `npm audit --omit=dev` (0 zəiflik). AIC-in 201 səhifəlik PDF-inin ilk 3 səhifəsi ilə real Azərbaycan mətninin oxunuşu yoxlanıb: 1937 simvol, Azərbaycan hərfləri qorunur. Bu dəyişiklikdə brauzerdə vizual yoxlama aparılmayıb; əvvəlki brauzer icazə rəddi qüvvədədir. 5174 portunda server işləmir; istifadəçi `Baslat.cmd` ilə başladıb açıq səhifəni yeniləməlidir.

Yenilənmə problemi həll edildi: 5174 portunda server dayanmışdı. İstifadəçinin istəyi ilə Vite arxa planda başladıldı; HTTP 200 və verilən App modulunda PdfUpload yoxlanıldı. Server loqları .checks/dev-server.log və dev-server-error.log fayllarındadır. Əvvəlki 'server işləmir' qeydi artıq aktual deyil.

Qaranlıq rejim əlavə edildi: yuxarı sağda ay/günəş düyməsi, teqdim.color-mode localStorage seçimi; ilk girişdə sistem rəngi əsas götürülür. index.html ilkin rəngi React-dən əvvəl tətbiq edir. src/color-mode.css interfeysi tündləşdirir; slayd dizaynları və PPTX rəngləri ayrıca qalır. npm run build keçdi, yerli server yeni rejim kodunu HTTP 200 ilə verir.


## Təxminən 20 dəqiqəlik təkmilləşdirmə mərhələsi (2026-10-29)

İş bölgüsü və qəbul meyarları WORKFLOW.md-dədir. İstifadəçi fikri inkişaf etdirməyi və tətbiqə başlamağı istədi. Bu mərhələdə:

- `createSlides` artıq boş plan slaydları doldurmur: öz/PDF materialını cümlə/söz sərhədlərindən itkisiz bölür, mətni yığır və hər mətn slaydını ən çox 460 simvolda saxlayır. Seçilən say təxminidir; faktiki say dəyişə bilər, UI bunu bildirir. Ən çox 80 slayd, limitdə açıq xəta.
- `Slide.layout` örtük/mətn/məqamlar/iki sütun/vurğu (cover/text/bullets/columns/statement). `SlideView.tsx` ayrıca komponentdir. Düzülüşlər PPTX-də də redaktə olunan mətn və vektor formaları ilə işləyir.
- `Slide.notes` çıxış qeydləridir: önizləmədə görünmür, PPTX notes-a yazılır. PDF mənbələri də notes-da saxlanır.
- Redaktorda slaydı bölmək və surətini yaratmaq var. Bölünən mətndə istinadlar qorunur, yenidən yoxlama işarəsi qoyulur (`citationReview`). İstifadəçi yoxladıqdan sonra işarəni çıxara bilər.
- `QualityPanel.tsx` boş sahə, uzun mətn/başlıq, çox məqam, qalmış göstəriş və dəyişən istinadları yoxlayır. Slayda kliklə keçid, söz sayı və 110 söz/dəq hesabı var. Bu fakt və ya akademik doğruluq yoxlaması deyil.
- `storage.ts` saxlanmış məlumatın quruluşunu yoxlayır. `useDraft.ts` qaralamanı 650 ms fasilədən sonra, həmçinin pagehide/beforeunload zamanı localStorage-a yazır. Başlanğıcda bərpa edilir. Yaddaş dolarsa görünən status/xəbərdarlıq var. Yeni və ya başqa təqdimata keçəndə saxlanmamış iş varsa təsdiq pəncərəsi göstərilir. `Saxla` hələ ayrıca Təqdimatlarım nüsxəsidir.
- AIC-in orijinal işarəsi /brand/aic-logo.svg-dədir. Əvvəlki loqo düzəlişində yazılar dəyişdirilmədi.
- `src/editor.css` yeni düzülüşləri və alətləri həm açıq, həm tünd rejimdə tərtib edir.

Yoxlamalar: `npm run check` model/PPTX, PDF və jsdom komponent axını sınaqlarını işlədir. jsdom həqiqi brauzer deyil, şəbəkə sorğusu aparmır. Qaralama bərpası, qeydlər, surət, dizayn seçimi, qoruma pəncərəsi, layihə saxlama/açma yoxlanır. Əvvəlki brauzer icazə rəddini aşmaq üçün başqa brauzer və ya dolayı UI yolu istifadə edilməyib. Vizual/PDF/PowerPoint render yoxlaması hələ ayrıca lazımdır. Məhsulda AI bağlantısı və hesab sistemi yoxdur.


## İkinci təkmilləşdirmə mərhələsi (2026-10-29)

Plan və qəbul meyarları WORKFLOW-02.md-dədir. Sonrakı inkişaf planları ayrıca ROADMAP.md-dədir.

- `useHistory.ts`: cari slaydlar və dizayn üçün 60 addımlıq undo/redo. Eyni mətn sahəsində 750 ms intervalda ardıcıl yazı bir addımda qruplaşır. Yeni dəyişiklik redo qolunu təmizləyir. Plan qurma, yeni layihə və başqa layihəni açmaq tarixçəni sıfırlayır. Mövzu formu və PDF əlavə etmə tarixçəyə daxil deyil.
- Redaktorun idarə düymələri: yeni slayd seçilən slayddan sonra, yuxarı/aşağı köçürmə, geri qaytarıla bilən çıxarma. Seçilən indeks undo ilə qısalan siyahıda təhlükəsiz sıxışdırılır.
- Qısayollar: Ctrl/Meta+S saxla, Z geri al, Shift+Z/Y yenidən et, D surət, oxlar slayd seç, Delete çıxar. Mətn sahələrində slayd qısayolları işləmir. Ctrl+S saxlayır.
- `ProjectLibrary.tsx`: Azərbaycan dili qaydası ilə mövzu/fənn/ad axtarışı, tarix/ad üzrə sıralama, ayrıca surət, ehtiyat nüsxə ixrac/idxalı.
- `backup.ts`: version=1, format=teqdim-project, ən çox 2 MB .teqdim.json. Struktur, slayd sayları, identifikatorlar və mətn limitləri yoxlanır; idxalın əlavə naməlum sahələri atılır. Slaydlar, layout, dizayn, qeydlər, citations və PDF-dən çıxarılmış səhifə mətnləri saxlanır, orijinal PDF saxlanmır. İdxal yeni project ID-si ilə əlavə edilir; cari qaralama və əvvəlki layihələr əvəz olunmur. Yaddaş xətasında uğurlu idxal mesajı verilmir.
- `useDialogKeyboard.ts`: açıq modalda fokus dövrü və Escape. library.css həm açıq/tünd rejimi, həm mobil görünüşü tərtib edir. Bələdçi max-height ilə sürüşdürülür.
- `npm run dev` indi --strictPort istifadə edir, səssizcə 5175-ə keçmir. Əvvəlki server 5174-də işləməyə davam edir.

Yoxlamalar: npm run check və npm run build keçib. Yeni komponent sınaqları undo/redo, silmənin bərpası, tarixçənin layihə sərhədi, fokus dövrü, native input qısayollarına müdaxilə edilməməsi, axtarış, surət, JSON idxalı, yanlış faylın rəddi, idxal zamanı yaddaş xətası, backup roundtrip ilə çıxış qeydləri və PDF istinadlarının qorunmasını əhatə edir. Həqiqi brauzerdə vizual yoxlama aparılmayıb.

Sessiya istifadəçinin istəyi ilə saxlanıldı. Sabah davam üçün SESSION_HANDOFF.md hazırlandı; Desktopda mənbələr və dist yığımından ayrıca ZIP ehtiyat nüsxəsi yaradılır. İstifadəçinin brauzer localStorage təqdimatları mənbə arxivinə daxil deyil.


## Üçüncü iş axını — 30 dəqiqəlik plan (2026-10-29)

İstifadəçi saxlanmış sessiyadan sonra 30 dəqiqəlik iş axını ilə davam etməyi istədi. WORKFLOW-03.md planı və nəticələri saxlayır.

- `Project.brief?: AcademicBrief`: məqsəd, auditoriya, növ, universitet/təhsil müəssisəsi, müəllim, qrup, hədəf dəqiqə. model.ts-də defaultBrief, purposes, audiences, isAcademicBrief, coverDetails var. Brief opsionaldır, köhnə layihələr uyğun qalır.
- `BriefForm.tsx` ilk addımdadır. Məlumatlar localStorage qaralama, Təqdimatlarım və ehtiyat nüsxədə saxlanır. decodeBackup naməlum əlavə sahələri yenə kənarlaşdırır; brief açıq siyahı üzrə köçürülür.
- createSlides beşinci opsional brief parametrini qəbul edir. Giriş məqsəddən/növdən, yekun göstərişi növdən hazırlanır. Auditoriya/məqsəd/hədəf cover notes-a yazılır. Faktlar yaradılmır, material yenidən yazılmır. Akademik məlumatlar SlideView cover və PPTX-də göstərilir.
- `SourceInspector.tsx`: redaktorda PDF-dən çıxarılmış səhifə mətnlərinə baxış/axtarış, fayl filtri, slayda Citation bağlama və çıxarma. Orijinal PDF vizual önizləməsi deyil. Bağlama doğruluq təsdiqi deyil. `inspectDeck(slides,references?)` istinadın fayl/səhifə/ad/mətn mövcudluğunu da yoxlayır. Materialı olmayan istinad çıxarıla bilər. Son istinad çıxarılanda citationReview false olur.
- `PracticeMode.tsx`: seçilmiş slayd, çıxış qeydləri, auditoriya, real monotonic vaxtölçən, fasilə və sıfırlama, hədəf büdcəsi və ox düymələri ilə keçid. Vaxt ekranı bağlananda sıfırlanır, qeydlər saxlanır. Auditoriya üçün ayrıca əvvəlki Təqdim et rejimi qalır.
- Plan yeniləmə `pendingAction='rebuild'` ilə təsdiqlənir. Ləğv/xəta köhnə slaydları saxlayır. İlk addımda hazır slaydlara qayıtma düyməsi var.
- QualityPanel brief növü/auditoriya və hədəf vaxt büdcəsini göstərir. Yeni academic.css həm açıq, həm tünd rejimi və mobil görünüşü tərtib edir.

Yoxlamalar: npm run check və npm run build uğurludur, npm audit --omit=dev: 0 məlum zəiflik. Akademik metadata bütün 7 dizaynda PPTX XML-də, Azərbaycan hərfləri və XML xüsusi simvolları ilə yoxlanıb. Komponent sınaqları brief saxlanma/bərpa/backup, köhnə brief-siz layihə, mənbə axtarış/bağlama/çıxarma, qırılmış istinad, məşq başlat/fasilə/sıfırlama/qeydlər, yeni planın ləğvi, 80 slayd limitində köhnə redaktələrin qorunması və təsdiqli yeni plan qurma hallarını yoxlayır.

Brauzer vizual yoxlaması üçün yerli origin icazəsi async sual ilə soruşuldu. Cavab gəlməyibsə əvvəlki rədd qüvvədədir; başqa brauzer/dolayı yol istifadə edilmədi. Son yoxlamalar texniki sınaqlardır, vizual render təsdiqi deyil. API açarı, server AI, hesab və ödəniş hələ əlavə edilməyib.


## Dördüncü iş axını — cədvəl və diaqramlar (2026-10-29)

İstifadəçi əvvəlki brauzer sualına «Hələlik texniki sınaqlarla davam et» cavabını verdi. Bu seçim qüvvədədir: brauzer UI yoxlamasına yenidən cəhd etmə və istifadəçi fikrini dəyişməyənə qədər icazəni təkrar soruşma.

WORKFLOW-04.md 30 dəqiqəlik planı və nəticələri saxlayır. Tamamlananlar:

- Layout indi cover/text/bullets/columns/statement/table/chart, cəmi 7-dir. `Slide.table?: TableData` və `Slide.chart?: ChartData` opsionaldır. TableData string sütun/sətir matrisidir; ChartData bar/line, name, unit və label/value string nöqtələridir. Qiymət raw string kimi saxlanır ki, vergül, natamam yazı və boş xana itirilməsin.
- Modeldə isTableData/isChartData struktur yoxlaması, parseChartNumber (vergül/nöqtə, ±1e9, 6 onluq), chartBounds (sıfır daxil), dataProblems və visibleSlideText var. Statistika avtomatik yaradılmır.
- `DataEditor.tsx` cədvəl sətir/sütunları, Tab ilə ayrılmış mətn parseri və chart redaktorudur. Cədvəl 2–5 sütun/1–8 sətir, chart 2–8 göstəricidir. parseTablePaste xəta verəndə hazırkı məlumat dəyişmir.
- `DataGraphic.tsx` HTML table/SVG chart önizləməsidir. Mənfi/sıfır qiymətlər və düzgün sıfır xətti var. Boş/yanlış data üçün placeholder görünür, rəqəm uydurulmur. İstifadəçi mətnləri React tərəfindən escape edilir.
- exportPptx native cədvəl və native bar/line chart, daxili XLSX data əlavə edir. Boş/yanlış data ixracdan əvvəl slayd nömrəsi ilə xəta verir. Table üçün aktiv mətn limiti 28/40/60 simvoldur (ölçüdən asılı). Qaralama struktur limiti 80 simvoldur, uzun mətn itirilmir. Caption üçün 160 simvol xəbərdarlığı var. Data slaydları splitSlide tərəfindən bölünmür.
- Undo/redo və dizayn/düzülüş dəyişməsi data sahələrini qoruyur. Mətn düzülüşünə keçəndə table/chart məlumatı modeldə qalır, data düzülüşünə qayıdanda açılır. Data dəyişməsi mövcud citation üçün review tələb edir.
- Backup formatı ixracda v2 oldu, decoder v1 və v2-ni dəstəkləyir. Table/chart açıq siyahı üzrə klonlanır; struktur xətaları idxalda rədd edilir, natamam yazılmış rəqəmlər isə qaralama kimi qala bilir. Köhnə v1 faylları işləyir.
- data-editor.css açıq/tünd və mobil görünüş üçündür.

Yoxlama: npm run check artıq check-export.mjs, check-data.mjs, check-pdf.mjs və check-workspace.mjs işlədir; hamısı keçdi. check-data yeddi dizayn × iki chart növündə native table/chart XML, embedded XLSX, rəqəmlər, Azərbaycan mətni və XML escape, formula olmaması, boş data rəddi və maksimum 8×5 cədvəlin alt mənbə sahəsinə daşmayan həndəsəsini yoxlayır. check-workspace cədvəl tətbiqi, undo/redo, chart redaktəsi, mənfi/sıfır/boş hallar, qaralama bərpası və v1/v2 data backup roundtrip yoxlayır. npm run build və npm audit --omit=dev uğurludur. Brauzer/PowerPoint/PDF vizual yoxlaması aparılmayıb; istifadəçi yalnız texniki sınaqları seçib.


## Beşinci iş axını — yaratma blokları və şəxsi şəkillər (2026-10-29)

İstifadəçi təqdimat yaratmaq üçün yeni imkanlar düşünüb əlavə etməyi və 30 dəqiqəlik iş istədi. WORKFLOW-05.md planı və nəticələri saxlayır. Brauzer UI istifadə edilmədi, əvvəlki texniki sınaq seçimi qüvvədədir.

- Layout-a comparison/timeline/image əlavə edilib: cəmi 10. Slide-da comparison, timeline və image opsional sahələri var. Comparison iki tərəfin başlıq/mətnidir; timeline 2–5 label/title/body mərhələsidir; ImageAsset data URI, width/height, alt və credit saxlayır.
- Modeldə isComparisonData/isTimelineData/isImageAsset, rasterInfo (PNG/JPEG başlıq/dimensiya), IMAGE_LIMIT=300000, PROJECT_IMAGE_LIMIT=1200000, projectImageSize var. dataProblems yeni strukturların tamamlanmasını yoxlayır, image üçün alt mətn ixracdan əvvəl tələb olunur. visibleSlideText yeni sahələri də daxil edir. Struktur slaydları avtomatik bölünmür.
- createCover ümumi factory-dir. createManualDeck topic+brief-dən örtük və yekun yaradır. İlk addımdakı «Material olmadan özüm qurum» material tələb etmədən redaktora/blok seçiminə keçir; mövzu mütləqdir. Mövcud deck əvəz olunmur.
- SlideBlocks.tsx 9 hazır strukturun axtarılan modal kitabxanasıdır. createBlock fakt və tarix yaratmır, istifadəçinin dolduracağı sahələr qoyur. Blok seçiləndən sonra seçilən slaydın arxasına əlavə olunur, undo edilə bilir. Global qısayollar modal açıqkən arxada işləmir.
- VisualEditor.tsx müqayisə/mərhələ/şəkil formalarıdır. VisualContent.tsx önizləmə/print/məşq üçün eyni strukturu göstərir. visuals.css açıq/tünd və mobil görünüş üçündür.
- raster.ts faylı yerli PNG/JPEG kimi yoxlayır (ən çox 5 MB, 20 MP, tərəf 12000). Image+Canvas vasitəsilə maksimum 1280 uzun tərəf və data URI limitinə uyğunlaşdırır. Object URL-lər finally-də təmizlənir, açılış vaxt limiti var. PNG şəffaflığı canvas formatında saxlanır, JPEG öz formatında kodlanır. Orijinal fayl saxlanmır. Nəticə alt və mənbə sətri ilə modelə yazılır.
- Şəkil async tamamlananda ən son onImage callback istifadə edilir ki, başqa redaktələri köhnə state ilə əvəz etməsin. VisualEditor projectId+slideId key ilə bağlanır, unmount generation ləğvi var. Şəkil işlənərkən alt/credit və çıxarma dayandırılır. Yaddaş büdcəsi əlavə etmə və slayd surətində yoxlanır.
- PowerPoint müqayisə və mərhələləri native shapes/text ilə, rasteri contain ölçüsü, alt mətn və credit ilə əlavə edir. Caption olmayan şəkil slaydı tam en istifadə edir.
- Backup v3 oldu; decoder v1/v2/v3 qəbul edir. Yeni strukturlar explicit fields ilə klonlanır. Embedded şəkil backup-a daxildir, orijinal giriş faylı daxil deyil. 2 MB backup limiti qalır.

Yoxlama: npm run check (check-export, check-data, check-visuals, check-pdf, check-workspace) və npm run build keçdi; production audit 0 məlum zəiflik. check-visuals @napi-rs/canvas dev asılılığı ilə sintetik real PNG/JPEG-lərdən browser-like canvas adapterində normalizeri yoxlayır; bu, browser UI yoxlaması deyil. Yeddi dizaynda yeni üç düzülüşün PPTX mətn/formaları, embedded PNG byte-ları, alt/credit və XML escape yoxlanıb. Komponent sınaqları material olmadan yeni deck, blok, müqayisə/timeline redaktəsi, undo/redo, şəkil çıxarma/bərpa və bütün yeni sahələrin backup/bərpasını yoxlayır. Stage5 mənbə/dist ZIP-i ayrıca saxlanır, istifadəçinin localStorage təqdimatları həmin mənbə arxivinə daxil deyil.
## Son audit — 2026-10-29

İstifadəçi bütün dəyişiklikləri yoxlayıb səhvləri düzəltməyi istədi. Təqdim layihəsində yerli düzəlişlər edildi; AIC reposu və canlı sayt dəyişdirilmədi.

- ProjectLibrary: gecikmiş ehtiyat nüsxə oxunuşu ən son onImport callback-i istifadə edir. Bu arada dəyişmiş layihə siyahısını köhnə siyahı ilə əvəz etmir. Kitabxana bağlanıbsa nəticə tətbiq edilmir; eyni anda ikinci import başlanmır.
- PdfUpload: material siyahısı dəyişdikdə əvvəlki PDF açılışı və mətn oxunuşu etibarsız sayılır, açıq sənəd azad edilir və seçim sıfırlanır. Köhnə PDF yeni materiala əlavə edilmir.
- VisualEditor: düzülüş və ya şəkil dəyişdikdə davam edən əvvəlki şəkil əməliyyatı ləğv olunur. Geri alma ilə bərpa edilmiş şəkli gecikmiş nəticə əvəz etmir.
- Təqdimat rejimində ox düymələri səhifənin standart sürüşməsini dayandırır.
- Cədvələ yapışdırma parseTablePaste ilə yanaşı isTableData yoxlamasından keçir. Gizli idarəetmə simvolları saxlanmış qaralamanı etibarsız etməzdən əvvəl rədd edilir. Mövcud cədvəl xəta zamanı qorunur.
- Struktur slaydlarında uzun açıqlama üçün avtomatik bölmə tövsiyəsi çıxarılıb; uyğun qısaltma xəbərdarlığı qalır.

Yeni şəbəkəsiz jsdom sınaqları gecikmiş import callback-i, bağlanmış kitabxanaya yazmama, PDF açılışı/oxunuşunda material dəyişməsi, şəkil işlənərkən düzülüş/bərpa dəyişməsi, təqdimat ox düymələri və gizli cədvəl simvollarını yoxlayır. npm run check və npm run build tam keçdi. npm audit --omit=dev: 0 məlum zəiflik. Yerli HTTP cavabı 200-dür. Vite-in ayrıca yüklənən PDF modulu üçün 500 kB xəbərdarlığı qalır (542 kB); bu, yığım xətası deyil. Brauzer/PowerPoint/PDF vizual yoxlaması aparılmayıb, istifadəçinin texniki sınaq seçimi qüvvədədir.

Mənbə, sınaqlar, sənədlər və dist üçün ayrıca Teqdim-backup-2026-10-29-audit.zip yaradılır. İstifadəçinin brauzer localStorage təqdimatları mənbə arxivinə daxil deyil.



## Altıncı mərhələ — 20 bənd tamamlandı (2026-10-30)

İstifadəçi layihə üzərində davam etməyi, 20 bəndlik siyahı yaradıb bütün işləri bitirməyi istədi. WORKFLOW-06.md-də bütün qəbul meyarları və nəticələr var.

- src/authoring.ts: Azərbaycan dilində slayd axtarışı/filtrləri, söz və saniyə hesabı, tam saniyələrə yuvarlaqlaşdırılmış və cəmi hədəf müddətinə bərabər vaxt bölgüsü, aktiv struktur məlumatı və mənbələrlə mətn ixracı, Markdown plan, ayrıca çıxış qeydləri və UTF-8 BOM ilə təhlükəsiz adlı .md/.txt yükləmələri, #/## plan parseri.
- src/SlideNavigator.tsx: başlıq/body/aktiv struktur/notes axtarışı, layout və problem filtri, görünən/ümumi say, sıfırlama, aria-current və problem təsviri. SlideJump ayrıca nömrə keçididir; aralıqdan kənar nömrə seçimi dəyişmir.
- src/OutlineImport.tsx: başlıqlı planı yazıb/yapışdırıb əvvəlcə önizləmə, açıq xəta, sonra sona əlavə. 240000 simvol, ən çox 80 slayd, 160 başlıq/3000 body limiti var. Mənbə uydurmur və mövcud materiala avtomatik citation bağlamır. Əlavə əməliyyatı bir history addımıdır; seçilmiş slayd ilk idxal olunan slayda keçir.
- App: yeni idarələr, slayd söz/saniyə göstəricisi, notes 8000 sayğacı, üç mətn yükləmə düyməsi, idxal modalı, Home/End. Native yazı sahələri qorunur. Mövcud AIC etiketi saxlanıb.
- PracticeMode: növbəti slayd başlığı, qeydlər və ya görünən mətnin söz çəkisinə görə hədəf büdcəsi təklifi, Home/End/PageUp/PageDown. Ölçülmüş sürət kimi göstərilmir. Təqdimat rejimində də həmin keçidlər var.
- useDialogKeyboard: onClose ref ilə yenilənir, hər renderdə listener/fokus yenilənmir. Dialog xaricində son fokus izlənir, pəncərə bağlananda bağlı olmayan əvvəlki elementə qayıdır. Gizli fokus elementləri nəzərə alınmır.
- authoring.css: yeni idarələr, açıq/tünd və dar ekran qaydaları, prefers-reduced-motion. Həqiqi render yoxlaması ayrıca qalır.

Bütün npm run check və npm run build keçdi. Əsas yeni sınaqlar check-workspace.mjs-dədir: parser xətaları və limits, Azərbaycan hərfləri, struktur mətnlərinin ixracı, üç real Blob/anchor yükləmə axını (jsdom), object URL təmizlənməsi, plan önizləməsi/əlavə/undo/redo, debounce-dan sonra qaralama və backup roundtrip, native input qısayolu, fokus bərpası, filtrlər, nömrə keçidi, məşq büdcəsi və klaviatura keçidləri. Production audit 0 məlum zəiflik. Vite PDF chunk 542 kB xəbərdarlığı qalır.

Server dayanmışdı; node ilə Vite arxa planda yenidən başladıldı (127.0.0.1:5174, strictPort, .checks/dev-server*.log). HTTP 200 və yeni authoring modulunun verilməsi yoxlanıb. Son mənbə/dist ehtiyat nüsxəsi Teqdim-backup-2026-10-30-stage6.zip-dir. Brauzer localStorage istifadəçi təqdimatları bu mənbə ZIP-inə daxil deyil.

### Brauzer icazəsi barədə ən son vəziyyət

İstifadəçi əvvəlki yalnız texniki sınaq seçimini dəyişərək vizual yoxlamaya icazə verib və bunu dəfələrlə istəyib. Buna baxmayaraq browser origin gate 127.0.0.1:5174 üçün saxlanmış icazə rəddi qaytarır. Ekran görüntüsündə və yerli config.toml-də origin allow kimi görünür; yoxlanmış yerli sistem/project blok qaydası yoxdur. Səbəbin sessiya vəziyyəti və ya uzaq siyasət olması təsdiqlənməyib. Nasazlıq mətni hazırlanıb, agent tərəfindən göndərilməyib (göndərən alət yoxdur). Bu mərhələdə brauzerə giriş təkrar sınanmadı və blok başqa yolla keçilmədi. Vizual sınaqların tamamlandığını iddia etmə.


## Yeddinci mərhələ — yeni 20 bənd tamamlandı (2026-10-30)

İstifadəçi yenidən layihəni təkmilləşdirmək üçün 20 bənd seçib hamısını bitirməyi istədi. WORKFLOW-07.md-də 20/20 iş və qəbul meyarları var. AIC reposu və canlı sayt dəyişməyib.

- editing.ts: replaceAcross başlıq/body/notes üçün sahə, seçilən slayd/bütün təqdimat, AZ matchCase və Unicode wholeWord seçimlərini tətbiq edir. Dəyişmiş slaydlar immutable qaytarılır, əvvəl/sonra/count önizləməsi var. Hər hansı başlıq 160/body 3000/notes 8000 həddini aşarsa bütün əməliyyat rədd edilir. Literal əvəzləmədir, $& kimi simvollar əməliyyat kimi yozulmur. İstinadlı başlıq/body dəyişəndə citationReview true olur, notes özü istinad yoxlamasını dəyişmir. Case fold zamanı uzunluğu dəyişən I+combining dot üçün Intl.Segmenter ilə orijinal indekslər qorunur; emoji və birləşən işarə testləri var.
- ReplaceDialog.tsx: sahə/əhatə/iki uyğunluq seçimi, önizləmə, limit xətası və bir history addımında tətbiq. Modal açıqkən arxa redaktor qısayolları işləmir. Mövcud focus trap/restore istifadə olunur.
- agendaCandidates/createAgenda və AgendaBuilder.tsx: cover xaricində mövcud boş olmayan başlıqlardan seçim; ilkin ardıcıllıq, ən çox 5 məqam və 460 simvol üzrə bir və ya bir neçə bullets slaydı. Cover varsa ondan sonra, yoxdursa əvvələ əlavə edilir. 80 slayd limiti yoxlanır, bir addımda undo olur. Mənbə/fakt uydurmur. Bu bir dəfə qurulan plandır, başlıqlar dəyişəndə avtomatik yenilənmir.
- editing.ts tableTsv/chartTsv/parseTsvRows/parseChartPaste: UTF-8 TSV, dırnaqlı xana və ikiqat dırnaq emalı. Riskli başlanğıclı mətnlər TSV-də apostrof ilə literal qorunur, daxili model dəyişmir. Chart ixracında yalnız Etiket/Qiymət var; rəqəmlər normal onluğa çevrilir, yanlış/boş qiymət ixracdan əvvəl rədd edilir. İdxalda dəqiq Etiket və Qiymət başlıqları, 2–8 data sətri, hər sətirdə iki xana, 40 simvol etiket, 32 simvol raw qiymət və mövcud parseChartNumber sərhədləri yoxlanır. Mətn girişi 6000 həddindədir; səssiz data kəsilmir. DataEditor-un köhnə cədvəl parseri də ortaq dırnaqlı TSV oxunuşundan istifadə edir.
- ChartPaste.tsx: Tab mətnini önizləmə, sətir üzrə xəta, current chart name/unit/type qorunaraq bir addımda yeni points tətbiqi. DataEditor cədvəl/diaqram TSV yükləmə düymələrini və açıq ixrac xətasını göstərir. authoring.downloadText əvvəlki boolean Markdown parametrinə əlavə olaraq tsv formatını qəbul edir.
- SourceInspector: references-də faktiki mövcud PDF mətnlərini fayl adı, total physical page count və əlavə edilmiş səhifə nömrəsi ilə TXT yükləmək. Orijinal PDF daxil deyil.
- QualityPanel: empty/length/placeholder/citation/data növ filtri, filtrdə uyğun qeyd yoxdursa ayrıca məlumat. Ümumi statistika və doğruluq barədə əvvəlki açıqlama qalır.
- ProjectLibrary: fənn və theme filtri, axtarış/sıralama ilə kəsişmə, bütün filtrlərin sıfırlanması. Fənni olmayan layihə ayrıca seçilir; sentinel ilə faktiki fənn dəyəri qarışmır (JSON value). Backup idxalı uğurlu olduqda filtrlər sıfırlanır ki, yeni layihə görünsün. Mövcud gecikmiş import qoruması qalır.
- editing.css: yeni pəncərə, preview, TSV və filter idarələri üçün açıq/tünd/dar ekran stilləri. Faktiki brauzer renderi təsdiqlənməyib.

Yoxlama: npm run check altı skriptlə (check-export, check-data, check-visuals, check-pdf, check-workspace, yeni check-editing) tam keçdi. Yeni sınaq ayrıca .checks/editing-ə transpile edir və şəbəkəsiz jsdom işlədərək toplu redaktə/undo/redo, plan əlavə etmə/undo, chart məlumatı/undo/metadata, download Blob/MIME/URL təmizlənməsi, mənbə çıxarışı, backup roundtrip və fənn/theme filtrlərini yoxlayır. npm run build uğurlu, production audit 0 məlum zəiflik. Ayrı PDF chunk 542 kB xəbərdarlığı qalır. Server HTTP 200 verir. Yeni runtime asılılığı əlavə edilməyib.

Son mənbə/dist arxivi Teqdim-backup-2026-10-30-stage7.zip-dir. Bu arxiv browser localStorage təqdimatlarını daxil etmir. Brauzerin origin icazə bloku əvvəlki kimi ayrıca məsələdir; bu mərhələdə təkrar cəhd və dolayı yol istifadə edilmədi, vizual yoxlama aparılmış kimi təqdim edilməməlidir.


## Səkkizinci mərhələ — dizayn studiyası, 20/20 (2026-10-30)

İstifadəçi yenidən 20 iş seçib tam bitirməyi, xüsusən dizayn növlərini yeniləməyi istədi. WORKFLOW-08.md-də bütün 20 qəbul meyarı tamamlanıb. AIC etiketi və canlı sayt ayrı saxlanıb, yayımlama yoxdur.

- Theme tipi və registri 10 dizayndır: əvvəlki 7-yə caspian/Xəzər (073C4A/F2FAF7/71E1CF), heritage/İrs (FAF1DE/452637/8E2949), prism/Prizma (F4F6FF/17234F/294FD8) əlavə edildi. Xəzər sağ zolaq/həlqələr, İrs iç çərçivə və həndəsi künclər, Prizma ofset mavi bloklar və kiçik isti aksentdir. Üçünün CSS kompozisiyası və native PPTX formaları var.
- Project.design?: DesignSettings yeni opsional sahədir: headingFont default/sans/serif, textSize regular/large, decoration full/minimal, showNumbers boolean. defaultDesign/isDesignSettings/resolveDesign/headingFontFor modeldədir. Köhnə layihələr ilkin ayarla açılır.
- DesignGallery.tsx öz query/category/tone/choice/preview state-ni saxlayır. Kartlar actual seçilmiş və ya ilk slayddan SlideView göstərir; seçim yalnız Tətbiq et ilə parent theme-ni dəyişir. İmtina/Escape layihəni dəyişmir. Kateqoriya, AZ ad/note axtarışı, açıq/tünd slayd fonu və sıfırlama var. Rəng nöqtələri və bg/fg sRGB nisbi parlaqlıqdan hesablanan kontrast göstərilir; ümumi əlçatanlıq zəmanəti deyil. design.ts həmin hesab və filtrlərdir.
- DesignControls.tsx Arial/Georgia başlıq seçimi, adi/iri əsas mətn, tam/sadə dekor və nömrə checkbox idarələridir. Sıfırlama yalnız design sahəsini defaultDesign-a qaytarır, theme-ni dəyişmir. Hər ayar bir history addımıdır; undo/redo mövcuddur.
- App history artıq slides/theme/design saxlayır. Load/reset/plan/manual factory, currentProject, dirty müqayisəsi, draft/save/import/clone və qalereya hamısı design-i qoruyur. Qalereya ilk addımdakı nümunə önizləməsindən də açıla bilər. Dizayn sayı theme registrindən gəlir. Modal açıqkən arxa qısayollar dayandırılır.
- SlideView design propunu bütün yerlərdə alır: ilk baxış, redaktor, rail, kitabxana, təqdimat, məşq, çap və qalereya. Palitra CSS custom properties inline verilir; yeni structural data komponentləri mövcud --s-bg/fg/accent dəyişənlərini alır. Başlıq family custom seçimdə tətbiq edilir. Nömrə gizlənəndə footer page-number, eyebrow indeks və atelier dekorativ page nömrəsi gizlənir; struktur bloklarının öz məqam nömrələri qalır.
- design-studio.css yeni kompozisiyalar, swatch-lar və qalereya/controls üçün açıq/tünd/dar ekran qaydalarıdır. Sadə dekor art/motifs/creative layer-ləri söndürür, köhnə dar text sahəsini genişləndirir və grid/outline/border dekorunu azaldır. İri mətn text/cover/columns/bullets/statement body üçündür; data blokları öz həndəsəsini saxlayır. inspectDeck design-i üçüncü opsional parametr kimi qəbul edir, large rejimdə 300 simvoldan uzun əsas mətn üçün əlavə xəbərdarlıq verir. Navigator/QualityPanel də bu xəbərdarlığı görür.
- exportPptx yeni 3 native kompozisiyanı, seçilmiş heading fontu, 1.18 əsas mətn ölçüsü əmsalını, sadə dekor və page nömrəsinin gizlədilməsini tətbiq edir. Metadata/mənbələr/notes/native table-chart və embedded image saxlanır. Sadə rejimdə dekor yox olur, struktur məna daşıyan xətlər qalır.
- storage.isProject design quruluşunu yoxlayır. projectContent ilkin design-i canonical müqayisəyə daxil edir. Backup ixracı v4 oldu, decoder v1/v2/v3/v4 qəbul edir, design yalnız 4 məlum sahə ilə klonlanır. Yanlış enum/boolean idxalı rədd edilir. Köhnə v1–v3 design-siz nüsxə default ayarla bərpa edilir.

Yoxlama: npm run check yeddi skriptlə tam keçdi. Yeni check-design-studio.mjs .checks/design-studio altında transpile edir; palette kontrastı, filtr, actual slide preview, imtina/tətbiq/undo/fokus/Tab/Escape, controls/reset/undo, draft/library/print/practice və v1–v4 backup-u yoxlayır. Hər 10 theme × 2 design profili × 10 layout = 200 PPTX slayd ZIP/XML və native formalar, Georgia fontu, iri əsas mətn, gizli nömrə/dekor, cədvəl/chart/image üzrə yoxlanıb. Digər model/visuals/data testlərində theme dövrü avtomatik 10-dur. npm run build keçdi, production audit 0 məlum zəiflik, HTTP 200. PDF modulunun 542 kB ölçü xəbərdarlığı qalır.

Həqiqi brauzer/PowerPoint/PDF renderi təsdiqlənməyib. Mövcud origin bloku dolayı yolla keçilməyib. Son mənbə/dist arxivi Desktopda Teqdim-backup-2026-10-30-stage8.zip-dir. Browser localStorage-da istifadəçinin təqdimatları mənbə arxivinə daxil deyil.


## AIC interfeys palitrası (2026-10-30)

İstifadəçi saytın rənglərini aicommunity.org.az palitrasına uyğunlaşdırmağı istədi. AIC repo yalnız oxundu: src/app/globals.css və tailwind.config.ts faktiki palitranı verir — paper #F3EFE6, ink #16140F, lime #CCFF00, violet #5B3DF5; light surface #FBF9F4, dark page #0E0D0A, dark surface #1C1A14, dark accent text #A592FF. Canlı saytı web aləti açmadı; rənglər həmin yerli brend mənbələrindən götürüldü. AIC reposuna və yayımlamaya dəyişiklik yoxdur.

Təqdimə son yüklənən src/aic-brand.css qatını əlavə etdik: semantik --aic-* rəngləri ilə əsas fonlar, panellər/kartlar, naviqasiya, düymələr, formalar, seçim/fokus, PDF/istinad/quality idarələri, yeni modallar/qalereya və presenter alətləri uyğunlaşdırıldı. Yeni təqdimat düyməsi laym, əsas əməl düymələri AIC kağız/mürəkkəb kontrastındadır. Açıq/qaranlıq rejim davam edir; presenter alətləri hər iki rejimdə tünddür. Öz --s-* palitrası olan SlideView məzmununa ümumi modal mətn rənglərinin keçməməsi üçün seçicilərdə istisna var; 10 slayd dizaynı və PPTX model palitraları bu dəyişiklikdə yenidən yazılmayıb.

npm run build keçdi. Əsas mətn, köməkçi mətn və vurğu rənglərinin fonla kontrastı hər iki rejimdə rəng tokenləri üzrə >=4.5 hesablandı (bu, bütün renderə ümumi uyğunluq zəmanəti deyil). Yerli HTTP 200, aic-brand.css-in verilməsi və main importu təsdiqləndi. Vizual brauzer yoxlaması origin blokuna görə aparılmadı. Məntiq/model dəyişmədiyi üçün PPTX sınaq matrisini yenidən işlətmədik. CSS və main.tsx dəyişib, mətnlər/loqo saxlanıb. Yeni mənbə/dist arxivi Teqdim-backup-2026-10-30-aic-colors.zip-dir; browser localStorage təqdimatları daxil deyil.


## Düzəliş turu (2026-10-30, axşam)

İstifadəçi faylları yoxlayıb düzəldilə bilən hər şeyi düzəltməyi istədi. Əvvəl build və 7 check skripti keçirdi; kod oxunaraq bu səhvlər düzəldildi:

- PPTX: Atelye (tam dekor) dizaynında sağ alt künc aksent bloku ilə örtülür, slayd nömrəsi aksent rəngində görünmürdü. İndi həmin halda fon rəngindədir (F5EBDD yoxlanıb).
- Mövzu sahəsi təksətirlidir: Enter və yapışdırılan sətir keçidləri boşluğa çevrilir (mövzu üz qabığı başlığı və fayl adıdır).
- `model.safeFileName`: PPTX, .teqdim.json və mətn yükləmələri eyni Windows-uyğun ad qaydasından istifadə edir (idarəetmə simvolları, sətir keçidi, sondakı nöqtə/boşluq təmizlənir). Əvvəl PPTX və backup adında sətir keçidi qala bilirdi.
- Avtomatik başlıqlarda sətir keçidi tək boşluğa çevrilir; diaqram alt mətnində vahid yoxdursa artıq boşluq qalmır.
- Məşq otağı: fasilədən sonra düymə «Davam et» yazır.
- Təqdimatlarım: yanlış `updatedAt` olduqda «Invalid Date» əvəzinə «Tarix məlum deyil».
- Mətnlər: «baxış bucağı» kalkası «dizayn» ilə əvəzləndi; köhnəlmiş «Ehtiyat nüsxə üçün PowerPoint-i yüklə» qeydi və yaddaş xətası mesajı «Ehtiyat nüsxə» düyməsinə yönləndirir.
- index.html: theme-color köhnə bənövşəyi #7047eb əvəzinə AIC kağız #F3EFE6 / tünd #0E0D0A.

npm run build və npm run check (7 skript) yenidən keçdi. Vizual brauzer yoxlaması bu turda da aparılmayıb. Dəyişiklikdən əvvəlki src surəti sessiya scratchpad qovluğunda saxlanılıb (layihə git deyil).


## Doqquzuncu mərhələ — 30 dəqiqəlik təkmilləşdirmə (2026-10-30)

WORKFLOW-09.md-də 7/7 iş. Repo artıq git-dədir: şəxsi GitHub `17Darkhizm/teqdim`, `main`.

- SlideView `onOverflow` propu və `clippedText`: `.slide-copy` daxilində h2/p/məqam mətninin scrollHeight/clientHeight fərqi (>2 px) ilə CSS-in səssizcə kəsdiyi mətn aşkarlanır. Redaktorda «Mətnin bir hissəsi slayda sığmır…» xəbərdarlığı. Hər renderdən sonra, ResizeObserver və `document.fonts.ready` ilə yenidən ölçülür. Yalnız əsas redaktor slaydı ölçülür.
- Təqdimat rejimi: Fullscreen API varsa «Tam ekran · F» düyməsi və F qısayolu; təqdimat bağlananda tam ekrandan çıxılır, rədd edilsə bildiriş. Yuxarıda irəliləyiş zolağı (role=progressbar), slayda klik növbətiyə keçir (düymələr sayılmır).
- Sıralama: SlideNavigator `onMove` — sürüklə-burax (drop-target/dragging stilləri, ipucu sətri), App `moveTo` bir history addımıdır. Alt+↑/↓ seçilən slaydı köçürür, mətn sahələrində işləmir.
- Qısayollar bələdçisi: Ctrl+Y, Alt+↑/↓, F və PageUp/PageDown.
- Yeni CSS authoring.css sonundadır. Yeni runtime asılılığı yoxdur.

Yoxlama: npm run check 8 skriptlə (yeni check-stage9.mjs) və npm run build keçdi. jsdom-da layout olmadığı üçün daşma ölçü əvəzləməsi ilə, fullscreen isə saxta API ilə sınanıb. Həqiqi brauzer renderi təsdiqlənməyib.


## Onuncu mərhələ — 30 dəqiqəlik təkmilləşdirmə (2026-10-30)

WORKFLOW-10.md-də 5/5 iş.

- Bütün deck üçün görünən daşma: App step 3-də `.measure-layer` (fixed, ekrandan kənar, 960 px, visibility hidden, aria-hidden, çapda gizli) hər slaydı eyni theme/design ilə render edib `onOverflow` ilə ölçür; `clippedIds` dəsti. `model.withClippedIssues` + `CLIPPED_MESSAGE` bunu «length» növlü qeydə çevirir: QualityPanel, SlideNavigator «!» işarəsi və «Yoxlanmalı» filtri (`filterSlides` 7-ci opsional parametr). Silinmiş slaydın id-si qeyd yaratmır. Redaktor slaydının öz xəbərdarlığı qalır.
- Təqdimat: B və ya «.» qara ekran (role=status); istənilən düymə/klik (modifikatorlardan başqa) yalnız ekranı qaytarır, slaydı dəyişmir. Esc təqdimatı bağlayır, yenidən açanda qara ekran sıfırlanır.
- Məşq otağı: növbəti slaydın mini önizləməsi, son slaydda gizlənir.
- Bildirişlər: `setToast(text, "error")` xətaları role=alert, AlertTriangle və sabit #b52e21 fon/ağ mətnlə göstərir; uğur bildirişləri role=status qalır.
- Bələdçiyə B / . əlavə edildi. Yeni CSS authoring.css sonundadır, yeni asılılıq yoxdur.

Yoxlama: npm run check (9 skript) və build keçdi, audit 0. Daşma jsdom-da ölçü əvəzləməsi ilə sınanıb; həqiqi render təsdiqlənməyib.
