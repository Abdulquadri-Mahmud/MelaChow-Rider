export const RIDER_ALERT_SETTINGS_KEY = "melachow_rider_alert_settings";

export const DEFAULT_RIDER_ALERT_SETTINGS = {
    alarmEnabled: true,
    vibrationEnabled: true,
    intervalSeconds: 6,
};

export function getRiderAlertSettings() {
    if (typeof window === "undefined") return DEFAULT_RIDER_ALERT_SETTINGS;

    try {
        const saved = JSON.parse(localStorage.getItem(RIDER_ALERT_SETTINGS_KEY) || "{}");
        return {
            ...DEFAULT_RIDER_ALERT_SETTINGS,
            ...saved,
            intervalSeconds: [6, 10, 15].includes(Number(saved.intervalSeconds))
                ? Number(saved.intervalSeconds)
                : DEFAULT_RIDER_ALERT_SETTINGS.intervalSeconds,
        };
    } catch {
        return DEFAULT_RIDER_ALERT_SETTINGS;
    }
}

export function saveRiderAlertSettings(settings) {
    const next = { ...DEFAULT_RIDER_ALERT_SETTINGS, ...settings };
    if (typeof window !== "undefined") {
        localStorage.setItem(RIDER_ALERT_SETTINGS_KEY, JSON.stringify(next));
        window.dispatchEvent(new CustomEvent("rider:alert-settings", { detail: next }));
    }
    return next;
}

export function playRiderAlert({ vibrationEnabled = true } = {}) {
    if (typeof window === "undefined") return;

    try {
        const alarm = new Audio("/sounds/urgency.mp3");
        alarm.volume = 1;
        alarm.play().catch(() => {});
        if (vibrationEnabled) navigator.vibrate?.([300, 120, 300, 120, 500]);
    } catch {}
}