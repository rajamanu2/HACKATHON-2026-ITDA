import {spawn} from 'node:child_process';
import {resolve} from 'node:path';
import {existsSync,writeFileSync} from 'node:fs';
const binary=resolve('.local/cloudflare/cloudflared.exe');if(!existsSync(binary))throw Error('Run scripts/cloudflare-download.ps1 first.');
const child=spawn(binary,['tunnel','--url','http://127.0.0.1:4173','--protocol','http2','--no-autoupdate'],{stdio:['ignore','pipe','pipe']});
let saved=false;function output(chunk){const text=chunk.toString();process.stdout.write(text);const match=text.match(/https:\/\/[a-z0-9-]+\.trycloudflare\.com/);if(match&&!saved){saved=true;writeFileSync(resolve('.local/cloudflare/quick-tunnel.json'),JSON.stringify({url:match[0],createdAt:new Date().toISOString(),pid:child.pid,temporary:true},null,2));}}
child.stdout.on('data',output);child.stderr.on('data',output);for(const signal of ['SIGINT','SIGTERM'])process.on(signal,()=>child.kill(signal));child.on('exit',code=>process.exit(code??1));
