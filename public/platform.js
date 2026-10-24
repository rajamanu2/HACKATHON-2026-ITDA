export const isAndroid=()=>Boolean(window.DrishtiAndroid);
const pending=new Map();
window.addEventListener('drishti-native-response',event=>{const request=pending.get(event.detail.id);if(request){clearTimeout(request.timer);pending.delete(event.detail.id);request.resolve(event.detail);}});
export function nativeRequest(path,method,data,csrf){return new Promise((resolve,reject)=>{const id=crypto.randomUUID(),timer=setTimeout(()=>{pending.delete(id);reject(Error('The care server is not reachable. Check the Android server connection.'));},18000);pending.set(id,{resolve,reject,timer});window.DrishtiAndroid.request(id,path,method,JSON.stringify(data??null),csrf||'');});}
export function configureServer(){window.DrishtiAndroid?.configureServer();}
export function haptic(){try{window.DrishtiAndroid?.haptic();}catch{}}
export function requestVoice(lang){if(isAndroid()){window.DrishtiAndroid.startVoice(lang==='te'?'te-IN':'en-IN');return true;}return false;}
