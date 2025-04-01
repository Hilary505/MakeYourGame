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
    const TARGET_FPS = 60;
    const FRAME_TIME = 1000 / TARGET_FPS;
    
    // Game state
    let board = Array(BOARD_HEIGHT).fill().map(() => Array(BOARD_WIDTH).fill(EMPTY));
    let currentPiece = null;
    let nextPiece = null;
    let score = 0;
    let lines = 0;
    let level = 1;
    let gameInterval = null;
    let isPaused = false;
    let isGameOver = false;
    let animationFrameId = null;
    let timeSinceLastDrop = 0;
    let cellCache = null;
    let nextPieceCellCache = null;
    let lastFrameTime = null;
    
    

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
    

    // FPS counter function
    function updateFPS() {
        frameCount++;
        const currentTime = performance.now();
        const elapsedTime = currentTime - lastTime;

        if (elapsedTime >= fpsInterval) {
            fps = Math.round((frameCount * 1000) / elapsedTime);
            fpsElement.textContent = fps;
            frameCount = 0;
            lastTime = currentTime;
        }
        
        // Only request next frame if game is running
        if (!isGameOver) {
            animationFrameId = requestAnimationFrame(updateFPS);
        }
    }

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
    // Add this after creating the board
    function enableHardwareAcceleration() {
        boardElement.style.transform = 'translateZ(0)';
        boardElement.style.willChange = 'transform';
        boardElement.style.backfaceVisibility = 'hidden';
    
        nextPieceElement.style.transform = 'translateZ(0)';
        nextPieceElement.style.willChange = 'transform';
        nextPieceElement.style.backfaceVisibility = 'hidden';
    }

    // Get random tetromino
    function getRandomTetromino() {
        const tetrominos = Object.keys(TETROMINOS);
        const randTetromino = tetrominos[Math.floor(Math.random() * tetrominos.length)];
        return {
            ...JSON.parse(JSON.stringify(TETROMINOS[randTetromino])),
            x: Math.floor(BOARD_WIDTH / 2) - 1,
            y: 0,
            type: randTetromino
        };
    }


