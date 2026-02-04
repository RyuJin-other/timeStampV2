// =======================================================
// File: popup.js (SECURE VERSION - All Vulnerabilities Fixed)
// =======================================================

// Get browser API (Chrome, Firefox, Edge, Brave compatible)
const browserAPI =
  typeof chrome !== "undefined" && chrome.runtime
    ? chrome
    : typeof browser !== "undefined" && browser.runtime
    ? browser
    : null;

// Debug mode - SET TO FALSE FOR PRODUCTION
const DEBUG = false;

// Security Constants
const MIN_INTERVAL = 10; // 10 seconds
const MAX_INTERVAL = 86400; // 24 hours max
const SYNC_COOLDOWN = 1000; // 1 second between syncs
const MAX_TIME_DIFF = 365 * 24 * 60 * 60 * 1000; // 1 year max difference

// State Management
const state = {
  ntpServer: "pool.ntp.org",
  syncInterval: 60,
  serverTime: null,
  lastSync: null,
  timeOffset: null,
  isAutoSync: false,
  countdown: 0,
  isSyncing: false,
  lastSyncTime: 0, // For rate limiting
};

let clockInterval;

// DOM Elements
const elements = {
  serverTime: document.getElementById("serverTime"),
  pcTime: document.getElementById("pcTime"),
  status: document.getElementById("status"),
  syncBtn: document.getElementById("syncBtn"),
  syncBtnText: document.getElementById("syncBtnText"),
  autoBtn: document.getElementById("autoBtn"),
  settingsBtn: document.getElementById("settingsBtn"),
  modalOverlay: document.getElementById("modalOverlay"),
  closeModal: document.getElementById("closeModal"),
  ntpInput: document.getElementById("ntpInput"),
  intervalInput: document.getElementById("intervalInput"),
  saveStatus: document.getElementById("saveStatus"),
};

// =======================================================
// SECURITY FUNCTIONS
// =======================================================

/**
 * Safe logging function
 */
function debugLog(message, data = null) {
  if (DEBUG) {
    console.log("[Time Sync]", message, data || "");
  }
}

/**
 * Validate domain name
 */
function isValidDomain(domain) {
  if (!domain || typeof domain !== "string") return false;

  // Remove whitespace
  domain = domain.trim();

  // Check length (max 253 chars for domain)
  if (domain.length > 253 || domain.length < 3) return false;

  // Regex for valid domain
  const domainRegex =
    /^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

  return domainRegex.test(domain);
}

/**
 * Sanitize numeric input
 */
function sanitizeNumber(value, min, max, defaultValue) {
  const num = parseInt(value);

  if (isNaN(num)) return defaultValue;

  return Math.min(Math.max(min, num), max);
}

/**
 * Validate timestamp is reasonable
 */
function isValidTimestamp(timestamp) {
  if (typeof timestamp !== "number" || isNaN(timestamp)) return false;

  const now = Date.now();
  const diff = Math.abs(timestamp - now);

  // Timestamp shouldn't be more than 1 year different from now
  return diff < MAX_TIME_DIFF;
}

/**
 * Validate API response from WorldTimeAPI
 */
function validateWorldTimeResponse(data) {
  if (!data || typeof data !== "object") {
    throw new Error("Invalid response structure");
  }

  if (typeof data.unixtime !== "number") {
    throw new Error("Missing or invalid unixtime field");
  }

  const timestamp = data.unixtime * 1000;

  if (!isValidTimestamp(timestamp)) {
    throw new Error("Timestamp out of reasonable range");
  }

  return timestamp;
}

/**
 * Validate API response from TimeAPI.io
 */
function validateTimeAPIResponse(data) {
  if (!data || typeof data !== "object") {
    throw new Error("Invalid response structure");
  }

  if (!data.dateTime || typeof data.dateTime !== "string") {
    throw new Error("Missing or invalid dateTime field");
  }

  const date = new Date(data.dateTime + "Z");

  if (isNaN(date.getTime())) {
    throw new Error("Invalid date format");
  }

  if (!isValidTimestamp(date.getTime())) {
    throw new Error("Timestamp out of reasonable range");
  }

  return date;
}

