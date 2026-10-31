import assert from 'node:assert/strict';
import http from 'node:http';
import { once } from 'node:events';
import { readConfig } from '../server/config.mjs';
import { contentCount, validateAssistInput, validateAssistOutput, validateInput, validateOutput } from '../server/schema.mjs';
import { createDeepseek, createDeepseekAssist, DEEPSEEK_URL, readBoundedJson } from '../server/deepseek.mjs';
import { createApiServer, BODY_LIMIT } from '../server/app.mjs';

// Real loopback HTTP transport + injected provider. Never call a paid external API.
const input = { topic: 'Azərbaycan dili', material: 'Azərbaycan əlifbası və dilin quruluşu haqqında istifadəçi mətni.', count: 5, consent: true,
  references: [{ id: 'ref', name: 'Qeyd.docx', pageCount: 1, pages: [{ number: 1, text: 'Azərbaycan dilində mənbə mətni.' }] }] };
const slide = i => ({ title: `Başlıq ${i + 1}`, body: 'İstifadə materialına əsaslanan izah.', notes: 'Öz fikrini izah et.', layout: 'text', citations: [{ sourceId: 'ref', page: 1, name: 'uydurma ad' }] });
const parsed = validateInput(input);
// With documents the client appends the sources slide, so the provider writes count − 2.
assert.equal(contentCount(parsed), 3); assert.equal(contentCount(validateInput({ ...input, references: [] })), 4);
const output = { slides: Array.from({ length: 3 }, (_, i) => slide(i)) };
const checked = validateOutput(output, parsed);
assert.equal(checked.slides.length, 4); assert.equal(checked.slides[0].layout, 'cover'); assert.deepEqual(checked.warnings, []);
assert.equal(checked.slides[1].citations[0].name, 'Qeyd.docx', 'Fayl adı modeldən yox, göndərilən mənbədən götürülür'); assert.equal(checked.slides[1].citationReview, true);
assert.equal(new Set(checked.slides.map(s => s.id)).size, 4);
assert.ok(checked.slides[0].body.trim());

// Small deviations become warnings instead of discarding a paid answer.
const lenient = validateOutput({ slides: [
  { ...slide(0), layout: 'html', citations: [{ sourceId: 'ref', page: '1' }, { sourceId: 'ref', page: 1 }] },
  { ...slide(1), body: 'x'.repeat(900) },
  slide(2), slide(3),
] }, parsed);
assert.equal(lenient.slides[1].layout, 'text', 'Naməlum düzülüş mətn olur');
assert.equal(lenient.slides[1].citations.length, 1, 'Təkrar istinad birləşdirilir, rəqəm kimi yazılmış səhifə qəbul olunur');
assert.ok(lenient.warnings.some(w => w.includes('3 əvəzinə 4')), 'Fərqli slayd sayı bildirilir');
assert.ok(lenient.warnings.some(w => w.includes('Uzun mətnli slaydlar: 3')), 'Uzun mətnli slaydın nömrəsi bildirilir');
const noMaterial = validateInput({ ...input, material: '' });
const uncited = validateOutput({ slides: [slide(0), { ...slide(1), citations: [] }, slide(2)] }, noMaterial);
assert.ok(uncited.warnings.some(w => w.includes('Mənbəsi göstərilməyən slaydlar: 3')), 'Mənbəsiz slayd rədd edilmir, açıq bildirilir');
// Invented sources, unusable sizes and unreadable structure still reject the whole answer.
for (const bad of [{ slides: [] }, { slides: [slide(0)] }, { slides: Array.from({ length: 5 }, (_, i) => slide(i)) }, { slides: output.slides.map(s => ({ ...s, body: 'x'.repeat(3001) })) },
  { slides: output.slides.map(s => ({ ...s, citations: [{ sourceId: 'missing', page: 1 }] })) }, { slides: output.slides.map(s => ({ ...s, citations: [{ sourceId: 'ref', page: 2 }] })) },
  { slides: output.slides.map(s => ({ ...s, title: '' })) }, { slides: output.slides.map(s => ({ ...s, citations: 'ref' })) }, { slides: 'x' }])
  assert.throws(() => validateOutput(bad, parsed), error => error.status === 502 && error.code === 'INVALID_AI_OUTPUT');

for (const change of [{ consent: false }, { count: 80 }, { count: 3 }, { topic: '' }, { topic: 'x'.repeat(161) }, { material: 'x'.repeat(12001) }, { material: 'a\u0000b' }, { extra: 'unknown' }, { references: [input.references[0], input.references[0]] }, { references: [{ ...input.references[0], pages: [{ number: 2, text: 'x' }] }] }, { references: [], material: '' }])
  assert.throws(() => validateInput({ ...input, ...change }), error => error.status === 400);
