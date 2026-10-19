package com.boosthub.society

import android.Manifest
import android.annotation.SuppressLint
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.graphics.Bitmap
import android.net.ConnectivityManager
import android.net.NetworkCapabilities
import android.os.Build
import android.os.Bundle
import android.view.View
import android.webkit.WebChromeClient
import android.webkit.WebResourceError
import android.webkit.WebResourceRequest
import android.webkit.WebSettings
import android.webkit.WebView
import android.webkit.WebViewClient
import android.widget.Toast
import androidx.activity.OnBackPressedCallback
import androidx.activity.result.contract.ActivityResultContracts
import androidx.appcompat.app.AppCompatActivity
import androidx.core.content.ContextCompat
import com.boosthub.society.databinding.ActivityMainBinding
import com.google.firebase.messaging.FirebaseMessaging

class MainActivity : AppCompatActivity() {

    private lateinit var binding: ActivityMainBinding
    private val baseUrl = "https://princeabba96-byte.github.io/boosthub/"
    private var backPressedTime: Long = 0
    private var isPageLoadedSuccessfully = false

    // Request notification permission on Android 13+ (API 33+)
    private val requestNotificationPermissionLauncher =
        registerForActivityResult(ActivityResultContracts.RequestPermission()) { isGranted ->
            if (isGranted) {
                fetchAndStoreFcmToken()
            }
        }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        // 1. Inflate Native UI immediately (Native toolbar, bottom nav, offline screen)
        binding = ActivityMainBinding.inflate(layoutInflater)
        setContentView(binding.root)

        // 2. Setup Native Toolbar
        setupNativeToolbar()

        // 3. Setup Native Bottom Navigation View (5 exact items from website)
        setupNativeBottomNavigation()

        // 4. Setup Native Pull-to-Refresh
        setupPullToRefresh()

        // 5. Setup Native Offline Retry Button
        binding.btnRetryConnection.setOnClickListener {
            checkNetworkAndLoad(loadUrl = true)
        }

        // 6. Setup Hybrid WebView with Zoom Controls Disabled & JS Interface
        setupWebView()

        // 7. Setup Native Back Button Handling
        setupBackNavigation()

        // 8. Request Push Notification Permission (Android 13+) & Init FCM
        initPushNotifications()

        // 9. Process any deep links or notification intents
        handleIncomingIntent(intent)

