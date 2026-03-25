// الحصول على العناصر
const canvas = document.getElementById('pongCanvas');
const ctx = canvas.getContext('2d');
const playerScoreEl = document.getElementById('playerScore');
const aiScoreEl = document.getElementById('aiScore');
const difficultySelect = document.getElementById('difficulty');
const resetBtn = document.getElementById('resetBtn');
const winnerMessageDiv = document.getElementById('winnerMessage');

// إعدادات canvas
canvas.width = 800;
canvas.height = 500;

// إعدادات اللعبة
const WINNING_SCORE = 5;
let gameRunning = true;
let animationId = null;

// تعريف المضارب
const PADDLE_WIDTH = 12;
const PADDLE_HEIGHT = 90;
const BALL_SIZE = 10;

// المضرب الأيمن (اللاعب)
const player = {
    x: canvas.width - 25,
    y: canvas.height / 2 - PADDLE_HEIGHT / 2,
    width: PADDLE_WIDTH,
    height: PADDLE_HEIGHT,
    ySpeed: 0,
    speed: 7
};

// المضرب الأيسر (AI)
const ai = {
    x: 13,
    y: canvas.height / 2 - PADDLE_HEIGHT / 2,
    width: PADDLE_WIDTH,
    height: PADDLE_HEIGHT,
    ySpeed: 0,
    speed: 4.5
};

// الكرة
const ball = {
    x: canvas.width / 2,
    y: canvas.height / 2,
    size: BALL_SIZE,
    dx: 4,
    dy: 3
};

// النقاط
let playerScore = 0;
let aiScore = 0;

// متغيرات التحكم بالأسهم
let upPressed = false;
let downPressed = false;

// ============= التحكم بالماوس =============
canvas.addEventListener('mousemove', (e) => {
    if (!gameRunning) return;
    
    const rect = canvas.getBoundingClientRect();
    const scaleY = canvas.height / rect.height;
    
    let mouseY = (e.clientY - rect.top) * scaleY;
    mouseY = Math.max(0, Math.min(canvas.height - player.height, mouseY));
    player.y = mouseY;
});

// ============= التحكم بالأسهم =============
document.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowUp') {
        upPressed = true;
        e.preventDefault();
    } else if (e.key === 'ArrowDown') {
        downPressed = true;
        e.preventDefault();
    }
});

document.addEventListener('keyup', (e) => {
    if (e.key === 'ArrowUp') {
        upPressed = false;
        e.preventDefault();
    } else if (e.key === 'ArrowDown') {
        downPressed = false;
        e.preventDefault();
    }
});

// تحديث حركة اللاعب بالأسهم
function updatePlayerMovement() {
    if (!gameRunning) return;
    
    if (upPressed) {
        player.y -= player.speed;
    }
    if (downPressed) {
        player.y += player.speed;
    }
    
    // حدود المضرب
    player.y = Math.max(0, Math.min(canvas.height - player.height, player.y));
}

// ============= AI Movement =============
function updateAI() {
    if (!gameRunning) return;
    
    const difficulty = difficultySelect.value;
    let aiSpeed = (difficulty === 'easy') ? 3 : 5.5;
    
    // AI يتبع الكرة مع بعض العشوائية في المستوى السهل
    const ballCenter = ball.y + ball.size / 2;
    const aiCenter = ai.y + ai.height / 2;
    
    if (difficulty === 'easy') {
        // AI سهل: يتحرك ببطء وأحياناً يخطئ
        if (Math.abs(ballCenter - aiCenter) > 15) {
            if (ballCenter < aiCenter) {
                ai.y -= aiSpeed;
            } else if (ballCenter > aiCenter) {
                ai.y += aiSpeed;
            }
        }
        // إضافة خطأ عشوائي
        if (Math.random() < 0.02) {
            ai.y += (Math.random() - 0.5) * 20;
        }
    } else {
        // AI صعب: دقيق وسريع
        if (ballCenter < aiCenter - 8) {
            ai.y -= aiSpeed;
        } else if (ballCenter > aiCenter + 8) {
            ai.y += aiSpeed;
        }
    }
    
    // حدود المضرب
    ai.y = Math.max(0, Math.min(canvas.height - ai.height, ai.y));
}

// ============= تحديث الكرة =============
function updateBall() {
    if (!gameRunning) return;
    
    ball.x += ball.dx;
    ball.y += ball.dy;
    
    // اصطدام بالجدران العلوي والسفلي
    if (ball.y <= 0) {
        ball.y = 0;
        ball.dy = -ball.dy;
    }
    if (ball.y + ball.size >= canvas.height) {
        ball.y = canvas.height - ball.size;
        ball.dy = -ball.dy;
    }
    
    // ===== اصطدام بمضرب اللاعب (الأيمن) =====
    if (ball.x + ball.size >= player.x && 
        ball.x <= player.x + player.width &&
        ball.y + ball.size >= player.y && 
        ball.y <= player.y + player.height) {
        
        // حساب زاوية الارتداد
        let hitPos = (ball.y + ball.size/2) - (player.y + player.height/2);
        hitPos = hitPos / (player.height/2);
        let angle = hitPos * (Math.PI / 2.8);
        
        ball.dx = -Math.abs(Math.cos(angle) * 7);
        ball.dy = Math.sin(angle) * 7;
        
        // منع الكرة من الالتصاق
        ball.x = player.x - ball.size;
    }
    
    // ===== اصطدام بمضرب AI (الأيسر) =====
    if (ball.x <= ai.x + ai.width && 
        ball.x + ball.size >= ai.x &&
        ball.y + ball.size >= ai.y && 
        ball.y <= ai.y + ai.height) {
        
        // حساب زاوية الارتداد
        let hitPos = (ball.y + ball.size/2) - (ai.y + ai.height/2);
        hitPos = hitPos / (ai.height/2);
        let angle = hitPos * (Math.PI / 2.8);
        
        ball.dx = Math.abs(Math.cos(angle) * 7);
        ball.dy = Math.sin(angle) * 7;
        
        // منع الكرة من الالتصاق
        ball.x = ai.x + ai.width;
    }
    
    // ===== تسجيل نقاط =====
    if (ball.x + ball.size >= canvas.width) {
        // AI يسجل نقطة
        aiScore++;
        updateScoreDisplay();
        checkWinner();
        if (gameRunning) resetBall();
    } else if (ball.x <= 0) {
        // اللاعب يسجل نقطة
        playerScore++;
        updateScoreDisplay();
        checkWinner();
        if (gameRunning) resetBall();
    }
}