assert.throws(() => validateInput({ ...input, material: 'x'.repeat(12001) }), error => error.message.includes('12000 simvol limitini aşır'));
assert.throws(() => validateInput({ ...input, material: 'a\u0007b' }), error => error.message.includes('idarəetmə simvolu'));
const brief = { purpose: 'seminar', audience: 'teacher', targetMinutes: 5, goal: 'İzah', teacher: 'Şəxsi müəllim adı', institution: 'Məktəb', group: '101' };
const withBrief = validateInput({ ...input, brief });
assert.equal(withBrief.brief.teacher, undefined); assert.equal(withBrief.brief.institution, undefined);

// Slide assistant input: one slide, its cited pages only, never identity fields.
const assistBase = { mode: 'shorten', topic: 'Mövzu', consent: true, brief, references: input.references,
  slide: { title: 'Uzun başlıq', body: 'Uzun mətn '.repeat(40), notes: 'Mövcud qeyd.', layout: 'text', content: '' } };
const assist = validateAssistInput(assistBase);
assert.equal(assist.brief.teacher, undefined); assert.equal(assist.slide.layout, 'text');
assert.ok(validateAssistInput({ ...assistBase, mode: 'notes', slide: { title: 'Cədvəl', body: '', notes: '', layout: 'table', content: 'Sütun A 10' } }));
for (const change of [{ consent: false }, { mode: 'translate' }, { extra: 1 }, { slide: { ...assistBase.slide, layout: 'table' } }, { slide: { ...assistBase.slide, body: '' } },
  { slide: { ...assistBase.slide, layout: 'html' } }, { slide: { ...assistBase.slide, secret: 1 } }, { mode: 'notes', slide: { title: '', body: '', notes: '', layout: 'cover', content: '' } }])
  assert.throws(() => validateAssistInput({ ...assistBase, ...change }), error => error.status === 400);
const shortened = validateAssistOutput({ title: 'Qısa başlıq', body: 'Qısa mətn.', movedToNotes: 'Köçürülən təfərrüat.' }, assist);
assert.equal(shortened.slide.notes, 'Mövcud qeyd.\n\nKöçürülən təfərrüat.', 'Qısaltmada çıxarılan təfərrüat qeydlərin sonuna əlavə olunur');
assert.ok(!shortened.warnings.some(w => w.includes('qısaltmadı')));
assert.ok(validateAssistOutput({ title: 'X', body: assist.slide.body }, assist).warnings.some(w => w.includes('qısaltmadı')));
assert.throws(() => validateAssistOutput({ body: 'Qısa.', movedToNotes: 'y'.repeat(7995) }, assist), error => error.code === 'NOTES_FULL' && error.status === 422);
const notesOnly = validateAssistOutput({ title: 'Dəyişməməli', body: 'Dəyişməməli', notes: 'Yeni çıxış qeydi.' }, { ...assist, mode: 'notes' });
assert.equal(notesOnly.slide.title, 'Uzun başlıq'); assert.equal(notesOnly.slide.notes, 'Yeni çıxış qeydi.');
assert.equal(validateAssistOutput({ title: 'Aydın', body: 'Aydın mətn.' }, { ...assist, mode: 'clarify' }).slide.notes, 'Mövcud qeyd.', 'Aydın yazmaq qeydlərə toxunmur');
for (const [bad, mode] of [[{ title: 'X' }, 'shorten'], [{ notes: '' }, 'notes'], [[], 'clarify'], [{ title: 'X', body: 'a\u0000' }, 'clarify']])
  assert.throws(() => validateAssistOutput(bad, { ...assist, mode }), error => error.code === 'INVALID_AI_OUTPUT');

assert.throws(() => readConfig({ API_PORT: '0' }));
assert.throws(() => readConfig({ DEEPSEEK_MODEL: 'arbitrary-model' }));
assert.throws(() => readConfig({ DEEPSEEK_API_KEY: 'key\nsecret' }));
assert.throws(() => readConfig({ AI_TIMEOUT_MS: 'abc' }), error => error.message.includes('AI_TIMEOUT_MS'));
assert.equal(readConfig({}).apiKey, '');

