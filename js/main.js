// ============================================
//  Retro Dance Online - 核心遊戲引擎 v4 (多歌曲版)
// ============================================

const CONFIG = {
    ARROW_SPEED: 200,
    PERFECT_WINDOW: 0.08,
    GREAT_WINDOW: 0.15,
    COOL_WINDOW: 0.25,
    BAD_WINDOW: 0.40,
    C_X: 150,
    INPUT_BUFFER_TIME: 0.5,
    OFFSET: 0, // 音訊偏移量（秒），正數=箭頭延後出現
    BPM_OFFSET: 0, // BPM 偏移量（可微調）
};

// Tap Tempo
let tapTimes = [];
function handleTapTempo() {
    const now = Date.now();
    tapTimes.push(now);
    // 只保留最近 8 次
    if (tapTimes.length > 8) tapTimes.shift();
    if (tapTimes.length >= 2) {
        const intervals = [];
        for (let i = 1; i < tapTimes.length; i++) {
            intervals.push(tapTimes[i] - tapTimes[i - 1]);
        }
        const avgMs = intervals.reduce((a, b) => a + b, 0) / intervals.length;
        const detectedBPM = Math.round(60000 / avgMs);
        // 更新 BPM
        const song = engine.currentSong || SONGS[0];
        song.bpm = detectedBPM;
        CONFIG.BPM_OFFSET = 0;
        // 重新生成譜面
        engine.initChart(detectedBPM, window.audioEngine.getLeadIn());
        engine.chartIndex = 0;
        updateArrowSpeed(detectedBPM);
        // 顯示 BPM
        showBPM(detectedBPM);
    } else {
        showBPM(null); // 顯示 "Tap..."
    }
}

function showBPM(bpm) {
    let el = document.getElementById('bpm-display');
    if (!el) {
        el = document.createElement('div');
        el.id = 'bpm-display';
        el.style.cssText = 'position:absolute;top:80px;right:20px;font-size:24px;color:#f0f;text-shadow:0 0 10px #f0f;transition:opacity 0.5s;pointer-events:none;';
        document.getElementById('game-container').appendChild(el);
    }
    el.textContent = bpm ? `🎵 ${bpm} BPM` : '🎵 Tap...';
    el.style.opacity = 1;
    clearTimeout(el._timeout);
    el._timeout = setTimeout(() => el.style.opacity = 0, 3000);
}

const JUDGE = {
    PERFECT: { name: 'PERFECT', score: 200, color: '#ff0', combo: true },
    GREAT:   { name: 'GREAT',   score: 100, color: '#0ff', combo: true },
    COOL:    { name: 'COOL',    score: 50,  color: '#0f0', combo: true },
    BAD:     { name: 'BAD',     score: 10,  color: '#f80', combo: false },
    MISS:    { name: 'MISS',    score: 0,   color: '#f00', combo: false },
};

const DIR_KEYS_4 = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'];

// ========== 初始化選曲畫面 ==========
function initSongSelect() {
    const list = document.getElementById('song-list');
    if (!list || typeof SONGS === 'undefined') return;

    SONGS.forEach(song => {
        const item = document.createElement('div');
        item.className = 'song-item';
        item.innerHTML = `
            <span class="title">${song.title}</span>
            <span class="bpm">${song.bpm} BPM</span>
        `;
        item.onclick = () => selectSong(song.id);
        list.appendChild(item);
    });
}

function selectSong(songId) {
    startGame(songId);
}

// 處理 MP3 上傳
function handleUpload(file) {
    if (!file) return;
    const url = URL.createObjectURL(file);
    console.log('MP3 uploaded:', file.name, url);

    // 直接開始遊戲，不經過 overlay
    startGame(9, url);
}

document.getElementById('mp3-upload').addEventListener('change', (e) => {
    handleUpload(e.target.files[0]);
});

