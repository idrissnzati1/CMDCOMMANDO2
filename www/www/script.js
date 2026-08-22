// ============================================
// GMD COMMANDO - MOTEUR ULTIME CORRIGÃ‰
// CrÃ©Ã© par: Dev Kira & Codex
// Version: 2.0 - Toutes erreurs corrigÃ©es
// ============================================

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const hpFill = document.getElementById('hpFill');
const scoreDisplay = document.getElementById('scoreDisplay');
const levelDisplay = document.getElementById('levelDisplay');
const playerNameDisplay = document.getElementById('playerName');
const gameOverScreen = document.getElementById('gameOverScreen');
const startScreen = document.getElementById('startScreen');
const finalScore = document.getElementById('finalScore');
const restartBtn = document.getElementById('restartBtn');
const startBtn = document.getElementById('startBtn');

// Configuration du maÃ®tre
const MASTER_NAME = "DevKira";
playerNameDisplay.textContent = MASTER_NAME;

// Variables de jeu
let player = null;
let enemies = [];
let particles = [];
let powerups = [];
let keys = {};
let enemySpawnTimer = 0;
let gameRunning = false;
let gameOver = false;
let level = 1;
let enemySpeedMultiplier = 1;

// ==================== CLASSES ====================

class Player {
    constructor() {
        this.x = canvas.width / 2;
        this.y = canvas.height - 100;
        this.width = 40;
        this.height = 40;
        this.hp = 100;
        this.maxHp = 100;
        this.score = 0;
        this.speed = 8;
        this.bullets = [];
        this.cooldown = 0;
        this.invincible = false;
        this.invincibleTimer = 0;
        this.weaponLevel = 1;
    }

    move(dir) {
        if (!gameRunning) return;
        
        const moveSpeed = this.speed;
        if (dir === 'left' && this.x > 0) this.x -= moveSpeed;
        if (dir === 'right' && this.x < canvas.width - this.width) this.x += moveSpeed;
        if (dir === 'up' && this.y > 0) this.y -= moveSpeed;
        if (dir === 'down' && this.y < canvas.height - this.height) this.y += moveSpeed;
    }

    shoot() {
        if (!gameRunning || this.cooldown > 0) return;
        
        const bulletSpeed = 12;
        const bulletWidth = 4;
        const bulletHeight = 12;
        
        this.bullets.push({
            x: this.x + this.width / 2 - bulletWidth / 2,
            y: this.y,
            width: bulletWidth,
            height: bulletHeight,
            speed: bulletSpeed,
            damage: 1
        });
        
        if (this.weaponLevel >= 2) {
            this.bullets.push({
                x: this.x - 2,
                y: this.y + 10,
                width: bulletWidth,
                height: bulletHeight,
                speed: bulletSpeed,
                damage: 1
            });
            this.bullets.push({
                x: this.x + this.width - 2,
                y: this.y + 10,
                width: bulletWidth,
                height: bulletHeight,
                speed: bulletSpeed,
                damage: 1
            });
        }
        
        if (this.weaponLevel >= 3) {
            this.bullets.forEach(b => b.damage = 2);
        }
        
        this.cooldown = 8;
    }

    update() {
        if (this.cooldown > 0) this.cooldown--;
        
        if (this.invincible) {
            this.invincibleTimer--;
            if (this.invincibleTimer <= 0) {
                this.invincible = false;
            }
        }
        
        this.bullets.forEach(b => b.y -= b.speed);
        this.bullets = this.bullets.filter(b => b.y > -20);
    }

    takeDamage(amount) {
        if (this.invincible) return;
        
        this.hp -= amount;
        this.invincible = true;
        this.invincibleTimer = 60;
        
        for (let i = 0; i < 10; i++) {
            particles.push({
                x: this.x + this.width / 2,
                y: this.y + this.height / 2,
                vx: (Math.random() - 0.5) * 6,
                vy: (Math.random() - 0.5) * 6,
                life: 30,
                color: '#ff0000'
            });
        }
        
        updateHUD();
        
        if (this.hp <= 0) {
            this.hp = 0;
            endGame();
        }
    }

    draw() {
        if (this.invincible && Math.floor(Date.now() / 100) % 2 === 0) {
            ctx.globalAlpha = 0.5;
        }
        
        ctx.fillStyle = '#00ff00';
        ctx.shadowColor = '#00ff00';
        ctx.shadowBlur = 20;
        ctx.fillRect(this.x, this.y, this.width, this.height);
        
        ctx.fillStyle = '#004400';
        ctx.shadowBlur = 0;
        ctx.fillRect(this.x + 15, this.y + 10, 10, 20);
        
        ctx.globalAlpha = 1;
        ctx.shadowBlur = 0;
    }
}

