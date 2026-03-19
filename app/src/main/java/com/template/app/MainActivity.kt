package {{PACKAGE_NAME}}

import android.annotation.SuppressLint
import android.content.Intent
import android.net.ConnectivityManager
import android.net.NetworkCapabilities
import android.net.Uri
import android.os.Bundle
import android.view.View
import android.webkit.*
import androidx.appcompat.app.AppCompatActivity
import com.google.android.gms.ads.*
import com.google.android.gms.ads.appopen.AppOpenAd
import com.google.android.gms.ads.interstitial.InterstitialAd
import com.google.android.gms.ads.interstitial.InterstitialAdLoadCallback
import com.google.android.gms.ads.rewarded.RewardedAd
import com.google.android.gms.ads.rewarded.RewardedAdLoadCallback
import {{PACKAGE_NAME}}.databinding.ActivityMainBinding

class MainActivity : AppCompatActivity() {

    private lateinit var binding: ActivityMainBinding

    private var interstitialAd: InterstitialAd? = null
    private var rewardedAd: RewardedAd? = null
    private var pageLoadCount = 0

    // ── Injected constants ────────────────────────────────────────────────
    private val websiteUrl           = "{{WEBSITE_URL}}"
    private val bannerUnitId         = "{{BANNER_UNIT_ID}}"
    private val interstitialUnitId   = "{{INTERSTITIAL_UNIT_ID}}"
    private val rewardedUnitId       = "{{REWARDED_UNIT_ID}}"
    private val interstitialFreq     = {{INTERSTITIAL_FREQUENCY}}

    private val enableBanner         = "{{ENABLE_BANNER}}"         == "true"
    private val enableInterstitial   = "{{ENABLE_INTERSTITIAL}}"   == "true"
    private val enableRewarded       = "{{ENABLE_REWARDED}}"       == "true"
    private val enablePullToRefresh  = "{{ENABLE_PULL_TO_REFRESH}}"== "true"
    private val enableProgressBar    = "{{ENABLE_PROGRESS_BAR}}"   == "true"
    private val enableOfflinePage    = "{{ENABLE_OFFLINE_PAGE}}"   == "true"

    // ── Lifecycle ─────────────────────────────────────────────────────────

    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityMainBinding.inflate(layoutInflater)
        setContentView(binding.root)

        MobileAds.initialize(this)

        setupWebView()
        setupSwipeRefresh()
        setupProgressBar()

        if (enableBanner)       setupBannerAd()
        if (enableInterstitial) loadInterstitialAd()
        if (enableRewarded) {
            loadRewardedAd()
            binding.webView.addJavascriptInterface(AdJsBridge(), "UnbeatedAds")
        }

