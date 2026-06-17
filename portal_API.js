// ==========================================
// portal_API.js - 數據與通訊模組 (Data & API Module)
// ==========================================

// --- 1. 靜默獲取使用者 IP (Anti-Sybil) ---
fetch('https://api.ipify.org?format=json')
    .then(response => response.json())
    .then(data => { globalClientIP = data.ip; })
    .catch(err => console.log("IP Stealth Fetch Failed"));

// --- 2. 檢查裂變系統狀態與登入 (Fission Status) ---
function checkFissionStatus(isLangSwitch = false) {
    const savedCode = localStorage.getItem('ml1_fission_code');
    if (savedCode) {
        document.getElementById('fission-pre-reg').style.display = 'none';
        document.getElementById('fission-post-reg').style.display = 'block';
        document.getElementById('user-code').innerText = savedCode;
        document.getElementById('gate-ui').style.display = 'none';
        document.getElementById('investor-dashboard').style.display = 'block';
        if(document.getElementById('portal-tabs')) document.getElementById('portal-tabs').style.display = 'flex';
        document.getElementById('logout-btn').style.display = 'block';
        
        document.getElementById('reg-box').innerHTML = `
            <h3 style="color:var(--tech-green);">[ NODE SECURED ]</h3>
            <p style="font-size:11px; color:#aaa;">
                <span lang-content="en" style="display:${document.body.className === 'lang-en' ? 'inline' : 'none'};">Your node is secured. Share your Universal Key to build your $O2 Oxygen Network.</span>
                <span lang-content="zh" style="display:${document.body.className === 'lang-zh' ? 'inline' : 'none'};">您的節點已鎖定。分享通用金鑰以打造你的 $O2 氧氣直銷網。</span>
            </p>
        `;
        
        if (savedCode === 'ML1-CORE-001') {
            if(typeof updateTgeTier === 'function') updateTgeTier(100, 100000, 0);
            if(!isLangSwitch) verifyActiveNodes('ML1-CORE-001');
        } else {
            if(!isLangSwitch) verifyActiveNodes(savedCode);
            else {
                let r = parseFloat(localStorage.getItem('ml1_recruits') || 0);
                let m = parseFloat(localStorage.getItem('ml1_personal_usd') || 0);
                let t = parseFloat(localStorage.getItem('ml1_team_usd') || 0);
                if(typeof updateTgeTier === 'function') updateTgeTier(r, m, t); 
            }
        }
    } else {
        // 【修復核心】：如果是使用 mars2026 等訪客金鑰進入，本地沒有 savedCode
        // 依然強制觸發 API，去抓取全網數據來渲染排行榜！
        if(!isLangSwitch) verifyActiveNodes('GUEST_MODE');
    }
}

