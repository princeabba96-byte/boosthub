package com.boosthub.society

import android.content.Context
import android.content.Intent
import android.webkit.JavascriptInterface
import android.widget.Toast

class WebAppInterface(
    private val activity: MainActivity
) {

    @JavascriptInterface
    fun isNativeApp(): Boolean {
        return true
    }

    @JavascriptInterface
    fun getFcmToken(): String {
        val prefs = activity.getSharedPreferences(
            MyFirebaseMessagingService.PREFS_NAME,
            Context.MODE_PRIVATE
        )
        return prefs.getString(MyFirebaseMessagingService.KEY_FCM_TOKEN, "") ?: ""
    }

    @JavascriptInterface
    fun onTabChanged(tab: String) {
        activity.runOnUiThread {
            activity.syncBottomNavSelection(tab)
        }
    }

    @JavascriptInterface
    fun showToast(message: String) {
        activity.runOnUiThread {
            Toast.makeText(activity, message, Toast.LENGTH_SHORT).show()
        }
    }

    @JavascriptInterface
    fun shareText(title: String, text: String, url: String) {
        activity.runOnUiThread {
            val shareIntent = Intent(Intent.ACTION_SEND).apply {
                type = "text/plain"
                putExtra(Intent.EXTRA_SUBJECT, title)
                putExtra(Intent.EXTRA_TEXT, if (url.isNotEmpty()) "$text\n$url" else text)
            }
            activity.startActivity(Intent.createChooser(shareIntent, "Share via"))
        }
    }
}
