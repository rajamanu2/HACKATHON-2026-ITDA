import {readFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
const base='https://aarogya-drishti-care-hackathon.dodavidokolo.chatgpt.site';
const accounts=JSON.parse(await readFile('.local/cloudflare-care-accounts.json','utf8')).accounts;
const sessions=[];
async function call(path,method='GET',data,session){const r=await fetch(base+path,{method,headers:{'Content-Type':'application/json',...(session?{Cookie:session.cookie,'X-CSRF-Token':session.csrf}:{})},...(data?{body:JSON.stringify(data)}:{}),signal:AbortSignal.timeout(20000)});return {status:r.status,body:await r.json(),cookie:r.headers.get('set-cookie')};}
try{
 assert.equal((await call('/api/patients')).status,401);
 for(let i=0;i<50;i+=5)await Promise.all(accounts.slice(i,i+5).map(async account=>{const r=await call('/api/auth/login','POST',{email:account.email,password:account.password});assert.equal(r.status,200,'Cloud login failed for '+account.email);sessions.push({role:account.role,...r.body,cookie:r.cookie.split(';')[0]});}));
 const worker=sessions.find(s=>s.role==='worker'),doctor=sessions.find(s=>s.role==='doctor'),admin=sessions.find(s=>s.role==='admin');
 assert.equal((await call('/api/admin/users','GET',null,admin)).body.users.length,50);
 const id='AD-CLOUD-CHECK-'+Date.now();const created=await call('/api/patients','POST',{id,name:'Synthetic cloud workflow check',age:42,village:'Synthetic test village',consent:true,history:'Synthetic data only. Cloud acceptance check.'},worker);assert.equal(created.status,201);
 assert.ok((await call('/api/patients','GET',null,doctor)).body.patients.some(p=>p.id===id));
 assert.equal((await call('/api/patients/'+id+'/review','POST',{version:1,stage:'reviewed',notes:'Synthetic cloud acceptance check completed.'},doctor)).status,200);
 assert.equal((await call('/api/patients','GET',null,worker)).body.patients.find(p=>p.id===id).version,2);
 assert.equal((await call('/api/patients/'+id+'/review','POST',{version:1,stage:'reviewed',notes:'Stale check'},doctor)).status,409);
 assert.equal((await call('/api/admin/users','GET',null,worker)).status,403);
 console.log(JSON.stringify({verified:true,cloud:base,successfulAccountLogins:sessions.length,sharedPatientRecord:true,doctorReviewVisibleToWorker:true,staleEditBlocked:true,anonymousPatientAccessDenied:true,patientId:id}));
}finally{await Promise.all(sessions.map(s=>call('/api/auth/logout','POST',{},s).catch(()=>{})));}