function draw() {
    // Initialize cell cache if not done yet
    if (!cellCache) {
        cellCache = Array(BOARD_HEIGHT).fill().map(() => Array(BOARD_WIDTH).fill(null));
        const cells = boardElement.querySelectorAll('.cell');
        cells.forEach(cell => {
            const row = parseInt(cell.dataset.row);
            const col = parseInt(cell.dataset.col);
            if (row < BOARD_HEIGHT && col < BOARD_WIDTH) {
                cellCache[row][col] = cell;
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
            }
        });
    }
    
    // Create a board state that includes the current piece
    const tempBoard = JSON.parse(JSON.stringify(board));
    
    // Add current piece to temporary board
    if (currentPiece) {
        for (let row = 0; row < currentPiece.shape.length; row++) {
            for (let col = 0; col < currentPiece.shape[row].length; col++) {
                if (currentPiece.shape[row][col]) {
                    const boardRow = currentPiece.y + row;
                    const boardCol = currentPiece.x + col;
                    if (boardRow >= 0 && boardRow < BOARD_HEIGHT && boardCol >= 0 && boardCol < BOARD_WIDTH) {
                        tempBoard[boardRow][boardCol] = currentPiece.color;
                    }
                }
            }
        }
    }
    
    // Update board cells
    for (let row = 0; row < BOARD_HEIGHT; row++) {
        for (let col = 0; col < BOARD_WIDTH; col++) {
            const cell = cellCache[row][col];
            const value = tempBoard[row][col];
            
            if (value !== EMPTY) {
                // Cell should be filled
                if (!cell.classList.contains('filled') || 
                    !cell.classList.contains(value)) {
                    cell.className = 'cell filled ' + value;
                }
            } else if (cell.classList.contains('filled')) {
                // Cell should be empty
                cell.className = 'cell';
            }
        }
    }
    
    // Update next piece preview
    // First clear all next piece cells
    for (let row = 0; row < 4; row++) {
        for (let col = 0; col < 4; col++) {
            nextPieceCellCache[row][col].className = 'cell';
        }
    }
    
    // Then draw the next piece
    if (nextPiece) {
        for (let row = 0; row < nextPiece.shape.length; row++) {
            for (let col = 0; col < nextPiece.shape[row].length; col++) {
                if (nextPiece.shape[row][col]) {
                    const previewRow = row + Math.floor((4 - nextPiece.shape.length) / 2);
                    const previewCol = col + Math.floor((4 - nextPiece.shape[row].length) / 2);
                    if (previewRow >= 0 && previewRow < 4 && previewCol >= 0 && previewCol < 4) {
                        const cell = nextPieceCellCache[previewRow][previewCol];
                        cell.className = 'cell filled ' + nextPiece.color;
                    }
                }
            }
        }
    }
    
    // Update score display (no change needed here)
    scoreElement.textContent = score;
    linesElement.textContent = lines;
    levelElement.textContent = level;
}

    // Check if the current position is valid
    function isValidMove(piece, offsetX = 0, offsetY = 0) {
        for (let row = 0; row < piece.shape.length; row++) {
            for (let col = 0; col < piece.shape[row].length; col++) {
                if (piece.shape[row][col]) {
                    const newRow = piece.y + row + offsetY;
                    const newCol = piece.x + col + offsetX;
                    
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
            draw();
            return true;
        }
        return false;
    }

    // Rotate the piece
    function rotatePiece() {
        if (!currentPiece || isPaused || isGameOver) return;
        
        // Create a clone to test rotation
        const rotatedPiece = JSON.parse(JSON.stringify(currentPiece));
        
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
            draw();
        }
        // If rotation failed, try wall kicks
        if (!isValidMove(rotatedPiece)) {
        // Try kicking off the right wall
        rotatedPiece.x -= 1;
        if (isValidMove(rotatedPiece)) {
            currentPiece.shape = rotatedPiece.shape;
            currentPiece.x -= 1;
            draw();
            return;
        }
        
        // Try kicking off the left wall
        rotatedPiece.x += 2; // +2 because we already did -1
        if (isValidMove(rotatedPiece)) {
            currentPiece.shape = rotatedPiece.shape;
            currentPiece.x += 1;
            draw();
            return;
        }
        
        // Reset position if all kicks failed
        rotatedPiece.x -= 1;
    } else {
        currentPiece.shape = rotatedPiece.shape;
        draw();
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
        draw();
        
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
        
        for (let row = BOARD_HEIGHT - 1; row >= 0; row--) {
            if (board[row].every(cell => cell !== EMPTY)) {
                // Remove the line
                board.splice(row, 1);
                // Add a new empty line at the top
                board.unshift(Array(BOARD_WIDTH).fill(EMPTY));
                linesCleared++;
                row++; // Check the same row again after moving lines down
            }
        }
        
        if (linesCleared > 0) {
            updateScore(linesCleared);
        }
    }

    // Update score
    function updateScore(linesCleared) {
        const linePoints = [0, 100, 300, 500, 800]; // 0, 1, 2, 3, 4 lines
        score += linePoints[linesCleared] * level;
        lines += linesCleared;
        
        // Level up every 10 lines
        const newLevel = Math.floor(lines / 10) + 1;
        if (newLevel > level) {
            level = newLevel;
            speedUp();
        }
    }

    // Start the game
    function startGame() {
        // if (gameInterval) {
        //     clearInterval(gameInterval);
        // }
        
        // Cancel any existing animation frame
        if (animationFrameId) {
            cancelAnimationFrame(animationFrameId);
        }
        
        // Reset game state
        board = Array(BOARD_HEIGHT).fill().map(() => Array(BOARD_WIDTH).fill(EMPTY));
        currentPiece = getRandomTetromino();
        nextPiece = getRandomTetromino();
        score = 0;
        lines = 0;
        level = 1;
        isPaused = false;
        isGameOver = false;
        timeSinceLastDrop = 0;
        lastFrameTime = null;

        // Reset start button
        startButton.textContent = 'Pause';
        
        // Hide game over screen
        gameOverElement.style.display = 'none';

    // Start the game loop
    lastTime = performance.now();
    frameCount = 0;
    animationFrameId = requestAnimationFrame(gameLoop);
        
        draw();
    }
    // Start game loop with requestAnimationFrame
    function gameLoop(timestamp) {
    const now = timestamp || performance.now();
    const deltaTime = now - (lastFrameTime || now);
    lastFrameTime = now;
    
    // Update FPS counter
    frameCount++;
    const fpsElapsed = now - lastTime;
    if (fpsElapsed >= fpsInterval) {
        fps = Math.round((frameCount * 1000) / fpsElapsed);
        fpsElement.textContent = fps;
        frameCount = 0;
        lastTime = now;
    }
    
    if (!isPaused && !isGameOver) {
        // Handle game logic at appropriate intervals
        timeSinceLastDrop += deltaTime;
        const dropInterval = Math.max(100, 1000 - (level - 1) * 100); // Same as your speedUp function
        
        if (timeSinceLastDrop > dropInterval) {
            if (!movePiece(0, 1)) {
                fixPiece();
            }
            timeSinceLastDrop = 0;
        }
    }
    
    // Always draw every frame for smooth rendering
    draw();
    
    // Request next frame
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
        if (animationFrameId) {
            cancelAnimationFrame(animationFrameId);
            animationFrameId = null;
        }
        
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
    enableHardwareAcceleration();
    startGame(); 
});