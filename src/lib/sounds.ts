/**
 * 🔊 KravySound — Centralized Sound Engine
 * Uses Web Audio API (no MP3 files needed).
 * All sounds are programmatically synthesized.
 * Call `kravy.unlock()` on first user click to unblock browser audio policy.
 */

// ── Audio Context (shared, lazy-init) ─────────────────────────────────────────
let ctx: AudioContext | null = null;
let unlocked = false;

function getCtx(): AudioContext | null {
    if (typeof window === "undefined") return null;
    if (!ctx) {
        ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    return ctx;
}

function tone(
    freq: number,
    startTime: number,
    duration: number,
    gainVal: number = 0.3,
    type: OscillatorType = "sine",
    fadeIn = 0.01
) {
    const c = getCtx();
    if (!c || !unlocked) return;
    const osc = c.createOscillator();
    const g = c.createGain();
    osc.connect(g);
    g.connect(c.destination);
    osc.type = type;
    osc.frequency.setValueAtTime(freq, startTime);
    g.gain.setValueAtTime(0, startTime);
    g.gain.linearRampToValueAtTime(gainVal, startTime + fadeIn);
    g.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);
    osc.start(startTime);
    osc.stop(startTime + duration + 0.05);
}

function noise(startTime: number, duration: number, gain: number = 0.05) {
    const c = getCtx();
    if (!c || !unlocked) return;
    const bufferSize = c.sampleRate * duration;
    const buffer = c.createBuffer(1, bufferSize, c.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
    const source = c.createBufferSource();
    source.buffer = buffer;
    const g = c.createGain();
    g.gain.setValueAtTime(gain, startTime);
    g.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);
    source.connect(g);
    g.connect(c.destination);
    source.start(startTime);
}

