# AI serveri (DeepSeek)

Adi plan brauzerdə yerli hazırlanır və heç yerə göndərilmir. İki imkan isə yerli Node serveri (`server/`) vasitəsilə DeepSeek API-yə sorğu göndərir:

- **AI planı** (ilk addım, «DeepSeek ilə plan hazırla»): materialdan bütöv slayd planı.
- **Slayd köməkçisi** (redaktor, «AI ilə düzəliş»): seçilən slayd üçün «Qısalt», «Aydın yaz», «Çıxış qeydi yaz».

API açarı yalnız serverin mühit dəyişənində saxlanır, brauzerə çıxmır. Hər iki imkanda nəticə əvvəlcə önizləmə kimi göstərilir, yalnız «Tətbiq et» basılandan sonra təqdimata yazılır və bir addımda geri alınır.

## Nə göndərilir

| | AI planı | Slayd köməkçisi |
| --- | --- | --- |
| Göndərilir | mövzu, material, sənədlərdən çıxarılmış səhifə mətnləri, slayd sayı, məqsəd, auditoriya, hədəf müddət | mövzu, məqsəd, auditoriya, hədəf müddət, seçilən slaydın başlığı, mətni, çıxış qeydləri, düzülüşü (cədvəl/diaqram slaydında görünən mətn), yalnız bu slaydın istinad etdiyi səhifələr |
| Göndərilmir | ilkin fayllar, fayl adları, «Hazırlayan», universitet, müəllim, qrup | eyni sahələr və digər slaydlar |

Brauzer universitet, müəllim və qrup sahələrini sorğuya əlavə etmir. Fayl adı yerli API üçün ümumi etiketlə əvəzlənir. İstinadın əsl adı redaktorda yerli sənəddən götürülür.

Sorğu yalnız razılıq qutusu işarələnəndə və düymə basılanda gedir. Slayd köməkçisində seçilən slayd və ya göndəriləcək məlumat dəyişəndə razılıq yenidən alınır. Gözləyən sorğu ləğv olunur və əvvəlki təklif bağlanır.

## Quraşdırma

1. `.env.example` faylını `.env` adı ilə kopyala. `.env` gitignore-dadır.
2. `DEEPSEEK_API_KEY=` sətrinə öz açarını yaz. Açarı `VITE_` ilə başlayan dəyişənə yazma.
3. `DEEPSEEK_MODEL`: `deepseek-flash` (standart) və ya `deepseek-v4-pro`. Başqa ad qəbul edilmir.
4. İstəyə bağlı limitlər:

| Dəyişən | Aralıq | Standart |
| --- | --- | --- |
| `API_PORT` | 1024–65535 | 8787 |
| `AI_TIMEOUT_MS` | 1000–90000 | 45000 |
| `AI_MAX_CONCURRENT` | 1–4 | 2 |
| `AI_REQUESTS_PER_MINUTE` | 1–30 | 6 (plan və slayd sorğuları birlikdə) |

Dəyər səhvdirsə, server başlamır və hansı dəyişənin səhv olduğunu yazır (dəyərin özünü yox).

## İşə salmaq

- **Windows:** `Baslat.cmd` AI serverini ayrıca pəncərədə, interfeysi isə əsas pəncərədə açır.
- **Əl ilə:** bir terminalda `npm run api`, digərində `npm run dev`. Vite `/api` sorğularını `127.0.0.1:API_PORT` ünvanına ötürür.
- **Yoxlama:** `http://127.0.0.1:8787/api/health` cavabında `"configured": true` olmalıdır. Panellər açılanda serverin vəziyyəti görünür: «işləmir», «açar qurulmayıb» və ya «hazırdır». Server hazır olmayanda AI düymələri bağlı qalır.

## API

| Ünvan | Üsul | Məzmun |
| --- | --- | --- |
| `/api/health` | GET | `{ status, ai: { configured, provider, model } }` |
| `/api/generate` | POST | plan: `{ topic, material, references, count, brief, consent }` → `{ slides, warnings }` |
| `/api/slide` | POST | slayd: `{ mode: shorten / clarify / notes, topic, slide, references, brief, consent }` → `{ slide: { title, body, notes }, warnings }` |

DeepSeek yalnız məzmun slaydlarını yazır: sənəd yoxdursa `count − 1`, varsa `count − 2`. Üz qabığını və «İstifadə olunan materiallar» slaydını model yox, Təqdim özü əlavə edir. Beləliklə, AI planı da adi plan kimi bitir.

## Cavabın yoxlanması

