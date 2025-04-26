/**
 * 難易度モジュール
 * アプリケーションの難易度設定を管理する
 */

const Difficulty = (function() {
    // 難易度レベルの定義
    const LEVELS = {
        EASY: {
            name: '初級',
            count: 5,
            timePerFace: 10  // 秒
        },
        MEDIUM: {
            name: '中級',
            count: 10,
            timePerFace: 8   // 秒
        },
        HARD: {
            name: '上級',
            count: 15,
            timePerFace: 6   // 秒
        }
    };
    
    // 現在の難易度
    let currentLevel = LEVELS.EASY;
    
    /**
     * 初期化関数
     * @param {string} defaultLevel - デフォルトの難易度レベル
     */
    function init(defaultLevel = 'EASY') {
        // デフォルトレベルを設定
        setLevel(defaultLevel);
        
        // ローカルストレージから保存された難易度を復元
        const savedCount = window.Storage.getLastDifficulty();
        if (savedCount) {
            setLevelByCount(savedCount);
        }
    }
    
    /**
     * 難易度レベルを設定
     * @param {string} levelKey - 難易度レベルのキー（'EASY', 'MEDIUM', 'HARD'）
     * @returns {Object} - 設定された難易度レベルオブジェクト
     */
    function setLevel(levelKey) {
        if (LEVELS[levelKey]) {
            currentLevel = LEVELS[levelKey];
            return currentLevel;
        } else {
            console.error(`Invalid difficulty level: ${levelKey}`);
            return currentLevel;
        }
    }
    
    /**
     * 顔の数から難易度レベルを設定
     * @param {number} count - 顔の数
     * @returns {Object} - 設定された難易度レベルオブジェクト
     */
    function setLevelByCount(count) {
        switch (count) {
            case LEVELS.EASY.count:
                return setLevel('EASY');
            case LEVELS.MEDIUM.count:
                return setLevel('MEDIUM');
            case LEVELS.HARD.count:
                return setLevel('HARD');
            default:
                // 一番近い難易度を探す
                const levelKeys = Object.keys(LEVELS);
                let closestLevel = levelKeys[0];
                let minDiff = Math.abs(LEVELS[levelKeys[0]].count - count);
                
                for (let i = 1; i < levelKeys.length; i++) {
                    const diff = Math.abs(LEVELS[levelKeys[i]].count - count);
                    if (diff < minDiff) {
                        minDiff = diff;
                        closestLevel = levelKeys[i];
                    }
                }
                
                return setLevel(closestLevel);
        }
    }
    
    /**
     * 現在の難易度レベルを取得
     * @returns {Object} - 現在の難易度レベルオブジェクト
     */
    function getCurrentLevel() {
        return currentLevel;
    }
    
    /**
     * 難易度レベルの人数を取得
     * @param {string} levelKey - 難易度レベルのキー（省略時は現在のレベル）
     * @returns {number} - 難易度レベルの人数
     */
    function getCount(levelKey = null) {
        if (levelKey && LEVELS[levelKey]) {
            return LEVELS[levelKey].count;
        }
        return currentLevel.count;
    }
    
    /**
     * 難易度レベルの1顔あたりの表示時間を取得
     * @param {string} levelKey - 難易度レベルのキー（省略時は現在のレベル）
     * @returns {number} - 難易度レベルの1顔あたりの表示時間（秒）
     */
    function getTimePerFace(levelKey = null) {
        if (levelKey && LEVELS[levelKey]) {
            return LEVELS[levelKey].timePerFace;
        }
        return currentLevel.timePerFace;
    }
    
    /**
     * 難易度レベルの名前を取得
     * @param {string} levelKey - 難易度レベルのキー（省略時は現在のレベル）
     * @returns {string} - 難易度レベルの名前
     */
    function getLevelName(levelKey = null) {
        if (levelKey && LEVELS[levelKey]) {
            return LEVELS[levelKey].name;
        }
        return currentLevel.name;
    }
    
    /**
     * 利用可能な難易度レベルの一覧を取得
     * @returns {Array<Object>} - 難易度レベルオブジェクトの配列
     */
    function getAllLevels() {
        return Object.keys(LEVELS).map(key => ({
            key: key,
            ...LEVELS[key]
        }));
    }
    
    /**
     * 人数から難易度レベルキーを取得
     * @param {number} count - 人数
     * @returns {string|null} - 難易度レベルのキー、該当なしならnull
     */
    function getLevelKeyByCount(count) {
        for (const key in LEVELS) {
            if (LEVELS[key].count === count) {
                return key;
            }
        }
        return null;
    }
    
    // 公開API
    return {
        init,
        setLevel,
        setLevelByCount,
        getCurrentLevel,
        getCount,
        getTimePerFace,
        getLevelName,
        getAllLevels,
        getLevelKeyByCount,
        LEVELS
    };
})();

// グローバルオブジェクトとしてエクスポート
window.Difficulty = Difficulty;