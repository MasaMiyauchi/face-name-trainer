/**
 * 統計モジュール
 * ユーザーの学習進捗や成績を管理する
 */

const Stats = (function() {
    // 統計データ
    let statsData = {
        totalTests: 0,         // 総テスト回数
        averageScore: 0,       // 平均正解率（%）
        regionStats: {},       // 地域別統計
        weakFaces: [],         // 苦手な顔のリスト
        recentResults: [],     // 最近のテスト結果
        lastTestDate: null     // 最後にテストした日時
    };
    
    // 最大保持する最近の結果数
    const MAX_RECENT_RESULTS = 10;
    
    /**
     * 初期化関数
     */
    function init() {
        // ローカルストレージから統計データを読み込む
        loadStats();
    }
    
    /**
     * 統計データを読み込む
     */
    function loadStats() {
        const loadedStats = window.Storage.getStats();
        
        if (loadedStats) {
            statsData = {
                ...statsData,
                ...loadedStats
            };
        }
    }
    
    /**
     * テスト結果を追加して統計を更新
     * @param {Object} testResult - テスト結果データ
     */
    function addTestResult(testResult) {
        const { region, correctCount, totalCount, faces, timestamp } = testResult;
        
        // 総テスト回数を更新
        statsData.totalTests += 1;
        
        // 平均正解率を更新
        const score = (correctCount / totalCount) * 100;
        const totalScore = (statsData.averageScore * (statsData.totalTests - 1)) + score;
        statsData.averageScore = totalScore / statsData.totalTests;
        
        // 地域別統計を更新
        if (!statsData.regionStats[region]) {
            statsData.regionStats[region] = {
                tests: 0,
                averageScore: 0,
                lastTestDate: null
            };
        }
        
        const regionStat = statsData.regionStats[region];
        regionStat.tests += 1;
        
        const regionTotalScore = (regionStat.averageScore * (regionStat.tests - 1)) + score;
        regionStat.averageScore = regionTotalScore / regionStat.tests;
        regionStat.lastTestDate = timestamp || new Date().getTime();
        
        // 苦手な顔を更新
        updateWeakFaces(faces, region);
        
        // 最近の結果を更新
        addRecentResult(testResult);
        
        // 最後のテスト日時を更新
        statsData.lastTestDate = timestamp || new Date().getTime();
        
        // 統計データを保存
        saveStats();
    }
    
    /**
     * 苦手な顔のリストを更新
     * @param {Array<Object>} faces - テストした顔のリスト
     * @param {string} region - 地域
     */
    function updateWeakFaces(faces, region) {
        // 不正解だった顔を抽出
        const incorrectFaces = faces.filter(face => !face.correct);
        
        // 既存の苦手な顔リストとマージ
        for (const face of incorrectFaces) {
            // 同じ顔が既に登録されているか探す
            const existingIndex = statsData.weakFaces.findIndex(wf => 
                wf.faceUrl === face.faceUrl && 
                wf.name.id === face.name.id
            );
            
            if (existingIndex >= 0) {
                // 既存の顔の出現回数を更新
                statsData.weakFaces[existingIndex].count += 1;
                statsData.weakFaces[existingIndex].lastIncorrect = new Date().getTime();
            } else {
                // 新しい苦手な顔を追加
                statsData.weakFaces.push({
                    faceUrl: face.faceUrl,
                    name: face.name,
                    region: region,
                    count: 1,
                    lastIncorrect: new Date().getTime()
                });
            }
        }
        
        // 一定期間（3ヶ月）経過したものを除外
        const threeMonthsAgo = new Date().getTime() - (3 * 30 * 24 * 60 * 60 * 1000);
        statsData.weakFaces = statsData.weakFaces.filter(
            face => face.lastIncorrect >= threeMonthsAgo
        );
        
        // 回数の多い順にソート
        statsData.weakFaces.sort((a, b) => b.count - a.count);
        
        // 最大数を制限（上位20個）
        if (statsData.weakFaces.length > 20) {
            statsData.weakFaces = statsData.weakFaces.slice(0, 20);
        }
    }
    
    /**
     * 最近のテスト結果を追加
     * @param {Object} testResult - テスト結果データ
     */
    function addRecentResult(testResult) {
        // タイムスタンプを追加
        const resultWithTimestamp = {
            ...testResult,
            timestamp: testResult.timestamp || new Date().getTime()
        };
        
        // 先頭に追加
        statsData.recentResults.unshift(resultWithTimestamp);
        
        // 最大数を制限
        if (statsData.recentResults.length > MAX_RECENT_RESULTS) {
            statsData.recentResults = statsData.recentResults.slice(0, MAX_RECENT_RESULTS);
        }
    }
    
    /**
     * 統計データを保存
     */
    function saveStats() {
        window.Storage.save(window.Storage.KEYS.STATS, statsData);
    }
    
    /**
     * 統計データを取得
     * @returns {Object} - 統計データ
     */
    function getStats() {
        return { ...statsData };
    }
    
    /**
     * 地域別の統計データを取得
     * @param {string} region - 地域識別子
     * @returns {Object|null} - 地域の統計データまたはnull
     */
    function getRegionStats(region) {
        return statsData.regionStats[region] ? { ...statsData.regionStats[region] } : null;
    }
    
    /**
     * 苦手な顔のリストを取得
     * @param {string} region - 地域識別子（省略時はすべての地域）
     * @param {number} limit - 取得する最大数（省略時はすべて）
     * @returns {Array<Object>} - 苦手な顔のリスト
     */
    function getWeakFaces(region = null, limit = null) {
        let weakFaces = [...statsData.weakFaces];
        
        // 地域でフィルタリング
        if (region) {
            weakFaces = weakFaces.filter(face => face.region === region);
        }
        
        // 数を制限
        if (limit && limit > 0 && weakFaces.length > limit) {
            weakFaces = weakFaces.slice(0, limit);
        }
        
        return weakFaces;
    }
    
    /**
     * 最近のテスト結果を取得
     * @param {number} limit - 取得する最大数（省略時はすべて）
     * @returns {Array<Object>} - 最近のテスト結果のリスト
     */
    function getRecentResults(limit = null) {
        let recentResults = [...statsData.recentResults];
        
        // 数を制限
        if (limit && limit > 0 && recentResults.length > limit) {
            recentResults = recentResults.slice(0, limit);
        }
        
        return recentResults;
    }
    
    /**
     * 学習の進捗状況を計算（0-100の値）
     * @returns {number} - 進捗パーセンテージ
     */
    function calculateProgress() {
        // 基本的な進捗計算のロジック例
        // 1. テスト回数（最大30回で100%とする）
        const testProgress = Math.min(statsData.totalTests / 30, 1) * 0.3;
        
        // 2. 平均正解率（100%で満点）
        const scoreProgress = (statsData.averageScore / 100) * 0.5;
        
        // 3. 地域カバレッジ（すべての地域でテストすると100%）
        const totalRegions = 4; // 日本、アメリカ、ヨーロッパ、アジア
        const coveredRegions = Object.keys(statsData.regionStats).length;
        const regionProgress = (coveredRegions / totalRegions) * 0.2;
        
        // 合計進捗（0-1の値）
        const totalProgress = testProgress + scoreProgress + regionProgress;
        
        // パーセント表示（0-100）に変換して返す
        return Math.round(totalProgress * 100);
    }
    
    /**
     * 統計データをリセット
     */
    function resetStats() {
        statsData = {
            totalTests: 0,
            averageScore: 0,
            regionStats: {},
            weakFaces: [],
            recentResults: [],
            lastTestDate: null
        };
        
        saveStats();
    }
    
    // 公開API
    return {
        init,
        addTestResult,
        getStats,
        getRegionStats,
        getWeakFaces,
        getRecentResults,
        calculateProgress,
        resetStats
    };
})();

// グローバルオブジェクトとしてエクスポート
window.Stats = Stats;