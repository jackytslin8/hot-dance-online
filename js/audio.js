// ============================================
//  AudioEngine - 精確音訊同步引擎
//  所有時鐘統一使用 AudioContext.currentTime
// ============================================

const SONGS = [
    {
        id: 0, title: '🎵 小星星 Twinkle', bpm: 90,
        melody: [262,262,392,392,440,440,392,0,349,349,330,330,294,294,262,0,392,392,349,349,330,330,294,0,392,392,349,349,330,330,294,0,262,262,392,392,440,440,392,0,349,349,330,330,294,294,262,0],
        bass: [131,131,196,196,220,220,196,0,175,175,165,165,147,147,131,0,196,196,175,175,165,165,147,0,196,196,175,175,165,165,147,0,131,131,196,196,220,220,196,0,175,175,165,165,147,147,131,0],
    },
    {
        id: 1, title: '🎶 歡樂頌 Ode to Joy', bpm: 100,
        melody: [330,330,349,392,392,349,330,294,262,262,294,330,330,294,294,0,330,330,349,392,392,349,330,294,262,262,294,330,294,262,262,0,294,294,330,262,294,330,349,330,262,294,330,349,330,262,294,196,262,0],
        bass: [165,165,175,196,196,175,165,147,131,131,147,165,165,147,147,0,165,165,175,196,196,175,165,147,131,131,147,165,147,131,131,0,147,147,165,131,147,165,175,165,131,147,165,175,165,131,147,98,131,0],
    },
    {
        id: 2, title: '🦢 天鵝湖 Swan Lake', bpm: 75,
        melody: [494,440,392,440,494,440,392,349,330,349,392,330,294,262,294,330,494,440,392,440,494,523,494,440,392,349,330,294,262,294,330,0,392,440,494,523,494,440,392,349,330,294,262,294,330,392,330,0],
        bass: [247,220,196,220,247,220,196,175,165,175,196,165,147,131,147,165,247,220,196,220,247,262,247,220,196,175,165,147,131,147,165,0,196,220,247,262,247,220,196,175,165,147,131,147,165,196,165,0],
    },
    {
        id: 3, title: '🎻 卡農 Canon', bpm: 70,
        melody: [523,494,440,392,349,330,294,262,294,330,349,392,440,494,523,0,523,494,440,392,349,330,294,262,294,330,349,392,330,294,262,0,392,349,330,294,262,294,330,349,392,440,494,523,494,440,392,0],
        bass: [131,147,165,196,175,165,147,131,147,165,175,196,220,247,262,0,131,147,165,196,175,165,147,131,147,165,175,196,165,147,131,0,196,175,165,147,131,147,165,175,196,220,247,262,247,220,196,0],
    },
    {
        id: 4, title: '🌙 月光奏鳴曲', bpm: 60,
        melody: [330,330,330,330,349,330,330,0,330,330,330,349,392,349,330,0,294,294,294,294,330,294,294,0,262,262,262,294,330,294,262,0,330,330,330,349,392,440,392,0,349,330,294,262,294,330,262,0],
        bass: [165,165,165,165,175,165,165,0,165,165,165,175,196,175,165,0,147,147,147,147,165,147,147,0,131,131,131,147,165,147,131,0,165,165,165,175,196,220,196,0,175,165,147,131,147,165,131,0],
    },
    {
        id: 5, title: '⚡ 電子狂潮 EDM', bpm: 128,
        melody: [523,0,659,0,784,0,523,0,659,0,784,0,1047,0,784,0,523,0,659,0,784,0,1047,0,784,0,659,0,523,0,0,0,392,0,523,0,659,0,392,0,523,0,659,0,784,0,659,0],
        bass: [131,0,131,0,165,0,131,0,165,0,165,0,196,0,165,0,131,0,131,0,165,0,196,0,165,0,131,0,131,0,0,0,98,0,98,0,131,0,98,0,131,0,131,0,165,0,131,0],
    },
    {
        id: 6, title: '🎸 搖滾節拍 Rock', bpm: 110,
        melody: [330,330,392,392,440,440,392,0,330,330,294,294,262,262,294,0,330,392,440,523,440,392,330,0,294,330,392,330,294,262,262,0,392,440,523,523,440,392,330,0,294,262,294,330,392,330,262,0],
        bass: [165,165,196,196,220,220,196,0,165,165,147,147,131,131,147,0,165,196,220,262,220,196,165,0,147,165,196,165,147,131,131,0,196,220,262,262,220,196,165,0,147,131,147,165,196,165,131,0],
    },
    {
        id: 7, title: '🕹️ 復古 8-bit', bpm: 105,
        melody: [523,523,523,0,392,392,0,523,587,587,523,0,392,0,523,0,659,659,587,0,523,0,392,0,523,523,523,0,392,0,523,0,659,659,784,0,659,0,587,0,523,523,392,0,523,0,0,0],
        bass: [131,131,131,0,98,98,0,131,147,147,131,0,98,0,131,0,165,165,147,0,131,0,98,0,131,131,131,0,98,0,131,0,165,165,196,0,165,0,147,0,131,131,98,0,131,0,0,0],
    },
    {
        id: 8, title: '🎷 爵士慵懶 Jazz', bpm: 85,
        melody: [294,330,349,392,440,392,349,330,294,262,294,330,349,330,294,0,392,440,494,523,494,440,392,349,330,349,392,349,330,294,262,0,349,392,440,494,440,392,349,330,294,330,349,392,330,294,262,0],
        bass: [147,165,175,196,220,196,175,165,147,131,147,165,175,165,147,0,196,220,247,262,247,220,196,175,165,175,196,175,165,147,131,0,175,196,220,247,220,196,175,165,147,165,175,196,165,147,131,0],
    },
    {
        id: 9, title: '🌸 日系動漫風', bpm: 120,
        melody: [523,494,440,392,440,494,523,0,659,587,523,494,523,587,659,0,523,440,392,349,392,440,523,0,494,440,392,349,330,294,262,0,392,440,523,587,659,587,523,0,440,392,349,392,440,523,440,0],
        bass: [262,247,220,196,220,247,262,0,330,294,262,247,262,294,330,0,262,220,196,175,196,220,262,0,247,220,196,175,165,147,131,0,196,220,262,294,330,294,262,0,220,196,175,196,220,262,220,0],
    },
];

