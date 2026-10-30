# Təqdim — doqquzuncu mərhələ: 30 dəqiqəlik təkmilləşdirmə

Tarix: 2026-10-30. Yerli layihə, canlıya yayımlama yoxdur.

## İşlər və qəbul meyarları

- [x] 1. Görünən daşma: redaktordakı slayd həqiqi render ölçüsü ilə yoxlanır (başlıq, mətn, məqamlar, sütunlar). CSS-in kəsdiyi mətn üçün slaydın altında xəbərdarlıq və həll yolları görünür. Ölçü olmayan mühitdə (jsdom) yalançı xəbərdarlıq yoxdur.
- [x] 2. Təqdimat rejimi: tam ekran düyməsi və F qısayolu; bağlananda tam ekrandan çıxılır. Fullscreen API olmayan mühitdə düymə gizlənir.
- [x] 3. Təqdimat rejimi: irəliləyiş zolağı və slayda kliklə növbəti slayda keçid.
- [x] 4. Slayd siyahısında sürükləyib buraxmaqla sıralama; bir tarixçə addımı, undo/redo, seçim köçürülən slayda keçir.
- [x] 5. Klaviatura alternativi: Alt+↑/↓ seçilən slaydı yuxarı/aşağı köçürür (mətn sahələrində işləmir).
- [x] 6. Qısayollar bələdçisi: Ctrl+Y, Alt+↑/↓, təqdimatda PageUp/PageDown və F.
- [x] 7. Yeni check-stage9.mjs sınağı; bütün check və build.

## Yoxlama sərhədi

jsdom-da layout ölçüsü yoxdur: daşma məntiqi scrollHeight/clientHeight əvəzləməsi ilə sınanır. Həqiqi brauzer renderi təsdiqlənməyəcək.

## Nəticə

7/7 tamamlandı. `npm run check` (8 skript, yeni check-stage9.mjs daxil) və `npm run build` keçdi. Daşma yoxlaması yalnız redaktordakı əsas slaydda işləyir (miniatürlər ölçülmür); PowerPoint öz `fit: shrink` qaydası ilə qalır. Həqiqi brauzerdə tam ekran və sürükləmə vizual yoxlanmayıb.
