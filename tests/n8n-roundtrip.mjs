import {readFile} from 'node:fs/promises';
import {DatabaseSync} from 'node:sqlite';
import assert from 'node:assert/strict';
const base='http://127.0.0.1:4173';const accounts=JSON.parse(await readFile('.local/demo-accounts.json','utf8')).accounts;
async function signIn(role){const a=accounts.find(u=>u.role===role);const r=await fetch(base+'/api/auth/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email:a.email,password:a.password})});assert.equal(r.status,200);const json=await r.json();return {...json,cookie:r.headers.get('set-cookie').split(';')[0]};}
async function call(path,method,user,data){const r=await fetch(base+path,{method,headers:{Cookie:user.cookie,'X-CSRF-Token':user.csrf,'Content-Type':'application/json'},...(data?{body:JSON.stringify(data)}:{})});const result=await r.json();assert.ok(r.ok,JSON.stringify(result));return result;}
const worker=await signIn('worker'),doctor=await signIn('doctor');const id='AD-INTEGRATION-'+Date.now();
try{
 await call('/api/patients','POST',worker,{id,name:'Demo Shared Care Check',age:42,village:'Demo Village',consent:true,history:'Synthetic end-to-end login, shared record and n8n receipt check.'});
 const shared=(await call('/api/patients','GET',doctor)).patients.find(p=>p.id===id);assert.equal(shared.version,1);
 await call(`/api/patients/${id}/review`,'PATCH',doctor,{version:1,stage:'reviewed',notes:'Synthetic review verified from a separate medical-officer account.',facility:'',due:''});
 assert.equal((await call('/api/patients','GET',worker)).patients.find(p=>p.id===id).stage,'reviewed');
 let status;for(let attempt=0;attempt<3;attempt++){await call('/api/automation/sync','POST',worker,{});status=await call('/api/automation/status','GET',worker);if(!status.pending)break;}
 assert.equal(status.configured,true);assert.equal(status.pending,0);assert.ok(status.receipts>=2);
 const db=new DatabaseSync('.local/drishti.sqlite');const event=db.prepare('SELECT body FROM events WHERE patient_id=? LIMIT 1').get(id);const token=db.prepare('SELECT value FROM settings WHERE key=?').get('n8nToken').value;db.close();
 const response=await fetch('http://127.0.0.1:5678/webhook/drishti-events',{method:'POST',headers:{'Content-Type':'application/json','X-Webhook-Token':token},body:event.body});assert.equal(response.status,200);assert.equal((await response.json()).accepted,true);
 const after=await call('/api/automation/status','GET',worker);assert.equal(after.receipts,status.receipts);
 console.log(JSON.stringify({verified:true,patientId:id,sharedReview:true,n8nReceipts:after.receipts,pending:after.pending,duplicateReceiptIgnored:true}));
}finally{await call('/api/auth/logout','POST',worker,{});await call('/api/auth/logout','POST',doctor,{});}