// Drag & Drop
const dropZone = document.getElementById('drop-zone');
if (dropZone) {
    ['dragenter', 'dragover'].forEach(evt => {
        dropZone.addEventListener(evt, (e) => { e.preventDefault(); dropZone.style.borderColor = '#0ff'; dropZone.style.color = '#0ff'; });
    });
    ['dragleave', 'drop'].forEach(evt => {
        dropZone.addEventListener(evt, (e) => { e.preventDefault(); dropZone.style.borderColor = '#555'; dropZone.style.color = '#666'; });
    });
    dropZone.addEventListener('drop', (e) => {
        const file = e.dataTransfer.files[0];
        if (file && file.type.startsWith('audio/')) handleUpload(file);
    });
}

// ========== 遊戲引擎 ==========
class GameEngine {
    constructor() {
        this.score = 0;
        this.combo = 0;
        this.maxCombo = 0;
        this.notes = [];
        this.judgeEffects = [];
        this.particles = [];
        this.chart = [];
        this.chartIndex = 0;
        this.fever = 0;
        this.feverActive = false;
    }

    initChart(bpm, leadIn) {
        this.chart = [];
        const beatDuration = 60 / bpm;
        const startBeat = Math.ceil(leadIn / beatDuration); // 從 leadIn 秒後開始

        // 每拍一個箭頭，方向在重拍(每4拍)固定，其他拍隨機
        for (let beat = startBeat; beat < 200; beat++) {
            const posInMeasure = beat % 4; // 0=重拍, 1,2,3=弱拍
            
            if (posInMeasure === 0) {
                // 重拍：必定有箭頭
                const dir = DIR_KEYS_4[Math.floor(Math.random() * DIR_KEYS_4.length)];
                this.chart.push({ time: beat * beatDuration, dir: dir });
            } else if (posInMeasure === 2) {
                // 第三拍：70% 機率有箭頭
                if (Math.random() < 0.7) {
                    const dir = DIR_KEYS_4[Math.floor(Math.random() * DIR_KEYS_4.length)];
                    this.chart.push({ time: beat * beatDuration, dir: dir });
                }
            } else {
                // 第二、四拍：40% 機率有箭頭
                if (Math.random() < 0.4) {
                    const dir = DIR_KEYS_4[Math.floor(Math.random() * DIR_KEYS_4.length)];
                    this.chart.push({ time: beat * beatDuration, dir: dir });
                }
            }
        }
    }

    spawnNote(noteData) {
        this.notes.push({
            dir: noteData.dir,
            time: noteData.time,
            hit: false,
            fadeOut: 0,
            glow: 0,
        });
    }

    // 直接按方向鍵 = 判定（不需要先按方向再按空白）
    handleDirection(key) {
        const now = window.audioEngine.getBGMTime() + CONFIG.OFFSET;

        // 找最接近判定時間的同方向箭頭
        let bestNote = null;
        let bestDiff = Infinity;

        this.notes.forEach(note => {
            if (note.hit) return;
            if (note.dir !== key) return;
            const diff = Math.abs(now - note.time);
            if (diff < bestDiff) {
                bestDiff = diff;
                bestNote = note;
            }
        });

        if (bestNote && bestDiff <= CONFIG.BAD_WINDOW) {
            bestNote.hit = true;
            let judge = JUDGE.MISS;
            if (bestDiff <= CONFIG.PERFECT_WINDOW) judge = JUDGE.PERFECT;
            else if (bestDiff <= CONFIG.GREAT_WINDOW) judge = JUDGE.GREAT;
            else if (bestDiff <= CONFIG.COOL_WINDOW) judge = JUDGE.COOL;
            else if (bestDiff <= CONFIG.BAD_WINDOW) judge = JUDGE.BAD;
            this.applyJudge(judge, bestNote);
            window.audioEngine.playTap();
        } else {
            // 按錯時機或沒有對應箭頭
            window.audioEngine.playBad();
        }
    }

    handleSpace() { /* 不再需要 */ }

