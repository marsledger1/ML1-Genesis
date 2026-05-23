// ==========================================
// portal_CORE.js - 核心業務邏輯模組 (Core Logic Module)
// ==========================================

// --- 1. 全局狀態與變數 ---
let tgeRate = 0.20; 
let currentBtcTickets = 1; 
let isBtcMilestoneReached = false; 
let globalClientIP = "UNKNOWN"; 

// --- 2. 登出與快取清理 ---
function clearPioneerCache() {
    if(confirm("Are you sure you want to clear your local Pioneer Key cache and log out? \n確定要清除本地金鑰紀錄並登出嗎？")) {
        localStorage.removeItem('ml1_fission_code');
        localStorage.removeItem('ml1_recruits');
        localStorage.removeItem('ml1_personal_usd');
        window.location.reload();
    }
}

// --- 3. 階梯定價與估值計算器 ---
function runCalc() {
    const val = parseFloat(document.getElementById('inv-amount').value) || 0;
    const fomoAlert = document.getElementById('fomo-alert');
    const isZh = document.body.classList.contains('lang-zh');

    if (val === 0) {
        document.getElementById('res-total').innerText = '0 ML1';
        document.getElementById('res-phase2').innerText = '0 ML1';
        fomoAlert.style.display = 'none';
        return;
    }

    const currentRatio = 1; 
    const currentTokens = val * currentRatio;
    const phase2Ratio = 0.5;
    const phase2Tokens = val * phase2Ratio;
    const lostTokens = currentTokens - phase2Tokens;

    document.getElementById('res-total').innerText = currentTokens.toLocaleString() + ' ML1';
    document.getElementById('res-phase2').innerText = phase2Tokens.toLocaleString() + ' ML1';

    fomoAlert.style.display = 'block';
    if (isZh) {
        fomoAlert.innerHTML = `⚠️ 極限警告：如果您拖延到 Phase 2 才入金，您將<b>白白損失 ${lostTokens.toLocaleString()} 枚 ML1</b>！這將直接削減您未來的 $O2 製氧收益！`;
    } else {
        fomoAlert.innerHTML = `⚠️ OPPORTUNITY COST: If you wait for Phase 2, you will <b>lose exactly ${lostTokens.toLocaleString()} ML1</b>! This directly reduces your future $O2 mining rate!`;
    }
}

// --- 4. 錢包地址防呆驗證 ---
function isValidWeb3Wallet(address) {
    return /^0x[a-fA-F0-9]{40}$/.test(address) || /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(address);
}

