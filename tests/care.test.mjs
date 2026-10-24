import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,readFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {startServer} from '../src/server.mjs';

test('care entries and research inference enforce roles, acknowledgement, versions and shared persistence',async()=>{
 const directory=await mkdtemp(join(tmpdir(),'drishti-care-'));let calls=0,complete;
 const infer=async photo=>{if(!photo)return {available:true,researchOnly:true,clinicallyValidated:false};calls++;return new Promise(resolve=>{complete=()=>resolve({model:'test-fixture',revision:'test-only',modelClass:'Normal',researchOnly:true,clinicallyValidated:false});});};
 const server=await startServer({port:0,dataDir:directory,researchAI:infer}),base=`http://127.0.0.1:${server.address().port}`;
 const accounts=JSON.parse(await readFile(join(directory,'demo-accounts.json'),'utf8')).accounts;
 const request=async(path,method='GET',data,auth)=>{const r=await fetch(base+path,{method,headers:{'Content-Type':'application/json',...(auth?{Cookie:auth.cookie,'X-CSRF-Token':auth.csrf}:{})},...(data?{body:JSON.stringify(data)}:{})});return {status:r.status,body:await r.json(),cookie:r.headers.get('set-cookie')};};
 try{
  const login=async role=>{const a=accounts.find(a=>a.role===role),r=await request('/api/auth/login','POST',a);return {...r.body,cookie:r.cookie.split(';')[0]};};
  const worker=await login('worker'),doctor=await login('doctor');const id='AD-CARE-TEST',path='/api/patients/'+id;
  assert.equal((await request('/api/ai/status')).status,401);
  assert.equal((await request('/api/ai/status','GET',null,worker)).body.available,true);
  await request('/api/patients','POST',{id,name:'Synthetic',age:42,village:'Test',consent:true,photo:'data:image/png;base64,AAAA'},worker);
  const entry={version:1,type:'diagnostic',status:'completed',date:'2026-10-25',title:'Synthetic biopsy',notes:'Synthetic report only',facility:'Test facility'};
  assert.equal((await request(path+'/care','POST',entry,worker)).status,403);
  assert.equal((await request(path+'/care','POST',{...entry,date:'2026-02-30'},doctor)).status,400);
  assert.equal((await request(path+'/care','POST',{...entry,report:'data:text/html;base64,AAAA'},doctor)).status,400);
  const saved=await request(path+'/care','POST',entry,doctor);assert.equal(saved.status,201);assert.equal(saved.body.patient.stage,'screened');assert.equal(saved.body.patient.careEntries.length,1);
  assert.equal((await request(path+'/care','POST',entry,doctor)).status,409);
  assert.equal((await request(path+'/research-ai','POST',{version:2,researchAcknowledged:true},worker)).status,403);
  assert.equal((await request(path+'/research-ai','POST',{version:2},doctor)).status,400);assert.equal(calls,0);
  const pending=request(path+'/research-ai','POST',{version:2,researchAcknowledged:true},doctor);
  while(!complete)await new Promise(r=>setTimeout(r,5));
  assert.equal((await request(path+'/research-ai','POST',{version:2,researchAcknowledged:true},doctor)).status,429);
  const changed=await request(path+'/care','POST',{...entry,version:2,type:'followup'},doctor);assert.equal(changed.status,201);complete();assert.equal((await pending).status,409);
  complete=null;const next=request(path+'/research-ai','POST',{version:3,researchAcknowledged:true},doctor);while(!complete)await new Promise(r=>setTimeout(r,5));complete();const result=await next;assert.equal(result.status,200);assert.equal(result.body.patient.stage,'screened');assert.equal(result.body.patient.researchAI.researchOnly,true);
  const shared=(await request('/api/patients','GET',null,worker)).body.patients[0];assert.equal(shared.version,4);assert.equal(shared.careEntries.length,2);assert.equal(shared.researchAI.modelClass,'Normal');
 }finally{await new Promise(resolve=>server.close(resolve));}
});
