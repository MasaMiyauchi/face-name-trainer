/**
 * モーダルダイアログモジュール
 * 確認ダイアログやアラートなど、モーダルUIを管理する
 */

const Modal = (function() {
    // モーダル要素
    let modalElement = null;
    let modalOverlay = null;
    let modalContent = null;
    let modalTitle = null;
    let modalMessage = null;
    let modalButtons = null;
    
    /**
     * 初期化関数
     * モーダル用のDOM要素を作成
     */
    function init() {
        // 既存のモーダル要素を削除（再初期化時）
        if (modalElement) {
            document.body.removeChild(modalElement);
        }
        
        // モーダルオーバーレイ（背景）の作成
        modalOverlay = document.createElement('div');
        modalOverlay.className = 'modal-overlay';
        modalOverlay.style.position = 'fixed';
        modalOverlay.style.top = '0';
        modalOverlay.style.left = '0';
        modalOverlay.style.width = '100%';
        modalOverlay.style.height = '100%';
        modalOverlay.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
        modalOverlay.style.display = 'none';
        modalOverlay.style.justifyContent = 'center';
        modalOverlay.style.alignItems = 'center';
        modalOverlay.style.zIndex = '1000';
        
        // モーダルコンテンツの作成
        modalContent = document.createElement('div');
        modalContent.className = 'modal-content';
        modalContent.style.backgroundColor = 'white';
        modalContent.style.borderRadius = '8px';
        modalContent.style.padding = '20px';
        modalContent.style.width = '90%';
        modalContent.style.maxWidth = '400px';
        modalContent.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1)';
        
        // モーダルタイトルの作成
        modalTitle = document.createElement('h3');
        modalTitle.className = 'modal-title';
        modalTitle.style.marginTop = '0';
        modalTitle.style.marginBottom = '15px';
        modalTitle.style.color = '#4a6fa5';
        
        // モーダルメッセージの作成
        modalMessage = document.createElement('p');
        modalMessage.className = 'modal-message';
        modalMessage.style.marginBottom = '20px';
        
        // モーダルボタンコンテナの作成
        modalButtons = document.createElement('div');
        modalButtons.className = 'modal-buttons';
        modalButtons.style.display = 'flex';
        modalButtons.style.justifyContent = 'flex-end';
        modalButtons.style.gap = '10px';
        
        // 要素を組み立て
        modalContent.appendChild(modalTitle);
        modalContent.appendChild(modalMessage);
        modalContent.appendChild(modalButtons);
        modalOverlay.appendChild(modalContent);
        
        // ボディに追加
        document.body.appendChild(modalOverlay);
        
        // モーダル要素を参照として保持
        modalElement = modalOverlay;
    }
    
    /**
     * モーダルを表示
     * @param {Object} options - モーダルの設定オプション
     * @param {string} options.title - モーダルのタイトル
     * @param {string} options.message - モーダルのメッセージ
     * @param {Array<{text: string, type: string, onClick: Function}>} options.buttons - ボタン設定
     * @returns {Promise} - ボタンクリック時に解決するPromise
     */
    function show(options = {}) {
        // モーダルが初期化されていない場合は初期化
        if (!modalElement) {
            init();
        }
        
        // タイトルとメッセージを設定
        modalTitle.textContent = options.title || '';
        modalMessage.textContent = options.message || '';
        
        // ボタンをクリア
        modalButtons.innerHTML = '';
        
        // Promiseを返す
        return new Promise((resolve) => {
            // ボタンを追加
            const buttons = options.buttons || [{ text: 'OK', type: 'primary' }];
            
            buttons.forEach((button, index) => {
                const buttonEl = document.createElement('button');
                buttonEl.textContent = button.text;
                buttonEl.className = `btn ${button.type || 'primary'}`;
                
                // ボタンのスタイル設定
                buttonEl.style.padding = '8px 16px';
                buttonEl.style.borderRadius = '4px';
                buttonEl.style.border = 'none';
                buttonEl.style.cursor = 'pointer';
                buttonEl.style.fontWeight = 'bold';
                
                if (button.type === 'primary') {
                    buttonEl.style.backgroundColor = '#4a6fa5';
                    buttonEl.style.color = 'white';
                } else if (button.type === 'secondary') {
                    buttonEl.style.backgroundColor = '#6b8eba';
                    buttonEl.style.color = 'white';
                } else if (button.type === 'danger') {
                    buttonEl.style.backgroundColor = '#d9534f';
                    buttonEl.style.color = 'white';
                } else {
                    buttonEl.style.backgroundColor = '#eaeef2';
                    buttonEl.style.color = '#333';
                }
                
                // クリックイベントを設定
                buttonEl.addEventListener('click', () => {
                    // モーダルを非表示
                    hide();
                    
                    // ボタンのカスタムクリックハンドラがあれば実行
                    if (typeof button.onClick === 'function') {
                        button.onClick();
                    }
                    
                    // Promiseを解決
                    resolve(index);
                });
                
                modalButtons.appendChild(buttonEl);
            });
            
            // モーダルを表示
            modalOverlay.style.display = 'flex';
            
            // モーダル外クリックでの閉じる処理（オプション）
            if (options.closeOnOverlayClick) {
                modalOverlay.addEventListener('click', (event) => {
                    if (event.target === modalOverlay) {
                        hide();
                        resolve(null); // キャンセル扱いでPromiseを解決
                    }
                });
            }
        });
    }
    
    /**
     * モーダルを非表示
     */
    function hide() {
        if (modalElement) {
            modalElement.style.display = 'none';
        }
    }
    
    /**
     * 確認ダイアログを表示
     * @param {string} message - 確認メッセージ
     * @param {string} title - ダイアログのタイトル
     * @returns {Promise<boolean>} - ユーザーの選択（true: はい, false: いいえ）
     */
    function confirm(message, title = '確認') {
        return show({
            title,
            message,
            buttons: [
                { text: 'いいえ', type: 'secondary' },
                { text: 'はい', type: 'primary' }
            ]
        }).then(index => index === 1); // 「はい」ボタンのインデックスは1
    }
    
    /**
     * アラートダイアログを表示
     * @param {string} message - アラートメッセージ
     * @param {string} title - ダイアログのタイトル
     * @returns {Promise<void>} - OKボタンクリック時に解決するPromise
     */
    function alert(message, title = '通知') {
        return show({
            title,
            message,
            buttons: [
                { text: 'OK', type: 'primary' }
            ]
        }).then(() => {}); // 特に戻り値は不要
    }
    
    /**
     * 成功メッセージを表示
     * @param {string} message - 成功メッセージ
     * @param {string} title - ダイアログのタイトル
     * @returns {Promise<void>} - OKボタンクリック時に解決するPromise
     */
    function success(message, title = '成功') {
        return show({
            title,
            message,
            buttons: [
                { text: 'OK', type: 'primary' }
            ]
        }).then(() => {});
    }
    
    /**
     * エラーメッセージを表示
     * @param {string} message - エラーメッセージ
     * @param {string} title - ダイアログのタイトル
     * @returns {Promise<void>} - OKボタンクリック時に解決するPromise
     */
    function error(message, title = 'エラー') {
        return show({
            title,
            message,
            buttons: [
                { text: 'OK', type: 'danger' }
            ]
        }).then(() => {});
    }
    
    // 公開API
    return {
        init,
        show,
        hide,
        confirm,
        alert,
        success,
        error
    };
})();

// グローバルオブジェクトとしてエクスポート
window.Modal = Modal;