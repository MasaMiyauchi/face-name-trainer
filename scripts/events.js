/**
 * イベント管理モジュール
 * アプリケーション全体のイベントリスナーを管理
 */

const EventManager = (function() {
    /**
     * 初期化関数
     * アプリケーションのイベントリスナーを設定する
     */
    function init() {
        // UIマネージャーのイベントリスナーを設定
        setupUIEventListeners();
        
        // キーボードイベントリスナーを設定
        setupKeyboardListeners();
        
        // ウィンドウイベントリスナーを設定
        setupWindowListeners();
    }
    
    /**
     * UIイベントリスナーを設定
     */
    function setupUIEventListeners() {
        // UIManagerにイベントハンドラを設定
        window.UIManager.setupEventListeners({
            // モード選択時のハンドラ
            onModeSelect: function(mode) {
                console.log(`Mode selected: ${mode}`);
                
                // 選択されたモードを保存
                window.Navigation.setMode(mode);
                
                // 次の画面（地域選択）に進む
                window.Navigation.navigateNext('mode-selection');
            },
            
            // 地域選択時のハンドラ
            onRegionSelect: function(region) {
                console.log(`Region selected: ${region}`);
                
                // 選択された地域を保存
                window.Navigation.setRegion(region);
                
                // 次の画面（難易度選択）に進む
                window.Navigation.navigateNext('region-selection');
            },
            
            // 難易度選択時のハンドラ
            onDifficultySelect: function(count) {
                console.log(`Difficulty selected: ${count}`);
                
                // 選択された難易度を保存
                window.Navigation.setDifficulty(count);
                window.Difficulty.setLevelByCount(count);
                
                // 現在のモードを取得
                const currentState = window.Navigation.getCurrentState();
                
                // モードに応じて次の画面に進む
                if (currentState.mode === 'learning') {
                    // 学習モードを開始
                    window.LearningMode.start(
                        currentState.region,
                        currentState.difficulty,
                        window.Difficulty.getTimePerFace()
                    );
                } else if (currentState.mode === 'test') {
                    // テストモードを開始
                    window.TestMode.start(
                        currentState.region,
                        currentState.difficulty
                    );
                }
            },
            
            // 「戻る」ボタンのハンドラ
            onBack: function(fromScreen) {
                console.log(`Back from: ${fromScreen}`);
                
                switch (fromScreen) {
                    case 'region':
                        window.Navigation.navigateBack('region-selection');
                        break;
                        
                    case 'difficulty':
                        window.Navigation.navigateBack('difficulty-selection');
                        break;
                        
                    case 'learning':
                        // 学習モードの中断確認
                        window.Modal.confirm('学習を中断しますか？', '確認')
                            .then(confirmed => {
                                if (confirmed) {
                                    // 学習モードを停止
                                    window.LearningMode.stop();
                                    // メニューに戻る
                                    window.Navigation.backToMenu();
                                }
                            });
                        break;
                        
                    case 'test':
                        // テストモードの中断確認
                        window.Modal.confirm('テストを中断しますか？', '確認')
                            .then(confirmed => {
                                if (confirmed) {
                                    // テストモードを停止
                                    window.TestMode.stop();
                                    // メニューに戻る
                                    window.Navigation.backToMenu();
                                }
                            });
                        break;
                        
                    case 'stats':
                        window.Navigation.navigateBack('stats');
                        break;
                        
                    default:
                        // デフォルトはメニューに戻る
                        window.Navigation.backToMenu();
                }
            },
            
            // 学習モードで「次へ」ボタンのハンドラ
            onNextFace: function() {
                window.LearningMode.nextFace();
            },
            
            // テスト結果画面で「もう一度挑戦」ボタンのハンドラ
            onRetry: function() {
                window.Navigation.retry();
                window.TestMode.retry();
            },
            
            // テスト結果画面で「メニューに戻る」ボタンのハンドラ
            onBackToMenu: function() {
                window.Navigation.backToMenu();
            },
            
            // 統計ボタンのハンドラ
            onStatsClick: function() {
                // 統計データを取得して表示
                const stats = window.Storage.getStats();
                window.UIManager.showStats(stats);
                
                // 統計画面に移動
                window.Navigation.navigateTo('stats');
            }
        });
    }
    
    /**
     * キーボードイベントリスナーを設定
     */
    function setupKeyboardListeners() {
        document.addEventListener('keydown', function(event) {
            // ESCキーでモーダルを閉じる
            if (event.key === 'Escape') {
                window.Modal.hide();
            }
            
            // 現在のナビゲーション状態を取得
            const currentState = window.Navigation.getCurrentState();
            
            // 学習モード中のキーボードショートカット
            if (currentState.mode === 'learning') {
                // スペースキーで次の顔に進む
                if (event.key === ' ' || event.key === 'ArrowRight') {
                    window.LearningMode.nextFace();
                }
            }
            
            // テストモード中のキーボードショートカット
            if (currentState.mode === 'test') {
                // 数字キー（1-4）で選択肢を選択
                const num = parseInt(event.key);
                if (num >= 1 && num <= 4) {
                    // 該当する選択肢の要素を取得
                    const options = document.querySelectorAll('.name-option');
                    if (options.length >= num) {
                        options[num - 1].click();
                    }
                }
            }
        });
    }
    
    /**
     * ウィンドウイベントリスナーを設定
     */
    function setupWindowListeners() {
        // ページロード完了時
        window.addEventListener('load', function() {
            console.log('Application loaded');
            
            // UIマネージャーを初期化
            window.UIManager.init();
            
            // モーダルを初期化
            window.Modal.init();
            
            // 難易度管理を初期化
            window.Difficulty.init();
            
            // 統計管理を初期化
            window.Stats.init();
            
            // ナビゲーションを初期化
            window.Navigation.init();
            
            // 前回のセッションをチェック
            checkPreviousSession();
        });
        
        // ブラウザを閉じる前 / ページ移動前の処理
        window.addEventListener('beforeunload', function(event) {
            // 学習モードが進行中なら警告
            const currentState = window.Navigation.getCurrentState();
            if (currentState.mode === 'learning') {
                // 標準的なブラウザの確認ダイアログを表示
                event.preventDefault();
                event.returnValue = '学習が進行中です。本当にページを離れますか？';
                return event.returnValue;
            }
        });
    }
    
    /**
     * 前回のセッションを確認
     */
    async function checkPreviousSession() {
        try {
            // 学習セッションの復元を試みる
            const restored = await window.LearningMode.restoreSession();
            
            // 復元失敗時は何もしない（初期画面のまま）
            if (!restored) {
                // 必要に応じて前回の使用地域や難易度を復元
                const lastRegion = window.Storage.getLastRegion();
                const lastDifficulty = window.Storage.getLastDifficulty();
                
                if (lastRegion) {
                    window.Navigation.setRegion(lastRegion);
                }
                
                if (lastDifficulty) {
                    window.Navigation.setDifficulty(lastDifficulty);
                    window.Difficulty.setLevelByCount(lastDifficulty);
                }
            }
        } catch (error) {
            console.error('Error checking previous session:', error);
            // エラー時は初期画面を表示
        }
    }
    
    // 公開API
    return {
        init
    };
})();

// グローバルオブジェクトとしてエクスポート
window.EventManager = EventManager;