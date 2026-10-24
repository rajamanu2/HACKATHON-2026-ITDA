import {spawn} from 'node:child_process';
import {resolve} from 'node:path';
export const modelRevision='45d1ff9aad923f7b9685e531a275ca454d3cc58f';
export function runResearchAI(photo){
 return new Promise((resolveResult,reject)=>{
  const python=process.env.DRISHTI_AI_PYTHON||resolve('.local/ai-venv',process.platform==='win32'?'Scripts/python.exe':'bin/python');
  const child=spawn(python,[resolve('scripts/research-ai.py'),...(photo?[]:['--check'])],{stdio:['pipe','pipe','pipe'],windowsHide:true});
  let output='',finished=false;const finish=(error,result)=>{if(finished)return;finished=true;clearTimeout(timer);error?reject(error):resolveResult(result);};
  const timer=setTimeout(()=>{child.kill();finish(Error('Local research inference timed out.'));},25000);
  child.on('error',()=>finish(Error('Local research model is not installed.')));
  child.stdout.on('data',chunk=>{output+=chunk;if(output.length>16000){child.kill();finish(Error('Invalid inference response.'));}});
  child.stderr.resume();child.stdin.on('error',()=>{});
  child.on('close',code=>{if(code!==0)return finish(Error('Model or image could not be processed. Check installation and image quality.'));try{const result=JSON.parse(output);if(result.revision!==modelRevision||result.researchOnly!==true||result.clinicallyValidated!==false||(photo&&!['Normal','Oral Cancer'].includes(result.modelClass)))throw Error();finish(null,result);}catch{finish(Error('Invalid inference response.'));}});
  child.stdin.end(photo?JSON.stringify({photo}):'');
 });
}