/**
 * Validate HTTP Date header
 */
function validateDateHeader(dateString) {
  if (!dateString || typeof dateString !== "string") {
    throw new Error("Invalid date header");
  }

  const date = new Date(dateString);

  if (isNaN(date.getTime())) {
    throw new Error("Invalid date format");
  }

  if (!isValidTimestamp(date.getTime())) {
    throw new Error("Timestamp out of reasonable range");
  }

  return date;
}

/**
 * Ensure HTTPS URL
 */
function ensureHTTPS(urlString) {
  const url = new URL(urlString);

  if (url.protocol !== "https:") {
    throw new Error("Only HTTPS URLs are allowed");
  }

  return url.href;
}

// =======================================================
// CORE FUNCTIONS
// =======================================================

/**
 * Load settings from storage (Universal)
 */
function loadSettings() {
  if (browserAPI && browserAPI.storage) {
    browserAPI.storage.local.get(["ntpServer", "syncInterval"], (result) => {
      // Validate loaded settings
      if (result.ntpServer && isValidDomain(result.ntpServer)) {
        state.ntpServer = result.ntpServer;
      } else {
        state.ntpServer = "pool.ntp.org"; // Safe default
      }

      state.syncInterval = sanitizeNumber(
        result.syncInterval,
        MIN_INTERVAL,
        MAX_INTERVAL,
        60
      );

      elements.ntpInput.value = state.ntpServer;
      elements.intervalInput.value = state.syncInterval;
    });
  } else {
    elements.ntpInput.value = state.ntpServer;
    elements.intervalInput.value = state.syncInterval;
  }
}

/**
 * Save settings to storage (Universal)
 */
function saveSettings() {
  const settings = {
    ntpServer: state.ntpServer,
    syncInterval: state.syncInterval,
  };

  if (browserAPI && browserAPI.storage) {
    browserAPI.storage.local.set(settings);
  }

  showSaveStatus();
}

function showSaveStatus() {
  elements.saveStatus.textContent = "✓ Saved";
  setTimeout(() => {
    elements.saveStatus.textContent = "";
  }, 1000);
}

/**
 * Format time
 */
function formatTime(date) {
  if (!date) return "--:--:-- | Not synchronized yet";

  const options = {
    hour12: false,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  };

  return date.toLocaleString("en-US", options).replace(",", " |");
}

function formatTimeUTC(date) {
  if (!date) return "--:--:-- | Not synchronized yet";
  const options = {
    timeZone: "UTC",
    hour12: false,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  };
  return date.toLocaleString("en-US", options).replace(",", " |");
}

/**
 * Update clock
 */
function updateClock() {
  const now = new Date();
  elements.pcTime.textContent = formatTime(now);

  if (state.timeOffset !== null && state.lastSync !== null) {
    const elapsed = (now - state.lastSync) / 1000;
    const serverTime = new Date(
      state.lastSync.getTime() + (elapsed + state.timeOffset) * 1000
    );
    elements.serverTime.textContent = formatTimeUTC(serverTime);
  }

  if (state.isAutoSync && state.countdown > 0) {
    state.countdown--;
    const mins = Math.floor(state.countdown / 60);
    const secs = state.countdown % 60;
    elements.autoBtn.textContent =
      mins > 0 ? `Auto (${mins}m ${secs}s)` : `Auto (${secs}s)`;

    if (state.countdown === 0) {
      syncNow(true);
      state.countdown = state.syncInterval;
    }
  }
}

/**
 * Set status
 */
function setStatus(text, color) {
  elements.status.textContent = text;
  elements.status.style.color = color;
}

/**
 * Sync with time server (SECURE VERSION)
 */
