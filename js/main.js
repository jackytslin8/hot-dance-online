// ============================================
//  熱舞 Online - 經典復刻版
//  箭頭由下往上 + 4鍵 + 跳舞角色 + 反鍵模式
// ============================================

const CW = 500, CH = 700;
const COLS = ['ArrowLeft', 'ArrowDown', 'ArrowUp', 'ArrowRight'];
const COL_X = [100, 200, 300, 400];      // 每列 x 位置
const COL_COLORS = ['#00ffff', '#00ff00', '#ffff00', '#ff00ff'];
const JUDGE_Y = 120;                       // 判定線 y 位置
const HIT_Y = JUDGE_Y + 15;               // 箭頭抵達的 y

const CONFIG = {
    ARROW_SPEED: 350,
    PERFECT_WINDOW: 0.06,
    GREAT_WINDOW: 0.12,
    COOL_WINDOW: 0.20,
    BAD_WINDOW: 0.35,
    OFFSET: 0,
    BPM_OFFSET: 0,
};

const JUDGE = {
    PERFECT: { name: 'PERFECT', score: 300, color: '#ff0', combo: true },
    GREAT:   { name: 'GREAT',   score: 200, color: '#0ff', combo: true },
    COOL:    { name: 'COOL',    score: 100, color: '#0f0', combo: true },
    BAD:     { name: 'BAD',     score: 20,  color: '#f80', combo: false },
    MISS:    { name: 'MISS',    score: 0,   color: '#f00', combo: false },
};

let gameMode = 'normal'; // 'normal' | 'reverse'

// ====== 錄製模式 ======
let recordingMode = false;
let recordedNotes = [];
let recordStartTime = 0;

// ====== 校準模式 ======
let tapTimes = [];
let calibrating = false;
let liveMode = false;
let beatDetectedTimes = []; // 音訊偵測到的重拍時間
let userTapTimes = [];     // 使用者按方向鍵的時間

function handleTapTempo() {
    if (!calibrating) return;
    const now = window.audioEngine.getBGMTime();
    if (now <= 0) return;

    tapTimes.push(now);

    // 即時顯示 BPM
    if (tapTimes.length >= 3) {
        const recent = tapTimes.slice(-12);
        const intervals = [];
        for (let i = 1; i < recent.length; i++) intervals.push(recent[i] - recent[i-1]);
        const avgSec = intervals.reduce((a,b) => a+b, 0) / intervals.length;
        const bpm = Math.round(60 / avgSec);
        showCalibInfo(bpm, tapTimes.length);
    } else {
        showCalibInfo(null, tapTimes.length);
    }
}

function showCalibInfo(bpm, count) {
    let el = document.getElementById('calib-info');
    if (!el) {
        el = document.createElement('div');
        el.id = 'calib-info';
        el.style.cssText = 'position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);text-align:center;z-index:300;pointer-events:none;width:400px;';
        document.getElementById('game-container').appendChild(el);
    }
    const bpmText = bpm ? `<div style="font-size:48px;color:#ff0;text-shadow:0 0 20px #ff0;">🎵 ${bpm} BPM</div>` : '';
    el.innerHTML = `
        <div style="font-size:28px;color:#ff00ff;text-shadow:0 0 15px #f0f;margin-bottom:15px;">🎤 跟著音樂按 T 打拍子</div>
        ${bpmText}
        <div style="font-size:20px;color:#0ff;margin-top:10px;">已打 ${count} 拍</div>
        <div style="font-size:16px;color:#888;margin-top:20px;">打好後按 <span style="color:#0ff;border:1px solid #0ff;padding:2px 8px;border-radius:3px;">空白鍵</span> 開始遊戲</div>
    `;
}

function startCalibration(songId, uploadUrl) {
    const song = SONGS[songId] || SONGS[0];
    document.getElementById('song-title').textContent = song.title;
    currentScene = SCENES[Math.floor(Math.random() * SCENES.length)];

    window.audioEngine.init();
    window.audioEngine.playBGM(songId, uploadUrl);

    engine.currentSong = song;
    calibrating = true;
    tapTimes = [];
    beatDetectedTimes = [];
    userTapTimes = [];

    showCalibInfo(null, 0);

    // 開始偵測重拍並記錄
    startBeatTracking();
}

function startBeatTracking() {
    // 每幀檢查是否有重拍
    function track() {
        if (!calibrating) return;
        if (window.audioEngine.detectBeat()) {
            beatDetectedTimes.push(window.audioEngine.getBGMTime());
            // 螢幕閃一下表示偵測到重拍
            beatFlash = 0.5;
        }
        requestAnimationFrame(track);
    }
    requestAnimationFrame(track);
}

