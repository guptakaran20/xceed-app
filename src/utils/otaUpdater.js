import { CapacitorUpdater } from '@capgo/capacitor-updater';
import { App as CapacitorApp } from '@capacitor/app';
import axios from 'axios';
import getEnvironment from '../getenvironment';

// Helper to compare semantic versions (e.g. 1.0.1 vs 1.0.2)
function compareVersions(v1, v2) {
  const p1 = (v1 || '0').split('.').map(Number);
  const p2 = (v2 || '0').split('.').map(Number);
  for (let i = 0; i < Math.max(p1.length, p2.length); i++) {
    const n1 = p1[i] || 0;
    const n2 = p2[i] || 0;
    if (n1 > n2) return 1;
    if (n1 < n2) return -1;
  }
  return 0;
}

export async function setupOtaUpdater() {
  // Only run in native context (iOS/Android)
  if (!window.Capacitor || !window.Capacitor.isNativePlatform()) {
    console.log('[OTA] Running in browser, skipping OTA update check.');
    return;
  }

  try {
    // Notify Capgo that this version successfully booted (prevents rollbacks)
    await CapacitorUpdater.notifyAppReady();

    const serverUrl = getEnvironment();
    const versionUrl = `${serverUrl}/api/v1/ota/version.json`;

    console.log(`[OTA] Checking for updates at ${versionUrl}`);
    const response = await axios.get(versionUrl);
    const latestVersion = response.data.version;
    const rawUrl = response.data.url;
    // If the server returns a relative URL, prepend the server URL
    const downloadUrl = rawUrl.startsWith('http') ? rawUrl : `${serverUrl}${rawUrl.startsWith('/') ? '' : '/'}${rawUrl}`;

    if (!latestVersion || latestVersion === '0.0.0') {
      console.log('[OTA] No updates available on server.');
      return;
    }

    // Get the native version from Google Play / APK
    const info = await CapacitorApp.getInfo();
    const nativeVersion = info.version; // e.g. "1.0.0"

    let storedOtaVersion = localStorage.getItem('app_ota_version');

    // If the Google Play Native Version is newer than the old OTA update, 
    // it means they just updated via the Play Store. Reset our tracker.
    if (storedOtaVersion && compareVersions(nativeVersion, storedOtaVersion) > 0) {
      console.log(`[OTA] Google Play App (${nativeVersion}) is newer than old OTA (${storedOtaVersion}).`);
      storedOtaVersion = nativeVersion;
      localStorage.setItem('app_ota_version', nativeVersion);
    }

    const currentVersion = storedOtaVersion || nativeVersion;

    // Only download if the server version is strictly GREATER than our current version
    if (compareVersions(latestVersion, currentVersion) > 0) {
      console.log(`[OTA] Found update ${latestVersion}! Downloading from: ${downloadUrl}`);
      
      // Notify updater to start downloading
      const versionData = await CapacitorUpdater.download({
        url: downloadUrl,
        version: latestVersion,
      });

      console.log(`[OTA] Download complete! Update will apply when app is minimized.`);
      
      // Store the new version in localStorage
      localStorage.setItem('app_ota_version', latestVersion);
      
      // Wait for the user to minimize or close the app before restarting it
      CapacitorApp.addListener('appStateChange', async ({ isActive }) => {
        if (!isActive) {
          console.log('[OTA] App is in background. Applying update now...');
          await CapacitorUpdater.set({ id: versionData.id });
        }
      });
    } else {
      console.log(`[OTA] App is up to date (Version ${currentVersion}).`);
    }
  } catch (error) {
    console.error('[OTA] Update check failed', error);
  }
}