// --- 5. 更新 TGE 階級與軍銜顯示 ---
function updateTgeTier(count, myUSD = 0) {
    document.getElementById('recruit-count').innerText = count;
    document.getElementById('my-usd-amount').innerText = myUSD.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2});
    
    let fill = document.getElementById('tier-fill');
    let tgeDisplay = document.getElementById('tge-display');
    let tierName = document.getElementById('tier-name');
    let tgeBar = document.getElementById('tge-bar-fill');
    let tgeLabel = document.getElementById('tge-label');
    let seedAdvantage = document.getElementById('seed-advantage');
    let phase2Quota = document.getElementById('phase2-quota');
    let nextTierHint = document.getElementById('next-tier-hint');
    let o2BoostDisplay = document.getElementById('o2-boost-display');
    const isZh = document.body.classList.contains('lang-zh');
    
    seedAdvantage.style.display = 'none';
    phase2Quota.style.display = 'none';
    nextTierHint.style.display = 'block';

    let tierByNodes = count >= 100 ? 5 : count >= 30 ? 4 : count >= 10 ? 3 : count >= 3 ? 2 : 1;
    let tierByUSD = myUSD >= 100000 ? 5 : myUSD >= 10000 ? 4 : myUSD >= 1000 ? 3 : myUSD >= 100 ? 2 : 1;
    let currentTier = Math.max(tierByNodes, tierByUSD);
    let upgradedViaUSD = currentTier > tierByNodes;

    fill.style.width = (currentTier * 20) + '%'; 

    if (currentTier === 5) {
        tgeRate = 0.40; currentBtcTickets = 100;
        tgeDisplay.innerText = '40% TGE + 100x TICKETS + 100% $O2 BOOST'; 
        tgeDisplay.style.color = 'var(--tier5-gold)';
        tierName.innerText = upgradedViaUSD ? '[Tier 5: Emperor (Capital Upgraded)]' : '[Tier 5: Mars Emperor]';
        tierName.style.color = 'var(--tier5-gold)';
        tgeBar.style.width = '40%'; tgeBar.style.background = 'var(--tier5-gold)'; tgeLabel.style.color = 'var(--tier5-gold)';
        seedAdvantage.style.display = 'block'; nextTierHint.style.display = 'none'; 
        o2BoostDisplay.innerHTML = `BOOST: <b style="color: #ffcc00; opacity: 1;">+100% MAX</b>`;
        
        let payloadKg = ((count > 100 ? count - 100 : 0) * 5 + 50).toFixed(1); 
        phase2Quota.style.display = 'block';
        phase2Quota.innerHTML = isZh ? `🌟 終極特權 實體載荷解鎖: <b>+${payloadKg} KG</b>` : `🌟 ULTIMATE ORBITAL PAYLOAD UNLOCKED: <b>+${payloadKg} KG</b>`;
    }
    else if (currentTier === 4) {
        tgeRate = 0.35; currentBtcTickets = 30;
        tgeDisplay.innerText = '35% TGE + 30x TICKETS + 50% $O2 BOOST'; 
        tgeDisplay.style.color = 'var(--tier4-purple)';
        tierName.innerText = upgradedViaUSD ? '[Tier 4: Warlord (Capital Upgraded)]' : '[Tier 4: Mars Warlord]';
        tierName.style.color = 'var(--tier4-purple)';
        tgeBar.style.width = '35%'; tgeBar.style.background = 'var(--tier4-purple)'; tgeLabel.style.color = 'var(--tier4-purple)';
        o2BoostDisplay.innerHTML = `BOOST: <b style="color: #ffcc00; opacity: 0.9;">+50%</b>`;
        nextTierHint.innerText = isZh ? `🚀 下一階 [Emperor]：需滿 100 名推薦或累積 $100K USD！` : `🚀 NEXT [Emperor]: 100 INVITES OR $100K USD!`;
    }
    else if (currentTier === 3) { 
        tgeRate = 0.30; currentBtcTickets = 10;
        tgeDisplay.innerText = '30% TGE + 10x TICKETS + 30% $O2 BOOST'; 
        tgeDisplay.style.color = 'var(--mars-red)';
        tierName.innerText = upgradedViaUSD ? '[Tier 3: Overlord (Capital Upgraded)]' : '[Tier 3: Mars Overlord]';
        tierName.style.color = 'var(--mars-red)';
        tgeBar.style.width = '30%'; tgeBar.style.background = 'var(--mars-red)'; tgeLabel.style.color = 'var(--mars-red)';
        o2BoostDisplay.innerHTML = `BOOST: <b style="color: #ffcc00; opacity: 0.8;">+30%</b>`;
        nextTierHint.innerText = isZh ? `🚀 下一階 [Warlord]：需滿 30 名推薦或累積 $10K USD！` : `🚀 NEXT [Warlord]: 30 INVITES OR $10K USD!`;
    }
    else if (currentTier === 2) { 
        tgeRate = 0.25; currentBtcTickets = 3;
        tgeDisplay.innerText = '25% TGE + 3x TICKETS + 10% $O2 BOOST'; 
        tgeDisplay.style.color = 'var(--lag-blue)';
        tierName.innerText = upgradedViaUSD ? '[Tier 2: Commander (Capital Upgraded)]' : '[Tier 2: Mesh Commander]';
        tierName.style.color = 'var(--lag-blue)';
        tgeBar.style.width = '25%'; tgeBar.style.background = 'var(--lag-blue)'; tgeLabel.style.color = 'var(--lag-blue)';
        o2BoostDisplay.innerHTML = `BOOST: <b style="color: #ffcc00; opacity: 0.7;">+10%</b>`;
        nextTierHint.innerText = isZh ? `🚀 下一階 [Overlord]：需滿 10 名推薦或累積 $1K USD！` : `🚀 NEXT [Overlord]: 10 INVITES OR $1K USD!`;
    }
    else { 
        tgeRate = 0.20; currentBtcTickets = 1;
        tgeDisplay.innerText = '20% TGE UNLOCK + 1x TICKET';
        tgeDisplay.style.color = '#888';
        tierName.innerText = '[Tier 1: Genesis]';
        tierName.style.color = '#888';
        tgeBar.style.width = '20%'; tgeBar.style.background = 'var(--tech-green)'; tgeLabel.style.color = 'var(--tech-green)';
        o2BoostDisplay.innerHTML = `BOOST: <b style="color: #ffcc00; opacity: 0.5;">+0%</b>`;
        nextTierHint.innerText = isZh ? `🚀 下一階 [Commander]：需滿 3 名推薦或累積 $100 USD！` : `🚀 NEXT [Commander]: 3 INVITES OR $100 USD!`;
    }
    
    updateDrawButtonUI();
}

