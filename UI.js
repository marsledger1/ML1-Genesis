// ==========================================
// UI.js - 視覺與互動模組 (Visual & Interactive Module)
// ==========================================

// --- 1. 音樂控制系統 (BGM System) ---
let scWidget;
let isPlaying = false;

function initSoundCloud() {
    const iframeElement = document.getElementById('sc-widget');
    scWidget = SC.Widget(iframeElement);

    scWidget.bind(SC.Widget.Events.READY, function() {
        scWidget.setVolume(50); 
        scWidget.play(); 
        
        const forcePlay = () => {
            if (!isPlaying) scWidget.play();
            ['touchstart', 'touchend', 'click', 'scroll'].forEach(evt => {
                document.removeEventListener(evt, forcePlay, true);
            });
        };
        
        ['touchstart', 'touchend', 'click', 'scroll'].forEach(evt => {
            document.addEventListener(evt, forcePlay, true); 
        });

        const forcePlayInterval = setInterval(() => {
            if (!isPlaying) {
                scWidget.play();
            } else {
                clearInterval(forcePlayInterval);
            }
        }, 1000);
    });

    scWidget.bind(SC.Widget.Events.PLAY, function() {
        isPlaying = true;
        updateBgmUI();
    });

    scWidget.bind(SC.Widget.Events.PAUSE, function() {
        isPlaying = false;
        updateBgmUI();
    });
}

function toggleBGM(e) {
    if(e) e.stopPropagation(); 
    if (scWidget) scWidget.toggle();
}

function updateBgmUI() {
    const btn = document.getElementById('bgm-toggle');
    const isZh = document.body.classList.contains('lang-zh');
    
    if (!isPlaying) {
        btn.innerText = isZh ? "🔇 系統音樂: 關閉" : "🔇 BGM: OFF";
        btn.classList.remove('playing');
    } else {
        btn.innerText = isZh ? "🔊 系統音樂: 啟動" : "🔊 BGM: ON";
        btn.classList.add('playing');
    }
}

// --- 2. 分頁切換系統 (Tab Navigation) ---
function switchMainTab(n) {
    document.querySelectorAll('.main-tab-btn').forEach((btn, i) => {
        btn.classList.toggle('active', i === n);
    });
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
    document.getElementById('main-content-' + n).classList.add('active');
}

function switchSubTab(n) {
    document.querySelectorAll('.tab-btn').forEach((btn, i) => {
        btn.classList.toggle('active', i === n);
    });
    document.getElementById('sub-tab-content-0').style.display = n === 0 ? 'block' : 'none';
    document.getElementById('sub-tab-content-1').style.display = n === 1 ? 'block' : 'none';
}

// --- 3. 白皮書彈窗與複製 (Modal & Copy) ---
function openWhitepaperModal() { document.getElementById('whitepaper-modal').style.display = 'block'; }
function closeWhitepaperModal() { document.getElementById('whitepaper-modal').style.display = 'none'; }
function copy(t) { navigator.clipboard.writeText(t); alert("COPIED / 已複製"); }

