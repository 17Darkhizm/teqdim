# Backend auditi və slayd köməkçisi (2026-10-31)

İstifadəçi Təqdimə yeni imkanlar əlavə etməyi və bütün backend-i yoxlamağı istədi. Plan və nəticə:

| # | İş | Qəbul meyarı | Nəticə |
| --- | --- | --- | --- |
| 1 | DeepSeek müqaviləsi | Model adları, `thinking`, JSON rejimi, maksimum cavab rəsmi sənədlə uyğundur | Uyğundur; `max_tokens` 6000-dən slayd sayına görə 3300–11400-ə qaldırıldı (12 slaydda kəsilmə riski) |
| 2 | Cavabın yoxlanması | Kiçik kənaraçıxma pullu cavabı atmır, uydurma istinad rədd edilir | Say ±1, uzun mətn, istinadsız slayd → xəbərdarlıq; naməlum düzülüş → mətn; təkrar istinad birləşir |
| 3 | Xəta xəritəsi | 400/422, content_filter, resurs çatışmazlığı ayrıca izah olunur | `AI_REQUEST_REJECTED`, `AI_FILTERED`, `AI_UNAVAILABLE` |
| 4 | Məxfilik | Fayl adları və şəxsi sahələr provayderə getmir | Yalnız id və səhifə mətni gedir; ad yerli sənəddən bərpa olunur |
| 5 | Giriş təmizliyi | Sənəddəki idarəetmə simvolları sorğunu pozmur | Müştəri boşluqla əvəz edir; server mesajı «uzun» və «simvol» səbəbini ayırır |
| 6 | Loq və konfiqurasiya | Ləğv edilmiş sorğu düzgün qeyd olunur; config xətası dəyişəni adlandırır | `REQUEST_CANCELLED`, status `null`; daxili xətanın yalnız növü |
| 7 | Mənbələr slaydı | AI planı da «İstifadə olunan materiallar» ilə bitir | `sourcesSlides()` ortaq funksiya oldu |
| 8 | Slayd köməkçisi | Qısalt / Aydın yaz / Çıxış qeydi yaz; önizləmə, tətbiq, bir addımda geri alma, köhnə təklifin atılması | `/api/slide`, `SlideAssist.tsx`, «Qısalt»da çıxarılan təfərrüat qeydlərə köçür |
| 9 | Vizual yoxlama | Açıq/qaranlıq, masaüstü/mobil | Chrome headless + saxta API ilə ekran görüntüləri; checkbox və mobil daşma düzəldildi |

Vizual yoxlamada tapılan əvvəlki səhvlər: qlobal `input { width: 100% }` bütün checkbox-ları uzadırdı; telefonda addım adları 36 px, miniatürdəki `.sr-only` mətn isə 86 px üfüqi daşma yaradırdı. Hər üçü düzəldildi, 390 px-də daşma 0-dır.

Real DeepSeek açarı ilə sınaq aparılmayıb. Təfərrüat CONTEXT.md-nin son bölməsindədir.
