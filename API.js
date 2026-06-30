JavaScript
async function updateProgress() {
    try {
        const syncText = document.getElementById('sync-progress-text');
        if (syncText) syncText.innerText = "SYNCING WITH SMART CONTRACT...";

        // 1. 建立 Solana 主網連線與 Anchor Provider (使用免登入的 Dummy 錢包)
        const connection = new solanaWeb3.Connection("https://api.mainnet-beta.solana.com");
        const dummyWallet = { publicKey: solanaWeb3.PublicKey.default, signTransaction: () => Promise.resolve(), signAllTransactions: () => Promise.resolve() };
        const provider = new anchor.AnchorProvider(connection, dummyWallet, { preflightCommitment: "confirmed" });

        // 2. 讀取你啱啱擺入去嘅合約 IDL 檔案
        const idlRes = await fetch('./ml1_tge_engine.json');
        const idl = await idlRes.json();

        // 3. 連接 TGE 智能合約
        const TGE_PROGRAM_ID = new solanaWeb3.PublicKey("3J6BrNLsohG2UBbh53ZVs2pDDJ7YSpYq9SE5D5a5kovC");
        const program = new anchor.Program(idl, TGE_PROGRAM_ID, provider);

        // 4. 獲取 Global State PDA 並讀取鏈上數據
        const [globalStatePda] = solanaWeb3.PublicKey.findProgramAddressSync([new TextEncoder().encode("global_state")], TGE_PROGRAM_ID);
        const state = await program.account.globalState.fetch(globalStatePda);
        
        // 5. 計算進度 (讀取合約內的 tierOdometer，USDC 小數點為 6 位)
        const odometer = state.tierOdometer.toNumber() / 1000000;
        const GOAL = 1000000;
        let percent = Math.min((odometer / GOAL) * 100, 100).toFixed(2);

        // 6. 更新網頁 UI
        const uiPercent = document.getElementById('sync-percent');
        const uiBar = document.getElementById('sync-bar');

        if (uiPercent) uiPercent.innerText = percent + '%';
        if (uiBar) uiBar.style.width = percent + '%';
        if (syncText) syncText.innerText = `SYNCED: $${odometer.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})} / $${GOAL.toLocaleString()}`;

    } catch (error) {
        console.error("Smart Contract Sync Failed:", error);
        const syncText = document.getElementById('sync-progress-text');
        if (syncText) syncText.innerText = "SYNC FAILED. RETRYING...";
    }
}

// 確保全域可以呼叫
window.updateProgress = updateProgress;