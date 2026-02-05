// =======================================================
// File: background.js - Universal Browser Support (Manifest V3)
// =======================================================

const browserAPI = typeof browser !== "undefined" ? browser : chrome;

// --- ICON PATHS ---
const ICONS = {
  light: {
    16: "src/icons/LightMode/icon_16.png",
    32: "src/icons/LightMode/icon_32.png",
    64: "src/icons/LightMode/icon_64.png",
    128: "src/icons/LightMode/icon_128.png",
  },
  dark: {
    16: "src/icons/DarkMode/icon_16.png",
    32: "src/icons/DarkMode/icon_32.png",
    64: "src/icons/DarkMode/icon_64.png",
    128: "src/icons/DarkMode/icon_128.png",
  },
};

// --- AUTO THEME DETECTION ---
function updateIconForTheme() {
  // Detect browser theme
  const isDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  const iconSet = isDark ? ICONS.dark : ICONS.light;

  browserAPI.action.setIcon({ path: iconSet });
}

// Listen untuk perubahan tema browser
if (window.matchMedia) {
  const darkModeQuery = window.matchMedia("(prefers-color-scheme: dark)");

  // Update saat pertama kali load
  updateIconForTheme();

  // Listen perubahan tema
  darkModeQuery.addEventListener("change", () => {
    updateIconForTheme();
  });
}

// --- INITIALIZATION ---
browserAPI.runtime.onInstalled.addListener((details) => {
  if (details.reason === "install") {
    console.log("Time Sync extension installed");

    // Set default settings
    browserAPI.storage.local.set({
      ntpServer: "pool.ntp.org",
      syncInterval: 60,
      lastSync: null,
      autoSyncEnabled: false,
    });
  } else if (details.reason === "update") {
    console.log(`Updated from version ${details.previousVersion}`);
  }

  // Apply theme icon on install/update
  updateIconForTheme();
});

// Update icon saat extension start
browserAPI.runtime.onStartup.addListener(() => {
  updateIconForTheme();
});

// --- MESSAGE HANDLER ---
browserAPI.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "getSettings") {
    browserAPI.storage.local.get(null, (result) => sendResponse(result));
    return true;
  }

  if (request.action === "saveSettings") {
    browserAPI.storage.local.set(request.settings, () => {
      sendResponse({ success: true });
    });
    return true;
  }
});