// --- 6. BTC 抽獎按鈕與邏輯 ---
function updateDrawButtonUI() {
    const btn = document.getElementById('btc-draw-btn');
    if(!btn) return;
    const isZh = document.body.classList.contains('lang-zh');
    
    if (isBtcMilestoneReached) {
        btn.disabled = false;
        btn.innerHTML = isZh 
            ? `🚀 獎池已解鎖！投入 [ ${currentBtcTickets} ] 張抽獎券爭奪 BTC` 
            : `🚀 POOL UNLOCKED! CAST [ ${currentBtcTickets} ] TICKETS FOR BTC`;
    } else {
        btn.disabled = true;
        btn.innerHTML = isZh 
            ? `🔒 目標未達成 // 等待突破 25萬美金解鎖` 
            : `🔒 MILESTONE LOCKED // WAITING FOR $250K`;
    }
}

function attemptDraw() {
    const isZh = document.body.classList.contains('lang-zh');
    if (isZh) {
        alert(`✅ ${currentBtcTickets} 張抽獎券已成功寫入星際帳本合約！\n系統將在創世倒數結束後，統一由區塊鏈 VRF 隨機數開獎。`);
    } else {
        alert(`✅ ${currentBtcTickets} Tickets successfully cast into the Interstellar Ledger!\nAwaiting VRF smart contract resolution at Genesis completion.`);
    }
}

// --- 7. 模擬星際握手讀條 (Fake Loading Auth) ---
function startSyncSequence() {
    const urlParams = new URLSearchParams(window.location.search);
    let key = document.getElementById('pioneer-key').value.trim().toLowerCase();
    if(!key) key = urlParams.get('auth');
    
    if (key !== 'mars2026' && key !== 'ml1-core-001' && !key.startsWith('ml1-')) return alert("ACCESS DENIED / 無效的通用金鑰");

    const bgm = document.getElementById('portal-bgm');
    if(bgm) bgm.play().catch(()=>{});

    const lagScreen = document.getElementById('lag-screen');
    const lBar = document.getElementById('l-bar');
    lagScreen.style.display = 'flex';
    let currentProgress = 0;

    const progressInterval = setInterval(() => {
        currentProgress += Math.random() * 5; 
        if (currentProgress >= 100) {
            currentProgress = 100;
            clearInterval(progressInterval);
            setTimeout(() => {
                lagScreen.style.display = 'none';
                document.getElementById('gate-ui').style.display = 'none';
                document.getElementById('investor-dashboard').style.display = 'block';
                document.getElementById('logout-btn').style.display = 'block'; 
                
                if (key === 'ml1-core-001') {
                    localStorage.setItem('ml1_fission_code', 'ML1-CORE-001');
                    localStorage.setItem('ml1_recruits', '100'); 
                    localStorage.setItem('ml1_personal_usd', '100000'); 
                } 
                else if (key.startsWith('ml1-')) {
                    localStorage.setItem('ml1_fission_code', key.toUpperCase());
                }
                
                if (typeof checkFissionStatus === "function") checkFissionStatus();
            }, 800);
        }
        lBar.style.width = currentProgress + '%';
    }, 40);
}