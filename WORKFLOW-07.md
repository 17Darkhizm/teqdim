# Təqdim — yeddinci inkişaf mərhələsi

Tarix: 2026-10-30. Ayrı yerli layihədir, canlıya yayımlama yoxdur.

## 20 iş və qəbul meyarı

- [x] 1. Başlıq, mətn və çıxış qeydləri üçün toplu axtarış/əvəzləmə pəncərəsi.
- [x] 2. Azərbaycan dilinə uyğun böyük/kiçik hərf seçimi.
- [x] 3. Unicode söz sərhədləri ilə yalnız tam söz axtarışı.
- [x] 4. Seçilən slayd/bütün təqdimat əhatəsi və hansı sahələrin dəyişəcəyini seçmək.
- [x] 5. Dəyişiklikdən əvvəl slayd, sahə, uyğunluq sayı və əvvəl/sonra önizləməsi.
- [x] 6. Bütün əvəzləməni bir addımda tətbiq və undo/redo.
- [x] 7. Başlıq/mətn/qeyd limitini aşan dəyişiklikdə heç bir slaydı dəyişməmək.
- [x] 8. Mənbəli başlıq/mətn dəyişəndə citationReview; yalnız qeyddə dəyişəndə əvvəlki vəziyyəti qorumaq.
- [x] 9. Aktiv cədvəli TSV faylı kimi yükləmək; formula kimi yozula biləcək mətnləri literal saxlamaq.
- [x] 10. Diaqram etiket/qiymətlərini TSV kimi yükləmək; yanlış rəqəmdə ixracı dayandırmaq.
- [x] 11. Etiket və Qiymət başlıqlı Tab mətnindən 2–8 diaqram göstəricisi oxumaq.
- [x] 12. Diaqram məlumatı üçün əvvəlcə baxış və ölçü/rəqəm xətalarını göstərmək.
- [x] 13. Yeni göstəriciləri bir history addımında tətbiq etmək; diaqram növü/adı/vahidi qorunur.
- [x] 14. Mövcud slayd başlıqlarından fakt uydurmadan plan slaydları yaratmaq.
- [x] 15. Plan üçün başlıqları seçmək və nəticəni əlavə etməzdən əvvəl görmək.
- [x] 16. Planı üz qabığından sonra əlavə etmək; 5 məqam/460 simvol və 80 slayd limitini qorumaq, undo etmək.
- [x] 17. Son baxış panelində problemləri növünə görə süzmək.
- [x] 18. Yüklənmiş PDF-lərdən çıxarılmış mətnləri fayl adı/fiziki səhifə ilə TXT kimi yükləmək.
- [x] 19. Təqdimatlarım siyahısında fənn filtri və filtrləri sıfırlamaq.
- [x] 20. Təqdimatlarım siyahısında dizayn filtri; axtarış və sıralama ilə birlikdə işləmək.

## Yoxlama

Köməkçi funksiyalar və React axınları şəbəkəsiz jsdom-da yoxlanacaq; bütün npm run check və npm run build keçməlidir. Yeni idarələr üçün açıq/tünd/dar ekran CSS əlavə edilir. Brauzer origin gate girişə icazə vermir, həqiqi vizual yoxlama bu mərhələdə təsdiqlənmir. Süni intellekt, hesab və ödəniş əlavə edilmir.


## Nəticə

20/20 bənd tamamlandı. Yeni mənbə faylları: editing.ts, ReplaceDialog.tsx, AgendaBuilder.tsx, ChartPaste.tsx, editing.css. Mövcud App, DataEditor, SourceInspector, QualityPanel, ProjectLibrary, authoring və main yeniləndi. Yeni runtime asılılığı əlavə edilmədi.

npm run check indi check-editing.mjs daxil olmaqla altı sınaq skriptini işlədir; hamısı keçdi. Yeni sınaqlar AZ böyük/kiçik hərflərini (I/İ/ı/i və birləşən nöqtə), söz sərhədlərini, literal əvəzləmə mətnini, mənbəli sahələrdə review, atomik rədd, immutable nəticə, toplu undo/redo, planın seçimi/ardıcıllığı/ölçüsü/yeri/limiti, diaqramın parser/önizləmə/tətbiq/undo və metadata qorunmasını, dırnaqlı TSV, literal formula mətni, Blob/anchor yükləmələri və URL təmizlənməsi, PDF mətn çıxarışı, backup bərpası və filtr birləşmələrini yoxlayır.

npm run build keçdi. npm audit --omit=dev: 0 məlum zəiflik. Yerli server 127.0.0.1:5174-də HTTP 200 verir. PDF modulunun 542 kB ölçü xəbərdarlığı qalır, bu yığım xətası deyil. Brauzerdə vizual yoxlama origin icazə blokuna görə edilmədi. Mənbə/dist ehtiyat nüsxəsi Desktopda Teqdim-backup-2026-10-30-stage7.zip kimi saxlanır; brauzerdəki localStorage təqdimatları bu arxivə daxil deyil.
