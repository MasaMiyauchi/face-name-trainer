/**
 * IndexedDB ストレージモジュール
 * localStorage容量制限を超えるデータを保存するためのIndexedDBラッパー
 */

const IDBStorage = (function() {
    const DB_NAME = 'faceTrainerDB';
    const DB_VERSION = 1;
    const STORE_NAME = 'faceTrainerStore';
    
    let db = null;
    
    /**
     * データベースを初期化
     * @returns {Promise} - 初期化が完了したらresolveするPromise
     */
    function init() {
        return new Promise((resolve, reject) => {
            if (db) {
                resolve(db);
                return;
            }
            
            const request = indexedDB.open(DB_NAME, DB_VERSION);
            
            request.onerror = (event) => {
                console.error('IndexedDB error:', event.target.error);
                reject(event.target.error);
            };
            
            request.onsuccess = (event) => {
                db = event.target.result;
                resolve(db);
            };
            
            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                
                // データストアを作成
                if (!db.objectStoreNames.contains(STORE_NAME)) {
                    db.createObjectStore(STORE_NAME, { keyPath: 'key' });
                }
            };
        });
    }
    
    /**
     * データを保存
     * @param {string} key - 保存するデータのキー
     * @param {*} value - 保存する値
     * @returns {Promise} - 保存が完了したらresolveするPromise
     */
    function save(key, value) {
        return new Promise(async (resolve, reject) => {
            try {
                await init();
                
                const transaction = db.transaction([STORE_NAME], 'readwrite');
                const store = transaction.objectStore(STORE_NAME);
                
                const request = store.put({ key, value });
                
                request.onsuccess = () => {
                    resolve(true);
                };
                
                request.onerror = (event) => {
                    console.error('Error saving to IndexedDB:', event.target.error);
                    reject(event.target.error);
                };
            } catch (error) {
                console.error('Error in save operation:', error);
                reject(error);
            }
        });
    }
    
    /**
     * データを取得
     * @param {string} key - 取得するデータのキー
     * @param {*} defaultValue - データが存在しない場合のデフォルト値
     * @returns {Promise} - 取得したデータでresolveするPromise
     */
    function load(key, defaultValue = null) {
        return new Promise(async (resolve, reject) => {
            try {
                await init();
                
                const transaction = db.transaction([STORE_NAME], 'readonly');
                const store = transaction.objectStore(STORE_NAME);
                
                const request = store.get(key);
                
                request.onsuccess = (event) => {
                    const result = event.target.result;
                    if (result) {
                        resolve(result.value);
                    } else {
                        resolve(defaultValue);
                    }
                };
                
                request.onerror = (event) => {
                    console.error('Error loading from IndexedDB:', event.target.error);
                    reject(event.target.error);
                };
            } catch (error) {
                console.error('Error in load operation:', error);
                reject(error);
            }
        });
    }
    
    /**
     * データを削除
     * @param {string} key - 削除するデータのキー
     * @returns {Promise} - 削除が完了したらresolveするPromise
     */
    function remove(key) {
        return new Promise(async (resolve, reject) => {
            try {
                await init();
                
                const transaction = db.transaction([STORE_NAME], 'readwrite');
                const store = transaction.objectStore(STORE_NAME);
                
                const request = store.delete(key);
                
                request.onsuccess = () => {
                    resolve(true);
                };
                
                request.onerror = (event) => {
                    console.error('Error removing from IndexedDB:', event.target.error);
                    reject(event.target.error);
                };
            } catch (error) {
                console.error('Error in remove operation:', error);
                reject(error);
            }
        });
    }
    
    /**
     * データベースをクリア
     * @returns {Promise} - クリアが完了したらresolveするPromise
     */
    function clear() {
        return new Promise(async (resolve, reject) => {
            try {
                await init();
                
                const transaction = db.transaction([STORE_NAME], 'readwrite');
                const store = transaction.objectStore(STORE_NAME);
                
                const request = store.clear();
                
                request.onsuccess = () => {
                    resolve(true);
                };
                
                request.onerror = (event) => {
                    console.error('Error clearing IndexedDB:', event.target.error);
                    reject(event.target.error);
                };
            } catch (error) {
                console.error('Error in clear operation:', error);
                reject(error);
            }
        });
    }
    
    // 公開API
    return {
        init,
        save,
        load,
        remove,
        clear
    };
})();

// グローバルオブジェクトとしてエクスポート
window.IDBStorage = IDBStorage;