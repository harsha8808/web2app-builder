package {{PACKAGE_NAME}}

import androidx.multidex.MultiDexApplication

class App : MultiDexApplication() {

    lateinit var appOpenAdManager: AppOpenAdManager

    override fun onCreate() {
        super.onCreate()
        appOpenAdManager = AppOpenAdManager(this)
    }
}
