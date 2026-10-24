import assert from 'node:assert/strict';
import {mkdtemp,readFile} from 'node:fs/promises';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {startServer} from '../src/server.mjs';
const host=process.argv[2]||'192.168.1.3',directory=await mkdtemp(join(tmpdir(),'drishti-lan-'));
await assert.rejects(startServer({port:0,dataDir:directory,lanHost:'8.8.8.8'}),/private IPv4/);
const server=await startServer({port:0,lanHost:host,lanPort:0,dataDir:directory}),local=`http://127.0.0.1:${server.address().port}`,lan=`http://${host}:${server.lanAddress.port}`;
try{
 const a=await(await fetch(local+'/api/health')).json(),b=await(await fetch(lan+'/api/health')).json();assert.equal(a.instanceId,b.instanceId);assert.equal((await fetch(lan+'/api/patients')).status,401);
 const accounts=JSON.parse(await readFile(join(directory,'demo-accounts.json'),'utf8')).accounts,worker=accounts.find(a=>a.role==='worker');const login=await fetch(local+'/api/auth/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(worker)}),identity=await login.json(),headers={Cookie:login.headers.get('set-cookie').split(';')[0],'X-CSRF-Token':identity.csrf,'Content-Type':'application/json'};
 const saved=await fetch(lan+'/api/patients',{method:'POST',headers,body:JSON.stringify({id:'AD-LAN-SYNTHETIC',name:'Synthetic LAN test',age:42,village:'Test village',consent:true})});assert.equal(saved.status,201);const shared=await(await fetch(local+'/api/patients',{headers})).json();assert.equal(shared.patients[0].id,'AD-LAN-SYNTHETIC');console.log('PASS: private-IP-only LAN listener; same database and instance; anonymous access denied; authenticated shared record across LAN and loopback.');
}finally{await new Promise(resolve=>server.close(resolve));}
