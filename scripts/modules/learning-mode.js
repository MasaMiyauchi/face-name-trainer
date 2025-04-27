/**
 * 学習モードモジュール
 * 顔と名前のペアを学習するための機能を提供
 */

const LearningMode = (function() {
    // 現在の学習セッションの状態
    let sessionState = {
        region: null,          // 地域
        difficulty: null,      // 難易度（人数）
        currentIndex: 0,       // 現在表示中のインデックス
        facesAndNames: [],     // 顔と名前のペアの配列
        timePerFace: 10,       // 1つの顔当たりの表示時間（秒）
        isActive: false,       // 学習モードがアクティブかどうか
        stopTimer: null,       // タイマー停止関数
        isCompleted: false     // 学習が完了したかどうか
    };
    
    /**
     * 学習モードを開始
     * @param {string} region - 地域識別子
     * @param {number} difficulty - 難易度（人数）
     * @param {number} timePerFace - 1つの顔当たりの表示時間（秒）
     * @returns {Promise<void>} - 学習完了時に解決するPromise
     */
    async function start(region, difficulty, timePerFace = 10) {
        // 前回のセッションがあれば停止
        stop();
        
        // 新しいセッション状態を設定
        sessionState = {
            region,
            difficulty,
            currentIndex: 0,
            facesAndNames: [],
            timePerFace: timePerFace,
            isActive: true,
            stopTimer: null,
            isCompleted: false
        };
        
        try {
            // まず先にFaceGeneratorを初期化
            if (window.FaceGenerator) {
                await window.FaceGenerator.init();
            }
            
            // 顔画像と名前のペアをロード
            await loadFacesAndNames(region, difficulty);
            
            // UI要素を更新
            updateUI();
            
            // セクションを表示
            window.UIManager.showSection('learning-screen');
            
            // タイマーを開始
            startFaceTimer();
            
            // 学習セッションデータをローカルストレージに保存
            saveSession();
            
            // 完了時に解決するPromiseを返す
            return new Promise((resolve) => {
                // 完了チェックのインターバルを設定
                const checkInterval = setInterval(() => {
                    if (sessionState.isCompleted) {
                        clearInterval(checkInterval);
                        resolve();
                    }
                }, 500);
            });
        } catch (error) {
            console.error('Error starting learning mode:', error);
            await window.Modal.error('学習モードの開始中にエラーが発生しました。');
            return Promise.reject(error);
        }
    }
    
    /**
     * 学習モードを停止
     */
    function stop() {
        if (sessionState.stopTimer) {
            sessionState.stopTimer();
            sessionState.stopTimer = null;
        }
        
        sessionState.isActive = false;
    }
    
    /**
     * 学習モードを一時停止
     */
    function pause() {
        if (sessionState.stopTimer) {
            sessionState.stopTimer();
            sessionState.stopTimer = null;
        }
    }
    
    /**
     * 学習モードを再開
     */
    function resume() {
        if (sessionState.isActive) {
            startFaceTimer();
        }
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
            
            // 名前データを取得
            const names = await window.NameAPI.getRandomNames(region, count);
            
            // FaceGeneratorを使用して顔データを取得
            let faces = [];
            if (window.FaceGenerator) {
                try {
                    // FaceGeneratorから顔を取得
                    faces = await window.FaceGenerator.getRandomFaces(region, count);
                    
                    // ロード中モーダルを更新
                    if (window.Modal.updateMessage) {
                        window.Modal.updateMessage('顔データの取得が完了しました。セッションを準備しています...');
                    }
                } catch (genError) {
                    console.error('Error using FaceGenerator:', genError);
                    // エラー時はFallbackとして従来のFaceAPIを使用
                    faces = await fallbackLoadFaces(region, count);
                }
            } else {
                // FaceGeneratorが利用できない場合は従来のFaceAPIを使用
                faces = await fallbackLoadFaces(region, count);
            }
            
            // 顔と名前のペアを作成
            sessionState.facesAndNames = [];
            for (let i = 0; i < count; i++) {
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
                window.Modal.updateMessage(`顔と名前のデータをロードしています... ${progress}%`);
            }
        }
        
        return faces;
    }
    
    /**
     * UI要素を更新
     */
    function updateUI() {
        if (!sessionState.isActive || sessionState.facesAndNames.length === 0) {
            return;
        }
        
        const currentPair = sessionState.facesAndNames[sessionState.currentIndex];
        
        // 進捗表示を更新
        const currentFaceElement = document.getElementById('current-face');
        const totalFacesElement = document.getElementById('total-faces');
        
        if (currentFaceElement) {
            currentFaceElement.textContent = (sessionState.currentIndex + 1).toString();
        }
        
        if (totalFacesElement) {
            totalFacesElement.textContent = sessionState.facesAndNames.length.toString();
        }
        
        // 顔画像を更新
        const faceImageElement = document.getElementById('face-image');
        if (faceImageElement) {
            faceImageElement.src = currentPair.faceUrl;
        }
        
        // 名前を更新
        const faceNameElement = document.getElementById('face-name');
        if (faceNameElement) {
            // フルネームを表示
            const name = currentPair.name;
            let displayName;
            
            if (name.firstName && name.lastName) {
                // 地域に応じて姓名の順序を変更
                if (sessionState.region === 'japan' || sessionState.region === 'asia') {
                    displayName = `${name.lastName} ${name.firstName}`;
                } else {
                    displayName = `${name.firstName} ${name.lastName}`;
                }
            } else {
                // 名前データがおかしい場合のフォールバック
                displayName = name.firstName || name.lastName || '名前なし';
            }
            
            faceNameElement.textContent = displayName;
        }
        
        // タイマー表示を更新
        const timerElement = document.getElementById('timer');
        if (timerElement) {
            timerElement.textContent = sessionState.timePerFace.toString();
        }
        
        // ナビゲーションボタンの状態を更新
        const prevButton = document.getElementById('previous-face-btn');
        const nextButton = document.getElementById('next-face-btn');
        const finishButton = document.getElementById('finish-learning-btn');
        
        if (prevButton) {
            prevButton.disabled = sessionState.currentIndex <= 0;
        }
        
        if (nextButton) {
            nextButton.disabled = sessionState.currentIndex >= sessionState.facesAndNames.length - 1;
        }
        
        if (finishButton) {
            finishButton.disabled = sessionState.currentIndex < sessionState.facesAndNames.length - 1;
        }
    }
    
    /**
     * 顔のタイマーを開始
     */
    function startFaceTimer() {
        if (sessionState.stopTimer) {
            sessionState.stopTimer();
        }
        
        // カウントダウンタイマーを開始
        sessionState.stopTimer = window.Timer.startCountdown(
            sessionState.timePerFace,
            (secondsLeft) => {
                // 残り時間表示を更新
                const timerElement = document.getElementById('timer');
                if (timerElement) {
                    timerElement.textContent = secondsLeft.toString();
                }
            },
            () => {
                // タイマー終了時の処理
                nextFace();
            }
        );
    }
    
    /**
     * 次の顔に進む
     */
    function nextFace() {
        // タイマーを停止
        if (sessionState.stopTimer) {
            sessionState.stopTimer();
            sessionState.stopTimer = null;
        }
        
        // インデックスを進める
        sessionState.currentIndex++;
        
        // すべての顔を表示し終えたら完了
        if (sessionState.currentIndex >= sessionState.facesAndNames.length) {
            completeSession();
            return;
        }
        
        // UI要素を更新
        updateUI();
        
        // タイマーを再開
        startFaceTimer();
        
        // セッションデータを保存
        saveSession();
    }
    
    /**
     * 前の顔に戻る
     */
    function previousFace() {
        // タイマーを停止
        if (sessionState.stopTimer) {
            sessionState.stopTimer();
            sessionState.stopTimer = null;
        }
        
        // インデックスを戻す
        if (sessionState.currentIndex > 0) {
            sessionState.currentIndex--;
        }
        
        // UI要素を更新
        updateUI();
        
        // タイマーを再開
        startFaceTimer();
        
        // セッションデータを保存
        saveSession();
    }
    
    /**
     * 学習セッションを完了
     */
    function completeSession() {
        // セッション状態を更新
        sessionState.isActive = false;
        sessionState.isCompleted = true;
        
        // セッションデータをクリア
        window.Storage.clearSession();
        
        // モーダルで完了を通知
        window.Modal.success('すべての顔と名前を学習しました！', '学習完了')
            .then(() => {
                // テストモードに移動するか確認
                return window.Modal.confirm(
                    'テストモードに進みますか？',
                    '学習完了'
                );
            })
            .then((confirmed) => {
                if (confirmed) {
                    // テストモードを開始
                    window.TestMode.start(
                        sessionState.region,
                        sessionState.difficulty,
                        sessionState.facesAndNames
                    );
                } else {
                    // メニューに戻る
                    window.Navigation.backToMenu();
                }
            });
    }
    
    /**
     * 現在のセッション状態を保存
     */
    function saveSession() {
        if (sessionState.isActive) {
            window.Storage.saveSession({
                region: sessionState.region,
                difficulty: sessionState.difficulty,
                currentIndex: sessionState.currentIndex,
                facesAndNames: sessionState.facesAndNames,
                timePerFace: sessionState.timePerFace
            });
        }
    }
    
    /**
     * 保存されたセッションを復元
     * @returns {Promise<boolean>} - セッションが復元されたかどうか
     */
    async function restoreSession() {
        const savedSession = window.Storage.getSession();
        
        if (!savedSession) {
            return false;
        }
        
        // 復元するか確認
        const confirmed = await window.Modal.confirm(
            '前回の学習セッションを再開しますか？',
            'セッション復元'
        );
        
        if (!confirmed) {
            window.Storage.clearSession();
            return false;
        }
        
        // セッション状態を復元
        sessionState = {
            region: savedSession.region,
            difficulty: savedSession.difficulty,
            currentIndex: savedSession.currentIndex,
            facesAndNames: savedSession.facesAndNames,
            timePerFace: savedSession.timePerFace || 10,
            isActive: true,
            stopTimer: null,
            isCompleted: false
        };
        
        // UI要素を更新
        updateUI();
        
        // セクションを表示
        window.UIManager.showSection('learning-screen');
        
        // タイマーを開始
        startFaceTimer();
        
        return true;
    }
    
    // 公開API
    return {
        start,
        stop,
        pause,
        resume,
        nextFace,
        previousFace,
        restoreSession,
        completeSession
    };
})();

// グローバルオブジェクトとしてエクスポート
window.LearningMode = LearningMode;