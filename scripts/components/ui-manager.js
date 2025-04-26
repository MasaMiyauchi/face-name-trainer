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
            modeSelection: document.getElementById('mode-selection'),
            regionSelection: document.getElementById('region-selection'),
            difficultySelection: document.getElementById('difficulty-selection'),
            learningMode: document.getElementById('learning-mode'),
            testMode: document.getElementById('test-mode'),
            results: document.getElementById('results'),
            stats: document.getElementById('stats')
        };
        
        // 学習モード要素
        elements.learning = {
            container: document.getElementById('learning-container'),
            faceImage: document.getElementById('current-face'),
            nameDisplay: document.getElementById('current-name'),
            timeLeft: document.getElementById('time-left'),
            nextButton: document.getElementById('next-face'),
            backButton: document.getElementById('back-from-learning')
        };
        
        // テストモード要素
        elements.test = {
            container: document.getElementById('test-container'),
            faceImage: document.getElementById('test-face'),
            optionsContainer: document.getElementById('options-container'),
            backButton: document.getElementById('back-from-test')
        };
        
        // 結果表示要素
        elements.results = {
            container: document.getElementById('results-container'),
            scorePercentage: document.getElementById('score-percentage'),
            correctAnswers: document.getElementById('correct-answers'),
            totalQuestions: document.getElementById('total-questions'),
            detailsContainer: document.getElementById('results-details'),
            retryButton: document.getElementById('retry-test'),
            menuButton: document.getElementById('back-to-menu')
        };
        
        // 統計表示要素
        elements.stats = {
            container: document.getElementById('stats-container'),
            totalTests: document.getElementById('total-tests'),
            averageScore: document.getElementById('average-score'),
            regionStatsContainer: document.getElementById('region-stats-container'),
            backButton: document.getElementById('back-from-stats')
        };
        
        // ボタン要素
        elements.buttons = {
            learningModeBtn: document.getElementById('learning-mode-btn'),
            testModeBtn: document.getElementById('test-mode-btn'),
            statsBtn: document.getElementById('stats-btn'),
            regionButtons: document.querySelectorAll('.btn.region'),
            difficultyButtons: document.querySelectorAll('.btn.difficulty'),
            backFromRegion: document.getElementById('back-from-region'),
            backFromDifficulty: document.getElementById('back-from-difficulty')
        };
    }
    
    /**
     * 指定したセクションをアクティブにして表示
     * @param {string} sectionId - アクティブにするセクションのID
     */
    function showSection(sectionId) {
        // すべてのセクションを非表示
        Object.values(elements.sections).forEach(section => {
            if (section) {
                section.classList.remove('active');
            }
        });
        
        // 指定されたセクションを表示
        const section = elements.sections[sectionId];
        if (section) {
            section.classList.add('active');
        } else {
            console.error(`Section "${sectionId}" not found`);
        }
    }
    
    /**
     * 学習モードでの顔と名前の表示を更新
     * @param {string} faceUrl - 顔画像のURL
     * @param {Object} nameData - 名前データオブジェクト
     * @param {string} region - 地域
     */
    function updateLearningFace(faceUrl, nameData, region) {
        if (elements.learning.faceImage) {
            elements.learning.faceImage.src = faceUrl;
        }
        
        if (elements.learning.nameDisplay) {
            // 地域に応じたフォーマットで名前を表示
            const formatter = window.Helpers.getNameFormatter(region);
            elements.learning.nameDisplay.textContent = formatter(nameData);
        }
    }
    
    /**
     * 学習モードのタイマー表示を更新
     * @param {number} seconds - 残り秒数
     */
    function updateLearningTimer(seconds) {
        if (elements.learning.timeLeft) {
            elements.learning.timeLeft.textContent = seconds;
        }
    }
    
    /**
     * テストモードでの顔表示を更新
     * @param {string} faceUrl - 顔画像のURL
     */
    function updateTestFace(faceUrl) {
        if (elements.test.faceImage) {
            elements.test.faceImage.src = faceUrl;
        }
    }
    
    /**
     * テストモードでの選択肢を更新
     * @param {Array<Object>} options - 選択肢の配列
     * @param {string} region - 地域
     * @param {Function} onSelect - 選択時のコールバック関数
     */
    function updateTestOptions(options, region, onSelect) {
        const container = elements.test.optionsContainer;
        if (!container) return;
        
        // 既存の選択肢をクリア
        container.innerHTML = '';
        
        // 地域に合わせたフォーマッタを取得
        const formatter = window.Helpers.getNameFormatter(region);
        
        // 選択肢を生成
        options.forEach((option, index) => {
            const optionEl = document.createElement('div');
            optionEl.className = 'name-option';
            optionEl.textContent = formatter(option);
            optionEl.dataset.index = index;
            
            // クリックイベントを追加
            optionEl.addEventListener('click', () => {
                // 前に選択されていた要素から選択状態を解除
                const selected = container.querySelector('.name-option.selected');
                if (selected) {
                    selected.classList.remove('selected');
                }
                
                // この要素を選択状態に
                optionEl.classList.add('selected');
                
                // コールバックを呼び出し
                if (onSelect) {
                    onSelect(option, index);
                }
            });
            
            container.appendChild(optionEl);
        });
    }
    
    /**
     * テスト結果を表示
     * @param {Object} resultData - テスト結果データ
     */
    function showResults(resultData) {
        const { correctCount, totalCount, faces, region } = resultData;
        
        // スコア情報を更新
        if (elements.results.scorePercentage) {
            const percentage = Math.round((correctCount / totalCount) * 100);
            elements.results.scorePercentage.textContent = percentage;
        }
        
        if (elements.results.correctAnswers) {
            elements.results.correctAnswers.textContent = correctCount;
        }
        
        if (elements.results.totalQuestions) {
            elements.results.totalQuestions.textContent = totalCount;
        }
        
        // 詳細結果を表示
        const detailsContainer = elements.results.detailsContainer;
        if (detailsContainer) {
            detailsContainer.innerHTML = '';
            
            // 名前フォーマッタを取得
            const formatter = window.Helpers.getNameFormatter(region);
            
            // 各顔の結果を表示
            faces.forEach(face => {
                const resultItem = document.createElement('div');
                resultItem.className = 'result-item';
                
                // 顔画像
                const faceImg = document.createElement('img');
                faceImg.className = 'result-face';
                faceImg.src = face.faceUrl;
                faceImg.alt = '顔画像';
                resultItem.appendChild(faceImg);
                
                // 結果情報
                const infoDiv = document.createElement('div');
                infoDiv.className = 'result-info';
                
                // 正解/不正解のステータス
                const statusSpan = document.createElement('span');
                if (face.correct) {
                    statusSpan.className = 'result-correct';
                    statusSpan.textContent = '正解';
                } else {
                    statusSpan.className = 'result-incorrect';
                    statusSpan.textContent = '不正解';
                }
                
                // 名前表示
                const namePara = document.createElement('p');
                namePara.textContent = `正解: ${formatter(face.name)}`;
                
                // ユーザーの回答（不正解の場合）
                if (!face.correct && face.userAnswer) {
                    const userAnswerPara = document.createElement('p');
                    userAnswerPara.textContent = `あなたの回答: ${formatter(face.userAnswer)}`;
                    infoDiv.appendChild(userAnswerPara);
                }
                
                infoDiv.appendChild(statusSpan);
                infoDiv.appendChild(namePara);
                resultItem.appendChild(infoDiv);
                
                detailsContainer.appendChild(resultItem);
            });
        }
        
        // 結果セクションを表示
        showSection('results');
    }
    
    /**
     * 統計データを表示
     * @param {Object} statsData - 統計データ
     */
    function showStats(statsData) {
        const { totalTests, averageScore, regionStats } = statsData;
        
        // 総合成績を更新
        if (elements.stats.totalTests) {
            elements.stats.totalTests.textContent = totalTests;
        }
        
        if (elements.stats.averageScore) {
            elements.stats.averageScore.textContent = Math.round(averageScore);
        }
        
        // 地域別統計を表示
        const regionStatsContainer = elements.stats.regionStatsContainer;
        if (regionStatsContainer) {
            regionStatsContainer.innerHTML = '';
            
            // 地域ごとの統計を表示
            for (const [region, stats] of Object.entries(regionStats)) {
                const regionItem = document.createElement('div');
                regionItem.className = 'region-stat-item';
                
                // 地域名（日本語表示）
                const regionNameMap = {
                    'japan': '日本',
                    'usa': 'アメリカ',
                    'europe': 'ヨーロッパ',
                    'asia': 'アジア'
                };
                
                const regionName = regionNameMap[region] || region;
                const regionHeader = document.createElement('h4');
                regionHeader.textContent = regionName;
                
                // テスト回数
                const testCountPara = document.createElement('p');
                testCountPara.textContent = `テスト回数: ${stats.tests}回`;
                
                // 平均スコア
                const scorePara = document.createElement('p');
                const roundedScore = Math.round(stats.averageScore);
                scorePara.textContent = `平均正解率: ${roundedScore}%`;
                
                // プログレスバー
                const progressBar = document.createElement('div');
                progressBar.className = 'progress-bar';
                
                const progressFill = document.createElement('div');
                progressFill.className = 'progress-fill';
                progressFill.style.width = `${roundedScore}%`;
                
                progressBar.appendChild(progressFill);
                
                // 要素を追加
                regionItem.appendChild(regionHeader);
                regionItem.appendChild(testCountPara);
                regionItem.appendChild(scorePara);
                regionItem.appendChild(progressBar);
                
                regionStatsContainer.appendChild(regionItem);
            }
            
            // 地域データがない場合
            if (Object.keys(regionStats).length === 0) {
                const noDataMsg = document.createElement('p');
                noDataMsg.textContent = 'まだテストデータがありません。トレーニングを始めましょう！';
                regionStatsContainer.appendChild(noDataMsg);
            }
        }
        
        // 統計セクションを表示
        showSection('stats');
    }
    
    /**
     * イベントリスナーを設定
     * @param {Object} events - イベントハンドラーオブジェクト
     */
    function setupEventListeners(events) {
        // 学習モードボタン
        if (elements.buttons.learningModeBtn) {
            elements.buttons.learningModeBtn.addEventListener('click', () => {
                events.onModeSelect && events.onModeSelect('learning');
            });
        }
        
        // テストモードボタン
        if (elements.buttons.testModeBtn) {
            elements.buttons.testModeBtn.addEventListener('click', () => {
                events.onModeSelect && events.onModeSelect('test');
            });
        }
        
        // 統計ボタン
        if (elements.buttons.statsBtn) {
            elements.buttons.statsBtn.addEventListener('click', () => {
                events.onStatsClick && events.onStatsClick();
            });
        }
        
        // 地域選択ボタン
        if (elements.buttons.regionButtons) {
            elements.buttons.regionButtons.forEach(button => {
                button.addEventListener('click', () => {
                    const region = button.dataset.region;
                    events.onRegionSelect && events.onRegionSelect(region);
                });
            });
        }
        
        // 難易度選択ボタン
        if (elements.buttons.difficultyButtons) {
            elements.buttons.difficultyButtons.forEach(button => {
                button.addEventListener('click', () => {
                    const count = parseInt(button.dataset.count, 10);
                    events.onDifficultySelect && events.onDifficultySelect(count);
                });
            });
        }
        
        // 戻るボタン
        if (elements.buttons.backFromRegion) {
            elements.buttons.backFromRegion.addEventListener('click', () => {
                events.onBack && events.onBack('region');
            });
        }
        
        if (elements.buttons.backFromDifficulty) {
            elements.buttons.backFromDifficulty.addEventListener('click', () => {
                events.onBack && events.onBack('difficulty');
            });
        }
        
        if (elements.learning.backButton) {
            elements.learning.backButton.addEventListener('click', () => {
                events.onBack && events.onBack('learning');
            });
        }
        
        if (elements.test.backButton) {
            elements.test.backButton.addEventListener('click', () => {
                events.onBack && events.onBack('test');
            });
        }
        
        if (elements.stats.backButton) {
            elements.stats.backButton.addEventListener('click', () => {
                events.onBack && events.onBack('stats');
            });
        }
        
        // 学習モードの次へボタン
        if (elements.learning.nextButton) {
            elements.learning.nextButton.addEventListener('click', () => {
                events.onNextFace && events.onNextFace();
            });
        }
        
        // 結果画面のリトライボタン
        if (elements.results.retryButton) {
            elements.results.retryButton.addEventListener('click', () => {
                events.onRetry && events.onRetry();
            });
        }
        
        // 結果画面のメニューに戻るボタン
        if (elements.results.menuButton) {
            elements.results.menuButton.addEventListener('click', () => {
                events.onBackToMenu && events.onBackToMenu();
            });
        }
    }
    
    // 公開API
    return {
        init,
        showSection,
        updateLearningFace,
        updateLearningTimer,
        updateTestFace,
        updateTestOptions,
        showResults,
        showStats,
        setupEventListeners
    };
})();

// グローバルオブジェクトとしてエクスポート
window.UIManager = UIManager;