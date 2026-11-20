# Təqdim — gecə təkmilləşdirməsi (2026-11-21)

## İş axını
1. **8 Grok** (vebdə araşdırma): rəqiblər, Azərbaycan universitetlərinin tələbləri, Sİ generasiyası, dizayn, ilk istifadə, yayılma, PPTX/PDF uyğunluğu, tənqidçi.
2. **8 Codex** (kod auditi, yalnız oxu): UX axını, AI serveri, ixrac, arxitektura, əlçatanlıq, təhlükəsizlik, dil, sınaqlar.
3. 37 namizəd təklif; 2-ci dövrədə agentlər hər birinə 0–5 bal verdi (14 etibarlı səs).
4. Seçilənləri 6 Codex ayrı worktree-lərdə tətbiq etdi; Claude birləşdirdi, konfliktləri həll etdi, yoxladı.

Hesabatlar repoya daxil deyil (`Desktop\Teqdim-agentler\`).

## Edilənlər
- **İlk istifadə:** nümunə bir kliklə redaktorda açılır (saxlanmamış iş varsa təsdiq); adi plan birbaşa redaktoru açır, plan ekranında «Redaktoru aç»; material yoxdursa əsas düymə «Boş təqdimat aç»; boş layihədə qaralama statusu gizlidir; önizləmədə «Nümunə üz qabığı», fənn uydurulmur.
- **İşin qorunması:** yeni planla əvəz bir addımda geri alınır; son görünən slayd silinmir (düymə və Delete); fənn və «Hazırlayan» saxlanmamış iş sayılır.
- **İxrac:** PPTX-də çox məqamlı slaydda mənfi/kiçik qutu hündürlüyü yoxdur, Son baxış xəbərdarlıq edir; gizli ilk slaydda çap və PPTX eyni düzülüşü verir; çap 13,333×7,5 düym (16:9), kənarsız; PowerPoint xətasında «Slayda keç».
- **Son baxış:** «Sığmayan mətn slaydlarını böl» (bir geri-alma addımı, struktur slaydlarına toxunmur).
- **AI:** «Qısalt»da `movedToNotes` məcburi, ilkin mətn qeydlərdə qalır; sənəd olanda istinadsız slayd nömrələri xəbərdarlıqda; `AI_OUTPUT_LIMIT`; `/api/health` üçün 5 s həddi.
- **Əlçatanlıq:** Atelye/Şəfəq kiçik mətn kontrastı ≥4,5:1 (ekran və PPTX); forma sərhədləri ≥3:1; mərhələ keçidində fokus başlığa, `aria-current`, slayd düyməsinin adında başlıq; boşluqlu sahə üçün xəta və fokus.
- **Dil:** interfeys mətnləri redaktə olundu (sil/çıxar ardıcıllığı, DeepSeek razılıq mətni və s.).
- **Təhlükəsizlik:** Vite 6.4.6 (GHSA-p4f5-76q4-ffq7); `public/_headers` (nosniff, DENY, referrer, permissions).
- **Yayım:** statik versiya https://teqdim.pages.dev (Cloudflare Pages, layihə `teqdim`, `dist/` əl ilə yüklənir). AI serveri orada yoxdur; panel «Yerli AI serveri işləmir» göstərir.

## Yoxlamalar
`npx tsc -b`, `npm run check` (14 skript), `npm run build`, `npm audit --omit=dev` (0) — Node 26.13.0-da keçdi; Node 24 ilə yoxlanmayıb. Real brauzerdə (Chromium): nümunə axını, canlı saytın açılması, AI panelinin vəziyyəti. PowerPoint/Keynote-da vizual baxış aparılmayıb.

## Seçilməyənlər / sonraya
Natiq ekranı, Keynote apostrof fəndi, React.lazy, daimi kredit sətri, performans memo-ları (çoxluq rədd etdi). Orta bal: Noto Sans şrifti (Ə hərfi), sitat yoxlaması (quote), «Buraxılış işi» növü, şablon kimi endirmə, ilk ekrandan 10 dizayn kartının çıxarılması, iki vərəq qoruması. Canlı saytda AI panelinin lokal server göstərişi (Baslat.cmd) statik sayt üçün uyğunlaşdırılmalıdır.
