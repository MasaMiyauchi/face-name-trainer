/**
 * ナビゲーションモジュール
 * アプリケーションの画面遷移を管理する
 */

const Navigation = (function() {
    // 現在の状態
    let currentState = {
        mode: null,      // 'learning' または 'test'
        region: null,    // 'japan', 'usa', 'europe', 'asia'
        difficulty: null // 人数 (5, 10, 15)
    };
    
    // ナビゲーション履歴
    const history = [];
    
    // 遷移先のマッピング
    const navigationMap = {
        // モード選択からの遷移
        'mode-selection': {
            next: 'region-selection',
            back: null // 最初の画面なので戻る先はない
        },
        // 地域選択からの遷移
        'region-selection': {
            next: 'difficulty-selection',
            back: 'mode-selection'
        },
        // 難易度選択からの遷移
        'difficulty-selection': {
            next: {
                'learning': 'learning-mode',
                'test': 'test-mode'
            },
            back: 'region-selection'
        },
        // 学習モードからの遷移
        'learning-mode': {
            next: 'test-mode', // 学習完了後はテストモードへ
            back: 'mode-selection' // 中断時はモード選択へ
        },
        // テストモードからの遷移
        'test-mode': {
            next: 'results', // テスト完了後は結果表示へ
            back: 'mode-selection' // 中断時はモード選択へ
        },
        // 結果表示からの遷移
        'results': {
            retry: 'test-mode', // もう一度テストする場合
            back: 'mode-selection' // メニューに戻る場合
        },
        // 統計表示からの遷移
        'stats': {
            back: 'mode-selection'
        }
    };
    
    /**
     * 初期化関数
     * @param {Object} initialState - 初期状態
     */
    function init(initialState = {}) {
        // 初期状態を設定
        currentState = {
            ...currentState,
            ...initialState
        };
        
        // UIManagerを使用して最初の画面を表示
        window.UIManager.showSection('mode-selection');
    }
    
    /**
     * 現在の状態を取得
     * @returns {Object} - 現在の状態オブジェクト
     */
    function getCurrentState() {
        return { ...currentState };
    }
    
    /**
     * モードを設定
     * @param {string} mode - 設定するモード
     */
    function setMode(mode) {
        currentState.mode = mode;
        
        // ローカルストレージにモードを保存しないが、
        // 必要に応じてここで保存処理を追加できる
    }
    
    /**
     * 地域を設定
     * @param {string} region - 設定する地域
     */
    function setRegion(region) {
        currentState.region = region;
        
        // ローカルストレージに地域を保存
        window.Storage.saveLastRegion(region);
    }
    
    /**
     * 難易度を設定
     * @param {number} difficulty - 設定する難易度（人数）
     */
    function setDifficulty(difficulty) {
        currentState.difficulty = difficulty;
        
        // ローカルストレージに難易度を保存
        window.Storage.saveLastDifficulty(difficulty);
    }
    
    /**
     * 次の画面に進む
     * @param {string} currentScreen - 現在の画面ID
     * @returns {string} - 遷移先の画面ID
     */
    function navigateNext(currentScreen) {
        // 現在の画面の遷移情報を取得
        const navigation = navigationMap[currentScreen];
        if (!navigation || !navigation.next) {
            console.error(`Next navigation not defined for screen: ${currentScreen}`);
            return null;
        }
        
        // 遷移先を決定
        let nextScreen;
        if (typeof navigation.next === 'object') {
            // モードに応じた分岐がある場合
            nextScreen = navigation.next[currentState.mode];
            if (!nextScreen) {
                console.error(`Next navigation not defined for mode: ${currentState.mode}`);
                return null;
            }
        } else {
            // 単純な遷移先がある場合
            nextScreen = navigation.next;
        }
        
        // 履歴に現在の画面を追加
        history.push(currentScreen);
        
        // 次の画面を表示
        window.UIManager.showSection(nextScreen);
        
        return nextScreen;
    }
    
    /**
     * 前の画面に戻る
     * @param {string} currentScreen - 現在の画面ID
     * @returns {string} - 遷移先の画面ID
     */
    function navigateBack(currentScreen) {
        // 現在の画面の遷移情報を取得
        const navigation = navigationMap[currentScreen];
        if (!navigation || !navigation.back) {
            console.error(`Back navigation not defined for screen: ${currentScreen}`);
            return null;
        }
        
        const backScreen = navigation.back;
        
        // 履歴から最後の項目を削除
        if (history.length > 0) {
            history.pop();
        }
        
        // 前の画面を表示
        window.UIManager.showSection(backScreen);
        
        return backScreen;
    }
    
    /**
     * 特定の画面に直接移動
     * @param {string} screenId - 移動先の画面ID
     */
    function navigateTo(screenId) {
        // 指定された画面が存在するか確認
        if (!navigationMap[screenId] && screenId !== 'mode-selection') {
            console.error(`Invalid screen ID: ${screenId}`);
            return;
        }
        
        // 履歴に現在の画面を追加（必要に応じて）
        // ここでは単純に移動するだけなので履歴は更新しない
        
        // 指定された画面を表示
        window.UIManager.showSection(screenId);
    }
    
    /**
     * リトライ（テストをもう一度行う）
     * @returns {string} - 遷移先の画面ID
     */
    function retry() {
        // 結果画面からテスト画面に移動
        const nextScreen = navigationMap['results'].retry;
        window.UIManager.showSection(nextScreen);
        return nextScreen;
    }
    
    /**
     * メニューに戻る
     * @returns {string} - 遷移先の画面ID
     */
    function backToMenu() {
        // 履歴をクリア
        history.length = 0;
        
        // モード選択画面に移動
        const menuScreen = 'mode-selection';
        window.UIManager.showSection(menuScreen);
        return menuScreen;
    }
    
    // 公開API
    return {
        init,
        getCurrentState,
        setMode,
        setRegion,
        setDifficulty,
        navigateNext,
        navigateBack,
        navigateTo,
        retry,
        backToMenu
    };
})();

// グローバルオブジェクトとしてエクスポート
window.Navigation = Navigation;