import { createServer } from 'node:http';
import { randomUUID } from 'node:crypto';
import { ApiError } from './errors.mjs';
import { validateAssistInput, validateInput } from './schema.mjs';
import { createDeepseek, createDeepseekAssist } from './deepseek.mjs';

export const BODY_LIMIT = 512 * 1024;
export const ALLOWED_ORIGINS = new Set(['http://127.0.0.1:5174', 'http://localhost:5174']);
const WINDOW_MS = 60000;

function readBody(req) {
  const length = req.headers['content-length'];
  if (length && (!/^\d+$/.test(length) || Number(length) > BODY_LIMIT)) throw new ApiError(413, 'BODY_TOO_LARGE', 'Sorğu 512 KB limitini aşır.');
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks = [];
    const cleanup = () => { req.off('data', data); req.off('end', end); req.off('error', error); req.off('aborted', aborted); };
    const fail = value => { cleanup(); reject(value); };
    const error = () => fail(new ApiError(400, 'BODY_READ_FAILED', 'Sorğunun mətni oxunmadı.'));
    const aborted = () => fail(new ApiError(499, 'REQUEST_CANCELLED', 'Sorğu ləğv edildi.'));
    const data = chunk => {
      size += chunk.length;
      if (size > BODY_LIMIT) { req.pause(); fail(new ApiError(413, 'BODY_TOO_LARGE', 'Sorğu 512 KB limitini aşır.')); }
      else chunks.push(chunk);
    };
    const end = () => {
      cleanup();
      try { resolve(JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(Buffer.concat(chunks)))); }
      catch { reject(new ApiError(400, 'INVALID_JSON', 'Sorğu etibarlı UTF-8 JSON olmalıdır.')); }
    };
    req.on('data', data).once('end', end).once('error', error).once('aborted', aborted);
  });
}

