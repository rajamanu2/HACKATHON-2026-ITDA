import {randomBytes,randomUUID,pbkdf2Sync} from 'node:crypto';
import {existsSync,writeFileSync,readFileSync} from 'node:fs';
const file='.local/cloudflare-care-accounts.json',seedFile='.local/cloudflare-care-seeds.json';
if(existsSync(file)){if(!existsSync(seedFile))throw Error('Missing seed companion; refusing to replace credentials.');console.log('Existing private 50-account set retained.');process.exit(0);}
const accounts=Array.from({length:50},(_,i)=>{const role=i<35?'worker':i<49?'doctor':'admin',n=role==='worker'?i+1:role==='doctor'?i-34:1;return {id:randomUUID(),email:`${role}${String(n).padStart(2,'0')}@drishti.local`,name:`${role==='worker'?'Health worker':role==='doctor'?'Medical officer':'Administrator'} ${n}`,role,password:randomBytes(18).toString('base64url')};});
const seeds=accounts.map(({password,...u})=>{const salt=randomBytes(16).toString('hex');return {...u,password_hash:salt+':'+pbkdf2Sync(password,salt,100000,32,'sha256').toString('hex')};});
writeFileSync(file,JSON.stringify({notice:'Private hackathon credentials. Do not publish or bundle in APK.',accounts},null,2),{flag:'wx',mode:0o600});
writeFileSync(seedFile,JSON.stringify(Array.from({length:5},(_,i)=>({key:'CARE_USERS_'+(i+1),is_secret:true,value:JSON.stringify(seeds.slice(i*10,(i+1)*10))}))),{flag:'wx',mode:0o600});
console.log('Prepared 50 private accounts: 35 health workers, 14 doctors, 1 administrator. No passwords printed.');
