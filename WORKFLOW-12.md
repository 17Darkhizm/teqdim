# Backend — təxminən 30 dəqiqəlik iş axını

Məqsəd: mövcud yerli redaktor üçün DeepSeek bağlantısını server tərəfdə qurmaq. API açarı olmadan real provayder sınağı keçirilmiş sayılmır.

| Vaxt bölgüsü | İş və qəbul meyarı |
| --- | --- |
| 0–5 dəq | Mövcud quruluşu və DeepSeek-in rəsmi API müqaviləsini yoxla; giriş/çıxış sxemini müəyyən et. |
| 5–12 dəq | Yerli HTTP API, konfiqurasiya, health, JSON giriş yoxlaması və Azərbaycan dilində xəta cavabları. |
| 12–20 dəq | DeepSeek JSON bağlantısı, vaxt və cavab həcmi limitləri, çıxış yoxlaması və həqiqi mənbələrə bağlanan istinadlar. |
| 20–26 dəq | Origin/Host yoxlaması, sorğu tezliyi və paralellik limitləri, ləğv, təhlükəsiz loqlar və serverin düzgün bağlanması. |
| 26–30 dəq | Yerli HTTP və saxta provayderlə sınaqlar, mövcud yoxlamalar/yığım, .env nümunəsi və işə salma təlimatı. |

Bu vaxt bölgüsü təxminidir; nəticə sınaqla təsdiqlənir. İctimai deploy, hesab sistemi və verilənlər bazası bu mərhələnin əhatəsində deyil.

## Nəticə (2026-10-31)

Backend və panel hazırdır, 13 yoxlama və build keçir. Sonradan əlavə olunanlar: panelin `/api/health` ilə serverin vəziyyətini göstərməsi, `Baslat.cmd`-də AI serveri və `docs/BACKEND.md` işə salma təlimatı. Real açarla provayder sınağı hələ aparılmayıb. Təfərrüat CONTEXT.md-nin son bölməsindədir.