let calls = 0;
const secret = 'test-key-never-print';
const fakeFetch = async (url, options) => {
  calls++; assert.equal(url, DEEPSEEK_URL); assert.equal(options.headers.Authorization, `Bearer ${secret}`);
  const body = JSON.parse(options.body);
  assert.equal(body.response_format.type, 'json_object'); assert.equal(body.model, 'deepseek-flash');
  assert.deepEqual(body.thinking, { type: 'disabled' }); assert.equal(body.stream, false);
  assert.equal(body.max_tokens, 1500 + 3 * 900, 'Cavab limiti slayd sayına görə artır');
  const user = JSON.parse(body.messages[1].content);
  assert.equal(user.requestedContentSlides, 3);
  assert.ok(/json/i.test(body.messages[0].content), 'JSON rejimi üçün təlimatda JSON sözü var');
  assert.ok(!body.messages[1].content.includes('Şəxsi müəllim adı') && !body.messages[1].content.includes('Qeyd.docx'), 'Şəxsi sahələr və fayl adları provayderə getmir');
  return Response.json({ choices: [{ finish_reason: 'stop', message: { content: JSON.stringify(output) } }] });
};
const provider = createDeepseek({ apiKey: secret, fetchImpl: fakeFetch });
const result = await provider(withBrief);
assert.equal(result.slides.length, 4); assert.equal(calls, 1); assert.ok(result.warnings.length >= 1);
const twelve = createDeepseek({ apiKey: secret, fetchImpl: async (_url, options) => {
  assert.equal(JSON.parse(options.body).max_tokens, 1500 + 10 * 900, 'Ən böyük planda da cavab limiti slayd sayına uyğundur');
  return Response.json({ choices: [{ finish_reason: 'stop', message: { content: JSON.stringify({ slides: Array.from({ length: 10 }, (_, i) => slide(i)) }) } }] });
} });
assert.equal((await twelve(validateInput({ ...input, count: 12 }))).slides.length, 11);
await assert.rejects(createDeepseek({ apiKey: '' })(parsed), error => error.code === 'AI_NOT_CONFIGURED');
for (const [status, code] of [[401, 'AI_AUTH_FAILED'], [402, 'AI_BALANCE_REQUIRED'], [429, 'AI_RATE_LIMITED'], [500, 'AI_UNAVAILABLE'], [503, 'AI_UNAVAILABLE'], [400, 'AI_REQUEST_REJECTED'], [422, 'AI_REQUEST_REJECTED']]) {
  const run = createDeepseek({ apiKey: secret, fetchImpl: async () => new Response('private upstream body ' + secret, { status }) });
  await assert.rejects(run(parsed), error => error.code === code && !error.message.includes(secret));
}
for (const [payload, code] of [[{ choices: [{ finish_reason: 'length' }] }, 'AI_INCOMPLETE'], [{ choices: [{ finish_reason: 'content_filter' }] }, 'AI_FILTERED'], [{ choices: [{ finish_reason: 'insufficient_system_resource' }] }, 'AI_UNAVAILABLE'],
  [{ choices: [{ finish_reason: 'stop', message: { content: '  ' } }] }, 'EMPTY_AI_RESPONSE'], [{ choices: [{ finish_reason: 'stop', message: { content: '{bad' } }] }, 'INVALID_AI_OUTPUT'], [{}, 'AI_INCOMPLETE']]) {
  await assert.rejects(createDeepseek({ apiKey: secret, fetchImpl: async () => Response.json(payload) })(parsed), error => error.code === code);
}
await assert.rejects(readBoundedJson(new Response('a'.repeat(1025)), 1024), error => error.code === 'AI_RESPONSE_TOO_LARGE');
await assert.rejects(readBoundedJson(new Response('{bad')), error => error.code === 'INVALID_AI_RESPONSE');
await assert.rejects(createDeepseek({ apiKey: secret, fetchImpl: async () => { throw new Error(secret); } })(parsed), error => error.code === 'AI_NETWORK_ERROR' && !error.message.includes(secret));
const waitingFetch = (_url, { signal }) => new Promise((_resolve, reject) => { if (signal.aborted) reject(signal.reason); else signal.addEventListener('abort', () => reject(signal.reason), { once: true }); });
const hold = setTimeout(() => {}, 1000);
await assert.rejects(createDeepseek({ apiKey: secret, timeoutMs: 20, fetchImpl: waitingFetch })(parsed), error => error.code === 'AI_TIMEOUT'); clearTimeout(hold);
const cancelled = new AbortController(); cancelled.abort();
await assert.rejects(createDeepseek({ apiKey: secret, fetchImpl: waitingFetch })(parsed, cancelled.signal), error => error.code === 'REQUEST_CANCELLED');

