/**
 * イベント管理モジュール
 * アプリケーション全体のイベントリスナーを管理
 */

const EventManager = (function() {
    /**
     * 初期化関数
     * 必要なイベントリスナーを設定
     */
    function init() {
        // UIマネージャーにイベントハンドラーを設定
        setupUIEventHandlers();
        
        // キーボードイベントを設定
        setupKeyboardEvents();
        
        // ウィンドウイベントを設定
        setupWindowEvents();
    }
    
    /**
     * UIイベントハンドラーを設定
     */
    function setupUIEventHandlers() {
        window.UIManager.setupEventListeners({
            // モード選択時のハンドラー
            onModeSelect: function(mode) {
                console.log(`Mode selected: ${mode}`);
                window.Navigation.setMode(mode);
                window.Navigation.navigateNext('mode-selection');
            },
            
            // 地域選択時のハンドラー
            onRegionSelect: function(region) {
                console.log(`Region selected: ${region}`);
                window.Navigation.setRegion(region);
                window.Navigation.navigateNext('region-selection');
            },
            
            // 難易度選択時のハンドラー
            onDifficultySelect: function(count) {
                console.log(`Difficulty selected: ${count}`);
                window.Navigation.setDifficulty(count);
                
                // 難易度レベルを設定
                window.Difficulty.setLevelByCount(count);
                
                // 現在のモードに応じて学習モードまたはテストモードに遷移
                const currentState = window.Navigation.getCurrentState();
                if (currentState.mode === 'learning') {
                    startLearningMode(currentState.region, count);
                } else if (currentState.mode === 'test') {
                    startTestMode(currentState.region, count);
                }
            },
            
            // 戻るボタンのハンドラー
            onBack: function(fromScreen) {
                console.log(`Back from: ${fromScreen}`);
                
                // スクリーンIDを変換
                const screenMapping = {
                    'region': 'region-selection',
                    'difficulty': 'difficulty-selection',
                    'learning': 'learning-mode',
                    'test': 'test-mode',
                    'stats': 'stats'
                };
                
                const screenId = screenMapping[fromScreen] || fromScreen;
                
                // 学習/テストモードからの戻りは確認
                if (fromScreen === 'learning' || fromScreen === 'test') {
                    window.Modal.confirm('本当に中断しますか？', '確認')
                        .then(confirmed => {
                            if (confirmed) {
                                // モードを停止
                                if (fromScreen === 'learning') {
                                    window.LearningMode.stop();
                                } else if (fromScreen === 'test') {
                                    window.TestMode.stop();
                                }
                                
                                // メニューに戻る
                                window.Navigation.navigateBack(screenId);
                            }
                        });
                } else {
                    // 通常の戻り
                    window.Navigation.navigateBack(screenId);
                }
            },
            
            // 学習モードで次の顔に進むハンドラー
            onNextFace: function() {
                console.log('Next face');
                window.LearningMode.nextFace();
            },
            
            // テスト後のリトライハンドラー
            onRetry: function() {
                console.log('Retry test');
                window.TestMode.retry();
            },
            
            // メニューに戻るハンドラー
            onBackToMenu: function() {
                console.log('Back to menu');
                window.Navigation.backToMenu();
            },
            
            // 統計表示ハンドラー
            onStatsClick: function() {
                console.log('Show stats');
                showStats();
            }
        });
    }
    
    /**
     * キーボードイベントを設定
     */
    function setupKeyboardEvents() {
        document.addEventListener('keydown', function(event) {
            // ESCキーでモーダルを閉じる
            if (event.key === 'Escape') {
                window.Modal.hide();
            }
            
            // スペースキーで次の顔に進む（学習モード時）
            if (event.key === ' ' || event.key === 'Spacebar') {
                const currentState = window.Navigation.getCurrentState();
                if (currentState && currentState.mode === 'learning') {
                    window.LearningMode.nextFace();
                    event.preventDefault(); // スクロールを防止
                }
            }
            
            // 数字キー（1-4）で選択肢を選択（テストモード時）
            if (['1', '2', '3', '4'].includes(event.key)) {
                const currentState = window.Navigation.getCurrentState();
                if (currentState && currentState.mode === 'test') {
                    const optionIndex = parseInt(event.key) - 1;
                    // TODO: 選択肢選択処理の実装
                    event.preventDefault();
                }
            }
        });
    }
    
    /**
     * ウィンドウイベントを設定
     */
    function setupWindowEvents() {
        // ウィンドウロード時の処理
        window.addEventListener('load', function() {
            console.log('Window loaded');
            
            // 前回の学習セッションがあれば復元するか確認
            window.LearningMode.restoreSession()
                .then(restored => {
                    if (!restored) {
                        // 復元しなかった場合は最初の画面を表示
                        window.Navigation.navigateTo('mode-selection');
                    }
                });
        });
        
        // ページ離脱時の処理
        window.addEventListener('beforeunload', function(event) {
            const currentState = window.Navigation.getCurrentState();
            
            // 学習/テストモード中なら警告
            if (currentState && (currentState.mode === 'learning' || currentState.mode === 'test')) {
                event.preventDefault();
                event.returnValue = '進行中のセッションがあります。本当に終了しますか？';
                return event.returnValue;
            }
        });
    }