    applyJudge(judge, note) {
        if (judge.combo) {
            this.combo++;
            this.maxCombo = Math.max(this.maxCombo, this.combo);
            this.fever = Math.min(100, this.fever + (judge === JUDGE.PERFECT ? 5 : 2));
            if (this.fever >= 100 && !this.feverActive) this.activateFever();
        } else {
            this.combo = 0;
            this.fever = Math.max(0, this.fever - 10);
        }
        this.score += judge.score;
        if (note) {
            this.addJudgeEffect(judge.name, judge.color, CONFIG.C_X, 200);
            this.spawnParticles(CONFIG.C_X, 200, judge.color, judge.combo ? 8 : 3);
        }
        this.updateUI();
    }

    activateFever() {
        this.feverActive = true;
        window.audioEngine.playFever();
        setTimeout(() => { this.feverActive = false; this.fever = 0; this.updateUI(); }, 5000);
    }

    addJudgeEffect(text, color, x, y) {
        this.judgeEffects.push({ text, color, x, y, time: Date.now(), alpha: 1.0, offsetY: 0 });
    }

    spawnParticles(x, y, color, count) {
        for (let i = 0; i < count; i++) {
            this.particles.push({
                x, y,
                vx: (Math.random() - 0.5) * 300,
                vy: (Math.random() - 0.5) * 300,
                life: 1.0,
                color,
                size: Math.random() * 4 + 2
            });
        }
    }

    updateUI() {
        document.getElementById('score').innerText = `SCORE: ${this.score}`;
        const comboEl = document.getElementById('combo-text');
        if (comboEl) {
            comboEl.innerText = this.combo > 0 ? `${this.combo} COMBO` : '';
            comboEl.style.opacity = this.combo > 0 ? 1 : 0;
        }
    }

    update() {
        const now = window.audioEngine.getBGMTime() + CONFIG.OFFSET;

        while (this.chartIndex < this.chart.length && this.chart[this.chartIndex].time <= now + 4) {
            this.spawnNote(this.chart[this.chartIndex]);
            this.chartIndex++;
        }

        this.notes = this.notes.filter(n => {
            if (n.hit && n.fadeOut > 1) return false;
            if (!n.hit && now > n.time + CONFIG.BAD_WINDOW + 0.5) {
                n.hit = true;
                this.applyJudge(JUDGE.MISS, n);
                return false;
            }
            return true;
        });

        this.notes.forEach(n => {
            if (n.hit) n.fadeOut += 0.05;
            if (n.glow > 0) n.glow -= 0.02;
        });

        this.judgeEffects = this.judgeEffects.filter(e => {
            const elapsed = (Date.now() - e.time) / 1000;
            e.alpha = 1 - elapsed / 0.8;
            e.offsetY = -elapsed * 60;
            return e.alpha > 0;
        });

        this.particles = this.particles.filter(p => {
            p.x += p.vx * 0.016;
            p.y += p.vy * 0.016;
            p.life -= 0.03;
            return p.life > 0;
        });
    }
}

const engine = new GameEngine();
let gameStarted = false;

function startGame(songId, uploadUrl) {
    if (gameStarted) return;
    gameStarted = true;

    // 隱藏所有 overlay
    const overlay = document.getElementById('start-overlay');
    if (overlay) overlay.style.display = 'none';
    const songSelect = document.getElementById('song-select');
    if (songSelect) songSelect.style.display = 'none';

    const song = SONGS[songId] || SONGS[0];
    document.getElementById('song-title').textContent = song ? song.title : 'Custom';

    window.audioEngine.init();
    window.audioEngine.playBGM(songId, uploadUrl);

    const bpm = song ? song.bpm : 120;
    const leadIn = window.audioEngine.getLeadIn();
    engine.currentSong = song;
    engine.initChart(bpm, leadIn);
    engine.chartIndex = 0;

    // 箭頭速度隨 BPM 動態調整
    updateArrowSpeed(bpm);
    console.log('Game started! Song:', songId, 'BPM:', bpm, 'ArrowSpeed:', CONFIG.ARROW_SPEED);
}

