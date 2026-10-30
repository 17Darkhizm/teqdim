# Təqdim — səkkizinci mərhələ: dizayn studiyası

Tarix: 2026-10-30. Yerli layihə, canlıya yayımlama yoxdur.

## 20 iş və qəbul meyarı

- [x] 1. Xəzər dizaynı: dəniz palitrası, axıcı xətt/həlqə kompozisiyası, native PPTX formaları.
- [x] 2. İrs dizaynı: isti kağız, tünd albalı mətni, iç çərçivə və həndəsi künclər, native PPTX.
- [x] 3. Prizma dizaynı: açıq fon, mavi aksent, ofset həndəsi bloklar, native PPTX.
- [x] 4. Dizayn sayını və bütün seçim siyahılarını vahid registrdən qurmaq: 10 dizayn.
- [x] 5. Ayrı dizayn qalereyası pəncərəsi və tünd/açıq interfeys stilləri.
- [x] 6. Qalereyada kateqoriya üzrə süzmək.
- [x] 7. Dizayn adı və təsviri üzrə Azərbaycan dilində axtarış.
- [x] 8. Slayd palitrasını açıq/tünd fonda süzmək və filtrləri sıfırlamaq.
- [x] 9. Qalereya kartlarında faktiki slayd məzmunu ilə önizləmə.
- [x] 10. Seçilmiş dizaynı yalnız Tətbiq et ilə bütün təqdimata keçirmək; undo/redo.
- [x] 11. Önizləməni seçilmiş slayd və ilk slayd arasında dəyişmək.
- [x] 12. Başlıq yazı tipi: dizaynın seçimi, sadə Arial və klassik Georgia; önizləmə və PPTX.
- [x] 13. Mətn ölçüsü: adi/iri; mətn düzülüşlərində tətbiq və uzun mətn üçün ayrıca xəbərdarlıq.
- [x] 14. Dekor: tam/sadə; önizləmə və PowerPoint-də dekorativ formaları azaltmaq.
- [x] 15. Slayd nömrələrini göstərmək/gizlətmək; footer və dekorativ səhifə nömrəsi uyğunlaşdırılır.
- [x] 16. Üslub ayarlarını qaralama, kitabxana, tarixçə və v4 backup-da saxlamaq; v1–v3 bərpası qalır.
- [x] 17. Üslub ayarlarını bir addımda dizaynın ilkin vəziyyətinə qaytarmaq və undo etmək.
- [x] 18. Dizayn seçimlərində klaviatura/fokus/Escape və aria-pressed vəziyyəti.
- [x] 19. Qalereyada faktiki rəng palitrası və hesablanmış mətn/fon kontrastı göstəricisi.
- [x] 20. Yeni dizaynların cədvəl, diaqram, müqayisə, mərhələ və şəkil slaydlarına eyni palitranı ötürməsi.

## Yoxlama sərhədi

Yeni dizayn və parametrlər üçün model, jsdom komponent, backup və PowerPoint XML sınaqları; bütün check/build. Dizayn CSS ilə qurulur, yeni raster şəkil və ya xarici şrift asılılığı əlavə edilmir. Mövcud browser origin blokuna görə həqiqi brauzer/PowerPoint renderi təsdiqlənməyəcək.


## Nəticə

20/20 tamamlandı. Xəzər, İrs və Prizma ilə dizayn sayı 10 oldu. design.ts, DesignGallery.tsx, DesignControls.tsx və design-studio.css əlavə edildi. model/storage/backup və bütün SlideView çağırışları üslub ayarlarına uyğunlaşdırıldı. Yeni runtime paketi əlavə edilmədi; həndəsə CSS və native PowerPoint formalarıdır.

npm run check artıq yeddi skript işlədir; hamısı keçdi. Yeni check-design-studio.mjs palitra və kontrast, qalereya filtrləri/axtarış/seçilmiş-ilk önizləmə/imtina/tətbiq/undo/Tab/Escape/fokus, yazı tipi/ölçü/dekor/nömrə/reset/undo/qaralama/kitabxana/məşq/çap, v4 backup və v1–v3 köhnə faylları yoxlayır. Hər 10 dizaynda 10 düzülüş tam və sadə rejimdə (200 slayd) PPTX ZIP/XML, şrift, font ölçüsü, səhifə nömrəsi, native formalar, cədvəl, chart və embedded şəkil üzrə yoxlanıb. Köhnə dizayn/PDF/şəkil/redaktə sınaqları da keçdi.

npm run build keçdi. Production audit 0 məlum zəiflik, yerli HTTP 200. PDF modulunun 542 kB Vite xəbərdarlığı qalır. Bunlar texniki sınaqlardır, həqiqi brauzer/PowerPoint renderi deyil. Origin blokuna qarşı alternativ giriş istifadə edilməyib. Desktopda Teqdim-backup-2026-10-30-stage8.zip mənbə/dist arxivi saxlanır; istifadəçinin browser localStorage layihələri daxil deyil.
