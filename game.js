document.addEventListener('DOMContentLoaded', () => {
    // FPS counter variables
    let frameCount = 0;
    let fpsInterval = 1000; // Update FPS every second
    let lastTime = performance.now();
    let fps = 0;
    const fpsElement = document.getElementById('fps');
    
    // Game constants
    const BOARD_WIDTH = 10;
    const BOARD_HEIGHT = 20;
    const EMPTY = 0;
    
    // Game state
    let board = Array(BOARD_HEIGHT).fill().map(() => Array(BOARD_WIDTH).fill(EMPTY));
    let currentPiece = null;
    let nextPiece = null;
    let score = 0;
    let lines = 0;
    let level = 1;
    let isPaused = false;
    let isGameOver = false;
    let animationFrameId = null;
    let timeSinceLastDrop = 0;
    let cellCache = null;
    let nextPieceCellCache = null;
    let lastFrameTime = null;
    let needsRedraw = true;
    
    // Add at the beginning of your code
    const tetrominoPool = {};
    Object.keys(TETROMINOS).forEach(type => {
        tetrominoPool[type] = [];
        for (let i = 0; i < 3; i++) { // Pre-allocate 3 of each type
            tetrominoPool[type].push({
                shape: JSON.parse(JSON.stringify(TETROMINOS[type].shape)),
                color: TETROMINOS[type].color,
                x: 0,
                y: 0,
                type: type
            });
        }
    });
    
    // DOM Elements
    const boardElement = document.getElementById('board');
    const nextPieceElement = document.getElementById('next-piece');
    const scoreElement = document.getElementById('score');
    const linesElement = document.getElementById('lines');
    const levelElement = document.getElementById('level');
    const startButton = document.getElementById('start-button');
    const gameOverElement = document.getElementById('game-over');
    const finalScoreElement = document.getElementById('final-score');
    const restartButton = document.getElementById('restart-button');
    const playAgain = document.getElementById('play-again');
    


    // Initialize the game board
    function createBoard() {
        boardElement.innerHTML = '';
        nextPieceElement.innerHTML = '';
        
        // Create main board cells
        for (let row = 0; row < BOARD_HEIGHT; row++) {
            for (let col = 0; col < BOARD_WIDTH; col++) {
                const cell = document.createElement('div');
                cell.classList.add('cell');
                cell.dataset.row = row;
                cell.dataset.col = col;
                boardElement.appendChild(cell);
            }
        }
        
        // Create next piece preview cells
        for (let row = 0; row < 4; row++) {
            for (let col = 0; col < 4; col++) {
                const cell = document.createElement('div');
                cell.classList.add('cell');
                cell.dataset.row = row;
                cell.dataset.col = col;
                nextPieceElement.appendChild(cell);
            }
        }
    }
   

    // Get random tetromino
    function getRandomTetromino() {
        const tetrominos = Object.keys(TETROMINOS);
        const randType = tetrominos[Math.floor(Math.random() * tetrominos.length)];
        
        // Get from pool or create new if pool is empty
        let tetromino;
        if (tetrominoPool[randType].length > 0) {
            tetromino = tetrominoPool[randType].pop();
        } else {
            tetromino = {
                shape: JSON.parse(JSON.stringify(TETROMINOS[randType].shape)),
                color: TETROMINOS[randType].color,
                type: randType
            };
        }
        
        // Reset position
        tetromino.x = Math.floor(BOARD_WIDTH / 2) - 1;
        tetromino.y = 0;
        
        return tetromino;
    }

    function initializeCellCache() {
        cellCache = Array(BOARD_HEIGHT).fill().map(() => Array(BOARD_WIDTH).fill(null));
        const cells = boardElement.querySelectorAll('.cell');
        cells.forEach(cell => {
            const row = parseInt(cell.dataset.row);
            const col = parseInt(cell.dataset.col);
            if (row < BOARD_HEIGHT && col < BOARD_WIDTH) {
                cellCache[row][col] = cell;
                cell.__lastValue = EMPTY; // Initialize cache property
            }
        });
        
        // Cache for next piece preview
        nextPieceCellCache = Array(4).fill().map(() => Array(4).fill(null));
        const nextCells = nextPieceElement.querySelectorAll('.cell');
        nextCells.forEach(cell => {
            const row = parseInt(cell.dataset.row);
            const col = parseInt(cell.dataset.col);
            if (row < 4 && col < 4) {
                nextPieceCellCache[row][col] = cell;
                cell.__lastValue = EMPTY;
            }
        });
    }
    function draw() {
        if (!needsRedraw) return;
        needsRedraw = false;
        
        if (!cellCache) initializeCellCache();
        
        // Use a single string comparison for cell updates
        const emptyClass = 'cell';
        
        // Optimize board drawing
        for (let row = 0; row < BOARD_HEIGHT; row++) {
            for (let col = 0; col < BOARD_WIDTH; col++) {
                const cell = cellCache[row][col];
                let displayValue = board[row][col];
                
                // Current piece check with boundary checks first
                if (currentPiece && 
                    row >= currentPiece.y && 
                    row < currentPiece.y + currentPiece.shape.length &&
                    col >= currentPiece.x && 
                    col < currentPiece.x + currentPiece.shape[0].length) {
                    const pr = row - currentPiece.y;
                    const pc = col - currentPiece.x;
                    if (currentPiece.shape[pr][pc]) {
                        displayValue = currentPiece.color;
                    }
                }
                
                // Faster value comparison
                if (cell.__lastValue !== displayValue) {
                    cell.className = displayValue === EMPTY ? emptyClass : `cell filled ${displayValue}`;
                    cell.__lastValue = displayValue; // Use direct property instead of dataset
                }
            }
        }

        // Optimize next piece drawing
        if (nextPiece) {
            const nextColor = nextPiece.color;
            const shape = nextPiece.shape;
            const rowOffset = Math.floor((4 - shape.length) / 2);
            const colOffset = Math.floor((4 - shape[0].length) / 2);
            
            for (let row = 0; row < shape.length; row++) {
                for (let col = 0; col < shape[row].length; col++) {
                    if (shape[row][col]) {
                        const r = row + rowOffset;
                        const c = col + colOffset;
                        if (r >= 0 && r < 4 && c >= 0 && c < 4) {
                            const cell = nextPieceCellCache[r][c];
                            if (cell.__lastValue !== nextColor) {
                                cell.className = `cell filled ${nextColor}`;
                                cell.__lastValue = nextColor;
                            }
                        }
                    }
                }
            }
            
            // Clear only necessary cells
            for (let row = 0; row < 4; row++) {
                for (let col = 0; col < 4; col++) {
                    const cell = nextPieceCellCache[row][col];
                    if (cell.__lastValue && !(row >= rowOffset && row < rowOffset + shape.length &&
                                             col >= colOffset && col < colOffset + shape[0].length &&
                                             shape[row - rowOffset][col - colOffset])) {
                        cell.className = emptyClass;
                        cell.__lastValue = null;
                    }
                }
            }
        }
        
        // Update score display
        scoreElement.textContent = score;
        linesElement.textContent = lines;
        levelElement.textContent = level;
    }

    // Check if the current position is valid
    function isValidMove(piece, offsetX = 0, offsetY = 0) {
        const { shape, x, y } = piece;

        for (let row = 0; row < shape.length; row++) {
            for (let col = 0; col < shape[row].length; col++) {
                if (shape[row][col]) {
                    const newRow = y + row + offsetY;
                    const newCol = x + col + offsetX;
                    
                    // Check boundaries
                    if (newCol < 0 || newCol >= BOARD_WIDTH || newRow >= BOARD_HEIGHT) {
                        return false;
                    }
                    
                    // Check collision with existing pieces
                    if (newRow >= 0 && board[newRow][newCol] !== EMPTY) {
                        return false;
                    }
                }
            }
        }
        return true;
    }

    // Move the piece
    function movePiece(offsetX, offsetY) {
        if (!currentPiece || isPaused || isGameOver) return;
        
        if (isValidMove(currentPiece, offsetX, offsetY)) {
            currentPiece.x += offsetX;
            currentPiece.y += offsetY;
            needsRedraw = true;
            return true;
        }
        return false;
    }

    // Rotate the piece
    function rotatePiece() {
        if (!currentPiece || isPaused || isGameOver) return;
        
        // Create a clone to test rotation
        const rotatedPiece = {
            ...currentPiece,
            shape: currentPiece.shape.map(row => [...row])
        };
        
        // Transpose matrix
        const N = rotatedPiece.shape.length;
        for (let i = 0; i < N; i++) {
            for (let j = i; j < N; j++) {
                const temp = rotatedPiece.shape[i][j];
                rotatedPiece.shape[i][j] = rotatedPiece.shape[j][i];
                rotatedPiece.shape[j][i] = temp;
            }
        }
        
        // Reverse each row
        for (let i = 0; i < N; i++) {
            rotatedPiece.shape[i].reverse();
        }
        
        // Check if rotation is valid
        if (isValidMove(rotatedPiece)) {
            currentPiece.shape = rotatedPiece.shape;
            needsRedraw = true;
        }
        // If rotation failed, try wall kicks
        if (!isValidMove(rotatedPiece)) {
        // Try kicking off the right wall
        rotatedPiece.x -= 1;
        if (isValidMove(rotatedPiece)) {
            currentPiece.shape = rotatedPiece.shape;
            currentPiece.x -= 1;
            needsRedraw = true;
            return;
        }
        
        // Try kicking off the left wall
        rotatedPiece.x += 2; // +2 because we already did -1
        if (isValidMove(rotatedPiece)) {
            currentPiece.shape = rotatedPiece.shape;
            currentPiece.x += 1;
            needsRedraw = true;
            return;
        }
        
        // Reset position if all kicks failed
        rotatedPiece.x -= 1;
    } else {
        currentPiece.shape = rotatedPiece.shape;
        needsRedraw = true;
    }
    }

    // Fix the current piece to the board
    function fixPiece() {
        for (let row = 0; row < currentPiece.shape.length; row++) {
            for (let col = 0; col < currentPiece.shape[row].length; col++) {
                if (currentPiece.shape[row][col]) {
                    const boardRow = currentPiece.y + row;
                    const boardCol = currentPiece.x + col;
                    if (boardRow >= 0) {
                        board[boardRow][boardCol] = currentPiece.color;
                    } else {
                        // Game over if piece is fixed outside the board
                        endGame();
                        return;
                    }
                }
            }
        }
        
        // Check for completed lines
        checkLines();
        
        // Get next piece
        currentPiece = nextPiece;
        nextPiece = getRandomTetromino();
        needsRedraw = true;
        
        // Check if the new piece can be placed
        if (!isValidMove(currentPiece)) {
            endGame();
        }
    }

    // Hard drop - move piece down as far as possible
    function hardDrop() {
        if (!currentPiece || isPaused || isGameOver) return;
        
        while (movePiece(0, 1)) {
            // Keep moving down until it can't move further
        }
        fixPiece();
    }

    // Check for completed lines
    function checkLines() {
        let linesCleared = 0;
    const linesToClear = [];
    
    // First pass: identify lines to clear (scan from bottom up)
    for (let row = BOARD_HEIGHT - 1; row >= 0; row--) {
        if (board[row].every(cell => cell !== EMPTY)) {
            linesToClear.push(row);
            linesCleared++;
        }
    }
    
    // If no lines to clear, return early
    if (linesCleared === 0) return;
    
    // Use offscreen board to prepare the new state
    const offscreenBoard = Array(BOARD_HEIGHT).fill().map(() => Array(BOARD_WIDTH).fill(EMPTY));
    
    // Copy non-cleared lines to offscreen board (bottom-up approach)
    let targetRow = BOARD_HEIGHT - 1;
    for (let sourceRow = BOARD_HEIGHT - 1; sourceRow >= 0; sourceRow--) {
        if (!linesToClear.includes(sourceRow)) {
            // Copy this row to the target position
            for (let col = 0; col < BOARD_WIDTH; col++) {
                offscreenBoard[targetRow][col] = board[sourceRow][col];
            }
            targetRow--;
        }
    }
    
    // Copy the offscreen board back to the main board
    for (let row = 0; row < BOARD_HEIGHT; row++) {
        for (let col = 0; col < BOARD_WIDTH; col++) {
            board[row][col] = offscreenBoard[row][col];
        }
    }
    
    // Schedule score update for the next frame to avoid blocking
    requestAnimationFrame(() => {
        updateScore(linesCleared);
        needsRedraw = true;
    });
    }

    // Update score
    function updateScore(linesCleared) {
        // Pre-calculate all values
    const linePoints = [0, 100, 300, 500, 800];
    const pointsToAdd = linePoints[linesCleared] * level;
    
    // Update variables
    score += pointsToAdd;
    lines += linesCleared;
    
    // Only update level if it changed
    const newLevel = Math.floor(lines / 10) + 1;
    const levelChanged = newLevel > level;
    if (levelChanged) {
        level = newLevel;
    }
    
    // Batch DOM updates
    scoreElement.textContent = score;
    linesElement.textContent = lines;
    if (levelChanged) {
        levelElement.textContent = level;
    }
    }

    // Start the game
    function startGame() {
        // Cancel any existing animation frame
        if (animationFrameId) {
            cancelAnimationFrame(animationFrameId);
        }

         for (let row = 0; row < BOARD_HEIGHT; row++) {
        board[row].fill(EMPTY);  // Reset instead of recreating the array
    }
        
        // Reset game state
        currentPiece = getRandomTetromino();
        nextPiece = getRandomTetromino();
        score = 0;
        lines = 0;
        level = 1;
        isPaused = false;
        isGameOver = false;
        timeSinceLastDrop = 0;
        lastFrameTime = performance.now();

        // Reset start button
        startButton.textContent = 'Pause';
        
        // Hide game over screen
        gameOverElement.style.display = 'none';

    // Start the game loop
    frameCount = 0;
    requestAnimationFrame(gameLoop);
    }
    // Start game loop with requestAnimationFrame
    const FIXED_TIMESTEP = 16.67; // ~60 FPS
    let accumulator = 0;

    function gameLoop(timestamp) {
        const now = timestamp || performance.now();
        const deltaTime = Math.min(lastFrameTime ? now - lastFrameTime : FIXED_TIMESTEP, 100);
        lastFrameTime = now;
        
        // FPS calculation
        frameCount++;
        if (now - lastTime > fpsInterval) {
            fps = Math.round((frameCount * 1000) / (now - lastTime));
            fpsElement.textContent = fps;
            frameCount = 0;
            lastTime = now;
        }
        
        if (!isPaused && !isGameOver) {
            accumulator += deltaTime;
            
            while (accumulator >= FIXED_TIMESTEP) {
                // Update game state at fixed intervals
                timeSinceLastDrop += FIXED_TIMESTEP;
                const dropInterval = Math.max(100, 1000 - (level - 1) * 100);
                
                if (timeSinceLastDrop > dropInterval) {
                    if (!movePiece(0, 1)) {
                        fixPiece();
                    }
                    timeSinceLastDrop = 0;
                }
                
                accumulator -= FIXED_TIMESTEP;
            }
        }
        
        // Only draw if needed
        if (needsRedraw) {
            draw();
        }
        
        animationFrameId = requestAnimationFrame(gameLoop);
    }

    // Pause/resume the game
    function togglePause() {
        if (isGameOver) {
            startGame();
            return;
        }
        
        isPaused = !isPaused;
        startButton.textContent = isPaused ? 'Resume' : 'Pause';
    }

    // End the game
    function endGame() {
        isGameOver = true;
        isPaused = true;
        // clearInterval(gameInterval);
        
        // Stop FPS counter
        // if (animationFrameId) {
        //     cancelAnimationFrame(animationFrameId);
        //     animationFrameId = null;
        // }
        
        finalScoreElement.textContent = score;
        gameOverElement.style.display = 'block';
    }

    // Handle keyboard input
    function handleKeydown(e) {
        if (isGameOver) return;
        e.preventDefault();
        
        switch (e.key) {
            case 'ArrowLeft':
                movePiece(-1, 0);
                break;
            case 'ArrowRight':
                movePiece(1, 0);
                break;
            case 'ArrowDown':
                movePiece(0, 1);
                break;
            case 'ArrowUp':
                rotatePiece();
                break;
            case ' ':
                hardDrop();
                break;
            case 'p':
                togglePause();
                break;
        }
    }

    // Event listeners
    document.addEventListener('keydown', handleKeydown);
    startButton.addEventListener('click', togglePause);
    restartButton.addEventListener('click', startGame);
    playAgain.addEventListener('click', startGame);

    // Initialize the game
    createBoard();
    
    startGame(); 

    // When a piece is no longer needed, return it to the pool
    function recycleTetromino(tetromino) {
        if (tetromino && tetromino.type) {
            tetrominoPool[tetromino.type].push(tetromino);
        }
    }
});