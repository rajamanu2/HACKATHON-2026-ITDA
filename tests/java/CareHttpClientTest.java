package in.itda.drishti;
import com.sun.net.httpserver.HttpServer;
import java.net.InetSocketAddress;
import java.nio.charset.StandardCharsets;
import java.util.concurrent.atomic.AtomicReference;
import java.util.zip.GZIPOutputStream;
import java.io.ByteArrayOutputStream;

public final class CareHttpClientTest {
 static void check(boolean condition,String message){if(!condition)throw new AssertionError(message);}
 public static void main(String[] args)throws Exception{
  AtomicReference<String> mode=new AtomicReference<>("json");
  HttpServer server=HttpServer.create(new InetSocketAddress("127.0.0.1",0),0);
  server.createContext("/api/",exchange->{try{
   String path=exchange.getRequestURI().getPath();String json="{\"ok\":true,\"instanceId\":\"test-only\"}";int status=200;
   if(path.equals("/api/auth/login")){
    check(exchange.getRequestMethod().equals("POST"),"POST retained");
    check(new String(exchange.getRequestBody().readAllBytes(),StandardCharsets.UTF_8).equals("{\"name\":\"తెలుగు\"}"),"UTF-8 body retained");
    check("application/json".equals(exchange.getRequestHeaders().getFirst("Accept")),"Accept JSON");
    check("fixture-cookie".equals(exchange.getRequestHeaders().getFirst("Cookie")),"Cookie header retained");
    check("fixture-csrf".equals(exchange.getRequestHeaders().getFirst("X-CSRF-Token")),"CSRF header retained");
    status=401;json="{\"error\":\"Invalid test account\"}";
   }
   if(path.endsWith("/review"))check(exchange.getRequestMethod().equals("POST"),"PATCH uses supported POST alias");
   if(mode.get().equals("redirect")){exchange.getResponseHeaders().set("Location","/outside");exchange.sendResponseHeaders(302,-1);return;}
   // A cloud proxy can append another cookie after the application's session.
   exchange.getResponseHeaders().add("Set-Cookie","drishti_session=fixture-session; HttpOnly; Path=/; Max-Age=43200");
   exchange.getResponseHeaders().add("Set-Cookie","__cf_bm=fixture-proxy-cookie; HttpOnly; Path=/");
   byte[] bytes=json.getBytes(StandardCharsets.UTF_8);exchange.getResponseHeaders().set("Content-Type",mode.get().equals("html")?"text/html":"application/json; charset=utf-8");
   if(mode.get().equals("gzip")){ByteArrayOutputStream out=new ByteArrayOutputStream();try(GZIPOutputStream gzip=new GZIPOutputStream(out)){gzip.write(bytes);}bytes=out.toByteArray();exchange.getResponseHeaders().set("Content-Encoding","gzip");}
   exchange.sendResponseHeaders(status,bytes.length);exchange.getResponseBody().write(bytes);
  }finally{exchange.close();}});
  server.start();String base="http://127.0.0.1:"+server.getAddress().getPort();
  try{
   CareHttpClient.Response health=CareHttpClient.request(base,"/api/health","GET","null","","");
   check(health.status==200,"health request");
   check(health.setCookie!=null&&health.setCookie.startsWith("drishti_session=fixture-session;"),"app session selected when Cloudflare also sets a cookie");
   check(CareHttpClient.sessionCookie(java.util.Map.of("set-cookie",java.util.List.of("__cf_bm=proxy-only; Max-Age=0")))==null,"proxy-only response cannot replace or clear app session");
   check(CareHttpClient.sessionCookie(java.util.Map.of("Set-Cookie",java.util.List.of("drishti_session=; Max-Age=0","__cf_bm=proxy"))).contains("Max-Age=0"),"app logout cookie retained");
   check(CareHttpClient.sessionCookie(java.util.Map.of("Set-Cookie",java.util.List.of("__cf_bm=proxy","drishti_session=reverse; Max-Age=43200"))).startsWith("drishti_session=reverse"),"both header orders supported");
   check(CareHttpClient.request(base,"/api/auth/login","POST","{\"name\":\"తెలుగు\"}","fixture-cookie","fixture-csrf").status==401,"HTTP 401 stays an auth error");
   CareHttpClient.request(base,"/api/patients/AD-TEST/review","PATCH","{}","","");
   mode.set("gzip");check(CareHttpClient.request(base,"/api/health","GET","null","","").body.contains("instanceId"),"gzip decoded");
   for(String modeName:new String[]{"html","redirect"}){mode.set(modeName);boolean rejected=false;try{CareHttpClient.request(base,"/api/health","GET","null","","");}catch(java.io.IOException error){rejected=true;check(CareHttpClient.explain(error).startsWith("Server "),"useful proxy error");}check(rejected,"reject "+modeName);}
   check(!CareHttpClient.allowed("/api/../private","GET","null"),"route traversal rejected");
   check(!CareHttpClient.allowed("/api/health","DELETE","null"),"method rejected");
   check(CareHttpClient.allowed("/api/consultations?patientId=AD-TEST","GET","null"),"consultation query allowed");
   check(CareHttpClient.normalizeAddress(" https://care.example/downloads/android/ ").equals("https://care.example"),"download URL normalized");
   check(CareHttpClient.explain(new java.net.UnknownHostException()).contains("resolve"),"DNS error distinguished");
   check(CareHttpClient.explain(new javax.net.ssl.SSLException("fixture")).contains("Secure connection"),"TLS error distinguished");
   System.out.println("PASS: actual Java transport, UTF-8 POST, auth status, cookie/CSRF headers, PATCH alias, gzip, HTML/redirect rejection, URL normalization and error categories.");
   if(args.length>0){mode.set("json");ResponseCheck(args[0]);}
  }finally{server.stop(0);}
 }
 static void ResponseCheck(String publicBase)throws Exception{CareHttpClient.Response response=CareHttpClient.request(publicBase,"/api/health","GET","null","","");check(response.status==200&&response.body.contains("instanceId"),"anonymous public health");System.out.println("PASS: anonymous public health through the same Java transport (desktop JVM; handset not verified).");}
}
