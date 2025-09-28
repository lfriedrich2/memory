/**
 * Memory Pro - Professional Edition
 * Advanced implementation of the classic Memory/Concentration game
 * 
 * Features:
 * - Multiple difficulty levels
 * - Different card themes
 * - Two-player gameplay
 * - Score tracking and statistics
 * - Customizable settings
 * - Professional animations
 * - Progressive Web App capabilities
 */

class MemoryPro {
  constructor() {
    // Game constants
    this.DIFFICULTIES = {
      easy: { cols: 4, rows: 3, pairs: 6 },
      medium: { cols: 4, rows: 4, pairs: 8 },
      hard: { cols: 6, rows: 4, pairs: 12 },
      expert: { cols: 6, rows: 6, pairs: 18 }
    };
    
    this.THEMES = {
      emoji: ['🎯', '🎮', '🎨', '🎭', '🎪', '🎵', '🎸', '🎺', '🎻', '🎲', '🎳', '🎱', '🏀', '⚽', '🏈', '🎾', '🏐', '🏓'],
      animals: ['🐱', '🐶', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯', '🦁', '🐸', '🐵', '🐧', '🐦', '🦆', '🦅', '🦋'],
      fruits: ['🍎', '🍊', '🍋', '🍌', '🍉', '🍇', '🍓', '🫐', '🍈', '🍒', '🍑', '🥭', '🍍', '🥥', '🥝', '🍅', '🥑', '🌶️'],
      shapes: ['🔴', '🟠', '🟡', '🟢', '🔵', '🟣', '⚫', '⚪', '🔺', '🔻', '🔶', '🔷', '🔸', '🔹', '⭐', '✨', '💎', '🔥'],
      numbers: ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟', '0️⃣', '#️⃣', '*️⃣', '➕', '➖', '➗', '✖️', '🆔']
    };
    
    // Game state
    this.gameState = 'setup'; // setup, playing, paused, finished
    this.difficulty = 'medium';
    this.theme = 'emoji';
    this.cards = [];
    this.flippedCards = [];
    this.matchedPairs = 0;
    this.currentPlayer = 1;
    this.moves = 0;
    this.startTime = null;
    this.gameTime = 0;
    this.timerInterval = null;
    this.flipBackTimeout = null;
    
    // Player data
    this.players = {
      1: { name: 'Spieler 1', pairs: 0, moves: 0 },
      2: { name: 'Spieler 2', pairs: 0, moves: 0 }
    };
    
    // Settings
    this.settings = {
      soundEffects: true,
      animations: true,
      hintsEnabled: true,
      autoFlipBack: false,
      flipDelay: 1000
    };
    
    // DOM elements
    this.boardEl = document.getElementById('memory-board');
    this.settingsPanelEl = document.getElementById('settings-panel');
    this.scoreBoardEl = document.getElementById('score-board');
    this.gameStatusEl = document.getElementById('game-status');
    this.gameControlsEl = document.getElementById('game-controls');
    this.boardContainerEl = document.getElementById('memory-board-container');
    
    this.init();
  }
  
  init() {
    this.loadSettings();
    this.setupEventListeners();
    this.updateAnimationState();
  }
  
  setupEventListeners() {
    // Settings panel
    document.getElementById('start-game').addEventListener('click', () => this.startGame());
    document.getElementById('difficulty').addEventListener('change', (e) => this.difficulty = e.target.value);
    document.getElementById('theme').addEventListener('change', (e) => this.theme = e.target.value);
    
    // Player names
    document.getElementById('player1-name').addEventListener('input', (e) => {
      this.players[1].name = e.target.value || 'Spieler 1';
    });
    document.getElementById('player2-name').addEventListener('input', (e) => {
      this.players[2].name = e.target.value || 'Spieler 2';
    });
    
    // Game controls
    document.getElementById('new-game').addEventListener('click', () => this.newGame());
    document.getElementById('pause-game').addEventListener('click', () => this.pauseGame());
    document.getElementById('hint-button').addEventListener('click', () => this.showHint());
    document.getElementById('game-settings').addEventListener('click', () => this.showSettings());
    
    // Game over overlay
    document.getElementById('play-again').addEventListener('click', () => this.playAgain());
    document.getElementById('new-settings').addEventListener('click', () => this.backToSettings());
    
    // Pause overlay
    document.getElementById('resume-game').addEventListener('click', () => this.resumeGame());
    document.getElementById('quit-game').addEventListener('click', () => this.quitGame());
    
    // Settings modal
    document.getElementById('save-settings').addEventListener('click', () => this.saveSettings());
    document.getElementById('close-settings').addEventListener('click', () => this.hideSettings());
    
    // Real-time animation preview
    document.getElementById('animations').addEventListener('change', (e) => {
      this.settings.animations = e.target.checked;
      this.updateAnimationState();
    });
    
    // Keyboard support
    document.addEventListener('keydown', (e) => this.handleKeyboard(e));
    
    // Visibility change handler
    document.addEventListener('visibilitychange', () => this.handleVisibilityChange());
    
    // Close overlays on outside click
    this.setupOverlayHandlers();
  }
  
  setupOverlayHandlers() {
    const overlays = ['game-over-overlay', 'pause-overlay', 'settings-modal'];
    overlays.forEach(id => {
      const overlay = document.getElementById(id);
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
          this.hideOverlay(id);
        }
      });
    });
  }
  
  startGame() {
    // Get player names
    this.players[1].name = document.getElementById('player1-name').value || 'Spieler 1';
    this.players[2].name = document.getElementById('player2-name').value || 'Spieler 2';
    
    // Initialize game
    this.gameState = 'playing';
    this.currentPlayer = 1;
    this.moves = 0;
    this.matchedPairs = 0;
    this.startTime = Date.now();
    this.gameTime = 0;
    
    // Reset player stats
    this.players[1].pairs = 0;
    this.players[1].moves = 0;
    this.players[2].pairs = 0;
    this.players[2].moves = 0;
    
    // Show game elements
    this.settingsPanelEl.style.display = 'none';
    this.scoreBoardEl.style.display = 'flex';
    this.gameStatusEl.style.display = 'block';
    this.gameControlsEl.style.display = 'flex';
    this.boardContainerEl.style.display = 'block';
    
    // Generate cards and render board
    this.generateCards();
    this.renderBoard();
    this.startTimer();
    this.updateDisplay();
    
    this.playSound('start');
  }
  
  generateCards() {
    const config = this.DIFFICULTIES[this.difficulty];
    const totalCards = config.pairs * 2;
    const availableSymbols = this.THEMES[this.theme];
    
    // Select random symbols for this game
    const selectedSymbols = this.shuffleArray([...availableSymbols]).slice(0, config.pairs);
    
    // Create card pairs
    this.cards = [];
    selectedSymbols.forEach((symbol, index) => {
      // Add two cards for each symbol
      this.cards.push({ id: index * 2, symbol, matched: false, flipped: false });
      this.cards.push({ id: index * 2 + 1, symbol, matched: false, flipped: false });
    });
    
    // Shuffle the cards
    this.cards = this.shuffleArray(this.cards);
  }
  
  renderBoard() {
    const config = this.DIFFICULTIES[this.difficulty];
    this.boardEl.className = `memory-board ${this.difficulty}`;
    this.boardEl.innerHTML = '';
    
    this.cards.forEach((card, index) => {
      const cardEl = this.createCardElement(card, index);
      this.boardEl.appendChild(cardEl);
    });
  }
  
  createCardElement(card, index) {
    const cardEl = document.createElement('div');
    cardEl.className = 'memory-card';
    cardEl.dataset.index = index;
    cardEl.setAttribute('tabindex', '0');
    cardEl.setAttribute('aria-label', `Karte ${index + 1}`);
    
    cardEl.innerHTML = `
      <div class="card-face card-back">?</div>
      <div class="card-face card-front">${card.symbol}</div>
    `;
    
    cardEl.addEventListener('click', () => this.flipCard(index));
    cardEl.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        this.flipCard(index);
      }
    });
    
    return cardEl;
  }
  
  flipCard(index) {
    if (this.gameState !== 'playing') return;
    if (this.flippedCards.length >= 2) return;
    
    const card = this.cards[index];
    if (card.flipped || card.matched) return;
    
    // Flip the card
    card.flipped = true;
    this.flippedCards.push(index);
    
    const cardEl = document.querySelector(`[data-index="${index}"]`);
    cardEl.classList.add('flipped');
    cardEl.setAttribute('aria-label', `Karte ${index + 1}, ${card.symbol}`);
    
    this.playSound('flip');
    
    // Check if two cards are flipped
    if (this.flippedCards.length === 2) {
      this.moves++;
      this.players[this.currentPlayer].moves++;
      this.checkMatch();
    }
    
    this.updateDisplay();
  }
  
  checkMatch() {
    const [firstIndex, secondIndex] = this.flippedCards;
    const firstCard = this.cards[firstIndex];
    const secondCard = this.cards[secondIndex];
    
    if (firstCard.symbol === secondCard.symbol) {
      // Match found!
      this.handleMatch(firstIndex, secondIndex);
    } else {
      // No match
      this.handleNoMatch(firstIndex, secondIndex);
    }
  }
  
  handleMatch(firstIndex, secondIndex) {
    const firstCard = this.cards[firstIndex];
    const secondCard = this.cards[secondIndex];
    
    // Mark cards as matched
    firstCard.matched = true;
    secondCard.matched = true;
    
    // Update player score
    this.players[this.currentPlayer].pairs++;
    this.matchedPairs++;
    
    // Visual feedback
    setTimeout(() => {
      const firstEl = document.querySelector(`[data-index="${firstIndex}"]`);
      const secondEl = document.querySelector(`[data-index="${secondIndex}"]`);
      
      firstEl.classList.add('matched');
      secondEl.classList.add('matched');
      
      // Reset flipped cards array
      this.flippedCards = [];
      
      this.playSound('match');
      
      // Check if game is finished
      if (this.matchedPairs === this.DIFFICULTIES[this.difficulty].pairs) {
        this.finishGame();
      } else {
        // Current player continues
        this.updateDisplay();
      }
    }, 500);
  }
  
  handleNoMatch(firstIndex, secondIndex) {
    // Show cards for a moment, then flip back
    setTimeout(() => {
      const firstCard = this.cards[firstIndex];
      const secondCard = this.cards[secondIndex];
      
      firstCard.flipped = false;
      secondCard.flipped = false;
      
      const firstEl = document.querySelector(`[data-index="${firstIndex}"]`);
      const secondEl = document.querySelector(`[data-index="${secondIndex}"]`);
      
      firstEl.classList.remove('flipped');
      secondEl.classList.remove('flipped');
      
      firstEl.setAttribute('aria-label', `Karte ${firstIndex + 1}`);
      secondEl.setAttribute('aria-label', `Karte ${secondIndex + 1}`);
      
      // Reset flipped cards and switch player
      this.flippedCards = [];
      this.switchPlayer();
      
      this.playSound('nomatch');
      this.updateDisplay();
    }, this.settings.flipDelay);
  }
  
  switchPlayer() {
    this.currentPlayer = this.currentPlayer === 1 ? 2 : 1;
  }
  
  updateDisplay() {
    // Update score board
    document.getElementById('player1-display').textContent = this.players[1].name;
    document.getElementById('player2-display').textContent = this.players[2].name;
    
    document.querySelector('#player1-score .pairs-value').textContent = this.players[1].pairs;
    document.querySelector('#player2-score .pairs-value').textContent = this.players[2].pairs;
    
    // Calculate success rates
    const p1Rate = this.players[1].moves > 0 ? Math.round((this.players[1].pairs * 2 / this.players[1].moves) * 100) : 0;
    const p2Rate = this.players[2].moves > 0 ? Math.round((this.players[2].pairs * 2 / this.players[2].moves) * 100) : 0;
    
    document.querySelector('#player1-score .percentage-value').textContent = `${p1Rate}%`;
    document.querySelector('#player2-score .percentage-value').textContent = `${p2Rate}%`;
    
    // Update active player
    document.querySelectorAll('.player-score').forEach(el => el.classList.remove('active'));
    document.getElementById(`player${this.currentPlayer}-score`).classList.add('active');
    
    // Update current player display
    document.getElementById('current-player').textContent = this.players[this.currentPlayer].name;
    document.querySelector('.player-dot').className = `player-dot p${this.currentPlayer}`;
    
    // Update game info
    document.getElementById('moves-count').textContent = this.moves;
    document.getElementById('pairs-remaining').textContent = 
      this.DIFFICULTIES[this.difficulty].pairs - this.matchedPairs;
  }
  
  startTimer() {
    this.timerInterval = setInterval(() => {
      if (this.gameState === 'playing') {
        this.gameTime = Date.now() - this.startTime;
        this.updateTimeDisplay();
      }
    }, 1000);
  }
  
  updateTimeDisplay() {
    const minutes = Math.floor(this.gameTime / 60000);
    const seconds = Math.floor((this.gameTime % 60000) / 1000);
    const timeString = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    document.getElementById('time-display').textContent = timeString;
  }
  
  finishGame() {
    this.gameState = 'finished';
    clearInterval(this.timerInterval);
    
    // Determine winner
    let winner = null;
    if (this.players[1].pairs > this.players[2].pairs) {
      winner = 1;
    } else if (this.players[2].pairs > this.players[1].pairs) {
      winner = 2;
    }
    
    // Show game over screen
    setTimeout(() => {
      this.showGameOverScreen(winner);
    }, 1000);
    
    this.playSound('finish');
    this.saveGameStats(winner);
  }
  
  showGameOverScreen(winner) {
    const overlay = document.getElementById('game-over-overlay');
    const winnerText = document.getElementById('winner-text');
    
    if (winner) {
      winnerText.textContent = `🎉 ${this.players[winner].name} gewinnt!`;
    } else {
      winnerText.textContent = '🤝 Unentschieden!';
    }
    
    // Update final stats
    document.getElementById('final-score').textContent = 
      `${this.players[1].pairs} - ${this.players[2].pairs}`;
    
    const minutes = Math.floor(this.gameTime / 60000);
    const seconds = Math.floor((this.gameTime % 60000) / 1000);
    document.getElementById('final-time').textContent = 
      `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    
    document.getElementById('final-moves').textContent = this.moves;
    
    const successRate = this.moves > 0 ? Math.round((this.matchedPairs * 2 / this.moves) * 100) : 0;
    document.getElementById('final-success-rate').textContent = `${successRate}%`;
    
    overlay.classList.add('show');
  }
  
  // Game control methods
  newGame() {
    this.backToSettings();
  }
  
  pauseGame() {
    if (this.gameState === 'playing') {
      this.gameState = 'paused';
      document.getElementById('pause-overlay').classList.add('show');
      this.playSound('pause');
    }
  }
  
  resumeGame() {
    if (this.gameState === 'paused') {
      this.gameState = 'playing';
      this.startTime = Date.now() - this.gameTime; // Adjust start time
      document.getElementById('pause-overlay').classList.remove('show');
    }
  }
  
  quitGame() {
    this.gameState = 'setup';
    this.hideAllOverlays();
    this.backToSettings();
  }
  
  playAgain() {
    this.hideAllOverlays();
    this.startGame();
  }
  
  backToSettings() {
    this.gameState = 'setup';
    clearInterval(this.timerInterval);
    
    // Hide game elements
    this.scoreBoardEl.style.display = 'none';
    this.gameStatusEl.style.display = 'none';
    this.gameControlsEl.style.display = 'none';
    this.boardContainerEl.style.display = 'none';
    
    // Show settings
    this.settingsPanelEl.style.display = 'block';
    
    this.hideAllOverlays();
  }
  
  showHint() {
    if (!this.settings.hintsEnabled || this.gameState !== 'playing') return;
    
    // Find unmatched cards
    const unmatched = this.cards
      .map((card, index) => ({ ...card, index }))
      .filter(card => !card.matched && !card.flipped);
    
    if (unmatched.length < 2) return;
    
    // Find a matching pair
    for (let i = 0; i < unmatched.length; i++) {
      for (let j = i + 1; j < unmatched.length; j++) {
        if (unmatched[i].symbol === unmatched[j].symbol) {
          // Show hint
          const cardEl1 = document.querySelector(`[data-index="${unmatched[i].index}"]`);
          const cardEl2 = document.querySelector(`[data-index="${unmatched[j].index}"]`);
          
          cardEl1.classList.add('hint');
          cardEl2.classList.add('hint');
          
          setTimeout(() => {
            cardEl1.classList.remove('hint');
            cardEl2.classList.remove('hint');
          }, 2000);
          
          this.playSound('hint');
          return;
        }
      }
    }
  }
  
  // Settings management
  showSettings() {
    document.getElementById('sound-effects').checked = this.settings.soundEffects;
    document.getElementById('animations').checked = this.settings.animations;
    document.getElementById('hints-enabled').checked = this.settings.hintsEnabled;
    document.getElementById('auto-flip-back').checked = this.settings.autoFlipBack;
    
    document.getElementById('settings-modal').classList.add('show');
  }
  
  hideSettings() {
    document.getElementById('settings-modal').classList.remove('show');
  }
  
  saveSettings() {
    this.settings.soundEffects = document.getElementById('sound-effects').checked;
    this.settings.animations = document.getElementById('animations').checked;
    this.settings.hintsEnabled = document.getElementById('hints-enabled').checked;
    this.settings.autoFlipBack = document.getElementById('auto-flip-back').checked;
    
    // Save to localStorage
    localStorage.setItem('memoryPro_settings', JSON.stringify(this.settings));
    
    this.updateAnimationState();
    this.hideSettings();
  }
  
  loadSettings() {
    try {
      const saved = localStorage.getItem('memoryPro_settings');
      if (saved) {
        this.settings = { ...this.settings, ...JSON.parse(saved) };
      }
    } catch (error) {
      console.warn('Could not load settings:', error);
    }
  }
  
  updateAnimationState() {
    const body = document.body;
    if (this.settings.animations) {
      body.classList.remove('no-animations');
    } else {
      body.classList.add('no-animations');
    }
  }
  
  // Utility methods
  shuffleArray(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }
  
  hideOverlay(overlayId) {
    document.getElementById(overlayId).classList.remove('show');
  }
  
  hideAllOverlays() {
    document.querySelectorAll('.game-over-overlay').forEach(overlay => {
      overlay.classList.remove('show');
    });
  }
  
  // Sound effects
  playSound(type) {
    if (!this.settings.soundEffects) return;
    
    // Create audio context
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }
    
    const sounds = {
      flip: { frequency: 400, duration: 0.1, type: 'sine' },
      match: { frequency: 600, duration: 0.3, type: 'square' },
      nomatch: { frequency: 200, duration: 0.2, type: 'sawtooth' },
      start: { frequency: 440, duration: 0.2, type: 'triangle' },
      finish: { frequency: 523, duration: 0.5, type: 'sine' },
      pause: { frequency: 330, duration: 0.1, type: 'triangle' },
      hint: { frequency: 800, duration: 0.15, type: 'sine' }
    };
    
    const sound = sounds[type];
    if (!sound) return;
    
    try {
      const oscillator = this.audioContext.createOscillator();
      const gainNode = this.audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(this.audioContext.destination);
      
      oscillator.frequency.setValueAtTime(sound.frequency, this.audioContext.currentTime);
      oscillator.type = sound.type;
      
      gainNode.gain.setValueAtTime(0.1, this.audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + sound.duration);
      
      oscillator.start(this.audioContext.currentTime);
      oscillator.stop(this.audioContext.currentTime + sound.duration);
    } catch (error) {
      console.warn('Sound playback failed:', error);
    }
  }
  
  // Keyboard support
  handleKeyboard(event) {
    const key = event.key;
    
    if (key === 'Escape') {
      if (this.gameState === 'playing') {
        this.pauseGame();
      } else {
        this.hideAllOverlays();
      }
    } else if (key === ' ' && this.gameState === 'playing') {
      event.preventDefault();
      this.showHint();
    } else if (key === 'r' && (event.ctrlKey || event.metaKey)) {
      event.preventDefault();
      if (this.gameState === 'playing') {
        this.newGame();
      }
    }
  }
  
  // Visibility change handler
  handleVisibilityChange() {
    if (document.hidden && this.gameState === 'playing') {
      this.pauseGame();
    }
  }
  
  // Game statistics
  saveGameStats(winner) {
    try {
      const stats = JSON.parse(localStorage.getItem('memoryPro_stats') || '{}');
      
      stats.gamesPlayed = (stats.gamesPlayed || 0) + 1;
      stats.totalTime = (stats.totalTime || 0) + this.gameTime;
      stats.totalMoves = (stats.totalMoves || 0) + this.moves;
      
      if (winner) {
        stats.wins = stats.wins || { 1: 0, 2: 0 };
        stats.wins[winner]++;
      } else {
        stats.draws = (stats.draws || 0) + 1;
      }
      
      // Track best times by difficulty
      stats.bestTimes = stats.bestTimes || {};
      if (!stats.bestTimes[this.difficulty] || this.gameTime < stats.bestTimes[this.difficulty]) {
        stats.bestTimes[this.difficulty] = this.gameTime;
      }
      
      localStorage.setItem('memoryPro_stats', JSON.stringify(stats));
    } catch (error) {
      console.warn('Could not save game statistics:', error);
    }
  }
}

// Initialize the game when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  window.memoryGame = new MemoryPro();
});

// Service Worker registration for PWA
if ('serviceWorker' in navigator) {
  window.addEventListener('load', async () => {
    try {
      const registration = await navigator.serviceWorker.register('/memory/sw.js');
      console.log('ServiceWorker registration successful:', registration);
    } catch (error) {
      console.log('ServiceWorker registration failed:', error);
    }
  });
}