// --- 4. 語言包與切換 (Language Dictionary & Switcher) ---
const content = {
    en: {
        tab0: "OVERVIEW", tab1: "PIONEER HUB", tab2: "SIMULATOR",
        loc: "LOC: JEZERO_CRATER_ALPHA", sys: "SYS_STATUS: TOP_SECRET",
        head: "MARS LEDGER 1", tag: "PROTOCOL: ML1-V5.7.0 // THE GENESIS COUNCIL EPOCH",
        name: "Jack Yiu", pos: "CHIEF ARCHITECT // MARS COLONY ONE",
        bio: "\"Traditional TCP/IP and legacy Earth-bound blockchains (BTC, ETH, SOL) collapse under the 3-22 minute Latency Wall. Their synchronous consensus mechanisms cannot survive the speed of light barrier. ML1 is the first asynchronous state machine designed for the vacuum of deep space—enabling Mars-native liquidity that remains functional even when Earth is occluded.\"",
        pillH: "CORE INFRASTRUCTURE PILLARS",
        pills: [
            ["ASYNCHRONOUS STATE MACHINE", "Abandoning synchronous confirmation for \"Incremental Snapshot Synchronization.\" Mars nodes process local ledgers and emit encrypted state-diffs, eliminating the requirement for Earth-side real-time ACKs."],
            ["PERMISSIONLESS PoPW", "Any autonomous rover or edge-computing unit on Mars can plug into the ML1 API, anchoring the ledger's value to actual physical ISRU extraction."],
            ["PROTOCOL 433", "Sub-Ghz frequency bridges ensuring ledger persistence and peer-to-peer survival even during global Martian dust storms."],
            ["THE DUAL-TOKEN ECONOMY", "$ML1 (Fixed 10M supply) acts as the Mars land deed. Post-TGE, nodes can lock $ML1 into 'Cryo-Sleep Staking' to mine $O2 (Liquid Oxygen)."]
        ],
        tokH: "V5.7.0 SUPREMACY: TOKENOMICS & PRICING TIER",
        toks: [
            ["10,000,000 FIXED SUPPLY ($ML1)", "Total supply is hard-capped. Zero inflation. Pure resource-backed interstellar liquidity."],
            ["TIERED BONDING CURVE (FOMO)", "Phase 1 early birds get 1:1 allocation. Cost increases to 1:1.2 at $500k, 1:1.5 at $750k, and doubles (1:2) in Phase 2. The earlier you deploy, the more equity you secure."]
        ],
        meshH: "MESH EXPANSION & THE GENESIS COUNCIL",
        meshes: [
            ["2-TIER VOLUME PENETRATION", "A bulletproof network expansion algorithm. Direct recruits (L1) grant 100% volume and 1.0 score. Indirect recruits (L2) grant 100% volume and 0.5 score. Strict IP & On-chain cross-validation active."],
            ["MILITARY RANK SYSTEM", "Your capital and mesh size determine your Tier (From Genesis to Emperor). Reach Tier 5 ($50k+ or 100 Nodes) to unlock 40% TGE, 100 BTC Raffle Tickets, and a 100% $O2 Mining Boost."],
            ["THE GENESIS COUNCIL (TOP 10)", "When the $1M Phase 1 Hard Cap is reached, the Top 10 Leaderboard wallets permanently become the Genesis Council, unlocking a 5% Global $O2 Tax dividend, Phase 2 Price Lock quota, and hardware Admin Keys."]
        ],
        verify: "* ALL COMMITS ARE MANUALLY VERIFIED VIA AIR-GAPPED SNAPSHOT SYNC TO ENSURE INTERSTELLAR LEDGER INTEGRITY.",
        dustH: 'CURRENT STATUS: RECRUITMENT OF <span style="color: var(--tier5-gold); font-weight: bold;">"GENESIS DUST-SEEDERS"</span> IS ACTIVE.',
        dustP: "EACH SEEDER WILL BE IMMORTALIZED IN THE ML1 GENESIS BLOCK // FIRST-LEVEL ACCESS GRANTED.",
        syncH: "GENESIS FUNDING SYNCHRONIZATION", syncP: "[ TARGET: 1,000,000 USD // SECURE PHASE 1 HARDWARE & MINT 10M $ML1 (THE ANCHOR OF FAITH) ]",
        nodeH: "PIONEER VALIDATION NODES", regH: "PIONEER REGISTRY (VC PORTAL)",
        btn: "COMMIT TO INTERSTELLAR LEDGER", foot: "JEZERO CRATER // ARCHITECT: JACK YIU // ALPHA DEPLOYMENT",
        inviteTitle: "PIONEER UNIVERSAL KEY",
        inviteDesc: `Once secured, your Pioneer Key acts as your <strong>Universal Login Key</strong>. Enter it across any device to instantly sync your node equity, team fission progress, and future $O2 mining rights. No wallet-connect needed.`,
        invitePlaceholder: "ENTER PIONEER KEY (e.g. ML1-XXXX)",
        unlockBtn: "UNLOCK JEZERO CRATER",
        calcTitle: "PHASE 1 GENESIS CALCULATOR v1.6",
        calcSubtitle: "Mars Ledger 1 • Genesis Fund Tokenomics",
        calcLabelAmount: "INPUT ASSET AMOUNT",
        calcLabelTokens: "PROJECTED ML1 TOKENS",
        calcShareText: "Your share of Genesis Fund:",
        calcTgeText: "TGE unlock: <strong style='color:#ff0;'>20%</strong> • Remaining vested with hardware milestones",
        calcButton: "CALCULATE MY MARS LEGACY",
        calcAdvTitle: "Genesis Dust-Seeders Advantage:",
        adv1: "Permanent name on Jezero Crater hardware nodes",
        adv2: "1:1 equity conversion to Mars Ledger Corp.",
        adv3: "Priority ISRU resource allocation on Mars",
        calcTierWarn: "⚠️ CURRENT TIER: 1:1 ALLOCATION. COST INCREASES BY 20% AT $500K."
    },
    zh: {
        tab0: "系統總覽", tab1: "先鋒樞紐", tab2: "深空模擬器",
        loc: "座標: JEZERO_CRATER_ALPHA", sys: "系統狀態: 防彈紀元",
        head: "火星帳本 1 號", tag: "協議: ML1-V5.7.0 // 創世議會與雙幣紀元",
        name: "Jack Yiu", pos: "首席架構師 // 火星第一殖民地",
        bio: "「傳統 TCP/IP 與舊有的地球鏈協議（BTC, ETH, SOL）在 3-22 分鐘的延遲牆面前會徹底崩潰。它們的同步共識機制無法跨越光速障礙。ML1 是首個為深空真空設計的非同步狀態機——確保在地球信號被遮蔽時，火星本土流動性依然能自主運作。」",
        pillH: "核心基礎設施四大支柱",
        pills: [
            ["非同步狀態機", "捨棄同步確認機制，採用「增量快照同步」。火星節點處理本地賬本並發射加密狀態差異，徹底消除對地球端實時回應的依賴。"],
            ["無需許可的 PoPW", "火星上任何自主探測車或邊緣計算單元均可接入 ML1 API，將帳本價值錨定於真實的實體 ISRU 資源開採。"],
            ["協議 433 (PROTOCOL 433)", "Sub-Ghz 無線橋接技術，確保即使在全球性火星沙塵暴期間，帳本數據仍能點對點存續。"],
            ["雙幣生態系統", "$ML1 (恆定1000萬) 作為火星地契。TGE 後，節點可將 $ML1 投入「冷凍休眠質押 (Cryo-Sleep)」以挖掘 $O2 (液氧) 燃料。"]
        ],
        tokH: "V5.7.0 至高無上：代幣定價階梯",
        toks: [
            ["10,000,000 恆定總量 ($ML1)", "供應量永久封頂，零通脹。純粹由資源驅動的星際流動性。"],
            ["階梯式聯合曲線 (Bonding Curve)", "Phase 1 早期參與者享有 1:1 兌換。資金池達 50萬美金後成本上升至 1:1.2，75萬上升至 1:1.5，Phase 2 正式翻倍 (1:2)。越早入金，暴利空間越大。"]
        ],
        meshH: "網格裂變機制與創世議會",
        meshes: [
            ["兩代資金穿透 (2-TIER PENETRATION)", "無懈可擊的擴張演算法。直推 (L1) 貢獻 100% 業績與 1.0 算力；間推 (L2) 貢獻 100% 業績與 0.5 算力。內建 IP 與星際鏈上資金交叉防刷驗證。"],
            ["軍閥階級系統 (MILITARY TIERS)", "由您的入金總量與網格規模決定軍階（從創世到火星大帝）。達成第五階 ($50k 或 100 節點) 即可解鎖 40% TGE、100 張 BTC 抽獎券與 100% $O2 挖礦極限加速。"],
            ["創世議會戰力榜 (THE GENESIS COUNCIL)", "當 Phase 1 達成 100 萬美金硬頂瞬間，排名前 10 的大戶將永久晉升為創世議會，解鎖「全網 5% $O2 稅收分紅」、「Phase 2 創世匯率鎖定額度」與「實體節點最高管理員密鑰」。"]
        ],
        verify: "* 所有提交均通過離線快照異步驗證，以確保星際賬本的完整性。",
        dustH: '當前狀態：<span style="color: var(--tier5-gold); font-weight: bold;">「創世塵播者」</span>招募中',
        dustP: "每位播種者將被永久刻入 ML1 創世區塊 // 獲取第一級核心訪問權限",
        syncH: "創世資金同步進度", syncP: "[ 戰略目標: 1,000,000 USD // 觸發第一階段硬體製造與 1000 萬 $ML1 創世鑄造 (信仰之錨) ]",
        nodeH: "先鋒驗證節點 (錢包地址)", regH: "先鋒註冊入口 (VC 提交門戶)",
        btn: "提交至星際賬本", foot: "耶澤羅撞擊坑 // 總架構師: JACK YIU // ALPHA 部署階段",
        inviteTitle: "PIONEER UNIVERSAL KEY // 先鋒通用金鑰",
        inviteDesc: `獲取先鋒邀請碼後，它將成為您的<strong>通用登入金鑰</strong>。跨裝置輸入即可無縫同步您的節點資產、裂變進度與未來的 $O2 挖礦權限，無需頻繁連接錢包。`,
        invitePlaceholder: "輸入通用金鑰 (例: ML1-XXXX)",
        unlockBtn: "UNLOCK JEZERO CRATER",
        calcTitle: "第一階段創世計算器 v1.6",
        calcSubtitle: "火星帳本 1 • 創世基金代幣經濟學",
        calcLabelAmount: "輸入代幣數量",
        calcLabelTokens: "預計獲得 ML1 代幣",
        calcShareText: "您在創世基金的份額：",
        calcTgeText: "TGE 解鎖： <strong style='color:#ff0;'>20%</strong> • 剩餘部分隨硬體部署里程碑逐步釋放",
        calcButton: "計算我的火星遺產",
        calcAdvTitle: "創世塵播者優勢：",
        adv1: "Jezero Crater 硬體節點永久命名權",
        adv2: "1:1 兌換 Mars Ledger Corp. 優先股權",
        adv3: "火星 ISRU 資源優先分配權",
        calcTierWarn: "⚠️ 當前階梯：1:1 頂級額度。資金池達 50萬 USD 後成本將增加 20%。"
    }
};

