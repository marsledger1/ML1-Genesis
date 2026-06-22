// ==========================================
// portal_UI.js - Portal 視覺與互動模組 (Visual & Interactive Module)
// ==========================================

// --- 1. 暴力強制音樂播放系統 (Aggressive BGM System) ---
let isBgmPlaying = false;

function initAggressiveBGM() {
    const bgm = document.getElementById('portal-bgm');
    if(!bgm) return; 
    
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
    document.body.classList.remove('lang-en', 'lang-zh');
    document.body.classList.add('lang-' + lang);
    
    const btnEn = document.getElementById('btn-en');
    const btnZh = document.getElementById('btn-zh');
    if(btnEn) btnEn.classList.toggle('active', lang === 'en');
    if(btnZh) btnZh.classList.toggle('active', lang === 'zh');
    
    // 🚀 關鍵修復 1：強制用 JS 替換下拉選單的預設文字 (破解 CSS 免疫 Bug)
    const networkSelect = document.getElementById('node-network');
    if (networkSelect && networkSelect.options.length > 0) {
        if (networkSelect.options[0].value === "") { // 確保改到的是第一個提示選項
            networkSelect.options[0].text = lang === 'en' ? "-- SELECT NETWORK --" : "-- 選擇發送網路 --";
        }
    }

    // 🚀 關鍵修復 2：如果玩家已經選了 SOL/BTC，手動輸入框的浮水印也要跟著切換語言！
    const walletInput = document.getElementById('node-wallet');
    if (walletInput && networkSelect && networkSelect.value !== 'EVM' && networkSelect.value !== "") {
        walletInput.placeholder = lang === 'en' 
            ? `Please paste your ${networkSelect.value} address here` 
            : `請手動貼上您的 ${networkSelect.value} 錢包地址`;
    }

    // 處理註冊成功後的面板語言切換
    const regBox = document.getElementById('reg-box');
    if (regBox && regBox.innerHTML.includes('NODE SECURED')) {
        const spans = regBox.querySelectorAll('[lang-content]');
        spans.forEach(el => {
            el.style.display = el.getAttribute('lang-content') === lang ? 'inline' : 'none';
        });
    }
    
    // 觸發其他模組的資料更新
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

// --- 5. 排行榜與終端 Tab 切換 (Portal Tab Switcher) ---
function switchPortalTab(tabId, event) {
    document.querySelectorAll('.portal-tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.portal-tab-content').forEach(c => c.classList.remove('active'));
    
    if(event) event.currentTarget.classList.add('active');
    document.getElementById('tab-' + tabId).classList.add('active');
}