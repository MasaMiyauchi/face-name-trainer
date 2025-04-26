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
        trainedFaces: null       // 学習モードから渡された顔データ
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
            trainedFaces: trainedFaces
        };
        
        try {
            // 学習済みの顔データがあればそれを使用、なければ新たにロード
            if (trainedFaces && trainedFaces.length > 0) {
                sessionState.facesAndNames = [...trainedFaces];
            } else {
                // 顔画像と名前のペアをロード
                await loadFacesAndNames(region, difficulty);
            }
            
            // テスト用に顔をシャッフル
            prepareTestData();
            
            // UI要素を更新
            updateUI();
            
            // セクションを表示
            window.UIManager.showSection('test-mode');
            
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
            // ロード中モーダルを表示
            const loadingModal = window.Modal.show({
                title: 'ロード中',
                message: '顔と名前のデータをロードしています...',
                buttons: []
            });
            
            // 非同期処理を開始
            // 名前データを取得
            const names = await window.NameAPI.getRandomNames(region, count);
            
            // 顔画像を事前にロード
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
                    window.Modal.updateMessage(`顔と名前のデータをロードしています... ${progress}%`);
                }
            }
            
            // 顔と名前のペアを作成
            sessionState.facesAndNames = names.map((name, index) => ({
                id: name.id,
                name: name,
                faceUrl: faces[index] || 'assets/default-face.jpg',
                region: region
            }));
            
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
            correct: false
        }));
    }
    
    /**
     * UI要素を更新
     */
    function updateUI() {
        if (!sessionState.isActive || sessionState.testFaces.length === 0) {
            return;
        }
        
        const currentFace = sessionState.testFaces[sessionState.currentIndex];
        
        // UIマネージャーを使って顔を更新
        window.UIManager.updateTestFace(currentFace.faceUrl);
        
        // 選択肢を生成
        generateOptions(currentFace);
        
        // 選択肢を表示
        window.UIManager.updateTestOptions(
            sessionState.options,
            sessionState.region,
            (selectedOption) => {
                // 選択肢がクリックされたときの処理
                handleOptionSelect(selectedOption);
            }
        );
    }
    
    /**
     * 選択肢を生成
     * @param {Object} correctFace - 正解の顔データ
     */
    function generateOptions(correctFace) {
        // 正解を含めた選択肢の数（4つ）
        const NUM_OPTIONS = 4;
        
        // 正解の選択肢
        const correctOption = correctFace.name;
        
        // 他の選択肢用に名前の配列を作成し、正解を除外
        const otherNames = sessionState.facesAndNames
            .filter(face => face.name.id !== correctOption.id)
            .map(face => face.name);
        
        // 他の選択肢からランダムに選択
        const selectedOptions = window.Helpers.getRandomElements(
            otherNames,
            NUM_OPTIONS - 1
        );
        
        // 正解を含めた選択肢の配列を作成
        const options = [...selectedOptions, correctOption];
        
        // 選択肢をシャッフル
        sessionState.options = window.Helpers.shuffleArray(options);
    }
    
    /**
     * 選択肢が選択されたときの処理
     * @param {Object} selectedOption - 選択された選択肢
     */
    function handleOptionSelect(selectedOption) {
        if (!sessionState.isActive) {
            return;
        }
        
        // 現在の顔と正解の名前
        const currentFace = sessionState.testFaces[sessionState.currentIndex];
        const correctName = currentFace.name;
        
        // 正解かどうかをチェック
        const isCorrect = selectedOption.id === correctName.id;
        
        // 結果を更新
        sessionState.results[sessionState.currentIndex].userAnswer = selectedOption;
        sessionState.results[sessionState.currentIndex].correct = isCorrect;
        
        // 正解数をカウント
        if (isCorrect) {
            sessionState.correctCount++;
        }
        
        // 短い遅延の後、次の顔に進む
        setTimeout(() => {
            nextFace();
        }, 500);
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
        
        // 結果データを作成
        const resultData = {
            region: sessionState.region,
            correctCount: sessionState.correctCount,
            totalCount: sessionState.testFaces.length,
            faces: sessionState.results,
            timestamp: new Date().getTime()
        };
        
        // テスト結果を保存
        window.Storage.saveTestResult(resultData);
        
        // 統計データを更新
        window.Storage.updateStats(resultData);
        
        // 結果を表示
        window.UIManager.showResults(resultData);
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
        
        // テスト用に顔を再シャッフル
        prepareTestData();
        
        // UI要素を更新
        updateUI();
        
        // テストモードセクションを表示
        window.UIManager.showSection('test-mode');
    }
    
    /**
     * 現在のテスト結果を取得
     * @returns {Object} - テスト結果データ
     */
    function getResults() {
        return {
            region: sessionState.region,
            correctCount: sessionState.correctCount,
            totalCount: sessionState.testFaces.length,
            faces: sessionState.results,
            timestamp: new Date().getTime()
        };
    }
    
    // 公開API
    return {
        start,
        stop,
        nextFace,
        retry,
        getResults
    };
})();

// グローバルオブジェクトとしてエクスポート
window.TestMode = TestMode;