// =======================================================
// File: background.js - Universal Browser Support
// =======================================================

// Get browser API (Chrome, Firefox, Edge, Brave compatible)
const browserAPI =
  typeof chrome !== "undefined" && chrome.runtime
    ? chrome
    : typeof browser !== "undefined" && browser.runtime
    ? browser
    : null;

if (!browserAPI) {
  console.error("Browser API not available");
}

// Installation Handler
const handleInstall = () => {
  console.log("Time Sync extension installed");

  // Set default settings on installation
  if (browserAPI && browserAPI.storage) {
    browserAPI.storage.local.get(["ntpServer", "syncInterval"], (result) => {
      if (!result.ntpServer) {
        browserAPI.storage.local.set({
          ntpServer: "pool.ntp.org",
          syncInterval: 60,
          lastSync: null,
          autoSyncEnabled: false,
        });
        console.log("Default settings initialized");
      }
    });
  }
};

// Update Handler
const handleUpdate = (details) => {
  if (details.reason === "update") {
    console.log(
      `Time Sync updated from ${details.previousVersion} to current version`
    );
  }
};

// Listen to installation/update events
if (browserAPI && browserAPI.runtime) {
  browserAPI.runtime.onInstalled.addListener((details) => {
    if (details.reason === "install") {
      handleInstall();
    } else if (details.reason === "update") {
      handleUpdate(details);
    }
  });
}

// Keep service worker alive (Chrome specific optimization)
if (browserAPI && browserAPI.alarms) {
  browserAPI.alarms.create("keep-alive", { periodInMinutes: 1 });

  browserAPI.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name === "keep-alive") {
      console.log("Service worker alive check");
    }
  });
}

// Message handler
if (browserAPI && browserAPI.runtime) {
  browserAPI.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "getSettings") {
      browserAPI.storage.local.get(
        ["ntpServer", "syncInterval", "lastSync", "autoSyncEnabled"],
        (result) => {
          sendResponse(result);
        }
      );
      return true;
    }

    if (request.action === "saveSettings") {
      browserAPI.storage.local.set(request.settings, () => {
        sendResponse({ success: true });
      });
      return true;
    }
  });
}

console.log("Time Sync background script loaded successfully");