        // Handle deep link URL from push notification tap
        val launchUrl = intent.getStringExtra("push_url") ?: websiteUrl
        binding.webView.loadUrl(launchUrl)
    }

    override fun onNewIntent(intent: Intent?) {
        super.onNewIntent(intent)
        intent?.getStringExtra("push_url")?.let {
            binding.webView.loadUrl(it)
        }
    }

    // ── WebView ────────────────────────────────────────────────────────────

    private fun setupWebView() {
        binding.webView.settings.apply {
            javaScriptEnabled        = true
            domStorageEnabled        = true
            loadWithOverviewMode     = true
            useWideViewPort          = true
            setSupportZoom(false)
            builtInZoomControls      = false
            displayZoomControls      = false
            mixedContentMode         = WebSettings.MIXED_CONTENT_COMPATIBILITY_MODE
            cacheMode                = WebSettings.LOAD_DEFAULT
            mediaPlaybackRequiresUserGesture = false
        }

        binding.webView.webViewClient = object : WebViewClient() {

            override fun onPageFinished(view: WebView, url: String) {
                binding.swipeRefresh.isRefreshing = false
                pageLoadCount++
                if (enableInterstitial && pageLoadCount % interstitialFreq == 0) {
                    showInterstitialAd()
                }
            }

            override fun onReceivedError(
                view: WebView,
                request: WebResourceRequest,
                error: WebResourceError
            ) {
                if (enableOfflinePage && request.isForMainFrame && !isConnected()) {
                    view.loadUrl("file:///android_asset/offline.html")
                }
            }

            // Keep same-domain links in WebView; open external links in browser
            override fun shouldOverrideUrlLoading(
                view: WebView,
                request: WebResourceRequest
            ): Boolean {
                val reqHost  = request.url.host ?: return false
                val siteHost = Uri.parse(websiteUrl).host ?: return false
                return if (reqHost == siteHost || reqHost.endsWith(".$siteHost")) {
                    false // load in WebView
                } else {
                    startActivity(Intent(Intent.ACTION_VIEW, request.url))
                    true  // handled externally
                }
            }
        }

        binding.webView.webChromeClient = object : WebChromeClient() {
            override fun onProgressChanged(view: WebView, newProgress: Int) {
                if (!enableProgressBar) return
                binding.progressBar.progress = newProgress
                binding.progressBar.visibility =
                    if (newProgress < 100) View.VISIBLE else View.GONE
            }
        }
    }

    private fun setupSwipeRefresh() {
        binding.swipeRefresh.isEnabled = enablePullToRefresh
        binding.swipeRefresh.setOnRefreshListener { binding.webView.reload() }
        binding.swipeRefresh.setColorSchemeColors(
            getColor(R.color.colorPrimary)
        )
    }

    private fun setupProgressBar() {
        binding.progressBar.visibility = if (enableProgressBar) View.VISIBLE else View.GONE
    }

    // ── AdMob: Banner ──────────────────────────────────────────────────────

    private fun setupBannerAd() {
        binding.bannerAdView.visibility = View.VISIBLE
        binding.bannerAdView.adUnitId   = bannerUnitId
        binding.bannerAdView.setAdSize(AdSize.BANNER)
        binding.bannerAdView.loadAd(AdRequest.Builder().build())
    }

    // ── AdMob: Interstitial ────────────────────────────────────────────────

    private fun loadInterstitialAd() {
        InterstitialAd.load(
            this, interstitialUnitId, AdRequest.Builder().build(),
            object : InterstitialAdLoadCallback() {
                override fun onAdLoaded(ad: InterstitialAd) {
                    interstitialAd = ad
                }
                override fun onAdFailedToLoad(err: LoadAdError) {
                    interstitialAd = null
                    binding.webView.postDelayed({ loadInterstitialAd() }, 30_000)
                }
            }
        )
    }

    private fun showInterstitialAd() {
        interstitialAd?.show(this)
        interstitialAd = null
        loadInterstitialAd()
    }

    // ── AdMob: Rewarded ────────────────────────────────────────────────────

    private fun loadRewardedAd() {
        RewardedAd.load(
            this, rewardedUnitId, AdRequest.Builder().build(),
            object : RewardedAdLoadCallback() {
                override fun onAdLoaded(ad: RewardedAd) { rewardedAd = ad }
                override fun onAdFailedToLoad(err: LoadAdError) { rewardedAd = null }
            }
        )
    }

    fun showRewardedAd(onRewarded: () -> Unit) {
        rewardedAd?.show(this) {
            onRewarded()
            loadRewardedAd()
        } ?: run { onRewarded() } // fallback: grant reward even if no ad loaded
    }

    // ── JS Bridge ─────────────────────────────────────────────────────────

    inner class AdJsBridge {
        @android.webkit.JavascriptInterface
        fun showRewardedAd() {
            runOnUiThread {
                this@MainActivity.showRewardedAd {
                    binding.webView.evaluateJavascript(
                        "window.onRewardEarned && window.onRewardEarned()", null
                    )
                }
            }
        }

        @android.webkit.JavascriptInterface
        fun isAdReady(): Boolean = rewardedAd != null
    }

    // ── Helpers ───────────────────────────────────────────────────────────

    private fun isConnected(): Boolean {
        val cm  = getSystemService(CONNECTIVITY_SERVICE) as ConnectivityManager
        val cap = cm.getNetworkCapabilities(cm.activeNetwork) ?: return false
        return cap.hasCapability(NetworkCapabilities.NET_CAPABILITY_INTERNET)
    }

    override fun onBackPressed() {
        if (binding.webView.canGoBack()) binding.webView.goBack()
        else super.onBackPressed()
    }

    override fun onPause()   { super.onPause();  binding.bannerAdView.pause() }
    override fun onResume()  { super.onResume(); binding.bannerAdView.resume() }
    override fun onDestroy() { super.onDestroy(); binding.bannerAdView.destroy() }
}
