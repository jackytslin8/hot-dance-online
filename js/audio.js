// ============================================
//  熱舞 Online - 音訊引擎
//  支援: 合成旋律 + 外部 MP3 + 用戶上傳
// ============================================

const SONGS = [
    { id: 0, title: '🎵 小星星 Twinkle', bpm: 90, type: 'synth',
        melody: [262,262,392,392,440,440,392,0,349,349,330,330,294,294,262,0,392,392,349,349,330,330,294,0,392,392,349,349,330,330,294,0,262,262,392,392,440,440,392,0,349,349,330,330,294,294,262,0],
        bass: [131,131,196,196,220,220,196,0,175,175,165,165,147,147,131,0,196,196,175,175,165,165,147,0,196,196,175,175,165,165,147,0,131,131,196,196,220,220,196,0,175,175,165,165,147,147,131,0] },
    { id: 1, title: '🎶 歡樂頌 Ode to Joy', bpm: 100, type: 'synth',
        melody: [330,330,349,392,392,349,330,294,262,262,294,330,330,294,294,0,330,330,349,392,392,349,330,294,262,262,294,330,294,262,262,0,294,294,330,262,294,330,349,330,262,294,330,349,330,262,294,196,262,0],
        bass: [165,165,175,196,196,175,165,147,131,131,147,165,165,147,147,0,165,165,175,196,196,175,165,147,131,131,147,165,147,131,131,0,147,147,165,131,147,165,175,165,131,147,165,175,165,131,147,98,131,0] },
    { id: 2, title: '⚡ 電子狂潮 EDM', bpm: 128, type: 'synth',
        melody: [523,0,659,0,784,0,523,0,659,0,784,0,1047,0,784,0,523,0,659,0,784,0,1047,0,784,0,659,0,523,0,0,0,392,0,523,0,659,0,392,0,523,0,659,0,784,0,659,0],
        bass: [131,0,131,0,165,0,131,0,165,0,165,0,196,0,165,0,131,0,131,0,165,0,196,0,165,0,131,0,131,0,0,0,98,0,98,0,131,0,98,0,131,0,131,0,165,0,131,0] },
    { id: 3, title: '🌸 日系動漫風', bpm: 120, type: 'synth',
        melody: [523,494,440,392,440,494,523,0,659,587,523,494,523,587,659,0,523,440,392,349,392,440,523,0,494,440,392,349,330,294,262,0,392,440,523,587,659,587,523,0,440,392,349,392,440,523,440,0],
        bass: [262,247,220,196,220,247,262,0,330,294,262,247,262,294,330,0,262,220,196,175,196,220,262,0,247,220,196,175,165,147,131,0,196,220,262,294,330,294,262,0,220,196,175,196,220,262,220,0] },
    { id: 4, title: '🔥 Neon City Rave', bpm: 128, type: 'mp3', url: 'https://cdn.pixabay.com/audio/2022/03/10/audio_cbf6477353.mp3' },
    { id: 5, title: '💎 Electronic Future', bpm: 126, type: 'mp3', url: 'https://cdn.pixabay.com/audio/2022/01/18/audio_d0a13f69d2.mp3' },
    { id: 6, title: '🌙 Night Drive', bpm: 110, type: 'mp3', url: 'https://cdn.pixabay.com/audio/2022/08/02/audio_884fe92c21.mp3' },
    { id: 7, title: '🎧 Upbeat Energy', bpm: 120, type: 'mp3', url: 'https://cdn.pixabay.com/audio/2023/09/04/audio_6fb25c5e4e.mp3' },
    { id: 8, title: '🌟 Synthwave Dream', bpm: 100, type: 'mp3', url: 'https://cdn.pixabay.com/audio/2022/10/25/audio_57017e3e0e.mp3' },
    { id: 9, title: '🎤 Custom Upload', bpm: 120, type: 'upload' },
    { id: 10, title: '🔥 Neon Pocketfire', bpm: 150, type: 'mp3', url: 'assets/neon-pocketfire.mp3',
      chart: [{"time":1.691,"col":2,"reverse":false},{"time":2.061,"col":1,"reverse":false},{"time":2.4,"col":0,"reverse":false},{"time":2.78,"col":3,"reverse":false},{"time":3.16,"col":1,"reverse":false},{"time":4.851,"col":2,"reverse":false},{"time":5.251,"col":1,"reverse":false},{"time":5.619,"col":0,"reverse":false},{"time":5.971,"col":3,"reverse":false},{"time":6.44,"col":2,"reverse":false},{"time":8.021,"col":2,"reverse":false},{"time":8.411,"col":1,"reverse":false},{"time":8.8,"col":0,"reverse":false},{"time":9.171,"col":3,"reverse":false},{"time":9.54,"col":2,"reverse":false},{"time":11.189,"col":1,"reverse":false},{"time":12,"col":2,"reverse":false},{"time":12.489,"col":1,"reverse":false},{"time":12.787,"col":3,"reverse":false},{"time":13.139,"col":0,"reverse":false},{"time":13.549,"col":2,"reverse":false},{"time":13.931,"col":1,"reverse":false},{"time":14.369,"col":3,"reverse":false},{"time":15.12,"col":2,"reverse":false},{"time":15.501,"col":1,"reverse":false},{"time":15.891,"col":0,"reverse":false},{"time":16.28,"col":2,"reverse":false},{"time":16.639,"col":1,"reverse":false},{"time":17.079,"col":3,"reverse":false},{"time":17.449,"col":2,"reverse":false},{"time":18.261,"col":2,"reverse":false},{"time":18.639,"col":1,"reverse":false},{"time":19.04,"col":0,"reverse":false},{"time":19.4,"col":3,"reverse":false},{"time":19.848,"col":0,"reverse":false},{"time":20.261,"col":1,"reverse":false},{"time":20.611,"col":2,"reverse":false},{"time":21.44,"col":2,"reverse":false},{"time":21.861,"col":1,"reverse":false},{"time":22.22,"col":3,"reverse":false},{"time":22.667,"col":0,"reverse":false},{"time":23.021,"col":2,"reverse":false},{"time":23.381,"col":1,"reverse":false},{"time":23.781,"col":3,"reverse":false},{"time":24.621,"col":1,"reverse":false},{"time":25.051,"col":2,"reverse":false},{"time":25.371,"col":1,"reverse":false},{"time":25.789,"col":0,"reverse":false},{"time":26.181,"col":2,"reverse":false},{"time":26.589,"col":1,"reverse":false},{"time":26.971,"col":0,"reverse":false},{"time":27.781,"col":0,"reverse":false},{"time":28.149,"col":3,"reverse":false},{"time":28.549,"col":2,"reverse":false},{"time":28.968,"col":1,"reverse":false},{"time":29.309,"col":3,"reverse":false},{"time":29.7,"col":0,"reverse":false},{"time":30.12,"col":2,"reverse":false},{"time":30.509,"col":1,"reverse":false},{"time":30.93,"col":1,"reverse":false},{"time":31.301,"col":0,"reverse":false},{"time":31.629,"col":3,"reverse":false},{"time":32.091,"col":2,"reverse":false},{"time":32.501,"col":2,"reverse":false},{"time":32.869,"col":1,"reverse":false},{"time":33.251,"col":0,"reverse":false},{"time":33.688,"col":0,"reverse":false},{"time":34.061,"col":3,"reverse":false},{"time":34.46,"col":3,"reverse":false},{"time":34.869,"col":2,"reverse":false},{"time":35.268,"col":1,"reverse":false},{"time":35.629,"col":3,"reverse":false},{"time":36.021,"col":2,"reverse":false},{"time":36.44,"col":1,"reverse":false},{"time":36.84,"col":0,"reverse":false},{"time":38.051,"col":1,"reverse":false},{"time":38.48,"col":1,"reverse":false},{"time":38.861,"col":2,"reverse":false},{"time":39.24,"col":2,"reverse":false},{"time":39.6,"col":1,"reverse":false},{"time":40.341,"col":2,"reverse":false},{"time":40.741,"col":2,"reverse":false},{"time":41.129,"col":1,"reverse":false},{"time":41.53,"col":0,"reverse":false},{"time":41.94,"col":3,"reverse":false},{"time":42.331,"col":0,"reverse":false},{"time":42.74,"col":3,"reverse":false},{"time":43.56,"col":1,"reverse":false},{"time":43.949,"col":2,"reverse":false},{"time":44.32,"col":1,"reverse":false},{"time":44.709,"col":3,"reverse":false},{"time":45.149,"col":0,"reverse":false},{"time":45.508,"col":2,"reverse":false},{"time":45.909,"col":1,"reverse":false},{"time":46.269,"col":0,"reverse":false},{"time":46.669,"col":2,"reverse":false},{"time":47.069,"col":1,"reverse":false},{"time":47.451,"col":3,"reverse":false},{"time":47.851,"col":3,"reverse":false},{"time":48.269,"col":0,"reverse":false},{"time":48.68,"col":0,"reverse":false},{"time":49.04,"col":2,"reverse":false},{"time":49.469,"col":1,"reverse":false},{"time":49.861,"col":0,"reverse":false},{"time":50.261,"col":3,"reverse":false},{"time":50.638,"col":2,"reverse":false},{"time":51.029,"col":1,"reverse":false},{"time":51.421,"col":0,"reverse":false},{"time":51.781,"col":3,"reverse":false},{"time":52.188,"col":2,"reverse":false},{"time":53.02,"col":2,"reverse":false},{"time":53.4,"col":1,"reverse":false},{"time":53.8,"col":0,"reverse":false},{"time":54.171,"col":3,"reverse":false},{"time":54.629,"col":2,"reverse":false},{"time":54.989,"col":1,"reverse":false},{"time":55.421,"col":0,"reverse":false},{"time":55.789,"col":3,"reverse":false},{"time":56.171,"col":2,"reverse":false},{"time":56.56,"col":1,"reverse":false},{"time":57.011,"col":0,"reverse":false},{"time":57.36,"col":3,"reverse":false},{"time":57.741,"col":2,"reverse":false},{"time":58.149,"col":1,"reverse":false},{"time":58.509,"col":0,"reverse":false},{"time":58.861,"col":3,"reverse":false},{"time":59.261,"col":3,"reverse":false},{"time":59.701,"col":0,"reverse":false},{"time":60.101,"col":2,"reverse":false},{"time":60.491,"col":1,"reverse":false},{"time":60.861,"col":0,"reverse":false},{"time":61.24,"col":3,"reverse":false},{"time":61.691,"col":2,"reverse":false},{"time":62.08,"col":1,"reverse":false},{"time":62.507,"col":0,"reverse":false},{"time":62.891,"col":2,"reverse":false},{"time":63.319,"col":1,"reverse":false},{"time":64.879,"col":1,"reverse":false},{"time":66.46,"col":2,"reverse":false},{"time":68.011,"col":3,"reverse":false},{"time":69.621,"col":0,"reverse":false},{"time":71.2,"col":2,"reverse":false},{"time":72.011,"col":1,"reverse":false},{"time":72.749,"col":0,"reverse":false},{"time":73.12,"col":3,"reverse":false},{"time":73.52,"col":2,"reverse":false},{"time":73.909,"col":1,"reverse":false},{"time":74.331,"col":0,"reverse":false},{"time":75.92,"col":2,"reverse":false},{"time":76.307,"col":1,"reverse":false},{"time":76.689,"col":3,"reverse":false},{"time":77.1,"col":0,"reverse":false},{"time":77.49,"col":2,"reverse":false},{"time":78.307,"col":1,"reverse":false},{"time":78.669,"col":0,"reverse":false},{"time":79.051,"col":2,"reverse":false},{"time":79.451,"col":1,"reverse":false},{"time":79.811,"col":3,"reverse":false},{"time":80.249,"col":2,"reverse":false},{"time":80.64,"col":1,"reverse":false},{"time":81.459,"col":0,"reverse":false},{"time":81.821,"col":2,"reverse":false},{"time":82.24,"col":1,"reverse":false},{"time":82.669,"col":2,"reverse":false},{"time":83.01,"col":0,"reverse":false},{"time":83.341,"col":3,"reverse":false},{"time":83.731,"col":2,"reverse":false},{"time":84.109,"col":1,"reverse":false},{"time":84.54,"col":0,"reverse":false},{"time":84.941,"col":3,"reverse":false},{"time":85.38,"col":2,"reverse":false},{"time":85.781,"col":2,"reverse":false},{"time":86.189,"col":1,"reverse":false},{"time":86.6,"col":1,"reverse":false},{"time":86.971,"col":3,"reverse":false},{"time":87.341,"col":0,"reverse":false},{"time":87.701,"col":2,"reverse":false},{"time":88.129,"col":1,"reverse":false},{"time":88.56,"col":0,"reverse":false},{"time":88.92,"col":3,"reverse":false},{"time":89.381,"col":2,"reverse":false},{"time":89.76,"col":1,"reverse":false},{"time":90.13,"col":0,"reverse":false},{"time":90.92,"col":0,"reverse":false},{"time":91.309,"col":2,"reverse":false},{"time":91.691,"col":1,"reverse":false},{"time":92.091,"col":3,"reverse":false},{"time":92.509,"col":2,"reverse":false},{"time":92.88,"col":1,"reverse":false},{"time":93.289,"col":0,"reverse":false},{"time":93.621,"col":3,"reverse":false},{"time":94.061,"col":2,"reverse":false},{"time":94.461,"col":1,"reverse":false},{"time":94.85,"col":0,"reverse":false},{"time":95.251,"col":3,"reverse":false},{"time":95.6,"col":0,"reverse":false},{"time":96.011,"col":2,"reverse":false},{"time":96.421,"col":1,"reverse":false},{"time":96.849,"col":3,"reverse":false},{"time":97.221,"col":2,"reverse":false},{"time":97.621,"col":1,"reverse":false},{"time":98.011,"col":0,"reverse":false},{"time":98.421,"col":3,"reverse":false},{"time":98.8,"col":0,"reverse":false},{"time":99.149,"col":1,"reverse":false},{"time":99.549,"col":1,"reverse":false},{"time":101.181,"col":1,"reverse":false},{"time":101.56,"col":0,"reverse":false},{"time":102.01,"col":3,"reverse":false},{"time":102.419,"col":2,"reverse":false},{"time":102.8,"col":1,"reverse":false},{"time":103.16,"col":0,"reverse":false},{"time":103.531,"col":3,"reverse":false},{"time":103.931,"col":2,"reverse":false},{"time":104.309,"col":1,"reverse":false},{"time":104.72,"col":1,"reverse":false},{"time":105.09,"col":2,"reverse":false},{"time":105.48,"col":2,"reverse":false},{"time":105.88,"col":0,"reverse":false},{"time":106.291,"col":3,"reverse":false},{"time":106.72,"col":0,"reverse":false},{"time":107.109,"col":3,"reverse":false},{"time":107.478,"col":2,"reverse":false},{"time":107.851,"col":1,"reverse":false},{"time":108.251,"col":0,"reverse":false},{"time":108.62,"col":3,"reverse":false},{"time":109.04,"col":2,"reverse":false},{"time":109.44,"col":1,"reverse":false},{"time":109.88,"col":0,"reverse":false},{"time":110.229,"col":3,"reverse":false},{"time":110.651,"col":2,"reverse":false},{"time":111.061,"col":2,"reverse":false},{"time":111.469,"col":1,"reverse":false},{"time":111.84,"col":1,"reverse":false},{"time":112.251,"col":2,"reverse":false},{"time":112.629,"col":2,"reverse":false},{"time":113.011,"col":1,"reverse":false},{"time":113.4,"col":0,"reverse":false},{"time":113.811,"col":3,"reverse":false},{"time":114.221,"col":2,"reverse":false},{"time":114.571,"col":1,"reverse":false},{"time":114.981,"col":0,"reverse":false},{"time":115.347,"col":3,"reverse":false},{"time":115.741,"col":2,"reverse":false},{"time":116.061,"col":1,"reverse":false},{"time":116.53,"col":0,"reverse":false},{"time":116.92,"col":3,"reverse":false},{"time":117.331,"col":2,"reverse":false},{"time":117.718,"col":1,"reverse":false},{"time":118.129,"col":1,"reverse":false},{"time":118.501,"col":0,"reverse":false},{"time":118.88,"col":3,"reverse":false},{"time":119.331,"col":2,"reverse":false},{"time":119.749,"col":1,"reverse":false},{"time":120.147,"col":0,"reverse":false},{"time":120.549,"col":3,"reverse":false},{"time":120.891,"col":2,"reverse":false},{"time":121.279,"col":2,"reverse":false},{"time":121.68,"col":1,"reverse":false},{"time":122.109,"col":1,"reverse":false},{"time":122.479,"col":0,"reverse":false},{"time":122.851,"col":2,"reverse":false},{"time":123.24,"col":1,"reverse":false},{"time":123.621,"col":3,"reverse":false},{"time":124.011,"col":3,"reverse":false},{"time":124.381,"col":1,"reverse":false},{"time":124.811,"col":2,"reverse":false},{"time":125.221,"col":1,"reverse":false},{"time":125.621,"col":0,"reverse":false},{"time":126,"col":2,"reverse":false},{"time":126.44,"col":1,"reverse":false},{"time":128.011,"col":1,"reverse":false},{"time":128.821,"col":2,"reverse":false},{"time":129.6,"col":3,"reverse":false},{"time":129.989,"col":0,"reverse":false},{"time":130.379,"col":3,"reverse":false},{"time":131.211,"col":2,"reverse":false},{"time":131.501,"col":1,"reverse":false},{"time":131.941,"col":0,"reverse":false},{"time":132.32,"col":3,"reverse":false},{"time":132.76,"col":2,"reverse":false},{"time":134.341,"col":1,"reverse":false},{"time":134.731,"col":2,"reverse":false},{"time":135.171,"col":1,"reverse":false},{"time":135.541,"col":0,"reverse":false},{"time":135.869,"col":3,"reverse":false},{"time":136.28,"col":2,"reverse":false},{"time":136.718,"col":1,"reverse":false},{"time":137.091,"col":0,"reverse":false},{"time":137.461,"col":3,"reverse":false},{"time":138.28,"col":2,"reverse":false},{"time":139.118,"col":1,"reverse":false}]
    },
];

