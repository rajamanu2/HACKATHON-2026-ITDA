package in.itda.drishti;
import java.nio.charset.StandardCharsets;
import java.util.regex.Pattern;
/** Read the login JSON on stdin; never print credentials or session values. */
public final class CareCloudLoginTest {
 public static void main(String[] args)throws Exception{
  if(args.length!=1||!args[0].equals("https://aarogya-drishti-care-hackathon.dodavidokolo.chatgpt.site"))throw new IllegalArgumentException("Use the approved cloud origin.");
  String login=new String(System.in.readAllBytes(),StandardCharsets.UTF_8);
  CareHttpClient.Response response=CareHttpClient.request(args[0],"/api/auth/login","POST",login,"","");
  if(response.status!=200)throw new AssertionError("Cloud login HTTP "+response.status);
  if(response.setCookie==null||!response.setCookie.startsWith("drishti_session="))throw new AssertionError("App session cookie missing");
  String savedCookie=response.setCookie.split(";",2)[0];
  java.util.regex.Matcher match=Pattern.compile("\"csrf\":\"([^\"]+)\"").matcher(response.body);
  if(!match.find())throw new AssertionError("CSRF token missing");String csrf=match.group(1);
  try{
   if(CareHttpClient.request(args[0],"/api/auth/me","GET","null",savedCookie,"").status!=200)throw new AssertionError("Saved session not recognized");
   if(CareHttpClient.request(args[0],"/api/patients","GET","null",savedCookie,"").status!=200)throw new AssertionError("Workspace request rejected");
   System.out.println("PASS: actual native Java cloud login, correct app cookie, session recovery and authenticated workspace request. No credential values logged. Desktop JVM; handset acceptance remains unverified.");
  }finally{CareHttpClient.request(args[0],"/api/auth/logout","POST","{}",savedCookie,csrf);}
 }
}
