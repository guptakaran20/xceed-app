import { CapacitorUpdater } from '@capgo/capacitor-updater';
import axios from 'axios';
import getEnvironment from '../getenvironment';

export async function setupOtaUpdater() {
  // Only run in native context (iOS/Android)
  if (!window.Capacitor || !window.Capacitor.isNativePlatform()) {
    console.log('[OTA] Running in browser, skipping OTA update check.');
    return;
  }

  try {
    const serverUrl = getEnvironment();
    const versionUrl = `${serverUrl}/api/v1/ota/version.json`;

    console.log(`[OTA] Checking for updates at ${versionUrl}`);
    const response = await axios.get(versionUrl);
    const latestVersion = response.data.version;
    const downloadUrl = response.data.url;

    if (!latestVersion || latestVersion === '0.0.0') {
      console.log('[OTA] No updates available on server.');
      return;
    }

    const currentVersion = localStorage.getItem('app_ota_version') || '1.0.0';

    if (latestVersion !== currentVersion) {
      console.log(`[OTA] New version found! Current: ${currentVersion}, Latest: ${latestVersion}`);
      console.log(`[OTA] Downloading from ${downloadUrl}`);
      
      // Notify updater to start downloading
      const versionData = await CapacitorUpdater.download({
        url: downloadUrl,
        version: latestVersion,
      });

      console.log('[OTA] Download complete. Applying update...');
      
      // Store the new version in localStorage before applying, 
      // because the app will restart after this.
      localStorage.setItem('app_ota_version', latestVersion);
      
      await CapacitorUpdater.set({ id: versionData.id });
    } else {
      console.log(`[OTA] App is up to date (Version ${currentVersion}).`);
    }
  } catch (error) {
    console.error('[OTA] Update check failed', error);
  }
}
