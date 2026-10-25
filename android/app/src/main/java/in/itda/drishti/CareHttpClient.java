package in.itda.drishti;

import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.io.IOException;
import java.net.HttpURLConnection;
import java.net.URL;
import java.net.UnknownHostException;
import java.net.SocketTimeoutException;
import java.net.ConnectException;
import java.nio.charset.StandardCharsets;
import java.util.zip.GZIPInputStream;
import javax.net.ssl.SSLException;

/** Native transport shared by API requests and the connection test. No WebView fetch/CORS. */
final class CareHttpClient {
 static final int CONNECT_TIMEOUT=15000;
 static String normalizeAddress(String value){String address=value.trim().replaceAll("/+$","");for(String suffix:new String[]{"/downloads/android","/api/health"})if(address.endsWith(suffix))return address.substring(0,address.length()-suffix.length());return address;}
 static boolean allowed(String path,String method,String body){
  return path!=null&&path.matches("/api/(auth/(login|logout|me)|ai/status|voice/(status|calls)|health|patients|patients/AD-[A-Za-z0-9-]+/(review|care|research-ai)|automation/(sync|status)|admin/(users|users/bulk|audit)|consultations)(\\?patientId=AD-[A-Za-z0-9-]+)?")
   &&("GET".equals(method)||"POST".equals(method)||"PATCH".equals(method))&&body!=null&&body.length()<=3000000;
 }
 static final class Response {
  final int status;final String body,setCookie;
  Response(int status,String body,String cookie){this.status=status;this.body=body;this.setCookie=cookie;}
 }
 static String sessionCookie(java.util.Map<String,java.util.List<String>> headers){
  for(java.util.Map.Entry<String,java.util.List<String>> header:headers.entrySet()){
   if(header.getKey()==null||!header.getKey().equalsIgnoreCase("Set-Cookie")||header.getValue()==null)continue;
   for(String value:header.getValue()){
    if(value==null)continue;
    try{for(java.net.HttpCookie parsed:java.net.HttpCookie.parse(value)){
     if(parsed.getName().equals("drishti_session"))return "drishti_session="+parsed.getValue()+(parsed.getMaxAge()>=0?"; Max-Age="+parsed.getMaxAge():"");
    }}catch(IllegalArgumentException ignored){/* Ignore an invalid unrelated proxy cookie. */}
   }
  }
  return null;
 }
 static Response request(String base,String path,String method,String body,String cookie,String csrf) throws IOException {
  if(!allowed(path,method,body))throw new IOException("Invalid app request.");
  URL url=new URL(base+path);
  boolean privateHost=url.getHost().matches("(10\\.(?:\\d{1,3}\\.){2}\\d{1,3}|192\\.168\\.\\d{1,3}\\.\\d{1,3}|172\\.(?:1[6-9]|2\\d|3[01])\\.\\d{1,3}\\.\\d{1,3}|127\\.0\\.0\\.1)");
  HttpURLConnection connection=(HttpURLConnection)(privateHost?url.openConnection(java.net.Proxy.NO_PROXY):url.openConnection());
  try{
   connection.setInstanceFollowRedirects(false);connection.setUseCaches(false);
   connection.setConnectTimeout(CONNECT_TIMEOUT);connection.setReadTimeout(path.contains("research-ai")||path.equals("/api/ai/status")?30000:20000);
   connection.setRequestMethod(method.equals("PATCH")?"POST":method);
   connection.setRequestProperty("Accept","application/json");
   connection.setRequestProperty("Accept-Encoding","identity");
   connection.setRequestProperty("Content-Type","application/json; charset=utf-8");
   connection.setRequestProperty("User-Agent","AarogyaDrishti-Android/0.3.5");
   if(cookie!=null&&!cookie.isEmpty())connection.setRequestProperty("Cookie",cookie);
   if(csrf!=null&&!csrf.isEmpty())connection.setRequestProperty("X-CSRF-Token",csrf);
   if(!method.equals("GET")){
    byte[] bytes=(body.equals("null")?"{}":body).getBytes(StandardCharsets.UTF_8);
    // Keep buffered mode: some HttpURLConnection implementations discard 401 bodies
    // in fixed-length streaming mode, hiding the actual sign-in error.
    connection.setDoOutput(true);
    try(java.io.OutputStream output=connection.getOutputStream()){output.write(bytes);}
   }
   int status=connection.getResponseCode();
   if(status>=300&&status<400)throw new IOException("Server redirected the request (HTTP "+status+"). Test the correct care-server address.");
   String type=connection.getContentType();
   if(type==null||!type.toLowerCase(java.util.Locale.ROOT).startsWith("application/json"))throw new IOException("Server returned a web page instead of the care API (HTTP "+status+"). The tunnel may have expired or the network may require sign-in.");
   InputStream raw=status>=400?connection.getErrorStream():connection.getInputStream();
   if(raw==null)throw new IOException("Server returned an empty response (HTTP "+status+").");
   try(InputStream input="gzip".equalsIgnoreCase(connection.getContentEncoding())?new GZIPInputStream(raw):raw){
    ByteArrayOutputStream buffer=new ByteArrayOutputStream();byte[] bytes=new byte[8192];int count,total=0;
    while((count=input.read(bytes))!=-1){total+=count;if(total>30000000)throw new IOException("Care record response is too large.");buffer.write(bytes,0,count);}
    return new Response(status,new String(buffer.toByteArray(),StandardCharsets.UTF_8),sessionCookie(connection.getHeaderFields()));
   }
  }finally{connection.disconnect();}
 }
 static String explain(Exception error){
  if(error instanceof UnknownHostException)return "Cannot resolve the care-server address. Check phone internet or Private DNS, then test the connection.";
  if(error instanceof SSLException)return "Secure connection failed. Check the phone date/time and Android security updates. TLS certificate verification remains enabled.";
  if(error instanceof SocketTimeoutException)return "Care-server connection timed out. Retry on a working Wi-Fi or mobile-data connection.";
  if(error instanceof ConnectException)return "Cannot connect to the care server. Check the saved address and whether the host PC is running.";
  if(error instanceof IOException&&error.getMessage()!=null&&error.getMessage().startsWith("Server "))return error.getMessage();
  return "Care-server request failed ("+error.getClass().getSimpleName()+"). Open Connect care server and run Test & connect. Offline records are preserved.";
 }
}
