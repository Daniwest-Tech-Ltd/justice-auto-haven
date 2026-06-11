// src/services/UpdateService.ts

export interface AppVersion {
  version: string;
  apkUrl: string;
}

export const checkAppUpdate = async (): Promise<{ updateAvailable: boolean; data?: AppVersion }> => {
  try {
    const response = await fetch('https://justice-ultimate-automobile.vercel.app/version.json', {
      cache: 'no-cache', // Important: don't let the browser cache the check
    });
    const data: AppVersion = await response.json();
    
    // Replace '1.0.0' with your actual current app version
    const currentVersion = "1.0.0"; 

    if (data.version !== currentVersion) {
      return { updateAvailable: true, data };
    }
  } catch (error) {
    console.error("Failed to check for updates:", error);
  }
  return { updateAvailable: false };
};