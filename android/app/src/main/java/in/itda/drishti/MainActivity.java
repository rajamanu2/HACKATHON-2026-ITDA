package in.itda.drishti;

import android.app.Activity;
import android.app.AlertDialog;
import android.content.ClipData;
import android.content.Intent;
import android.content.SharedPreferences;
import android.graphics.Color;
import android.net.Uri;
import android.os.Bundle;
import android.provider.MediaStore;
import android.speech.RecognizerIntent;
import android.view.HapticFeedbackConstants;
import android.webkit.JavascriptInterface;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.EditText;
import android.widget.Toast;
import org.json.JSONObject;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.InputStream;
import java.net.HttpURLConnection;
import java.net.URI;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.Locale;
import java.util.UUID;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

public class MainActivity extends Activity {
 private static final String APP_HOST="app.drishti.local";
 private final ExecutorService network=Executors.newFixedThreadPool(3);
 private WebView web;private SessionVault vault;private SharedPreferences preferences;
 private ValueCallback<Uri[]> fileCallback;private Uri cameraUri;
 @Override public void onCreate(Bundle state){super.onCreate(state);preferences=getSharedPreferences("connection",MODE_PRIVATE);vault=new SessionVault(this);getWindow().setStatusBarColor(Color.rgb(238,243,252));getWindow().setNavigationBarColor(Color.rgb(238,243,252));
  web=new WebView(this);web.setBackgroundColor(Color.rgb(238,243,252));android.widget.FrameLayout frame=new android.widget.FrameLayout(this);frame.setFitsSystemWindows(true);frame.addView(web,new android.widget.FrameLayout.LayoutParams(-1,-1));setContentView(frame);WebSettings settings=web.getSettings();settings.setJavaScriptEnabled(true);settings.setDomStorageEnabled(true);settings.setAllowFileAccess(false);settings.setAllowContentAccess(true);settings.setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);settings.setSupportMultipleWindows(false);settings.setMediaPlaybackRequiresUserGesture(true);WebView.setWebContentsDebuggingEnabled(BuildConfig.DEBUG);web.addJavascriptInterface(new NativeBridge(),"DrishtiAndroid");
  web.setWebViewClient(new WebViewClient(){
   @Override public boolean shouldOverrideUrlLoading(WebView view,WebResourceRequest request){return !APP_HOST.equals(request.getUrl().getHost());}
   @Override public WebResourceResponse shouldInterceptRequest(WebView view,WebResourceRequest request){Uri uri=request.getUrl();if(!"https".equals(uri.getScheme())||!APP_HOST.equals(uri.getHost()))return denied();String path=uri.getPath();if(path==null||path.equals("/"))path="/index.html";if(path.contains("..")||!path.matches("/[a-zA-Z0-9_./-]+"))return denied();try{String mime=path.endsWith(".js")?"text/javascript":path.endsWith(".css")?"text/css":path.endsWith(".svg")?"image/svg+xml":path.endsWith(".webmanifest")?"application/manifest+json":"text/html";return new WebResourceResponse(mime,"UTF-8",getAssets().open("web"+path));}catch(Exception error){return denied();}}
  });
  web.setWebChromeClient(new WebChromeClient(){@Override public boolean onShowFileChooser(WebView view,ValueCallback<Uri[]> callback,FileChooserParams params){if(fileCallback!=null)fileCallback.onReceiveValue(null);fileCallback=callback;if(checkSelfPermission(android.Manifest.permission.CAMERA)!=android.content.pm.PackageManager.PERMISSION_GRANTED)requestPermissions(new String[]{android.Manifest.permission.CAMERA},103);else showPhotoChooser();return true;}});
  web.loadUrl("https://"+APP_HOST+"/");cleanCameraCache();
 }
 private WebResourceResponse denied(){return new WebResourceResponse("text/plain","UTF-8",404,"Not found",java.util.Collections.emptyMap(),new ByteArrayInputStream(new byte[0]));}
 private void cleanCameraCache(){File[] files=getCacheDir().listFiles();if(files!=null)for(File file:files)if(file.getName().startsWith("capture_")&&System.currentTimeMillis()-file.lastModified()>86400000L)file.delete();}
 private void showPhotoChooser(){try{Intent pick=new Intent(Intent.ACTION_GET_CONTENT);pick.setType("image/*");pick.addCategory(Intent.CATEGORY_OPENABLE);Intent camera=new Intent(MediaStore.ACTION_IMAGE_CAPTURE);ArrayList<Intent> choices=new ArrayList<>();if(camera.resolveActivity(getPackageManager())!=null&&checkSelfPermission(android.Manifest.permission.CAMERA)==android.content.pm.PackageManager.PERMISSION_GRANTED){File file=new File(getCacheDir(),"capture_"+UUID.randomUUID()+".jpg");file.createNewFile();cameraUri=Uri.parse("content://"+getPackageName()+".camera/"+file.getName());camera.putExtra(MediaStore.EXTRA_OUTPUT,cameraUri);camera.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION|Intent.FLAG_GRANT_WRITE_URI_PERMISSION);camera.setClipData(ClipData.newRawUri("Screening photograph",cameraUri));choices.add(camera);}Intent chooser=Intent.createChooser(pick,"Screening photograph / ఫోటో");chooser.putExtra(Intent.EXTRA_INITIAL_INTENTS,choices.toArray(new Intent[0]));startActivityForResult(chooser,101);}catch(Exception error){fileCallback.onReceiveValue(null);fileCallback=null;Toast.makeText(this,"Camera or gallery unavailable",Toast.LENGTH_LONG).show();}}
 private void dispatch(String event,JSONObject detail){runOnUiThread(()->{if(!isFinishing())web.evaluateJavascript("window.dispatchEvent(new CustomEvent("+JSONObject.quote(event)+",{detail:"+detail.toString()+"}))",null);});}
 private String server(){return preferences.getString("server",!BuildConfig.DEFAULT_SERVER_URL.isEmpty()?BuildConfig.DEFAULT_SERVER_URL:(BuildConfig.DEBUG?"http://10.0.2.2:4173":""));}
 private boolean validServer(String value){try{URI uri=new URI(value);String host=uri.getHost();if(host==null||uri.getUserInfo()!=null||uri.getQuery()!=null||uri.getFragment()!=null||!(uri.getPath()==null||uri.getPath().isEmpty()||uri.getPath().equals("/")))return false;if("https".equals(uri.getScheme()))return true;if(!BuildConfig.DEBUG||!"http".equals(uri.getScheme()))return false;return host.equals("localhost")||host.equals("127.0.0.1")||(android.util.Patterns.IP_ADDRESS.matcher(host).matches()&&(host.startsWith("10.")||host.startsWith("192.168.")||host.matches("172\\.(1[6-9]|2[0-9]|3[01])\\..+")));}catch(Exception error){return false;}}
 public class NativeBridge {
  @JavascriptInterface public void configureServer(){runOnUiThread(()->{EditText input=new EditText(MainActivity.this);input.setSingleLine();input.setText(server());input.setPadding(35,25,35,25);new AlertDialog.Builder(MainActivity.this).setTitle("Connect care server").setMessage("Enter the shared HTTPS address. Debug builds also allow local-network HTTP. Emulator: http://10.0.2.2:4173").setView(input).setNegativeButton("Cancel",null).setPositiveButton("Connect",(dialog,which)->{String value=input.getText().toString().trim().replaceAll("/+$","");if(!validServer(value)){Toast.makeText(MainActivity.this,"Use a valid HTTPS server or local debug address.",Toast.LENGTH_LONG).show();return;}preferences.edit().putString("server",value).apply();vault.clear();web.evaluateJavascript("sessionStorage.clear();localStorage.removeItem('drishti-native-session');location.reload()",null);}).show();});}
  @JavascriptInterface public void haptic(){runOnUiThread(()->web.performHapticFeedback(HapticFeedbackConstants.KEYBOARD_TAP));}
  @JavascriptInterface public void startVoice(String locale){runOnUiThread(()->{try{Intent intent=new Intent(RecognizerIntent.ACTION_RECOGNIZE_SPEECH);intent.putExtra(RecognizerIntent.EXTRA_LANGUAGE_MODEL,RecognizerIntent.LANGUAGE_MODEL_FREE_FORM);intent.putExtra(RecognizerIntent.EXTRA_LANGUAGE,"te-IN".equals(locale)?"te-IN":"en-IN");intent.putExtra(RecognizerIntent.EXTRA_PREFER_OFFLINE,true);intent.putExtra(RecognizerIntent.EXTRA_PROMPT,"Patient intake / రోగి వివరాలు");startActivityForResult(intent,102);}catch(Exception error){dispatch("drishti-voice-error",new JSONObject());}});}
  @JavascriptInterface public void openConsultation(String value){runOnUiThread(()->{Uri uri=Uri.parse(value);if("https".equals(uri.getScheme())&&"meet.jit.si".equals(uri.getHost())&&uri.getPath()!=null&&uri.getPath().startsWith("/Drishti-")){Intent intent=new Intent(MainActivity.this,ConsultationActivity.class);intent.putExtra("url",value);startActivity(intent);}});}
  @JavascriptInterface public void request(String id,String path,String method,String body,String csrf){network.submit(()->{JSONObject result=new JSONObject();try{result.put("id",id);if(!path.matches("/api/(auth/(login|logout|me)|health|patients|patients/AD-[A-Za-z0-9-]+/review|automation/(sync|status)|admin/(users|users/bulk|audit)|consultations)(\\?patientId=AD-[A-Za-z0-9-]+)?")||!(method.equals("GET")||method.equals("POST")||method.equals("PATCH"))||body.length()>3000000)throw new Exception("Invalid request");if(!validServer(server()))throw new Exception("Configure a valid server");URL url=new URL(server()+path);HttpURLConnection connection=(HttpURLConnection)url.openConnection();connection.setInstanceFollowRedirects(false);connection.setConnectTimeout(8000);connection.setReadTimeout(12000);connection.setRequestMethod(method.equals("PATCH")?"POST":method);connection.setRequestProperty("Content-Type","application/json");String cookie=vault.read();if(!cookie.isEmpty())connection.setRequestProperty("Cookie",cookie);if(!csrf.isEmpty())connection.setRequestProperty("X-CSRF-Token",csrf);if(!method.equals("GET")){connection.setDoOutput(true);try(java.io.OutputStream output=connection.getOutputStream()){output.write(body.equals("null")?"{}".getBytes(StandardCharsets.UTF_8):body.getBytes(StandardCharsets.UTF_8));}}int status=connection.getResponseCode();String setCookie=connection.getHeaderField("Set-Cookie");if(setCookie!=null){if(setCookie.contains("Max-Age=0"))vault.clear();else vault.save(setCookie.split(";",2)[0]);}try(InputStream input=status>=400?connection.getErrorStream():connection.getInputStream()){ByteArrayOutputStream buffer=new ByteArrayOutputStream();byte[] data=new byte[8192];int count,total=0;if(input!=null)while((count=input.read(data))!=-1){total+=count;if(total>30000000)throw new Exception("Response too large");buffer.write(data,0,count);}result.put("status",status);result.put("body",new JSONObject(buffer.toString("UTF-8")));}connection.disconnect();}catch(Exception error){try{result.put("id",id);result.put("status",0);result.put("body",new JSONObject().put("error","Care server unreachable. Open Connect care server; offline records remain on this device."));}catch(Exception ignored){}}dispatch("drishti-native-response",result);});}
 }
 @Override protected void onActivityResult(int request,int result,Intent data){super.onActivityResult(request,result,data);if(request==101&&fileCallback!=null){Uri uri=result==RESULT_OK?(data!=null&&data.getData()!=null?data.getData():cameraUri):null;fileCallback.onReceiveValue(uri==null?null:new Uri[]{uri});fileCallback=null;cameraUri=null;}if(request==102){try{ArrayList<String> words=data==null?null:data.getStringArrayListExtra(RecognizerIntent.EXTRA_RESULTS);if(result==RESULT_OK&&words!=null&&!words.isEmpty())dispatch("drishti-voice-result",new JSONObject().put("text",words.get(0)));else dispatch("drishti-voice-error",new JSONObject());}catch(Exception ignored){}}}
 @Override public void onRequestPermissionsResult(int code,String[] names,int[] results){super.onRequestPermissionsResult(code,names,results);if(code==103&&fileCallback!=null)showPhotoChooser();}
 @Override public void onBackPressed(){web.evaluateJavascript("document.querySelector('#saathi-close') ? document.querySelector('#saathi-close').click() : document.querySelector('[data-nav=dashboard]')?.click()",null);}
 @Override protected void onDestroy(){network.shutdownNow();if(fileCallback!=null)fileCallback.onReceiveValue(null);web.removeJavascriptInterface("DrishtiAndroid");web.destroy();super.onDestroy();}
}
