# Təqdim

Azərbaycan dilində təqdimat hazırlamaq üçün React + TypeScript tətbiqi. **Mövzunu yaz. Fikrini təqdim et.** AIC tərəfindən hazırlanıb.

Öz mətnini və PDF materiallarını slaydlara çevir, redaktə et, dizayn seç və PowerPoint kimi yüklə. Layihəni Codex, Claude Code və ya Cursor ilə inkişaf etdirə bilərsən.

> Tətbiqdə AI bağlantısı, hesab, ödəniş və bulud yaddaşı yoxdur. Mətn yerli alqoritmlə bölünür. AI kod aləti ilə layihəni dəyişdirmək tətbiqdə AI məzmun yaratmaqdan ayrı imkandır.

## Başlamaq

Git, **Node.js 24.15 və ya daha yeni 24.x** və npm lazımdır. Windows, macOS və Linux terminalında:

```sh
git clone https://github.com/17Darkhizm/teqdim.git
cd teqdim
npm ci
npm run dev
```

[http://127.0.0.1:5174/](http://127.0.0.1:5174/) ünvanını aç. Terminal açıq qalsın; dayandırmaq üçün Ctrl+C bas. Windows-da asılılıqları quraşdırdıqdan sonra `Baslat.cmd` də işləyir. API açarı və `.env` tələb olunmur.

Repo gizli olduğu müddətdə klonlamaq üçün giriş icazəsi lazımdır. Açıq edildikdən sonra hər kəs klonlaya bilər. ZIP endirirsənsə, arxivi çıxar və terminalı `package.json` olan qovluqda aç.

## Öz AI kod alətinlə işləmək

| Alət | Başlama qaydası |
| --- | --- |
| Codex | Qovluğu layihə kimi aç; kökdəki `AGENTS.md` qaydalarını oxut. |
| Claude Code | Həmin qovluqda sessiya başlat; `CLAUDE.md` ümumi qaydalara yönəldir. |
| Cursor | Qovluğu aç; `.cursor/rules/project.mdc` ümumi qaydalara yönəldir. |
| Başqa alət | `AGENTS.md`, `docs/PROJECT.md` və `CONTRIBUTING.md` fayllarını kontekstə əlavə et. |

İlk tapşırıq nümunəsi:

```text
AGENTS.md və docs/PROJECT.md-ni tam oxu. Əvvəl layihənin necə işlədiyini
qısa izah et. Sonra [istədiyim dəyişiklik] üzərində işlə. Azərbaycan
dilini, saxlanmış layihələrlə uyğunluğu və AIC etiketini qoru.
Uyğun yoxlamaları və npm run build əmrini işlət. Nəticəni və yoxlaya
bilmədiyin məqamları yaz. Özbaşına yayımlama.
```

AI alətlərinin öz quraşdırılması və hesabı ayrıdır. Tətbiqin yerli saxlaması həmin alətin məlumat qaydalarını müəyyən etmir; şəxsi materiallarını paylaşarkən bunu nəzərə al.

## İmkanlar

- Mətn və üçədək PDF-dən plan, səhifə istinadları və çıxış qeydləri.
- 10 dizayn, 10 düzülüş; cədvəl, diaqram, müqayisə, mərhələlər və şəxsi şəkil.
- Əlavə etmə, bölmə, surət, sıralama, gizlətmə, geri alma və toplu mətn əvəzləmə.
- Dizayn qalereyası, şrift/ölçü/dekor ayarları, açıq və qaranlıq interfeys.
- Təqdimat və məşq rejimi, vaxtölçən və klaviatura idarələri.
- Yerli qaralama, kitabxana və `.teqdim.json` ehtiyat nüsxəsi.
- Redaktə edilən PowerPoint, Markdown/TXT/TSV və brauzer çapı ilə PDF.

## Əmrlər

```sh
npm run dev      # Yerli inkişaf serveri, 5174 portu
npm run check    # Bütün 10 yoxlama skripti
npm run build    # TypeScript və dist/ yığımı
npm run preview  # Hazır yığımı yerli açmaq
```

`npm ci` lock faylındakı asılılıqları quraşdırır. Preview üçün əvvəl build işlət və həmin portdakı inkişaf serverini dayandır. Port məşğuldursa Vite başqa porta səssiz keçmir. Node versiyasını `node --version` ilə yoxla. Native canvas quraşdırılması alınmasa optional asılılıqları buraxmadan yenidən `npm ci` işlət.

Yoxlamalar `.checks/` altında müvəqqəti fayllar yaradır. jsdom və PPTX XML sınaqları brauzer, PowerPoint və çap PDF-də vizual baxışı əvəz etmir. Yığımda PDF modulunun ölçü xəbərdarlığı qala bilər.

## Məlumat və məhdudiyyətlər

Təqdimatlar həmin brauzer və ünvanın localStorage yaddaşındadır. Brauzer məlumatlarını silməzdən və ünvanı dəyişməzdən əvvəl `.teqdim.json` çıxar. Git klonu istifadəçinin təqdimatlarını daşımır. Ehtiyat nüsxədə PDF-dən çıxarılmış mətnlər və uyğunlaşdırılmış şəkillər ola bilər; orijinal PDF daxil deyil.

PDF brauzerdə emal edilir: ən çox 3 fayl, hərəsi 20 MB, fayl üzrə 50 seçilmiş fiziki səhifə/60 000 simvol, ümumilikdə 100 000 simvol. OCR və parollu PDF dəstəyi yoxdur. Ən çox 80 slayd və 2 MB ehtiyat nüsxəsi qəbul olunur. Faktlar avtomatik təsdiqlənmir. PowerPoint və brauzer görünüşündə fərqlər ola bilər. Material serverə göndərilmir; Google Fonts üçün şəbəkə sorğusu gedir, alınmasa sistem şrifti işləyir.

## Layihəyə qoşulmaq

[Layihə xəritəsi](docs/PROJECT.md) · [Töhfə qaydaları](CONTRIBUTING.md) · [İnkişaf planı](ROADMAP.md) · [AI iş qaydaları](AGENTS.md)

Kod üçün MIT lisenziyası [LICENSE](LICENSE) faylındadır. AIC/Təqdim ad və loqoları brend elementləridir; kod lisenziyası rəsmi tərəfdaşlıq və ya brend adından çıxış etmək hüququ vermir. Üçüncü tərəf paketləri öz lisenziyaları ilə qalır.
