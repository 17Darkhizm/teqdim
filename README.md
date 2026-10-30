# Təqdim

Tələbələrin Azərbaycan dilində peşəkar təqdimat hazırlaması üçün ayrıca SaaS layihəsi.

**Mövzunu yaz. Fikrini təqdim et.** · AIC tərəfindən hazırlanıb.

## Yerli işə salma

Node.js və npm lazımdır.

```powershell
cd C:\Users\Asus\Desktop\Teqdim
npm install
npm run dev
```

Ünvan: http://127.0.0.1:5174

Windows-da `Baslat.cmd` faylını iki dəfə klikləməklə də işə sala bilərsən. Terminal açıq qalmalıdır.

```powershell
npm run build
npm run check
```

## Hazır olanlar

- Azərbaycan dilində, mobilə uyğun üçaddımlı iş məkanı.
- Öz materialını cümlə/söz sərhədləri üzrə oxunaqlı slaydlara bölmək (süni intellekt deyil). Slayd sayı istiqamətdir; mətn uzundursa, sayı artırılır. Ən çox 80 slayd; uzun material səssizcə kəsilmir.
- Planı redaktə etmək, slayd əlavə etmək, silmək, bölmək, surətini yaratmaq və ardıcıllığı dəyişmək.
- On düzülüş: üz qabığı, mətn, məqamlar, iki sütun, vurğu, cədvəl, diaqram, müqayisə, mərhələlər və şəkilli izah.
- Çıxış qeydləri və PowerPoint qeydlərinə ixrac.
- Son baxış paneli: həcm, boş sahələr, tamamlanmamış göstərişlər, dəyişdirilmiş istinadlar, söz sayı və təxmini danışıq vaxtı.
- 650 ms fasilədən sonra avtomatik yerli qaralama; səhifə yenilənəndə bərpa və saxlanmamış işin əvəz olunmasından qoruma.
- Açıq/qaranlıq rejim və yadda saxlanan rəng seçimi.
- On dizayn: Botanika, Atelye, Çertyoj, Şəfəq, İmpuls, Orbita, Akademik, Xəzər, İrs və Prizma. Yeni dizaynlar fərqli tipoqrafiya, formalar və kompozisiyalarla hazırlanıb; əsas vektor elementləri PPTX-də də saxlanır.
- Slayd önizləməsi və klaviatura ilə təqdimat rejimi.
- Üçədək PDF istinad materialı (hər biri ən çox 20 MB), sürükləyib əlavə etmə, səhifə aralığı və çıxarılan mətnə baxış.
- PDF adı və fiziki səhifə nömrəsi üzrə slayd istinadları, mənbələr slaydı və PowerPoint qeydləri.
- Redaktə edilən mətnləri saxlayan PowerPoint ixracı (pptxgenjs).
- Brauzerin çap pəncərəsi vasitəsilə PDF.
- İstifadəçinin seçimi ilə localStorage-da saxlamaq və yenidən açmaq.

## Məhdudiyyətlər

Bu, məhsulun ilkin işlək prototipidir. Hesab, server bazası, ödəniş, süni intellekt, avtomatik mənbə axtarışı və buludda saxlama hələ yoxdur. Uzun mətn slaydda kəsilə bilər; ixracda mətn sahəyə uyğun kiçilir. Brauzer və PowerPoint görünüşü eyni piksel düzülüşünü təmin etmir. Hazırkı mətnlər və nümunə akademik istinad kimi qəbul edilməməlidir. PDF emalı Mozilla PDF.js ilə brauzerdə aparılır. Bir fayldan bir dəfəyə ən çox 50 səhifə/60 000 simvol, ümumilikdə 100 000 simvol qəbul olunur; mətn səssizcə kəsilmir, limitdə xəta verilir. Skan PDF üçün OCR, parollu PDF və dizaynın PDF-dən köçürülməsi yoxdur. Cədvəllər və çoxsütunlu sənədlərin mətn sırası düzəliş tələb edə bilər. Səhifə nömrəsi sənəddə çap olunmuş nömrə deyil, fiziki səhifə sırasıdır. Mətn çıxarılması faktların yoxlanması və ya xülasə yaratmaq deyil. Material serverə göndərilmir; şrift üçün Google Fonts-a sorğu gedir, şrift yüklənməsə sistem şrifti işləyir. PDF brauzerin çap imkanından asılıdır; fon qrafikasını aktiv saxla.

## Quruluş

- `src/App.tsx`: iş axını, redaktə və layihələr.
- `src/model.ts`: məlumat tipləri, abzas bölgüsü, nümunə və PPTX ixracı.
- `src/PdfUpload.tsx` və `src/pdf.ts`: PDF seçimi, aralıq, yerli mətn oxunuşu və səhifə məlumatları.
- `src/style.css`: interfeys, slayd dizaynları və çap qaydaları.
- `CONTEXT.md`: hazırkı vəziyyət və növbəti mərhələ.