class Enemy {
    constructor() {
        this.x = Math.random() * (canvas.width - 30);
        this.y = -30;
        this.width = 30;
        this.height = 30;
        this.speed = (2 + Math.random() * 3) * enemySpeedMultiplier;
        this.hp = level >= 3 && Math.random() < 0.2 ? 2 : 1;
        this.color = this.hp > 1 ? '#ff8800' : '#ff0000';
        this.points = this.hp > 1 ? 200 : 100;
    }

    update() {
        this.y += this.speed;
        
        if (level >= 2 && Math.random() < 0.02) {
            this.x += (Math.random() - 0.5) * 20;
        }
    }

    draw() {
        ctx.fillStyle = this.color;
        ctx.shadowColor = this.color;
        ctx.shadowBlur = 15;
        ctx.fillRect(this.x, this.y, this.width, this.height);
        
        ctx.fillStyle = '#000';
        ctx.shadowBlur = 0;
        ctx.fillRect(this.x + 5, this.y + 8, 5, 5);
        ctx.fillRect(this.x + 20, this.y + 8, 5, 5);
        ctx.shadowBlur = 0;
    }
}

class PowerUp {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = 20;
        this.height = 20;
        this.speed = 2;
        this.type = Math.random() < 0.5 ? 'health' : 'weapon';
        this.color = this.type === 'health' ? '#00ff00' : '#ff00ff';
    }

    update() {
        this.y += this.speed;
    }

    draw() {
        ctx.fillStyle = this.color;
        ctx.shadowColor = this.color;
        ctx.shadowBlur = 10;
        ctx.fillRect(this.x, this.y, this.width, this.height);
        ctx.shadowBlur = 0;
        
        ctx.fillStyle = '#fff';
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        const symbol = this.type === 'health' ? '+' : 'W';
        ctx.fillText(symbol, this.x + this.width / 2, this.y + this.height / 2 + 4);
    }
}

// ==================== FONCTIONS PRINCIPALES ====================

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    
    if (player) {
        player.x = Math.min(player.x, canvas.width - player.width);
        player.y = Math.min(player.y, canvas.height - player.height);
    }
}

function updateHUD() {
    if (!player) return;
    
    const hpPercent = (player.hp / player.maxHp) * 100;
    hpFill.style.width = hpPercent + '%';
    scoreDisplay.textContent = 'SCORE: ' + player.score;
    levelDisplay.textContent = 'NIVEAU: ' + level;
    
    if (hpPercent > 50) {
        hpFill.style.background = 'linear-gradient(90deg, #00ff00, #00ff00)';
    } else if (hpPercent > 25) {
        hpFill.style.background = 'linear-gradient(90deg, #ff8800, #ffff00)';
    } else {
        hpFill.style.background = 'linear-gradient(90deg, #ff0000, #ff0000)';
    }
}

function checkCollisions() {
    if (!player || !gameRunning) return;
    
    player.bullets.forEach((bullet, bIndex) => {
        enemies.forEach((enemy, eIndex) => {
            if (bullet.x > enemy.x && bullet.x < enemy.x + enemy.width &&
                bullet.y > enemy.y && bullet.y < enemy.y + enemy.height) {
                
                player.bullets.splice(bIndex, 1);
                enemy.hp -= bullet.damage;
                
                if (enemy.hp <= 0) {
                    for (let i = 0; i < 15; i++) {
                        particles.push({
                            x: enemy.x + enemy.width / 2,
                            y: enemy.y + enemy.height / 2,
                            vx: (Math.random() - 0.5) * 8,
                            vy: (Math.random() - 0.5) * 8,
                            life: 20,
                            color: enemy.color
                        });
                    }
                    
                    player.score += enemy.points;
                    enemies.splice(eIndex, 1);
                    
                    if (Math.random() < 0.15) {
                        powerups.push(new PowerUp(
                            enemy.x + enemy.width / 2 - 10,
                            enemy.y + enemy.height / 2 - 10
                        ));
                    }
                }
                
                updateHUD();
            }
        });
    });
    
    enemies.forEach((enemy, index) => {
        if (player.x < enemy.x + enemy.width && 
            player.x + player.width > enemy.x &&
            player.y < enemy.y + enemy.height && 
            player.y + player.height > enemy.y) {
            
            player.takeDamage(10);
            enemies.splice(index, 1);
        }
    });
    
    powerups.forEach((powerup, index) => {
        if (player.x < powerup.x + powerup.width && 
            player.x + player.width > powerup.x &&
            player.y < powerup.y + powerup.height && 
            player.y + player.height > powerup.y) {
            
            if (powerup.type === 'health') {
                player.hp = Math.min(player.maxHp, player.hp + 25);
            } else {
                player.weaponLevel = Math.min(3, player.weaponLevel + 1);
            }
            
            powerups.splice(index, 1);
            updateHUD();
        }
    });
}

