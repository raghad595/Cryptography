document.addEventListener('DOMContentLoaded', () => {
    // UI Elements
    const actionRadios = document.querySelectorAll('input[name="action"]');
    const cipherSelect = document.getElementById('cipher-select');
    const inputSection = document.getElementById('input-section');
    const keyInput = document.getElementById('cipher-key');
    const keyLabel = document.getElementById('key-label');
    const keyError = document.getElementById('key-error');
    const inputText = document.getElementById('input-text');
    const inputLabel = document.getElementById('input-label');
    const outputText = document.getElementById('output-text');
    const outputLabel = document.getElementById('output-label');
    const executeBtn = document.getElementById('execute-btn');

    // Cipher Configurations
    const ciphers = {
        caesar: { 
            type: 'number', 
            label: 'Numerical Shift Key (e.g. 3)', 
            placeholder: 'Enter a number (e.g. 3)',
            validate: val => !isNaN(parseInt(val)) && parseInt(val) >= 0,
            errorMsg: 'Please enter a valid positive number.'
        },
        monoalphabetic: { 
            type: 'text', 
            label: '26-Letter Key', 
            placeholder: 'e.g. QWERTYUIOPASDFGHJKLZXCVBNM',
            validate: val => {
                const lettersOnly = val.toLowerCase().replace(/[^a-z]/g, '');
                return lettersOnly.length === 26 && new Set(lettersOnly.split('')).size === 26;
            },
            errorMsg: 'Key must contain exactly 26 unique letters of the English alphabet.'
        },
        playfair: { 
            type: 'text', 
            label: 'Keyword (Text)', 
            placeholder: 'Enter a keyword (e.g. MONARCHY)',
            validate: val => val.trim().length > 0 && /[a-zA-Z]/.test(val),
            errorMsg: 'Please enter a keyword containing letters.'
        },
        vigenere: { 
            type: 'text', 
            label: 'Keyword (Text)', 
            placeholder: 'Enter a keyword (e.g. LEMON)',
            validate: val => val.trim().length > 0 && /[a-zA-Z]/.test(val),
            errorMsg: 'Please enter a keyword containing letters.'
        },
        railfence: { 
            type: 'number', 
            label: 'Depth (Number of Rails)', 
            placeholder: 'Enter a number > 1 (e.g. 3)',
            validate: val => !isNaN(parseInt(val)) && parseInt(val) > 1,
            errorMsg: 'Depth must be a number greater than 1.'
        },
        rowtransposition: { 
            type: 'number', 
            label: 'Numerical Key (e.g. 4312567)', 
            placeholder: 'e.g. 4312567',
            validate: val => {
                const arr = val.split('');
                return arr.length > 1 && arr.every(c => !isNaN(parseInt(c))) && new Set(arr).size === arr.length;
            },
            errorMsg: 'Key must be a sequence of unique numbers (e.g., 4312567).'
        }
    };

    // State Variables
    let currentAction = 'encrypt';
    let currentCipher = null;

    // Event Listeners
    actionRadios.forEach(radio => {
        radio.addEventListener('change', (e) => {
            currentAction = e.target.value;
            updateLabels();
            validateInputs();
        });
    });

    cipherSelect.addEventListener('change', (e) => {
        currentCipher = e.target.value;
        const config = ciphers[currentCipher];
        
        // Unlock input section
        inputSection.style.opacity = '1';
        inputSection.style.pointerEvents = 'auto';
        
        // Setup Key input
        keyInput.disabled = false;
        keyInput.type = config.type === 'number' && currentCipher !== 'rowtransposition' ? 'number' : 'text';
        keyLabel.textContent = `3. Key - ${config.label}`;
        keyInput.placeholder = config.placeholder;
        keyInput.value = '';
        keyError.textContent = '';
        
        validateInputs();
    });

    keyInput.addEventListener('input', validateInputs);
    inputText.addEventListener('input', validateInputs);

    executeBtn.addEventListener('click', () => {
        if (!currentCipher || !validateInputs(true)) return;

        const text = inputText.value;
        const key = keyInput.value;
        const isDecrypt = currentAction === 'decrypt';
        let result = '';

        try {
            switch(currentCipher) {
                case 'caesar':
                    result = doCaesar(text, key, isDecrypt);
                    break;
                case 'monoalphabetic':
                    result = doMonoalphabetic(text, key, isDecrypt);
                    break;
                case 'playfair':
                    result = doPlayfair(text, key, isDecrypt);
                    break;
                case 'vigenere':
                    result = doVigenere(text, key, isDecrypt);
                    break;
                case 'railfence':
                    result = doRailFence(text, key, isDecrypt);
                    break;
                case 'rowtransposition':
                    result = doRowTransposition(text, key, isDecrypt);
                    break;
            }
            outputText.value = result;
        } catch (error) {
            console.error(error);
            outputText.value = "An error occurred during processing.";
        }
    });

    function updateLabels() {
        if (currentAction === 'encrypt') {
            inputLabel.textContent = '4. Plaintext';
            outputLabel.textContent = 'Output (Ciphertext)';
            executeBtn.textContent = 'Encrypt';
        } else {
            inputLabel.textContent = '4. Ciphertext';
            outputLabel.textContent = 'Output (Plaintext)';
            executeBtn.textContent = 'Decrypt';
        }
    }

    function validateInputs(showError = false) {
        if (!currentCipher) return false;
        
        const config = ciphers[currentCipher];
        const isKeyValid = config.validate(keyInput.value);
        const hasText = inputText.value.trim().length > 0;

        if (!isKeyValid && keyInput.value.trim().length > 0) {
            keyError.textContent = config.errorMsg;
            keyInput.style.borderColor = 'var(--error)';
        } else if (!isKeyValid && showError) {
            keyError.textContent = config.errorMsg;
            keyInput.style.borderColor = 'var(--error)';
        } else {
            keyError.textContent = '';
            keyInput.style.borderColor = 'var(--glass-border)';
        }

        if (isKeyValid && hasText) {
            executeBtn.disabled = false;
            return true;
        } else {
            executeBtn.disabled = true;
            return false;
        }
    }

    // --- ALGORITHMS ---

    function doCaesar(text, key, decrypt) {
        const shift = parseInt(key) % 26;
        const actualShift = decrypt ? (26 - shift) % 26 : shift;
        return text.replace(/[a-zA-Z]/g, c => {
            const base = c <= 'Z' ? 65 : 97;
            return String.fromCharCode(((c.charCodeAt(0) - base + actualShift) % 26) + base);
        });
    }

    function doMonoalphabetic(text, key, decrypt) {
        const keyMap = key.toLowerCase().replace(/[^a-z]/g, '');
        const alphabet = "abcdefghijklmnopqrstuvwxyz";
        const map = {};
        if (decrypt) {
            for (let i = 0; i < 26; i++) map[keyMap[i]] = alphabet[i];
        } else {
            for (let i = 0; i < 26; i++) map[alphabet[i]] = keyMap[i];
        }
        
        return text.replace(/[a-zA-Z]/g, c => {
            const isUpper = c <= 'Z';
            const mapped = map[c.toLowerCase()];
            if (!mapped) return c;
            return isUpper ? mapped.toUpperCase() : mapped;
        });
    }

    function doPlayfair(text, key, decrypt) {
        key = key.toLowerCase().replace(/[^a-z]/g, '').replace(/j/g, 'i');
        let matrixStr = "";
        for (let char of key) {
            if (!matrixStr.includes(char)) matrixStr += char;
        }
        for (let i = 97; i <= 122; i++) {
            let char = String.fromCharCode(i);
            if (char === 'j') continue;
            if (!matrixStr.includes(char)) matrixStr += char;
        }
        
        const matrix = [];
        for(let i=0; i<5; i++) matrix.push(matrixStr.slice(i*5, i*5+5));

        function findPos(char) {
            for(let r=0; r<5; r++) {
                let c = matrix[r].indexOf(char);
                if(c !== -1) return [r, c];
            }
            return [0,0];
        }

        if (!decrypt) {
            text = text.toLowerCase().replace(/[^a-z]/g, '').replace(/j/g, 'i');
            let digraphs = [];
            for (let i = 0; i < text.length; i++) {
                let a = text[i];
                let b = text[i+1];
                if (b && a === b) {
                    digraphs.push(a + 'x');
                } else if (b) {
                    digraphs.push(a + b);
                    i++;
                } else {
                    digraphs.push(a + 'x');
                }
            }
            
            return digraphs.map(pair => {
                let [r1, c1] = findPos(pair[0]);
                let [r2, c2] = findPos(pair[1]);
                if (r1 === r2) return matrix[r1][(c1+1)%5] + matrix[r2][(c2+1)%5];
                if (c1 === c2) return matrix[(r1+1)%5][c1] + matrix[(r2+1)%5][c2];
                return matrix[r1][c2] + matrix[r2][c1];
            }).join('').toUpperCase();
        } else {
            text = text.toLowerCase().replace(/[^a-z]/g, '');
            let digraphs = [];
            for (let i = 0; i < text.length; i+=2) {
                if (i+1 < text.length) digraphs.push(text.slice(i, i+2));
            }
            return digraphs.map(pair => {
                let [r1, c1] = findPos(pair[0]);
                let [r2, c2] = findPos(pair[1]);
                if (r1 === r2) return matrix[r1][(c1+4)%5] + matrix[r2][(c2+4)%5];
                if (c1 === c2) return matrix[(r1+4)%5][c1] + matrix[(r2+4)%5][c2];
                return matrix[r1][c2] + matrix[r2][c1];
            }).join('').toLowerCase();
        }
    }

    function doVigenere(text, key, decrypt) {
        key = key.toUpperCase().replace(/[^A-Z]/g, '');
        let keyIdx = 0;
        return text.replace(/[a-zA-Z]/g, c => {
            const isUpper = c <= 'Z';
            const base = isUpper ? 65 : 97;
            const p = c.charCodeAt(0) - base;
            const k = key[keyIdx % key.length].charCodeAt(0) - 65;
            const shift = decrypt ? (26 - k) : k;
            keyIdx++;
            return String.fromCharCode(((p + shift) % 26) + base);
        });
    }

    function doRailFence(text, key, decrypt) {
        const depth = parseInt(key);
        if (depth <= 1) return text;
        const cleanText = text.replace(/\s+/g, '');
        const len = cleanText.length;

        if (!decrypt) {
            const rails = Array.from({length: depth}, () => []);
            let dir = 1, row = 0;
            for (let char of cleanText) {
                rails[row].push(char);
                row += dir;
                if (row === 0 || row === depth - 1) dir *= -1;
            }
            return rails.flat().join('');
        } else {
            const rails = Array.from({length: depth}, () => Array(len).fill(null));
            let dir = 1, row = 0;
            for (let i = 0; i < len; i++) {
                rails[row][i] = '*';
                row += dir;
                if (row === 0 || row === depth - 1) dir *= -1;
            }
            
            let idx = 0;
            for (let r = 0; r < depth; r++) {
                for (let c = 0; c < len; c++) {
                    if (rails[r][c] === '*' && idx < len) {
                        rails[r][c] = cleanText[idx++];
                    }
                }
            }
            
            let res = "";
            row = 0; dir = 1;
            for (let i = 0; i < len; i++) {
                res += rails[row][i];
                row += dir;
                if (row === 0 || row === depth - 1) dir *= -1;
            }
            return res;
        }
    }

    function doRowTransposition(text, key, decrypt) {
        const keyArr = key.split('').map(Number);
        const keyLen = keyArr.length;
        let order = key.split('').map((char, index) => ({char, index})).sort((a,b) => a.char.localeCompare(b.char));
        
        const cleanText = text.replace(/\s+/g, '');
        const numRows = Math.ceil(cleanText.length / keyLen);
        const totalCells = numRows * keyLen;
        
        // Pad the text with 'x' to fill the grid if encrypting
        let paddedText = cleanText;
        if (!decrypt && cleanText.length < totalCells) {
            paddedText += 'x'.repeat(totalCells - cleanText.length);
        }

        if (!decrypt) {
            const grid = Array.from({length: numRows}, () => Array(keyLen).fill(''));
            let k = 0;
            for(let r=0; r<numRows; r++){
                for(let c=0; c<keyLen; c++){
                    grid[r][c] = paddedText[k++];
                }
            }
            let res = "";
            for (let {index} of order) {
                for(let r=0; r<numRows; r++){
                    res += grid[r][index];
                }
            }
            return res.toUpperCase();
        } else {
            // For decryption, the text might be padded or exact.
            const grid = Array.from({length: numRows}, () => Array(keyLen).fill(''));
            let k = 0;
            for (let {index} of order) {
                for(let r=0; r<numRows; r++){
                    if (k < cleanText.length) grid[r][index] = cleanText[k++];
                }
            }
            let res = "";
            for(let r=0; r<numRows; r++){
                for(let c=0; c<keyLen; c++){
                    res += grid[r][c];
                }
            }
            return res.toLowerCase();
        }
    }
});
