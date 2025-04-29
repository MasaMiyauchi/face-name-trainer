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
    
    // 画像サイズの制限（ピクセル）
    const MAX_IMAGE_WIDTH = 256;
    const MAX_IMAGE_HEIGHT = 256;
    
    // デフォルト画像のパス
    const DEFAULT_FACE_IMAGE = 'assets/default-face.jpg';
    
    // エラーリトライ設定
    const MAX_RETRIES = 3;
    
    /**
     * 画像の存在を確認する
     * @param {string} imagePath - 画像のパス
     * @returns {Promise<boolean>} - 画像が存在するかどうか
     */
    function checkImageExists(imagePath) {
        return new Promise((resolve) => {
            const img = new Image();
            img.onload = () => resolve(true);
            img.onerror = () => resolve(false);
            img.src = imagePath;
        });
    }
    
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
            // 必要なディレクトリ構造を確認
            await checkRequiredDirectories(region);
            
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
            
            // 学習セッションデータをIndexedDBに保存
            await saveSession();
            
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
     * 必要なディレクトリ構造を確認する
     * @param {string} region - 地域識別子
     * @returns {Promise<void>}
     */
    async function checkRequiredDirectories(region) {
        const facePath = `assets/face-data/${region}`;
        
        // テスト用の画像が存在するか確認
        const imageExists = await checkImageExists(`${facePath}/face1.jpg`);
        
        if (!imageExists) {
            console.warn(`Warning: No sample images found in ${facePath}`);
            // ディレクトリは存在するが中身がないかもしれないので警告だけ出す
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
     * 画像のサイズを最適化する
     * @param {string} imageDataUrl - 画像のデータURL
     * @returns {Promise<string>} - 最適化された画像のデータURL
     */
    function optimizeImageSize(imageDataUrl) {
        return new Promise((resolve, reject) => {
            // 入力チェック
            if (!imageDataUrl || typeof imageDataUrl !== 'string') {
                console.error('Invalid image data URL:', imageDataUrl);
                resolve(DEFAULT_FACE_IMAGE);
                return;
            }
            
            // 画像を生成
            const img = new Image();
            
            // タイムアウト処理
            const timeout = setTimeout(() => {
                console.warn('Image loading timeout, using default image');
                resolve(DEFAULT_FACE_IMAGE);
            }, 5000);
            
            img.onload = function() {
                clearTimeout(timeout);
                
                try {
                    // 元のサイズを取得
                    const originalWidth = img.width;
                    const originalHeight = img.height;
                    
                    // サイズが既に制限内なら変更しない
                    if (originalWidth <= MAX_IMAGE_WIDTH && originalHeight <= MAX_IMAGE_HEIGHT) {
                        resolve(imageDataUrl);
                        return;
                    }
                    
                    // 新しいサイズを計算（アスペクト比を維持）
                    let newWidth, newHeight;
                    
                    if (originalWidth > originalHeight) {
                        newWidth = MAX_IMAGE_WIDTH;
                        newHeight = Math.floor(originalHeight * (MAX_IMAGE_WIDTH / originalWidth));
                    } else {
                        newHeight = MAX_IMAGE_HEIGHT;
                        newWidth = Math.floor(originalWidth * (MAX_IMAGE_HEIGHT / originalHeight));
                    }
                    
                    // キャンバスを作成
                    const canvas = document.createElement('canvas');
                    canvas.width = newWidth;
                    canvas.height = newHeight;
                    
                    // 画像を描画
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, newWidth, newHeight);
                    
                    // 最適化された画像のデータURLを取得
                    const optimizedDataUrl = canvas.toDataURL('image/jpeg', 0.85); // 品質を下げる
                    
                    resolve(optimizedDataUrl);
                } catch (error) {
                    console.error('Error optimizing image:', error);
                    // エラー時はデフォルト画像を返す
                    resolve(DEFAULT_FACE_IMAGE);
                }
            };
            
            img.onerror = function() {
                clearTimeout(timeout);
                console.error('Failed to load image for optimization');
                // エラー時はデフォルト画像を返す
                resolve(DEFAULT_FACE_IMAGE);
            };
            
            img.src = imageDataUrl;
        });
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
                const name = names[i] || createFallbackName(region, i);
                const face = faces[i] || null;
                
                let faceUrl;
                try {
                    if (face && face.imageData) {
                        // FaceGenerator形式のデータ
                        // 画像サイズを最適化
                        faceUrl = await optimizeImageSize(face.imageData);
                    } else if (face) {
                        // 直接URLの場合
                        faceUrl = await optimizeImageSize(face);
                    } else {
                        // データがない場合はデフォルト
                        faceUrl = DEFAULT_FACE_IMAGE;
                    }
                    
                    // 最終チェック
                    if (!faceUrl || faceUrl === 'undefined' || faceUrl === 'null') {
                        console.warn('Invalid face URL, using default');
                        faceUrl = DEFAULT_FACE_IMAGE;
                    }
                } catch (error) {
                    console.error('Error processing face:', error);
                    faceUrl = DEFAULT_FACE_IMAGE;
                }
                
                sessionState.facesAndNames.push({
                    id: name.id || `face-${i}`,
                    name: name,
                    faceUrl: faceUrl,
                    region: region,
                    faceData: face ? { ...face, imageData: null } : null // 生成器から取得した元データは保持するが画像データは取り除く
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
     * フォールバック用の名前データを作成
     * @param {string} region - 地域識別子
     * @param {number} index - インデックス
     * @returns {Object} - 名前オブジェクト
     */
    function createFallbackName(region, index) {
        // 地域ごとにデフォルト名を用意
        const defaultNames = {
            'japan': { firstName: '太郎', lastName: '田中' },
            'usa': { firstName: 'John', lastName: 'Smith' },
            'europe': { firstName: 'Hans', lastName: 'Mueller' },
            'asia': { firstName: 'Li', lastName: 'Wang' }
        };
        
        // 該当する地域のデフォルト名、または汎用名を返す
        const name = defaultNames[region] || { firstName: 'User', lastName: `${index + 1}` };
        
        return {
            id: `default-${region}-${index}`,
            firstName: name.firstName,
            lastName: name.lastName,
            gender: index % 2 === 0 ? 'male' : 'female',
            age: 25 + (index % 40)
        };
    }
    
    /**
     * 従来のFaceAPIを使用して顔画像をロード（フォールバック）
     * @param {string} region - 地域識別子
     * @param {number} count - ロードする顔の数
     * @returns {Promise<Array>} - 顔画像URLの配列
     */
    async function fallbackLoadFaces(region, count) {
        const faces = [];
        let errors = 0;
        
        for (let i = 0; i < count; i++) {
            try {
                // 最大試行回数を設定
                let retriesLeft = MAX_RETRIES;
                let success = false;
                let faceUrl = null;
                
                // リトライループ
                while (retriesLeft > 0 && !success) {
                    try {
                        // APIから顔画像を取得
                        faceUrl = await window.FaceAPI.getFace(region);
                        
                        // フォールバック用のローカル画像チェック
                        if (!faceUrl || faceUrl.includes('undefined') || faceUrl.includes('null')) {
                            // ローカルダミー画像のパスを構築
                            const dummyIndex = (i % 5) + 1; // 1-5の範囲
                            const localPath = `assets/face-data/${region}/face${dummyIndex}.jpg`;
                            
                            // 画像の存在を確認
                            const exists = await checkImageExists(localPath);
                            if (exists) {
                                faceUrl = localPath;
                                success = true;
                            } else {
                                throw new Error(`Local dummy image not found: ${localPath}`);
                            }
                        } else {
                            success = true;
                        }
                    } catch (error) {
                        retriesLeft--;
                        console.warn(`Retry left ${retriesLeft} for face ${i}:`, error);
                        // リトライ前に少し待機
                        await new Promise(resolve => setTimeout(resolve, 500));
                    }
                }
                
                if (!success) {
                    throw new Error(`Failed to load face image after ${MAX_RETRIES} retries`);
                }
                
                // 画像サイズを最適化（最適化プロセスがエラーになってもデフォルト画像が返るようになっている）
                const optimizedUrl = await optimizeImageSize(faceUrl);
                faces.push(optimizedUrl);
            } catch (error) {
                console.error('Error loading face image:', error);
                errors++;
                
                // エラー時はダミー画像を使用
                // 地域ごとのダミー画像をインデックスによって変える
                const dummyIndex = (i % 5) + 1; // 1-5の範囲で循環
                const fallbackPath = `assets/face-data/${region}/face${dummyIndex}.jpg`;
                
                // 存在チェック
                const fallbackExists = await checkImageExists(fallbackPath);
                
                if (fallbackExists) {
                    faces.push(fallbackPath);
                } else {
                    // 最終フォールバック
                    faces.push(DEFAULT_FACE_IMAGE);
                }
            }
            
            // ロード進捗を更新
            if (window.Modal.updateMessage) {
                const progress = Math.round((i + 1) / count * 100);
                window.Modal.updateMessage(`顔と名前のデータをロードしています... ${progress}%`);
            }
        }
        
        // エラーが多すぎる場合は警告
        if (errors > count / 2) {
            console.warn(`Warning: High error rate (${errors}/${count}) loading faces`);
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
            // 画像のエラーハンドリングを追加
            faceImageElement.onerror = function() {
                console.error(`Error loading image: ${currentPair.faceUrl}`);
                // デフォルト画像にフォールバック
                if (faceImageElement.src !== DEFAULT_FACE_IMAGE) {
                    faceImageElement.src = DEFAULT_FACE_IMAGE;
                }
            };
            
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
    async function saveSession() {
        if (sessionState.isActive) {
            try {
                // セッションデータをIndexedDBに保存
                await window.Storage.saveSession({
                    region: sessionState.region,
                    difficulty: sessionState.difficulty,
                    currentIndex: sessionState.currentIndex,
                    facesAndNames: sessionState.facesAndNames,
                    timePerFace: sessionState.timePerFace
                });
                console.log('セッションデータを保存しました');
            } catch (error) {
                console.error('セッションデータの保存に失敗しました:', error);
            }
        }
    }
    
    /**
     * 保存されたセッションを復元
     * @returns {Promise<boolean>} - セッションが復元されたかどうか
     */
    async function restoreSession() {
        try {
            const savedSession = await window.Storage.getSession();
            
            if (!savedSession) {
                return false;
            }
            
            // 復元するか確認
            const confirmed = await window.Modal.confirm(
                '前回の学習セッションを再開しますか？',
                'セッション復元'
            );
            
            if (!confirmed) {
                await window.Storage.clearSession();
                return false;
            }
            
            // セッション状態を復元
            sessionState = {
                region: savedSession.region,
                difficulty: savedSession.difficulty,
                currentIndex: savedSession.currentIndex,
                facesAndNames: savedSession.facesAndNames || [],
                timePerFace: savedSession.timePerFace || 10,
                isActive: true,
                stopTimer: null,
                isCompleted: false
            };
            
            // 復元したデータを検証
            validateRestoredSession();
            
            // UI要素を更新
            updateUI();
            
            // セクションを表示
            window.UIManager.showSection('learning-screen');
            
            // タイマーを開始
            startFaceTimer();
            
            return true;
        } catch (error) {
            console.error('セッションの復元に失敗しました:', error);
            return false;
        }
    }
    
    /**
     * 復元したセッションデータを検証
     */
    function validateRestoredSession() {
        // 検証に失敗した場合は初期値を設定
        if (!sessionState.region || !sessionState.difficulty) {
            sessionState.region = 'japan';
            sessionState.difficulty = 5;
        }
        
        // facesAndNamesの検証
        if (!Array.isArray(sessionState.facesAndNames) || sessionState.facesAndNames.length === 0) {
            sessionState.facesAndNames = [];
            // 空の場合は新しいセッションを開始する必要がある
            console.warn('Restored session has no face data, a new session should be started');
        } else {
            // 各顔データを検証
            sessionState.facesAndNames = sessionState.facesAndNames.map((pair, index) => {
                // 最低限の必須フィールドを持つか確認
                if (!pair || !pair.name) {
                    // 不正なデータの場合はフォールバック
                    return {
                        id: `restored-${index}`,
                        name: createFallbackName(sessionState.region, index),
                        faceUrl: DEFAULT_FACE_IMAGE,
                        region: sessionState.region,
                        faceData: null
                    };
                }
                
                // 画像URLの検証
                if (!pair.faceUrl || typeof pair.faceUrl !== 'string') {
                    pair.faceUrl = DEFAULT_FACE_IMAGE;
                }
                
                return pair;
            });
        }
        
        // currentIndexの検証
        if (typeof sessionState.currentIndex !== 'number' || 
            sessionState.currentIndex < 0 || 
            sessionState.currentIndex >= sessionState.facesAndNames.length) {
            sessionState.currentIndex = 0;
        }
        
        // timePerFaceの検証
        if (typeof sessionState.timePerFace !== 'number' || sessionState.timePerFace <= 0) {
            sessionState.timePerFace = 10;
        }
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
