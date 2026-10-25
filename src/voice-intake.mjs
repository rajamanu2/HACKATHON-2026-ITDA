import {randomUUID} from 'node:crypto';
import {transaction,audit,patientFrom} from './store.mjs';

const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const terminal=['completed','busy','no-answer','failed','canceled','stopped','error','balance-low'];
export function voiceIntake({db,fail,fetcher=fetch,config=process.env}){
 db.exec(`CREATE TABLE IF NOT EXISTS voice_calls(id TEXT PRIMARY KEY, patient_id TEXT NOT NULL REFERENCES patients(id), event_id TEXT NOT NULL UNIQUE, language TEXT NOT NULL, phone TEXT NOT NULL, status TEXT NOT NULL, execution_id TEXT UNIQUE, agent_id TEXT NOT NULL, created_by TEXT NOT NULL, created_at TEXT NOT NULL, result TEXT, error TEXT);`);
 const ready=()=>config.VOICE_CALLING_ENABLED==='true'&&Boolean(config.BOLNA_API_KEY)&&uuid.test(config.BOLNA_AGENT_TE||'')&&uuid.test(config.BOLNA_AGENT_EN||'');
 const publicCall=r=>({id:r.id,patientId:r.patient_id,language:r.language,status:r.status,createdAt:r.created_at,result:r.result?JSON.parse(r.result):null,error:r.error});
 async function provider(path,data){
  const response=await fetcher('https://api.bolna.ai'+path,{method:data?'POST':'GET',headers:{Authorization:'Bearer '+config.BOLNA_API_KEY,'Content-Type':'application/json'},...(data?{body:JSON.stringify(data)}:{}),redirect:'error',signal:AbortSignal.timeout(5000)});
  if(!response.ok)throw Error('Provider request failed');return response.json();
 }
 function create(input,user){
  if(!['worker','doctor'].includes(user.role))fail(403,'Only the care team can request a call.');
  if(!ready())fail(503,'Voice calling is disabled. Configure the provider, agents and approved calling budget.');
  const row=db.prepare('SELECT * FROM patients WHERE id=?').get(input.patientId);if(!row)fail(404,'Patient not found.');
  if(input.version!==row.version)fail(409,'Refresh the patient record before calling.');
  const p=patientFrom(row),phone=p.phone.replace(/[\s()-]/g,'');
  if(!/^\+91[6-9]\d{9}$/.test(phone))fail(400,'Save an Indian mobile number in +91 format first.');
  if(p.age<18)fail(400,'Adult patient intake only.');
  if(!['te','en'].includes(input.language)||input.contactConsent!==true)fail(400,'Language and patient permission for AI phone intake are required.');
  if(db.prepare("SELECT id FROM voice_calls WHERE patient_id=? AND created_at>? ").get(p.id,new Date(Date.now()-24*3600000).toISOString()))fail(409,'A call was already requested in the past 24 hours.');
  const limit=Number(config.VOICE_DAILY_LIMIT||5);if(!Number.isInteger(limit)||limit<1||limit>100)fail(503,'Set a daily call limit between 1 and 100.');
  if(db.prepare('SELECT count(*) AS n FROM voice_calls WHERE created_at>=?').get(new Date().toISOString().slice(0,10)).n>=limit)fail(429,'Daily call limit reached.');
  const id=randomUUID(),eventId=randomUUID(),at=new Date().toISOString(),agent=config[input.language==='te'?'BOLNA_AGENT_TE':'BOLNA_AGENT_EN'];
  transaction(db,()=>{
   db.prepare('INSERT INTO voice_calls(id,patient_id,event_id,language,phone,status,agent_id,created_by,created_at) VALUES(?,?,?,?,?,?,?,?,?)').run(id,p.id,eventId,input.language,phone,'queued',agent,user.id,at);
   db.prepare('INSERT INTO events(id,patient_id,type,body) VALUES(?,?,?,?)').run(eventId,p.id,'voice.requested',JSON.stringify({id:eventId,type:'voice.requested',patientId:p.id,createdAt:at,data:{callId:id}}));
   audit(db,user,'voice.contact_consent_recorded',p.id);
  });return publicCall(db.prepare('SELECT * FROM voice_calls WHERE id=?').get(id));
 }
 async function dispatch(eventId){
  const call=db.prepare('SELECT * FROM voice_calls WHERE event_id=?').get(eventId);if(!call)fail(404,'Call event not found.');
  // Claim before external IO. A timeout may have placed a call: never redial on delivery retry.
  if(call.status==='queued'){
   if(!ready())fail(503,'Voice calling disabled.');
   db.prepare("UPDATE voice_calls SET status='dispatching' WHERE id=?").run(call.id);
   try{
    const result=await provider('/call',{agent_id:call.agent_id,recipient_phone_number:call.phone,agent_data:{language:call.language},user_data:{intake_reference:call.id,language:call.language}});
    if(!uuid.test(result.execution_id||''))throw Error('Missing execution identity');
    db.prepare("UPDATE voice_calls SET status='submitted',execution_id=? WHERE id=?").run(result.execution_id,call.id);
   }catch{db.prepare("UPDATE voice_calls SET status='dispatch_uncertain',error=? WHERE id=?").run('Check provider call history. Automatic redial is blocked.',call.id);}
  }
  return {accepted:true,eventId};
 }
 let polling=false;
 async function reconcile(){
  if(polling)return {busy:true};if(!config.BOLNA_API_KEY)return {disabled:true,updated:0};polling=true;let updated=0;
  try{for(const call of db.prepare("SELECT * FROM voice_calls WHERE execution_id IS NOT NULL AND result IS NULL AND status NOT IN ('busy','no-answer','failed','canceled','stopped','error','balance-low','needs_review') ORDER BY created_at LIMIT 5").all()){
   try{
    const execution=await provider('/executions/'+call.execution_id);
    if(execution.id!==call.execution_id||execution.agent_id!==call.agent_id||(execution.telephony_data?.to_number||execution.user_number)!==call.phone)throw Error('Execution mismatch');
    if(terminal.includes(execution.status)&&execution.status!=='completed'){db.prepare('UPDATE voice_calls SET status=? WHERE id=?').run(execution.status,call.id);continue;}
    if(execution.status!=='completed'){if(['queued','scheduled','initiated','ringing','in-progress','call-disconnected'].includes(execution.status))db.prepare('UPDATE voice_calls SET status=? WHERE id=?').run(execution.status,call.id);continue;}
    const raw=execution.extracted_data?.['Patient Intake']||execution.extracted_data;
    // Unknown extraction formats fail closed; no transcript guessing or arbitrary field writes.
    const value=(key)=>{const v=raw?.[key];if(v&&typeof v==='object'){if(typeof v.confidence==='number'&&v.confidence<0.8)return undefined;return v.subjective??v.value;}return v;};
    const result={};for(const [key,max] of [['name',100],['village',100],['history',2000]]){const v=value(key);if(typeof v==='string'&&v.trim()&&v.length<=max)result[key]=v.trim();}
    const rawAge=value('age'),age=typeof rawAge==='string'&&/^\d{2,3}$/.test(rawAge)?Number(rawAge):rawAge;if(Number.isInteger(age)&&age>=18&&age<=120)result.age=age;
    const yes=key=>value(key)===true||value(key)==='true';
    const confirmed=yes('identity_confirmed')&&yes('consent_to_save')&&yes('answers_confirmed')&&execution.answered_by_voice_mail!==true;
    result.patientConfirmed=confirmed;result.receivedAt=new Date().toISOString();
    transaction(db,()=>{
     const row=db.prepare('SELECT * FROM patients WHERE id=?').get(call.patient_id),p=JSON.parse(row.body);
     // Preserve existing registration and all clinician fields; call answers automatically fill a separate shared intake form.
     const status=confirmed&&Object.keys(result).length>2?'saved':'needs_review';
     if(status==='saved'){
      p.voiceIntakes=[...(p.voiceIntakes||[]),{callId:call.id,language:call.language,...result}].slice(-100);
      p.timeline.push({at:result.receivedAt,text:'Patient-confirmed phone intake received.',te:'రోగి నిర్ధారించిన ఫోన్ వివరాలు అందాయి.'});
      db.prepare('UPDATE patients SET body=?,version=version+1,updated_at=? WHERE id=?').run(JSON.stringify(p),result.receivedAt,p.id);
     }
     db.prepare('UPDATE voice_calls SET status=?,result=? WHERE id=?').run(status,JSON.stringify(result),call.id);
     audit(db,{id:call.created_by},'voice.'+status,call.patient_id);
    });updated++;
   }catch{db.prepare('UPDATE voice_calls SET error=? WHERE id=?').run('Unable to verify provider result. Will retry status check; no redial.',call.id);}
  }return {updated};}finally{polling=false;}
 }
 return {status:()=>({configured:ready(),provider:'Bolna',languages:['te','en'],dailyLimit:Number(config.VOICE_DAILY_LIMIT||5)}),create,dispatch,reconcile,list:patientId=>db.prepare('SELECT * FROM voice_calls WHERE patient_id=? ORDER BY created_at DESC LIMIT 50').all(patientId).map(publicCall)};
}