window.addEventListener('keydown', (e) => {
    if (!gameStarted) return;
    // + / - 調整偏移量
    if (e.code === 'Equal' || e.code === 'NumpadAdd') {
        CONFIG.OFFSET += 0.05;
        showOffset(); return;
    }
    if (e.code === 'Minus' || e.code === 'NumpadSubtract') {
        CONFIG.OFFSET -= 0.05;
        showOffset(); return;
    }
    // [ / ] 調整 BPM 微調
    if (e.code === 'BracketLeft') {
        CONFIG.BPM_OFFSET -= 1;
        applyBPMTweak(); return;
    }
    if (e.code === 'BracketRight') {
        CONFIG.BPM_OFFSET += 1;
        applyBPMTweak(); return;
    }
    // T = Tap Tempo
    if (e.code === 'KeyT') {
        handleTapTempo(); return;
    }
    // R = 重置 tap
    if (e.code === 'KeyR') {
        tapTimes = [];
        showBPM(null); return;
    }
    if (DIR_KEYS_4.includes(e.code)) {
        e.preventDefault();
        engine.handleDirection(e.code);
    }
});

function updateArrowSpeed(bpm) {
    // 120 BPM 為基準 (200 px/s)，BPM 越高速度越快
    CONFIG.ARROW_SPEED = Math.round(200 * (bpm / 120));
}

function applyBPMTweak() {
    const song = engine.currentSong;
    if (!song) return;
    const newBPM = song.bpm + CONFIG.BPM_OFFSET;
    engine.initChart(newBPM, window.audioEngine.getLeadIn());
    engine.chartIndex = 0;
    updateArrowSpeed(newBPM);
    showBPM(newBPM);
}

function showOffset() {
    let el = document.getElementById('offset-display');
    if (!el) {
        el = document.createElement('div');
        el.id = 'offset-display';
        el.style.cssText = 'position:absolute;top:50px;right:20px;font-size:20px;color:#0ff;text-shadow:0 0 10px #0ff;transition:opacity 0.5s;pointer-events:none;';
        document.getElementById('game-container').appendChild(el);
    }
    const ms = Math.round(CONFIG.OFFSET * 1000);
    el.textContent = `偏移: ${ms > 0 ? '+' : ''}${ms}ms`;
    el.style.opacity = 1;
    clearTimeout(el._timeout);
    el._timeout = setTimeout(() => el.style.opacity = 0, 2000);
}

// ========== 渲染 ==========
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

function drawBackground() {
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = 'rgba(255, 0, 255, 0.1)';
    ctx.lineWidth = 1;
    for (let i = 0; i < canvas.width; i += 40) {
        ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, canvas.height); ctx.stroke();
    }
}

function drawJudgmentLine() {
    ctx.strokeStyle = engine.feverActive ? '#ff0' : '#0ff';
    ctx.lineWidth = 3;
    ctx.shadowColor = engine.feverActive ? '#ff0' : '#0ff';
    ctx.shadowBlur = 20;
    ctx.beginPath(); ctx.moveTo(CONFIG.C_X, 0); ctx.lineTo(CONFIG.C_X, canvas.height); ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.strokeRect(CONFIG.C_X - 30, 170, 60, 60);
}