function updateLevel() {
    const newLevel = Math.floor(player.score / 1000) + 1;
    
    if (newLevel !== level) {
        level = newLevel;
        enemySpeedMultiplier = 1 + (level - 1) * 0.2;
        updateHUD();
    }
}

function updateParticles() {
    particles.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
        p.life--;
    });
    particles = particles.filter(p => p.life > 0);
}

function update() {
    if (!gameRunning || gameOver) return;
    
    if (keys['ArrowLeft']) player.move('left');
    if (keys['ArrowRight']) player.move('right');
    if (keys['ArrowUp']) player.move('up');
    if (keys['ArrowDown']) player.move('down');
    
    player.update();
    updateLevel();
    
    enemySpawnTimer++;
    if (enemySpawnTimer > Math.max(20, 40 - level * 3)) {
        enemies.push(new Enemy());
        enemySpawnTimer = 0;
    }
    
    enemies.forEach(e => e.update());
    enemies = enemies.filter(e => e.y < canvas.height + 50);
    
    powerups.forEach(p => p.update());
    powerups = powerups.filter(p => p.y < canvas.height + 50);
    
    updateParticles();
    checkCollisions();
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    ctx.fillStyle = '#111';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    for (let i = 0; i < 100; i++) {
        const starY = (i * 23 + Date.now() * 0.1) % canvas.height;
        ctx.fillStyle = '#fff';
        ctx.globalAlpha = 0.5 + Math.random() * 0.5;
        ctx.fillRect(i * 20 % canvas.width, starY, 2, 2);
    }
    ctx.globalAlpha = 1;
    
    if (player) player.draw();
    enemies.forEach(e => e.draw());
    powerups.forEach(p => p.draw());
    
    particles.forEach(p => {
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.life / 30;
        ctx.fillRect(p.x, p.y, 3, 3);
    });
    ctx.globalAlpha = 1;
    
    if (player) {
        player.bullets.forEach(b => {
            ctx.fillStyle = '#ffff00';
            ctx.shadowColor = '#ffff00';
            ctx.shadowBlur = 10;
            ctx.fillRect(b.x, b.y, b.width, b.height);
            ctx.shadowBlur = 0;
        });
    }
}

function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

// ==================== GESTION DU JEU ====================

function startGame() {
    player = new Player();
    enemies = [];
    particles = [];
    powerups = [];
    enemySpawnTimer = 0;
    gameRunning = true;
    gameOver = false;
    level = 1;
    enemySpeedMultiplier = 1;
    
    startScreen.classList.remove('active');
    gameOverScreen.classList.remove('active');
    
    updateHUD();
}

function endGame() {
    gameOver = true;
    gameRunning = false;
    finalScore.textContent = 'Score: ' + player.score;
    gameOverScreen.classList.add('active');
}

// ==================== CONTRÃ”LES ====================

window.addEventListener('keydown', (e) => {
    keys[e.key] = true;
    if (e.key === ' ' || e.key === 'Space') {
        e.preventDefault();
        if (player) player.shoot();
    }
});

window.addEventListener('keyup', (e) => {
    keys[e.key] = false;
});

function setupTouch(id, key) {
    const el = document.getElementById(id);
    if (!el) return;
    
    el.addEventListener('touchstart', (e) => {
        e.preventDefault();
        keys[key] = true;
    });
    
    el.addEventListener('touchend', (e) => {
        e.preventDefault();
        keys[key] = false;
    });
    
    el.addEventListener('mousedown', () => { keys[key] = true; });
    el.addEventListener('mouseup', () => { keys[key] = false; });
}

setupTouch('leftBtn', 'ArrowLeft');
setupTouch('rightBtn', 'ArrowRight');
setupTouch('upBtn', 'ArrowUp');
setupTouch('downBtn', 'ArrowDown');

const fireBtn = document.getElementById('fireBtn');
fireBtn.addEventListener('touchstart', (e) => {
    e.preventDefault();
    if (player) player.shoot();
});
fireBtn.addEventListener('mousedown', () => {
    if (player) player.shoot();
});

startBtn.addEventListener('click', startGame);
restartBtn.addEventListener('click', startGame);

window.addEventListener('resize', resizeCanvas);

// ==================== INITIALISATION ====================

console.log(`%c GMD COMMANDO 2.0 - LancÃ© par ${MASTER_NAME} `, 
    'background: #ff0000; color: #fff; font-size: 20px; font-weight: bold;');

resizeCanvas();
updateHUD();
startScreen.classList.add('active');
gameLoop();
