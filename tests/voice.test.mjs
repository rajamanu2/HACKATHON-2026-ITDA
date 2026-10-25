import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,readFile} from 'node:fs/promises';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {DatabaseSync} from 'node:sqlite';
import {startServer} from '../src/server.mjs';

test('voice intake: consent, roles, private automation, no double dial, verified results and protected clinician data',async()=>{
 const directory=await mkdtemp(join(tmpdir(),'drishti-voice-'));
 const agent='11111111-1111-4111-8111-111111111111',executionId='22222222-2222-4222-8222-222222222222';
 const config={VOICE_CALLING_ENABLED:'true',BOLNA_API_KEY:'synthetic-only',BOLNA_AGENT_TE:agent,BOLNA_AGENT_EN:agent};let dials=0,result={};
 const provider=async(url,options)=>{assert.equal(new URL(url).origin,'https://api.bolna.ai');if(url.endsWith('/call')){dials++;const body=JSON.parse(options.body);assert.equal(body.recipient_phone_number,'+919999999999');assert.equal(body.user_data.language,'te');assert.equal(body.user_data.name,undefined);return Response.json({execution_id:executionId});}return Response.json({id:executionId,agent_id:agent,status:'completed',telephony_data:{to_number:'+919999999999'},extracted_data:result});};
 const server=await startServer({port:0,dataDir:directory,voiceFetch:provider,voiceConfig:config});
 const db=new DatabaseSync(join(directory,'drishti.sqlite'));db.prepare('INSERT INTO settings VALUES(?,?)').run('callbackToken','synthetic-callback');
 const base='http://127.0.0.1:'+server.address().port,accounts=JSON.parse(await readFile(join(directory,'demo-accounts.json'))).accounts;
 const request=async(path,method='GET',data,auth,extra={})=>{const r=await fetch(base+path,{method,headers:{'Content-Type':'application/json',...auth,...extra},...(data?{body:JSON.stringify(data)}:{})});return {status:r.status,body:await r.json(),cookie:r.headers.get('set-cookie')};};
 try{
  const login=async role=>{const r=await request('/api/auth/login','POST',accounts.find(a=>a.role===role));return {Cookie:r.cookie.split(';')[0],'X-CSRF-Token':r.body.csrf};};
  const worker=await login('worker'),doctor=await login('doctor'),admin=await login('admin');
  const id='AD-VOICE-TEST';await request('/api/patients','POST',{id,name:'Synthetic',age:42,village:'Test',phone:'+919999999999',consent:true,history:'Existing worker history'},worker);
  await request('/api/patients/'+id+'/review','POST',{version:1,stage:'reviewed',notes:'Preserve doctor decision'},doctor);
  const input={patientId:id,version:2,language:'te',contactConsent:true};
  assert.equal((await request('/api/voice/status')).status,401);
  assert.equal((await request('/api/voice/calls','POST',input,admin)).status,403);
  assert.equal((await request('/api/voice/calls','POST',input,{Cookie:worker.Cookie})).status,403);
  assert.equal((await request('/api/voice/calls','POST',{...input,contactConsent:false},worker)).status,400);
  assert.equal((await request('/api/voice/calls','POST',{...input,version:1},worker)).status,409);
  config.VOICE_CALLING_ENABLED='false';assert.equal((await request('/api/voice/calls','POST',input,worker)).status,503);assert.equal(dials,0);config.VOICE_CALLING_ENABLED='true';
  const created=await request('/api/voice/calls','POST',input,worker);assert.equal(created.status,201);
  assert.equal((await request('/api/voice/calls','POST',input,worker)).status,409);
  const eventId=db.prepare('SELECT event_id FROM voice_calls').get().event_id,callback={'X-Automation-Token':'synthetic-callback'};
  assert.equal((await request('/api/voice/dispatch','POST',{eventId})).status,401);
  assert.equal((await request('/api/voice/dispatch','POST',{eventId},callback,{'X-Forwarded-For':'1.2.3.4'})).status,401);
  await Promise.all([request('/api/voice/dispatch','POST',{eventId},callback),request('/api/voice/dispatch','POST',{eventId},callback)]);assert.equal(dials,1);
  result={name:'Synthetic confirmed',age:43,village:'కొత్త గ్రామం',history:'Patient reports mouth discomfort',identity_confirmed:true,consent_to_save:true,answers_confirmed:true,notes:'Overwrite doctor',stage:'closed'};
  assert.equal((await request('/api/voice/reconcile','POST',{},callback)).body.updated,1);
  assert.equal((await request('/api/voice/reconcile','POST',{},callback)).body.updated,0);
  const p=(await request('/api/patients','GET',null,doctor)).body.patients[0];assert.equal(p.notes,'Preserve doctor decision');assert.equal(p.stage,'reviewed');assert.equal(p.name,'Synthetic');assert.equal(p.history,'Existing worker history');assert.equal(p.version,3);assert.equal(p.voiceIntakes.length,1);assert.equal(p.voiceIntakes[0].name,'Synthetic confirmed');assert.equal(p.voiceIntakes[0].notes,undefined);
  const list=await request('/api/voice/calls?patientId='+id,'GET',null,worker);assert.equal(list.body.calls[0].status,'saved');assert.equal(list.body.calls[0].execution_id,undefined);
  // Current categorized provider extractions use subjective values, including typed strings.
  db.prepare("UPDATE voice_calls SET result=NULL,status='submitted'").run();result={'Patient Intake':Object.fromEntries(Object.entries({name:'తెలుగు పేరు',age:'44',identity_confirmed:'true',consent_to_save:'true',answers_confirmed:'true'}).map(([k,v])=>[k,{subjective:v,confidence:0.95}]))};await request('/api/voice/reconcile','POST',{},callback);
  const modern=JSON.parse(db.prepare('SELECT body FROM patients').get().body);assert.equal(modern.voiceIntakes.at(-1).name,'తెలుగు పేరు');assert.equal(modern.voiceIntakes.at(-1).age,44);
  // Unconfirmed / malformed answers never become patient-confirmed intake.
  db.prepare("UPDATE voice_calls SET result=NULL,status='submitted'").run();result={name:'Wrong person',consent_to_save:true,answers_confirmed:true};await request('/api/voice/reconcile','POST',{},callback);
  assert.equal(db.prepare('SELECT status FROM voice_calls').get().status,'needs_review');assert.equal(JSON.parse(db.prepare('SELECT body FROM patients').get().body).voiceIntakes.length,2);
 }finally{db.close();await new Promise(r=>server.close(r));}
});

