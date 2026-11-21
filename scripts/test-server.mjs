import { createServer } from 'vite';
import './generate-icons.mjs';

const server = await createServer({
  server: { host: '127.0.0.1', port: 5189, strictPort: true, open: false },
});
await server.listen();
for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, async () => {
    await server.close();
    process.exit(0);
  });
}
