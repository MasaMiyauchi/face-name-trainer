/**
 * face-generator.js
 * AI生成顔画像を管理し、国・地域ごとの特性に基づいて生成するモジュール
 */

const FaceGenerator = (function() {
  // 地域ごとの保存上限
  const MAX_FACES_PER_REGION = 200;
  
  // 性別比率（男性：女性＝2：3）
  const GENDER_RATIO = {
      male: 2,
      female: 3
  };
  
  // 年齢比率（10代：20代：30代：40～50代：60代以上＝１：３：２：３：2）
  const AGE_RATIO = {
      teens: 1,
      twenties: 3,
      thirties: 2,
      fourties_fifties: 3,
      sixties_plus: 2
  };
  
  // 地域ごとのストレージ場所
  const STORAGE_PATHS = {
      japan: 'assets/face-data/japan/',
      usa: 'assets/face-data/usa/',
      europe: 'assets/face-data/europe/',
      asia: 'assets/face-data/asia/'
  };

  // 画像サイズの制限（ピクセル）
  const MAX_IMAGE_WIDTH = 256;
  const MAX_IMAGE_HEIGHT = 256;
  
  // キャッシュされた画像データ（地域ごと）
  let faceCache = {
      japan: [],
      usa: [],
      europe: [],
      asia: []
  };
  
  // 初期化済みかどうか
  let initialized = false;
  
  /**
   * 生成システムの初期化
   * @returns {Promise<void>}
   */
  async function init() {
      if (initialized) {
          console.log('FaceGenerator already initialized');
          return;
      }
      
      console.log('Initializing FaceGenerator...');
      
      try {
          // ストレージディレクトリの確認/作成
          await ensureStorageDirectories();
          
          // 既存の画像データを読み込む
          await loadExistingFaces();
          
          initialized = true;
          console.log('FaceGenerator initialization complete');
      } catch (error) {
          console.error('Error initializing FaceGenerator:', error);
          throw new Error('Failed to initialize FaceGenerator: ' + error.message);
      }
  }
  
  /**
   * ストレージディレクトリの存在を確認し、必要に応じて作成する
   * @returns {Promise<void>}
   */
  async function ensureStorageDirectories() {
      // まず基本ディレクトリを確認
      const baseDir = 'assets/face-data';
      
      // ここでローカルストレージAPIを使用して確認・作成
      // ブラウザ環境では実際のファイルシステムにアクセスできないため、
      // このロジックはサーバー側で実装する必要がある
      
      console.log('Ensuring storage directories exist...');
      
      // 各地域のディレクトリも確認
      for (const region in STORAGE_PATHS) {
          const regionPath = STORAGE_PATHS[region];
          console.log(`Ensuring directory exists: ${regionPath}`);
          // 実際の実装ではディレクトリ作成ロジックを入れる
      }
  }
  
  /**
   * 既存の画像データをロードする
   * @returns {Promise<void>}
   */
  async function loadExistingFaces() {
      console.log('Loading existing face data...');
      
      // 各地域のデータをロード
      for (const region in STORAGE_PATHS) {
          try {
              // ここで地域ごとのディレクトリから画像一覧を取得
              const faces = await loadFacesForRegion(region);
              faceCache[region] = faces;
              console.log(`Loaded ${faces.length} faces for ${region}`);
          } catch (error) {
              console.warn(`Failed to load faces for ${region}:`, error);
              faceCache[region] = [];
          }
      }
  }
  
  /**
   * 特定の地域の顔画像をロードする
   * @param {string} region - 地域識別子
   * @returns {Promise<Array>} - 顔データの配列
   */
  async function loadFacesForRegion(region) {
      // IDBStorageを使用してメタデータを取得する
      try {
          await window.IDBStorage.init();
          const storageKey = `face-data-${region}`;
          const storedData = await window.IDBStorage.load(storageKey, null);
          
          if (storedData) {
              return storedData;
          }
          
          // IDBStorageにデータがない場合はLocalStorageをチェック（移行のため）
          const legacyData = localStorage.getItem(storageKey);
          if (legacyData) {
              try {
                  const parsedData = JSON.parse(legacyData);
                  // データをIDBStorageに移行
                  await window.IDBStorage.save(storageKey, parsedData);
                  console.log(`Migrated face data for ${region} to IndexedDB`);
                  return parsedData;
              } catch (e) {
                  console.error(`Error parsing stored face data for ${region}:`, e);
              }
          }
      } catch (error) {
          console.error(`Error loading face data for ${region} from IndexedDB:`, error);
          
          // フォールバックとしてLocalStorageを試す
          const storedData = localStorage.getItem(`face-data-${region}`);
          
          if (storedData) {
              try {
                  return JSON.parse(storedData);
              } catch (e) {
                  console.error(`Error parsing stored face data for ${region}:`, e);
              }
          }
      }
      
      return [];
  }

  /**
   * 画像のサイズを最適化する
   * @param {string} imageDataUrl - 画像のデータURL
   * @returns {Promise<string>} - 最適化された画像のデータURL
   */
  function optimizeImageSize(imageDataUrl) {
      return new Promise((resolve, reject) => {
          // 画像を生成
          const img = new Image();
          
          img.onload = function() {
              // 元のサイズを取得
              const originalWidth = img.width;
              const originalHeight = img.height;
              
              // サイズが既に制限内なら変更しない
              if (originalWidth <= MAX_IMAGE_WIDTH && originalHeight <= MAX_IMAGE_HEIGHT) {
                  resolve(imageDataUrl);
                  return;
              }
              
              // 新しいサイズを計算（アスペクト比を維持）
              let newWidth, newHeight;
              
              if (originalWidth > originalHeight) {
                  newWidth = MAX_IMAGE_WIDTH;
                  newHeight = Math.floor(originalHeight * (MAX_IMAGE_WIDTH / originalWidth));
              } else {
                  newHeight = MAX_IMAGE_HEIGHT;
                  newWidth = Math.floor(originalWidth * (MAX_IMAGE_HEIGHT / originalHeight));
              }
              
              // キャンバスを作成
              const canvas = document.createElement('canvas');
              canvas.width = newWidth;
              canvas.height = newHeight;
              
              // 画像を描画
              const ctx = canvas.getContext('2d');
              ctx.drawImage(img, 0, 0, newWidth, newHeight);
              
              // 最適化された画像のデータURLを取得
              const optimizedDataUrl = canvas.toDataURL('image/jpeg', 0.85); // 品質を下げる
              
              resolve(optimizedDataUrl);
          };
          
          img.onerror = function(event) {
              console.error('画像の読み込みに失敗しました:', event);
              reject(new Error('画像の読み込みに失敗しました: 画像ソースが無効か、アクセスできません'));
          };
          
          img.src = imageDataUrl;
      });
  }
  
  /**
   * ランダムな性別を生成する（比率に基づく）
   * @returns {string} - 'male' または 'female'
   */
  function generateRandomGender() {
      const totalWeight = GENDER_RATIO.male + GENDER_RATIO.female;
      const randomValue = Math.random() * totalWeight;
      
      return randomValue < GENDER_RATIO.male ? 'male' : 'female';
  }
  
  /**
   * ランダムな年齢グループを生成する（比率に基づく）
   * @returns {string} - 年齢グループの識別子
   */
  function generateRandomAgeGroup() {
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
  
  /**
   * 一意のIDを生成
   * @returns {string} - 生成されたID
   */
  function generateUniqueId() {
      return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
  }
  
  /**
   * 新しい顔画像を生成
   * @param {string} region - 地域識別子
   * @returns {Promise<Object>} - 生成された顔のメタデータ
   */
  async function generateFace(region) {
      if (!initialized) {
          await init();
      }
      
      // メタデータを生成
      const metadata = generateFaceMetadata(region);
      
      try {
          // FaceAPIを使って実際の画像を取得
          const imageDataUrl = await window.FaceAPI.getFace(region);
          
          // 画像サイズを最適化
          const optimizedImageUrl = await optimizeImageSize(imageDataUrl);
          
          // ファイルパスを設定
          const fileName = `${metadata.id}.jpg`;
          const filePath = `${STORAGE_PATHS[region]}${fileName}`;
          metadata.filePath = filePath;
          
          // 実際の保存はブラウザ環境では制限があるため、IndexedDBにメタデータとイメージデータを保存
          await saveFaceData(metadata, optimizedImageUrl);
          
          return {
              ...metadata,
              imageData: optimizedImageUrl
          };
      } catch (error) {
          console.error('Error generating face:', error);
          throw new Error(`Failed to generate face: ${error.message}`);
      }
  }
  
  /**
   * 顔データを保存する
   * @param {Object} metadata - 顔のメタデータ
   * @param {string} imageDataUrl - 画像のデータURL
   * @returns {Promise<void>}
   */
  async function saveFaceData(metadata, imageDataUrl) {
      // キャッシュに追加
      faceCache[metadata.region].push(metadata);
      
      try {
          // IndexedDBにメタデータを保存
          await window.IDBStorage.init();
          const metadataKey = `face-data-${metadata.region}`;
          await window.IDBStorage.save(metadataKey, faceCache[metadata.region]);
          
          // 画像データも保存
          const imageKey = `face-image-${metadata.id}`;
          await window.IDBStorage.save(imageKey, imageDataUrl);
          
          console.log(`Face data saved for ${metadata.id}`);
      } catch (error) {
          console.error('Error saving to IndexedDB:', error);
          
          // フォールバックとしてLocalStorageに保存を試みる
          try {
              // LocalStorageにメタデータを保存
              localStorage.setItem(`face-data-${metadata.region}`, JSON.stringify(faceCache[metadata.region]));
              
              // 画像データも保存
              localStorage.setItem(`face-image-${metadata.id}`, imageDataUrl);
          } catch (lsError) {
              // LocalStorageの容量制限に達した場合の処理
              console.warn('LocalStorage capacity exceeded. Unable to save image data.', lsError);
              // 最も古い画像を削除して容量を確保
              removeOldestImage(metadata.region);
              // 再試行
              localStorage.setItem(`face-data-${metadata.region}`, JSON.stringify(faceCache[metadata.region]));
              localStorage.setItem(`face-image-${metadata.id}`, imageDataUrl);
          }
      }
  }
  
  /**
   * 最も古い画像を削除する
   * @param {string} region - 地域識別子
   * @returns {Promise<void>}
   */
  async function removeOldestImage(region) {
      if (faceCache[region].length === 0) {
          return;
      }
      
      // 作成日時でソート
      faceCache[region].sort((a, b) => new Date(a.created) - new Date(b.created));
      
      // 最も古い画像を削除
      const oldestFace = faceCache[region].shift();
      
      try {
          // IndexedDBから画像データを削除
          await window.IDBStorage.remove(`face-image-${oldestFace.id}`);
          
          // メタデータも更新
          await window.IDBStorage.save(`face-data-${region}`, faceCache[region]);
      } catch (error) {
          console.error('Error removing oldest image from IndexedDB:', error);
          
          // フォールバックとしてLocalStorageから削除
          localStorage.removeItem(`face-image-${oldestFace.id}`);
          localStorage.setItem(`face-data-${region}`, JSON.stringify(faceCache[region]));
      }
      
      console.log(`Removed oldest image for ${region}: ${oldestFace.id}`);
  }
  
  /**
   * 特定の地域の顔画像数を取得
   * @param {string} region - 地域識別子
   * @returns {number} - 画像数
   */
  function getFaceCount(region) {
      return faceCache[region]?.length || 0;
  }
  
  /**
   * テスト用の新しい顔を生成
   * @param {string} region - 地域識別子
   * @param {number} count - 生成する顔の数
   * @returns {Promise<Array<Object>>} - 生成された顔のメタデータの配列
   */
  async function generateFacesForTest(region, count) {
      if (!initialized) {
          await init();
      }
      
      const currentCount = getFaceCount(region);
      
      // 上限チェック
      if (currentCount >= MAX_FACES_PER_REGION) {
          // 上限に達している場合は、必要数の20%を新規生成
          const newFacesCount = Math.ceil(count * 0.2);
          console.log(`Region ${region} has reached max capacity. Generating ${newFacesCount} new faces.`);
          
          // 新しい顔を生成
          const newFaces = [];
          for (let i = 0; i < newFacesCount; i++) {
              const face = await generateFace(region);
              newFaces.push(face);
          }
          
          // 同数の古い顔を削除
          for (let i = 0; i < newFacesCount; i++) {
              await removeOldestImage(region);
          }
          
          return newFaces;
      } else {
          // まだ上限に達していない場合は、通常通り生成
          const newFaces = [];
          for (let i = 0; i < count; i++) {
              const face = await generateFace(region);
              newFaces.push(face);
          }
          return newFaces;
      }
  }
  
  /**
   * 顔画像データを取得
   * @param {string} faceId - 顔ID
   * @returns {Promise<string|null>} - 画像のデータURL
   */
  async function getFaceImage(faceId) {
      try {
          // IndexedDBから画像を取得
          await window.IDBStorage.init();
          const imageKey = `face-image-${faceId}`;
          const imageData = await window.IDBStorage.load(imageKey, null);
          
          if (imageData) {
              return imageData;
          }
          
          // IndexedDBにない場合はLocalStorageを確認
          return localStorage.getItem(imageKey);
      } catch (error) {
          console.error('Error fetching face image from IndexedDB:', error);
          // フォールバックとしてLocalStorageから取得
          return localStorage.getItem(`face-image-${faceId}`);
      }
  }
  
  /**
   * 特定の地域からランダムな顔を取得
   * @param {string} region - 地域識別子
   * @param {number} count - 取得する顔の数
   * @returns {Promise<Array<Object>>} - 顔のメタデータとデータURLの配列
   */
  async function getRandomFaces(region, count) {
      if (!initialized) {
          await init();
      }
      
      const availableFaces = faceCache[region] || [];
      
      // 生成済みの顔が少ない場合は新たに生成
      if (availableFaces.length < count) {
          const neededFaces = count - availableFaces.length;
          console.log(`Not enough faces for ${region}. Generating ${neededFaces} new faces.`);
          
          for (let i = 0; i < neededFaces; i++) {
              await generateFace(region);
          }
      }
      
      // ランダムに顔を選択
      const shuffled = [...faceCache[region]].sort(() => 0.5 - Math.random());
      const selected = shuffled.slice(0, count);
      
      // 画像データを添付
      const results = [];
      for (const face of selected) {
          const imageData = await getFaceImage(face.id);
          results.push({
              ...face,
              imageData
          });
      }
      
      return results;
  }
  
  /**
   * 特定の地域の顔データをすべて削除
   * @param {string} region - 地域識別子
   * @returns {Promise<void>}
   */
  async function clearRegionData(region) {
      try {
          // キャッシュされた顔データをループして削除
          const faces = faceCache[region] || [];
          
          await window.IDBStorage.init();
          
          for (const face of faces) {
              await window.IDBStorage.remove(`face-image-${face.id}`);
              localStorage.removeItem(`face-image-${face.id}`);
          }
          
          // メタデータもクリア
          faceCache[region] = [];
          await window.IDBStorage.remove(`face-data-${region}`);
          localStorage.removeItem(`face-data-${region}`);
          
          console.log(`Cleared all face data for region: ${region}`);
      } catch (error) {
          console.error(`Error clearing region data for ${region}:`, error);
          
          // フォールバックとしてLocalStorageの削除を試みる
          const faces = faceCache[region] || [];
          for (const face of faces) {
              localStorage.removeItem(`face-image-${face.id}`);
          }
          
          faceCache[region] = [];
          localStorage.removeItem(`face-data-${region}`);
      }
  }
  
  /**
   * すべての顔データを削除
   * @returns {Promise<void>}
   */
  async function clearAllData() {
      for (const region in STORAGE_PATHS) {
          await clearRegionData(region);
      }
      console.log('Cleared all face data');
  }
  
  // 公開API
  return {
      init,
      generateFace,
      generateFacesForTest,
      getRandomFaces,
      getFaceCount,
      getFaceImage,
      clearRegionData,
      clearAllData
  };
})();

// グローバルオブジェクトとしてエクスポート
window.FaceGenerator = FaceGenerator;
