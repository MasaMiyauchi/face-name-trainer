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
