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

let riderAudioContext = null;

function getRiderAudioContext() {
    if (typeof window === "undefined") return null;
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return null;
    riderAudioContext ||= new AudioContext();
    return riderAudioContext;
}

// Mobile browsers block audio that has never been activated by a user gesture.
// Call this from the first pointer/keyboard interaction so future socket alerts
// can play even though the order event itself was not a click.
export async function primeRiderAlertAudio() {
    const context = getRiderAudioContext();
    if (!context) return false;
    try {
        if (context.state === "suspended") await context.resume();
        const oscillator = context.createOscillator();
        const gain = context.createGain();
        gain.gain.value = 0.00001;
        oscillator.connect(gain);
        gain.connect(context.destination);
        oscillator.start();
        oscillator.stop(context.currentTime + 0.01);
        return context.state === "running";
    } catch {
        return false;
    }
}

function playMelaChowRiderChime(context) {
    const start = context.currentTime + 0.02;
    // Two rising three-note phrases followed by a firm dispatch tone. This is
    // intentionally unlike a generic single notification beep.
    const notes = [
        [659.25, 0.00, 0.16], [783.99, 0.18, 0.16], [987.77, 0.36, 0.26],
        [659.25, 0.72, 0.16], [783.99, 0.90, 0.16], [987.77, 1.08, 0.26],
        [523.25, 1.48, 0.42], [1046.50, 1.50, 0.40],
    ];

    notes.forEach(([frequency, offset, duration]) => {
        const oscillator = context.createOscillator();
        const gain = context.createGain();
        oscillator.type = offset >= 1.48 ? "square" : "sine";
        oscillator.frequency.setValueAtTime(frequency, start + offset);
        gain.gain.setValueAtTime(0.0001, start + offset);
        gain.gain.exponentialRampToValueAtTime(offset >= 1.48 ? 0.16 : 0.28, start + offset + 0.025);
        gain.gain.exponentialRampToValueAtTime(0.0001, start + offset + duration);
        oscillator.connect(gain);
        gain.connect(context.destination);
        oscillator.start(start + offset);
        oscillator.stop(start + offset + duration + 0.02);
    });
}

export function playRiderAlert({ vibrationEnabled = true } = {}) {
    if (typeof window === "undefined") return;

    try {
        const context = getRiderAudioContext();
        if (context?.state === "running") {
            playMelaChowRiderChime(context);
        } else if (context) {
            context.resume().then(() => playMelaChowRiderChime(context)).catch(() => {});
        }
        if (vibrationEnabled) navigator.vibrate?.([300, 120, 300, 120, 500]);
    } catch {}
}
