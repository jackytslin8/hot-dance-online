// ============================================
//  AudioEngine - MP3 合成混合引擎
//  支援: 合成旋律 + 外部 MP3 + 用戶上傳
// ============================================

// 內建免費音軌 (使用 Pixabay 免版權音樂)
const SONGS = [
    {
        id: 0, title: '🎵 小星星 Twinkle', bpm: 90, type: 'synth',
        melody: [262,262,392,392,440,440,392,0,349,349,330,330,294,294,262,0,392,392,349,349,330,330,294,0,392,392,349,349,330,330,294,0,262,262,392,392,440,440,392,0,349,349,330,330,294,294,262,0],
        bass: [131,131,196,196,220,220,196,0,175,175,165,165,147,147,131,0,196,196,175,175,165,165,147,0,196,196,175,175,165,165,147,0,131,131,196,196,220,220,196,0,175,175,165,165,147,147,131,0],
    },
    {
        id: 1, title: '🎶 歡樂頌 Ode to Joy', bpm: 100, type: 'synth',
        melody: [330,330,349,392,392,349,330,294,262,262,294,330,330,294,294,0,330,330,349,392,392,349,330,294,262,262,294,330,294,262,262,0,294,294,330,262,294,330,349,330,262,294,330,349,330,262,294,196,262,0],
        bass: [165,165,175,196,196,175,165,147,131,131,147,165,165,147,147,0,165,165,175,196,196,175,165,147,131,131,147,165,147,131,131,0,147,147,165,131,147,165,175,165,131,147,165,175,165,131,147,98,131,0],
    },
    {
        id: 2, title: '⚡ 電子狂潮 EDM', bpm: 128, type: 'synth',
        melody: [523,0,659,0,784,0,523,0,659,0,784,0,1047,0,784,0,523,0,659,0,784,0,1047,0,784,0,659,0,523,0,0,0,392,0,523,0,659,0,392,0,523,0,659,0,784,0,659,0],
        bass: [131,0,131,0,165,0,131,0,165,0,165,0,196,0,165,0,131,0,131,0,165,0,196,0,165,0,131,0,131,0,0,0,98,0,98,0,131,0,98,0,131,0,131,0,165,0,131,0],
    },
    {
        id: 3, title: '🌸 日系動漫風', bpm: 120, type: 'synth',
        melody: [523,494,440,392,440,494,523,0,659,587,523,494,523,587,659,0,523,440,392,349,392,440,523,0,494,440,392,349,330,294,262,0,392,440,523,587,659,587,523,0,440,392,349,392,440,523,440,0],
        bass: [262,247,220,196,220,247,262,0,330,294,262,247,262,294,330,0,262,220,196,175,196,220,262,0,247,220,196,175,165,147,131,0,196,220,262,294,330,294,262,0,220,196,175,196,220,262,220,0],
    },
    // MP3 歌曲 (免版權 EDM)
    {
        id: 4, title: '🔥 Neon City Rave', bpm: 128, type: 'mp3',
        url: 'https://cdn.pixabay.com/audio/2022/03/10/audio_cbf6477353.mp3',
    },
    {
        id: 5, title: '💎 Electronic Future', bpm: 126, type: 'mp3',
        url: 'https://cdn.pixabay.com/audio/2022/01/18/audio_d0a13f69d2.mp3',
    },
    {
        id: 6, title: '🌙 Night Drive', bpm: 110, type: 'mp3',
        url: 'https://cdn.pixabay.com/audio/2022/08/02/audio_884fe92c21.mp3',
    },
    {
        id: 7, title: '🎧 Upbeat Energy', bpm: 120, type: 'mp3',
        url: 'https://cdn.pixabay.com/audio/2023/09/04/audio_6fb25c5e4e.mp3',
    },
    {
        id: 8, title: '🌟 Synthwave Dream', bpm: 100, type: 'mp3',
        url: 'https://cdn.pixabay.com/audio/2022/10/25/audio_57017e3e0e.mp3',
    },
    {
        id: 9, title: '🎤 Custom Upload', bpm: 120, type: 'upload',
    },
];

class AudioEngine {
    constructor() {
        this.ctx = null;
        this.initialized = false;
        this.startTime = 0;
        this.scheduledNodes = [];
        this.bgmAudio = null;      // HTML5 Audio 元素 (MP3)
        this.bgmSource = null;     // MediaElementSourceNode
        this.currentSong = null;
        this._loopTimeout = null;
    }

    init() {
        if (this.initialized) return;
        this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        this.initialized = true;
    }

    getBGMTime() {
        if (!this.ctx) return 0;

        // MP3 模式：用 HTML5 Audio 的 currentTime
        if (this.bgmAudio && this.currentSong && this.currentSong.type === 'mp3') {
            return this.bgmAudio.currentTime;
        }
        // Upload 模式：同上
        if (this.bgmAudio && this.currentSong && this.currentSong.type === 'upload') {
            return this.bgmAudio.currentTime;
        }
        // 合成模式：用 AudioContext 時鐘
        if (this.startTime > 0) {
            return this.ctx.currentTime - this.startTime;
        }
        return 0;
    }

    playBGM(songId, uploadUrl) {
        this.init();
        this.stopBGM();

        const song = SONGS[songId] || SONGS[0];
        this.currentSong = song;

        if (song.type === 'mp3' || (song.type === 'upload' && uploadUrl)) {
            this._playMP3(uploadUrl || song.url);
        } else {
            this._playSynth(song);
        }
    }

    // 取得箭頭應開始出現的延遲秒數 (讓音樂先播放一段)
    getLeadIn() {
        if (!this.currentSong) return 4;
        if (this.currentSong.type === 'mp3' || this.currentSong.type === 'upload') return 6; // MP3 多等 2 秒讓音樂 establish
        return 4; // 合成音樂等 4 秒
    }

    _playMP3(url) {
        this.bgmAudio = new Audio();
        this.bgmAudio.src = url;
        this.bgmAudio.loop = true;
        // 不設 crossOrigin（本機 blob URL 不需要）

        this.bgmAudio.play().then(() => {
            console.log('MP3 playing:', url);
        }).catch(e => {
            console.warn('MP3 play failed:', e);
        });
    }

    _playSynth(song) {
        const beatDuration = 60 / song.bpm;
        this.startTime = this.ctx.currentTime + 0.1;

        for (let i = 0; i < song.melody.length; i++) {
            const time = this.startTime + i * beatDuration;
            const note = song.melody[i];
            const bassNote = song.bass[i];

            if (note > 0) this._scheduleTone(time, note, 0.25, 'triangle', 0.15);
            if (bassNote > 0) this._scheduleTone(time, bassNote, 0.3, 'sine', 0.12);
            if (i % 2 === 0) this._scheduleTone(time, 3000, 0.01, 'square', 0.03);
        }

        const totalDuration = song.melody.length * beatDuration;
        this._loopTimeout = setTimeout(() => {
            if (this.startTime > 0) this._playSynth(song);
        }, totalDuration * 1000);
    }

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
        if (this.bgmAudio) {
            this.bgmAudio.pause();
            this.bgmAudio.currentTime = 0;
            this.bgmAudio = null;
        }
        this.bgmSource = null;
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
