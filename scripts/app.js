/**
 * FaceNameTrainer - 顔と名前の記憶トレーニングアプリ
 * メインアプリケーション初期化
 */

// アプリケーションのメインモジュール
const App = (function() {
    // アプリケーションの状態
    let appState = {
        initialized: false,
        version: '1.0.0',
        supportedRegions: ['japan', 'usa', 'europe', 'asia']
    };
    
    /**
     * アプリケーションの初期化
     */
    function init() {
        if (appState.initialized) {
            console.warn('Application already initialized');
            return;
        }
        
        console.log(`Initializing FaceNameTrainer v${appState.version}`);
        
        try {
            // 前提条件のチェック
            checkPrerequisites();
            
            // 各モジュールの初期化
            initializeModules();
            
            // イベントマネージャーの初期化（これにより他のイベントリスナーが設定される）
            window.EventManager.init();
            
            // 前回のセッションをチェック
            window.EventManager.checkPreviousSession();
            
            // 初期化完了
            appState.initialized = true;
            console.log('Application initialization complete');
            
        } catch (error) {
            console.error('Error initializing application:', error);
            
            // エラーモーダルを表示（Modal自体は初期化済みと仮定）
            if (window.Modal) {
                window.Modal.error(
                    'アプリケーションの初期化中にエラーが発生しました。ページを再読み込みしてください。',
                    '初期化エラー'
                );
            } else {
                // モーダルが使えない場合はアラート
                alert('アプリケーションの初期化中にエラーが発生しました。ページを再読み込みしてください。');
            }
        }
    }
    
    /**
     * 前提条件のチェック
     * @throws {Error} 前提条件を満たさない場合
     */
    function checkPrerequisites() {
        // ブラウザの互換性チェック
        if (!window.localStorage) {
            throw new Error('このブラウザはローカルストレージをサポートしていません。新しいブラウザをお試しください。');
        }
        
        if (!window.Promise || !window.fetch) {
            throw new Error('このブラウザは必要なAPIをサポートしていません。新しいブラウザをお試しください。');
        }
        
        // 必要なモジュールの存在チェック
        const requiredModules = [
            'UIManager', 'Navigation', 'Modal', 
            'LearningMode', 'TestMode', 'Stats', 
            'Difficulty', 'Storage', 'Helpers',
            'FaceAPI', 'NameAPI', 'EventManager'
        ];
        
        console.log('Checking required modules...');
        
        // 使用可能なモジュールのログ出力
        const availableModules = Object.keys(window).filter(key => 
            requiredModules.includes(key) && window[key] !== undefined
        );
        console.log('Available modules:', availableModules);
        
        const missingModules = requiredModules.filter(module => !window[module]);
        if (missingModules.length > 0) {
            console.error('Missing modules:', missingModules);
            throw new Error(`必要なモジュールが見つかりません: ${missingModules.join(', ')}`);
        }
    }
    
    /**
     * 各モジュールの初期化
     */
    function initializeModules() {
        console.log('Initializing modules...');
        
        // UIマネージャーの初期化
        if (typeof window.UIManager.init === 'function') {
            console.log('Initializing UIManager');
            window.UIManager.init();
        }
        
        // モーダルの初期化
        if (typeof window.Modal.init === 'function') {
            console.log('Initializing Modal');
            window.Modal.init();
        }
        
        // 難易度管理の初期化
        if (typeof window.Difficulty.init === 'function') {
            console.log('Initializing Difficulty');
            window.Difficulty.init();
        }
        
        // 統計管理の初期化
        if (typeof window.Stats.init === 'function') {
            console.log('Initializing Stats');
            window.Stats.init();
        }
        
        // ナビゲーションの初期化
        if (typeof window.Navigation.init === 'function') {
            console.log('Initializing Navigation');
            window.Navigation.init();
        }
        
        // FaceAPIの事前ロード（オプション）
        if (typeof window.FaceAPI.preloadFaces === 'function') {
            console.log('Preloading some face data');
            // 各地域からいくつかの顔を事前にロード
            appState.supportedRegions.forEach(region => {
                window.FaceAPI.preloadFaces(2, region)
                    .catch(error => console.warn(`Failed to preload faces for ${region}:`, error));
            });
        }
    }
    
    /**
     * サポートされている地域のリストを取得
     * @returns {Array<string>} - サポートされている地域の配列
     */
    function getSupportedRegions() {
        return [...appState.supportedRegions];
    }
    
    /**
     * アプリケーションのバージョンを取得
     * @returns {string} - バージョン文字列
     */
    function getVersion() {
        return appState.version;
    }
    
    /**
     * アプリケーションが初期化されているかどうかを確認
     * @returns {boolean} - 初期化済みかどうか
     */
    function isInitialized() {
        return appState.initialized;
    }
    
    // 公開API
    return {
        init,
        getSupportedRegions,
        getVersion,
        isInitialized
    };
})();

// DOMContentLoaded時にアプリケーションを初期化
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM Content Loaded');
    // アプリケーションの初期化
    App.init();
});