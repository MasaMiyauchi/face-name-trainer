/**
 * face-generator-metadata.js
 * 顔画像のメタデータ（性別、年齢など）の生成と管理を担当
 */

// FaceGeneratorConfig の参照が必要
const FaceGeneratorMetadata = (function() {
    /**
     * ランダムな性別を生成する（比率に基づく）
     * @returns {string} - 'male' または 'female'
     */
    function generateRandomGender() {
        const config = window.FaceGeneratorConfig || {};
        const GENDER_RATIO = config.GENDER_RATIO || { male: 2, female: 3 };
        
        const totalWeight = GENDER_RATIO.male + GENDER_RATIO.female;
        const randomValue = Math.random() * totalWeight;
        
        return randomValue < GENDER_RATIO.male ? 'male' : 'female';
    }
    
    /**
     * ランダムな年齢グループを生成する（比率に基づく）
     * @returns {string} - 年齢グループの識別子
     */
    function generateRandomAgeGroup() {
        const config = window.FaceGeneratorConfig || {};
        const AGE_RATIO = config.AGE_RATIO || { 
            teens: 1, 
            twenties: 3, 
            thirties: 2, 
            fourties_fifties: 3, 
            sixties_plus: 2
        };
        
        const ageGroups = Object.keys(AGE_RATIO);
        const weights = Object.values(AGE_RATIO);
        const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
        
        let randomValue = Math.random() * totalWeight;
        let cumulativeWeight = 0;
        
        for (let i = 0; i < ageGroups.length; i++) {
            cumulativeWeight += weights[i];
            if (randomValue < cumulativeWeight) {
                return ageGroups[i];
            }
        }
        
        // 念のためのフォールバック
        return ageGroups[0];
    }
    
    /**
     * 年齢グループから実際の年齢範囲を取得
     * @param {string} ageGroup - 年齢グループの識別子
     * @returns {Object} - 最小値と最大値のオブジェクト
     */
    function getAgeRange(ageGroup) {
        switch (ageGroup) {
            case 'teens':
                return { min: 13, max: 19 };
            case 'twenties':
                return { min: 20, max: 29 };
            case 'thirties':
                return { min: 30, max: 39 };
            case 'fourties_fifties':
                return { min: 40, max: 59 };
            case 'sixties_plus':
                return { min: 60, max: 85 };
            default:
                return { min: 20, max: 40 };
        }
    }
    
    /**
     * ランダムな年齢を生成する（年齢グループ内）
     * @param {string} ageGroup - 年齢グループの識別子
     * @returns {number} - 生成された年齢
     */
    function generateRandomAge(ageGroup) {
        const range = getAgeRange(ageGroup);
        return Math.floor(Math.random() * (range.max - range.min + 1)) + range.min;
    }
    
    /**
     * 一意のIDを生成
     * @returns {string} - 生成されたID
     */
    function generateUniqueId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
    }
    
    /**
     * 顔のメタデータを生成
     * @param {string} region - 地域識別子
     * @returns {Object} - 顔のメタデータ
     */
    function generateFaceMetadata(region) {
        const gender = generateRandomGender();
        const ageGroup = generateRandomAgeGroup();
        const age = generateRandomAge(ageGroup);
        
        return {
            id: generateUniqueId(),
            gender,
            age,
            ageGroup,
            region,
            created: new Date().toISOString(),
            filePath: null // 後で画像生成時に設定
        };
    }
    
    // 公開API
    return {
        generateRandomGender,
        generateRandomAgeGroup,
        getAgeRange,
        generateRandomAge,
        generateUniqueId,
        generateFaceMetadata
    };
})();

// グローバルオブジェクトとしてエクスポート
window.FaceGeneratorMetadata = FaceGeneratorMetadata;