AIC saytının kodu və yayımlanması bu layihədən ayrıdır.

## Yoxlama

`npm run check` materialın 4/6/12 slayd arasında itmədən bölündüyünü və yeddi dizaynın hər birində 6 slaydlı PowerPoint faylında Azərbaycan hərflərinin və redaktə edilən mətnlərin saxlandığını yoxlayır. PDF yoxlamaları iki səhifəlik sınaq sənədini yaddaşda qurub parseri və aralıq/ölçü/mətn xəta hallarını yoxlayır. Sınaq faylları gitignore-da olan `.checks/` qovluğuna yazılır. `image-size` asılılığı təhlükəsizlik düzəlişi olan 2.0.4 və ya daha yeni uyğun versiyaya yönləndirilib; PNG/JPEG şəkilləri yerli ölçüləndirilərək slayda və PowerPoint-ə daxil edilir.


## Təkmilləşdirmə iş axını

Təxminən 20 dəqiqəlik plan və görülmüş işlər `WORKFLOW.md` faylındadır. `npm run check` əlavə olaraq təcrid olunmuş DOM-da bütün iş axınını, düzülüş seçimini, çıxış qeydlərini, avtomatik qaralamanın bərpasını və saxlanmamış işin əvəz edilməsindən qorumanı yoxlayır. Bunlar həqiqi brauzerdə vizual yoxlamanı əvəz etmir.

Son baxışdakı “Hazırdır” yalnız mətn həcmi və tamamlanma yoxlamalarına aiddir. Mətnin faktları və istinadları istifadəçi tərəfindən yoxlanmalıdır. Qaralama yalnız bu brauzerdə saxlanır; serverdə və başqa cihazda əlçatan deyil.


## İkinci təkmilləşdirmə mərhələsi

İş planı `WORKFLOW-02.md`, növbəti məhsul və SaaS mərhələləri `ROADMAP.md` faylındadır.

- Geri al/yenidən et cari slayd və dizayn dəyişikliklərini 60 addıma qədər saxlayır. Ardıcıl yazı qruplaşır. Yeni layihə/plan açıldıqda tarixçə sıfırlanır. Tarixçə səhifə yenilənəndə saxlanmır; qaralamanın son vəziyyəti bərpa olunur.
- Redaktordan slayd əlavə etmək, köçürmək, çıxarmaq və çıxarmanı geri almaq mümkündür.
- Qısayollar qısa bələdçidə göstərilir. Mətn sahələrində yerli yazı qısayolları qorunur.
- Təqdimatlarım bölməsində axtarış, sıralama, ayrıca surət və .teqdim.json ehtiyat nüsxəsi var. 2 MB-dək ehtiyat nüsxə yeni təqdimat kimi idxal edilir; mövcud layihə əvəz edilmir.
- Ehtiyat nüsxə çıxarılmış PDF mətnləri də daxil olmaqla layihə məlumatlarını ehtiva edir; paylaşanda daxilindəki materialları nəzərə al. Orijinal PDF faylı daxil edilmir.

`npm run check` bu imkanların və yanlış fayl/yaddaş xətası hallarının şəbəkəsiz komponent sınaqlarını da işlədir.


## Akademik məzmun və çıxışa hazırlıq

Üçüncü plan `WORKFLOW-03.md` faylındadır. İlk addımda seminar/kurs işi/layihə, auditoriya, məqsəd və hədəf vaxt seçilir. Universitet, müəllim və qrup yazılıbsa üz qabığında göstərilir. Bu seçimlər AI yazısı yaratmır; giriş, yekun göstərişi və çıxış planı məlumatlarını tərtib edir. Metadata qaralama, layihə yaddaşı, PowerPoint və JSON ehtiyat nüsxəsində qorunur.

Redaktordakı Mənbəyə qayıt paneli PDF-dən çıxarılmış mətnə baxmağı, axtarmağı və səhifə istinadını slayda bağlayıb çıxarmağı təmin edir. Orijinal PDF renderi və avtomatik fakt yoxlaması deyil. Son baxış qırılmış səhifə istinadını göstərir.

Məşq et rejimində slaydla birlikdə öz çıxış qeydlərin və həqiqi vaxtölçən görünür. Başla/fasilə/sıfırla düymələri var. Mətnin 110 söz/dəqiqə üzrə hesablanmış vaxtı yalnız təxmindir; məşq vaxtölçəni real keçən vaxtı ölçür. Məşq ekranı bağlananda timer sıfırlanır. Auditoriyaya çıxış üçün ayrıca Təqdim et rejimini seç.

Material dəyişdirilib plan yenidən qurulanda təsdiq alınır. Ləğv və ya həcm xətası əvvəlki slaydları əvəz etmir.


