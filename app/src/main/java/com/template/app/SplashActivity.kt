package {{PACKAGE_NAME}}

import android.content.Intent
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import android.view.View
import androidx.appcompat.app.AppCompatActivity
import {{PACKAGE_NAME}}.databinding.ActivitySplashBinding

class SplashActivity : AppCompatActivity() {

    private lateinit var binding: ActivitySplashBinding

    private val splashDuration = {{SPLASH_DURATION}}L
    private val tagline        = "{{SPLASH_TAGLINE}}"

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivitySplashBinding.inflate(layoutInflater)
        setContentView(binding.root)

        if (tagline.isNotBlank()) {
            binding.splashTagline.text       = tagline
            binding.splashTagline.visibility = View.VISIBLE
        } else {
            binding.splashTagline.visibility = View.GONE
        }

        Handler(Looper.getMainLooper()).postDelayed({
            startActivity(Intent(this, MainActivity::class.java))
            finish()
        }, splashDuration)
    }
}
