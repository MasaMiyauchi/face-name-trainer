/**
 * face-api.js
 * This Person Does Not Exist APIと連携して、AI生成の顔画像を取得するためのモジュール
 */

const FaceAPI = (function() {
    // APIのURLを定義
    const API_URL = 'https://thispersondoesnotexist.com';
    const TIMEOUT = 5000; // タイムアウト時間（ミリ秒）
    
    // キャッシュ用のオブジェクト
    let imageCache = {};
    
    /**
     * 新しいAI生成顔画像を取得する
     * @param {string} region - 顔の地域タイプ（任意、現在のAPIではサポートされていない可能性あり）
     * @returns {Promise<string>} - 画像のURLまたはdata URL
     */
    async function getFace(region = null) {
        try {
            // キャッシュに既に存在するかチェック
            if (region && imageCache[region] && imageCache[region].length > 0) {
                return imageCache[region].pop();
            }
            
            // API制限回避のためのランダムパラメータを作成
            const timestamp = new Date().getTime();
            const randomParam = `?t=${timestamp}`;
            
            // fetch APIを使用して画像を取得
            const response = await Promise.race([
                fetch(API_URL + randomParam),
                new Promise((_, reject) => 
                    setTimeout(() => reject(new Error('Request timeout')), TIMEOUT)
                )
            ]);
            
            if (!response.ok) {
                throw new Error(`API request failed with status ${response.status}`);
            }
            
            // レスポンスをblobとして取得
            const blob = await response.blob();
            
            // blobをdata URLに変換
            const dataUrl = await new Promise(resolve => {
                const reader = new FileReader();
                reader.onloadend = () => resolve(reader.result);
                reader.readAsDataURL(blob);
            });
            
            return dataUrl;
        } catch (error) {
            console.error('Error fetching face image:', error);
            
            // エラー時はダミー画像を返す
            return 'assets/default-face.jpg';
        }
    }
    
    /**
     * 複数の顔画像をプリロードしてキャッシュに保存
     * @param {number} count - プリロードする画像の数
     * @param {string} region - 顔の地域タイプ
     * @returns {Promise<void>}
     */
    async function preloadFaces(count = 5, region = null) {
        if (!imageCache[region]) {
            imageCache[region] = [];
        }
        
        const promises = [];
        for (let i = 0; i < count; i++) {
            promises.push(
                getFace(region).then(face => {
                    imageCache[region].push(face);
                    return face;
                })
            );
        }
        
        await Promise.all(promises);
    }
    
    /**
     * キャッシュをクリア
     */
    function clearCache() {
        imageCache = {};
    }
    
    // 公開API
    return {
        getFace,
        preloadFaces,
        clearCache
    };
})();

// グローバルオブジェクトとしてエクスポート
window.FaceAPI = FaceAPI;