package com.infinitygames.pocketgarden;

import android.content.Context;
import android.net.ConnectivityManager;
import android.net.Network;
import android.net.NetworkCapabilities;
import android.os.Build;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

/**
 * Reports whether any active network is a VPN transport (Arena offline/VPN gate).
 */
@CapacitorPlugin(name = "VpnCheck")
public class VpnCheckPlugin extends Plugin {

    @PluginMethod
    public void isVpnActive(PluginCall call) {
        JSObject ret = new JSObject();
        ret.put("active", isVpnActive());
        call.resolve(ret);
    }

    private boolean isVpnActive() {
        Context context = getContext();
        if (context == null) return false;
        ConnectivityManager cm = (ConnectivityManager) context.getSystemService(Context.CONNECTIVITY_SERVICE);
        if (cm == null) return false;

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            Network[] networks = cm.getAllNetworks();
            if (networks == null) return false;
            for (Network network : networks) {
                NetworkCapabilities caps = cm.getNetworkCapabilities(network);
                if (caps != null && caps.hasTransport(NetworkCapabilities.TRANSPORT_VPN)) {
                    return true;
                }
            }
            return false;
        }

        // Pre-M fallback: active NetworkInfo type VPN (rare on supported API range).
        try {
            android.net.NetworkInfo info = cm.getActiveNetworkInfo();
            return info != null && info.getType() == ConnectivityManager.TYPE_VPN;
        } catch (Exception e) {
            return false;
        }
    }
}