function drawArrow(x, y, dir, alpha = 1, filled = false, glow = 0, color = '#fff') {
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(x, y);
    if (glow > 0) { ctx.shadowColor = '#ff0'; ctx.shadowBlur = 30 * glow; }
    const s = 20;
    ctx.beginPath();
    if (dir === 'ArrowUp') { ctx.moveTo(0,-s); ctx.lineTo(-s*0.8,0); ctx.lineTo(-s*0.3,0); ctx.lineTo(-s*0.3,s); ctx.lineTo(s*0.3,s); ctx.lineTo(s*0.3,0); ctx.lineTo(s*0.8,0); ctx.lineTo(0,-s); }
    else if (dir === 'ArrowDown') { ctx.moveTo(0,s); ctx.lineTo(-s*0.8,0); ctx.lineTo(-s*0.3,0); ctx.lineTo(-s*0.3,-s); ctx.lineTo(s*0.3,-s); ctx.lineTo(s*0.3,0); ctx.lineTo(s*0.8,0); ctx.lineTo(0,s); }
    else if (dir === 'ArrowLeft') { ctx.moveTo(-s,0); ctx.lineTo(0,-s*0.8); ctx.lineTo(0,-s*0.3); ctx.lineTo(s,-s*0.3); ctx.lineTo(s,s*0.3); ctx.lineTo(0,s*0.3); ctx.lineTo(0,s*0.8); ctx.lineTo(-s,0); }
    else { ctx.moveTo(s,0); ctx.lineTo(0,-s*0.8); ctx.lineTo(0,-s*0.3); ctx.lineTo(-s,-s*0.3); ctx.lineTo(-s,s*0.3); ctx.lineTo(0,s*0.3); ctx.lineTo(0,s*0.8); ctx.lineTo(s,0); }
    ctx.closePath();
    if (filled) { ctx.fillStyle = color; ctx.fill(); ctx.strokeStyle = '#fff'; } else { ctx.strokeStyle = color; }
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.restore();
}

function drawNotes() {
    const now = window.audioEngine.getBGMTime() + CONFIG.OFFSET;
    engine.notes.forEach(note => {
        if (note.hit && note.fadeOut > 1) return;
        const x = CONFIG.C_X + (note.time - now) * CONFIG.ARROW_SPEED;
        if (x < -50 || x > canvas.width + 50) return;
        const alpha = note.hit ? (1 - note.fadeOut) : 1;
        drawArrow(x, 200, note.dir, alpha, note.hit, note.glow, note.hit ? '#ff0' : '#fff');
    });
}

function drawJudgeEffects() {
    engine.judgeEffects.forEach(e => {
        ctx.save(); ctx.globalAlpha = e.alpha; ctx.fillStyle = e.color; ctx.font = 'bold 36px "Courier New"'; ctx.textAlign = 'center';
        ctx.shadowColor = e.color; ctx.shadowBlur = 20;
        ctx.fillText(e.text, e.x, e.y + e.offsetY);
        ctx.restore();
    });
}

function drawParticles() {
    engine.particles.forEach(p => {
        ctx.save(); ctx.globalAlpha = p.life; ctx.fillStyle = p.color; ctx.shadowColor = p.color; ctx.shadowBlur = 10;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2); ctx.fill(); ctx.restore();
    });
}

function drawFeverBar() {
    const barX = 20, barY = canvas.height - 40, barW = canvas.width - 40, barH = 20;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.fillRect(barX, barY, barW, barH);
    ctx.fillStyle = engine.feverActive ? '#ff0' : '#f0f';
    ctx.shadowColor = engine.feverActive ? '#ff0' : '#f0f';
    ctx.shadowBlur = engine.feverActive ? 20 : 5;
    ctx.fillRect(barX, barY, (engine.fever / 100) * barW, barH);
    ctx.shadowBlur = 0;
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 1;
    ctx.strokeRect(barX, barY, barW, barH);
    ctx.fillStyle = '#fff';
    ctx.font = '12px "Courier New"';
    ctx.fillText(`FEVER ${engine.feverActive ? 'ACTIVE!' : engine.fever + '%'}`, barX + 5, barY + 15);
}

function drawStats() {
    ctx.fillStyle = '#888';
    ctx.font = '12px "Courier New"';
    ctx.fillText(`MAX COMBO: ${engine.maxCombo}`, 20, 20);
}

function gameLoop() {
    if (!gameStarted) {
        drawBackground();
        requestAnimationFrame(gameLoop);
        return;
    }
    engine.update();
    drawBackground();
    drawJudgmentLine();
    drawNotes();
    drawParticles();
    drawJudgeEffects();
    drawFeverBar();
    drawStats();
    requestAnimationFrame(gameLoop);
}

// 啟動
initSongSelect();
gameLoop();
