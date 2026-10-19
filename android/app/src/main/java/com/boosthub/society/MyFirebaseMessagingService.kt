package com.boosthub.society

import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.graphics.BitmapFactory
import android.media.RingtoneManager
import android.os.Build
import android.util.Log
import androidx.core.app.NotificationCompat
import androidx.core.content.ContextCompat
import com.google.firebase.messaging.FirebaseMessagingService
import com.google.firebase.messaging.RemoteMessage

class MyFirebaseMessagingService : FirebaseMessagingService() {

    companion object {
        private const val TAG = "BoostHubFCM"
        const val CHANNEL_ID = "boosthub_notifications"
        const val CHANNEL_NAME = "BoostHub Alerts"
        const val PREFS_NAME = "boosthub_prefs"
        const val KEY_FCM_TOKEN = "fcm_token"
    }

    override fun onNewToken(token: String) {
        super.onNewToken(token)
        Log.d(TAG, "New FCM Registration Token: $token")

        // Persist token in SharedPreferences so MainActivity can pass it to the WebView bridge
        val prefs = getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        prefs.edit().putString(KEY_FCM_TOKEN, token).apply()

        // Send token to backend or notify active session if needed
        sendTokenToServer(token)
    }

    override fun onMessageReceived(remoteMessage: RemoteMessage) {
        super.onMessageReceived(remoteMessage)
        Log.d(TAG, "From: ${remoteMessage.from}")

        // Check if message contains notification payload or data payload
        val title = remoteMessage.notification?.title
            ?: remoteMessage.data["title"]
            ?: getString(R.string.app_name)

        val body = remoteMessage.notification?.body
            ?: remoteMessage.data["body"]
            ?: remoteMessage.data["message"]
            ?: "You have a new update on BoostHub"

        val targetUrl = remoteMessage.data["url"] ?: ""
        val tab = remoteMessage.data["tab"] ?: ""
        val type = remoteMessage.data["type"] ?: ""
        val entityId = remoteMessage.data["entityId"] ?: ""

        sendNativeNotification(title, body, targetUrl, tab, type, entityId)
    }

    private fun sendNativeNotification(
        title: String,
        body: String,
        url: String,
        tab: String,
        type: String,
        entityId: String
    ) {
        val notificationManager =
            getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager

        // Create Android 8.0+ Notification Channel with High Importance
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                CHANNEL_ID,
                CHANNEL_NAME,
                NotificationManager.IMPORTANCE_HIGH
            ).apply {
                description = "Native push alerts for messages, capshots, and friend updates"
                enableLights(true)
                lightColor = ContextCompat.getColor(applicationContext, R.color.colorPrimary)
                enableVibration(true)
                vibrationPattern = longArrayOf(0, 250, 150, 250)
            }
            notificationManager.createNotificationChannel(channel)
        }

        // Target Intent: Opens MainActivity directly and passes deep link parameters
        val intent = Intent(this, MainActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_CLEAR_TOP or Intent.FLAG_ACTIVITY_SINGLE_TOP
            putExtra("url", url)
            putExtra("tab", tab)
            putExtra("type", type)
            putExtra("entityId", entityId)
        }

        val pendingIntentFlags = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        } else {
            PendingIntent.FLAG_UPDATE_CURRENT
        }

        val notificationId = (System.currentTimeMillis() % 100000).toInt()
        val pendingIntent = PendingIntent.getActivity(this, notificationId, intent, pendingIntentFlags)

        val defaultSoundUri = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_NOTIFICATION)

        val notificationBuilder = NotificationCompat.Builder(this, CHANNEL_ID)
            .setSmallIcon(R.drawable.ic_alerts)
            .setLargeIcon(BitmapFactory.decodeResource(resources, R.drawable.ic_boosthub_logo))
            .setContentTitle(title)
            .setContentText(body)
            .setStyle(NotificationCompat.BigTextStyle().bigText(body))
            .setAutoCancel(true)
            .setSound(defaultSoundUri)
            .setVibrate(longArrayOf(0, 250, 150, 250))
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .setCategory(NotificationCompat.CATEGORY_MESSAGE)
            .setColor(ContextCompat.getColor(this, R.color.colorPrimary))
            .setContentIntent(pendingIntent)

        notificationManager.notify(notificationId, notificationBuilder.build())
    }

    private fun sendTokenToServer(token: String) {
        // Can be forwarded to BoostHub backend or logged
        Log.i(TAG, "FCM token ready for backend registration: $token")
    }
}