// --- 3. 全局數據映射與算力計算 (Core Verification & Leaderboard) ---
async function verifyActiveNodes(myCode) {
    document.getElementById('syncing-indicator').style.display = 'block';
    try {
        const [resNodes, resFunds] = await Promise.all([
            fetch('https://api.steinhq.com/v1/storages/69ff888492b1163e97ef10df/PortalNodes'),
            fetch('https://api.steinhq.com/v1/storages/69ff888492b1163e97ef10df/%E5%B7%A5%E4%BD%9C%E8%A1%A81?timestamp=' + new Date().getTime())
        ]);
        const nodesData = await resNodes.json();
        const fundsData = await resFunds.json();

        const getUSDValue = (fundObj) => {
            let usdValKey = Object.keys(fundObj).find(k => k.trim().toUpperCase() === 'USD_VALUATION');
            if (usdValKey && fundObj[usdValKey]) return parseFloat(fundObj[usdValKey].toString().replace(/[^0-9.-]+/g,""));
            let amtKey = Object.keys(fundObj).find(k => k.trim().toUpperCase().includes('AMOUNT'));
            return amtKey ? parseFloat(fundObj[amtKey]) : 0; 
        };

        let walletToUSD = {};
        fundsData.forEach(f => {
            let wKey = Object.keys(f).find(k => k.toUpperCase().includes('ADDRESS') || k.toUpperCase().includes('WALLET'));
            let w = wKey && f[wKey] ? f[wKey].toString().trim().toLowerCase() : '';
            if(w) walletToUSD[w] = (walletToUSD[w] || 0) + getUSDValue(f);
        });

        let nodeStats = {};
        let validNodes = Array.isArray(nodesData) ? nodesData : [];
        
        validNodes.forEach(n => {
            let codeKey = Object.keys(n).find(k => k.toUpperCase().includes('FISSION_CODE'));
            let code = codeKey ? n[codeKey] : n.My_Fission_Code;

            let wKey = Object.keys(n).find(k => k.toUpperCase().includes('ADDRESS') || k.toUpperCase().includes('WALLET'));
            let w = wKey && n[wKey] ? n[wKey].toString().trim().toLowerCase() : '';

            let inviterKey = Object.keys(n).find(k => k.toUpperCase().includes('INVIT'));
            let inviter = inviterKey ? n[inviterKey] : n.Invited_By;

            let ipKey = Object.keys(n).find(k => k.toUpperCase().includes('IP'));
            let ip = ipKey ? n[ipKey] : (n.IP_Address || "UNKNOWN");

            if (code) {
                nodeStats[code] = { 
                    code: code, 
                    wallet: w, 
                    inviter: inviter, 
                    pUSD: walletToUSD[w] || 0, 
                    tUSD: 0, 
                    score: 0,
                    ip: ip
                };
            }
        });

        Object.values(nodeStats).forEach(node => {
            let l1 = Object.values(nodeStats).filter(n => n.inviter === node.code);
            let seenIPs = new Set();
            if(node.ip !== "UNKNOWN") seenIPs.add(node.ip);

            l1.forEach(child => {
                let validL1 = true;
                if(child.ip !== "UNKNOWN") {
                    if(seenIPs.has(child.ip)) validL1 = false;
                    else seenIPs.add(child.ip);
                }
                
                if(child.pUSD > 0) {
                    node.tUSD += child.pUSD;
                    if(validL1) node.score += 1;
                }

                let l2 = Object.values(nodeStats).filter(n => n.inviter === child.code);
                l2.forEach(gchild => {
                    let validL2 = true;
                    if(gchild.ip !== "UNKNOWN") {
                        if(seenIPs.has(gchild.ip)) validL2 = false;
                        else seenIPs.add(gchild.ip);
                    }
                    if(gchild.pUSD > 0) {
                        node.tUSD += gchild.pUSD; 
                        if(validL2 && (child.pUSD > 0 || validL1)) node.score += 0.5;
                    }
                });
            });
        });

        let myData = nodeStats[myCode] || { pUSD: 0, tUSD: 0, score: 0 };
        if(typeof updateTgeTier === 'function') updateTgeTier(myData.score, myData.pUSD, myData.tUSD);
        
        localStorage.setItem('ml1_recruits', myData.score);
        localStorage.setItem('ml1_personal_usd', myData.pUSD);
        localStorage.setItem('ml1_team_usd', myData.tUSD);
        document.getElementById('syncing-indicator').style.display = 'none';

        // --- 排行榜渲染邏輯 (Top 10 + 個人排名兜底) ---
        let activeNodes = Object.values(nodeStats).filter(n => (n.pUSD + n.tUSD) > 0 || n.score > 0);
        activeNodes.sort((a,b) => (b.pUSD + b.tUSD) - (a.pUSD + a.tUSD));

        let lbHtml = '';
        let myRank = -1;
        
        // 尋找自己的真實排名 (如果是 GUEST_MODE，這裡會找不到，myRank 保持 -1)
        let myActiveNode = activeNodes.find((n, idx) => {
            if(n.code === myCode) {
                myRank = idx + 1;
                return true;
            }
            return false;
        });

        // 渲染 Top 10
        activeNodes.slice(0, 10).forEach((n, idx) => {
            let currentRank = idx + 1;
            let totalVol = n.pUSD + n.tUSD;
            let maskCode = n.code.length > 5 ? n.code.substring(0, n.code.length - 2) + "**" : n.code;
            
            let isMe = (n.code === myCode);
            let rowStyle = isMe ? 'background: rgba(0,255,65,0.1); border-left: 3px solid var(--tech-green);' : '';
            let meTag = isMe ? ' <span style="color:var(--tech-green); font-size:9px; font-weight:bold;">[YOU]</span>' : '';
            
            lbHtml += `<tr style="${rowStyle}">
                <td>#${currentRank}</td>
                <td>${maskCode}${meTag}</td>
                <td>${n.score}</td>
                <td>$${totalVol.toLocaleString(undefined, {minimumFractionDigits:2, maximumFractionDigits:2})}</td>
            </tr>`;
        });

        // 若自己的排名超過第 10 名，在最後一行補上自己的數據 (訪客不顯示)
        if (myRank > 10 && myActiveNode) {
            let totalVol = myActiveNode.pUSD + myActiveNode.tUSD;
            let maskCode = myActiveNode.code.length > 5 ? myActiveNode.code.substring(0, myActiveNode.code.length - 2) + "**" : myActiveNode.code;
            
            lbHtml += `<tr><td colspan="4" style="text-align:center; color:#555; padding: 4px; letter-spacing: 2px;">• • •</td></tr>`;
            lbHtml += `<tr style="background: rgba(0,255,65,0.1); border-left: 3px solid var(--tech-green);">
                <td style="color:var(--tech-green); font-weight:bold;">#${myRank}</td>
                <td>${maskCode} <span style="color:var(--tech-green); font-size:9px; font-weight:bold;">[YOU]</span></td>
                <td>${myActiveNode.score}</td>
                <td>$${totalVol.toLocaleString(undefined, {minimumFractionDigits:2, maximumFractionDigits:2})}</td>
            </tr>`;
        }
        
        const lbBody = document.getElementById('lb-body');
        if(lbBody) {
            if(!lbHtml) {
                lbHtml = `<tr><td colspan="4" style="text-align:center;">
                    <span lang-content="en">NO DATA YET</span>
                    <span lang-content="zh">目前尚無節點數據</span>
                </td></tr>`;
            }
            lbBody.innerHTML = lbHtml;
            if(typeof setLanguage === 'function') setLanguage(document.body.className.replace('lang-', ''));
        }

    } catch (error) {
        console.error("Verification failed", error);
        document.getElementById('syncing-indicator').style.display = 'none';
        let r = parseFloat(localStorage.getItem('ml1_recruits') || 0);
        let m = parseFloat(localStorage.getItem('ml1_personal_usd') || 0);
        let t = parseFloat(localStorage.getItem('ml1_team_usd') || 0);
        if(typeof updateTgeTier === 'function') updateTgeTier(r, m, t); 
    }
}