## Cədvəl və diaqram slaydları

`WORKFLOW-04.md` bu mərhələnin iş planını və sınaqlarını göstərir. Redaktorda Cədvəl və ya Diaqram düzülüşünü seç. Cədvəli əl ilə doldura və ya Excel-dən Tab ilə ayrılmış mətn əlavə edə bilərsən. Diaqramın etiket və rəqəmlərini özün yaz; sütun və xətt növləri var. Boş qiymət sıfır sayılmır.

Cədvəl 2–5 sütun və 1–8 sətir, diaqram 2–8 göstərici qəbul edir. Rəqəmlərdə vergül və nöqtə, mənfi və sıfır qiymətlər, ən çox 6 onluq rəqəm və ±1 milyard sərhədi var. Ölçü vahidi ayrıca mətndir; rəqəmlər avtomatik faiz çevrilməsinə məruz qalmır. Xətt etiketlərin yazılmış ardıcıllığına əsaslanır.

PowerPoint ixracı native table/chart və chart üçün daxili XLSX məlumatı saxlayır. Qaralama və backup natamam datanı saxlaya bilər; ixrac əvvəl tamamlanmalı slaydı göstərir. Cədvəlin ölçüsündən asılı olaraq hüceyrə mətnlərini qısaltmaq tələb olunur. Cədvəl/diaqram avtomatik bölünmür.

Yeni .teqdim.json faylları v2 formatındadır. v1 idxalı qorunub. Bu yeni versiya cədvəl/diaqram məlumatlarının köhnə tətbiq tərəfindən xəbərsiz atılmasının qarşısını alır.


## Təqdimatı bloklarla qurmaq

Mövzunu yazıb «Material olmadan özüm qurum» seçə bilərsən. Hazır blok kitabxanasından problem/həll, müqayisə, yol xəritəsi, şəkilli izah və başqa strukturlar əlavə et. Blokda öz mətnini və mənbələrini doldur; tətbiq fakt və tarix uydurmur. Əlavə etmə geri alına bilər.

Müqayisənin hər tərəfində 60 simvolluq başlıq və 220 simvolluq izah var. Mərhələ slaydı 2–5 addımdır; tarix/etiket özün tərəfindən yazılır.

Şəkilli izaha öz PNG/JPEG faylını əlavə et. 5 MB/20 MP giriş limiti, maksimum 1280 px uyğunlaşdırma, şəkil və layihə üzrə yaddaş limitləri var. Alt mətn yaz; mənbə sətri istəyə bağlıdır. Şəkil serverə göndərilmir. Yeni backup v3 şəklin uyğunlaşdırılmış halını da saxlayır, v1/v2 idxalı qalır.

WORKFLOW-05.md bu mərhələnin planını və sınaqlarını göstərir. `npm run check` yeni şəkil və struktur ixrac sınaqlarını da işlədir. Həqiqi brauzer və PowerPoint vizual renderi hələ ayrıca yoxlanmalıdır.


## Altıncı mərhələ — planla və mətnlə işləmək

WORKFLOW-06.md 20 işi və qəbul meyarlarını saxlayır. Redaktorda slayd başlığı, məzmunu, cədvəl/diaqram məlumatı və qeydlər üzrə axtarış, düzülüş və yoxlanmalı məqam filtri, sayğac, nömrə ilə keçid var. Home/End ilk/son slayda keçir; təqdimat və məşqdə PageUp/PageDown da işləyir. Mətn sahələrində redaktor qısayolları yazıya müdaxilə etmir.

«Mətnlə işləmək» bölməsindən planı Markdown, çıxış qeydlərini TXT və seçilmiş slaydın mətnini TXT kimi yükləmək olar. Struktur slaydlarının aktiv məlumatı və istinadlar mətn ixracına daxil edilir; şəkil faylının özü Markdown/TXT-yə daxil deyil. Tam bərpa üçün .teqdim.json istifadə et.

«Plan mətni əlavə et» pəncərəsində hər slayd # və ya ## başlığı ilə başlayır. Plan əvvəlcə yoxlanır və göstərilir, sonra mövcud planın sonuna əlavə edilir. Avtomatik mənbə bağlanmır. Ən çox 80 slayd, 160 simvol başlıq, 3000 simvol slayd mətni və 240000 simvol ümumi giriş qəbul edilir. Əlavə bir addımda geri alınır.

Məşq otağı növbəti slaydın başlığını və hədəf müddətinin söz sayına görə təklif edilən bölgüsünü göstərir. Bu, ölçülmüş danışıq sürəti deyil. Yeni idarələr üçün açıq/tünd və dar ekran stilləri, azaldılmış hərəkət seçimi və modal bağlananda fokusun bərpası var. Brauzer vizual yoxlaması origin icazə blokuna görə təsdiqlənməyib.


