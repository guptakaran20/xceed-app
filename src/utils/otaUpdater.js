import { CapacitorUpdater } from '@capgo/capacitor-updater';
import { App as CapacitorApp } from '@capacitor/app';
import axios from 'axios';
import getEnvironment from '../getenvironment';

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

    const currentVersion = localStorage.getItem('app_ota_version') || '1.0.0';

    if (latestVersion !== currentVersion) {
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
