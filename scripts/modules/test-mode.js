/**
 * テストモードモジュール
 * 顔と名前の記憶テストを実行するための機能を提供
 */

const TestMode = (function() {
    // テストセッションの状態
    let sessionState = {
        region: null,            // 地域
        difficulty: null,        // 難易度（人数）
        currentIndex: 0,         // 現在表示中のインデックス
        facesAndNames: [],       // 顔と名前のペアの配列
        testFaces: [],           // テスト用に並べ替えた顔の配列
        options: [],             // 現在の選択肢
        selectedAnswer: null,    // 選択された回答
        correctCount: 0,         // 正解数
        results: [],             // テスト結果
        isActive: false,         // テストモードがアクティブかどうか
        isCompleted: false,      // テストが完了したかどうか
        trainedFaces: null,      // 学習モードから渡された顔データ
        startTime: null,         // テスト開始時間
        answerTimes: []          // 各問題の回答時間
    };
    
    /**
     * テストモードを開始
     * @param {string} region - 地域識別子
     * @param {number} difficulty - 難易度（人数）
     * @param {Array<Object>} trainedFaces - 学習した顔データ（オプション）
     * @returns {Promise<void>} - テスト完了時に解決するPromise
     */
    async function start(region, difficulty, trainedFaces = null) {
        // 前回のセッションがあれば停止
        stop();
        
        // 新しいセッション状態を設定
        sessionState = {
            region,
            difficulty,
            currentIndex: 0,
            facesAndNames: [],
            testFaces: [],
            options: [],
            selectedAnswer: null,
            correctCount: 0,
            results: [],
            isActive: true,
            isCompleted: false,
            trainedFaces: trainedFaces,
            startTime: new Date(),
            answerTimes: []
        };
        
        try {
            // 学習済みの顔データがあればそれを使用、なければ新たにロード
            if (trainedFaces && trainedFaces.length > 0) {
                sessionState.facesAndNames = [...trainedFaces];
            } else {
                // まず先にFaceGeneratorを初期化（必要なら）
                if (window.FaceGenerator) {
                    await window.FaceGenerator.init();
                    
                    // 難易度に応じたテスト用の顔を生成
                    const neededFacesCount = difficulty === 'easy' ? 5 : 
                                            difficulty === 'medium' ? 10 : 15;
                                            
                    // 既存の顔データが上限に達している場合、新しい顔を生成
                    await window.FaceGenerator.generateFacesForTest(region, neededFacesCount);
                }
                
                // 顔画像と名前のペアをロード
                await loadFacesAndNames(region, difficulty);
            }
            
            // テスト用に顔をシャッフル
            prepareTestData();
            
            // UI要素を更新
            updateUI();
            
            // セクションを表示
            window.UIManager.showSection('test-screen');
            
            // テスト完了時に解決するPromiseを返す
            return new Promise((resolve) => {
                // 完了チェックのインターバルを設定
                const checkInterval = setInterval(() => {
                    if (sessionState.isCompleted) {
                        clearInterval(checkInterval);
                        resolve(sessionState.results);
                    }
                }, 500);
            });
        } catch (error) {
            console.error('Error starting test mode:', error);
            await window.Modal.error('テストモードの開始中にエラーが発生しました。');
            return Promise.reject(error);
        }
    }
    
    /**
     * テストモードを停止
     */
    function stop() {
        sessionState.isActive = false;
    }
    
    /**
     * 顔と名前のペアをロード
     * @param {string} region - 地域識別子
     * @param {number} count - ロードする顔の数
     * @returns {Promise<void>} - ロード完了時に解決するPromise
     */
    async function loadFacesAndNames(region, count) {
        try {
            // 難易度から実際の人数を計算
            let actualCount;
            if (typeof count === 'number') {
                actualCount = count;
            } else {
                actualCount = count === 'easy' ? 5 : 
                             count === 'medium' ? 10 : 15;
            }
            
            // ロード中モーダルを表示
            const loadingModal = window.Modal.show({
                title: 'ロード中',
                message: 'テスト用データをロードしています...',
                buttons: []
            });
            
            // 名前データを取得
            const names = await window.NameAPI.getRandomNames(region, actualCount);
            
            // FaceGeneratorを使用して顔データを取得
            let faces = [];
            if (window.FaceGenerator) {
                try {
                    // FaceGeneratorから顔を取得
                    faces = await window.FaceGenerator.getRandomFaces(region, actualCount);
                    
                    // ロード中モーダルを更新
                    if (window.Modal.updateMessage) {
                        window.Modal.updateMessage('顔データの取得が完了しました。テストを準備しています...');
                    }
                } catch (genError) {
                    console.error('Error using FaceGenerator:', genError);
                    // エラー時はFallbackとして従来のFaceAPIを使用
                    faces = await fallbackLoadFaces(region, actualCount);
                }
            } else {
                // FaceGeneratorが利用できない場合は従来のFaceAPIを使用
                faces = await fallbackLoadFaces(region, actualCount);
            }
            
            // 顔と名前のペアを作成
            sessionState.facesAndNames = [];
            for (let i = 0; i < actualCount; i++) {
                const name = names[i];
                const face = faces[i] || null;
                
                let faceUrl;
                if (face && face.imageData) {
                    // FaceGenerator形式のデータ
                    faceUrl = face.imageData;
                } else if (face) {
                    // 直接URLの場合
                    faceUrl = face;
                } else {
                    // データがない場合はデフォルト
                    faceUrl = 'assets/default-face.jpg';
                }
                
                sessionState.facesAndNames.push({
                    id: name.id || `face-${i}`,
                    name: name,
                    faceUrl: faceUrl,
                    region: region,
                    faceData: face // 生成器から取得した元データも保持
                });
            }
            
            // ロード中モーダルを閉じる
            window.Modal.hide();
            
        } catch (error) {
            console.error('Error loading faces and names:', error);
            // エラーモーダルを表示
            await window.Modal.error('データのロード中にエラーが発生しました。');
            throw error;
        }
    }
    
    /**
     * 従来のFaceAPIを使用して顔画像をロード（フォールバック）
     * @param {string} region - 地域識別子
     * @param {number} count - ロードする顔の数
     * @returns {Promise<Array>} - 顔画像URLの配列
     */
    async function fallbackLoadFaces(region, count) {
        const faces = [];
        
        for (let i = 0; i < count; i++) {
            try {
                const faceUrl = await window.FaceAPI.getFace(region);
                faces.push(faceUrl);
            } catch (error) {
                console.error('Error loading face image:', error);
                // エラー時はダミー画像を使用
                faces.push('assets/default-face.jpg');
            }
            
            // ロード進捗を更新
            if (window.Modal.updateMessage) {
                const progress = Math.round((i + 1) / count * 100);
                window.Modal.updateMessage(`テスト用データをロードしています... ${progress}%`);
            }
        }
        
        return faces;
    }
    
    /**
     * テスト用データを準備
     */
    function prepareTestData() {
        // 顔と名前のペアをコピーしてシャッフル
        sessionState.testFaces = [...sessionState.facesAndNames];
        window.Helpers.shuffleArray(sessionState.testFaces);
        
        // 結果配列を初期化
        sessionState.results = sessionState.testFaces.map(face => ({
            faceUrl: face.faceUrl,
            name: face.name,
            userAnswer: null,
            correct: false,
            answerTime: null
        }));
        
        // 回答時間配列を初期化
        sessionState.answerTimes = Array(sessionState.testFaces.length).fill(null);
        
        // 開始時間を記録
        sessionState.startTime = new Date();
    }
    
    /**
     * UI要素を更新
     */
    function updateUI() {
        if (!sessionState.isActive || sessionState.testFaces.length === 0) {
            return;
        }
        
        const currentFace = sessionState.testFaces[sessionState.currentIndex];
        
        // 進捗表示を更新
        const currentTestFaceElement = document.getElementById('current-test-face');
        const totalTestFacesElement = document.getElementById('total-test-faces');
        
        if (currentTestFaceElement) {
            currentTestFaceElement.textContent = (sessionState.currentIndex + 1).toString();
        }
        
        if (totalTestFacesElement) {
            totalTestFacesElement.textContent = sessionState.testFaces.length.toString();
        }
        
        // 顔画像を更新
        const testFaceImageElement = document.getElementById('test-face-image');
        if (testFaceImageElement) {
            testFaceImageElement.src = currentFace.faceUrl;
        }
        
        // 入力フィールドをクリア
        const nameAnswerInput = document.getElementById('name-answer');
        if (nameAnswerInput) {
            nameAnswerInput.value = '';
            nameAnswerInput.focus();
        }
        
        // フィードバック領域をクリア
        const feedbackContainer = document.getElementById('answer-feedback');
        if (feedbackContainer) {
            feedbackContainer.innerHTML = '';
            feedbackContainer.className = 'feedback-container';
        }
        
        // ナビゲーションボタンの状態を更新
        const nextButton = document.getElementById('next-test-btn');
        const finishButton = document.getElementById('finish-test-btn');
        
        if (nextButton) {
            nextButton.disabled = true;
        }
        
        if (finishButton) {
            finishButton.disabled = sessionState.currentIndex < sessionState.testFaces.length - 1;
        }
    }
    
    /**
     * 回答を提出
     * @param {string} answer - ユーザーの回答
     */
    function submitAnswer(answer) {
        if (!sessionState.isActive) {
            return;
        }
        
        // 回答時間を記録
        const answerTime = new Date();
        const timeToAnswer = (answerTime - sessionState.startTime) / 1000; // 秒単位
        sessionState.answerTimes[sessionState.currentIndex] = timeToAnswer;
        
        // 現在の顔と正解の名前
        const currentFace = sessionState.testFaces[sessionState.currentIndex];
        const correctName = currentFace.name;
        
        // 回答を正規化（トリミングして小文字に変換）
        const normalizedAnswer = answer.trim().toLowerCase();
        
        // 正解の名前を地域に応じたフォーマットで取得
        let correctDisplayName;
        if (correctName.firstName && correctName.lastName) {
            // 地域に応じて姓名の順序を変更
            if (sessionState.region === 'japan' || sessionState.region === 'asia') {
                correctDisplayName = `${correctName.lastName} ${correctName.firstName}`;
            } else {
                correctDisplayName = `${correctName.firstName} ${correctName.lastName}`;
            }
        } else {
            // 名前データがおかしい場合のフォールバック
            correctDisplayName = correctName.firstName || correctName.lastName || '名前なし';
        }
        
        // 正規化した正解名
        const normalizedCorrectName = correctDisplayName.toLowerCase();
        
        // 正解かどうかをチェック（完全一致または部分一致）
        const isExactMatch = normalizedAnswer === normalizedCorrectName;
        const isPartialMatch = normalizedAnswer.length > 0 && 
                              (normalizedCorrectName.includes(normalizedAnswer) || 
                               normalizedAnswer.includes(normalizedCorrectName));
        
        // 部分一致でも正解とするが、結果に記録する正解度は異なる
        const isCorrect = isExactMatch || isPartialMatch;
        const matchQuality = isExactMatch ? 'exact' : (isPartialMatch ? 'partial' : 'incorrect');
        
        // 結果を更新
        sessionState.results[sessionState.currentIndex] = {
            faceUrl: currentFace.faceUrl,
            name: correctName,
            displayName: correctDisplayName,
            userAnswer: answer,
            correct: isCorrect,
            matchQuality: matchQuality,
            answerTime: timeToAnswer
        };
        
        // 正解数をカウント
        if (isCorrect) {
            sessionState.correctCount++;
        }
        
        // フィードバックを表示
        showAnswerFeedback(isCorrect, correctDisplayName);
        
        // 次の質問に進むボタンを有効化
        const nextButton = document.getElementById('next-test-btn');
        if (nextButton) {
            nextButton.disabled = false;
        }
    }
    
    /**
     * 回答のフィードバックを表示
     * @param {boolean} isCorrect - 正解かどうか
     * @param {string} correctName - 正解の名前
     */
    function showAnswerFeedback(isCorrect, correctName) {
        const feedbackContainer = document.getElementById('answer-feedback');
        if (!feedbackContainer) return;
        
        // フィードバック領域をクリア
        feedbackContainer.innerHTML = '';
        
        // フィードバックを作成
        const feedbackElement = document.createElement('div');
        
        if (isCorrect) {
            feedbackElement.className = 'feedback correct';
            feedbackElement.innerHTML = `
                <span class="feedback-icon">✓</span>
                <span class="feedback-text">正解です！</span>
            `;
        } else {
            feedbackElement.className = 'feedback incorrect';
            feedbackElement.innerHTML = `
                <span class="feedback-icon">✗</span>
                <span class="feedback-text">不正解です。正解: ${correctName}</span>
            `;
        }
        
        // フィードバックを表示
        feedbackContainer.appendChild(feedbackElement);
    }
    
    /**
     * 次の顔に進む
     */
    function nextFace() {
        // インデックスを進める
        sessionState.currentIndex++;
        
        // すべての顔をテストし終えたら完了
        if (sessionState.currentIndex >= sessionState.testFaces.length) {
            completeTest();
            return;
        }
        
        // 次の質問の開始時間を記録
        sessionState.startTime = new Date();
        
        // UI要素を更新
        updateUI();
    }
    
    /**
     * テストを完了
     */
    function completeTest() {
        // セッション状態を更新
        sessionState.isActive = false;
        sessionState.isCompleted = true;
        
        // 平均回答時間を計算（無効な値を除外）
        const validTimes = sessionState.answerTimes.filter(time => time !== null);
        const averageTime = validTimes.length > 0 ? 
            validTimes.reduce((sum, time) => sum + time, 0) / validTimes.length : 0;
        
        // 結果データを作成
        const resultData = {
            region: sessionState.region,
            correctCount: sessionState.correctCount,
            totalCount: sessionState.testFaces.length,
            averageTime: averageTime.toFixed(1),
            faces: sessionState.results,
            timestamp: new Date().getTime()
        };
        
        // テスト結果を保存
        window.Storage.saveTestResult(resultData);
        
        // 統計データを更新
        if (window.Stats && typeof window.Stats.updateStats === 'function') {
            window.Stats.updateStats(resultData);
        }
        
        // 結果画面を表示
        showResults(resultData);
    }
    
    /**
     * 結果を表示
     * @param {Object} resultData - テスト結果データ
     */
    function showResults(resultData) {
        // 結果セクションに移動
        window.UIManager.showSection('results-screen');
        
        // スコアを更新
        const scorePercentage = document.getElementById('score-percentage');
        const correctAnswers = document.getElementById('correct-answers');
        const totalQuestions = document.getElementById('total-questions');
        const averageTime = document.getElementById('average-time');
        
        if (scorePercentage) {
            const percent = Math.round(resultData.correctCount / resultData.totalCount * 100);
            scorePercentage.textContent = `${percent}%`;
        }
        
        if (correctAnswers) {
            correctAnswers.textContent = resultData.correctCount.toString();
        }
        
        if (totalQuestions) {
            totalQuestions.textContent = resultData.totalCount.toString();
        }
        
        if (averageTime) {
            averageTime.textContent = `${resultData.averageTime}秒`;
        }
        
        // 結果テーブルを更新
        const resultsTableBody = document.getElementById('results-table-body');
        if (resultsTableBody) {
            // テーブルをクリア
            resultsTableBody.innerHTML = '';
            
            // 各結果の行を追加
            resultData.faces.forEach((result, index) => {
                const row = document.createElement('tr');
                
                // 顔画像のセル
                const faceCell = document.createElement('td');
                const faceImg = document.createElement('img');
                faceImg.src = result.faceUrl;
                faceImg.alt = '顔画像';
                faceImg.className = 'result-face-img';
                faceCell.appendChild(faceImg);
                
                // 正解の名前のセル
                const correctNameCell = document.createElement('td');
                correctNameCell.textContent = result.displayName;
                
                // ユーザーの回答のセル
                const userAnswerCell = document.createElement('td');
                userAnswerCell.textContent = result.userAnswer || '-';
                
                // 結果のセル
                const resultCell = document.createElement('td');
                if (result.correct) {
                    if (result.matchQuality === 'exact') {
                        resultCell.innerHTML = '<span class="correct">✓ 完全一致</span>';
                    } else {
                        resultCell.innerHTML = '<span class="partial">△ 部分一致</span>';
                    }
                } else {
                    resultCell.innerHTML = '<span class="incorrect">✗ 不正解</span>';
                }
                
                // 行に各セルを追加
                row.appendChild(faceCell);
                row.appendChild(correctNameCell);
                row.appendChild(userAnswerCell);
                row.appendChild(resultCell);
                
                // テーブルに行を追加
                resultsTableBody.appendChild(row);
            });
        }
    }
    
    /**
     * 同じ顔と名前でテストをやり直し
     */
    function retry() {
        if (sessionState.facesAndNames.length === 0) {
            return;
        }
        
        // セッション状態をリセット
        sessionState.currentIndex = 0;
        sessionState.correctCount = 0;
        sessionState.isActive = true;
        sessionState.isCompleted = false;
        sessionState.startTime = new Date();
        
        // テスト用に顔を再シャッフル
        prepareTestData();
        
        // UI要素を更新
        updateUI();
        
        // テストモードセクションを表示
        window.UIManager.showSection('test-screen');
    }
    
    /**
     * 現在のテスト結果を取得
     * @returns {Object} - テスト結果データ
     */
    function getResults() {
        // 平均回答時間を計算（無効な値を除外）
        const validTimes = sessionState.answerTimes.filter(time => time !== null);
        const averageTime = validTimes.length > 0 ? 
            validTimes.reduce((sum, time) => sum + time, 0) / validTimes.length : 0;
        
        return {
            region: sessionState.region,
            correctCount: sessionState.correctCount,
            totalCount: sessionState.testFaces.length,
            averageTime: averageTime.toFixed(1),
            faces: sessionState.results,
            timestamp: new Date().getTime()
        };
    }
    
    // 公開API
    return {
        start,
        stop,
        nextFace,
        submitAnswer,
        retry,
        getResults
    };
})();

// グローバルオブジェクトとしてエクスポート
window.TestMode = TestMode;