class AudioEngine {
    constructor() {
        this.ctx = null;
        this.initialized = false;
        this.startTime = 0;       // AudioContext 時間（遊戲開始時）
        this.scheduledNodes = [];  // 追蹤所有已排程的音符，方便停止
    }

    init() {
        if (this.initialized) return;
        this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        this.initialized = true;
    }

    // 核心時鐘：全部對齊 AudioContext.currentTime
    getBGMTime() {
        if (!this.ctx || !this.startTime) return 0;
        return this.ctx.currentTime - this.startTime;
    }

    // 預排程整首歌的所有音符
    playBGM(songId) {
        this.init();
        this.stopBGM();

        const song = SONGS[songId] || SONGS[0];
        const beatDuration = 60 / song.bpm;

        // 記錄開始時間
        this.startTime = this.ctx.currentTime + 0.1; // 留 0.1 秒緩衝

        // 排程所有旋律和貝斯音符
        for (let i = 0; i < song.melody.length; i++) {
            const time = this.startTime + i * beatDuration;
            const note = song.melody[i];
            const bassNote = song.bass[i];

            if (note > 0) this._scheduleTone(time, note, 0.25, 'triangle', 0.15);
            if (bassNote > 0) this._scheduleTone(time, bassNote, 0.3, 'sine', 0.12);
            if (i % 2 === 0) this._scheduleTone(time, 3000, 0.01, 'square', 0.03);
        }

        // 設定循環（歌曲結束後重新開始）
        const totalDuration = song.melody.length * beatDuration;
        this._loopTimeout = setTimeout(() => {
            if (this.startTime > 0) this.playBGM(songId);
        }, totalDuration * 1000);
    }

    // 用 AudioContext 精確排程單個音符
    _scheduleTone(time, freq, duration, type, volume) {
        try {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = type;
            osc.frequency.value = freq;
            gain.gain.setValueAtTime(volume, time);
            gain.gain.exponentialRampToValueAtTime(0.001, time + duration);
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start(time);
            osc.stop(time + duration);
            this.scheduledNodes.push(osc);
        } catch(e) {}
    }

    stopBGM() {
        if (this._loopTimeout) clearTimeout(this._loopTimeout);
        this.scheduledNodes.forEach(n => { try { n.stop(); } catch(e) {} });
        this.scheduledNodes = [];
        this.startTime = 0;
    }

    playTone(freq, duration, type = 'sine', volume = 0.3) {
        if (!this.initialized) return;
        try {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = type;
            osc.frequency.value = freq;
            gain.gain.setValueAtTime(volume, this.ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start();
            osc.stop(this.ctx.currentTime + duration);
        } catch(e) {}
    }

    playTap() { this.playTone(800, 0.05, 'square', 0.15); }
    playPerfect() { this.playTone(1200, 0.1, 'sine', 0.3); setTimeout(() => this.playTone(1600, 0.15, 'sine', 0.25), 50); }
    playGreat() { this.playTone(900, 0.12, 'sine', 0.25); }
    playCool() { this.playTone(600, 0.1, 'triangle', 0.2); }
    playBad() { this.playTone(300, 0.15, 'sawtooth', 0.15); }
    playMiss() { this.playTone(200, 0.2, 'sawtooth', 0.1); }
    playFever() { for (let i = 0; i < 8; i++) setTimeout(() => this.playTone(400 + i * 100, 0.1, 'square', 0.15), i * 50); }
}

window.audioEngine = new AudioEngine();