## Yeddinci mərhələ — toplu redaktə və məlumat mübadiləsi

WORKFLOW-07.md yeni 20 işi saxlayır. «Mətnlə işləmək» bölməsində «Mətni tap və əvəzlə» başlıq, slayd mətni və qeydləri seçilmiş slaydda və ya bütün təqdimatda dəyişir. Böyük/kiçik hərf və tam söz seçimləri, sahə seçimi və əvvəl/sonra baxışı var. Hər hansı nəticə başlıq üçün 160, mətn üçün 3000 və qeyd üçün 8000 simvolu aşarsa bütün dəyişiklik rədd edilir. Əvəzləmə bir history addımıdır; mənbəli başlıq/mətn dəyişəndə istinadı yenidən yoxlamaq tələb olunur. Qeyd dəyişməsi istinadı özü dəyişmir. Struktur blokları və PDF mətni bu alətlə əvəzlənmir.

«Başlıqlardan plan slaydı» mövcud başlıqları seçib təqdimatın əvvəlinə, üz qabığı varsa ondan sonra yerləşdirir. Başlıqlar öz ardıcıllığında saxlanır; hər plan slaydında ən çox 5 məqam və 460 simvol var. Plan sonradan adi slayd kimi redaktə edilir, başlıqların dəyişməsi onu avtomatik yeniləmir.

Cədvəl və diaqram məlumatı TSV kimi yüklənir. Diaqram TSV-si yalnız Etiket/Qiymət sütunlarını saxlayır, ad/növ/vahid daxil deyil. İdxalda həmin metadata cari diaqramdan qorunur. Etiket və Qiymət başlıqlı Tab mətnindən 2–8 göstəricini əvvəlcə görüb tətbiq etmək olar. Rəqəmlər eyni vergül/nöqtə, 6 onluq və ±1 milyard yoxlamasından keçir; boş qiymət sıfır sayılmır. TSV parseri standart dırnaqlı xanaları oxuyur. Elektron cədvəlin formula kimi işlədə biləcəyi mətnlərin əvvəlinə TSV ixracında apostrof əlavə edilir; bu, modeldəki məzmunu dəyişmir. TSV bütün layihəni bərpa edən fayl deyil, tam bərpa üçün .teqdim.json istifadə et.

Mənbə panelindən PDF-dən çıxarılmış mətnləri fayl adı və fiziki səhifə ilə TXT kimi yükləmək olar. Son baxış qeydləri növ üzrə, Təqdimatlarım isə fənn və dizayn üzrə süzülür. check-editing.mjs yeni axınların ayrıca model və jsdom sınağıdır. Brauzer vizual yoxlaması hələ bloklanır.


## Səkkizinci mərhələ — dizayn studiyası

WORKFLOW-08.md 20 işi saxlayır. Yeni Xəzər dəniz palitrası və axıcı həlqələr, İrs isti kağız və həndəsi çərçivə, Prizma isə açıq fon və ofset bloklarla qurulub. Bunlar raster fon deyil; brauzerdə CSS, PowerPoint-də redaktə olunan native formalar istifadə edilir.

«Dizayn qalereyasını aç» pəncərəsində 10 dizayn faktiki slaydın məzmunu ilə görünür. Ad/təsvir axtarışı, kateqoriya və açıq/tünd slayd fonu filtrləri, seçilmiş/ilk slayd önizləməsi var. Kart seçmək təqdimatı dəyişmir; «Dizaynı tətbiq et» bütün slaydlara keçir və undo edilə bilir. Rəng nöqtələri və mətn/fon rənglərindən hesablanan kontrast nisbəti göstərilir. Bu nisbət bütün elementlərə və çıxış formatlarına ümumi əlçatanlıq zəmanəti deyil.

«Üslub ayarları» başlıq üçün ilkin yazı tipi/Arial/Georgia, adi/iri mətn, tam/sadə dekor və slayd nömrələrinin görünməsini idarə edir. İri mətn yalnız əsas mətn düzülüşlərinə aiddir; struktur blokları öz ölçülərini saxlayır. 300 simvoldan uzun mətn üçün əlavə xəbərdarlıq görünür. Ayarlar bir addımda sıfırlanır, geri alınır, qaralama və Təqdimatlarımda saxlanır. Backup v4 onları açıq sahələrlə saxlayır; köhnə v1–v3 faylları əvvəlki ayarlarla bərpa edilir.

check-design-studio.mjs 10 palitranı, faktiki rənglər üzrə kontrastı, qalereya axınını, yazı/dekor/ölçü/nömrə və bərpanı, hər dizaynda 10 düzülüşün iki rejimdə native PowerPoint quruluşunu yoxlayır. Brauzer/PowerPoint vizual render yoxlaması origin blokuna görə təsdiqlənməyib.
