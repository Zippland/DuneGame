const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreElement = document.getElementById('score');
const shieldElement = document.getElementById('shield');
const shieldButton = document.getElementById('shieldButton');
const livesElement = document.getElementById('lives');
const sandwormButton = document.getElementById('sandwormButton');
const sandwormProgress = document.getElementById('sandwormProgress').querySelector('.progress-bar-fill');
const instructionsModal = document.getElementById('instructionsModal');
const startButton = document.getElementById('startButton');

let score = 0;
let shield = 3;
let lives = 3;
let shieldActive = false;
let stormActive = false;
let stormDuration = 0;
let sandwormActive = false;
let sandwormKills = 0;
let gameOver = false;

const UFO_IMAGE_SRC = 'images/ufo.png';
const SANDWORM_IMAGE_SRC = 'images/sandworm.png';
const UFO_WIDTH = 50;
const UFO_HEIGHT = 30;

class UFO {
    constructor() {
        this.image = new Image();
        this.image.src = UFO_IMAGE_SRC;
        this.reset();
    }

    reset() {
        this.x = -UFO_WIDTH;
        this.y = Math.random() * (canvas.height - UFO_HEIGHT);
        this.speed = Math.random() * 3 + 1;
    }

    draw() {
        ctx.drawImage(this.image, this.x, this.y, UFO_WIDTH, UFO_HEIGHT);
    }

    move() {
        this.x += this.speed;
        if (stormActive) {
            this.x += this.speed * 0.5;
        }
        if (this.x > canvas.width) {
            this.reset();
            if (!shieldActive) {
                lives--;
                livesElement.textContent = lives;
                if (lives <= 0) {
                    gameOver = true;
                }
            }
        }
    }

    isClicked(clickX, clickY) {
        const clickPadding = stormActive ? 20 : 10; // 在风暴期间增加点击判定范围
        return clickX >= this.x - clickPadding && clickX <= this.x + UFO_WIDTH + clickPadding &&
               clickY >= this.y - clickPadding && clickY <= this.y + UFO_HEIGHT + clickPadding;
    }
}

class Sandworm {
    constructor() {
        this.width = canvas.width;
        this.height = canvas.height;
        this.image = new Image();
        this.image.src = SANDWORM_IMAGE_SRC;
        this.reset();
    }

    reset() {
        this.x = canvas.width;
        this.y = 0;
        this.speed = 3;
    }

    draw() {
        ctx.drawImage(this.image, this.x, this.y, this.width, this.height);
    }

    move() {
        this.x -= this.speed;
        if (this.x < -this.width) {
            sandwormActive = false;
            this.reset();
            spawnUFOs(); // 重新生成UFO
        }
    }

    eatUFOs() {
        ufos = ufos.filter(ufo => {
            if (!(ufo.x + UFO_WIDTH < this.x || ufo.x > this.x + this.width || ufo.y + UFO_HEIGHT < this.y || ufo.y > this.y + this.height)) {
                score++;
                scoreElement.textContent = score;
                return false; // UFO被吃掉，增加分数
            }
            return true;
        });
    }
}

let ufos = [];

function spawnUFOs() {
    let ufoCount = Math.floor(score / 10) + 3; // 基于得分增加飞碟数量，最低3个
    while (ufos.length < ufoCount) {
        ufos.push(new UFO());
    }
}

spawnUFOs();

let sandworm = new Sandworm();

canvas.addEventListener('click', (event) => {
    const rect = canvas.getBoundingClientRect();
    const clickX = event.clientX - rect.left;
    const clickY = event.clientY - rect.top;

    ufos.forEach((ufo, index) => {
        if (ufo.isClicked(clickX, clickY)) {
            ufos.splice(index, 1);
            score++;
            scoreElement.textContent = score;

            spawnUFOs(); // 每次击落UFO后重新生成

            if (score % 50 === 0) {
                lives++;
                livesElement.textContent = lives;
            }

            sandwormKills++;
            sandwormProgress.style.width = `${(sandwormKills / 20) * 100}%`;
            if (sandwormKills >= 20) {
                sandwormButton.disabled = false;
            }
        }
    });
});

shieldButton.addEventListener('click', () => {
    if (shield > 0 && !shieldActive) {
        shieldActive = true;
        shield--;
        shieldElement.textContent = shield;
        ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.fillRect(0, 0, canvas.width, canvas.height); // 在画布上覆盖一层透明的白色
        setTimeout(() => {
            shieldActive = false;
        }, 5000);
    }
});

sandwormButton.addEventListener('click', () => {
    if (sandwormKills >= 20) {
        sandwormActive = true;
        sandwormKills = 0;
        sandwormButton.disabled = true;
        sandwormProgress.style.width = '0';
        triggerShake(3000); // 画布抖动3秒钟
    }
});

function triggerStorm() {
    stormActive = true;
    stormDuration = Math.random() * 3000 + 2000;
    const shakeInterval = setInterval(() => {
        if (!stormActive) {
            clearInterval(shakeInterval);
            canvas.style.transform = 'translate(0, 0)';
            return;
        }
        const x = Math.random() * 10 - 5;
        const y = Math.random() * 10 - 5;
        canvas.style.transform = `translate(${x}px, ${y}px)`;
    }, 50);
    setTimeout(() => {
        stormActive = false;
    }, stormDuration);
}

function triggerShake(duration) {
    const shakeInterval = setInterval(() => {
        const x = Math.random() * 10 - 5;
        const y = Math.random() * 10 - 5;
        canvas.style.transform = `translate(${x}px, ${y}px)`;
    }, 50);
    setTimeout(() => {
        clearInterval(shakeInterval);
        canvas.style.transform = 'translate(0, 0)';
    }, duration);
}

function gameLoop() {
    if (gameOver) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#fff';
        ctx.font = '48px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Game Over', canvas.width / 2, canvas.height / 2);
        return;
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (Math.random() < 0.01) {
        triggerStorm();
    }

    ufos.forEach(ufo => {
        ufo.move();
        ufo.draw();
    });

    if (sandwormActive) {
        sandworm.move();
        sandworm.draw();
        sandworm.eatUFOs();
    }

    if (shieldActive) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.5)'; // 护盾激活效果
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    requestAnimationFrame(gameLoop);
}

instructionsModal.style.display = 'flex';

startButton.addEventListener('click', () => {
    instructionsModal.style.display = 'none';
    gameLoop();
});
