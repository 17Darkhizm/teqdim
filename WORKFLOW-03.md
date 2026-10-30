# Təqdim — 30 dəqiqəlik üçüncü iş axını

Tarix: 2026-10-29. Bu mərhələ məzmunun hazırlanmasını, akademik məlumatları və mənbə yoxlamasını rahatlaşdırır. Vaxtlar planlaşdırma təxminidir.

| Vaxt | İş | Qəbul meyarı |
| --- | --- | --- |
| 0–5 dəq | Mövcud axını və məlumat modelini yoxla | Köhnə qaralamalar və ehtiyat nüsxələr işləməyə davam edir. |
| 5–13 dəq | Təqdimat məqsədi, auditoriya və akademik məlumatlar | Məlumatlar qaralama, ehtiyat nüsxə, önizləmə və PowerPoint-də qorunur. Heç bir ad uydurulmur. |
| 13–22 dəq | Redaktorda mənbə materiallarını yoxlama | İstifadəçi PDF səhifəsinin çıxarılmış mətnini görə, axtara və faktiki mövcud səhifəni slayda bağlaya bilər. Qırılmış istinadlar görünür. |
| 22–27 dəq | Çıxışa hazırlıq və planı yenidən qurma qoruması | Məşq rejimi slayd, qeydlər və real vaxtölçən göstərir; yeni plan qurmaq köhnə redaktələri xəbərsiz əvəz etmir. |
| 27–30 dəq | Sınaqlar, yığım və davam qeydləri | İnteqrasiya, məlumatın saxlanması, mənbə yoxlaması, PPTX ixracı və xəta halları yoxlanır. |

Bu mərhələ serverdə AI bağlantısı və ya ödəniş sistemi əlavə etmir. Lokal funksiya AI nəticəsi kimi təqdim edilmir. Həqiqi brauzer vizual yoxlaması üçün əvvəlki icazə məhdudiyyəti qüvvədədir.

## İcra nəticəsi

Planın bütün yerli tətbiq işləri tamamlanıb:

- Seminar/kurs işi/layihə növü, auditoriya, məqsəd, hədəf vaxt və akademik titul məlumatları əlavə edildi. Qaralama, layihə yaddaşı, JSON ehtiyat nüsxəsi və PowerPoint-də qorunur. Köhnə brief-siz layihələr də açılır.
- Növ seçimi giriş və yekun göstərişlərini tərtib edir; auditoriya və məqsəd cover çıxış qeydlərində göstərilir. Material avtomatik yenidən yazılmır, AI xülasəsi yaradılmır.
- Mənbə panelində fayl/səhifə mətninə baxış, axtarış, səhifə istinadını bağlama və çıxarma var. Mövcud olmayan və ya mətnsiz səhifə istinadları son baxışda işarələnir. Materialı olmayan köhnə istinad da çıxarıla bilər.
- Məşq otağında seçilən slayd, çıxış qeydi və həqiqi vaxtölçən var: başla, fasilə, sıfırla. Oxlarla slayd keçidi və Escape ilə bağlama işləyir. Bu ekran auditoriyaya göstərmək üçün deyil; ayrıca Təqdim et rejimi qalır.
- Cari slaydlar olduqda yeni plan üçün təsdiq tələb edilir. Ləğv və generasiya xətası slaydları əvəz etmir. İlk addımdan hazır slaydlara qayıtmaq mümkündür.
- npm run check, npm run build və npm audit --omit=dev keçdi. İstehsal asılılıqlarında məlum zəiflik tapılmadı.

## Yoxlama sərhədi

Funksional yoxlamalar şəbəkəsiz jsdom və PPTX ZIP/XML sınaqlarıdır. Mənbə bağlantıları, mətn və metadata qorunması, məşq vaxtölçəni, yeni planın qoruma axını və xəta halları yoxlanıb. Həqiqi brauzerdə vizual görünüş və PowerPoint/PDF renderi yoxlanmayıb. Brauzer alətinə yerli ünvan üçün icazə yenidən soruşulub; cavab olmadan giriş təkrar sınanmayıb.


Sonrakı seçim: istifadəçi brauzer sualına «Hələlik texniki sınaqlarla davam et» cavabını verdi. Sonrakı mərhələlərdə bu seçimə əməl edilir.
