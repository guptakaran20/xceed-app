package in.ac.nitj.xceed.learning;

import android.Manifest;
import android.app.DownloadManager;
import android.content.Context;
import android.net.Uri;
import android.os.Build;
import android.os.Environment;
import android.webkit.URLUtil;

import com.getcapacitor.JSObject;
import com.getcapacitor.PermissionState;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;
import com.getcapacitor.annotation.PermissionCallback;

import java.net.URLConnection;
import java.util.Iterator;

/**
 * Sends downloads to Android's system DownloadManager.  The system manager
 * streams directly to the public Downloads folder, so files are not held in
 * the WebView or app cache and continue when the app is backgrounded.
 */
@CapacitorPlugin(
    name = "Downloads",
    permissions = {
        @Permission(alias = "legacyStorage", strings = { Manifest.permission.WRITE_EXTERNAL_STORAGE })
    }
)
public class DownloadsPlugin extends Plugin {

    @PluginMethod
    public void download(PluginCall call) {
        // Android 10 and above lets DownloadManager write to public Downloads
        // without storage permission. Android 9 and older still need it.
        if (Build.VERSION.SDK_INT <= Build.VERSION_CODES.P &&
            getPermissionState("legacyStorage") != PermissionState.GRANTED) {
            requestPermissionForAlias("legacyStorage", call, "downloadAfterStoragePermission");
            return;
        }

        enqueueDownload(call);
    }

    @PermissionCallback
    private void downloadAfterStoragePermission(PluginCall call) {
        if (getPermissionState("legacyStorage") != PermissionState.GRANTED) {
            call.reject("Storage permission is required to save downloads on this Android version.");
            return;
        }
        enqueueDownload(call);
    }

    private void enqueueDownload(PluginCall call) {
        String url = call.getString("url");
        String requestedFileName = call.getString("fileName");
        if (url == null || url.trim().isEmpty()) {
            call.reject("A download URL is required.");
            return;
        }

        String fileName = safeFileName(requestedFileName, url);
        DownloadManager.Request request = new DownloadManager.Request(Uri.parse(url));
        request.setTitle(fileName);
        request.setDescription("Downloading " + fileName);
        request.setNotificationVisibility(DownloadManager.Request.VISIBILITY_VISIBLE_NOTIFY_COMPLETED);
        request.setAllowedOverMetered(true);
        request.setAllowedOverRoaming(true);
        request.setMimeType(URLConnection.guessContentTypeFromName(fileName));
        request.setDestinationInExternalPublicDir(Environment.DIRECTORY_DOWNLOADS, fileName);

        JSObject headers = call.getObject("headers");
        if (headers != null) {
            for (Iterator<String> names = headers.keys(); names.hasNext();) {
                String name = names.next();
                String value = headers.optString(name, null);
                if (value != null && !value.isEmpty()) request.addRequestHeader(name, value);
            }
        }

        DownloadManager manager = (DownloadManager) getContext().getSystemService(Context.DOWNLOAD_SERVICE);
        if (manager == null) {
            call.reject("Android's download service is unavailable.");
            return;
        }

        long id = manager.enqueue(request);
        JSObject result = new JSObject();
        result.put("id", id);
        result.put("fileName", fileName);
        result.put("location", "Downloads/" + fileName);
        call.resolve(result);
    }

    private String safeFileName(String requestedFileName, String url) {
        String fallback = URLUtil.guessFileName(url, null, null);
        String fileName = requestedFileName == null || requestedFileName.trim().isEmpty() ? fallback : requestedFileName;
        // A filename only: never allow a server response to construct a path.
        fileName = fileName.replaceAll("[\\\\/:*?\"<>|]", "_").trim();
        return fileName.isEmpty() ? "download" : fileName;
    }
}
