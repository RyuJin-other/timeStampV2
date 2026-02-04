// =======================================================
// File: window.js (SECURE VERSION - All Vulnerabilities Fixed)
// =======================================================

// Get browser API
const browserAPI =
  typeof chrome !== "undefined" && chrome.runtime
    ? chrome
    : typeof browser !== "undefined" && browser.runtime
      ? browser
      : null;

// Debug mode - SET TO FALSE FOR PRODUCTION
const DEBUG = false;

// Security Constants
const MIN_INTERVAL = 10;
const MAX_INTERVAL = 86400;
const SYNC_COOLDOWN = 1000;
const MAX_TIME_DIFF = 365 * 24 * 60 * 60 * 1000;

// State Management
const state = {
  ntpServer: "pool.ntp.org",
  syncInterval: 60,
  allowFullscreen: false, // Default: resize lock enabled
  serverTime: null,
  lastSync: null,
  timeOffset: null,
  isAutoSync: false,
  countdown: 0,
  isSyncing: false,
  lastSyncTime: 0,
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
  allowFullscreenInput: document.getElementById("allowFullscreenInput"),
  saveStatus: document.getElementById("saveStatus"),
};

// =======================================================
// SECURITY FUNCTIONS
// =======================================================

function debugLog(message, data = null) {
  if (DEBUG) {
    console.log("[Time Sync Window]", message, data || "");
  }
}

function isValidDomain(domain) {
  if (!domain || typeof domain !== "string") return false;
  domain = domain.trim();
  if (domain.length > 253 || domain.length < 3) return false;
  const domainRegex =
    /^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
  return domainRegex.test(domain);
}

function sanitizeNumber(value, min, max, defaultValue) {
  const num = parseInt(value);
  if (isNaN(num)) return defaultValue;
  return Math.min(Math.max(min, num), max);
}

function isValidTimestamp(timestamp) {
  if (typeof timestamp !== "number" || isNaN(timestamp)) return false;
  const now = Date.now();
  const diff = Math.abs(timestamp - now);
  return diff < MAX_TIME_DIFF;
}

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

function loadSettings() {
  if (browserAPI && browserAPI.storage) {
    browserAPI.storage.local.get(
      ["ntpServer", "syncInterval", "allowFullscreen"],
      (result) => {
        if (result.ntpServer && isValidDomain(result.ntpServer)) {
          state.ntpServer = result.ntpServer;
        } else {
          state.ntpServer = "pool.ntp.org";
        }

        state.syncInterval = sanitizeNumber(
          result.syncInterval,
          MIN_INTERVAL,
          MAX_INTERVAL,
          60,
        );

        state.allowFullscreen = result.allowFullscreen === true;

        elements.ntpInput.value = state.ntpServer;
        elements.intervalInput.value = state.syncInterval;
        elements.allowFullscreenInput.checked = state.allowFullscreen;
        toggleResizeLock();
      },
    );

    browserAPI.storage.onChanged.addListener((changes, area) => {
      if (area === "local") {
        if (changes.ntpServer && isValidDomain(changes.ntpServer.newValue)) {
          state.ntpServer = changes.ntpServer.newValue;
        }
        if (changes.syncInterval) {
          state.syncInterval = sanitizeNumber(
            changes.syncInterval.newValue,
            MIN_INTERVAL,
            MAX_INTERVAL,
            60,
          );
        }
        if (changes.allowFullscreen !== undefined) {
          state.allowFullscreen = changes.allowFullscreen.newValue === true;
          toggleResizeLock();
        }
      }
    });
  } else {
    elements.ntpInput.value = state.ntpServer;
    elements.intervalInput.value = state.syncInterval;
    elements.allowFullscreenInput.checked = state.allowFullscreen;
    toggleResizeLock();
  }
}

