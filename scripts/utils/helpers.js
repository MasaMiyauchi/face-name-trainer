/**
 * ヘルパー関数モジュール
 * アプリケーション全体で使用される便利な汎用関数を提供
 */

const Helpers = (function() {
    /**
     * 配列をランダムにシャッフルする
     * @param {Array} array - シャッフルする配列
     * @returns {Array} - シャッフルされた新しい配列
     */
    function shuffleArray(array) {
        const newArray = [...array];
        for (let i = newArray.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
        }
        return newArray;
    }
    
    /**
     * ランダムな整数を生成する（最小値と最大値を含む）
     * @param {number} min - 最小値
     * @param {number} max - 最大値
     * @returns {number} - 生成されたランダムな整数
     */
    function getRandomInt(min, max) {
        min = Math.ceil(min);
        max = Math.floor(max);
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }
    
    /**
     * 配列からランダムに要素を選択する
     * @param {Array} array - 選択元の配列
     * @param {number} count - 選択する要素の数
     * @returns {Array} - 選択された要素の配列
     */
    function getRandomElements(array, count) {
        const shuffled = shuffleArray(array);
        return shuffled.slice(0, Math.min(count, array.length));
    }
    
    /**
     * 配列から指定された要素を除外した新しい配列を作成
     * @param {Array} array - 元の配列
     * @param {*} element - 除外する要素
     * @returns {Array} - 要素が除外された新しい配列
     */
    function removeElement(array, element) {
        return array.filter(item => item !== element);
    }
    
    /**
     * オブジェクトの配列から特定のプロパティの値を抽出
     * @param {Array<Object>} array - オブジェクトの配列
     * @param {string} property - 抽出するプロパティ名
     * @returns {Array} - 抽出されたプロパティ値の配列
     */
    function pluck(array, property) {
        return array.map(item => item[property]);
    }
    
    /**
     * 文字列の最初の文字を大文字にする
     * @param {string} str - 変換する文字列
     * @returns {string} - 最初の文字を大文字にした文字列
     */
    function capitalizeFirstLetter(str) {
        if (!str || typeof str !== 'string') return '';
        return str.charAt(0).toUpperCase() + str.slice(1);
    }
    
    /**
     * 日本語の名前を姓名の形式でフォーマットする
     * @param {Object} nameObj - 名前オブジェクト（{ firstName, lastName }）
     * @returns {string} - フォーマットされた名前
     */
    function formatJapaneseName(nameObj) {
        return `${nameObj.lastName} ${nameObj.firstName}`;
    }
    
    /**
     * 英語の名前をファーストネーム・ラストネームの形式でフォーマットする
     * @param {Object} nameObj - 名前オブジェクト（{ firstName, lastName }）
     * @returns {string} - フォーマットされた名前
     */
    function formatWesternName(nameObj) {
        return `${nameObj.firstName} ${nameObj.lastName}`;
    }
    
    /**
     * 地域に応じた名前フォーマット関数を選択
     * @param {string} region - 地域識別子
     * @returns {Function} - 選択されたフォーマット関数
     */
    function getNameFormatter(region) {
        switch (region) {
            case 'japan':
                return formatJapaneseName;
            default:
                return formatWesternName;
        }
    }
    
    /**
     * 配列内の要素の出現回数をカウントする
     * @param {Array} array - カウント対象の配列
     * @returns {Object} - 要素をキー、出現回数を値とするオブジェクト
     */
    function countOccurrences(array) {
        return array.reduce((acc, val) => {
            acc[val] = (acc[val] || 0) + 1;
            return acc;
        }, {});
    }
    
    /**
     * ミリ秒を「分:秒」形式に変換
     * @param {number} ms - ミリ秒
     * @returns {string} - 「分:秒」形式の文字列
     */
    function formatTime(ms) {
        const seconds = Math.floor(ms / 1000);
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    }
    
    /**
     * 数値を指定された範囲に制限する
     * @param {number} num - 対象の数値
     * @param {number} min - 最小値
     * @param {number} max - 最大値
     * @returns {number} - 制限された数値
     */
    function clamp(num, min, max) {
        return Math.min(Math.max(num, min), max);
    }
    
    // 公開API
    return {
        shuffleArray,
        getRandomInt,
        getRandomElements,
        removeElement,
        pluck,
        capitalizeFirstLetter,
        formatJapaneseName,
        formatWesternName,
        getNameFormatter,
        countOccurrences,
        formatTime,
        clamp
    };
})();

// グローバルオブジェクトとしてエクスポート
window.Helpers = Helpers;