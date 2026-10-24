import {readFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
const {url:base}=JSON.parse(await readFile('.local/cloudflare/quick-tunnel.json','utf8'));assert.match(base,/^https:\/\/[a-z0-9-]+\.trycloudflare\.com$/);
// Anonymous asset verification only. No login, account passwords or patient data.
const page=await fetch(base);assert.equal(page.status,200);assert.match(await page.text(),/Aarogya Drishti/);
const health=await fetch(base+'/api/health');assert.equal(health.status,200);assert.equal((await health.json()).mode,'shared-demo');
const anonymous=await fetch(base+'/api/patients');assert.equal(anonymous.status,401);
const apk=await fetch(base+'/downloads/android');assert.equal(apk.status,200);const remote=Buffer.from(await apk.arrayBuffer()),local=await readFile('dist/android/Aarogya-Drishti-0.3.0-debug.apk');assert.equal(createHash('sha256').update(remote).digest('hex'),createHash('sha256').update(local).digest('hex'));
console.log(JSON.stringify({publicUrl:base,httpsPage:true,health:true,anonymousPatientAccessDenied:true,apkDownloadVerified:true,publicLogin:'not-tested'}));