async function syncNow(silent = false) {
  // Rate limiting check
  const now = Date.now();
  if (now - state.lastSyncTime < SYNC_COOLDOWN) {
    if (!silent) {
      setStatus("● Please wait before syncing again", "#ff9800");
    }
    return;
  }
  state.lastSyncTime = now;

  if (!silent) {
    state.isSyncing = true;
    elements.syncBtn.disabled = true;
    elements.syncBtnText.textContent = "Syncing...";
    elements.syncBtn.querySelector(".icon").classList.add("spinner");
    setStatus("● Connecting to server...", "#ffc107");
  }

  try {
    let serverDateTime = null;
    let usedMethod = "";

    // Method 1: WorldTimeAPI
    if (!serverDateTime) {
      try {
        const url = ensureHTTPS(
          "https://worldtimeapi.org/api/timezone/Etc/UTC"
        );
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3000);

        const response = await fetch(url, { signal: controller.signal });
        clearTimeout(timeoutId);

        if (response.ok) {
          const data = await response.json();
          const timestamp = validateWorldTimeResponse(data);
          serverDateTime = new Date(timestamp);
          usedMethod = "WorldTimeAPI";
          debugLog("WorldTimeAPI success", serverDateTime);
        }
      } catch (e) {
        debugLog("WorldTimeAPI failed", e.message);
      }
    }

    // Method 2: NIST
    if (!serverDateTime) {
      try {
        const url = ensureHTTPS("https://www.nist.gov");
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3000);

        const response = await fetch(url, {
          method: "HEAD",
          signal: controller.signal,
          cache: "no-store",
        });
        clearTimeout(timeoutId);

        const dateHeader = response.headers.get("date");
        if (dateHeader) {
          serverDateTime = validateDateHeader(dateHeader);
          usedMethod = "NIST";
          debugLog("NIST success", serverDateTime);
        }
      } catch (e) {
        debugLog("NIST failed", e.message);
      }
    }

    // Method 3: TimeAPI.io
    if (!serverDateTime) {
      try {
        const url = ensureHTTPS(
          "https://timeapi.io/api/time/current/zone?timeZone=UTC"
        );
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3000);

        const response = await fetch(url, { signal: controller.signal });
        clearTimeout(timeoutId);

        if (response.ok) {
          const data = await response.json();
          serverDateTime = validateTimeAPIResponse(data);
          usedMethod = "TimeAPI.io";
          debugLog("TimeAPI success", serverDateTime);
        }
      } catch (e) {
        debugLog("TimeAPI failed", e.message);
      }
    }

    // Method 4: Google (Fallback)
    if (!serverDateTime) {
      try {
        const url = ensureHTTPS("https://www.google.com");
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3000);

        const response = await fetch(url, {
          method: "HEAD",
          signal: controller.signal,
        });
        clearTimeout(timeoutId);

        const dateHeader = response.headers.get("date");
        if (dateHeader) {
          serverDateTime = validateDateHeader(dateHeader);
          usedMethod = "Google";
          debugLog("Google success", serverDateTime);
        }
      } catch (e) {
        debugLog("Google failed", e.message);
      }
    }

    if (serverDateTime) {
      const localDateTime = new Date();
      const offset = (serverDateTime - localDateTime) / 1000;
      state.timeOffset = offset;
      state.lastSync = localDateTime;
      const diff = Math.abs(offset);

      if (diff < 1) {
        setStatus("● Synced perfectly", "#00af7bff");
      } else {
        setStatus(`● Time Late: ${diff.toFixed(3)}s`, "#ff9800");
      }
    } else {
      throw new Error("All time servers failed to respond");
    }
  } catch (error) {
    setStatus("● Sync failed - " + error.message, "#f44336");
    debugLog("Sync error", error);
  } finally {
    if (!silent) {
      state.isSyncing = false;
      elements.syncBtn.disabled = false;
      elements.syncBtnText.textContent = "Sync Now";
      elements.syncBtn.querySelector(".icon").classList.remove("spinner");
    }
  }
}