function finishCalibration() {
    if (tapTimes.length < 2) {
        // 沒打拍子，用預設
        const bpm = engine.currentSong ? engine.currentSong.bpm : 120;
        updateArrowSpeed(bpm);
        engine.initChart(bpm, window.audioEngine.getLeadIn());
    } else {
        // 計算 BPM
        const intervals = [];
        for (let i = 1; i < tapTimes.length; i++) intervals.push(tapTimes[i] - tapTimes[i-1]);
        const avgSec = intervals.reduce((a,b) => a+b, 0) / intervals.length;
        const bpm = Math.round(60 / avgSec);
        engine.currentSong.bpm = bpm;
        updateArrowSpeed(bpm);

        // 計算 offset：比較使用者拍子和偵測到的重拍
        let offsetSum = 0;
        let offsetCount = 0;
        for (const ut of tapTimes) {
            // 找最近的偵測重拍
            let closest = Infinity;
            for (const bt of beatDetectedTimes) {
                const diff = Math.abs(ut - bt);
                if (diff < closest) closest = diff;
            }
            if (closest < 0.5) { // 在 0.5 秒內算有效
                // 計算使用者拍子相對於偵測重拍的偏移
                const nearestBeat = beatDetectedTimes.reduce((best, bt) =>
                    Math.abs(ut - bt) < Math.abs(ut - best) ? bt : best
                );
                offsetSum += (ut - nearestBeat);
                offsetCount++;
            }
        }
        if (offsetCount > 0) {
            CONFIG.OFFSET = offsetSum / offsetCount;
            console.log('Auto offset:', CONFIG.OFFSET, 'from', offsetCount, 'samples');
        }

        // 生成譜面
        const beatDur = 60 / bpm;
        const firstBeat = tapTimes[0];
        const offsetBeats = Math.round(firstBeat / beatDur);
        const timeOffset = firstBeat - offsetBeats * beatDur;

        // 使用預製譜面（如果有）
        if (engine.currentSong && engine.currentSong.chart && engine.currentSong.chart.length > 0) {
            engine.initChart(bpm, 0, engine.currentSong.chart);
        } else {
        engine.chart = [];
        for (let beat = 0; beat < 500; beat++) {
            const time = timeOffset + beat * beatDur;
            if (time < firstBeat - beatDur) continue;
            const pos = beat % 4;
            let prob = 0;
            if (pos === 0) prob = 1.0;
            else if (pos === 2) prob = 0.7;
            else prob = 0.3;
            if (Math.random() < prob) {
                const col = Math.floor(Math.random() * 4);
                const isReverse = (gameMode === 'reverse' && Math.random() < 0.2);
                engine.chart.push({ time, col, reverse: isReverse });
            }
        }
        engine.totalNotes = engine.chart.length;
        } // end of else (no pre-chart)

        const now = window.audioEngine.getBGMTime();
        engine.chartIndex = 0;
        while (engine.chartIndex < engine.chart.length && engine.chart[engine.chartIndex].time < now) {
            engine.chartIndex++;
        }

        liveMode = true;
        showBPM(bpm);
        showOffset();
    }

    const el = document.getElementById('calib-info');
    if (el) el.style.display = 'none';
    calibrating = false;
    gameStarted = true;
}
function showBPM(bpm) {
    let el = document.getElementById('bpm-display');
    if (!el) {
        el = document.createElement('div');
        el.id = 'bpm-display';
        el.style.cssText = 'position:absolute;top:40px;right:16px;font-size:18px;color:#f0f;text-shadow:0 0 8px #f0f;transition:opacity 0.5s;pointer-events:none;z-index:10;text-align:right;';
        document.getElementById('game-container').appendChild(el);
    }
    const mode = liveMode ? ' 🎤LIVE' : (lastDetectedBPM > 0 ? ' 🤖AUTO' : '');
    el.innerHTML = bpm ? `🎵 ${Number(bpm).toFixed(1)} BPM${mode}` : '🎵 Tap...';
    el.style.opacity = 1;
    clearTimeout(el._timeout);
    el._timeout = setTimeout(() => el.style.opacity = 0, 4000);
}
function updateArrowSpeed(bpm) {
    CONFIG.ARROW_SPEED = Math.round(350 * (bpm / 120));
}
function applyBPMTweak() {
    if (!engine.currentSong) return;
    const bpm = engine.currentSong.bpm + CONFIG.BPM_OFFSET;
    engine.initChart(bpm, window.audioEngine.getLeadIn());
    engine.chartIndex = 0;
    updateArrowSpeed(bpm);
    showBPM(bpm);
}
function showOffset() {
    let el = document.getElementById('offset-display');
    if (!el) {
        el = document.createElement('div');
        el.id = 'offset-display';
        el.style.cssText = 'position:absolute;top:70px;right:16px;font-size:16px;color:#0ff;text-shadow:0 0 8px #0ff;transition:opacity 0.5s;pointer-events:none;z-index:10;';
        document.getElementById('game-container').appendChild(el);
    }
    const ms = Math.round(CONFIG.OFFSET * 1000);
    el.textContent = `偏移: ${ms > 0 ? '+' : ''}${ms}ms`;
    el.style.opacity = 1;
    clearTimeout(el._timeout);
    el._timeout = setTimeout(() => el.style.opacity = 0, 2000);
}

