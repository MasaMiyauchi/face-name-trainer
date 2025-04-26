/**
 * UI管理モジュール
 * アプリケーションのUI表示と更新を管理
 */

const UIManager = (function() {
    // DOM要素のキャッシュ
    const elements = {};
    
    /**
     * 初期化関数
     * 必要なDOM要素を取得してキャッシュに保存
     */
    function init() {
        // セクション要素
        elements.sections = {
            homeScreen: document.getElementById('home-screen'),
            learningScreen: document.getElementById('learning-screen'),
            testScreen: document.getElementById('test-screen'),
            resultsScreen: document.getElementById('results-screen'),
            statsScreen: document.getElementById('stats-screen'),
            spacedRepetitionScreen: document.getElementById('spaced-repetition-screen')
        };
        
        // 学習モード要素
        elements.learning = {
            faceImage: document.getElementById('face-image'),
            nameDisplay: document.getElementById('face-name'),
            timer: document.getElementById('timer'),
            nextButton: document.getElementById('next-face-btn'),
            finishButton: document.getElementById('finish-learning-btn')
        };
        
        // テストモード要素
        elements.test = {
            faceImage: document.getElementById('test-face-image'),
            nameAnswer: document.getElementById('name-answer'),
            submitButton: document.getElementById('submit-answer-btn'),
            feedbackContainer: document.getElementById('answer-feedback'),
            nextButton: document.getElementById('next-test-btn'),
            finishButton: document.getElementById('finish-test-btn')
        };
        
        // 結果表示要素
        elements.results = {
            scorePercentage: document.getElementById('score-percentage'),
            correctAnswers: document.getElementById('correct-answers'),
            totalQuestions: document.getElementById('total-questions'),
            averageTime: document.getElementById('average-time'),
            detailsTable: document.getElementById('results-table-body'),
            retryButton: document.getElementById('try-again-btn'),
            menuButton: document.getElementById('back-to-home-btn')
        };
        
        // 統計表示要素
        elements.stats = {
            totalTraining: document.getElementById('total-training-count'),
            averageScore: document.getElementById('average-score'),
            bestScore: document.getElementById('best-score'),
            weakFacesList: document.getElementById('weak-faces-list'),
            backButton: document.getElementById('back-from-stats-btn')
        };
        
        // ボタン要素
        elements.buttons = {
            // 地域ボタン
            regionButtons: document.querySelectorAll('.region-btn'),
            
            // 難易度ボタン
            difficultyButtons: document.querySelectorAll('.difficulty-btn'),
            
            // その他のボタン
            startLearningBtn: document.getElementById('start-learning-btn'),
            viewStatsBtn: document.getElementById('view-stats-btn')
        };
    }
    
    /**
     * 指定したセクションをアクティブにして表示
     * @param {string} sectionId - アクティブにするセクションのID
     */
    function showSection(sectionId) {
        // すべてのセクションを非表示
        const allSections = document.querySelectorAll('.screen');
        allSections.forEach(section => {
            if (section) {
                section.classList.remove('active');
            }
        });
        
        // 指定されたセクションを表示
        const section = document.getElementById(sectionId);
        if (section) {
            section.classList.add('active');
        } else {
            console.error(`Section "${sectionId}" not found`);
        }
    }
    
    /**
     * 地域選択ボタンの選択状態を更新
     * @param {string} selectedRegion - 選択された地域
     */
    function updateRegionSelection(selectedRegion) {
        if (elements.buttons.regionButtons) {
            elements.buttons.regionButtons.forEach(button => {
                if (button.dataset.region === selectedRegion) {
                    button.classList.add('selected');
                } else {
                    button.classList.remove('selected');
                }
            });
            
            // 地域が選択されたら学習開始ボタンの有効化を確認
            checkStartButtonState();
        }
    }
    
    /**
     * 難易度選択ボタンの選択状態を更新
     * @param {string} selectedDifficulty - 選択された難易度
     */
    function updateDifficultySelection(selectedDifficulty) {
        if (elements.buttons.difficultyButtons) {
            elements.buttons.difficultyButtons.forEach(button => {
                if (button.dataset.difficulty === selectedDifficulty) {
                    button.classList.add('selected');
                } else {
                    button.classList.remove('selected');
                }
            });
            
            // 難易度が選択されたら学習開始ボタンの有効化を確認
            checkStartButtonState();
        }
    }
    
    /**
     * 学習開始ボタンの状態を確認して有効/無効を切り替え
     */
    function checkStartButtonState() {
        const startButton = elements.buttons.startLearningBtn;
        if (!startButton) return;
        
        // 地域と難易度の両方が選択されているかを確認
        const regionSelected = document.querySelector('.region-btn.selected') !== null;
        const difficultySelected = document.querySelector('.difficulty-btn.selected') !== null;
        
        // 両方選択されている場合のみボタンを有効化
        startButton.disabled = !(regionSelected && difficultySelected);
    }
    
    /**
     * イベントリスナーを設定
     * @param {Object} events - イベントハンドラーオブジェクト
     */
    function setupEventListeners(events) {
        // 地域選択ボタン
        if (elements.buttons.regionButtons) {
            elements.buttons.regionButtons.forEach(button => {
                button.addEventListener('click', () => {
                    // 前に選択されていたボタンから選択状態を解除
                    elements.buttons.regionButtons.forEach(btn => {
                        btn.classList.remove('selected');
                    });
                    
                    // 選択されたボタンを選択状態に
                    button.classList.add('selected');
                    
                    // 地域選択イベントを発火
                    const region = button.dataset.region;
                    if (events.onRegionSelect) {
                        events.onRegionSelect(region);
                    }
                    
                    // 学習開始ボタンの状態を更新
                    checkStartButtonState();
                });
            });
        }
        
        // 難易度選択ボタン
        if (elements.buttons.difficultyButtons) {
            elements.buttons.difficultyButtons.forEach(button => {
                button.addEventListener('click', () => {
                    // 前に選択されていたボタンから選択状態を解除
                    elements.buttons.difficultyButtons.forEach(btn => {
                        btn.classList.remove('selected');
                    });
                    
                    // 選択されたボタンを選択状態に
                    button.classList.add('selected');
                    
                    // 難易度選択イベントを発火
                    const difficulty = button.dataset.difficulty;
                    const count = parseInt(button.dataset.count || 5, 10);
                    if (events.onDifficultySelect) {
                        events.onDifficultySelect(count);
                    }
                    
                    // 学習開始ボタンの状態を更新
                    checkStartButtonState();
                });
            });
        }
        
        // 学習開始ボタン
        if (elements.buttons.startLearningBtn) {
            elements.buttons.startLearningBtn.addEventListener('click', () => {
                if (events.onStartLearning) {
                    events.onStartLearning();
                }
            });
        }
        
        // 統計ボタン
        if (elements.buttons.viewStatsBtn) {
            elements.buttons.viewStatsBtn.addEventListener('click', () => {
                if (events.onStatsClick) {
                    events.onStatsClick();
                }
            });
        }
        
        // 学習モードの次へボタン
        if (elements.learning.nextButton) {
            elements.learning.nextButton.addEventListener('click', () => {
                if (events.onNextFace) {
                    events.onNextFace();
                }
            });
        }
        
        // テストモードの回答ボタン
        if (elements.test.submitButton) {
            elements.test.submitButton.addEventListener('click', () => {
                const answer = elements.test.nameAnswer.value.trim();
                if (events.onSubmitAnswer && answer) {
                    events.onSubmitAnswer(answer);
                }
            });
        }
        
        // 結果画面のリトライボタン
        if (elements.results.retryButton) {
            elements.results.retryButton.addEventListener('click', () => {
                if (events.onRetry) {
                    events.onRetry();
                }
            });
        }
        
        // 結果画面のメニューに戻るボタン
        if (elements.results.menuButton) {
            elements.results.menuButton.addEventListener('click', () => {
                if (events.onBackToMenu) {
                    events.onBackToMenu();
                }
            });
        }
        
        // 統計画面の戻るボタン
        if (elements.stats.backButton) {
            elements.stats.backButton.addEventListener('click', () => {
                if (events.onBack) {
                    events.onBack('stats');
                }
            });
        }
    }
    
    // 公開API
    return {
        init,
        showSection,
        updateRegionSelection,
        updateDifficultySelection,
        setupEventListeners
    };
})();

// グローバルオブジェクトとしてエクスポート
window.UIManager = UIManager;