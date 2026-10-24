package in.itda.drishti;
import android.content.ContentProvider;
import android.content.ContentValues;
import android.database.Cursor;
import android.database.MatrixCursor;
import android.net.Uri;
import android.os.ParcelFileDescriptor;
import android.provider.OpenableColumns;
import java.io.File;
import java.io.FileNotFoundException;
public class CameraProvider extends ContentProvider {
 @Override public boolean onCreate(){return true;}
 private File file(Uri uri) throws FileNotFoundException {String name=uri.getLastPathSegment();if(name==null||!name.matches("capture_[a-zA-Z0-9_-]+\\.jpg"))throw new FileNotFoundException();return new File(getContext().getCacheDir(),name);}
 @Override public ParcelFileDescriptor openFile(Uri uri,String mode) throws FileNotFoundException{return ParcelFileDescriptor.open(file(uri),ParcelFileDescriptor.parseMode(mode));}
 @Override public String getType(Uri uri){return "image/jpeg";}
 @Override public Cursor query(Uri uri,String[] projection,String selection,String[] args,String order){try{File file=file(uri);MatrixCursor cursor=new MatrixCursor(new String[]{OpenableColumns.DISPLAY_NAME,OpenableColumns.SIZE});cursor.addRow(new Object[]{file.getName(),file.length()});return cursor;}catch(Exception error){return null;}}
 @Override public Uri insert(Uri uri,ContentValues values){return null;}
 @Override public int update(Uri uri,ContentValues values,String where,String[] args){return 0;}
 @Override public int delete(Uri uri,String where,String[] args){return 0;}
}
