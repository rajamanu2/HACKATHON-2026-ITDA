import {startServer} from './src/server.mjs';
const server=await startServer();
console.log(`Aarogya Drishti: http://127.0.0.1:${server.address().port}`);
for(const signal of ['SIGINT','SIGTERM'])process.on(signal,()=>server.close(()=>process.exit(0)));
