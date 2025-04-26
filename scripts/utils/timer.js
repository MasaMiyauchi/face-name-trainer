/**
 * タイマーモジュール
 * アプリケーションで使用するカウントダウンタイマーおよび経過時間計測機能を提供
 */

const Timer = (function() {
    // プライベート変数
    let countdownIntervalId = null;
    let elapsedIntervalId = null;
    let startTime = 0;
    let elapsedTime = 0;
    let isPaused = false;
    let pauseStartTime = 0;
    
    /**
     * カウントダウンタイマーを開始
     * @param {number} seconds - 秒数
     * @param {Function} onTick - 毎秒呼び出されるコールバック関数（残り秒数を引数に取る）
     * @param {Function} onComplete - タイマー終了時に呼び出されるコールバック関数
     * @returns {Function} - タイマーを停止するための関数
     */
    function startCountdown(seconds, onTick, onComplete) {
        // 既存のタイマーがあれば停止
        stopCountdown();
        
        // 残り時間（ミリ秒）
        let timeLeft = seconds * 1000;
        
        // 開始時間
        const startTime = Date.now();
        
        // 最初のコールバック
        onTick && onTick(Math.ceil(timeLeft / 1000));
        
        // インターバルを設定
        countdownIntervalId = setInterval(() => {
            // 経過時間を計算
            const elapsed = Date.now() - startTime;
            
            // 残り時間を更新
            timeLeft = seconds * 1000 - elapsed;
            
            // 残り時間を秒単位に変換（切り上げ）
            const secondsLeft = Math.ceil(timeLeft / 1000);
            
            // コールバックを呼び出す
            onTick && onTick(secondsLeft);
            
            // タイマーが終了したら
            if (timeLeft <= 0) {
                stopCountdown();
                onComplete && onComplete();
            }
        }, 200); // 滑らかな更新のため200ミリ秒間隔で実行
        
        // タイマーを停止する関数を返す
        return stopCountdown;
    }
    
    /**
     * カウントダウンタイマーを停止
     */
    function stopCountdown() {
        if (countdownIntervalId !== null) {
            clearInterval(countdownIntervalId);
            countdownIntervalId = null;
        }
    }
    
    /**
     * 経過時間計測を開始
     * @param {Function} onTick - 毎秒呼び出されるコールバック関数（経過秒数を引数に取る）
     * @returns {Function} - 計測を停止するための関数
     */
    function startElapsedTimer(onTick) {
        // 既存のタイマーがあれば停止
        stopElapsedTimer();
        
        // 開始時間を記録
        startTime = Date.now();
        elapsedTime = 0;
        isPaused = false;
        
        // インターバルを設定
        elapsedIntervalId = setInterval(() => {
            if (!isPaused) {
                // 経過時間を計算（ミリ秒）
                elapsedTime = Date.now() - startTime;
                
                // 経過秒数（切り捨て）
                const elapsedSeconds = Math.floor(elapsedTime / 1000);
                
                // コールバックを呼び出す
                onTick && onTick(elapsedSeconds);
            }
        }, 200); // 滑らかな更新のため200ミリ秒間隔で実行
        
        // タイマーを停止する関数を返す
        return stopElapsedTimer;
    }
    
    /**
     * 経過時間計測を停止
     * @returns {number} - 経過時間（ミリ秒）
     */
    function stopElapsedTimer() {
        if (elapsedIntervalId !== null) {
            clearInterval(elapsedIntervalId);
            elapsedIntervalId = null;
            
            // 最終的な経過時間を計算
            if (!isPaused) {
                elapsedTime = Date.now() - startTime;
            }
        }
        
        return elapsedTime;
    }
    
    /**
     * 経過時間計測を一時停止
     */
    function pauseElapsedTimer() {
        if (!isPaused && elapsedIntervalId !== null) {
            isPaused = true;
            pauseStartTime = Date.now();
        }
    }
    
    /**
     * 経過時間計測を再開
     */
    function resumeElapsedTimer() {
        if (isPaused && elapsedIntervalId !== null) {
            isPaused = false;
            
            // 一時停止していた時間を補正
            const pauseDuration = Date.now() - pauseStartTime;
            startTime += pauseDuration;
        }
    }
    
    /**
     * 現在の経過時間を取得
     * @returns {number} - 経過時間（ミリ秒）
     */
    function getElapsedTime() {
        if (elapsedIntervalId === null) {
            return elapsedTime;
        }
        
        if (isPaused) {
            return pauseStartTime - startTime;
        }
        
        return Date.now() - startTime;
    }
    
    /**
     * 時間をフォーマット（mm:ss）
     * @param {number} milliseconds - ミリ秒
     * @returns {string} - フォーマットされた時間文字列
     */
    function formatTime(milliseconds) {
        const totalSeconds = Math.floor(milliseconds / 1000);
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        
        return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    
    // 公開API
    return {
        startCountdown,
        stopCountdown,
        startElapsedTimer,
        stopElapsedTimer,
        pauseElapsedTimer,
        resumeElapsedTimer,
        getElapsedTime,
        formatTime
    };
})();

// グローバルオブジェクトとしてエクスポート
window.Timer = Timer;