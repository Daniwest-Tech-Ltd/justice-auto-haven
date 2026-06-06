package com.justice.ultimateautomobiles;

import android.Manifest;
import android.content.pm.PackageManager;
import android.os.Build;
import android.os.Bundle;
import android.provider.Settings;
import android.util.Log;
import android.view.HapticFeedbackConstants;
import android.view.WindowManager;
import android.webkit.JavascriptInterface;
import android.webkit.WebView;
import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;
import androidx.core.splashscreen.SplashScreen;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    private static final String TAG = "JusticeAutoApp";
    private static final int NOTIFICATION_PERMISSION_CODE = 1234;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        // 1. Initialize Splash Screen correctly (Must be before super.onCreate)
        try {
            SplashScreen.installSplashScreen(this);
        } catch (Exception e) {
            Log.e(TAG, "Splash screen initialization failed", e);
        }

        super.onCreate(savedInstanceState);

        // 2. Setup Security Bridge with a safety wrapper
        try {
            setupSecurityBridge();
        } catch (Exception e) {
            Log.e(TAG, "Security bridge setup failed", e);
        }
    }

    private void setupSecurityBridge() {
        if (getBridge() == null || getBridge().getWebView() == null) {
            return;
        }

        final WebView webView = getBridge().getWebView();

        // Use post to ensure we're on the right thread and WebView is ready
        webView.post(() -> {
            try {
                webView.addJavascriptInterface(new Object() {

                    @JavascriptInterface
                    public void setScreenSecurity(final boolean isSecure) {
                        runOnUiThread(() -> {
                            try {
                                if (isSecure) {
                                    getWindow().setFlags(WindowManager.LayoutParams.FLAG_SECURE, WindowManager.LayoutParams.FLAG_SECURE);
                                } else {
                                    getWindow().clearFlags(WindowManager.LayoutParams.FLAG_SECURE);
                                }
                            } catch (Exception e) {
                                Log.e(TAG, "Error toggling screen security", e);
                            }
                        });
                    }

                    @JavascriptInterface
                    public String getDeviceId() {
                        try {
                            return Settings.Secure.getString(getContentResolver(), Settings.Secure.ANDROID_ID);
                        } catch (Exception e) {
                            return "unknown";
                        }
                    }

                    @JavascriptInterface
                    public void requestNotifications() {
                        try {
                            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                                if (ContextCompat.checkSelfPermission(MainActivity.this, Manifest.permission.POST_NOTIFICATIONS) != PackageManager.PERMISSION_GRANTED) {
                                    ActivityCompat.requestPermissions(MainActivity.this, new String[]{Manifest.permission.POST_NOTIFICATIONS}, NOTIFICATION_PERMISSION_CODE);
                                }
                            }
                        } catch (Exception e) {
                            Log.e(TAG, "Error requesting notifications", e);
                        }
                    }

                    @JavascriptInterface
                    public void triggerHaptic() {
                        runOnUiThread(() -> {
                            try {
                                if (getBridge() != null && getBridge().getWebView() != null) {
                                    getBridge().getWebView().performHapticFeedback(HapticFeedbackConstants.LONG_PRESS);
                                }
                            } catch (Exception e) {
                                Log.e(TAG, "Error triggering haptic", e);
                            }
                        });
                    }

                    @JavascriptInterface
                    public boolean isFirstRun() {
                        try {
                            boolean firstRun = getPreferences(MODE_PRIVATE).getBoolean("FIRST_RUN", true);
                            if (firstRun) {
                                getPreferences(MODE_PRIVATE).edit().putBoolean("FIRST_RUN", false).apply();
                            }
                            return firstRun;
                        } catch (Exception e) {
                            return false;
                        }
                    }

                }, "SecurityBridge");
            } catch (Exception e) {
                Log.e(TAG, "Error injecting SecurityBridge", e);
            }
        });
    }
}
