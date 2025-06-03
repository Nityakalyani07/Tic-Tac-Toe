document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Element References ---
    const gameGrid = document.getElementById('game-grid');
    const statusMessage = document.getElementById('status-message');
    const playAgainBtn = document.getElementById('play-again');
    const modeToggleBtn = document.getElementById('mode-toggle');
    const themeToggleBtn = document.getElementById('theme-toggle');
    const resetGameBtn = document.getElementById('reset-game');
    const playerXScoreSpan = document.getElementById('player-x-score');
    const playerOScoreSpan = document.getElementById('player-o-score');
    const drawsScoreSpan = document.getElementById('draws-score');

    // --- Game State Variables ---
    let board = ['', '', '', '', '', '', '', '', ''];
    let currentPlayer = 'X';
    let isGameActive = true;
    let isPlayerVsAI = false; // Default to Player vs Player

    // Stored scores
    let playerXWins = parseInt(localStorage.getItem('playerXWins') || '0', 10);
    let playerOWins = parseInt(localStorage.getItem('playerOWins') || '0', 10);
    let draws = parseInt(localStorage.getItem('draws') || '0', 10);

    // Winning conditions (indices of cells)
    const winningConditions = [
        [0, 1, 2], [3, 4, 5], [6, 7, 8], // Rows
        [0, 3, 6], [1, 4, 7], [2, 5, 8], // Columns
        [0, 4, 8], [2, 4, 6]             // Diagonals
    ];

    // --- Sound Effects (Pre-load for better performance) ---
    const SOUND_PATHS = {
        move: 'assets/sounds/move.mp3',
        win: 'assets/sounds/win.mp3',
        draw: 'assets/sounds/draw.mp3',
        restart: 'assets/sounds/restart.mp3'
    };

    const sounds = {};
    for (const key in SOUND_PATHS) {
        sounds[key] = new Audio(SOUND_PATHS[key]);
        sounds[key].preload = 'auto'; // Attempt to preload
        sounds[key].volume = 0.6; // Adjust volume as needed
    }

    // Helper to play sounds with error handling
    function playSound(soundKey) {
        if (sounds[soundKey]) {
            sounds[soundKey].currentTime = 0; // Rewind to start if already playing
            sounds[soundKey].play().catch(e => console.error("Error playing sound:", e.message));
        }
    }

    // --- Initialization and Setup ---

    function initializeGame() {
        createCells();
        renderBoard();
        updateStatus(`${currentPlayer}'s Turn`);
        playAgainBtn.classList.add('hidden');
        loadThemePreference();
        updateScoresDisplay();
    }

    // Dynamically create grid cells for cleaner HTML
    function createCells() {
        gameGrid.innerHTML = ''; // Clear existing cells
        for (let i = 0; i < 9; i++) {
            const cell = document.createElement('div');
            cell.classList.add('cell');
            cell.dataset.cellIndex = i; // Store index for easy access
            cell.addEventListener('click', handleCellClick);
            gameGrid.appendChild(cell);
        }
    }

    // Update the visual representation of the board
    function renderBoard() {
        document.querySelectorAll('.cell').forEach((cell, index) => {
            cell.textContent = board[index]; // Set X or O
            // Clear all previous mark/animation/highlight classes
            cell.classList.remove('x', 'o', 'highlight-win', 'animate');
            // Add current mark class if cell is occupied
            if (board[index] === 'X') {
                cell.classList.add('x');
            } else if (board[index] === 'O') {
                cell.classList.add('o');
            }
        });
    }

    // Update the game status message
    function updateStatus(message) {
        statusMessage.textContent = message;
    }

    // Update score display in the UI and localStorage
    function updateScoresDisplay() {
        playerXScoreSpan.textContent = `X: ${playerXWins}`;
        playerOScoreSpan.textContent = `O: ${playerOWins}`;
        drawsScoreSpan.textContent = `Draws: ${draws}`;

        localStorage.setItem('playerXWins', playerXWins);
        localStorage.setItem('playerOWins', playerOWins);
        localStorage.setItem('draws', draws);
    }

    // --- Game Logic ---

    // Handles a click on a game cell
    function handleCellClick(event) {
        const clickedCell = event.target;
        const clickedCellIndex = parseInt(clickedCell.dataset.cellIndex);

        // Ignore clicks if game not active, cell already occupied, or it's AI's turn
        if (!isGameActive || board[clickedCellIndex] !== '' || (isPlayerVsAI && currentPlayer === 'O')) {
            return;
        }

        makeMove(clickedCellIndex, currentPlayer);
    }

    // Executes a move: updates board, UI, checks for win/draw, switches player
    function makeMove(index, player) {
        board[index] = player; // Update internal board state

        const cell = document.querySelector(`[data-cell-index="${index}"]`);
        cell.textContent = player; // Update cell content
        cell.classList.add(player.toLowerCase(), 'animate'); // Add mark class and animation

        playSound('move'); // Play move sound

        if (checkWin()) {
            handleWin(player);
        } else if (checkDraw()) {
            handleDraw();
        } else {
            switchPlayer();
            // If AI mode and it's AI's turn, trigger AI move after a short delay
            if (isPlayerVsAI && currentPlayer === 'O' && isGameActive) {
                setTimeout(aiMove, 700); // Give player time to see their move
            }
        }
    }

    // Switches the current player (X to O, O to X)
    function switchPlayer() {
        currentPlayer = currentPlayer === 'X' ? 'O' : 'X';
        updateStatus(`${currentPlayer}'s Turn`);
    }

    // Checks if the current board state results in a win
    function checkWin() {
        for (let i = 0; i < winningConditions.length; i++) {
            const [a, b, c] = winningConditions[i];
            if (board[a] !== '' && board[a] === board[b] && board[b] === board[c]) {
                highlightWinningCells([a, b, c]);
                return true;
            }
        }
        return false;
    }

    // Adds a class to winning cells for visual highlighting
    function highlightWinningCells(indices) {
        indices.forEach(index => {
            document.querySelector(`[data-cell-index="${index}"]`).classList.add('highlight-win');
        });
    }

    // Checks if the game is a draw (all cells filled, no win)
    function checkDraw() {
        return board.every(cell => cell !== '');
    }

    // Handles a game win
    function handleWin(winner) {
        isGameActive = false;
        updateStatus(`Player ${winner} Wins! 🎉`);
        playAgainBtn.classList.remove('hidden'); // Show "Play Again" button
        playSound('win'); // Play win sound

        if (winner === 'X') {
            playerXWins++;
        } else {
            playerOWins++;
        }
        updateScoresDisplay();
    }

    // Handles a game draw
    function handleDraw() {
        isGameActive = false;
        updateStatus(`It's a Draw! 🤝`);
        playAgainBtn.classList.remove('hidden'); // Show "Play Again" button
        playSound('draw'); // Play draw sound

        draws++;
        updateScoresDisplay();
    }

    // Resets the game board and state for a new round
    function resetGame() {
        board = ['', '', '', '', '', '', '', '', ''];
        currentPlayer = 'X';
        isGameActive = true;
        renderBoard(); // Clear marks and highlights from UI
        updateStatus(`${currentPlayer}'s Turn`);
        playAgainBtn.classList.add('hidden'); // Hide "Play Again" button
        playSound('restart'); // Play restart sound
        // If AI mode and AI is 'O' and it's AI's turn after reset
        if (isPlayerVsAI && currentPlayer === 'O') {
            setTimeout(aiMove, 700);
        }
    }

    // Resets scores and then the game
    function fullResetGame() {
        playerXWins = 0;
        playerOWins = 0;
        draws = 0;
        updateScoresDisplay(); // Update UI and localStorage for scores
        resetGame(); // Reset board and game state
        playSound('restart'); // Play restart sound
    }

    // --- AI Logic (Unbeatable Minimax Algorithm) ---

    // Object to map game outcomes to scores for Minimax
    const MINIMAX_SCORES = {
        X: -1, // AI (O) wants to minimize X's score
        O: 1,  // AI (O) wants to maximize O's score
        tie: 0
    };

    // Orchestrates the AI's move
    function aiMove() {
        // If the game just ended due to player's move, don't let AI move
        if (!isGameActive) return;

        const bestMove = findBestMove(board);
        if (bestMove !== null) {
            makeMove(bestMove, 'O');
        }
    }

    // Finds the best move for the AI using Minimax
    function findBestMove(currentBoard) {
        let bestScore = -Infinity;
        let move = null;

        for (let i = 0; i < currentBoard.length; i++) {
            if (currentBoard[i] === '') {
                currentBoard[i] = 'O'; // Try AI's move
                // Call minimax with alpha-beta pruning optimization
                let score = minimax(currentBoard, 0, false, -Infinity, Infinity);
                currentBoard[i] = ''; // Undo the move

                if (score > bestScore) {
                    bestScore = score;
                    move = i;
                }
            }
        }
        return move;
    }

    // Minimax algorithm with Alpha-Beta Pruning for efficiency
    function minimax(currentBoard, depth, isMaximizingPlayer, alpha, beta) {
        // Check for terminal states (win, lose, draw)
        const result = checkTerminalState(currentBoard);
        if (result !== null) {
            return MINIMAX_SCORES[result];
        }

        // Maximizing player (AI = 'O')
        if (isMaximizingPlayer) {
            let bestScore = -Infinity;
            for (let i = 0; i < currentBoard.length; i++) {
                if (currentBoard[i] === '') {
                    currentBoard[i] = 'O';
                    let score = minimax(currentBoard, depth + 1, false, alpha, beta);
                    currentBoard[i] = ''; // Undo

                    bestScore = Math.max(bestScore, score);
                    alpha = Math.max(alpha, bestScore);
                    if (beta <= alpha) { // Beta cut-off
                        break;
                    }
                }
            }
            return bestScore;
        }
        // Minimizing player (Human = 'X')
        else {
            let bestScore = Infinity;
            for (let i = 0; i < currentBoard.length; i++) {
                if (currentBoard[i] === '') {
                    currentBoard[i] = 'X';
                    let score = minimax(currentBoard, depth + 1, true, alpha, beta);
                    currentBoard[i] = ''; // Undo

                    bestScore = Math.min(bestScore, score);
                    beta = Math.min(beta, bestScore);
                    if (beta <= alpha) { // Alpha cut-off
                        break;
                    }
                }
            }
            return bestScore;
        }
    }

    // Helper for Minimax: checks current board for win/draw status
    function checkTerminalState(boardState) {
        // Check for win
        for (let i = 0; i < winningConditions.length; i++) {
            const [a, b, c] = winningConditions[i];
            if (boardState[a] !== '' && boardState[a] === boardState[b] && boardState[b] === boardState[c]) {
                return boardState[a]; // Returns 'X' or 'O'
            }
        }
        // Check for draw
        if (boardState.every(cell => cell !== '')) {
            return 'tie';
        }
        // No winner or draw yet
        return null;
    }


    // --- Advanced Features Handlers ---

    // Toggles between Player vs Player and Player vs AI mode
    function toggleGameMode() {
        isPlayerVsAI = !isPlayerVsAI;
        modeToggleBtn.textContent = isPlayerVsAI ? 'Player vs AI' : 'Player vs Player';
        fullResetGame(); // Full reset to apply new mode
    }

    // Toggles dark mode and saves preference to localStorage
    function toggleTheme() {
        document.body.classList.toggle('dark-mode');
        saveThemePreference();
    }

    // Loads theme preference from localStorage on page load
    function loadThemePreference() {
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme === 'dark') {
            document.body.classList.add('dark-mode');
        } else {
            document.body.classList.remove('dark-mode');
        }
    }

    // Saves theme preference to localStorage
    function saveThemePreference() {
        const isDarkMode = document.body.classList.contains('dark-mode');
        localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
    }

    // --- Event Listeners ---
    playAgainBtn.addEventListener('click', resetGame);
    resetGameBtn.addEventListener('click', fullResetGame);
    modeToggleBtn.addEventListener('click', toggleGameMode);
    themeToggleBtn.addEventListener('click', toggleTheme);

    // Initial setup when the page loads
    initializeGame();
});