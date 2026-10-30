# Təqdim — ikinci təkmilləşdirmə axını

Tarix: 2026-10-29. Təxminən 20 dəqiqəlik iş bölgüsü. Vaxtlar planlaşdırma üçündür, icra müddətinin ölçüsü kimi təqdim edilmir.

| Vaxt | Məqsəd | Tamamlanan nəticə |
| --- | --- | --- |
| 0–4 dəq | Redaktə və məlumat itkisi risklərini yoxlamaq | Redaktə tarixçəsi, başqa brauzerə köçürmə və çoxsaylı təqdimatlar arasında axtarış əsas prioritet seçildi. |
| 4–11 dəq | Redaktoru rahatlaşdırmaq | 60 addımlıq geri al/yenidən et; 750 ms ərzində ardıcıl yazı bir tarixçə qrupu kimi; dizayn, mətn, düzülüş, qeydlər və slayd əməliyyatları üçün tarixçə; seçilən slaydı əlavə et/köçür/çıxar; klaviatura qısayolları. |
| 11–16 dəq | Təqdimat kitabxanası və daşınma | Azərbaycan dilinə uyğun axtarış/sıralama, təqdimatın ayrıca surəti, .teqdim.json ehtiyat nüsxəsi və yeni nüsxə kimi idxal; fayl ölçüsü və quruluş yoxlamaları. |
| 16–20 dəq | Xəta halları və sənədləşmə | Undo/redo, silməni bərpa, layihələr arasında tarixçə sərhədi, mətn yazarkən qısayolların işə düşməməsi, modal fokus dövrü, axtarış, idxal, yanlış fayl və yaddaş xətası sınaqları. |

## Hazır imkanların sərhədləri

- Geri al/yenidən et cari sessiyanın slaydları və slayd dizaynına aiddir. Mövzu formunun sahələri, PDF əlavə etmə və layihənin silinməsi bu tarixçəyə daxil deyil. Yeni plan, layihə açma və yeni təqdimat tarixçəni sıfırlayır.
- Mətn sahəsində Ctrl/⌘+Z yazının öz yerli geri alma davranışına buraxılır. Redaktor qısayolları input, textarea, select və contenteditable sahələrdə slayd çıxarmır və dəyişdirmir. Ctrl/⌘+S təqdimatı saxlaya bilər.
- Ehtiyat nüsxə JSON məlumat faylıdır; icra edilən kod və ya PowerPoint faylı deyil. Orijinal PDF deyil, çıxarılmış mətnlər və səhifə istinadları saxlanır. İxracın ən böyük ölçüsü 2 MB-dir.
- İdxal əvvəlki layihəni əvəz etmir. Yeni layihə ID-si ilə siyahıya əlavə edilir. Yaddaşa yazılmasa, uğurlu idxal kimi göstərilmir və əvvəlki siyahı dəyişmir.
- Açıq pəncərələr Tab fokusunu içəridə saxlayır, Escape ilə bağlanır. Uzun bələdçi kiçik ekranda sürüşdürülə bilər.
- Yerli serverin 5174 əvəzinə başqa porta səssiz keçməməsi üçün `--strictPort` əlavə edilib.

## Yoxlama nəticələri

- `npm run check`: model/PPTX, PDF parser və şəbəkəsiz jsdom komponent sınaqları keçdi.
- `npm run build`: TypeScript və production yığımı keçdi.
- Həqiqi brauzer və PowerPoint vizual render yoxlaması aparılmayıb; əvvəlki brauzer icazə məhdudiyyəti aşılmayıb.

Növbəti mərhələlər: ROADMAP.md.
