# Təqdim — dördüncü 30 dəqiqəlik iş axını

Tarix: 2026-10-29. İstifadəçinin göstərişinə uyğun olaraq yalnız texniki sınaqlar aparılır; brauzer yoxlaması yoxdur.

| Vaxt | İş | Qəbul meyarı |
| --- | --- | --- |
| 0–5 dəq | Məlumat modeli və ixracı təhlil et | Köhnə layihələr açılır; yeni cədvəl/diaqram məlumatları ayrıca saxlanır. |
| 5–17 dəq | Cədvəl və diaqram redaktoru | Sətir/sütunlar, etiket və rəqəmlər istifadəçi tərəfindən daxil edilir; uydurma statistika yoxdur. |
| 17–25 dəq | PowerPoint və saxlama | Cədvəl native cədvəl, diaqram native chart və redaktə edilən rəqəmlərlə ixrac edilir. Qaralama, undo və backup məlumatları qoruyur. |
| 25–30 dəq | Yoxlamalar | Boş/yanlış rəqəmlər, mənfi/sıfır qiymətlər, ölçü limitləri, data roundtrip, yeni və köhnə layihələr, PPTX XML və daxili data faylı yoxlanır. |

Bu mərhələ AI bağlantısı yaratmır. İstifadəçinin verdiyi rəqəmləri təsdiqlənmiş fakt kimi göstərmir. ## Tamamlananlar

- Yeni Cədvəl və Diaqram düzülüşləri: ümumilikdə yeddi slayd düzülüşü.
- Cədvəl redaktoru: 2–5 sütun, 1–8 sətir, əlavə/çıxarma, Tab ilə ayrılmış cədvəl mətnini tətbiq etmə. İlk sətir başlıq kimi götürülür. Xətada hazırkı cədvəl əvəz olunmur.
- Diaqram redaktoru: sütun və xətt növü, göstəricinin adı, ölçü vahidi, 2–8 etiket/qiymət. Vergül/nöqtə, mənfi və sıfır qiymətlər işləyir. Boş rəqəm sıfıra çevrilmir. Rəqəmlər ±1 milyard daxilində, ən çox 6 onluq rəqəmlə qəbul edilir. E, minlik ayırıcı və formul sintaksisi qəbul edilmir.
- Önizləmə HTML cədvəl və SVG diaqramdan istifadə edir. Etiketin tam mətni əlçatan təsvirə daxil edilir. Diaqram oxu sıfırı daxil edir; bütün qiymətlər sıfır olduqda təhlükəsiz 0–1 oxu qurulur.
- PowerPoint-də native cədvəl və native bar/line chart, chart daxilində redaktə edilən XLSX məlumatları saxlanır. Hüceyrələr və rəqəmlər şəkil kimi ixrac edilmir. İstifadəçinin yazdığı kateqoriya mətnləri worksheet formulasına çevrilmir.
- Qaralama, undo/redo, slayd surəti, dizayn dəyişməsi və ehtiyat nüsxə cədvəl/diaqram məlumatlarını saxlayır. Başqa düzülüşə keçəndə data yadda qalır, yenidən seçmək mümkündür.
- Yeni ehtiyat nüsxə formatı v2-dir; əvvəlki v1 faylları da oxunur. Tamamlanmamış cədvəl/diaqram qaralamada və ehtiyat nüsxədə qala bilər; PowerPoint ixracında hansı slaydda nəyi tamamlamaq lazım olduğu göstərilir.

## Oxunaqlılıq limitləri

Xana 80 simvola qədər redaktə və yadda saxlanır. Cədvəl ölçüsünə görə ixrac üçün 28/40/60 simvolluq daha qısa mətn tələb oluna bilər. Bu limit xəta mesajında göstərilir; mətn səssizcə kəsilmir. Cədvəl/diaqram açıqlaması üçün 160 simvol tövsiyə olunur. Bu slaydlar avtomatik bölünmür ki, rəqəmlər təsadüfən təkrarlanmasın.

Faiz vahidi ayrıca yazıdır: rəqəm avtomatik 100-ə vurulmur. Xətt diaqramı etiketləri yazılan ardıcıllıqla birləşdirir; tarixləri özü sıralamır.

## Yoxlamalar

npm run check və npm run build keçdi. npm audit --omit=dev məlum zəiflik tapmadı. Yeni check-data.mjs yeddi dizaynda cədvəli və hər iki chart növünü, OOXML və XLSX quruluşunu, rəqəmlərin qorunmasını, formula sintaksisinin mətn kimi saxlanmasını və 8×5 maksimum cədvəlin PPTX həndəsəsini yoxlayır. Komponent sınaqları redaktə, Tab mətni, geri al/yenidən et, mənfi/sıfır/boş qiymət, bərpa və v1/v2 ehtiyat nüsxəni əhatə edir.

Həqiqi brauzer, PDF və PowerPoint vizual renderi yoxlanmayıb. Bu, istifadəçinin texniki sınaqlarla davam seçiminə uyğundur.
