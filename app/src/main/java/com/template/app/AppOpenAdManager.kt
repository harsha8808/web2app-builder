package {{PACKAGE_NAME}}

import android.app.Activity
import android.app.Application
import android.content.Context
import android.os.Bundle
import com.google.android.gms.ads.AdError
import com.google.android.gms.ads.AdRequest
import com.google.android.gms.ads.FullScreenContentCallback
import com.google.android.gms.ads.LoadAdError
import com.google.android.gms.ads.appopen.AppOpenAd

private const val APP_OPEN_UNIT_ID = "{{APP_OPEN_UNIT_ID}}"
private val ENABLE_APP_OPEN        = "{{ENABLE_APP_OPEN}}" == "true"

class AppOpenAdManager(private val context: Context) : Application.ActivityLifecycleCallbacks {

    private var appOpenAd: AppOpenAd? = null
    private var isShowingAd = false
    private var currentActivity: Activity? = null
    private var isAppInForeground = false

    init {
        if (ENABLE_APP_OPEN) {
            (context.applicationContext as Application)
                .registerActivityLifecycleCallbacks(this)
            loadAd()
        }
    }

    private fun loadAd() {
        if (!ENABLE_APP_OPEN) return
        AppOpenAd.load(
            context, APP_OPEN_UNIT_ID, AdRequest.Builder().build(),
            AppOpenAd.APP_OPEN_AD_ORIENTATION_PORTRAIT,
            object : AppOpenAd.AppOpenAdLoadCallback() {
                override fun onAdLoaded(ad: AppOpenAd) { appOpenAd = ad }
                override fun onAdFailedToLoad(err: LoadAdError) { appOpenAd = null }
            }
        )
    }

    private fun showAdIfAvailable(activity: Activity) {
        if (isShowingAd || appOpenAd == null) return
        if (activity is SplashActivity) return

        isShowingAd = true
        appOpenAd?.fullScreenContentCallback = object : FullScreenContentCallback() {
            override fun onAdDismissedFullScreenContent() {
                appOpenAd = null
                isShowingAd = false
                loadAd()
            }
            override fun onAdFailedToShowFullScreenContent(err: AdError) {
                appOpenAd = null
                isShowingAd = false
            }
        }
        appOpenAd?.show(activity)
    }

    override fun onActivityResumed(activity: Activity) {
        currentActivity = activity
        if (isAppInForeground) {
            showAdIfAvailable(activity)
        }
        isAppInForeground = true
    }

    override fun onActivityPaused(activity: Activity)   { currentActivity = null }
    override fun onActivityCreated(activity: Activity, savedInstanceState: Bundle?) {}
    override fun onActivityStarted(activity: Activity)  {}
    override fun onActivityStopped(activity: Activity)  {}
    override fun onActivitySaveInstanceState(activity: Activity, outState: Bundle) {}
    override fun onActivityDestroyed(activity: Activity) {}
}
