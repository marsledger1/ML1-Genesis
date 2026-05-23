// ==========================================
// portal_UI.js - Portal 視覺與互動模組 (Visual & Interactive Module)
// ==========================================

// --- 1. 暴力強制音樂播放系統 (Aggressive BGM System) ---
let isBgmPlaying = false;

function initAggressiveBGM() {
    const bgm = document.getElementById('portal-bgm');
    if(!bgm) return; // 防呆，避免找不到元素
    
    bgm.volume = 0.4; 

    bgm.addEventListener('play', () => {
        isBgmPlaying = true;
        const btn = document.getElementById('bgm-toggle');
        if(btn) {
            btn.innerText = "🔊 BGM: ON";
            btn.style.color = "var(--tech-green)";
            btn.style.borderColor = "var(--tech-green)";
        }
    });

    bgm.addEventListener('pause', () => {
        isBgmPlaying = false;
        const btn = document.getElementById('bgm-toggle');
        if(btn) {
            btn.innerText = "🔇 BGM: OFF";
            btn.style.color = "#555";
            btn.style.borderColor = "#333";
        }
    });

    const forcePlayInterval = setInterval(() => {
        if (!isBgmPlaying) { bgm.play().catch(() => {}); } 
        else { clearInterval(forcePlayInterval); }
    }, 500);
    
    const forcePlay = () => {
        if (!isBgmPlaying) bgm.play().catch(() => {});
        ['touchstart', 'touchend', 'touchmove', 'scroll', 'click'].forEach(evt => window.removeEventListener(evt, forcePlay));
    };
    
    ['touchstart', 'touchend', 'touchmove', 'scroll', 'click'].forEach(evt => window.addEventListener(evt, forcePlay, { once: true, passive: true }));
}

function toggleBGM(e) {
    if(e) e.stopPropagation();
    const bgm = document.getElementById('portal-bgm');
    if (bgm) {
        if (bgm.paused) { bgm.play(); } else { bgm.pause(); }
    }
}

// --- 2. 白皮書 Modal 控制 (Whitepaper Modal) ---
function openWhitepaper() {
    const modal = document.getElementById('wp-modal');
    if(modal) modal.style.display = 'flex';
}
function closeWhitepaper() {
    const modal = document.getElementById('wp-modal');
    if(modal) modal.style.display = 'none';
}

// --- 3. 語言切換系統 (Language System) ---
function setLanguage(lang) {
    document.body.className = 'lang-' + lang;
    
    const btnEn = document.getElementById('btn-en');
    const btnZh = document.getElementById('btn-zh');
    if(btnEn) btnEn.classList.toggle('active', lang === 'en');
    if(btnZh) btnZh.classList.toggle('active', lang === 'zh');
    
    const regBox = document.getElementById('reg-box');
    if (regBox && regBox.innerHTML.includes('NODE SECURED')) {
        const spans = regBox.querySelectorAll('[lang-content]');
        spans.forEach(el => {
            el.style.display = el.getAttribute('lang-content') === lang ? 'inline' : 'none';
        });
    }
    
    // 如果 Core 的方法已經載入，切換語言後順便更新畫面計算
    if (typeof runCalc === "function") runCalc(); 
    if (typeof checkFissionStatus === "function") checkFissionStatus(true);
    if (typeof updateDrawButtonUI === "function") updateDrawButtonUI(); 
}

// --- 4. 通用複製功能 (Copy Utility) ---
function copyCode() {
    const code = document.getElementById('user-code');
    if(code) {
        navigator.clipboard.writeText(code.innerText);
        const isZh = document.body.classList.contains('lang-zh');
        alert(isZh ? "金鑰已複製！" : "Universal Key Copied!");
    }
}