function saveSettings() {
  const settings = {
    ntpServer: state.ntpServer,
    syncInterval: state.syncInterval,
    allowFullscreen: state.allowFullscreen,
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

function toggleResizeLock() {
  if (state.allowFullscreen) {
    // Disable resize lock
    if (resizeCheckInterval) {
      clearInterval(resizeCheckInterval);
      resizeCheckInterval = null;
    }
    debugLog("Resize lock disabled - fullscreen allowed");
  } else {
    // Enable resize lock
    if (!resizeCheckInterval) {
      resizeCheckInterval = setInterval(() => {
        if (
          window.resizeTo &&
          (window.outerWidth !== FIXED_WIDTH ||
            window.outerHeight !== FIXED_HEIGHT)
        ) {
          window.resizeTo(FIXED_WIDTH, FIXED_HEIGHT);
        }
      }, 100);
    }
    // Force size immediately
    if (window.resizeTo) {
      window.resizeTo(FIXED_WIDTH, FIXED_HEIGHT);
    }
    debugLog("Resize lock enabled - fullscreen disabled");
  }
}

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

function updateClock() {
  const now = new Date();
  elements.pcTime.textContent = formatTime(now);

  if (state.timeOffset !== null && state.lastSync !== null) {
    const elapsed = (now - state.lastSync) / 1000;
    const serverTime = new Date(
      state.lastSync.getTime() + (elapsed + state.timeOffset) * 1000,
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

function setStatus(text, color) {
  elements.status.textContent = text;
  elements.status.style.color = color;
}

async function syncNow(silent = false) {
  // Rate limiting
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

    // 1. WorldTimeAPI
    if (!serverDateTime) {
      try {
        const url = ensureHTTPS(
          "https://worldtimeapi.org/api/timezone/Etc/UTC",
        );
        const controller = new AbortController();
        const id = setTimeout(() => controller.abort(), 3000);
        const response = await fetch(url, { signal: controller.signal });
        clearTimeout(id);
        if (response.ok) {
          const data = await response.json();
          const timestamp = validateWorldTimeResponse(data);
          serverDateTime = new Date(timestamp);
          usedMethod = "WorldTimeAPI";
          debugLog("WorldTimeAPI success");
        }
      } catch (e) {
        debugLog("WorldTimeAPI failed", e.message);
      }
    }

    // 2. NIST
    if (!serverDateTime) {
      try {
        const url = ensureHTTPS("https://www.nist.gov");
        const controller = new AbortController();
        const id = setTimeout(() => controller.abort(), 3000);
        const response = await fetch(url, {
          method: "HEAD",
          signal: controller.signal,
          cache: "no-store",
        });
        clearTimeout(id);
        const dateHeader = response.headers.get("date");
        if (dateHeader) {
          serverDateTime = validateDateHeader(dateHeader);
          usedMethod = "NIST";
          debugLog("NIST success");
        }
      } catch (e) {
        debugLog("NIST failed", e.message);
      }
    }

    // 3. TimeAPI.io
    if (!serverDateTime) {
      try {
        const url = ensureHTTPS(
          "https://timeapi.io/api/time/current/zone?timeZone=UTC",
        );
        const controller = new AbortController();
        const id = setTimeout(() => controller.abort(), 3000);
        const response = await fetch(url, { signal: controller.signal });
        clearTimeout(id);
        if (response.ok) {
          const data = await response.json();
          serverDateTime = validateTimeAPIResponse(data);
          usedMethod = "TimeAPI.io";
          debugLog("TimeAPI success");
        }
      } catch (e) {
        debugLog("TimeAPI failed", e.message);
      }
    }

    // 4. Google
    if (!serverDateTime) {
      try {
        const url = ensureHTTPS("https://www.google.com");
        const controller = new AbortController();
        const id = setTimeout(() => controller.abort(), 3000);
        const response = await fetch(url, {
          method: "HEAD",
          signal: controller.signal,
        });
        clearTimeout(id);
        const dateHeader = response.headers.get("date");
        if (dateHeader) {
          serverDateTime = validateDateHeader(dateHeader);
          usedMethod = "Google";
          debugLog("Google success");
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

      if (diff < 0.999) {
        setStatus(`● Synced Perfectly`, "#00af7bff");
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
  // Resize window to accommodate modal
  if (window.resizeTo) {
    window.resizeTo(420, 200);
  }
});
elements.closeModal.addEventListener("click", () => {
  elements.modalOverlay.classList.remove("active");
  // Resize back to original size if resize lock is active
  if (!state.allowFullscreen && window.resizeTo) {
    window.resizeTo(FIXED_WIDTH, FIXED_HEIGHT);
  }
});
elements.modalOverlay.addEventListener("click", (e) => {
  if (e.target === elements.modalOverlay) {
    elements.modalOverlay.classList.remove("active");
    // Resize back to original size if resize lock is active
    if (!state.allowFullscreen && window.resizeTo) {
      window.resizeTo(FIXED_WIDTH, FIXED_HEIGHT);
    }
  }
});

elements.ntpInput.addEventListener("input", (e) => {
  const value = e.target.value.trim();

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
  elements.intervalInput.value = value;
  state.syncInterval = value;
  saveSettings();

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

elements.allowFullscreenInput.addEventListener("change", (e) => {
  state.allowFullscreen = e.target.checked;
  saveSettings();
  toggleResizeLock();
});

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
// INITIALIZATION & RESIZE LOCK
// =======================================================

loadSettings();
clockInterval = setInterval(updateClock, 1000);
updateClock();
setTimeout(() => syncNow(true), 500);

// Resize lock - conditional based on allowFullscreen setting
const FIXED_WIDTH = 370;
const FIXED_HEIGHT = 190; // Changed to 150px

let resizeCheckInterval = null;

// Force size on load if resize lock is enabled
window.addEventListener("load", () => {
  if (!state.allowFullscreen && window.resizeTo) {
    window.resizeTo(FIXED_WIDTH, FIXED_HEIGHT);
  }
  // Initialize resize lock based on current setting
  toggleResizeLock();
});

// Prevent resize event if lock is enabled
window.addEventListener("resize", () => {
  if (!state.allowFullscreen && window.resizeTo) {
    window.resizeTo(FIXED_WIDTH, FIXED_HEIGHT);
  }
});

debugLog("Window initialized", {
  minInterval: MIN_INTERVAL,
  maxInterval: MAX_INTERVAL,
  syncCooldown: SYNC_COOLDOWN,
  allowFullscreen: state.allowFullscreen,
  fixedSize: state.allowFullscreen
    ? "disabled"
    : `${FIXED_WIDTH}x${FIXED_HEIGHT}`,
});