        // 10. Check network and initiate load
        checkNetworkAndLoad(loadUrl = true)
    }

    override fun onNewIntent(intent: Intent) {
        super.onNewIntent(intent)
        setIntent(intent)
        handleIncomingIntent(intent)
    }

    private fun setupNativeToolbar() {
        binding.btnNativeRefresh.setOnClickListener {
            binding.pageLoadProgress.visibility = View.VISIBLE
            binding.webView.reload()
        }
    }

    private fun setupNativeBottomNavigation() {
        binding.bottomNavigation.setOnItemSelectedListener { item ->
            when (item.itemId) {
                R.id.navigation_home -> {
                    navigateToTab("home")
                    true
                }
                R.id.navigation_capshots -> {
                    navigateToTab("capshots")
                    true
                }
                R.id.navigation_friends -> {
                    navigateToTab("friends")
                    true
                }
                R.id.navigation_alerts -> {
                    navigateToTab("notifications")
                    true
                }
                R.id.navigation_menu -> {
                    navigateToTab("menu")
                    true
                }
                else -> false
            }
        }
    }

    /**
     * Navigates to a specific website tab smoothly via JS bridge or direct URL load
     */
    fun navigateToTab(tabName: String) {
        if (!isNetworkAvailable()) {
            showOfflineScreen()
            return
        }

        // If webview is already loaded on BoostHub, call JavaScript navigation directly
        val jsNav = "if (typeof window.navigateToTab === 'function') { " +
                "window.navigateToTab('$tabName'); " +
                "} else { " +
                "window.dispatchEvent(new CustomEvent('boosthub:nav', { detail: { tab: '$tabName' } })); " +
                "window.location.search = '?tab=$tabName'; " +
                "}"

        binding.webView.evaluateJavascript(jsNav) { result ->
            // If the evaluate failed or returned null/undefined and current URL is not baseUrl, load URL
            val currentUrl = binding.webView.url ?: ""
            if (!currentUrl.contains("princeabba96-byte.github.io/boosthub")) {
                binding.webView.loadUrl("$baseUrl?tab=$tabName")
            }
        }
    }

    /**
     * Called by WebAppInterface when user changes tab inside the web view
     */
    fun syncBottomNavSelection(tabName: String) {
        val targetId = when (tabName.lowercase()) {
            "home" -> R.id.navigation_home
            "capshots" -> R.id.navigation_capshots
            "friends" -> R.id.navigation_friends
            "notifications", "alerts" -> R.id.navigation_alerts
            "menu", "me" -> R.id.navigation_menu
            else -> null
        }
        if (targetId != null && binding.bottomNavigation.selectedItemId != targetId) {
            binding.bottomNavigation.menu.findItem(targetId)?.isChecked = true
        }
    }

    private fun setupPullToRefresh() {
        binding.swipeRefresh.setColorSchemeColors(
            ContextCompat.getColor(this, R.color.colorPrimary),
            ContextCompat.getColor(this, R.color.colorAccent)
        )
        binding.swipeRefresh.setProgressBackgroundColorSchemeColor(
            ContextCompat.getColor(this, R.color.colorSurfaceElevated)
        )
        binding.swipeRefresh.setOnRefreshListener {
            if (isNetworkAvailable()) {
                binding.webView.reload()
            } else {
                binding.swipeRefresh.isRefreshing = false
                showOfflineScreen()
            }
        }
    }

    @SuppressLint("SetJavaScriptEnabled")
    private fun setupWebView() {
        val settings: WebSettings = binding.webView.settings
        settings.apply {
            javaScriptEnabled = true
            domStorageEnabled = true
            databaseEnabled = true
            allowFileAccess = false
            allowContentAccess = true

            // Crucial: Disable all WebView zooming so tapping repeatedly stays 100% steady
            setSupportZoom(false)
            builtInZoomControls = false
            displayZoomControls = false

            useWideViewPort = true
            loadWithOverviewMode = true
            mixedContentMode = WebSettings.MIXED_CONTENT_ALWAYS_ALLOW
            cacheMode = WebSettings.LOAD_DEFAULT
            userAgentString = "${settings.userAgentString} BoostHubHybrid/2.0"
        }

        // Add JavaScript Interface Bridge
        binding.webView.addJavascriptInterface(WebAppInterface(this), "AndroidInterface")

        binding.webView.webViewClient = object : WebViewClient() {
            override fun onPageStarted(view: WebView?, url: String?, favicon: Bitmap?) {
                super.onPageStarted(view, url, favicon)
                binding.pageLoadProgress.visibility = View.VISIBLE
            }

            override fun onPageFinished(view: WebView?, url: String?) {
                super.onPageFinished(view, url)
                binding.pageLoadProgress.visibility = View.GONE
                binding.swipeRefresh.isRefreshing = false
                binding.nativeLoadingOverlay.visibility = View.GONE
                isPageLoadedSuccessfully = true

                // Send stored FCM token to web session once page is ready
                sendFcmTokenToWebView()
            }

            override fun onReceivedError(
                view: WebView?,
                request: WebResourceRequest?,
                error: WebResourceError?
            ) {
                super.onReceivedError(view, request, error)
                if (request?.isForMainFrame == true) {
                    binding.pageLoadProgress.visibility = View.GONE
                    binding.swipeRefresh.isRefreshing = false
                    binding.nativeLoadingOverlay.visibility = View.GONE
                    showOfflineScreen()
                }
            }

            override fun shouldOverrideUrlLoading(
                view: WebView?,
                request: WebResourceRequest?
            ): Boolean {
                val url = request?.url?.toString() ?: return false
                // Keep BoostHub URLs inside the native hybrid WebView
                return if (url.contains("princeabba96-byte.github.io/boosthub") || url.startsWith("boosthub://")) {
                    false
                } else {
                    // Open external links safely via system browser
                    try {
                        val browserIntent = Intent(Intent.ACTION_VIEW, request.url)
                        startActivity(browserIntent)
                        true
                    } catch (e: Exception) {
                        false
                    }
                }
            }
        }

        binding.webView.webChromeClient = object : WebChromeClient() {
            override fun onProgressChanged(view: WebView?, newProgress: Int) {
                super.onProgressChanged(view, newProgress)
                binding.pageLoadProgress.progress = newProgress
                if (newProgress >= 100) {
                    binding.pageLoadProgress.visibility = View.GONE
                    binding.nativeLoadingOverlay.visibility = View.GONE
                } else {
                    binding.pageLoadProgress.visibility = View.VISIBLE
                }
            }
        }
    }

    private fun setupBackNavigation() {
        onBackPressedDispatcher.addCallback(this, object : OnBackPressedCallback(true) {
            override fun handleOnBackPressed() {
                if (binding.webView.canGoBack()) {
                    binding.webView.goBack()
                } else {
                    val currentTime = System.currentTimeMillis()
                    if (currentTime - backPressedTime < 2000) {
                        isEnabled = false
                        onBackPressedDispatcher.onBackPressed()
                    } else {
                        backPressedTime = currentTime
                        Toast.makeText(
                            this@MainActivity,
                            getString(R.string.toast_back_exit),
                            Toast.LENGTH_SHORT
                        ).show()
                    }
                }
            }
        })
    }

    private fun checkNetworkAndLoad(loadUrl: Boolean) {
        if (isNetworkAvailable()) {
            binding.layoutOffline.visibility = View.GONE
            binding.swipeRefresh.visibility = View.VISIBLE
            if (loadUrl) {
                binding.nativeLoadingOverlay.visibility = View.VISIBLE
                binding.webView.loadUrl(baseUrl)
            }
        } else {
            showOfflineScreen()
        }
    }

    private fun showOfflineScreen() {
        binding.swipeRefresh.visibility = View.GONE
        binding.nativeLoadingOverlay.visibility = View.GONE
        binding.layoutOffline.visibility = View.VISIBLE
    }

    private fun isNetworkAvailable(): Boolean {
        val connectivityManager =
            getSystemService(Context.CONNECTIVITY_SERVICE) as ConnectivityManager
        val activeNetwork = connectivityManager.activeNetwork ?: return false
        val capabilities =
            connectivityManager.getNetworkCapabilities(activeNetwork) ?: return false
        return capabilities.hasCapability(NetworkCapabilities.NET_CAPABILITY_INTERNET)
    }

    private fun initPushNotifications() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            if (ContextCompat.checkSelfPermission(
                    this,
                    Manifest.permission.POST_NOTIFICATIONS
                ) != PackageManager.PERMISSION_GRANTED
            ) {
                requestNotificationPermissionLauncher.launch(Manifest.permission.POST_NOTIFICATIONS)
            } else {
                fetchAndStoreFcmToken()
            }
        } else {
            fetchAndStoreFcmToken()
        }
    }

    private fun fetchAndStoreFcmToken() {
        FirebaseMessaging.getInstance().token.addOnCompleteListener { task ->
            if (task.isSuccessful && task.result != null) {
                val token = task.result
                val prefs = getSharedPreferences(
                    MyFirebaseMessagingService.PREFS_NAME,
                    Context.MODE_PRIVATE
                )
                prefs.edit().putString(MyFirebaseMessagingService.KEY_FCM_TOKEN, token).apply()
                sendFcmTokenToWebView()
            }
        }
    }

    private fun sendFcmTokenToWebView() {
        val prefs = getSharedPreferences(
            MyFirebaseMessagingService.PREFS_NAME,
            Context.MODE_PRIVATE
        )
        val token = prefs.getString(MyFirebaseMessagingService.KEY_FCM_TOKEN, "") ?: ""
        if (token.isNotEmpty()) {
            val js = "if (typeof window.onNativeFcmTokenReceived === 'function') { " +
                    "window.onNativeFcmTokenReceived('$token'); " +
                    "}"
            binding.webView.evaluateJavascript(js, null)
        }
    }

    private fun handleIncomingIntent(intent: Intent?) {
        val targetTab = intent?.getStringExtra("tab")
        val targetUrl = intent?.getStringExtra("url")

        if (!targetTab.isNullOrEmpty()) {
            navigateToTab(targetTab)
            syncBottomNavSelection(targetTab)
        } else if (!targetUrl.isNullOrEmpty() && targetUrl.startsWith("http")) {
            binding.webView.loadUrl(targetUrl)
        }
    }
}