function setLang(lang) {
    document.body.className = 'lang-' + lang; 

    const d = content[lang];
    document.getElementById('main-tab-0').innerText = d.tab0;
    document.getElementById('main-tab-1').innerText = d.tab1;
    document.getElementById('main-tab-2').innerText = d.tab2;
    document.getElementById('t-loc').innerText = d.loc;
    document.getElementById('t-sys').innerText = d.sys;
    document.getElementById('t-head').innerText = d.head;
    document.getElementById('t-tag').innerText = d.tag;
    document.getElementById('t-name').innerText = d.name;
    document.getElementById('t-pos').innerText = d.pos;
    document.getElementById('t-bio').innerText = d.bio;
    document.getElementById('t-pill-h').innerText = d.pillH;
    document.getElementById('t-tok-h').innerText = d.tokH;
    document.getElementById('t-verify').innerText = d.verify;
    document.getElementById('t-dust-h').innerHTML = d.dustH;
    document.getElementById('t-dust-p').innerText = d.dustP;
    document.getElementById('t-sync-h').innerText = d.syncH;
    document.getElementById('t-sync-p').innerText = d.syncP;
    document.getElementById('t-node-h').innerText = d.nodeH;
    document.getElementById('t-reg-h').innerText = d.regH;
    document.getElementById('t-btn').innerText = d.btn;
    document.getElementById('t-foot').innerText = d.foot;

    document.getElementById('pill-grid').innerHTML = d.pills.map(p => `
        <div class="spec-card"><h4>${p[0]}</h4><p>${p[1]}</p></div>
    `).join('');
    
    document.getElementById('tok-grid').innerHTML = d.toks.map(t => `
        <div class="spec-card" style="border-left-color: var(--lag-blue); background: rgba(0,0,0,0.4);">
            <h4>${t[0]}</h4><p>${t[1]}</p>
        </div>
    `).join('');

    // 新增：渲染 網格裂變機制與創世議會 區塊
    document.getElementById('t-mesh-h').innerText = d.meshH;
    document.getElementById('mesh-grid').innerHTML = d.meshes.map(m => `
        <div class="spec-card" style="border-left-color: var(--tier5-gold); background: rgba(0,0,0,0.4);">
            <h4 style="color: var(--tier5-gold);">${m[0]}</h4><p>${m[1]}</p>
        </div>
    `).join('');

    document.getElementById('invite-title').innerHTML = d.inviteTitle;
    document.getElementById('invite-desc').innerHTML = d.inviteDesc;
    document.getElementById('access-key').placeholder = d.invitePlaceholder;
    document.getElementById('unlock-btn').innerText = d.unlockBtn;

    const regWallet = document.getElementById('reg-wallet');
    if(regWallet) {
        regWallet.placeholder = lang === 'en' ? "Wallet Address (Must match reservation)" : "錢包地址 (必須與預約地址相同)";
    }
    
    const regAmount = document.getElementById('reg-amount');
    if(regAmount) {
        regAmount.placeholder = lang === 'en' ? "Token Amount (e.g., 0.112)" : "代幣數量 (例如: 0.112)";
    }
    
    const regHash = document.getElementById('reg-hash');
    if(regHash) {
        regHash.placeholder = lang === 'en' ? "Transaction Hash (TXID)" : "交易哈希 (打款 TXID)";
    }

    if (document.getElementById('calc-title')) {
        document.getElementById('calc-title').innerHTML = d.calcTitle;
        document.getElementById('calc-subtitle').innerHTML = d.calcSubtitle;
        document.getElementById('calc-label-amount').innerHTML = d.calcLabelAmount;
        document.getElementById('calc-label-tokens').innerHTML = d.calcLabelTokens;
        document.getElementById('calc-share-text').innerHTML = d.calcShareText;
        document.getElementById('calc-tge-text').innerHTML = d.calcTgeText;
        document.getElementById('calc-advantage-title').innerHTML = d.calcAdvTitle;
        document.getElementById('adv1').innerHTML = d.adv1;
        document.getElementById('adv2').innerHTML = d.adv2;
        document.getElementById('adv3').innerHTML = d.adv3;
        document.getElementById('calc-tier-warning').innerHTML = d.calcTierWarn;
    }
    
    if (typeof runPhase1Calc === "function") {
        runPhase1Calc();
    }

    document.querySelectorAll('.lang-btn').forEach(b => b.classList.remove('active'));
    document.getElementById('btn-' + lang).classList.add('active');

    updateBgmUI();
}

