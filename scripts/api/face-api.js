/**
 * face-api.js
 * AI生成の顔画像を取得するためのモジュール
 */

const FaceAPI = (function() {
    // APIのURLを定義
    const API_URL = 'https://thispersondoesnotexist.com';
    const CORS_PROXY = 'https://corsproxy.io/?'; // CORSプロキシサービス
    
    // バックアップ用のダミー画像URL
    const DUMMY_IMAGES = {
        'japan': 'assets/face-data/japan/',
        'usa': 'assets/face-data/usa/',
        'europe': 'assets/face-data/europe/',
        'asia': 'assets/face-data/asia/',
        'default': 'assets/default-face.jpg'
    };
    
    const TIMEOUT = 5000; // タイムアウト時間（ミリ秒）
    
    // キャッシュ用のオブジェクト
    let imageCache = {};
    let useLocalImagesOnly = false; // オフラインモードフラグ
    
    /**
     * 新しいAI生成顔画像を取得する
     * @param {string} region - 顔の地域タイプ
     * @returns {Promise<string>} - 画像のURLまたはdata URL
     */
    async function getFace(region = null) {
        try {
            // キャッシュに既に存在するかチェック
            if (region && imageCache[region] && imageCache[region].length > 0) {
                return imageCache[region].pop();
            }
            
            // オフラインモードの場合はダミー画像を返す
            if (useLocalImagesOnly) {
                return getLocalDummyImage(region);
            }
            
            // API制限回避のためのランダムパラメータを作成
            const timestamp = new Date().getTime();
            const randomParam = `t=${timestamp}`;
            
            // CORSプロキシ経由でAPIにアクセス
            const url = `${CORS_PROXY}${encodeURIComponent(API_URL)}?${randomParam}`;
            console.log('Fetching face from:', url);
            
            // fetch APIを使用して画像を取得
            const response = await Promise.race([
                fetch(url, {
                    mode: 'cors',
                    credentials: 'omit',
                    headers: {
                        'Accept': 'image/jpeg, image/png, */*'
                    }
                }),
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
            console.log('Falling back to local dummy image');
            
            // 一定回数エラーが続くとオフラインモードに切り替え
            useLocalImagesOnly = true;
            
            // エラー時はダミー画像を返す
            return getLocalDummyImage(region);
        }
    }
    
    /**
     * ローカルのダミー画像を取得
     * @param {string} region - 顔の地域タイプ
     * @returns {string} - ダミー画像のURL
     */
    function getLocalDummyImage(region) {
        // 指定した地域用のフォルダがあるか確認
        const basePath = DUMMY_IMAGES[region] || DUMMY_IMAGES['default'];
        
        if (basePath.endsWith('/')) {
            // フォルダの場合、ランダムな番号を付けて画像を選択
            const randomIndex = Math.floor(Math.random() * 5) + 1; // 1から5の範囲
            return `${basePath}face${randomIndex}.jpg`;
        } else {
            // 単一のダミー画像の場合
            return basePath;
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
        
        try {
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
            console.log(`Preloaded ${count} faces for region: ${region}`);
        } catch (error) {
            console.error(`Failed to preload faces for region ${region}:`, error);
            // エラー時はオフラインモードに切り替え
            useLocalImagesOnly = true;
        }
    }
    
    /**
     * キャッシュをクリア
     */
    function clearCache() {
        imageCache = {};
    }
    
    /**
     * オフラインモードを設定
     * @param {boolean} offline - オフラインモードにするかどうか
     */
    function setOfflineMode(offline) {
        useLocalImagesOnly = offline;
    }
    
    // 公開API
    return {
        getFace,
        preloadFaces,
        clearCache,
        setOfflineMode
    };
})();

// グローバルオブジェクトとしてエクスポート
window.FaceAPI = FaceAPI;
