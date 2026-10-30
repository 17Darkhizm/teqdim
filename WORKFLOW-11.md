# Təqdim — on birinci mərhələ: 30 dəqiqəlik təkmilləşdirmə

Tarix: 2026-10-30. Yerli layihə, canlıya yayımlama yoxdur.

## İşlər və qəbul meyarları

- [x] 1. `Slide.hidden`: «Təqdimatda gizlət / göstər» düyməsi; slayd redaktorda qalır, siyahıda solğun və «Gizli» nişanlı, redaktorda izah sətri. Bir tarixçə addımı, undo/redo.
- [x] 2. Təqdimat və məşq yalnız görünən slaydları gəzir; nömrə, irəliləyiş və «N / M» görünən sıraya görədir. Gizli slayddan başlayanda növbəti görünən slayd açılır.
- [x] 3. PowerPoint və çap gizli slaydları buraxır; yarımçıq gizli slayd ixracı bloklamır; hamısı gizlidirsə aydın xəta.
- [x] 4. Son görünən slaydı gizlətmək olmur (xəta bildirişi).
- [x] 5. Son baxış: vaxt və söz sayı yalnız görünən slaydlara görə, «N slayd · M gizli».
- [x] 6. Saxlama: isProject boolean yoxlaması, backup yalnız `hidden: true`-nu yazır (v4 formatı dəyişmir, köhnə fayllar işləyir); Markdown/qeyd ixracında «(təqdimatda gizli)».
- [x] 7. Təqdimatda rəqəm + Enter ilə görünən sıra üzrə keçid, Backspace, səhv nömrədə xəta; bələdçi.
- [x] 8. Yeni check-stage11.mjs; bütün check və build.

## Nəticə

8/8 tamamlandı. `npm run check` (10 skript) və `npm run build` keçdi, production audit 0. Həqiqi brauzer renderi təsdiqlənməyib.
