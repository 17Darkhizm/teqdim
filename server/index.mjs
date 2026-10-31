import { readConfig } from './config.mjs';
import { createApiServer } from './app.mjs';

let api;
try {
  const config = readConfig();
  api = createApiServer(config);
  api.server.on('error', error => {
    console.error(error.code === 'EADDRINUSE' ? 'API portu məşğuldur. API_PORT dəyərini yoxla.' : 'API serverini başlatmaq mümkün olmadı.');
    process.exitCode = 1;
  });
  api.server.listen(config.port, config.host, () => {
    console.log(`Təqdim API: http://${config.host}:${config.port} · DeepSeek ${config.apiKey ? 'qurulub' : 'hələ qurulmayıb'}`);
  });
  let stopping = false;
  const stop = async () => { if (stopping) return; stopping = true; await api.close(); };
  process.once('SIGINT', stop);
  process.once('SIGTERM', stop);
} catch (error) {
  // Config messages name the variable, never its value.
  console.error(`API konfiqurasiyası düzgün deyil: ${error instanceof Error ? error.message : 'naməlum xəta'} .env.example və docs/BACKEND.md fayllarını yoxla.`);
  process.exitCode = 1;
}
