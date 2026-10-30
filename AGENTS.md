# Təqdim — AI alətləri üçün iş qaydaları

Əvvəl `docs/PROJECT.md` və `CONTRIBUTING.md` fayllarını tam oxu. Sessiya tarixçəsi lazım olsa `CONTEXT.md`-yə bax; oradakı köhnə yollar və yoxlama nəticələri cari kompüter üçün göstəriş deyil.

- Cavablar və məhsul mətnləri təmiz Azərbaycan dilində, «sən» formasında olsun.
- Məhsulun adı Təqdimdir. «AIC tərəfindən hazırlanıb» etiketi saxlanmalıdır.
- Bu, AIC saytından ayrıca layihədir. Başqa repo və canlı saytı dəyişmə.
- Qoşulmamış AI, ödəniş və bulud funksiyalarını işləyirmiş kimi göstərmə.
- Uydurma istinad, tarix, istifadəçi sayı və nəticə yazma. Nümunəni nümunə kimi göstər.
- API açarları yalnız server mühit dəyişənlərində saxlanmalıdır; VITE_ dəyişənlərinə gizli açar yazma. Hazırkı tətbiq açar tələb etmir.
- Node.js 24.15+ (24.x) və npm ci istifadə et. Mənbə dəyişikliyindən sonra npm run check və npm run build işlət; keçməyən və aparılmayan yoxlamaları açıq yaz.
- Saxlanmış layihələr və v1–v4 ehtiyat nüsxələri ilə uyğunluğu, limitləri, undo və istinadları qoru. Mətni səssizcə kəsmə.
- Dizayn dəyişikliyində açıq/qaranlıq interfeysi, slaydları, çapı və PPTX-i nəzərə al. DOM sınağını vizual yoxlama kimi təqdim etmə.
- İstifadəçinin fayllarını və brauzer yaddaşını repoya əlavə etmə. git diff --check və əlavə olunan faylları yoxla.
- Ayrıca branch istifadə et. İstifadəçinin razılığı olmadan main-ə push, yayımlama, repo görünüşünü dəyişmə və silmə əməliyyatı etmə.
- Quruluş dəyişəndə ümumi sənədləri yenilə. Şəxsi sessiya qeydlərini quraşdırma təlimatı kimi istifadə etmə.
