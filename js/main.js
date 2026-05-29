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

// ====== Tap Tempo ======
let tapTimes = [];
function handleTapTempo() {
    tapTimes.push(Date.now());
    if (tapTimes.length > 8) tapTimes.shift();
    if (tapTimes.length >= 2) {
        const intervals = [];
        for (let i = 1; i < tapTimes.length; i++) intervals.push(tapTimes[i] - tapTimes[i-1]);
        const avgMs = intervals.reduce((a,b) => a+b, 0) / intervals.length;
        const bpm = Math.round(60000 / avgMs);
        engine.currentSong.bpm = bpm;
        CONFIG.BPM_OFFSET = 0;
        updateArrowSpeed(bpm);
        engine.initChart(bpm, window.audioEngine.getLeadIn());
        engine.chartIndex = 0;
        showBPM(bpm);
    } else {
        showBPM(null);
    }
}
function showBPM(bpm) {
    let el = document.getElementById('bpm-display');
    if (!el) {
        el = document.createElement('div');
        el.id = 'bpm-display';
        el.style.cssText = 'position:absolute;top:40px;right:16px;font-size:20px;color:#f0f;text-shadow:0 0 8px #f0f;transition:opacity 0.5s;pointer-events:none;z-index:10;';
        document.getElementById('game-container').appendChild(el);
    }
    el.textContent = bpm ? `🎵 ${bpm} BPM` : '🎵 Tap...';
    el.style.opacity = 1;
    clearTimeout(el._timeout);
    el._timeout = setTimeout(() => el.style.opacity = 0, 3000);
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
class Dancer {
    constructor() {
        this.pose = 0;         // 0=站姿, 1=左, 2=右, 3=上, 4=下, 5=perfect
        this.poseTimer = 0;
        this.bouncePhase = 0;
    }
    hit(dir) {
        if (dir === 'ArrowLeft') this.pose = 1;
        else if (dir === 'ArrowRight') this.pose = 2;
        else if (dir === 'ArrowUp') this.pose = 3;
        else if (dir === 'ArrowDown') this.pose = 4;
        this.poseTimer = 0.3;
    }
    perfect() { this.pose = 5; this.poseTimer = 0.4; }
    update(dt) {
        this.bouncePhase += dt * 3;
        if (this.poseTimer > 0) { this.poseTimer -= dt; }
        else { this.pose = 0; }
    }
    draw(ctx, x, y) {
        ctx.save();
        const bounce = Math.sin(this.bouncePhase) * 3;
        const py = y + bounce;

        // 身體
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';

        // 頭
        ctx.beginPath();
        ctx.arc(x, py - 55, 12, 0, Math.PI * 2);
        ctx.fillStyle = '#ffe0c0';
        ctx.fill();
        ctx.strokeStyle = '#fff';
        ctx.stroke();

        // 眼睛 + 嘴巴
        ctx.fillStyle = '#333';
        ctx.beginPath(); ctx.arc(x-4, py-57, 1.5, 0, Math.PI*2); ctx.fill();
        ctx.beginPath(); ctx.arc(x+4, py-57, 1.5, 0, Math.PI*2); ctx.fill();
        ctx.beginPath();
        if (this.pose === 5) { // perfect 笑臉
            ctx.arc(x, py-52, 4, 0, Math.PI);
        } else {
            ctx.moveTo(x-3, py-52); ctx.lineTo(x+3, py-52);
        }
        ctx.stroke();

        // 軀幹
        ctx.beginPath();
        ctx.moveTo(x, py - 42);
        ctx.lineTo(x, py - 10);
        ctx.stroke();

        // 手臂
        const armY = py - 35;
        ctx.beginPath();
        if (this.pose === 1) { // 左
            ctx.moveTo(x, armY); ctx.lineTo(x - 25, armY - 10);
            ctx.moveTo(x, armY); ctx.lineTo(x + 15, armY + 5);
        } else if (this.pose === 2) { // 右
            ctx.moveTo(x, armY); ctx.lineTo(x + 25, armY - 10);
            ctx.moveTo(x, armY); ctx.lineTo(x - 15, armY + 5);
        } else if (this.pose === 3) { // 上
            ctx.moveTo(x, armY); ctx.lineTo(x - 18, armY - 20);
            ctx.moveTo(x, armY); ctx.lineTo(x + 18, armY - 20);
        } else if (this.pose === 4) { // 下
            ctx.moveTo(x, armY); ctx.lineTo(x - 20, armY + 10);
            ctx.moveTo(x, armY); ctx.lineTo(x + 20, armY + 10);
        } else if (this.pose === 5) { // perfect
            ctx.moveTo(x, armY); ctx.lineTo(x - 22, armY - 18);
            ctx.moveTo(x, armY); ctx.lineTo(x + 22, armY - 18);
        } else { // 站姿
            ctx.moveTo(x, armY); ctx.lineTo(x - 18, armY + 8);
            ctx.moveTo(x, armY); ctx.lineTo(x + 18, armY + 8);
        }
        ctx.stroke();

        // 腿
        const legY = py - 10;
        ctx.beginPath();
        if (this.pose === 1) {
            ctx.moveTo(x, legY); ctx.lineTo(x - 12, legY + 28);
            ctx.moveTo(x, legY); ctx.lineTo(x + 8, legY + 25);
        } else if (this.pose === 2) {
            ctx.moveTo(x, legY); ctx.lineTo(x + 12, legY + 28);
            ctx.moveTo(x, legY); ctx.lineTo(x - 8, legY + 25);
        } else if (this.pose === 4) {
            ctx.moveTo(x, legY); ctx.lineTo(x - 15, legY + 20);
            ctx.moveTo(x, legY); ctx.lineTo(x + 15, legY + 20);
        } else {
            ctx.moveTo(x, legY); ctx.lineTo(x - 10, legY + 28);
            ctx.moveTo(x, legY); ctx.lineTo(x + 10, legY + 28);
        }
        ctx.stroke();

        // perfect 特效
        if (this.pose === 5) {
            ctx.shadowColor = '#ff0';
            ctx.shadowBlur = 20;
            ctx.strokeStyle = 'rgba(255,255,0,0.6)';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(x, py - 25, 35, 0, Math.PI * 2);
            ctx.stroke();
            ctx.shadowBlur = 0;
        }

        ctx.restore();
    }
}

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
        this.dancer = new Dancer();
        this.calories = 0;
        this.totalNotes = 0;
        this.hitNotes = 0;
    }
    initChart(bpm, leadIn) {
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
            this.dancer.hit(COLS[best.col]);
            if (judge === JUDGE.PERFECT) this.dancer.perfect();
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

        this.dancer.update(dt);
    }
}

