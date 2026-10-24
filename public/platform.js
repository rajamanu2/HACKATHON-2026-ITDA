export const isAndroid=()=>Boolean(window.DrishtiAndroid);
const pending=new Map();
window.addEventListener('drishti-native-response',event=>{const request=pending.get(event.detail.id);if(request){clearTimeout(request.timer);pending.delete(event.detail.id);request.resolve(event.detail);}});
export function nativeRequest(path,method,data,csrf){return new Promise((resolve,reject)=>{const id=crypto.randomUUID(),timer=setTimeout(()=>{pending.delete(id);reject(Error('The care-server request timed out. Open Connect care server and run Test & connect. Offline records are preserved.'));},path.includes('/research-ai')||path==='/api/ai/status'?55000:45000);pending.set(id,{resolve,reject,timer});try{window.DrishtiAndroid.request(id,path,method,JSON.stringify(data??null),csrf||'');}catch(error){clearTimeout(timer);pending.delete(id);reject(Error('Android connection bridge is unavailable. Close and reopen the app.'));}});}
export function mountNativeConnection(lang){
 const status=document.querySelector('#native-connection-status'),button=document.querySelector('#native-test');if(!status||!button)return;
 const te=lang==='te';let info={};try{info=JSON.parse(window.DrishtiAndroid.connectionInfo?.()||'{}');}catch{}
 const address=document.querySelector('#native-address');if(address)address.textContent=[info.version?`APK ${info.version}`:'',info.server||''].filter(Boolean).join(' · ');
 button.onclick=async()=>{button.disabled=true;status.textContent=te?'సర్వర్ కనెక్షన్ తనిఖీ…':'Testing care-server connection…';try{const result=await nativeRequest('/api/health','GET',null,'');if(result.status!==200||result.body?.ok!==true||!result.body?.instanceId)throw Error(result.body?.error||'The address did not return a compatible care server.');status.textContent=te?'సర్వర్ అనుసంధానం అయింది. లాగిన్ అవ్వండి.':'Care server connected. You can sign in.';}catch(error){status.textContent=error.message;}finally{if(button.isConnected)button.disabled=false;}};
 status.textContent=te?'లాగిన్ ముందు కనెక్షన్ తనిఖీ చేయండి.':'Test the saved server connection before signing in.';
}
export function configureServer(){window.DrishtiAndroid?.configureServer();}
export function haptic(){try{window.DrishtiAndroid?.haptic();}catch{}}
export function requestVoice(lang){if(isAndroid()){window.DrishtiAndroid.startVoice(lang==='te'?'te-IN':'en-IN');return true;}return false;}
