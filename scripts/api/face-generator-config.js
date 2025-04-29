/**
 * face-generator-config.js
 * AI生成顔画像管理のための設定パラメータとグローバル定数
 */

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

// FaceGeneratorConfig オブジェクトをエクスポート
const FaceGeneratorConfig = {
    MAX_FACES_PER_REGION,
    GENDER_RATIO,
    AGE_RATIO,
    STORAGE_PATHS,
    MAX_IMAGE_WIDTH,
    MAX_IMAGE_HEIGHT
};

// グローバルオブジェクトとしても利用可能にする
window.FaceGeneratorConfig = FaceGeneratorConfig;