/**
 * Toggle auto sync
 */
function toggleAutoSync() {
  if (!state.isAutoSync) {
    state.isAutoSync = true;
    state.countdown = state.syncInterval;
    elements.autoBtn.classList.remove("btn-outline");
    elements.autoBtn.classList.add("btn-success");
    syncNow(true);
  } else {
    state.isAutoSync = false;
    state.countdown = 0;
    elements.autoBtn.classList.remove("btn-success");
    elements.autoBtn.classList.add("btn-outline");
    elements.autoBtn.textContent = "Auto Sync";
  }
}

// =======================================================
// EVENT LISTENERS
// =======================================================

elements.syncBtn.addEventListener("click", () => syncNow(false));
elements.autoBtn.addEventListener("click", toggleAutoSync);
elements.settingsBtn.addEventListener("click", () => {
  elements.modalOverlay.classList.add("active");
});
elements.closeModal.addEventListener("click", () => {
  elements.modalOverlay.classList.remove("active");
});
elements.modalOverlay.addEventListener("click", (e) => {
  if (e.target === elements.modalOverlay) {
    elements.modalOverlay.classList.remove("active");
  }
});

// Detach button
document.getElementById("detachBtn").addEventListener("click", () => {
  if (browserAPI && browserAPI.windows) {
    browserAPI.windows.create(
      {
        url: browserAPI.runtime.getURL("window.html"),
        type: "popup",
        width: 420,
        height: 150,
        left: 100,
        top: 100,
        focused: true,
      },
      (newWindow) => {
        debugLog("Window created", newWindow);
        setTimeout(() => {
          if (window.close) window.close();
        }, 100);
      }
    );
  } else {
    const newWin = window.open(
      "window.html",
      "TimeSyncWindow",
      "width=420,height=200,left=100,top=100"
    );
    if (!newWin) {
      alert("Please allow popups for this extension");
    }
  }
});

// Settings input handlers with validation
elements.ntpInput.addEventListener("input", (e) => {
  const value = e.target.value.trim();

  // Visual feedback
  if (value === "" || isValidDomain(value)) {
    elements.ntpInput.style.borderColor = "";
    state.ntpServer = value || "pool.ntp.org";
    saveSettings();
  } else {
    elements.ntpInput.style.borderColor = "#f44336";
  }
});

elements.intervalInput.addEventListener("input", (e) => {
  const value = sanitizeNumber(e.target.value, MIN_INTERVAL, MAX_INTERVAL, 60);

  // Update UI with sanitized value
  elements.intervalInput.value = value;
  state.syncInterval = value;
  saveSettings();

  // Visual feedback for bounds
  if (
    parseInt(e.target.value) < MIN_INTERVAL ||
    parseInt(e.target.value) > MAX_INTERVAL
  ) {
    elements.intervalInput.style.borderColor = "#ff9800";
    setTimeout(() => {
      elements.intervalInput.style.borderColor = "";
    }, 1000);
  }
});

// Quick select buttons
document.querySelectorAll(".quick-select-btn").forEach((btn) => {
  btn.addEventListener("click", (e) => {
    const server = e.currentTarget.getAttribute("data-server");

    if (isValidDomain(server)) {
      state.ntpServer = server;
      elements.ntpInput.value = server;
      elements.ntpInput.style.borderColor = "";
      saveSettings();
      setStatus(`● Syncing with ${server}...`, "#ffc107");
      setTimeout(() => syncNow(true), 500);
    }
  });
});

// =======================================================
// INITIALIZATION
// =======================================================

loadSettings();
clockInterval = setInterval(updateClock, 1000);
updateClock();

debugLog("Extension initialized", {
  minInterval: MIN_INTERVAL,
  maxInterval: MAX_INTERVAL,
  syncCooldown: SYNC_COOLDOWN,
});