// ====== 跳舞角色 ======
// ====== 遊戲引擎 ======
class GameEngine {
    constructor() {
        this.score = 0;
        this.combo = 0;
        this.maxCombo = 0;
        this.notes = [];
        this.chart = [];
        this.chartIndex = 0;
        this.fever = 0;
        this.feverActive = false;
        this.judgeEffects = [];
        this.particles = [];
        this.currentSong = null;
        this.calories = 0;
        this.totalNotes = 0;
        this.hitNotes = 0;
    }
    initChart(bpm, leadIn, preChart) {
        // 如果有預製譜面，直接使用
        if (preChart && preChart.length > 0) {
            this.chart = preChart.map(n => ({
                time: n.time,
                col: n.col,
                reverse: n.reverse || false
            }));
            this.totalNotes = this.chart.length;
            return;
        }
        // 否則隨機產生
        this.chart = [];
        const beatDur = 60 / bpm;
        const startBeat = Math.ceil(leadIn / beatDur);
        for (let beat = startBeat; beat < 500; beat++) {
            const pos = beat % 4;
            let prob = 0;
            if (pos === 0) prob = 1.0;
            else if (pos === 2) prob = 0.7;
            else prob = 0.3;
            if (Math.random() < prob) {
                const col = Math.floor(Math.random() * 4);
                const isReverse = (gameMode === 'reverse' && Math.random() < 0.25);
                this.chart.push({ time: beat * beatDur, col, reverse: isReverse });
            }
        }
        this.totalNotes = this.chart.length;
    }
    spawnNote(data) {
        this.notes.push({
            col: data.col,
            time: data.time,
            reverse: data.reverse || false,
            y: CH + 40,
            hit: false,
            fadeOut: 0,
            glow: 0,
        });
    }
    handleKey(code) {
        const now = window.audioEngine.getBGMTime() + CONFIG.OFFSET;
        const colIdx = COLS.indexOf(code);
        if (colIdx < 0) return;

        let best = null, bestDiff = Infinity;
        this.notes.forEach(n => {
            if (n.hit || n.col !== colIdx) return;
            const diff = Math.abs(now - n.time);
            if (diff < bestDiff) { bestDiff = diff; best = n; }
        });

        if (best && bestDiff <= CONFIG.BAD_WINDOW) {
            best.hit = true;
            let judge = JUDGE.MISS;
            if (bestDiff <= CONFIG.PERFECT_WINDOW) judge = JUDGE.PERFECT;
            else if (bestDiff <= CONFIG.GREAT_WINDOW) judge = JUDGE.GREAT;
            else if (bestDiff <= CONFIG.COOL_WINDOW) judge = JUDGE.COOL;
            else if (bestDiff <= CONFIG.BAD_WINDOW) judge = JUDGE.BAD;
            this.applyJudge(judge, best);
            window.audioEngine.playTap();
            this.calories += 0.5;
        } else {
            window.audioEngine.playBad();
        }
    }
    applyJudge(judge, note) {
        if (judge.combo) {
            this.combo++;
            this.maxCombo = Math.max(this.maxCombo, this.combo);
            this.hitNotes++;
            this.fever = Math.min(100, this.fever + (judge === JUDGE.PERFECT ? 5 : 2));
            if (this.fever >= 100 && !this.feverActive) this.activateFever();
        } else {
            this.combo = 0;
            this.fever = Math.max(0, this.fever - 10);
        }
        this.score += judge.score * (this.feverActive ? 2 : 1);
        if (note) {
            const x = COL_X[note.col];
            this.addJudgeEffect(judge.name, judge.color, x, JUDGE_Y - 30);
            this.spawnParticles(x, JUDGE_Y, judge.color, judge.combo ? 12 : 5);
            spawnHitRipple(note.col, judge.color);
            flashCol(note.col);
            note.glow = 1;
        }
        // Combo pop
        const comboEl = document.getElementById('combo-text');
        if (this.combo > 1) {
            comboEl.style.animation = 'none';
            comboEl.offsetHeight;
            comboEl.style.animation = 'combo-pop 0.15s ease-out';
        }
        this.updateUI();
    }
    activateFever() {
        this.feverActive = true;
        window.audioEngine.playFever();
        setTimeout(() => { this.feverActive = false; this.fever = 0; this.updateUI(); }, 5000);
    }
    addJudgeEffect(text, color, x, y) {
        this.judgeEffects.push({ text, color, x, y, time: performance.now(), alpha: 1, offsetY: 0 });
    }
    spawnParticles(x, y, color, count) {
        for (let i = 0; i < count; i++) {
            this.particles.push({
                x, y,
                vx: (Math.random() - 0.5) * 250,
                vy: (Math.random() - 0.5) * 250 - 80,
                life: 1.0,
                color,
                size: Math.random() * 4 + 2,
            });
        }
    }
    updateUI() {
        document.getElementById('score').innerText = `SCORE: ${this.score}`;
        const cEl = document.getElementById('combo-text');
        cEl.innerText = this.combo > 1 ? `${this.combo} COMBO` : '';
        cEl.style.opacity = this.combo > 1 ? 1 : 0;
        // judge text
        const jEl = document.getElementById('judge-text');
        if (this.judgeEffects.length > 0) {
            const last = this.judgeEffects[this.judgeEffects.length - 1];
            jEl.textContent = last.text;
            jEl.style.color = last.color;
            jEl.style.textShadow = `0 0 12px ${last.color}`;
            jEl.style.opacity = 1;
            clearTimeout(jEl._t);
            jEl._t = setTimeout(() => jEl.style.opacity = 0, 400);
        }
    }
    update(dt) {
        const now = window.audioEngine.getBGMTime() + CONFIG.OFFSET;
        const speed = CONFIG.ARROW_SPEED;
        const leadIn = window.audioEngine.getLeadIn();

        // spawn
        while (this.chartIndex < this.chart.length) {
            const c = this.chart[this.chartIndex];
            const timeUntilHit = c.time - now;
            const spawnLead = (CH + 40 - HIT_Y) / speed;
            if (timeUntilHit <= spawnLead + 0.1) {
                this.spawnNote(c);
                this.chartIndex++;
            } else break;
        }

        // update notes
        this.notes = this.notes.filter(n => {
            if (n.hit && n.fadeOut > 1) return false;
            if (!n.hit && now > n.time + CONFIG.BAD_WINDOW + 0.3) {
                this.applyJudge(JUDGE.MISS, n);
                return false;
            }
            // position
            const timeDiff = n.time - now;
            n.y = HIT_Y + timeDiff * speed;
            if (n.hit) n.fadeOut += dt * 4;
            if (n.glow > 0) n.glow -= dt * 3;
            return true;
        });

        // effects
        this.judgeEffects = this.judgeEffects.filter(e => {
            const elapsed = (performance.now() - e.time) / 1000;
            e.alpha = 1 - elapsed / 0.6;
            e.offsetY = -elapsed * 40;
            return e.alpha > 0;
        });
        this.particles = this.particles.filter(p => {
            p.x += p.vx * dt;
            p.y += p.vy * dt;
            p.vy += 200 * dt;
            p.life -= dt * 2;
            return p.life > 0;
        });
    }
}

