import {readFile} from 'node:fs/promises';
const owner=JSON.parse(await readFile('.local/n8n-owner.json','utf8'));
for(let attempt=0;attempt<25;attempt++){
 const ready=await fetch('http://127.0.0.1:5678/healthz/readiness');if(!ready.ok){await new Promise(r=>setTimeout(r,1000));continue;}
 const response=await fetch('http://127.0.0.1:5678/rest/owner/setup',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(owner)});
 const text=await response.text();if(!text.startsWith('{')){await new Promise(r=>setTimeout(r,1000));continue;}
 const result=JSON.parse(text);if(!response.ok){console.log(JSON.stringify({status:response.status,message:result.message||'Owner setup failed'}));process.exitCode=1;}else console.log(JSON.stringify({ownerConfigured:true,id:result.data?.id}));break;
}
