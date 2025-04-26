/**
 * FaceNameTrainer - 顔と名前の記憶トレーニングアプリ
 * ヨーロッパの名前データセット
 */

// ヨーロッパの名前データベース（各国混合）
const EuropeNames = (function() {
    // 男性の名前（名・姓）
    const maleFirstNames = [
        // イギリス系
        'James', 'William', 'Oliver', 'Harry', 'George', 'Thomas', 'Jack', 'Charlie', 'Jacob', 'Alfie',
        // フランス系
        'Lucas', 'Hugo', 'Gabriel', 'Louis', 'Ethan', 'Jules', 'Léo', 'Noah', 'Raphael', 'Nathan',
        // ドイツ系
        'Maximilian', 'Alexander', 'Paul', 'Leon', 'Ben', 'Jonas', 'Elias', 'Lukas', 'Luca', 'Finn',
        // イタリア系
        'Francesco', 'Alessandro', 'Lorenzo', 'Andrea', 'Leonardo', 'Matteo', 'Gabriele', 'Mattia', 'Tommaso', 'Riccardo',
        // スペイン系
        'Antonio', 'Manuel', 'José', 'Carlos', 'David', 'Juan', 'Miguel', 'Javier', 'Daniel', 'Rafael',
        // 北欧系
        'Emil', 'William', 'Noah', 'Oscar', 'Lucas', 'Elias', 'Alexander', 'Oliver', 'Filip', 'Victor'
    ];
    
    const maleLastNames = [
        // イギリス系
        'Smith', 'Jones', 'Williams', 'Brown', 'Taylor', 'Davies', 'Wilson', 'Evans', 'Thomas', 'Johnson',
        // フランス系
        'Martin', 'Bernard', 'Dubois', 'Petit', 'Moreau', 'Simon', 'Laurent', 'Lefebvre', 'Michel', 'Garcia',
        // ドイツ系
        'Müller', 'Schmidt', 'Schneider', 'Fischer', 'Weber', 'Meyer', 'Wagner', 'Becker', 'Hoffmann', 'Schulz',
        // イタリア系
        'Rossi', 'Russo', 'Ferrari', 'Esposito', 'Bianchi', 'Romano', 'Colombo', 'Ricci', 'Marino', 'Greco',
        // スペイン系
        'García', 'Fernández', 'González', 'Rodríguez', 'López', 'Martínez', 'Sánchez', 'Pérez', 'Gómez', 'Martín',
        // 北欧系
        'Johansson', 'Andersson', 'Karlsson', 'Nilsson', 'Eriksson', 'Larsson', 'Olsson', 'Persson', 'Svensson', 'Gustafsson'
    ];
    
    // 女性の名前（名・姓）
    const femaleFirstNames = [
        // イギリス系
        'Olivia', 'Emily', 'Isla', 'Sophie', 'Amelia', 'Charlotte', 'Grace', 'Jessica', 'Lucy', 'Mia',
        // フランス系
        'Emma', 'Louise', 'Jade', 'Alice', 'Chloé', 'Lina', 'Léa', 'Manon', 'Rose', 'Anna',
        // ドイツ系
        'Sophie', 'Marie', 'Maria', 'Sophia', 'Emma', 'Hannah', 'Anna', 'Mia', 'Emilia', 'Lina',
        // イタリア系
        'Sofia', 'Giulia', 'Aurora', 'Ginevra', 'Alice', 'Emma', 'Giorgia', 'Greta', 'Martina', 'Chiara',
        // スペイン系
        'Lucía', 'Sofía', 'María', 'Martina', 'Paula', 'Julia', 'Daniela', 'Valeria', 'Alba', 'Noa',
        // 北欧系
        'Emma', 'Alice', 'Elsa', 'Maja', 'Ebba', 'Ella', 'Wilma', 'Astrid', 'Signe', 'Olivia'
    ];
    
    const femaleLastNames = [
        // イギリス系
        'Smith', 'Jones', 'Williams', 'Brown', 'Taylor', 'Davies', 'Wilson', 'Evans', 'Thomas', 'Johnson',
        // フランス系
        'Martin', 'Bernard', 'Dubois', 'Petit', 'Moreau', 'Simon', 'Laurent', 'Lefebvre', 'Michel', 'Garcia',
        // ドイツ系
        'Müller', 'Schmidt', 'Schneider', 'Fischer', 'Weber', 'Meyer', 'Wagner', 'Becker', 'Hoffmann', 'Schulz',
        // イタリア系
        'Rossi', 'Russo', 'Ferrari', 'Esposito', 'Bianchi', 'Romano', 'Colombo', 'Ricci', 'Marino', 'Greco',
        // スペイン系
        'García', 'Fernández', 'González', 'Rodríguez', 'López', 'Martínez', 'Sánchez', 'Pérez', 'Gómez', 'Martín',
        // 北欧系
        'Johansson', 'Andersson', 'Karlsson', 'Nilsson', 'Eriksson', 'Larsson', 'Olsson', 'Persson', 'Svensson', 'Gustafsson'
    ];
    
    /**
     * ランダムな男性名を生成
     * @returns {Object} - 名前オブジェクト（名・姓・フルネーム）
     */
    function getRandomMaleName() {
        const firstName = maleFirstNames[Math.floor(Math.random() * maleFirstNames.length)];
        const lastName = maleLastNames[Math.floor(Math.random() * maleLastNames.length)];
        return {
            firstName: firstName,
            lastName: lastName,
            fullName: `${firstName} ${lastName}`
        };
    }
    
    /**
     * ランダムな女性名を生成
     * @returns {Object} - 名前オブジェクト（名・姓・フルネーム）
     */
    function getRandomFemaleName() {
        const firstName = femaleFirstNames[Math.floor(Math.random() * femaleFirstNames.length)];
        const lastName = femaleLastNames[Math.floor(Math.random() * femaleLastNames.length)];
        return {
            firstName: firstName,
            lastName: lastName,
            fullName: `${firstName} ${lastName}`
        };
    }
    
    /**
     * 指定された性別のランダムな名前を生成
     * @param {string} gender - 'male'または'female'
     * @returns {Object} - 名前オブジェクト
     */
    function getRandomName(gender) {
        return gender === 'female' ? getRandomFemaleName() : getRandomMaleName();
    }
    
    /**
     * 指定された数の男性名と女性名を生成
     * @param {number} count - 生成する名前の数
     * @param {number} femaleRatio - 女性名の割合（0.0～1.0）
     * @returns {Array} - 名前オブジェクトの配列
     */
    function getRandomNames(count, femaleRatio = 0.5) {
        const names = [];
        const femaleCount = Math.round(count * femaleRatio);
        const maleCount = count - femaleCount;
        
        // 女性名を生成
        for (let i = 0; i < femaleCount; i++) {
            names.push({
                ...getRandomFemaleName(),
                gender: 'female'
            });
        }
        
        // 男性名を生成
        for (let i = 0; i < maleCount; i++) {
            names.push({
                ...getRandomMaleName(),
                gender: 'male'
            });
        }
        
        // 名前をシャッフル
        return names.sort(() => Math.random() - 0.5);
    }
    
    /**
     * 国のリストを取得（名前生成に使用されている国々）
     * @returns {Array} - 国名の配列
     */
    function getCountries() {
        return [
            'イギリス',
            'フランス',
            'ドイツ',
            'イタリア',
            'スペイン',
            '北欧諸国'
        ];
    }
    
    // 公開API
    return {
        getRandomMaleName,
        getRandomFemaleName,
        getRandomName,
        getRandomNames,
        getCountries
    };
})();

// グローバルスコープにエクスポート
window.EuropeNames = EuropeNames;