# Təqdim — yeni slayd yaratma imkanları (30 dəqiqə)

Tarix: 2026-10-29. Yalnız texniki sınaqlar aparılır.

| Vaxt | İş | Nəticə meyarı |
| --- | --- | --- |
| 0–5 dəq | Yaratma axınını və məlumat modelini yoxla | Materialı olmayan istifadəçi də mövzu yazıb öz slaydlarını qura bilir. |
| 5–15 dəq | Hazır blok kitabxanası, müqayisə və mərhələlər | Bloklar hazır struktur verir, faktlar və tarixlər uydurulmur; bütün sahələr redaktə edilir. |
| 15–23 dəq | Şəxsi şəkillə izah slaydı | PNG/JPEG yerli oxunur, ölçüyə uyğunlaşdırılır, alt mətn və mənbə sətri saxlanır. |
| 23–30 dəq | PowerPoint, saxlama və sınaq | Native mətn/formalar, embedded şəkil, undo, backup və köhnə versiya uyğunluğu yoxlanır. |

Bu mərhələ AI yaratması və ya internetdən şəkil axtarışı əlavə etmir. İstifadəçinin öz materialını təqdimata çevirməsi üçün yeni alətlər qurulur.


## Tamamlanan nəticələr

- Material olmadan yaratma: mövzu yazılıb «Material olmadan özüm qurum» seçiləndə üz qabığı və yekun strukturu hazırlanır, blok kitabxanası açılır. Material və PDF formu məcburi deyil. Cari slayd varsa bu düymə onu əvəz etmir, redaktora qayıdır.
- 9 hazır struktur bloku: məqsəd/plan, problem/həll, iki yanaşma, yol xəritəsi, şəkilli izah, cədvəl, diaqram, əsas fikir, yekun/sual. Faktlar, rəqəmlər və tarixlər daxil edilmir; boş və ya göstəriş mətnləri istifadəçi tərəfindən tamamlanır.
- Üç yeni düzülüş: müqayisə, mərhələlər, şəkilli izah. Cəmi 10 düzülüş. Müqayisənin iki başlığı və izahı; 2–5 mərhələnin etiketi/başlığı/qısa izahı; şəkil, alt mətn və mənbə sətri redaktə edilir.
- Şəkillər: PNG/JPEG, giriş ən çox 5 MB və 20 milyon piksel; ən uzun tərəf ən çox 12 000 px. Brauzerdə maksimum 1280 px uzun tərəfə və 300 000 simvolluq data URI limitinə uyğunlaşdırılır. Layihə üzrə şəkil məlumatı cəmi 1 200 000 simvolla məhdudlaşdırılır. Orijinal fayl saxlanmır, serverə göndərilmir.
- PowerPoint: müqayisə və mərhələlər native mətn və vektor formaları ilə, şəkil embedded raster və alt mətnlə ixrac edilir. Şəkil bütöv yerləşdirilir, avtomatik kəsilmir.
- Undo/redo, qaralama və yeni v3 ehtiyat nüsxə bütün bu sahələri saxlayır. Əvvəlki v1/v2 faylları dəstəklənir. Düzülüş dəyişəndə istifadəçinin əvvəlki data sahələri yadda qalır. Şəkilli slaydın surəti yaddaş büdcəsini aşarsa aydın mesaj göstərilir.

## Yoxlamalar

`npm run check`, `npm run build` və `npm audit --omit=dev` keçdi. Yeni check-visuals.mjs real PNG/JPEG oxunuşu və ölçüləndirməsini yerli canvas adapteri ilə, sıx təsvirin yaddaşa uyğunlaşdırılmasını, yanlış başlıq/format rəddini, URL təmizlənməsini və yeddi dizaynda native müqayisə/mərhələ/embedded şəkil, alt mətn və mənbə sətrini yoxlayır. Komponent sınaqları material olmadan yaratma, blok əlavə etmə, redaktə, undo, şəkli çıxarıb bərpa etmə və v1/v2/v3 backup roundtrip hallarını əhatə edir.

İstifadəçinin seçiminə uyğun olaraq brauzer yoxlaması aparılmadı. Texniki sınaqlar vizual renderin yerini tutmur; uzun mətn və kiçik ekran görünüşü sonradan ayrıca yoxlanmalıdır.