test('ambiguous provider failure is never automatically redialed',async()=>{
 const {openStore}=await import('../src/store.mjs'),{voiceIntake}=await import('../src/voice-intake.mjs');const dir=await mkdtemp(join(tmpdir(),'drishti-voice-retry-')),db=openStore(dir);let dials=0;
 try{
  const user=db.prepare("SELECT * FROM users WHERE role='worker'").get();db.prepare('INSERT INTO patients VALUES(?,?,?,?,?)').run('AD-RETRY',JSON.stringify({id:'AD-RETRY',phone:'+919999999999',age:40,timeline:[]}),1,user.id,new Date().toISOString());
  const voice=voiceIntake({db,fail:(s,m)=>{throw Error(m);},config:{VOICE_CALLING_ENABLED:'true',BOLNA_API_KEY:'fixture',BOLNA_AGENT_TE:'11111111-1111-4111-8111-111111111111',BOLNA_AGENT_EN:'11111111-1111-4111-8111-111111111111'},fetcher:async()=>{dials++;throw Error('Connection lost after dial');}});
  voice.create({patientId:'AD-RETRY',version:1,language:'en',contactConsent:true},user);const event=db.prepare('SELECT event_id FROM voice_calls').get().event_id;await voice.dispatch(event);await voice.dispatch(event);assert.equal(dials,1);assert.equal(voice.list('AD-RETRY')[0].status,'dispatch_uncertain');
 }finally{db.close();}
});