// ====== 節拍脈動 ======
let beatPhase = 0;
let beatPulse = 0;
function updateBeat(dt, bpm) {
    if (bpm <= 0) return;
    const beatDur = 60 / bpm;
    beatPhase = (beatPhase + dt) % beatDur;
    // 脈動在拍子點瞬間最強，然後快速衰減
    beatPulse = Math.max(0, 1 - (beatPhase / beatDur) * 4);
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

    // 裝飾線條
    ctx.strokeStyle = 'rgba(255,255,255,0.03)';
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
    ctx.fillStyle = `rgba(255,255,255,${0.03 + beatPulse * 0.04})`;
    ctx.fillRect(0, JUDGE_Y - 25, CW, 50);

    // 判定線 - 跟著 BPM 脈動
    const color = engine.feverActive ? '#ff0' : currentScene.accent;
    const lineWidth = 3 + beatPulse * 2;
    ctx.strokeStyle = color;
    ctx.lineWidth = lineWidth;
    ctx.shadowColor = color;
    ctx.shadowBlur = 15 + beatPulse * 15;
    ctx.beginPath();
    ctx.moveTo(30, JUDGE_Y);
    ctx.lineTo(CW - 30, JUDGE_Y);
    ctx.stroke();
    ctx.shadowBlur = 0;

    // 列標記 - 跟著脈動
    COLS.forEach((_, i) => {
        const r = 22 + beatPulse * 4;
        ctx.strokeStyle = COL_COLORS[i];
        ctx.lineWidth = 2;
        ctx.shadowColor = COL_COLORS[i];
        ctx.shadowBlur = 5 + beatPulse * 8;
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
    gameStarted = true;

    document.getElementById('song-select').style.display = 'none';

    const song = SONGS[songId] || SONGS[0];
    document.getElementById('song-title').textContent = song.title;

    // 隨機場景
    currentScene = SCENES[Math.floor(Math.random() * SCENES.length)];

    window.audioEngine.init();
    window.audioEngine.playBGM(songId, uploadUrl);

    const bpm = song.bpm;
    updateArrowSpeed(bpm);
    engine.currentSong = song;
    engine.initChart(bpm, window.audioEngine.getLeadIn());
    engine.chartIndex = 0;
}

// ====== 鍵盤 ======
window.addEventListener('keydown', e => {
    if (!gameStarted) return;

    if (e.code === 'Equal' || e.code === 'NumpadAdd') { CONFIG.OFFSET += 0.05; showOffset(); return; }
    if (e.code === 'Minus' || e.code === 'NumpadSubtract') { CONFIG.OFFSET -= 0.05; showOffset(); return; }
    if (e.code === 'BracketLeft') { CONFIG.BPM_OFFSET -= 1; applyBPMTweak(); return; }
    if (e.code === 'BracketRight') { CONFIG.BPM_OFFSET += 1; applyBPMTweak(); return; }
    if (e.code === 'KeyT') { handleTapTempo(); return; }
    if (e.code === 'KeyR') { tapTimes = []; showBPM(null); return; }

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

    drawBackground();
    if (gameStarted) {
        drawStars();
        drawJudgeLine();
        drawNotes();
        drawHitRipples();
        drawParticles();
        drawJudgeEffects();
        engine.dancer.draw(ctx, CW / 2, CH / 2 + 30);
        drawFeverBar();
        drawCalories();
        drawKeyHints();
    }

    requestAnimationFrame(gameLoop);
}

// ====== 啟動 ======
initSongSelect();
requestAnimationFrame(gameLoop);
