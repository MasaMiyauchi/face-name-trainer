/**
 * ローカルストレージ管理モジュール
 * アプリケーションのデータをローカルストレージに保存・取得するための機能を提供
 */

const Storage = (function() {
    // 保存するデータの種類に応じたキープレフィックス
    const KEYS = {
        STATS: 'faceTrainer.stats',
        SETTINGS: 'faceTrainer.settings',
        TRAINING_SESSION: 'faceTrainer.session',
        RESULTS: 'faceTrainer.results',
        LAST_REGION: 'faceTrainer.lastRegion',
        LAST_DIFFICULTY: 'faceTrainer.lastDifficulty',
        WEAK_FACES: 'faceTrainer.weakFaces'
    };
    
    /**
     * データをローカルストレージに保存
     * @param {string} key - 保存するデータのキー
     * @param {*} value - 保存する値（オブジェクトは自動的にJSON文字列化される）
     * @returns {boolean} - 保存が成功したかどうか
     */
    function save(key, value) {
        try {
            const serializedValue = JSON.stringify(value);
            localStorage.setItem(key, serializedValue);
            return true;
        } catch (error) {
            console.error('Error saving to localStorage:', error);
            return false;
        }
    }
    
    /**
     * ローカルストレージからデータを取得
     * @param {string} key - 取得するデータのキー
     * @param {*} defaultValue - データが存在しない場合のデフォルト値
     * @returns {*} - 取得したデータ（JSONとして保存されていた場合は解析される）
     */
    function load(key, defaultValue = null) {
        try {
            const serializedValue = localStorage.getItem(key);
            if (serializedValue === null) {
                return defaultValue;
            }
            return JSON.parse(serializedValue);
        } catch (error) {
            console.error('Error loading from localStorage:', error);
            return defaultValue;
        }
    }
    
    /**
     * 指定されたキーのデータをローカルストレージから削除
     * @param {string} key - 削除するデータのキー
     * @returns {boolean} - 削除が成功したかどうか
     */
    function remove(key) {
        try {
            localStorage.removeItem(key);
            return true;
        } catch (error) {
            console.error('Error removing from localStorage:', error);
            return false;
        }
    }
    
    /**
     * ローカルストレージの内容をすべて消去
     * @returns {boolean} - 消去が成功したかどうか
     */
    function clear() {
        try {
            localStorage.clear();
            return true;
        } catch (error) {
            console.error('Error clearing localStorage:', error);
            return false;
        }
    }
    
    /**
     * テスト結果を保存
     * @param {Object} resultData - テスト結果データ
     * @returns {boolean} - 保存が成功したかどうか
     */
    function saveTestResult(resultData) {
        // 既存の結果を取得
        const results = load(KEYS.RESULTS, []);
        
        // タイムスタンプを追加
        const resultWithTimestamp = {
            ...resultData,
            timestamp: new Date().getTime()
        };
        
        // 新しい結果を追加
        results.push(resultWithTimestamp);
        
        // 結果を保存
        return save(KEYS.RESULTS, results);
    }
    
    /**
     * 統計データを取得
     * @returns {Object} - 統計データ
     */
    function getStats() {
        return load(KEYS.STATS, {
            totalTests: 0,
            averageScore: 0,
            regionStats: {},
            weakFaces: []
        });
    }
    
    /**
     * 統計データを更新
     * @param {Object} testResult - テスト結果データ
     * @returns {boolean} - 更新が成功したかどうか
     */
    function updateStats(testResult) {
        const stats = getStats();
        const { region, correctCount, totalCount, faces } = testResult;
        
        // 総テスト回数を更新
        stats.totalTests += 1;
        
        // 平均正解率を更新
        const totalCorrect = (stats.averageScore * (stats.totalTests - 1) / 100) + correctCount;
        stats.averageScore = (totalCorrect / stats.totalTests) * 100;
        
        // 地域別統計を更新
        if (!stats.regionStats[region]) {
            stats.regionStats[region] = {
                tests: 0,
                averageScore: 0
            };
        }
        
        const regionStat = stats.regionStats[region];
        regionStat.tests += 1;
        
        const regionTotalCorrect = (regionStat.averageScore * (regionStat.tests - 1) / 100) + correctCount;
        regionStat.averageScore = (regionTotalCorrect / regionStat.tests) * 100;
        
        // 苦手な顔を更新
        const incorrectFaces = faces.filter(face => !face.correct);
        for (const face of incorrectFaces) {
            const existingWeakFace = stats.weakFaces.find(wf => wf.faceId === face.faceId);
            
            if (existingWeakFace) {
                existingWeakFace.count += 1;
            } else {
                stats.weakFaces.push({
                    faceId: face.faceId,
                    faceUrl: face.faceUrl,
                    name: face.name,
                    region: region,
                    count: 1
                });
            }
        }
        
        // 苦手な顔を出現回数の降順にソート
        stats.weakFaces.sort((a, b) => b.count - a.count);
        
        // 統計を保存
        return save(KEYS.STATS, stats);
    }
    
    /**
     * 最後に使用した地域を保存
     * @param {string} region - 地域識別子
     * @returns {boolean} - 保存が成功したかどうか
     */
    function saveLastRegion(region) {
        return save(KEYS.LAST_REGION, region);
    }
    
    /**
     * 最後に使用した地域を取得
     * @returns {string|null} - 地域識別子またはnull
     */
    function getLastRegion() {
        return load(KEYS.LAST_REGION, null);
    }
    
    /**
     * 最後に使用した難易度を保存
     * @param {number} difficulty - 難易度（人数）
     * @returns {boolean} - 保存が成功したかどうか
     */
    function saveLastDifficulty(difficulty) {
        return save(KEYS.LAST_DIFFICULTY, difficulty);
    }
    
    /**
     * 最後に使用した難易度を取得
     * @returns {number|null} - 難易度（人数）またはnull
     */
    function getLastDifficulty() {
        return load(KEYS.LAST_DIFFICULTY, null);
    }
    
    /**
     * トレーニングセッションデータを保存（学習モードでの中断用）
     * @param {Object} sessionData - セッションデータ
     * @returns {Promise<boolean>} - 保存が成功したかどうかを返すPromise
     */
    function saveSession(sessionData) {
        // セッションデータはサイズが大きくなる可能性があるため、IndexedDBを使用
        return window.IDBStorage.save(KEYS.TRAINING_SESSION, sessionData);
    }
    
    /**
     * トレーニングセッションデータを取得
     * @returns {Promise<Object|null>} - セッションデータまたはnullを返すPromise
     */
    async function getSession() {
        try {
            // まずIndexedDBから取得を試みる
            const sessionData = await window.IDBStorage.load(KEYS.TRAINING_SESSION, null);
            return sessionData;
        } catch (error) {
            console.error('Error loading session from IndexedDB:', error);
            
            // フォールバックとしてlocalStorageを確認
            const legacySession = load(KEYS.TRAINING_SESSION, null);
            if (legacySession) {
                console.log('Loaded session data from localStorage (legacy storage)');
                
                // 見つかったlocalStorageのデータをIndexedDBに移行
                try {
                    await window.IDBStorage.save(KEYS.TRAINING_SESSION, legacySession);
                    // 移行後にlocalStorageからは削除
                    remove(KEYS.TRAINING_SESSION);
                    console.log('Migrated session data from localStorage to IndexedDB');
                } catch (migrateError) {
                    console.error('Failed to migrate session data to IndexedDB:', migrateError);
                }
                
                return legacySession;
            }
            
            return null;
        }
    }
    
    /**
     * トレーニングセッションデータを削除
     * @returns {Promise<boolean>} - 削除が成功したかどうかを返すPromise
     */
    async function clearSession() {
        try {
            // IndexedDBからの削除を試みる
            await window.IDBStorage.remove(KEYS.TRAINING_SESSION);
            
            // フォールバックとしてlocalStorageからも削除
            remove(KEYS.TRAINING_SESSION);
            
            return true;
        } catch (error) {
            console.error('Error clearing session data:', error);
            return false;
        }
    }
    
    // 公開API
    return {
        save,
        load,
        remove,
        clear,
        saveTestResult,
        getStats,
        updateStats,
        saveLastRegion,
        getLastRegion,
        saveLastDifficulty,
        getLastDifficulty,
        saveSession,
        getSession,
        clearSession,
        KEYS
    };
})();

// グローバルオブジェクトとしてエクスポート
window.Storage = Storage;