export function createApiServer(config, { generate = createDeepseek(config), assist = createDeepseekAssist(config), now = Date.now, logger = event => process.stdout.write(JSON.stringify(event) + '\n') } = {}) {
  // POST routes share the key check, rate limit and concurrency budget.
  const routes = {
    '/api/health': { method: 'GET' },
    '/api/generate': { method: 'POST', validate: validateInput, run: generate },
    '/api/slide': { method: 'POST', validate: validateAssistInput, run: assist },
  };
  const clients = new Map();
  const controllers = new Set();
  let running = 0;
  let budget = { start: now(), count: 0 };
  let closing = false;
  function rateLimit(ip) {
    const time = now();
    for (const [key, entry] of clients) if (time - entry.start >= WINDOW_MS) clients.delete(key);
    if (!clients.has(ip) && clients.size >= 1024) throw new ApiError(503, 'SERVER_BUSY', 'Server məşğuldur. Bir qədər sonra yoxla.', 60);
    const entry = clients.get(ip) || { start: time, count: 0 };
    if (time - budget.start >= WINDOW_MS) budget = { start: time, count: 0 };
    if (entry.count >= config.requestsPerMinute || budget.count >= config.requestsPerMinute)
      throw new ApiError(429, 'RATE_LIMITED', 'Sorğu sayının həddinə çatdın. Bir az gözlə, sonra yenidən cəhd et.', Math.max(1, Math.ceil((WINDOW_MS - (time - budget.start)) / 1000)));
    entry.count++;
    budget.count++;
    clients.set(ip, entry);
  }
  const server = createServer({ requestTimeout: 15000, headersTimeout: 5000, maxHeaderSize: 8192 }, async (req, res) => {
    const requestId = randomUUID();
    const started = now();
    let code = 'OK';
    let route = 'unknown';
    let accepted = false;
    let internal;
    let controller;
    res.setHeader('X-Request-Id', requestId);
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Referrer-Policy', 'no-referrer');
    res.setHeader('Content-Security-Policy', "default-src 'none'; frame-ancestors 'none'");
    const send = (status, body, headers = {}) => {
      if (res.destroyed || res.writableEnded) return;
      res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', ...headers });
      res.end(JSON.stringify(body));
    };
    try {
      if (closing) throw new ApiError(503, 'SERVER_CLOSING', 'Server bağlanır. Bir qədər sonra yoxla.');
      const host = req.headers.host;
      const port = server.address()?.port;
      if (![`${config.host}:${port}`, `localhost:${port}`].includes(host)) throw new ApiError(403, 'HOST_DENIED', 'Bu server ünvanına icazə verilmir.');
      const origin = req.headers.origin;
      if (origin && !ALLOWED_ORIGINS.has(origin)) throw new ApiError(403, 'ORIGIN_DENIED', 'Bu mənbədən sorğuya icazə verilmir.');
      if (req.headers['sec-fetch-site'] === 'cross-site') throw new ApiError(403, 'ORIGIN_DENIED', 'Başqa saytdan sorğuya icazə verilmir.');
      if (origin) { res.setHeader('Access-Control-Allow-Origin', origin); res.setHeader('Vary', 'Origin'); }
      const target = Object.hasOwn(routes, req.url) ? routes[req.url] : null;
      if (!target) throw new ApiError(404, 'NOT_FOUND', 'API ünvanı tapılmadı.');
      route = req.url;
      if (req.method === 'OPTIONS') {
        if (req.headers['access-control-request-method'] && req.headers['access-control-request-method'] !== target.method)
          throw new ApiError(405, 'METHOD_NOT_ALLOWED', 'Bu HTTP üsulu dəstəklənmir.');
        res.writeHead(204, { 'Access-Control-Allow-Methods': target.method, 'Access-Control-Allow-Headers': 'Content-Type', 'Access-Control-Max-Age': '600' });
        res.end();
        return;
      }
      if (req.method !== target.method) throw new ApiError(405, 'METHOD_NOT_ALLOWED', `Bu ünvan üçün ${target.method} istifadə et.`);
      if (!target.run) {
        send(200, { status: 'ok', ai: { configured: Boolean(config.apiKey), provider: 'deepseek', model: config.model }, requestId });
        return;
      }
      if (!/^application\/json(?:\s*;\s*charset=utf-8)?$/i.test(req.headers['content-type'] || '') || req.headers['content-encoding'])
        throw new ApiError(415, 'UNSUPPORTED_MEDIA_TYPE', 'Sıxılmamış application/json UTF-8 sorğusu göndər.');
      if (!config.apiKey) throw new ApiError(503, 'AI_NOT_CONFIGURED', 'DeepSeek açarı serverdə hələ qurulmayıb.');
      rateLimit(req.socket.remoteAddress || 'local');
      if (running >= config.maxConcurrent) throw new ApiError(429, 'CONCURRENCY_LIMIT', 'Başqa AI sorğusu işlənir. Bir qədər sonra yoxla.', 5);
      running++;
      accepted = true;
      controller = new AbortController();
      controllers.add(controller);
      req.once('aborted', () => controller.abort());
      res.once('close', () => { if (!res.writableFinished) controller.abort(); });
      const input = target.validate(await readBody(req));
      const result = await target.run(input, controller.signal);
      if (!controller.signal.aborted) send(200, { ...result, requestId });
      else code = 'REQUEST_CANCELLED';
    } catch (error) {
      const safe = error instanceof ApiError ? error : new ApiError(500, 'INTERNAL_ERROR', 'Serverdə gözlənilməz xəta baş verdi.');
      code = safe.code;
      // Only the error class is logged: messages may quote user material.
      if (!(error instanceof ApiError)) internal = error instanceof Error ? error.name : typeof error;
      // Close connections with unread/oversized bodies; never echo payloads or provider errors.
      const headers = { ...(safe.retryAfter ? { 'Retry-After': String(safe.retryAfter) } : {}), ...(!req.complete ? { Connection: 'close' } : {}) };
      send(safe.status === 499 ? 408 : safe.status, { error: { code: safe.code, message: safe.message, requestId } }, headers);
    } finally {
      if (accepted) running--;
      if (controller) controllers.delete(controller);
      // A response that never left (client gone) has no status of its own.
      const status = res.headersSent ? res.statusCode : null;
      try { logger({ requestId, route, status, code, durationMs: Math.max(0, now() - started), ...(internal ? { error: internal } : {}) }); } catch { /* Logging must not fail a request. */ }
    }
  });
  server.maxRequestsPerSocket = 100;
  server.keepAliveTimeout = 5000;
  return {
    server,
    async close() {
      closing = true;
      for (const controller of controllers) controller.abort();
      await new Promise(resolve => {
        server.close(resolve);
        server.closeIdleConnections();
        const timer = setTimeout(() => server.closeAllConnections(), 1500);
        timer.unref();
      });
    },
  };
}