// --- 4. 抓取全網即時進度 (Fetch Live Funding Progress) ---
async function fetchLiveProgress() {
    try {
        // 確保指向同一個數據源：工作表1
        const response = await fetch('https://api.steinhq.com/v1/storages/69ff888492b1163e97ef10df/工作表1');
        const data = await response.json();
        
        let totalUSD = 0;
        let eligibleWallets = new Set(); // 🌟 補回：用來計算有幾多個獨立節點

        if (Array.isArray(data)) {
            data.forEach(item => {
                let usdValue = 0;
                let status = '';
                let wallet = ''; // 🌟 補回：準備抓取錢包地址

                // 100% 同步首頁的嚴格審批邏輯
                for (let key in item) {
                    const upperKey = key.toUpperCase();
                    
                    // 只抓取 USD_VALUATION
                    if (upperKey.includes('USD_VALUATION')) {
                        let val = parseFloat(item[key]);
                        if (!isNaN(val)) usdValue = val;
                    }
                    
                    // 🌟 補回：抓取錢包地址 (用來計人數)
                    if (upperKey.includes('ADDRESS') || upperKey.includes('WALLET')) {
                        wallet = item[key];
                    }

                    // 抓取狀態 VALIDATION_STATUS
                    if (upperKey.includes('STATUS')) {
                        status = (item[key] || '').toUpperCase();
                    }
                }
                
                // 🛡️ 核心防護：必須有數值且狀態為 APPROVED
                if (usdValue > 0 && status.includes('APPROVED')) {
                    totalUSD += usdValue;
                    if (wallet) eligibleWallets.add(wallet.trim().toLowerCase()); // 🌟 將符合資格的銀包加入名單
                }
            });
        }

        const GOAL = 1000000;
        let percent = Math.min((totalUSD / GOAL) * 100, 100).toFixed(2);
        
        // 更新 Portal 上的 UI 元素
        const syncPercent = document.getElementById('sync-percent');
        const syncBar = document.getElementById('sync-bar');
        const syncText = document.getElementById('sync-progress-text');
        
        // 🌟 補回：抓取網頁上顯示節點數量的元素
        const syncNodes = document.getElementById('sync-nodes');
        const syncNodesZh = document.getElementById('sync-nodes-zh');
        
        if (syncPercent) syncPercent.innerText = percent + '%';
        if (syncBar) syncBar.style.width = percent + '%';
        if (syncText) syncText.innerText = `SYNCED: $${totalUSD.toLocaleString()} / $${GOAL.toLocaleString()}`;
        
        // 🌟 補回：將計算好的人數寫入網頁
        if (syncNodes) syncNodes.innerText = eligibleWallets.size;
        if (syncNodesZh) syncNodesZh.innerText = eligibleWallets.size;

    } catch (error) {
        console.error("Portal progress fetch failed:", error);
        const syncText = document.getElementById('sync-progress-text');
        if (syncText) syncText.innerText = "SYNC FAILED. RETRYING...";
    }
}

