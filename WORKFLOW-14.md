# Təqdim — müqayisə bloklarının daşma ölçüsü

Tarix: 2026-11-06. ROADMAP.md §3.3 üzrə bir konkret təkmilləşdirmə.

## Mövcud vəziyyət və seçim

Mərhələ 9-da `SlideView.clippedText` əsas mətn, başlıq və məqamların `scrollHeight/clientHeight` və `scrollWidth/clientWidth` fərqlərini yoxlayırdı. Render, ResizeObserver və ilkin şrift yüklənməsi ölçməni yeniləyir. Mərhələ 10-da 960 px enində gizli ölçmə qatı bütün slaydlara tətbiq olunub; nəticə siyahı, «Yoxlanmalı» filtri və Son baxışa ötürülür. Buna görə §3.3 sıfırdan yazılmadı.

Çatışmayan konkret hal: `visuals.css` müqayisə başlığında `max-height` və `overflow: hidden`, kartda isə ayrıca `overflow: hidden` tətbiq edir. Kəsilmə bu daxili sahələrdə baş verdikdə əsas başlıq/abzas və `.slide-copy` ölçüləri problemi göstərməyə bilərdi; mövcud seçicilər `h3` və kartı əhatə etmirdi.

## Edilən dəyişiklik

- `src/SlideView.tsx`: müqayisə başlığı, kartları və bütöv bloku ölçülən sahələrə əlavə edildi. Mövcud 2 px həddi və xəbərdarlıq kanalı saxlandı. Simvol sayına əsaslanan yeni qərar yoxdur.
- `scripts/check-overflow.mjs`: ayrıca geriləmə yoxlaması əlavə edildi; `package.json` daxilində `check` zəncirinə qoşuldu.
- `ROADMAP.md`: §3.3 üçün qısa yenilənmə; `docs/PROJECT.md`: yoxlama siyahısı 14 skriptə uyğunlaşdırıldı.

Skript ölçüsüz DOM, eyni sayda simvolun fərqli ölçüləri, uzun amma sığan Azərbaycan mətni, başlıq/kart/blok üçün üfüqi və şaquli daşma, 2 px həddi, dekorun nəzərə alınmaması, ResizeObserver ilə bildiriş, təkrar bildirişin qarşısının alınması və redaktədən sonra xəbərdarlığın silinməsini yoxlayır. Ölçmə slayd məlumatını dəyişmir.

## Sınaqlar və mühit

- `node --check scripts/check-overflow.mjs`: keçdi.
- `node scripts/check-overflow.mjs`: keçdi.
- `npx tsc -b`: keçdi.
- `npm run check`: bütün 14 skript keçdi.
- `git diff --check`: keçdi; yeni iki faylın boşluq yoxlamasında da xəta yoxdur. Yalnız LF/CRLF xəbərdarlıqları var.
- `npm run build`: Codex sandbox-unda esbuild qovluq icazəsi xətası verdi (`Cannot read directory "../..": Access is denied`). Claude sandbox-dan kənarda təkrarladı: `npx tsc -b`, `npm run check` (14 skript) və `npm run build` keçdi (yalnız PDF chunk ölçüsü xəbərdarlığı).
- Ölçülər jsdom-da əvəzlənib; bu, həqiqi brauzer və ya vizual yoxlama deyil. Açıq/qaranlıq rejim, mobil/masaüstü, çap/PDF və PowerPoint renderi bu turda vizual yoxlanmayıb. CSS və ixrac kodu dəyişməyib.

Sistem Node.js 26.13.0-dır; tələb olunan 24.15+ (24.x) ilə sınaq aparılmayıb. `npm ci` cəhdləri uğursuz oldu: ayrıca boş keşdə `ENOTCACHED`, şəbəkədə `EACCES`, sistem keşində `EPERM`. Bu cəhdlərdən sonra natamam qalan `node_modules`, repodakı `.checks/repo-readiness/node_modules` yerli nüsxəsindən bərpa edildi. Cari platformaya uyğun bütün lock paketlərinin mövcudluğu və versiyalarının cari `package-lock.json` ilə uyğunluğu ayrıca yoxlandı; çatışmayan və fərqli versiyalı paket tapılmadı. Bu bərpa uğurlu `npm ci` kimi təqdim edilmir. Yeni paket və lock dəyişikliyi yoxdur.

Yeni `codex/measured-overflow` branch-i yaratmaq `.git/refs/heads/...lock` yazma icazəsi olmadığı üçün alınmadı. Dəyişikliklər mövcud `codex/sade-is-axini` branch-inin işçi qovluğundadır. Commit, push və Git konfiqurasiyası dəyişikliyi edilmədi.

## Qalan işlər

- Node.js 24.x və icazələri uyğun mühitdə təmiz `npm ci`, yoxlamalar və production yığımını təkrarlamaq.
- Müqayisə daşmasını faktiki brauzerdə müxtəlif mətn/şrift/ölçü nümunələri ilə təsdiqləmək.
- Digər struktur bloklarının daxili kəsilməsini ayrıca qiymətləndirmək; mövcud simvol əsaslı məsləhətlər hələ saxlanır.
- Avtomatik yerləşdirmə və §3.4 üzrə brauzer/PDF/PPTX şriftləri və Azərbaycan hərflərinin yan-yana vizual yoxlanması. §3.3 bütövlükdə tamamlanmış sayılmır.
