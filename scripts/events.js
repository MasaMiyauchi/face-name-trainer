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
        console.log('EventManager initializing...');
        
        // FaceGeneratorの初期化（非同期処理）
        initFaceGenerator();
        
        // UIマネージャーのイベントリスナーを設定
        setupUIEventListeners();
        
        // キーボードイベントリスナーを設定
        setupKeyboardListeners();
        
        // ウィンドウイベントリスナーを設定
        setupWindowListeners();
        
        // 地域選択イベントリスナーの設定
        setupRegionSelectionListeners();
        
        // 難易度選択イベントリスナーの設定
        setupDifficultySelectionListeners();
        
        // 学習関連のイベントリスナーを設定
        setupLearningEventListeners();
        
        // テスト関連のイベントリスナーを設定
        setupTestEventListeners();
        
        console.log('EventManager initialized');
    }
    
    /**
     * FaceGeneratorの初期化
     * @returns {Promise<void>}
     */
    async function initFaceGenerator() {
        if (window.FaceGenerator) {
            try {
                console.log('Initializing FaceGenerator...');
                await window.FaceGenerator.init();
                console.log('FaceGenerator initialized successfully');
            } catch (error) {
                console.error('Error initializing FaceGenerator:', error);
                // 初期化に失敗しても続行
            }
        } else {
            console.warn('FaceGenerator module not found, skipping initialization');
        }
    }
    
    /**
     * 地域選択イベントリスナーを設定
     */
    function setupRegionSelectionListeners() {
        // 地域選択ボタンのイベントリスナーを設定
        const regionButtons = document.querySelectorAll('.region-btn');
        regionButtons.forEach(button => {
            button.addEventListener('click', function() {
                const region = this.dataset.region;
                console.log(`Region selected: ${region}`);
                
                // 他のボタンから選択クラスを削除
                regionButtons.forEach(btn => btn.classList.remove('selected'));
                
                // 選択されたボタンに選択クラスを追加
                this.classList.add('selected');
                
                // 選択された地域を保存
                window.Navigation.setRegion(region);
                
                // 開始ボタンの有効化チェック
                checkStartButtonState();
            });
        });
    }
    
    /**
     * 難易度選択イベントリスナーを設定
     */
    function setupDifficultySelectionListeners() {
        // 難易度選択ボタンのイベントリスナーを設定
        const difficultyButtons = document.querySelectorAll('.difficulty-btn');
        difficultyButtons.forEach(button => {
            button.addEventListener('click', function() {
                const difficulty = this.dataset.difficulty;
                console.log(`Difficulty selected: ${difficulty}`);
                
                // 他のボタンから選択クラスを削除
                difficultyButtons.forEach(btn => btn.classList.remove('selected'));
                
                // 選択されたボタンに選択クラスを追加
                this.classList.add('selected');
                
                // 難易度に対応する人数の取得
                let count;
                switch (difficulty) {
                    case 'easy':
                        count = 5;
                        break;
                    case 'medium':
                        count = 10;
                        break;
                    case 'hard':
                        count = 15;
                        break;
                    default:
                        count = 5;
                }
                
                // 選択された難易度を保存
                window.Navigation.setDifficulty(count);
                window.Difficulty.setLevelByCount(count);
                
                // 開始ボタンの有効化チェック
                checkStartButtonState();
            });
        });
    }
    
    /**
     * 開始ボタンの状態をチェック
     */
    function checkStartButtonState() {
        const startButton = document.getElementById('start-learning-btn');
        if (!startButton) return;
        
        const regionSelected = document.querySelector('.region-btn.selected');
        const difficultySelected = document.querySelector('.difficulty-btn.selected');
        
        // 地域と難易度が選択されていれば開始ボタンを有効化
        if (regionSelected && difficultySelected) {
            startButton.disabled = false;
        } else {
            startButton.disabled = true;
        }
    }
    
    /**
     * 学習関連のイベントリスナーを設定
     */
    function setupLearningEventListeners() {
        // 学習開始ボタンのイベントリスナー
        const startLearningBtn = document.getElementById('start-learning-btn');
        if (startLearningBtn) {
            startLearningBtn.addEventListener('click', async function() {
                console.log('Start learning button clicked');
                
                // 現在の選択状態を取得
                const regionBtn = document.querySelector('.region-btn.selected');
                const difficultyBtn = document.querySelector('.difficulty-btn.selected');
                
                if (!regionBtn || !difficultyBtn) {
                    console.error('Region or difficulty not selected');
                    return;
                }
                
                const region = regionBtn.dataset.region;
                const difficulty = difficultyBtn.dataset.difficulty;
                const count = difficulty === 'easy' ? 5 : 
                              difficulty === 'medium' ? 10 : 15;
                
                // ローディングモーダルを表示
                window.Modal.show({
                    title: '準備中',
                    message: '学習用データを生成しています...',
                    buttons: []
                });
                
                try {
                    // FaceGeneratorの使用（存在する場合）
                    if (window.FaceGenerator) {
                        // 難易度に応じた数の顔を事前生成
                        await window.FaceGenerator.generateFacesForTest(region, count);
                    }
                    
                    // ナビゲーション状態を設定
                    window.Navigation.setMode('learning');
                    window.Navigation.setRegion(region);
                    window.Navigation.setDifficulty(count);
                    
                    // 学習モードを開始
                    await window.LearningMode.start(
                        region,
                        count,
                        window.Difficulty.getTimePerFace()
                    );
                    
                    // モーダルを閉じる
                    window.Modal.hide();
                } catch (error) {
                    console.error('Error starting learning mode:', error);
                    
                    // エラーが発生した場合はエラーモーダルを表示
                    window.Modal.error('学習モードの開始中にエラーが発生しました。');
                }
            });
        }
        
        // 学習モードでの次の顔へボタン
        const nextFaceBtn = document.getElementById('next-face-btn');
        if (nextFaceBtn) {
            nextFaceBtn.addEventListener('click', function() {
                window.LearningMode.nextFace();
            });
        }
        
        // 学習モードでの前の顔へボタン
        const previousFaceBtn = document.getElementById('previous-face-btn');
        if (previousFaceBtn) {
            previousFaceBtn.addEventListener('click', function() {
                window.LearningMode.previousFace();
            });
        }
        
        // 学習完了ボタン
        const finishLearningBtn = document.getElementById('finish-learning-btn');
        if (finishLearningBtn) {
            finishLearningBtn.addEventListener('click', function() {
                window.LearningMode.completeSession();
            });
        }
    }
    
    /**
     * テスト関連のイベントリスナーを設定
     */
    function setupTestEventListeners() {
        // 回答提出ボタン
        const submitAnswerBtn = document.getElementById('submit-answer-btn');
        if (submitAnswerBtn) {
            submitAnswerBtn.addEventListener('click', function() {
                const answerInput = document.getElementById('name-answer');
                if (answerInput) {
                    const answer = answerInput.value.trim();
                    if (answer) {
                        window.TestMode.submitAnswer(answer);
                    }
                }
            });
        }
        
        // 入力フィールドでのEnterキー押下イベント
        const nameAnswerInput = document.getElementById('name-answer');
        if (nameAnswerInput) {
            nameAnswerInput.addEventListener('keypress', function(e) {
                if (e.key === 'Enter') {
                    const answer = this.value.trim();
                    if (answer) {
                        window.TestMode.submitAnswer(answer);
                    }
                }
            });
        }
        
        // 次の問題ボタン
        const nextTestBtn = document.getElementById('next-test-btn');
        if (nextTestBtn) {
            nextTestBtn.addEventListener('click', function() {
                window.TestMode.nextFace();
            });
        }
        
        // テスト終了ボタン
        const finishTestBtn = document.getElementById('finish-test-btn');
        if (finishTestBtn) {
            finishTestBtn.addEventListener('click', function() {
                if (window.confirm('テストを終了しますか？')) {
                    window.TestMode.completeTest();
                }
            });
        }
        
        // もう一度挑戦ボタン
        const tryAgainBtn = document.getElementById('try-again-btn');
        if (tryAgainBtn) {
            tryAgainBtn.addEventListener('click', function() {
                window.TestMode.retry();
            });
        }
        
        // ホームに戻るボタン（結果画面）
        const backToHomeBtn = document.getElementById('back-to-home-btn');
        if (backToHomeBtn) {
            backToHomeBtn.addEventListener('click', function() {
                window.Navigation.backToMenu();
            });
        }
    }
    
    /**
     * UIイベントリスナーを設定
     */
    function setupUIEventListeners() {
        console.log('Setting up UI event listeners');
        
        // 統計表示ボタン
        const viewStatsBtn = document.getElementById('view-stats-btn');
        if (viewStatsBtn) {
            viewStatsBtn.addEventListener('click', function(e) {
                e.preventDefault();
                
                // 統計データを取得し、統計画面に移動
                window.Stats.loadStats();
                window.UIManager.showSection('stats-screen');
            });
        }
        
        // 統計画面から戻るボタン
        const backFromStatsBtn = document.getElementById('back-from-stats-btn');
        if (backFromStatsBtn) {
            backFromStatsBtn.addEventListener('click', function() {
                window.UIManager.showSection('home-screen');
            });
        }
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
            
            // 現在アクティブなセクションを取得
            const activeSection = document.querySelector('.screen.active');
            if (!activeSection) return;
            
            // 学習モード中のキーボードショートカット
            if (activeSection.id === 'learning-screen') {
                // スペースキーまたは右矢印キーで次の顔に進む
                if (event.key === ' ' || event.key === 'ArrowRight') {
                    window.LearningMode.nextFace();
                    event.preventDefault();
                }
                
                // 左矢印キーで前の顔に戻る
                if (event.key === 'ArrowLeft') {
                    window.LearningMode.previousFace();
                    event.preventDefault();
                }
            }
            
            // テストモード中のキーボードショートカット
            if (activeSection.id === 'test-screen') {
                // Enterキーで回答を提出（入力欄にフォーカスがない場合）
                if (event.key === 'Enter' && document.activeElement.id !== 'name-answer') {
                    const submitBtn = document.getElementById('submit-answer-btn');
                    if (submitBtn && !submitBtn.disabled) {
                        submitBtn.click();
                    }
                }
                
                // スペースキーまたは右矢印キーで次の問題に進む
                if ((event.key === ' ' || event.key === 'ArrowRight') && document.activeElement.id !== 'name-answer') {
                    const nextBtn = document.getElementById('next-test-btn');
                    if (nextBtn && !nextBtn.disabled) {
                        nextBtn.click();
                        event.preventDefault();
                    }
                }
            }
        });
    }
    
    /**
     * ウィンドウイベントリスナーを設定
     */
    function setupWindowListeners() {
        // ブラウザを閉じる前 / ページ移動前の処理
        window.addEventListener('beforeunload', function(event) {
            // 学習モードまたはテストモードが進行中なら警告
            const activeSection = document.querySelector('.screen.active');
            if (activeSection && (activeSection.id === 'learning-screen' || activeSection.id === 'test-screen')) {
                // 標準的なブラウザの確認ダイアログを表示
                event.preventDefault();
                event.returnValue = 'セッションが進行中です。本当にページを離れますか？';
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
                    // 対応するボタンを選択状態にする
                    const regionBtn = document.querySelector(`.region-btn[data-region="${lastRegion}"]`);
                    if (regionBtn) {
                        document.querySelectorAll('.region-btn').forEach(btn => btn.classList.remove('selected'));
                        regionBtn.classList.add('selected');
                    }
                    
                    window.Navigation.setRegion(lastRegion);
                }
                
                if (lastDifficulty) {
                    // 難易度から対応するボタンのdata-difficultyを逆算
                    let difficultyValue;
                    if (lastDifficulty <= 5) {
                        difficultyValue = 'easy';
                    } else if (lastDifficulty <= 10) {
                        difficultyValue = 'medium';
                    } else {
                        difficultyValue = 'hard';
                    }
                    
                    // 対応するボタンを選択状態にする
                    const difficultyBtn = document.querySelector(`.difficulty-btn[data-difficulty="${difficultyValue}"]`);
                    if (difficultyBtn) {
                        document.querySelectorAll('.difficulty-btn').forEach(btn => btn.classList.remove('selected'));
                        difficultyBtn.classList.add('selected');
                    }
                    
                    window.Navigation.setDifficulty(lastDifficulty);
                    window.Difficulty.setLevelByCount(lastDifficulty);
                }
                
                // 開始ボタンの有効化チェック
                checkStartButtonState();
                
                // FaceGeneratorの初期化
                if (window.FaceGenerator) {
                    window.FaceGenerator.init().catch(err => {
                        console.warn('Failed to initialize FaceGenerator:', err);
                    });
                }
            }
        } catch (error) {
            console.error('Error checking previous session:', error);
            // エラー時は初期画面を表示
        }
    }
    
    // 公開API
    return {
        init,
        checkPreviousSession
    };
})();

// グローバルオブジェクトとしてエクスポート
window.EventManager = EventManager;