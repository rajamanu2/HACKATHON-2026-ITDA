import {spawn} from 'node:child_process';
import {existsSync,readFileSync,chownSync} from 'node:fs';
if(process.env.DATA_DIR!=='/app/.local')throw Error('Cloud DATA_DIR must use the persistent /app/.local volume.');
if(!existsSync('/app/.local'))throw Error('Persistent application data directory missing.');
if(process.platform==='linux'&&!readFileSync('/proc/self/mountinfo','utf8').split('\n').some(line=>line.split(' ')[4]==='/app/.local'))throw Error('Attach a persistent volume at /app/.local before starting this cloud service.');
// Some hosts mount volumes as root. Prepare only this verified mount, then drop
// privileges before opening databases, starting n8n or accepting requests.
if(process.getuid?.()===0){chownSync('/app/.local',1000,1000);process.setgid(1000);process.setuid(1000);process.env.HOME='/home/care';}
const run=(script,args=[])=>new Promise((resolve,reject)=>{const child=spawn(process.execPath,[script,...args],{stdio:'inherit'});child.on('error',reject);child.on('exit',code=>code===0?resolve():reject(Error('Cloud initialization failed: '+script)));});
await run('scripts/configure-local-n8n.mjs');
if(process.env.ENABLE_RESEARCH_AI==='true'){
 await new Promise(resolve=>{const child=spawn(process.env.DRISHTI_AI_PYTHON,['cloud/download-model.py'],{stdio:'inherit'});child.on('error',()=>{console.error('Research AI unavailable: Python startup failed.');resolve();});child.on('exit',code=>{if(code)console.error('Research AI unavailable: model initialization failed.');resolve();});});
}
const children=[spawn(process.execPath,['scripts/local-n8n.mjs'],{stdio:'inherit'}),spawn(process.execPath,['server.mjs'],{stdio:'inherit'})];
let stopping=false;
function stop(code){if(stopping)return;stopping=true;for(const child of children)child.kill('SIGTERM');const timer=setTimeout(()=>{for(const child of children)child.kill('SIGKILL');process.exit(code);},10000);timer.unref();Promise.all(children.map(child=>child.exitCode!==null?Promise.resolve():new Promise(resolve=>child.once('exit',resolve)))).then(()=>process.exit(code));}
for(const child of children){child.on('error',()=>stop(1));child.on('exit',()=>{if(!stopping)stop(1);});}
for(const signal of ['SIGTERM','SIGINT'])process.on(signal,()=>stop(0));