class AudioEngine {
    constructor() {
        this.ctx = null;
        this.initialized = false;
        this.startTime = 0;
        this.scheduledNodes = [];
        this.bgmAudio = null;
        this.currentSong = null;
        this._loopTimeout = null;
        // Beat detection
        this.analyser = null;
        this.freqData = null;
        this.beatDetected = false;
        this._prevEnergy = 0;
        this._beatCallbacks = [];
        // Dynamic BPM
        this._beatTimes = [];
        this.detectedBPM = 0;
    }
    init() {
        if (this.initialized) {
            // 如果 context 被 suspend，嘗試 resume
            if (this.ctx && this.ctx.state === 'suspended') {
                this.ctx.resume().catch(() => {});
            }
            return;
        }
        this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        this.initialized = true;
        console.log('AudioContext created, state:', this.ctx.state);
    }
    getBGMTime() {
        if (!this.ctx) return 0;
        if (this.bgmAudio && this.currentSong && (this.currentSong.type === 'mp3' || this.currentSong.type === 'upload')) {
            return this.bgmAudio.currentTime;
        }
        if (this.startTime > 0) return this.ctx.currentTime - this.startTime;
        return 0;
    }
    playBGM(songId, uploadUrl) {
        this.stopBGM();
        this.init();  // init 在 stopBGM 之後，確保 context 是活的
        const song = SONGS[songId] || SONGS[0];
        this.currentSong = song;
        if (song.type === 'mp3' || (song.type === 'upload' && uploadUrl)) {
            this._playMP3(uploadUrl || song.url);
        } else {
            this._playSynth(song);
        }
    }
    getLeadIn() {
        if (!this.currentSong) return 4;
        if (this.currentSong.type === 'mp3' || this.currentSong.type === 'upload') return 6;
        return 4;
    }
    _playMP3(url) {
        this.bgmAudio = new Audio();
        this.bgmAudio.src = url;
        this.bgmAudio.loop = true;
        this.bgmAudio.crossOrigin = 'anonymous';

        // 連接 Analyser 做 beat detection
        this._connectAnalyser();

        // 確保 AudioContext 已 resume 再播放
        const doPlay = () => {
            this._connectAnalyser();
            this.bgmAudio.play().then(() => {
                console.log('MP3 playing OK:', url);
            }).catch(e => {
                console.warn('MP3 play blocked:', e.message);
                const el = document.getElementById('song-title');
                if (el) el.textContent = '⚠️ 點擊螢幕播放音樂';
                const retry = () => {
                    this.bgmAudio.play().catch(() => {});
                    document.removeEventListener('click', retry);
                    document.removeEventListener('touchstart', retry);
                };
                document.addEventListener('click', retry);
                document.addEventListener('touchstart', retry);
            });
        };
        if (this.ctx.state === 'suspended') {
            this.ctx.resume().then(doPlay).catch(doPlay);
        } else {
            doPlay();
        }
    }
    _connectAnalyser() {
        // 建立 source 節點（每個 Audio 元素只能呼叫一次）
        const source = this.ctx.createMediaElementSource(this.bgmAudio);
        try {
            // 嘗試 source → analyser → destination（有 beat detection）
            this.analyser = this.ctx.createAnalyser();
            this.analyser.fftSize = 256;
            source.connect(this.analyser);
            this.analyser.connect(this.ctx.destination);
            this.freqData = new Uint8Array(this.analyser.frequencyBinCount);
            console.log('Analyser connected OK');
        } catch(e) {
            // analyser 失敗 → source 直接連 destination（無 beat detection）
            console.warn('Analyser failed, fallback to direct:', e);
            this.analyser = null;
            source.connect(this.ctx.destination);
        }
    }
    // 偵測重拍（低頻能量突增）並追蹤 BPM
    detectBeat() {
        if (!this.analyser || !this.freqData) return false;
        this.analyser.getByteFrequencyData(this.freqData);
        // 只看低頻 (前 10 個 bin ≈ 0-800Hz)
        let energy = 0;
        for (let i = 0; i < 10; i++) energy += this.freqData[i];
        energy /= 10;
        const threshold = this._prevEnergy * 1.35 + 8;
        const isBeat = energy > threshold && energy > 35;
        this._prevEnergy = this._prevEnergy * 0.85 + energy * 0.15;

        if (isBeat) {
            const now = performance.now();
            this._beatTimes.push(now);
            // 只保留最近 12 拍
            if (this._beatTimes.length > 12) this._beatTimes.shift();
            // 計算 BPM
            if (this._beatTimes.length >= 3) {
                const intervals = [];
                for (let i = 1; i < this._beatTimes.length; i++) {
                    const gap = this._beatTimes[i] - this._beatTimes[i-1];
                    // 過濾不合理間隔 (30-300 BPM)
                    if (gap > 200 && gap < 2000) intervals.push(gap);
                }
                if (intervals.length >= 2) {
                    const avgMs = intervals.reduce((a,b) => a+b, 0) / intervals.length;
                    this.detectedBPM = Math.round(60000 / avgMs);
                }
            }
        }
        return isBeat;
    }
    getDetectedBPM() { return this.detectedBPM; }
    _playSynth(song) {
        const beatDur = 60 / song.bpm;
        this.startTime = this.ctx.currentTime + 0.1;
        for (let i = 0; i < song.melody.length; i++) {
            const t = this.startTime + i * beatDur;
            if (song.melody[i] > 0) this._scheduleTone(t, song.melody[i], 0.25, 'triangle', 0.15);
            if (song.bass[i] > 0) this._scheduleTone(t, song.bass[i], 0.3, 'sine', 0.12);
            if (i % 2 === 0) this._scheduleTone(t, 3000, 0.01, 'square', 0.03);
        }
        const total = song.melody.length * beatDur;
        this._loopTimeout = setTimeout(() => { if (this.startTime > 0) this._playSynth(song); }, total * 1000);
    }
    _scheduleTone(time, freq, dur, type, vol) {
        try {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = type;
            osc.frequency.value = freq;
            gain.gain.setValueAtTime(vol, time);
            gain.gain.exponentialRampToValueAtTime(0.001, time + dur);
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start(time);
            osc.stop(time + dur);
            this.scheduledNodes.push(osc);
        } catch(e) {}
    }
    stopBGM() {
        if (this._loopTimeout) clearTimeout(this._loopTimeout);
        this.scheduledNodes.forEach(n => { try { n.stop(); } catch(e) {} });
        this.scheduledNodes = [];
        this.startTime = 0;
        if (this.bgmAudio) { this.bgmAudio.pause(); this.bgmAudio.currentTime = 0; this.bgmAudio = null; }
    }
    playTone(freq, dur, type = 'sine', vol = 0.3) {
        if (!this.initialized) return;
        try {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = type;
            osc.frequency.value = freq;
            gain.gain.setValueAtTime(vol, this.ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + dur);
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start();
            osc.stop(this.ctx.currentTime + dur);
        } catch(e) {}
    }
    playTap() { this.playTone(800, 0.05, 'square', 0.15); }
    playPerfect() { this.playTone(1200, 0.1, 'sine', 0.3); setTimeout(() => this.playTone(1600, 0.15, 'sine', 0.25), 50); }
    playGreat() { this.playTone(900, 0.12, 'sine', 0.25); }
    playCool() { this.playTone(600, 0.1, 'triangle', 0.2); }
    playBad() { this.playTone(300, 0.15, 'sawtooth', 0.15); }
    playMiss() { this.playTone(200, 0.2, 'sawtooth', 0.1); }
    playFever() { for (let i = 0; i < 8; i++) setTimeout(() => this.playTone(400 + i*100, 0.1, 'square', 0.15), i*50); }
}

window.audioEngine = new AudioEngine();
