# Təqdim — altıncı inkişaf mərhələsi

Tarix: 2026-10-30. Bütün işlər yerli layihə üçündür; yayımlama yoxdur.

## 20 iş və qəbul meyarı

- [x] 1. Slayd başlığı, mətni, struktur məlumatı və qeydləri üzrə Azərbaycan dilində axtarış.
- [x] 2. Slayd siyahısını düzülüşə görə süzmək.
- [x] 3. Yalnız keyfiyyət problemi olan slaydları göstərmək.
- [x] 4. Görünən/ümumi slayd sayını və filtrləri sıfırlama idarəsini göstərmək.
- [x] 5. Nömrə yazaraq slayda birbaşa keçmək; yanlış nömrədə seçim qorunur.
- [x] 6. Redaktorda Home/End ilə ilk/son slayda keçmək; mətn sahələrinə müdaxilə etməmək.
- [x] 7. Təqdimat və məşqdə Home/End, PageUp/PageDown keçidləri.
- [x] 8. Seçilən slaydın söz sayını və təxmini oxuma müddətini göstərmək.
- [x] 9. Çıxış qeydləri üçün 8000 simvol sayğacı.
- [x] 10. Məşq otağında növbəti slaydın başlığını göstərmək.
- [x] 11. Hədəf vaxtı slaydların söz çəkisinə görə bölmək və məşqdə göstərmək.
- [x] 12. Bütün planı struktur məlumatı və mənbələri ilə Markdown kimi yükləmək.
- [x] 13. Çıxış qeydlərini ayrıca mətn faylı kimi yükləmək.
- [x] 14. Seçilən slaydın tam mətnini ayrıca yükləmək.
- [x] 15. # və ## başlıqlı mətndən slayd planı oxumaq; ölçü və quruluş xətalarını açıq bildirmək.
- [x] 16. Plan idxalı üçün dəyişiklikdən əvvəl baxış və xəta göstərən pəncərə.
- [x] 17. İdxal slaydlarını mövcud planın sonuna əlavə etmək; 80 limitini qorumaq və bir addımda geri almaq.
- [x] 18. Pəncərə bağlananda klaviatura fokusunu onu açan düyməyə qaytarmaq.
- [x] 19. Azaldılmış hərəkət seçiminə uyğun animasiyaları dayandırmaq; yeni idarələrin açıq/tünd və dar ekran stilləri.
- [x] 20. Slayd siyahısında aria-current, başlıq və problem işarəsi ilə seçimi aydınlaşdırmaq.

## Yoxlama

Yeni köməkçi funksiyalar və istifadəçi axınları avtomatik sınaqlarla yoxlanacaq. npm run check və npm run build tələb olunur. Brauzer origin icazəsi blokludur; brauzerə alternativ yolla daxil olmaq və vizual yoxlama iddiası yoxdur. real AI, hesab və ödəniş bu mərhələyə daxil deyil.


## Nəticə

20 bənd tamamlandı. Əsas yeni fayllar: src/authoring.ts, src/SlideNavigator.tsx, src/OutlineImport.tsx, src/authoring.css. App, PracticeMode və useDialogKeyboard yeniləndi. Paket asılılıqları dəyişməyib.

npm run check və npm run build keçdi. check-workspace yeni helper/komponent axınlarını, üç mətn yükləməsinin formatını və URL təmizlənməsini, Azərbaycan dilində axtarışı, filtr və sıfırlamanı, yanlış/düzgün slayd nömrəsini, Home/End/PageUp/PageDown, yazı sahəsində qısayola müdaxilə edilməməsini, modal fokusunun bərpasını, plan ölçü/struktur limitlərini, önizləmə/əlavə/undo/redo/qaralama/backup bərpasını və məşq vaxt bölgüsünü yoxlayır. Əvvəlki bütün PDF, şəkil, cədvəl, diaqram və PowerPoint sınaqları da keçdi.

npm audit --omit=dev: 0 məlum zəiflik. Server yenidən 127.0.0.1:5174-də başladı; HTTP 200 və authoring modulunda yeni parser təsdiqləndi. Ayrı PDF modulunun 542 kB Vite xəbərdarlığı qalır; build uğurludur. Açıq/tünd və dar ekran CSS qaydaları əlavə edilib, həqiqi brauzerdə görünüş təsdiqlənməyib. Bu mərhələdə origin təhlükəsizlik blokunu keçmək üçün başqa vasitə işlədilməyib.
