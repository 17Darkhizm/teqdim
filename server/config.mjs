export function readConfig(env = process.env) {
  function integer(key, fallback, min, max) {
    const raw = env[key];
    if (raw === undefined || raw === '') return fallback;
    if (!/^\d+$/.test(raw)) throw new Error(`${key} tam ədəd olmalıdır.`);
    const value = Number(raw);
    if (!Number.isSafeInteger(value) || value < min || value > max) throw new Error(`${key} icazə verilən aralıqda deyil.`);
    return value;
  }
  const apiKey = (env.DEEPSEEK_API_KEY || '').trim();
  if (apiKey.length > 500 || /[\s\u0000-\u001f\u007f]/.test(apiKey)) throw new Error('DEEPSEEK_API_KEY düzgün deyil.');
  const model = env.DEEPSEEK_MODEL || 'deepseek-flash';
  if (!['deepseek-flash', 'deepseek-v4-pro'].includes(model)) throw new Error('DEEPSEEK_MODEL dəstəklənmir.');
  return {
    host: '127.0.0.1', port: integer('API_PORT', 8787, 1024, 65535), apiKey, model,
    timeoutMs: integer('AI_TIMEOUT_MS', 45000, 1000, 90000),
    maxConcurrent: integer('AI_MAX_CONCURRENT', 2, 1, 4),
    requestsPerMinute: integer('AI_REQUESTS_PER_MINUTE', 6, 1, 30),
  };
}
