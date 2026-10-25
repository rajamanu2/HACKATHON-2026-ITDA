// Explicit synthetic wiring check: never queues or dials a telephone call.
import {DatabaseSync} from 'node:sqlite';
import {randomUUID} from 'node:crypto';
import assert from 'node:assert/strict';
const db=new DatabaseSync('.local/drishti.sqlite');
const id='AD-VOICE-WIRING-'+randomUUID(),eventId=randomUUID(),callId=randomUUID(),now=new Date().toISOString();
try{
 const user=db.prepare("SELECT id FROM users WHERE role='worker' AND active=1 LIMIT 1").get();
 const token=db.prepare("SELECT value FROM settings WHERE key='n8nToken'").get()?.value;assert.ok(token);
 const patient={id,name:'Synthetic voice wiring check',age:40,village:'Synthetic',phone:'',history:'No telephone call; automation wiring check only.',consent:true,stage:'screened',notes:'',createdAt:now,timeline:[]};
 db.exec('BEGIN IMMEDIATE');try{
  db.prepare('INSERT INTO patients VALUES(?,?,?,?,?)').run(id,JSON.stringify(patient),1,user.id,now);
  db.prepare('INSERT INTO voice_calls(id,patient_id,event_id,language,phone,status,agent_id,created_by,created_at) VALUES(?,?,?,?,?,?,?,?,?)').run(callId,id,eventId,'en','','test_no_dial','synthetic',user.id,now);db.exec('COMMIT');
 }catch(e){db.exec('ROLLBACK');throw e;}
 const response=await fetch('http://127.0.0.1:5678/webhook/drishti-voice-intake',{method:'POST',headers:{'Content-Type':'application/json','X-Webhook-Token':token},body:JSON.stringify({id:eventId,type:'voice.requested',data:{callId}}),signal:AbortSignal.timeout(20000)});
 assert.equal(response.status,200);const ack=await response.json();assert.deepEqual(ack,{accepted:true,eventId});
 assert.equal(db.prepare('SELECT status FROM voice_calls WHERE id=?').get(callId).status,'test_no_dial');
 console.log('PASS: authenticated n8n voice webhook → private app dispatch → acknowledgement. No dialing; no provider contacted.');
}finally{
 // Remove only this check's UUID-addressed fixtures, never existing patient data.
 db.prepare('DELETE FROM voice_calls WHERE id=? AND status=?').run(callId,'test_no_dial');
 db.prepare('DELETE FROM patients WHERE id=?').run(id);db.close();
}