// ============= إعادة تعيين الكرة =============
function resetBall() {
    ball.x = canvas.width / 2;
    ball.y = canvas.height / 2;
    
    // اتجاه عشوائي
    let directions = [-1, 1];
    ball.dx = 4 * directions[Math.floor(Math.random() * 2)];
    ball.dy = (Math.random() * 5) - 2.5;
    
    // تأكد أن السرعة ليست صفراً
    if (Math.abs(ball.dy) < 1.5) {
        ball.dy = ball.dy > 0 ? 2 : -2;
    }
}

// ============= تحديث عرض النقاط =============
function updateScoreDisplay() {
    playerScoreEl.textContent = playerScore;
    aiScoreEl.textContent = aiScore;
}

// ============= فحص الفائز =============
function checkWinner() {
    if (playerScore >= WINNING_SCORE) {
        gameRunning = false;
        winnerMessageDiv.innerHTML = '🎉 🏆 فوز اللاعب! 🏆 🎉<br><small>اضغط إعادة التشغيل للعب مرة أخرى</small>';
        winnerMessageDiv.style.background = '#4ecdc4';
        winnerMessageDiv.style.color = '#fff';
        winnerMessageDiv.style.padding = '15px';
    } else if (aiScore >= WINNING_SCORE) {
        gameRunning = false;
        winnerMessageDiv.innerHTML = '🤖 💀 فوز الذكاء الاصطناعي! 💀 🤖<br><small>اضغط إعادة التشغيل للعب مرة أخرى</small>';
        winnerMessageDiv.style.background = '#ff6b6b';
        winnerMessageDiv.style.color = '#fff';
        winnerMessageDiv.style.padding = '15px';
    }
}

// ============= إعادة تشغيل اللعبة بالكامل =============
function resetGame() {
    gameRunning = true;
    playerScore = 0;
    aiScore = 0;
    player.y = canvas.height / 2 - player.height / 2;
    ai.y = canvas.height / 2 - ai.height / 2;
    winnerMessageDiv.innerHTML = '';
    winnerMessageDiv.style.background = '';
    winnerMessageDiv.style.padding = '0';
    updateScoreDisplay();
    resetBall();
}

// ============= رسم العناصر =============
function draw() {
    // تنظيف الشاشة
    ctx.fillStyle = '#0a0a1a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // رسم الخط الأوسط المنقط
    ctx.setLineDash([10, 20]);
    ctx.beginPath();
    ctx.moveTo(canvas.width / 2, 0);
    ctx.lineTo(canvas.width / 2, canvas.height);
    ctx.strokeStyle = '#ffffff40';
    ctx.strokeWidth = 2;
    ctx.stroke();
    ctx.setLineDash([]);
    
    // رسم الدائرة الوسطى
    ctx.beginPath();
    ctx.arc(canvas.width / 2, canvas.height / 2, 40, 0, Math.PI * 2);
    ctx.strokeStyle = '#ffffff30';
    ctx.stroke();
    
    // رسم المضرب الأيمن (اللاعب)
    ctx.fillStyle = '#4ecdc4';
    ctx.fillRect(player.x, player.y, player.width, player.height);
    
    // إضافة تأثير توهج للمضرب
    ctx.shadowBlur = 8;
    ctx.shadowColor = '#4ecdc4';
    ctx.fillRect(player.x, player.y, player.width, player.height);
    
    // رسم المضرب الأيسر (AI)
    ctx.fillStyle = '#ff6b6b';
    ctx.fillRect(ai.x, ai.y, ai.width, ai.height);
    ctx.shadowColor = '#ff6b6b';
    ctx.fillRect(ai.x, ai.y, ai.width, ai.height);
    
    // رسم الكرة
    ctx.fillStyle = '#ffd93d';
    ctx.shadowBlur = 12;
    ctx.shadowColor = '#ffd93d';
    ctx.fillRect(ball.x, ball.y, ball.size, ball.size);
    
    // إزالة الظل
    ctx.shadowBlur = 0;
    
    // رسم النقاط على الملعب (اختياري)
    ctx.font = 'bold 20px monospace';
    ctx.fillStyle = '#ffffff30';
    ctx.fillText(`${playerScore}`, canvas.width - 60, 50);
    ctx.fillText(`${aiScore}`, 40, 50);
}

// ============= حلقة اللعبة الرئيسية =============
function gameLoop() {
    updatePlayerMovement();
    updateAI();
    updateBall();
    draw();
    
    animationId = requestAnimationFrame(gameLoop);
}

// ============= حدث إعادة التشغيل =============
resetBtn.addEventListener('click', () => {
    resetGame();
});

// ============= بدء اللعبة =============
resetGame();
gameLoop();

// تنظيف عند إغلاق الصفحة (اختياري)
window.addEventListener('beforeunload', () => {
    if (animationId) {
        cancelAnimationFrame(animationId);
    }
});