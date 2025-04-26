/**
 * イベント管理モジュール
 * アプリケーション全体のイベントリスナーを管理
 */

const EventManager = (function() {
    /**
     * 初期化関数
     * 必要なイベントリスナーをUIに設定
     */
    function init() {
        // UIManagerを初期化
        window.UIManager.init();
        
        // イベントリスナーを設定
        setupEventListeners();
        
        // 保存されたセッションがあれば復元を試みる
        tryRestoreSession();
    }
    
    /**
     * イベントリスナーを設定
     */
    function setupEventListeners() {
        // UIManagerにイベントハンドラを登録
        window.UIManager.setupEventListeners({
            // モード選択時の処理
            onModeSelect: handleModeSelect,
            
            // 地域選択時の処理
            onRegionSelect: handleRegionSelect,
            
            // 難易度選択時の処理
            onDifficultySelect: handleDifficultySelect,
            
            // 戻るボタンクリック時の処理
            onBack: handleBack,
            
            // 統計ボタンクリック時の処理
            onStatsClick: handleStatsClick,
            
            // 学習モードで次へボタンクリック時の処理
            onNextFace: handleNextFace,
            
            // テスト結果画面でリトライボタンクリック時の処理
            onRetry: handleRetry,
            
            // テスト結果画面でメニューに戻るボタンクリック時の処理
            onBackToMenu: handleBackToMenu
        });
        
        // ウィンドウのイベントリスナー
        window.addEventListener('beforeunload', handleBeforeUnload);
        
        // キーボードイベントリスナー
        document.addEventListener('keydown', handleKeyDown);
    }
    
    /**
     * 保存されたセッションの復元を試みる
     */
    async function tryRestoreSession() {
        // 学習モードのセッションを復元
        const restored = await window.LearningMode.restoreSession();
        
        // 復元できなかった場合はモード選択画面を表示
        if (!restored) {
            window.UIManager.showSection('mode-selection');
        }
    }
    
    /**
     * モード選択時の処理
     * @param {string} mode - 選択されたモード
     */
    function handleModeSelect(mode) {
        // 選択されたモードを保存
        window.Navigation.setMode(mode);
        
        // 地域選択画面へ遷移
        window.Navigation.navigateTo('region-selection');
    }