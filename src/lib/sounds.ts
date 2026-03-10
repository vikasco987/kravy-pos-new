/**
 * 🔊 KravySound — Centralized Sound Engine v2
 * - No MP3 files needed (Web Audio API synthesis)
 * - Auto-resumes AudioContext on any user gesture
 * - Works in Next.js app router (safe SSR guards)
 */

// ── Shared AudioContext ────────────────────────────────────────────────────────
let _ctx: AudioContext | null = null;

function ctx(): AudioContext | null {
    if (typeof window === "undefined") return null;
    if (!_ctx) {
        _ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    // Auto-resume if browser suspended it (no user gesture yet is OK — it'll play on next call after gesture)
    if (_ctx.state === "suspended") {
        _ctx.resume(); // fire-and-forget
    }
    return _ctx;
}

// ── Core tone helper ───────────────────────────────────────────────────────────
function tone(
    c: AudioContext,
    freq: number,
    startAt: number,
    duration: number,
    volume: number = 0.3,
    type: OscillatorType = "sine"
) {
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.connect(gain);
    gain.connect(c.destination);
    osc.type = type;
    osc.frequency.setValueAtTime(freq, startAt);
    gain.gain.setValueAtTime(0, startAt);
    gain.gain.linearRampToValueAtTime(volume, startAt + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, startAt + duration);
    osc.start(startAt);
    osc.stop(startAt + duration + 0.05);
}

function noise(c: AudioContext, startAt: number, duration: number, volume = 0.04) {
    const buf = c.createBuffer(1, c.sampleRate * duration, c.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    const src = c.createBufferSource();
    src.buffer = buf;
    const gain = c.createGain();
    gain.gain.setValueAtTime(volume, startAt);
    gain.gain.exponentialRampToValueAtTime(0.0001, startAt + duration);
    src.connect(gain);
    gain.connect(c.destination);
    src.start(startAt);
}

// ── Sound Library ──────────────────────────────────────────────────────────────
export const kravy = {

    /** 🖱️ Subtle button/nav click */
    click() {
        const c = ctx(); if (!c) return;
        const t = c.currentTime;
        tone(c, 800, t, 0.08, 0.1);
    },

    /** ✅ Success — form saved, action done */
    success() {
        const c = ctx(); if (!c) return;
        const t = c.currentTime;
        tone(c, 523, t, 0.15, 0.22);
        tone(c, 659, t + 0.1, 0.15, 0.22);
        tone(c, 784, t + 0.2, 0.28, 0.28);
    },

    /** ❌ Error / fail */
    error() {
        const c = ctx(); if (!c) return;
        const t = c.currentTime;
        tone(c, 220, t, 0.15, 0.28, "sawtooth");
        tone(c, 180, t + 0.15, 0.22, 0.22, "sawtooth");
    },

    /** 🗑️ Delete / trash */
    trash() {
        const c = ctx(); if (!c) return;
        const t = c.currentTime;
        tone(c, 400, t, 0.06, 0.18, "square");
        tone(c, 280, t + 0.06, 0.1, 0.14, "square");
        noise(c, t, 0.2, 0.04);
    },

    /** 🛒 Add to cart */
    add() {
        const c = ctx(); if (!c) return;
        const t = c.currentTime;
        tone(c, 660, t, 0.08, 0.2);
        tone(c, 880, t + 0.08, 0.12, 0.2);
    },

    /** ➖ Remove from cart */
    remove() {
        const c = ctx(); if (!c) return;
        const t = c.currentTime;
        tone(c, 440, t, 0.06, 0.2);
        tone(c, 330, t + 0.06, 0.1, 0.15);
    },

    /** 🔔 New Order — restaurant bell */
    orderBell() {
        const c = ctx(); if (!c) return;
        const t = c.currentTime;
        tone(c, 880, t, 0.5, 0.4);
        tone(c, 660, t + 0.2, 0.4, 0.3);
        tone(c, 880, t + 0.5, 0.5, 0.4);
        tone(c, 990, t + 0.7, 0.8, 0.35);
    },

    /** ✅ Order accepted */
    orderAccept() {
        const c = ctx(); if (!c) return;
        const t = c.currentTime;
        [440, 554, 659, 880].forEach((f, i) =>
            tone(c, f, t + i * 0.1, 0.2, 0.22)
        );
    },

    /** 🍽️ Order ready */
    orderReady() {
        const c = ctx(); if (!c) return;
        const t = c.currentTime;
        [523, 659, 784, 1047].forEach((f, i) =>
            tone(c, f, t + i * 0.1, 0.28, 0.22)
        );
    },

    /** ❌ Order cancelled */
    orderCancel() {
        const c = ctx(); if (!c) return;
        const t = c.currentTime;
        tone(c, 440, t, 0.1, 0.28);
        tone(c, 370, t + 0.1, 0.15, 0.22);
        tone(c, 294, t + 0.25, 0.25, 0.18, "sawtooth");
    },

    /** 📤 Image uploaded */
    upload() {
        const c = ctx(); if (!c) return;
        const t = c.currentTime;
        [300, 600, 900, 1200].forEach((f, i) =>
            tone(c, f, t + i * 0.05, 0.15, 0.1 + i * 0.04)
        );
    },

    /** 💰 Payment / order placed */
    payment() {
        const c = ctx(); if (!c) return;
        const t = c.currentTime;
        noise(c, t, 0.05, 0.08);
        tone(c, 1047, t, 0.15, 0.32);
        tone(c, 1319, t + 0.12, 0.2, 0.28);
        noise(c, t + 0.15, 0.06, 0.06);
    },

    /** 🔁 Toggle switch */
    toggle() {
        const c = ctx(); if (!c) return;
        const t = c.currentTime;
        tone(c, 600, t, 0.04, 0.14, "square");
        tone(c, 900, t + 0.04, 0.06, 0.1, "square");
    },

    /** ⭐ Review received */
    review() {
        const c = ctx(); if (!c) return;
        const t = c.currentTime;
        [523, 659, 784].forEach((f, i) =>
            tone(c, f, t + i * 0.15, 0.35, 0.18)
        );
    },

    /** 📋 Copy */
    copy() {
        const c = ctx(); if (!c) return;
        const t = c.currentTime;
        tone(c, 700, t, 0.05, 0.12);
        tone(c, 900, t + 0.05, 0.08, 0.12);
    },

    /** 🔍 Open / expand */
    open() {
        const c = ctx(); if (!c) return;
        const t = c.currentTime;
        [400, 600, 800].forEach((f, i) =>
            tone(c, f, t + i * 0.05, 0.1, 0.14)
        );
    },

    /** 🚪 Close / dismiss */
    close() {
        const c = ctx(); if (!c) return;
        const t = c.currentTime;
        tone(c, 600, t, 0.05, 0.1);
        tone(c, 400, t + 0.05, 0.08, 0.1);
    },

    /** 🔔 Gentle ping */
    ping() {
        const c = ctx(); if (!c) return;
        tone(c, 880, c.currentTime, 0.3, 0.18);
    },

    /** 🖨️ Print */
    print() {
        const c = ctx(); if (!c) return;
        const t = c.currentTime;
        noise(c, t, 0.08, 0.05);
        for (let i = 0; i < 3; i++) noise(c, t + 0.1 + i * 0.12, 0.1, 0.04);
    },
};
