/**
 * storage-tester.js
 * ブラウザのストレージ機能をテストするためのユーティリティ
 */

const StorageTester = (function() {
    // テスト結果の保存
    let testResults = {
        localStorage: false,
        indexedDB: false,
        quota: 0
    };

    /**
     * ローカルストレージの機能をテスト
     * @returns {Promise<boolean>} - テスト結果（成功/失敗）
     */
    async function testLocalStorage() {
        try {
            const testKey = '_test_ls_' + Date.now();
            const testValue = 'テストデータ_' + Math.random();
            
            // データを書き込み
            localStorage.setItem(testKey, testValue);
            
            // データを読み込み
            const readValue = localStorage.getItem(testKey);
            
            // テスト後にデータを削除
            localStorage.removeItem(testKey);
            
            // 読み込んだ値が書き込んだ値と一致するか確認
            const success = readValue === testValue;
            testResults.localStorage = success;
            
            console.log('LocalStorage test ' + (success ? 'passed' : 'failed'));
            return success;
        } catch (error) {
            console.error('LocalStorage test failed:', error);
            testResults.localStorage = false;
            return false;
        }
    }

    /**
     * IndexedDBの機能をテスト
     * @returns {Promise<boolean>} - テスト結果（成功/失敗）
     */
    async function testIndexedDB() {
        return new Promise((resolve) => {
            try {
                // IndexedDBが存在するか確認
                if (!window.indexedDB) {
                    console.error('IndexedDB is not supported in this browser');
                    testResults.indexedDB = false;
                    resolve(false);
                    return;
                }
                
                const testDbName = '_test_idb_' + Date.now();
                const request = indexedDB.open(testDbName, 1);
                
                request.onerror = function(event) {
                    console.error('IndexedDB test failed:', event.target.error);
                    testResults.indexedDB = false;
                    resolve(false);
                };
                
                request.onupgradeneeded = function(event) {
                    const db = event.target.result;
                    db.createObjectStore('testStore');
                };
                
                request.onsuccess = function(event) {
                    const db = event.target.result;
                    
                    try {
                        const transaction = db.transaction(['testStore'], 'readwrite');
                        const store = transaction.objectStore('testStore');
                        
                        // データを追加
                        const testData = { id: 1, value: 'テストデータ_' + Math.random() };
                        const addRequest = store.add(testData, 'testKey');
                        
                        addRequest.onsuccess = function() {
                            // データを読み込み
                            const getRequest = store.get('testKey');
                            
                            getRequest.onsuccess = function() {
                                const readData = getRequest.result;
                                
                                // データが正しく保存・読み取りできたか確認
                                const success = readData && readData.id === testData.id && readData.value === testData.value;
                                testResults.indexedDB = success;
                                
                                // テスト用DBを閉じて削除
                                db.close();
                                indexedDB.deleteDatabase(testDbName);
                                
                                console.log('IndexedDB test ' + (success ? 'passed' : 'failed'));
                                resolve(success);
                            };
                            
                            getRequest.onerror = function(e) {
                                console.error('IndexedDB get failed:', e.target.error);
                                db.close();
                                indexedDB.deleteDatabase(testDbName);
                                testResults.indexedDB = false;
                                resolve(false);
                            };
                        };
                        
                        addRequest.onerror = function(e) {
                            console.error('IndexedDB add failed:', e.target.error);
                            db.close();
                            indexedDB.deleteDatabase(testDbName);
                            testResults.indexedDB = false;
                            resolve(false);
                        };
                        
                    } catch (e) {
                        console.error('IndexedDB transaction failed:', e);
                        db.close();
                        indexedDB.deleteDatabase(testDbName);
                        testResults.indexedDB = false;
                        resolve(false);
                    }
                };
            } catch (error) {
                console.error('IndexedDB test exception:', error);
                testResults.indexedDB = false;
                resolve(false);
            }
        });
    }

    /**
     * ストレージの容量推定（近似値）
     * @returns {Promise<number>} - 利用可能なストレージ容量（バイト単位）
     */
    async function estimateStorageQuota() {
        try {
            // navigator.storage APIがサポートされているか確認
            if (navigator.storage && navigator.storage.estimate) {
                const estimate = await navigator.storage.estimate();
                testResults.quota = estimate.quota || 0;
                return estimate.quota || 0;
            } else {
                // フォールバック：ローカルストレージの容量を推定
                const testKey = '_quota_test_';
                const testValue = 'a';
                let testData = '';
                let i = 0;
                
                try {
                    // 少しずつデータを追加してエラーになるまで試す
                    while (true) {
                        testData += testValue.repeat(1024); // 1KBずつ増加
                        localStorage.setItem(testKey, testData);
                        i++;
                        
                        // 安全のため、10MBを超えたら強制終了
                        if (i > 10240) {
                            break;
                        }
                    }
                } catch (e) {
                    // エラーが発生したら現在のサイズを容量として推定
                }
                
                // テストデータを削除
                localStorage.removeItem(testKey);
                
                const estimatedQuota = Math.max(i * 1024, 5 * 1024 * 1024); // 最低5MBとして推定
                testResults.quota = estimatedQuota;
                return estimatedQuota;
            }
        } catch (error) {
            console.error('Storage quota estimation failed:', error);
            testResults.quota = 5 * 1024 * 1024; // エラー時は5MBと仮定
            return testResults.quota;
        }
    }

    /**
     * すべてのストレージ機能をテスト
     * @returns {Promise<Object>} - テスト結果オブジェクト
     */
    async function testAll() {
        try {
            // ローカルストレージのテスト
            const lsResult = await testLocalStorage();
            
            // IndexedDBのテスト
            const idbResult = await testIndexedDB();
            
            // ストレージ容量の推定
            const quota = await estimateStorageQuota();
            
            // 結果を返す
            return {
                localStorage: lsResult,
                indexedDB: idbResult,
                quota: quota,
                success: lsResult && idbResult,
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            console.error('Storage tests failed:', error);
            return {
                localStorage: false,
                indexedDB: false,
                quota: 0,
                success: false,
                error: error.message,
                timestamp: new Date().toISOString()
            };
        }
    }

    /**
     * 最後のテスト結果を取得
     * @returns {Object} - テスト結果オブジェクト
     */
    function getTestResults() {
        return { ...testResults };
    }

    // 公開API
    return {
        testLocalStorage,
        testIndexedDB,
        estimateStorageQuota,
        testAll,
        getTestResults
    };
})();

// グローバルオブジェクトとしてエクスポート
window.StorageTester = StorageTester;