let assistCalls = 0;
const assistProvider = createDeepseekAssist({ apiKey: secret, fetchImpl: async (url, options) => {
  assistCalls++; assert.equal(url, DEEPSEEK_URL);
  const body = JSON.parse(options.body); const user = JSON.parse(body.messages[1].content);
  assert.equal(body.max_tokens, 3000); assert.equal(user.mode, 'shorten'); assert.equal(user.slide.title, 'Uzun başlıq');
  assert.ok(!body.messages[1].content.includes('Qeyd.docx') && !body.messages[1].content.includes('Şəxsi müəllim adı'));
  return Response.json({ choices: [{ finish_reason: 'stop', message: { content: JSON.stringify({ title: 'Qısa başlıq', body: 'Qısa mətn.', movedToNotes: 'Təfərrüat.' }) } }] });
} });
const assisted = await assistProvider(assist);
assert.equal(assistCalls, 1); assert.equal(assisted.slide.body, 'Qısa mətn.'); assert.equal(assisted.slide.notes, 'Mövcud qeyd.\n\nTəfərrüat.');

const servers = [];
const logs = [];
const assistResult = { slide: { title: 'A', body: 'B', notes: 'C' }, provider: 'deepseek', model: 'deepseek-flash', warnings: [] };
async function launch(overrides = {}, generate = provider, dependencies = {}) {
  const api = createApiServer({ ...readConfig({}), apiKey: secret, requestsPerMinute: 30, ...overrides }, { generate, assist: async () => assistResult, logger: event => logs.push(event), ...dependencies });
  api.server.listen(0, '127.0.0.1'); await once(api.server, 'listening');
  servers.push(api);
  const base = `http://127.0.0.1:${api.server.address().port}`;
  return { api, base };
}
const send = (base, options = {}, path = '/api/generate') => fetch(base + path, { method: 'POST', body: options.body ?? JSON.stringify(path === '/api/slide' ? assistBase : input), ...options, headers: { 'Content-Type': 'application/json', ...(options.headers || {}) } });
try {
  const { base } = await launch();
  const health = await fetch(base + '/api/health'); const healthBody = await health.json();
  assert.equal(health.status, 200); assert.equal(healthBody.ai.configured, true); assert.ok(!JSON.stringify(healthBody).includes(secret));
  assert.equal(health.headers.get('cache-control'), 'no-store');
  const good = await send(base); const goodBody = await good.json();
  assert.equal(good.status, 200); assert.equal(goodBody.slides.length, 4); assert.equal(goodBody.requestId, good.headers.get('x-request-id'));
  const slideResponse = await send(base, {}, '/api/slide'); const slideBody = await slideResponse.json();
  assert.equal(slideResponse.status, 200); assert.equal(slideBody.slide.body, 'B');
  assert.equal((await send(base, { body: JSON.stringify({ ...assistBase, mode: 'translate' }) }, '/api/slide')).status, 400);
  assert.equal((await send(base, { body: JSON.stringify(input) }, '/api/slide')).status, 400, 'Plan sorğusu slayd ünvanında qəbul edilmir');
  assert.equal((await fetch(base + '/api/slide')).status, 405);
  const slidePreflight = await fetch(base + '/api/slide', { method: 'OPTIONS', headers: { Origin: 'http://127.0.0.1:5174', 'Access-Control-Request-Method': 'POST' } });
  assert.equal(slidePreflight.status, 204); assert.equal(slidePreflight.headers.get('access-control-allow-methods'), 'POST');
  const cors = await send(base, { headers: { Origin: 'http://127.0.0.1:5174' } }); assert.equal(cors.headers.get('access-control-allow-origin'), 'http://127.0.0.1:5174');
  const denied = await send(base, { headers: { Origin: 'https://hostile.test' } }); assert.equal(denied.status, 403); assert.equal(denied.headers.get('access-control-allow-origin'), null);
  assert.equal((await send(base, { headers: { Origin: 'https://hostile.test' } }, '/api/slide')).status, 403);
  const rebound = await new Promise((resolve, reject) => {
    const req = http.get(base + '/api/health', { headers: { Host: 'rebind.test' } }, res => { res.resume(); res.on('end', () => resolve(res.statusCode)); });
    req.on('error', reject);
  }); assert.equal(rebound, 403);
  assert.equal((await send(base, { headers: { 'Sec-Fetch-Site': 'cross-site' } })).status, 403);
  assert.equal((await send(base, { headers: { 'Content-Type': 'text/plain' } })).status, 415);
  assert.equal((await send(base, { headers: { 'Content-Encoding': 'gzip' } })).status, 415);
  assert.equal((await send(base, { body: '{invalid' })).status, 400);
  assert.equal((await send(base, { body: JSON.stringify({ ...input, consent: false }) })).status, 400);
  assert.equal((await send(base, { body: 'x'.repeat(BODY_LIMIT + 1) })).status, 413);
  assert.equal((await fetch(base + '/api/generate')).status, 405);
  assert.equal((await fetch(base + '/api/unknown')).status, 404);
  assert.equal((await fetch(base + '/api/health?x=1')).status, 404);
  assert.equal((await fetch(base + '/__proto__')).status, 404);
  const preflight = await fetch(base + '/api/generate', { method: 'OPTIONS', headers: { Origin: 'http://127.0.0.1:5174', 'Access-Control-Request-Method': 'POST' } }); assert.equal(preflight.status, 204);
  assert.equal((await fetch(base + '/api/health', { method: 'OPTIONS', headers: { Origin: 'http://127.0.0.1:5174', 'Access-Control-Request-Method': 'POST' } })).status, 405);
  // No Content-Length: enforce the budget while streaming, still return structured JSON.
  const chunked = await new Promise((resolve, reject) => {
    const req = http.request(base + '/api/generate', { method: 'POST', headers: { 'Content-Type': 'application/json', 'Transfer-Encoding': 'chunked' } }, res => { res.resume(); res.on('end', () => resolve(res.statusCode)); });
    req.on('error', reject); req.write('x'.repeat(BODY_LIMIT / 2)); req.end('x'.repeat(BODY_LIMIT / 2 + 1));
  }); assert.equal(chunked, 413);
  const off = await launch({ apiKey: '' }); assert.equal((await send(off.base)).status, 503); assert.equal((await send(off.base, {}, '/api/slide')).status, 503);
  assert.equal((await (await fetch(off.base + '/api/health')).json()).ai.configured, false);
  let clock = 0;
  const limited = await launch({ requestsPerMinute: 1 }, provider, { now: () => clock }); assert.equal((await send(limited.base)).status, 200);
  const limit = await send(limited.base, {}, '/api/slide'); assert.equal(limit.status, 429, 'Plan və slayd sorğuları eyni limiti bölüşür'); assert.ok(Number(limit.headers.get('retry-after')) > 0);
  clock = 60000; assert.equal((await send(limited.base)).status, 200, 'Pəncərə bitəndə limit bərpa olunur');
  let release, started;
  const startedPromise = new Promise(resolve => { started = resolve; });
  const pending = await launch({ maxConcurrent: 1 }, async () => { started(); await new Promise(resolve => { release = resolve; }); return result; });
  const first = send(pending.base); await startedPromise;
  assert.equal((await send(pending.base, {}, '/api/slide')).status, 429); release(); assert.equal((await first).status, 200);
  const throwing = await launch({}, async () => { throw new TypeError('private material ' + secret); });
  const failure = await send(throwing.base); assert.equal(failure.status, 500); assert.ok(!(await failure.text()).includes(secret));
  assert.ok(logs.some(log => log.code === 'INTERNAL_ERROR' && log.error === 'TypeError'), 'Daxili xətanın yalnız növü loqa yazılır');
  let aborted = false, startedCancel;
  const cancelStarted = new Promise(resolve => { startedCancel = resolve; });
  const abortable = await launch({}, async (_input, signal) => { startedCancel(); await new Promise(resolve => signal.addEventListener('abort', () => { aborted = true; resolve(); }, { once: true })); return result; });
  const controller = new AbortController(); const inFlight = send(abortable.base, { signal: controller.signal }); await cancelStarted; controller.abort();
  await assert.rejects(inFlight); await new Promise(resolve => setTimeout(resolve, 30)); assert.equal(aborted, true);
  assert.ok(logs.some(log => log.code === 'REQUEST_CANCELLED' && log.status === null), 'Ləğv edilmiş sorğu loqda status olmadan qeyd olunur');
  assert.ok(!JSON.stringify(logs).includes(secret)); assert.ok(!JSON.stringify(logs).includes(input.material)); assert.ok(!JSON.stringify(logs).includes('Uzun mətn'));
} finally { await Promise.all(servers.map(api => api.close())); }
console.log('Keçdi: backend JSON sxemi və yumşaq yoxlama (say, uzun mətn, mənbəsiz slayd xəbərdarlıqları), uydurma istinadın rəddi, slayd köməkçisi (qısalt/aydın/qeyd, qeydlərə köçürmə), DeepSeek müqaviləsi/xətaları/timeout/ləğv, fayl adlarının gizlədilməsi, real HTTP, origin/host, body və ortaq sorğu/paralellik limitləri, məxfi məlumatı çıxarmayan cavablar və loqlar. Xarici API çağırılmadı.');
