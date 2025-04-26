/**
 * name-api.js
 * 各国・地域の名前データを取得するためのモジュール
 * ローカルのデータファイルから名前を取得します
 */

const NameAPI = (function() {
    // 名前データのキャッシュ
    let nameCache = {};
    
    /**
     * 指定した地域の名前データを取得
     * @param {string} region - 地域識別子（例: 'japan', 'usa', 'europe', 'asia'）
     * @returns {Promise<Array<Object>>} - 名前データの配列
     */
    async function getNames(region) {
        // キャッシュチェック
        if (nameCache[region]) {
            return nameCache[region];
        }
        
        try {
            // 地域に基づいて適切なデータモジュールをインポート
            let names;
            
            switch (region) {
                case 'japan':
                    names = window.JapaneseNames || [];
                    break;
                case 'usa':
                    names = window.AmericanNames || [];
                    break;
                case 'europe':
                    // ヨーロッパの名前データが利用可能になった場合
                    names = window.EuropeanNames || [];
                    break;
                case 'asia':
                    // アジアの名前データが利用可能になった場合
                    names = window.AsianNames || [];
                    break;
                default:
                    // デフォルトとして日本の名前を使用
                    names = window.JapaneseNames || [];
            }
            
            // データがない場合はダミーデータを生成
            if (!names || names.length === 0) {
                names = generateDummyNames(region);
            }
            
            // キャッシュに保存
            nameCache[region] = names;
            
            return names;
        } catch (error) {
            console.error(`Error loading names for region ${region}:`, error);
            // エラー時はダミーデータを返す
            return generateDummyNames(region);
        }
    }
    
    /**
     * 指定された数の名前をランダムに取得
     * @param {string} region - 地域識別子
     * @param {number} count - 取得する名前の数
     * @returns {Promise<Array<Object>>} - ランダムに選択された名前の配列
     */
    async function getRandomNames(region, count = 10) {
        const allNames = await getNames(region);
        
        // 必要な数の名前をランダムに選択
        const selectedNames = [];
        const availableIndices = Array.from({ length: allNames.length }, (_, i) => i);
        
        for (let i = 0; i < Math.min(count, allNames.length); i++) {
            // 残りのインデックスからランダムに選択
            const randomIndex = Math.floor(Math.random() * availableIndices.length);
            const nameIndex = availableIndices.splice(randomIndex, 1)[0];
            
            selectedNames.push(allNames[nameIndex]);
        }
        
        return selectedNames;
    }
    
    /**
     * ダミーの名前データを生成
     * @param {string} region - 地域識別子
     * @returns {Array<Object>} - 生成された名前データ
     */
    function generateDummyNames(region) {
        const dummyNames = [];
        
        // 地域に基づいてダミーデータを生成
        switch (region) {
            case 'japan':
                dummyNames.push(
                    { id: 1, firstName: '太郎', lastName: '山田', gender: 'male' },
                    { id: 2, firstName: '花子', lastName: '佐藤', gender: 'female' },
                    { id: 3, firstName: '一郎', lastName: '鈴木', gender: 'male' },
                    { id: 4, firstName: '恵子', lastName: '田中', gender: 'female' },
                    { id: 5, firstName: '健太', lastName: '伊藤', gender: 'male' }
                );
                break;
            case 'usa':
                dummyNames.push(
                    { id: 1, firstName: 'John', lastName: 'Smith', gender: 'male' },
                    { id: 2, firstName: 'Mary', lastName: 'Johnson', gender: 'female' },
                    { id: 3, firstName: 'James', lastName: 'Williams', gender: 'male' },
                    { id: 4, firstName: 'Jennifer', lastName: 'Brown', gender: 'female' },
                    { id: 5, firstName: 'Robert', lastName: 'Jones', gender: 'male' }
                );
                break;
            case 'europe':
                dummyNames.push(
                    { id: 1, firstName: 'Pierre', lastName: 'Dubois', gender: 'male' },
                    { id: 2, firstName: 'Sophie', lastName: 'Müller', gender: 'female' },
                    { id: 3, firstName: 'Antonio', lastName: 'Rossi', gender: 'male' },
                    { id: 4, firstName: 'Isabella', lastName: 'Garcia', gender: 'female' },
                    { id: 5, firstName: 'Hans', lastName: 'Schmidt', gender: 'male' }
                );
                break;
            case 'asia':
                dummyNames.push(
                    { id: 1, firstName: 'Wei', lastName: 'Chen', gender: 'male' },
                    { id: 2, firstName: 'Ji-Young', lastName: 'Kim', gender: 'female' },
                    { id: 3, firstName: 'Raj', lastName: 'Patel', gender: 'male' },
                    { id: 4, firstName: 'Lin', lastName: 'Wang', gender: 'female' },
                    { id: 5, firstName: 'Hikaru', lastName: 'Tanaka', gender: 'male' }
                );
                break;
            default:
                dummyNames.push(
                    { id: 1, firstName: 'User', lastName: 'One', gender: 'male' },
                    { id: 2, firstName: 'User', lastName: 'Two', gender: 'female' },
                    { id: 3, firstName: 'User', lastName: 'Three', gender: 'male' },
                    { id: 4, firstName: 'User', lastName: 'Four', gender: 'female' },
                    { id: 5, firstName: 'User', lastName: 'Five', gender: 'male' }
                );
        }
        
        return dummyNames;
    }
    
    /**
     * キャッシュをクリア
     */
    function clearCache() {
        nameCache = {};
    }
    
    // 公開API
    return {
        getNames,
        getRandomNames,
        clearCache
    };
})();

// グローバルオブジェクトとしてエクスポート
window.NameAPI = NameAPI;