- **Rədd edilir** (pullu cavab olsa da, təqdimat dəyişmir): uydurma istinad (göndərilməmiş sənəd və ya mətni olmayan səhifə), boş başlıq və ya mətn, redaktorun sərt limitlərini aşan mətn (başlıq 160, mətn 3000, qeyd 8000 simvol), oxunmayan quruluş, istənən saydan 1-dən çox fərqlənən slayd sayı.
- **Xəbərdarlıqla qəbul edilir:** sayın 1 fərqi, 460 simvoldan uzun mətn (redaktorda «Böl» var), sənəd əsaslı planda istinadsız slayd, AI-nin mətni qısaltmaması. Naməlum düzülüş «Mətn» olur, təkrar istinadlar birləşdirilir.
- «Qısalt» rejimində slayddan çıxarılan təfərrüatlar silinmir, çıxış qeydlərinin sonuna əlavə olunur. Qeydlər doludursa (8000 simvol), sorğu `NOTES_FULL` ilə dayanır.
- İstinadın fayl adı həmişə yerli sənəddən götürülür, modelin yazdığı ad işlənmir.

## Qorunma

- Server yalnız `127.0.0.1`-də dinləyir. Host və Origin yoxlanır (`127.0.0.1:5174`, `localhost:5174`), başqa saytdan gələn sorğu rədd edilir. Vite özü də yad Host-u (DNS rebinding) və `.env` fayllarını bloklayır.
- Sorğu ən çox 512 KB ola bilər. Material 12 000 simvol, mənbə mətni fayl üzrə 60 000, cəmi 100 000 simvol, slayd sayı 4–12-dir. Sənəddən gələn idarəetmə simvolları göndərilməzdən əvvəl boşluqla əvəz olunur.
- Loqa yalnız sorğu ID-si, marşrut, status, xəta kodu, müddət və daxili xətanın növü yazılır. Material, açar və xəta mətni yazılmır.

## Məhdudiyyətlər

- Bu server yerli istifadə üçündür. Hesab, giriş və istifadəçi üzrə limit yoxdur, ona görə ictimai internetə açılmamalıdır.
- Avtomatik sınaqlar saxta provayderlə işləyir (`npm run check:backend`, `npm run check:ai`). Real açarla sınaq ayrıca aparılmalıdır.
- İstinadın mövcudluğu fikrin doğruluğunu təsdiqləmir. AI mətnini və faktları özün yoxla.
- DeepSeek API pulludur. Balans bitəndə server «balansı kifayət etmir» xətasını qaytarır.

## Xəta kodları

| Kod | Mənası |
| --- | --- |
| `AI_NOT_CONFIGURED` | Serverdə açar yoxdur |
| `AI_AUTH_FAILED` | Açar yanlışdır və ya etibarsızdır |
| `AI_BALANCE_REQUIRED` | DeepSeek balansı bitib |
| `AI_REQUEST_REJECTED` | DeepSeek sorğunu qəbul etmədi (400/422): material və ya model ayarı |
| `RATE_LIMITED`, `AI_RATE_LIMITED` | Yerli və ya DeepSeek sorğu limiti |
| `CONCURRENCY_LIMIT` | Başqa AI sorğusu hələ işlənir |
| `AI_TIMEOUT` | Gözləmə vaxtı bitib |
| `AI_FILTERED` | DeepSeek bu material üçün cavab vermədi |
| `AI_INCOMPLETE`, `EMPTY_AI_RESPONSE`, `INVALID_AI_OUTPUT` | Cavab natamam, boş və ya sxemə uyğun deyil |
| `NOTES_FULL` | «Qısalt» üçün çıxış qeydlərində yer yoxdur |

## Real provayderlə ilk sınaq

1. Yerli serveri başladıb paneldə «hazırdır» vəziyyətini yoxla.
2. Şəxsi məlumatı olmayan, istinad səhifəsi məlum olan bir nümunə sənədlə 4 slaydlıq plan hazırla. Önizləmədə Azərbaycan dilini, mənbənin düzgün səhifəsini və mətndə uydurma fakt olub-olmadığını yoxla.
3. Planı tətbiq et və məzmun slaydında «Qısalt» rejimini yoxla. Çıxarılan təfərrüatların çıxış qeydlərinə keçdiyini, istinadın yerində qaldığını və bir geri alma ilə slaydın bərpa olunduğunu yoxla.
4. Nəticə problemli olarsa sorğu ID-sini, modeli və xəta kodunu qeyd et. Açarı və sənədin mətnini paylaşma.