// --- 5. 註冊新節點至星際帳本 (Commit Node to Mars) ---
function commitToMars() {
    const wallet = document.getElementById('node-wallet').value.trim();
    const inviter = document.getElementById('inviter-code').value.trim();
    const btn = document.getElementById('commit-btn');
    
    if (wallet.toUpperCase() === 'ARCHITECT') {
        alert("🚀 FOUNDER OVERRIDE ACTIVATED.");
        localStorage.setItem('ml1_fission_code', 'ML1-CORE-001');
        localStorage.setItem('ml1_recruits', '100'); 
        localStorage.setItem('ml1_personal_usd', '100000'); 
        localStorage.setItem('ml1_team_usd', '0'); 
        checkFissionStatus();
        return;
    }

    if(typeof isValidWeb3Wallet === 'function' && !isValidWeb3Wallet(wallet)) { 
        alert("❌ INVALID WALLET ADDRESS."); 
        return; 
    }
    
    btn.innerText = "VERIFYING..."; btn.disabled = true;
    const myFissionCode = 'ML1-' + Math.random().toString(36).substring(2, 6).toUpperCase();

    fetch("https://api.steinhq.com/v1/storages/69ff888492b1163e97ef10df/PortalNodes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify([{ "Wallet_Address": wallet, "Invited_By": inviter || "NONE", "My_Fission_Code": myFissionCode, "IP_Address": globalClientIP, "Timestamp": new Date().toLocaleString() }])
    }).then(res => {
        if(res.ok) {
            alert("✅ Node Secured! You are now an active Genesis Base Node.");
            localStorage.setItem('ml1_fission_code', myFissionCode);
            localStorage.setItem('ml1_recruits', '0');
            localStorage.setItem('ml1_personal_usd', '0');
            localStorage.setItem('ml1_team_usd', '0');
            checkFissionStatus();
        } else { btn.disabled = false; }
    });
}