// --- 5. 終端機打字特效與模擬器視覺指令 (Visual Simulator) ---
function typeWriter(textEn, textZh, color = 'var(--tech-green)') {
    const terminal = document.getElementById('terminal-output');
    const isZh = document.body.classList.contains('lang-zh');
    const textToType = isZh ? textZh : textEn;

    const newLine = document.createElement('div');
    newLine.style.color = color;
    terminal.appendChild(newLine);
    
    let i = 0;
    function type() {
        if (i < textToType.length) {
            newLine.innerHTML += textToType.charAt(i);
            i++;
            setTimeout(type, 15);
        } else {
            terminal.scrollTop = terminal.scrollHeight;
        }
    }
    type();
    
    if (terminal.childElementCount > 5) {
        terminal.removeChild(terminal.firstChild);
    }
}

function triggerISRU() {
    const bg = document.getElementById('telemetry-bg');
    bg.style.filter = 'grayscale(0%) contrast(150%) brightness(1.2)';
    setTimeout(() => bg.style.filter = 'grayscale(50%) contrast(120%)', 500);
    
    const resTypes = [
        { en: "SUBSURFACE H2O (ICE)", zh: "地下水冰 (H2O)", min: 3.0, max: 8.5 },
        { en: "LIQUID O2 SYNTHESIZED", zh: "液氧 (O2) 合成完畢", min: 1.0, max: 4.2 },
        { en: "METHANE (CH4) FUEL", zh: "甲烷 (CH4) 燃料", min: 2.0, max: 5.5 },
        { en: "REGOLITH RARE-EARTH", zh: "火星壤稀土礦物", min: 0.1, max: 1.8 }
    ];
    
    const rand = resTypes[Math.floor(Math.random() * resTypes.length)];
    const amount = (Math.random() * (rand.max - rand.min) + rand.min).toFixed(2);

    typeWriter(`> [OPTIMUS_01] SENSOR: ${amount}KG ${rand.en} DETECTED.`, `> [OPTIMUS_01] 傳感器: 採集/合成 ${amount}KG ${rand.zh}.`, "#fff");
    setTimeout(() => typeWriter("> PROOF OF PHYSICAL WORK (PoPW) HASH GENERATED.", "> 物理工作量證明 (PoPW) 哈希已生成.", "var(--tech-green)"), 600);
    setTimeout(() => typeWriter("> ML1 LOCAL LEDGER UPDATED. AWAITING BATCH...", "> ML1 本地帳本已更新. 等待批次同步...", "var(--tech-green)"), 1200);
}