// ====== 節拍脈動 ======
let beatPhase = 0;
let beatPulse = 0;
let beatFlash = 0;
let lastDetectedBPM = 0;
function updateBeat(dt, bpm) {
    if (bpm <= 0) return;
    const beatDur = 60 / bpm;
    beatPhase = (beatPhase + dt) % beatDur;
    beatPulse = Math.max(0, 1 - (beatPhase / beatDur) * 4);
    // 從音訊偵測重拍
    if (window.audioEngine.detectBeat()) {
        beatFlash = 1;
    }
    beatFlash = Math.max(0, beatFlash - dt * 4);

    // 動態 BPM 追蹤
    const detected = window.audioEngine.getDetectedBPM();
    if (detected > 0 && Math.abs(detected - lastDetectedBPM) >= 3 && gameStarted) {
        lastDetectedBPM = detected;
        engine.currentSong.bpm = detected;
        CONFIG.BPM_OFFSET = 0;
        updateArrowSpeed(detected);
        // 從目前位置重新生成譜面
        const now = window.audioEngine.getBGMTime();
        engine.initChart(detected, 0);
        // 跳過已過的音符
        engine.chartIndex = 0;
        while (engine.chartIndex < engine.chart.length && engine.chart[engine.chartIndex].time < now) {
            engine.chartIndex++;
        }
        showBPM(detected);
    }
}

// ====== 命中漣漪 ======
let hitRipples = [];
function spawnHitRipple(col, color) {
    hitRipples.push({ x: COL_X[col], y: JUDGE_Y, r: 20, maxR: 50, alpha: 0.8, color });
}

// ====== 列閃爍 ======
let colFlash = [0, 0, 0, 0];
function flashCol(col) { colFlash[col] = 1; }

// ====== 背景星星 ======
const stars = [];
for (let i = 0; i < 40; i++) {
    stars.push({
        x: Math.random() * CW,
        y: Math.random() * CH,
        size: Math.random() * 2 + 0.5,
        speed: Math.random() * 15 + 5,
        alpha: Math.random() * 0.5 + 0.1,
    });
}
function updateStars(dt) {
    stars.forEach(s => {
        s.y -= s.speed * dt;
        if (s.y < -5) { s.y = CH + 5; s.x = Math.random() * CW; }
    });
}
function drawStars() {
    stars.forEach(s => {
        ctx.fillStyle = `rgba(255,255,255,${s.alpha})`;
        ctx.fillRect(s.x, s.y, s.size, s.size);
    });
}

// ====== 全域 ======
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const engine = new GameEngine();
let gameStarted = false;

// ====== 場景背景 ======
const SCENES = [
    { name: '星光舞台', bg1: '#0a0020', bg2: '#1a0040', accent: '#ff00ff' },
    { name: '夜上海', bg1: '#1a0a00', bg2: '#2a1500', accent: '#ffaa00' },
    { name: '嘉年華會', bg1: '#001a0a', bg2: '#003020', accent: '#00ff88' },
    { name: '埃及古墓', bg1: '#1a1500', bg2: '#302800', accent: '#ffdd00' },
];
let currentScene = SCENES[0];

function drawBackground() {
    const g = ctx.createLinearGradient(0, 0, 0, CH);
    g.addColorStop(0, currentScene.bg1);
    g.addColorStop(1, currentScene.bg2);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, CW, CH);

    // 重拍全屏閃爍
    if (beatFlash > 0.05) {
        ctx.fillStyle = `rgba(255,255,255,${beatFlash * 0.06})`;
        ctx.fillRect(0, 0, CW, CH);
    }

    // 裝飾線條
    ctx.strokeStyle = `rgba(255,255,255,${0.02 + beatFlash * 0.03})`;
    ctx.lineWidth = 1;
    for (let i = 0; i < CW; i += 50) {
        ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, CH); ctx.stroke();
    }
    for (let i = 0; i < CH; i += 50) {
        ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(CW, i); ctx.stroke();
    }
}

