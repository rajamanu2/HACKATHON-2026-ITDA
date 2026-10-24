package in.itda.drishti;
import android.Manifest;
import android.app.Activity;
import android.content.pm.PackageManager;
import android.graphics.Color;
import android.net.Uri;
import android.os.Bundle;
import android.webkit.PermissionRequest;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.Button;
import android.widget.LinearLayout;
import android.widget.Toast;
import java.util.ArrayList;
public class ConsultationActivity extends Activity {
 private WebView web;private PermissionRequest pending;
 @Override public void onCreate(Bundle state){super.onCreate(state);String url=getIntent().getStringExtra("url");if(url==null||!"https".equals(Uri.parse(url).getScheme())||!"meet.jit.si".equals(Uri.parse(url).getHost())){finish();return;}LinearLayout layout=new LinearLayout(this);layout.setOrientation(LinearLayout.VERTICAL);layout.setFitsSystemWindows(true);layout.setBackgroundColor(Color.rgb(30,47,74));Button back=new Button(this);back.setText("← Back to patient / రోగి రికార్డు");back.setOnClickListener(v->finish());layout.addView(back,new LinearLayout.LayoutParams(-1,52));web=new WebView(this);layout.addView(web,new LinearLayout.LayoutParams(-1,0,1));setContentView(layout);WebSettings settings=web.getSettings();settings.setJavaScriptEnabled(true);settings.setDomStorageEnabled(true);settings.setAllowFileAccess(false);settings.setMediaPlaybackRequiresUserGesture(false);settings.setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);web.setWebViewClient(new WebViewClient(){@Override public boolean shouldOverrideUrlLoading(WebView view,WebResourceRequest request){Uri uri=request.getUrl();return !"https".equals(uri.getScheme())||!("meet.jit.si".equals(uri.getHost())||uri.getHost()!=null&&uri.getHost().endsWith(".jitsi.net"));}});web.setWebChromeClient(new WebChromeClient(){@Override public void onPermissionRequest(PermissionRequest request){runOnUiThread(()->{if(!"https://meet.jit.si".equals(request.getOrigin().toString().replaceAll("/+$",""))){request.deny();return;}pending=request;ArrayList<String> permissions=new ArrayList<>();if(checkSelfPermission(Manifest.permission.CAMERA)!=PackageManager.PERMISSION_GRANTED)permissions.add(Manifest.permission.CAMERA);if(checkSelfPermission(Manifest.permission.RECORD_AUDIO)!=PackageManager.PERMISSION_GRANTED)permissions.add(Manifest.permission.RECORD_AUDIO);if(!permissions.isEmpty())requestPermissions(permissions.toArray(new String[0]),201);else grantMedia();});}});web.loadUrl(url+"#config.disableDeepLinking=true");}
 private void grantMedia(){if(pending==null)return;ArrayList<String> allowed=new ArrayList<>();for(String resource:pending.getResources()){if(resource.equals(PermissionRequest.RESOURCE_VIDEO_CAPTURE)&&checkSelfPermission(Manifest.permission.CAMERA)==PackageManager.PERMISSION_GRANTED)allowed.add(resource);if(resource.equals(PermissionRequest.RESOURCE_AUDIO_CAPTURE)&&checkSelfPermission(Manifest.permission.RECORD_AUDIO)==PackageManager.PERMISSION_GRANTED)allowed.add(resource);}if(allowed.isEmpty())pending.deny();else pending.grant(allowed.toArray(new String[0]));pending=null;}
 @Override public void onRequestPermissionsResult(int code,String[] names,int[] results){super.onRequestPermissionsResult(code,names,results);if(code==201){grantMedia();Toast.makeText(this,"Camera and microphone follow your permission choices.",Toast.LENGTH_SHORT).show();}}
 @Override protected void onDestroy(){if(pending!=null)pending.deny();if(web!=null){web.loadUrl("about:blank");web.destroy();}super.onDestroy();}
}
