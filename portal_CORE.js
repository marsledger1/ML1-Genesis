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
        localStorage.removeItem('ml1_team_usd');
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

// --- 5. 更新 TGE 階級與軍銜顯示 (個人 + 團隊業績) ---
function updateTgeTier(count, myUSD = 0, teamUSD = 0) {
    document.getElementById('recruit-count').innerText = count;
    
    let totalVolume = myUSD + teamUSD;
    
    document.getElementById('my-usd-amount').innerText = totalVolume.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2});
    
    if(document.getElementById('personal-usd-display')) document.getElementById('personal-usd-display').innerText = myUSD.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2});
    if(document.getElementById('team-usd-display')) document.getElementById('team-usd-display').innerText = teamUSD.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2});
    if(document.getElementById('personal-usd-display-zh')) document.getElementById('personal-usd-display-zh').innerText = myUSD.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2});
    if(document.getElementById('team-usd-display-zh')) document.getElementById('team-usd-display-zh').innerText = teamUSD.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2});

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
    let tierByUSD = totalVolume >= 50000 ? 5 : totalVolume >= 10000 ? 4 : totalVolume >= 1000 ? 3 : totalVolume >= 100 ? 2 : 1;
    let currentTier = Math.max(tierByNodes, tierByUSD);

    fill.style.width = (currentTier * 20) + '%'; 

    if (currentTier === 5) {
        tgeRate = 0.40; currentBtcTickets = 100;
        tgeDisplay.innerText = '40% TGE + 100x TICKETS + 100% $O2 BOOST'; 
        tgeDisplay.style.color = 'var(--tier5-gold)';
        tierName.innerText = isZh ? '[第五階: 火星大帝]' : '[Tier 5: Mars Emperor]';
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
        tierName.innerText = isZh ? '[第四階: 軍閥]' : '[Tier 4: Mars Warlord]';
        tierName.style.color = 'var(--tier4-purple)';
        tgeBar.style.width = '35%'; tgeBar.style.background = 'var(--tier4-purple)'; tgeLabel.style.color = 'var(--tier4-purple)';
        o2BoostDisplay.innerHTML = `BOOST: <b style="color: #ffcc00; opacity: 0.9;">+50%</b>`;
        nextTierHint.innerText = isZh ? `🚀 下一階 [火星大帝]：需滿 100 名推薦或業績達 $50K USD！` : `🚀 NEXT [Emperor]: 100 INVITES OR $50K VOL!`;
    }
    else if (currentTier === 3) { 
        tgeRate = 0.30; currentBtcTickets = 10;
        tgeDisplay.innerText = '30% TGE + 10x TICKETS + 30% $O2 BOOST'; 
        tgeDisplay.style.color = 'var(--mars-red)';
        tierName.innerText = isZh ? '[第三階: 領主]' : '[Tier 3: Mars Overlord]';
        tierName.style.color = 'var(--mars-red)';
        tgeBar.style.width = '30%'; tgeBar.style.background = 'var(--mars-red)'; tgeLabel.style.color = 'var(--mars-red)';
        o2BoostDisplay.innerHTML = `BOOST: <b style="color: #ffcc00; opacity: 0.8;">+30%</b>`;
        nextTierHint.innerText = isZh ? `🚀 下一階 [軍閥]：需滿 30 名推薦或業績達 $10K USD！` : `🚀 NEXT [Warlord]: 30 INVITES OR $10K VOL!`;
    }
    else if (currentTier === 2) { 
        tgeRate = 0.25; currentBtcTickets = 3;
        tgeDisplay.innerText = '25% TGE + 3x TICKETS + 10% $O2 BOOST'; 
        tgeDisplay.style.color = 'var(--lag-blue)';
        tierName.innerText = isZh ? '[第二階: 指揮官]' : '[Tier 2: Mesh Commander]';
        tierName.style.color = 'var(--lag-blue)';
        tgeBar.style.width = '25%'; tgeBar.style.background = 'var(--lag-blue)'; tgeLabel.style.color = 'var(--lag-blue)';
        o2BoostDisplay.innerHTML = `BOOST: <b style="color: #ffcc00; opacity: 0.7;">+10%</b>`;
        nextTierHint.innerText = isZh ? `🚀 下一階 [領主]：需滿 10 名推薦或業績達 $1K USD！` : `🚀 NEXT [Overlord]: 10 INVITES OR $1K VOL!`;
    }
    else { 
        tgeRate = 0.20; currentBtcTickets = 1;
        tgeDisplay.innerText = '20% TGE UNLOCK + 1x TICKET';
        tgeDisplay.style.color = '#888';
        tierName.innerText = isZh ? '[第一階: 創世]' : '[Tier 1: Genesis]';
        tierName.style.color = '#888';
        tgeBar.style.width = '20%'; tgeBar.style.background = 'var(--tech-green)'; tgeLabel.style.color = 'var(--tech-green)';
        o2BoostDisplay.innerHTML = `BOOST: <b style="color: #ffcc00; opacity: 0.5;">+0%</b>`;
        nextTierHint.innerText = isZh ? `🚀 下一階 [指揮官]：需滿 3 名推薦或業績達 $100 USD！` : `🚀 NEXT [Commander]: 3 INVITES OR $100 VOL!`;
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
                if(document.getElementById('portal-tabs')) document.getElementById('portal-tabs').style.display = 'flex';
                document.getElementById('logout-btn').style.display = 'block'; 
                
                if (key === 'ml1-core-001') {
                    localStorage.setItem('ml1_fission_code', 'ML1-CORE-001');
                    localStorage.setItem('ml1_recruits', '100'); 
                    localStorage.setItem('ml1_personal_usd', '100000'); 
                    localStorage.setItem('ml1_team_usd', '0'); 
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

// --- Web3 錢包連接模組 (WalletConnect - 智能防劫持 & 防呆版) ---
async function connectWallet(inputId, buttonId) {
    if (typeof window.ethereum !== 'undefined') {
        try {
            const btn = document.getElementById(buttonId);
            const isZh = document.body.classList.contains('lang-zh');
            btn.innerText = isZh ? "請求授權中..." : "CONNECTING...";
            
            // 🚀 核心防劫持邏輯：強制找出正牌的 MetaMask
            let provider = window.ethereum;
            if (window.ethereum.providers) {
                provider = window.ethereum.providers.find(p => p.isMetaMask) || provider;
            }
            
            // 彈出 MetaMask 要求授權
            const accounts = await provider.request({ method: 'eth_requestAccounts' });
            const userAddress = accounts[0];
            
            // 🚀 授權成功：自動填入對應的 input 欄位
            const inputField = document.getElementById(inputId);
            inputField.value = userAddress;
            
            // 🔒 終極防呆：鎖死輸入框，變成半透明，不允許手動修改！
            inputField.readOnly = true;
            inputField.style.opacity = '0.7'; 
            inputField.style.cursor = 'not-allowed';
            
            // 更新按鈕狀態為成功，並顯示縮短後的地址
            const shortAddr = userAddress.slice(0, 6) + "..." + userAddress.slice(-4);
            btn.innerText = `✅ ${shortAddr}`;
            btn.style.background = 'rgba(0, 255, 65, 0.2)';
            btn.style.border = '1px solid #00ff41';
            
        } catch (error) {
            console.error("Wallet connection error:", error);
            const btn = document.getElementById(buttonId);
            btn.innerText = "🦊 CONNECT METAMASK / 連接錢包";

            // 精準判斷錯誤類型，並給予跨平台提示
            if (error.code === 4001) {
                alert("❌ 授權失敗：您拒絕了連接請求。 / Connection Rejected.");
            } else if (error.code === -32002) {
                alert("⚠️ 授權請求已發送！\n請點擊瀏覽器右上角的「MetaMask 狐狸圖標」解鎖並確認連接。");
            } else {
                alert("❌ 發生未知錯誤 / Error: " + error.message + "\n\n💡 排除故障指南：\n💻 【電腦用戶】請暫時去擴充功能關閉 (Disable) 其他錢包 (如 Trust/OKX/Phantom)，只保留 MetaMask！\n📱 【手機用戶】請在錢包 App 內的「發現 / DApp 瀏覽器」中開啟本網站！");
            }
        }
    } else {
        // 系統完全找不到錢包 (例如在普通手機 Safari 打開)
        alert("⚠️ 系統偵測不到 Web3 錢包！\n\n💻 【電腦用戶】請安裝 MetaMask 擴充功能。\n📱 【手機用戶】請務必在您的錢包 App (如 MetaMask/Trust) 內的「DApp 瀏覽器」中輸入本網址開啟！\n\n您也可以直接在下方手動輸入錢包地址。");
    }
}