function drawJudgeLine() {
    // 列底光圈
    COLS.forEach((_, i) => {
        if (colFlash[i] > 0) {
            ctx.save();
            ctx.globalAlpha = colFlash[i] * 0.4;
            const grad = ctx.createRadialGradient(COL_X[i], JUDGE_Y + 10, 0, COL_X[i], JUDGE_Y + 10, 60);
            grad.addColorStop(0, COL_COLORS[i]);
            grad.addColorStop(1, 'transparent');
            ctx.fillStyle = grad;
            ctx.fillRect(COL_X[i] - 60, JUDGE_Y - 50, 120, 120);
            ctx.restore();
            colFlash[i] = Math.max(0, colFlash[i] - 0.06);
        }
    });

    // 判定區域背景
    const combinedPulse = Math.max(beatPulse, beatFlash * 0.8);
    ctx.fillStyle = `rgba(255,255,255,${0.03 + combinedPulse * 0.06})`;
    ctx.fillRect(0, JUDGE_Y - 25, CW, 50);

    // 判定線 - 跟著 BPM 脈動 + 音訊重拍
    const color = engine.feverActive ? '#ff0' : currentScene.accent;
    const lineWidth = 3 + combinedPulse * 3;
    ctx.strokeStyle = color;
    ctx.lineWidth = lineWidth;
    ctx.shadowColor = color;
    ctx.shadowBlur = 15 + combinedPulse * 20;
    ctx.beginPath();
    ctx.moveTo(30, JUDGE_Y);
    ctx.lineTo(CW - 30, JUDGE_Y);
    ctx.stroke();
    ctx.shadowBlur = 0;

    // 列標記 - 跟著脈動
    COLS.forEach((_, i) => {
        const r = 22 + combinedPulse * 6;
        ctx.strokeStyle = COL_COLORS[i];
        ctx.lineWidth = 2;
        ctx.shadowColor = COL_COLORS[i];
        ctx.shadowBlur = 5 + combinedPulse * 12;
        ctx.beginPath();
        ctx.arc(COL_X[i], JUDGE_Y, r, 0, Math.PI * 2);
        ctx.stroke();
        ctx.shadowBlur = 0;
    });
}

function drawHitRipples() {
    hitRipples = hitRipples.filter(r => {
        r.r += 120 * (1/60);
        r.alpha -= 0.03;
        if (r.alpha <= 0) return false;
        ctx.save();
        ctx.globalAlpha = r.alpha;
        ctx.strokeStyle = r.color;
        ctx.lineWidth = 2;
        ctx.shadowColor = r.color;
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.arc(r.x, r.y, r.r, 0, Math.PI * 2);
        ctx.stroke();
        ctx.shadowBlur = 0;
        ctx.restore();
        return true;
    });
}