function triggerSnapshot() {
    const load = document.getElementById('sys-load');
    load.innerText = "99";
    setTimeout(() => load.innerText = Math.floor(Math.random() * 20 + 30), 2000);

    typeWriter("> COMPILING 10-MIN INCREMENTAL SNAPSHOT...", "> 正在編譯 10 分鐘增量快照...", "var(--lag-blue)");
    setTimeout(() => typeWriter("> ENCRYPTING VIA PROTOCOL 433...", "> 正在透過 Protocol 433 進行加密...", "var(--lag-blue)"), 800);
    setTimeout(() => typeWriter("> SNAPSHOT EMITTED. EXPECTED EARTH ARRIVAL: 21.4 MINS.", "> 快照已發射. 預計抵達地球時間: 21.4 分鐘.", "var(--lag-blue)"), 1600);
}

function triggerBlackout() {
    const overlay = document.getElementById('screen-overlay');
    const status = document.getElementById('conn-status');
    const isZh = document.body.classList.contains('lang-zh');
    
    overlay.style.background = 'rgba(255,0,0,0.4)';
    status.innerHTML = isZh ? "✖ 地球鏈路已中斷" : "✖ EARTH LINK SEVERED";
    status.style.color = "#ff4444";

    typeWriter("!! WARNING: ZERO TELEMETRY FROM TERRA_PRIME !!", "!! 警告: 失去來自地球(TERRA_PRIME)的遙測信號 !!", "#ff4444");
    setTimeout(() => typeWriter("> INITIATING ASYNCHRONOUS SURVIVAL MODE...", "> 正在啟動非同步生存模式...", "#ff4444"), 1000);
    setTimeout(() => {
        typeWriter("> ML1 AUTONOMOUS CONSENSUS OVERRIDE ACTIVE. WE ARE INDEPENDENT.", "> ML1 自主共識覆寫已啟動. 系統進入獨立運作狀態.", "var(--tech-green)");
        overlay.style.background = 'rgba(255,0,0,0)';
    }, 2500);
    
    setTimeout(() => {
        status.innerHTML = isZh ? "■ 上行鏈路安全" : "■ UPLINK SECURE";
        status.style.color = "#00ff41";
        typeWriter("> EARTH LINK RESTORED. BATCH SYNCING...", "> 地球通訊已恢復. 正在進行批次同步...", "var(--lag-blue)");
    }, 8000);
}