# Təqdim — təxminən 20 dəqiqəlik təkmilləşdirmə axını

Tarix: 2026-10-29. İstifadəçinin istəyi əsasında hazırlanıb və aşağıdakı işlər icra edilib. Vaxtlar iş bölgüsü üçün təxminidir.

| Vaxt | İş | Nəticə |
| --- | --- | --- |
| 0–3 dəq | Mövzu → PDF/material → plan → redaktor axınını təhlil et | Uzun mətnin slayda həddən çox yığılması və qaralamanın itməsi əsas maneələr kimi müəyyən edildi. |
| 3–9 dəq | Oxunaqlılıq və düzülüşlər | Mətn cümlə/söz sərhədlərindən bölünür. Slayd sayı materiala uyğun artırıla bilər. Üz qabığı, mətn, məqamlar, iki sütun və vurğu düzülüşləri var. Uzun slaydı sonradan bölmək və surətini yaratmaq mümkündür. |
| 9–15 dəq | Qaralama və son baxış | Avtomatik yerli qaralama, yenidən açılışda bərpa, saxlanmamış işi əvəz etməzdən əvvəl xəbərdarlıq, çıxış qeydləri, həcm/tamamlanma/istinad yoxlamaları və təxmini danışıq vaxtı. |
| 15–20 dəq | İxrac və yoxlama | Beş düzülüş PowerPoint-də redaktə edilən mətnlə saxlanır. Çıxış qeydləri və PDF istinadları ixrac edilir. Parser, PPTX və komponent inteqrasiya sınaqları əlavə edilib. |

## Qəbul meyarları

- Uzun material səssizcə kəsilmir. Hər yaradılan mətn slaydı ən çox 460 simvoldur; həddən böyük material üçün aydın xəta var (ən çox 80 slayd).
- Seçilən say istiqamətdir; dəqiq slayd sayı mətnin uzunluğundan asılıdır. Boş slaydlar yaradılmır.
- PDF-dən gələn mətnin səhifə istinadları plan qurularkən qorunur. Sonradan əl ilə dəyişdirilən və ya bölünən mətn üçün istinad yenidən yoxlanmalıdır.
- Düzülüş dəyişəndə mətn, qeydlər və mənbələr itmir. Bütün düzülüşlər PPTX-də də işləyir.
- Səhifə yenilənəndə son qaralama, seçilən slayd, düzülüş, mətn və çıxış qeydləri bərpa olunur. Yaddaş xətası istifadəçiyə göstərilir.
- Son baxış fakt yoxlaması və ya akademik rəy kimi təqdim edilmir. Danışıq vaxtı 110 söz/dəqiqə üzrə təxminidir.

## Yoxlama

`npm run check`: mətn bölgüsü, emoji qorunması, ölçü limitləri, mənbələr, yeddi dizayn və beş PPTX düzülüşü, çıxış qeydləri, PDF parseri, təcrid olunmuş DOM-da istifadəçi axını və qaralama bərpası.

`npm run build`: TypeScript və production yığımı.

Əvvəlki brauzer icazə məhdudiyyətinə görə həqiqi brauzerdə vizual yoxlama aparılmayıb. Komponent sınaqları şəbəkəyə çıxmayan təcrid olunmuş DOM-dadır. İxrac sınaqları faylın strukturunu və mətnini yoxlayır, PowerPoint-in vizual renderini yoxlamır.

## Sonrakı böyük mərhələ

Server üzərindən süni intellekt bağlantısı, mənbəyə əsaslanan məzmun hazırlama və istifadəçi hesabları ayrıca işdir. Bu mərhələdə uydurma AI nəticəsi və ya saxta mənbə əlavə edilməyib.