// ── Sound Library ──────────────────────────────────────────────────────────────
export const kravy = {

    /** 🔓 Must call on first user interaction to unlock browser audio */
    unlock() {
        const c = getCtx();
        if (!c) return;
        if (c.state === "suspended") {
            c.resume().then(() => { unlocked = true; });
        } else {
            unlocked = true;
        }
    },

    /** 🖱️ Subtle UI click — buttons, nav items */
    click() {
        const c = getCtx(); if (!c || !unlocked) return;
        const t = c.currentTime;
        tone(800, t, 0.08, 0.12, "sine");
    },

    /** ✅ Success / Save — form saved, action done */
    success() {
        const c = getCtx(); if (!c || !unlocked) return;
        const t = c.currentTime;
        tone(523, t, 0.15, 0.25);        // C5
        tone(659, t + 0.1, 0.15, 0.25); // E5
        tone(784, t + 0.2, 0.3, 0.3);  // G5
    },

    /** ❌ Error / Failed */
    error() {
        const c = getCtx(); if (!c || !unlocked) return;
        const t = c.currentTime;
        tone(220, t, 0.15, 0.3, "sawtooth");
        tone(180, t + 0.15, 0.25, 0.25, "sawtooth");
    },

    /** 🗑️ Delete / Remove */
    trash() {
        const c = getCtx(); if (!c || !unlocked) return;
        const t = c.currentTime;
        tone(400, t, 0.06, 0.2, "square");
        tone(280, t + 0.06, 0.1, 0.15, "square");
        noise(t, 0.2, 0.04);
    },

    /** 🛒 Add to cart / Add item */
    add() {
        const c = getCtx(); if (!c || !unlocked) return;
        const t = c.currentTime;
        tone(660, t, 0.08, 0.2);
        tone(880, t + 0.08, 0.12, 0.2);
    },

    /** ➖ Remove from cart */
    remove() {
        const c = getCtx(); if (!c || !unlocked) return;
        const t = c.currentTime;
        tone(440, t, 0.06, 0.2);
        tone(330, t + 0.06, 0.1, 0.15);
    },

    /** 🔔 New Order Bell — restaurant ding-dong */
    orderBell() {
        const c = getCtx(); if (!c || !unlocked) return;
        const t = c.currentTime;
        tone(880, t, 0.5, 0.4);
        tone(660, t + 0.2, 0.4, 0.3);
        tone(880, t + 0.5, 0.5, 0.4);
        tone(990, t + 0.7, 0.8, 0.35);
    },

    /** ✅ Order accepted */
    orderAccept() {
        const c = getCtx(); if (!c || !unlocked) return;
        const t = c.currentTime;
        tone(440, t, 0.1, 0.2);
        tone(554, t + 0.1, 0.1, 0.2);
        tone(659, t + 0.2, 0.2, 0.25);
        tone(880, t + 0.35, 0.3, 0.3);
    },

    /** 🍽️ Order ready / served */
    orderReady() {
        const c = getCtx(); if (!c || !unlocked) return;
        const t = c.currentTime;
        [523, 659, 784, 1047].forEach((f, i) => {
            tone(f, t + i * 0.1, 0.3, 0.25);
        });
    },

    /** ❌ Order cancelled */
    orderCancel() {
        const c = getCtx(); if (!c || !unlocked) return;
        const t = c.currentTime;
        tone(440, t, 0.1, 0.3);
        tone(370, t + 0.1, 0.15, 0.25);
        tone(294, t + 0.25, 0.25, 0.2, "sawtooth");
    },

    /** 💾 Upload / image uploaded */
    upload() {
        const c = getCtx(); if (!c || !unlocked) return;
        const t = c.currentTime;
        tone(300, t, 0.05, 0.1, "sine");
        tone(600, t + 0.05, 0.05, 0.15);
        tone(900, t + 0.1, 0.05, 0.2);
        tone(1200, t + 0.15, 0.2, 0.25);
    },

    /** 💰 Payment / checkout */
    payment() {
        const c = getCtx(); if (!c || !unlocked) return;
        const t = c.currentTime;
        // Cash register "cha-ching" feel
        noise(t, 0.05, 0.08);
        tone(1047, t, 0.15, 0.35);
        tone(1319, t + 0.12, 0.2, 0.3);
        noise(t + 0.15, 0.06, 0.06);
    },

    /** 🔁 Toggle / switch */
    toggle() {
        const c = getCtx(); if (!c || !unlocked) return;
        const t = c.currentTime;
        tone(600, t, 0.04, 0.15, "square");
        tone(900, t + 0.04, 0.06, 0.12, "square");
    },

    /** ⭐ Review received */
    review() {
        const c = getCtx(); if (!c || !unlocked) return;
        const t = c.currentTime;
        [523, 659, 784].forEach((f, i) => {
            tone(f, t + i * 0.15, 0.4, 0.2);
        });
    },

    /** 📋 Copy / clipboard */
    copy() {
        const c = getCtx(); if (!c || !unlocked) return;
        const t = c.currentTime;
        tone(700, t, 0.05, 0.12);
        tone(900, t + 0.05, 0.08, 0.12);
    },

    /** 🔍 Open / expand / modal */
    open() {
        const c = getCtx(); if (!c || !unlocked) return;
        const t = c.currentTime;
        tone(400, t, 0.05, 0.15);
        tone(600, t + 0.05, 0.08, 0.18);
        tone(800, t + 0.1, 0.1, 0.15);
    },

    /** 🚪 Close / dismiss / modal close */
    close() {
        const c = getCtx(); if (!c || !unlocked) return;
        const t = c.currentTime;
        tone(600, t, 0.05, 0.1);
        tone(400, t + 0.05, 0.08, 0.1);
    },

    /** 🔔 Gentle notification ping */
    ping() {
        const c = getCtx(); if (!c || !unlocked) return;
        const t = c.currentTime;
        tone(880, t, 0.3, 0.2);
    },

    /** 📤 Print */
    print() {
        const c = getCtx(); if (!c || !unlocked) return;
        const t = c.currentTime;
        noise(t, 0.08, 0.05);
        for (let i = 0; i < 3; i++) {
            noise(t + 0.1 + i * 0.12, 0.1, 0.04);
        }
    },
};

// ── Auto-unlock on any interaction ────────────────────────────────────────────
if (typeof window !== "undefined") {
    const handlers = ["click", "keydown", "touchstart", "pointerdown"];
    const doUnlock = () => {
        kravy.unlock();
        handlers.forEach(e => window.removeEventListener(e, doUnlock));
    };
    handlers.forEach(e => window.addEventListener(e, doUnlock, { once: true }));
}