function drawArrow(x, y, col, alpha, filled, glow, color) {
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(x, y);
    if (glow > 0) { ctx.shadowColor = color; ctx.shadowBlur = 20 * glow; }

    const s = 18;
    const c = COLS[col];

    // 光跡尾巴（非 hit 的箭頭）
    if (!filled && alpha > 0.5) {
        ctx.globalAlpha = alpha * 0.25;
        ctx.fillStyle = color;
        ctx.shadowColor = color;
        ctx.shadowBlur = 12;
        for (let t = 1; t <= 3; t++) {
            ctx.globalAlpha = alpha * (0.12 / t);
            ctx.beginPath();
            ctx.ellipse(0, t * 12, s * 0.5, s * 0.3, 0, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.globalAlpha = alpha;
        ctx.shadowBlur = glow > 0 ? 20 * glow : 0;
    }

    ctx.beginPath();
    if (c === 'ArrowUp') {
        ctx.moveTo(0, -s); ctx.lineTo(-s*0.7, s*0.4); ctx.lineTo(-s*0.25, s*0.4);
        ctx.lineTo(-s*0.25, s); ctx.lineTo(s*0.25, s); ctx.lineTo(s*0.25, s*0.4);
        ctx.lineTo(s*0.7, s*0.4); ctx.lineTo(0, -s);
    } else if (c === 'ArrowDown') {
        ctx.moveTo(0, s); ctx.lineTo(-s*0.7, -s*0.4); ctx.lineTo(-s*0.25, -s*0.4);
        ctx.lineTo(-s*0.25, -s); ctx.lineTo(s*0.25, -s); ctx.lineTo(s*0.25, -s*0.4);
        ctx.lineTo(s*0.7, -s*0.4); ctx.lineTo(0, s);
    } else if (c === 'ArrowLeft') {
        ctx.moveTo(-s, 0); ctx.lineTo(s*0.4, -s*0.7); ctx.lineTo(s*0.4, -s*0.25);
        ctx.lineTo(s, -s*0.25); ctx.lineTo(s, s*0.25); ctx.lineTo(s*0.4, s*0.25);
        ctx.lineTo(s*0.4, s*0.7); ctx.lineTo(-s, 0);
    } else {
        ctx.moveTo(s, 0); ctx.lineTo(-s*0.4, -s*0.7); ctx.lineTo(-s*0.4, -s*0.25);
        ctx.lineTo(-s, -s*0.25); ctx.lineTo(-s, s*0.25); ctx.lineTo(-s*0.4, s*0.25);
        ctx.lineTo(-s*0.4, s*0.7); ctx.lineTo(s, 0);
    }
    ctx.closePath();

    if (filled) { ctx.fillStyle = color; ctx.fill(); }
    ctx.strokeStyle = color;
    ctx.lineWidth = 2.5;
    ctx.stroke();
    ctx.restore();
}

function drawNotes() {
    engine.notes.forEach(n => {
        if (n.y < -50 || n.y > CH + 50) return;
        const alpha = n.hit ? (1 - n.fadeOut) : 1;
        const col = n.reverse ? '#ff3333' : COL_COLORS[n.col];
        drawArrow(COL_X[n.col], n.y, n.col, alpha, n.hit, n.glow, n.hit ? '#ff0' : col);
        // 反鍵標記
        if (n.reverse && !n.hit) {
            ctx.save();
            ctx.globalAlpha = 0.7;
            ctx.fillStyle = '#f00';
            ctx.font = 'bold 10px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('反', COL_X[n.col], n.y + 4);
            ctx.restore();
        }
    });
}

function drawJudgeEffects() {
    engine.judgeEffects.forEach(e => {
        ctx.save();
        ctx.globalAlpha = e.alpha;
        ctx.fillStyle = e.color;
        ctx.font = 'bold 30px "Microsoft JhengHei", sans-serif';
        ctx.textAlign = 'center';
        ctx.shadowColor = e.color;
        ctx.shadowBlur = 15;
        ctx.fillText(e.text, e.x, e.y + e.offsetY);
        ctx.restore();
    });
}

function drawParticles() {
    engine.particles.forEach(p => {
        ctx.save();
        ctx.globalAlpha = p.life;
        ctx.fillStyle = p.color;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    });
}

function drawFeverBar() {
    const barX = 30, barY = CH - 30, barW = CW - 60, barH = 14;
    ctx.fillStyle = 'rgba(255,255,255,0.08)';
    ctx.fillRect(barX, barY, barW, barH);
    const fColor = engine.feverActive ? '#ff0' : '#f0f';
    ctx.fillStyle = fColor;
    ctx.shadowColor = fColor;
    ctx.shadowBlur = engine.feverActive ? 15 : 4;
    ctx.fillRect(barX, barY, (engine.fever / 100) * barW, barH);
    ctx.shadowBlur = 0;
    ctx.strokeStyle = 'rgba(255,255,255,0.3)';
    ctx.lineWidth = 1;
    ctx.strokeRect(barX, barY, barW, barH);
    ctx.fillStyle = '#fff';
    ctx.font = '11px sans-serif';
    ctx.fillText(`FEVER ${engine.feverActive ? '★ ACTIVE ★' : engine.fever + '%'}`, barX + 4, barY + 11);
}

function drawCalories() {
    ctx.fillStyle = '#888';
    ctx.font = '11px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`🔥 ${engine.calories.toFixed(1)} kcal`, 10, CH - 8);
    ctx.textAlign = 'right';
    ctx.fillText(`🎯 ${engine.hitNotes}/${engine.totalNotes}`, CW - 10, CH - 8);
}

function drawKeyHints() {
    // 底部按鍵提示
    const y = CH - 55;
    const labels = ['←', '↓', '↑', '→'];
    COLS.forEach((_, i) => {
        ctx.fillStyle = 'rgba(255,255,255,0.15)';
        ctx.font = '18px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(labels[i], COL_X[i], y);
    });
}

// ====== 選曲 ======
function initSongSelect() {
    const list = document.getElementById('song-list');
    if (!list || typeof SONGS === 'undefined') return;
    SONGS.forEach(song => {
        const item = document.createElement('div');
        item.className = 'song-item';
        item.innerHTML = `<span class="title">${song.title}</span><span class="bpm">${song.bpm} BPM</span>`;
        item.onclick = () => startGame(song.id);
        list.appendChild(item);
    });

    // 模式選擇
    document.querySelectorAll('.mode-btn').forEach(btn => {
        btn.onclick = () => {
            document.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            gameMode = btn.dataset.mode;
        };
    });
}

// ====== 上傳 ======
function handleUpload(file) {
    if (!file) return;
    const url = URL.createObjectURL(file);
    startGame(9, url);
}
document.getElementById('mp3-upload').addEventListener('change', e => handleUpload(e.target.files[0]));
const dropZone = document.getElementById('drop-zone');
if (dropZone) {
    ['dragenter','dragover'].forEach(evt => {
        dropZone.addEventListener(evt, e => { e.preventDefault(); dropZone.style.borderColor = '#0ff'; dropZone.style.color = '#0ff'; });
    });
    ['dragleave','drop'].forEach(evt => {
        dropZone.addEventListener(evt, e => { e.preventDefault(); dropZone.style.borderColor = '#444'; dropZone.style.color = '#555'; });
    });
    dropZone.addEventListener('drop', e => {
        const f = e.dataTransfer.files[0];
        if (f && f.type.startsWith('audio/')) handleUpload(f);
    });
}

// ====== 開始遊戲 ======
function startGame(songId, uploadUrl) {
    if (gameStarted) return;

    document.getElementById('song-select').style.display = 'none';

    // 先進入校準模式
    startCalibration(songId, uploadUrl);
}

// ====== 錄製譜面模式 ======
let recordSongId = 0;
let recordUploadUrl = null;

function startRecordMode() {
    // 顯示選歌清單讓使用者選（複用現有清單）
    const list = document.querySelectorAll('.song-item');
    if (list.length === 0) return;

    // 直接用第一首歌開始，或讓使用者先選歌再按錄製
    // 簡化：彈出選歌提示
    let html = '<div style="position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.95);z-index:999;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:20px;">';
    html += '<h2 style="color:#ff0;margin-bottom:20px;">🎵 選擇要錄製的歌曲</h2>';
    html += '<div style="display:flex;flex-direction:column;gap:8px;width:100%;max-width:480px;">';
    SONGS.forEach(song => {
        html += `<div style="padding:12px 16px;background:rgba(255,255,255,0.05);border:1px solid #333;border-radius:6px;cursor:pointer;transition:all 0.2s;" onmouseover="this.style.borderColor='#ff0'" onmouseout="this.style.borderColor='#333'" onclick="selectRecordSong(${song.id})">${song.title} <span style="color:#0ff;">${song.bpm} BPM</span></div>`;
    });
    html += '</div>';
    html += '<div style="margin-top:15px;"><input type="file" id="record-upload" accept="audio/*" style="display:none"><button onclick="document.getElementById(\'record-upload\').click()" style="padding:8px 20px;background:#0ff;color:#000;border:none;border-radius:4px;cursor:pointer;">📁 上傳自訂 MP3</button></div>';
    html += '<button onclick="closeRecordSelect()" style="margin-top:15px;padding:8px 20px;background:#555;color:#fff;border:none;border-radius:4px;cursor:pointer;">取消</button>';
    html += '</div>';

    const overlay = document.createElement('div');
    overlay.id = 'record-select-overlay';
    overlay.innerHTML = html;
    document.body.appendChild(overlay);

    // 上傳 MP3 的 handler
    document.getElementById('record-upload').addEventListener('change', e => {
        const file = e.target.files[0];
        if (file) {
            const url = URL.createObjectURL(file);
            closeRecordSelect();
            beginRecording(9, url);
        }
    });
}

function closeRecordSelect() {
    const el = document.getElementById('record-select-overlay');
    if (el) el.remove();
}

function selectRecordSong(songId) {
    closeRecordSelect();
    beginRecording(songId, null);
}

function beginRecording(songId, uploadUrl) {
    const song = SONGS[songId] || SONGS[0];
    document.getElementById('song-select').style.display = 'none';
    document.getElementById('song-title').textContent = '🔴 REC: ' + song.title;
    currentScene = SCENES[Math.floor(Math.random() * SCENES.length)];

    window.audioEngine.init();
    window.audioEngine.playBGM(songId, uploadUrl);

    engine.currentSong = song;
    recordingMode = true;
    // 如果歌曲已有譜面，載入既有 notes 讓使用者可以接續錄製
    if (song.chart && song.chart.length > 0) {
        recordedNotes = song.chart.map(n => ({ time: n.time, col: n.col }));
    } else {
        recordedNotes = [];
    }
    recordSongId = songId;
    recordUploadUrl = uploadUrl;
    recordStartTime = performance.now();

    // 顯示錄製 HUD
    showRecordHUD();

    gameStarted = true;
    // 不進入校準，直接播放
    // 但需要 initChart 佔位（錄製模式下不用自動產生的 chart）
    engine.chart = [];
    engine.totalNotes = 0;
    engine.chartIndex = 0;
}

function showRecordHUD() {
    let el = document.getElementById('record-hud');
    if (!el) {
        el = document.createElement('div');
        el.id = 'record-hud';
        el.style.cssText = 'position:absolute;top:40px;left:50%;transform:translateX(-50%);text-align:center;z-index:200;pointer-events:none;';
        document.getElementById('game-container').appendChild(el);
    }
    el.style.display = 'block';
    updateRecordHUD();
}

function updateRecordHUD() {
    const el = document.getElementById('record-hud');
    if (!el || !recordingMode) { if (el) el.style.display = 'none'; return; }
    const now = window.audioEngine.getBGMTime();
    const min = Math.floor(now / 60);
    const sec = Math.floor(now % 60);
    // 計算新錄製的數量（不含既有譜面）
    const existingCount = (engine.currentSong && engine.currentSong.chart) ? engine.currentSong.chart.length : 0;
    const newCount = Math.max(0, recordedNotes.length - existingCount);
    const extra = existingCount > 0 ? ` <span style="color:#888;font-size:13px;">(新 ${newCount} + 既有 ${existingCount})</span>` : '';
    el.innerHTML = `
        <div style="font-size:20px;color:#f00;text-shadow:0 0 10px #f00;">🔴 錄製中</div>
        <div style="font-size:16px;color:#ff0;margin-top:5px;">已記錄 ${recordedNotes.length} 個箭頭${extra}</div>
        <div style="font-size:14px;color:#0ff;margin-top:3px;">⏱ ${min}:${sec.toString().padStart(2,'0')}</div>
        <div style="font-size:12px;color:#888;margin-top:8px;">按方向鍵錄製新箭頭 · 按 <span style="color:#0ff;">空白鍵</span> 結束並匯出</div>
    `;
}

function finishRecording() {
    if (!recordingMode) return;
    recordingMode = false;
    gameStarted = false;
    window.audioEngine.stopBGM();

    const el = document.getElementById('record-hud');
    if (el) el.style.display = 'none';

    // 整理譜面：新錄製的覆蓋重疊區域的舊譜面
    const existingCount = (engine.currentSong && engine.currentSong.chart) ? engine.currentSong.chart.length : 0;
    let allNotes;
    if (existingCount > 0 && recordedNotes.length > existingCount) {
        const existing = recordedNotes.slice(0, existingCount);
        const fresh = recordedNotes.slice(existingCount);
        // 舊譜面中，只有在新錄製區域之外的才保留
        const freshMin = Math.min(...fresh.map(n => n.time));
        const freshMax = Math.max(...fresh.map(n => n.time));
        const keptOld = existing.filter(n => n.time < freshMin - 1 || n.time > freshMax + 1);
        allNotes = [...keptOld, ...fresh];
    } else {
        allNotes = [...recordedNotes];
    }
    allNotes.sort((a, b) => a.time - b.time);

    // 移除太密集的重複（間隔 < 50ms 的同列）
    const filtered = [];
    for (const n of allNotes) {
        const last = filtered[filtered.length - 1];
        if (last && last.col === n.col && Math.abs(n.time - last.time) < 0.05) continue;
        filtered.push(n);
    }

    // 輸出 JSON
    const json = JSON.stringify(filtered.map(n => ({
        time: Math.round(n.time * 1000) / 1000,
        col: n.col,
        reverse: false
    })), null, 2);

    showRecordResult(filtered, json);
}

function showRecordResult(notes, json) {
    const song = engine.currentSong;
    const duration = notes.length > 0 ? notes[notes.length - 1].time : 0;
    const bpm = song ? song.bpm : 0;

    document.getElementById('record-stats').innerHTML = `
        📊 共 <strong>${notes.length}</strong> 個箭頭 · 時長 ${duration.toFixed(1)} 秒${bpm ? ' · ' + bpm + ' BPM' : ''}
    `;
    document.getElementById('record-json').value = json;
    document.getElementById('record-result').style.display = 'block';
}

function copyRecordJSON() {
    const textarea = document.getElementById('record-json');
    textarea.select();
    navigator.clipboard.writeText(textarea.value).then(() => {
        const btn = event.target;
        btn.textContent = '✅ 已複製！';
        setTimeout(() => btn.textContent = '📋 複製 JSON', 1500);
    });
}

function closeRecordResult() {
    document.getElementById('record-result').style.display = 'none';
    // 回到選歌畫面
    document.getElementById('song-select').style.display = 'flex';
}

// ====== 鍵盤 ======
window.addEventListener('keydown', e => {
    // 錄製模式：空白鍵結束錄製，方向鍵錄製，其他忽略
    if (recordingMode) {
        if (e.code === 'Space') { e.preventDefault(); finishRecording(); return; }
        if (COLS.includes(e.code)) {
            e.preventDefault();
            const colIdx = COLS.indexOf(e.code);
            const time = window.audioEngine.getBGMTime();
            if (time > 0) {
                recordedNotes.push({ time: Math.round(time * 1000) / 1000, col: colIdx });
                flashCol(colIdx);
                spawnHitRipple(colIdx, COL_COLORS[colIdx]);
                window.audioEngine.playTap();
                updateRecordHUD();
            }
        }
        return;
    }

    // 校準模式：T 打拍子，空白鍵開始遊戲
    if (calibrating) {
        if (e.code === 'KeyT') { handleTapTempo(); return; }
        if (e.code === 'Space') { e.preventDefault(); finishCalibration(); return; }
        return;
    }

    if (!gameStarted) return;

    if (e.code === 'Equal' || e.code === 'NumpadAdd') { CONFIG.OFFSET += 0.05; showOffset(); return; }
    if (e.code === 'Minus' || e.code === 'NumpadSubtract') { CONFIG.OFFSET -= 0.05; showOffset(); return; }
    if (e.code === 'BracketLeft') { CONFIG.BPM_OFFSET -= 0.5; applyBPMTweak(); return; }
    if (e.code === 'BracketRight') { CONFIG.BPM_OFFSET += 0.5; applyBPMTweak(); return; }
    if (e.code === 'KeyT') { handleTapTempo(); return; }
    if (e.code === 'KeyR') { tapTimes = []; liveMode = false; showBPM(null); return; }

    if (COLS.includes(e.code)) {
        e.preventDefault();

        // 反鍵模式：按相反方向
        let key = e.code;
        if (gameMode === 'reverse') {
            // 先檢查是否有反鍵箭頭在判定範圍
            const now = window.audioEngine.getBGMTime() + CONFIG.OFFSET;
            let hasReverse = false;
            engine.notes.forEach(n => {
                if (!n.hit && n.col === COLS.indexOf(e.code) && n.reverse && Math.abs(now - n.time) <= CONFIG.BAD_WINDOW) {
                    hasReverse = true;
                }
            });
            if (hasReverse) {
                // 反鍵：按相反方向
                const reverseMap = { ArrowUp: 'ArrowDown', ArrowDown: 'ArrowUp', ArrowLeft: 'ArrowRight', ArrowRight: 'ArrowLeft' };
                key = reverseMap[e.code];
            }
        }

        engine.handleKey(key);
    }
});

// ====== 主迴圈 ======
let lastTime = 0;
function gameLoop(now) {
    const dt = Math.min((now - lastTime) / 1000, 0.05);
    lastTime = now;

    if (gameStarted) {
        engine.update(dt);
        const bpm = engine.currentSong ? engine.currentSong.bpm : 120;
        updateBeat(dt, bpm);
        updateStars(dt);
    }
    if (recordingMode) {
        updateRecordHUD();
    }

    drawBackground();
    if (gameStarted) {
        drawStars();
        drawJudgeLine();
        drawNotes();
        drawHitRipples();
        drawParticles();
        drawJudgeEffects();
        drawFeverBar();
        drawCalories();
        drawKeyHints();
    }

    requestAnimationFrame(gameLoop);
}

// ====== 啟動 ======
initSongSelect();
requestAnimationFrame(gameLoop);
