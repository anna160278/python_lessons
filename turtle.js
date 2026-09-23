// === ЧАСТЬ 1: ЛОГИКА УРОКА (навигация, тесты, таймер) ===

let currentSection = 1;
const totalSections = 8;
let score = 0;
let correctAnswers = 0;
let answeredQuestions = new Set();
let globalTimerInterval = null;
let globalTimeLeft = 420;
const FINAL_TOTAL = 10;
let finalCorrectCount = 0;
let finalTestFinished = false;

const audioContext = new (window.AudioContext || window.webkitAudioContext)();

function playSound(type) {
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    if (type === 'correct') {
        oscillator.frequency.setValueAtTime(523.25, audioContext.currentTime);
        oscillator.frequency.setValueAtTime(659.25, audioContext.currentTime + 0.1);
        oscillator.frequency.setValueAtTime(783.99, audioContext.currentTime + 0.2);
    } else if (type === 'incorrect') {
        oscillator.frequency.setValueAtTime(400, audioContext.currentTime);
        oscillator.frequency.setValueAtTime(300, audioContext.currentTime + 0.1);
    } else if (type === 'complete') {
        oscillator.frequency.setValueAtTime(523.25, audioContext.currentTime);
        oscillator.frequency.setValueAtTime(659.25, audioContext.currentTime + 0.15);
        oscillator.frequency.setValueAtTime(783.99, audioContext.currentTime + 0.3);
        oscillator.frequency.setValueAtTime(1046.5, audioContext.currentTime + 0.45);
    }
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.5);
}

function startGlobalTimer() {
    const timerEl = document.getElementById('globalTimer');
    globalTimeLeft = 420;
    finalTestFinished = false;
    updateGlobalTimerDisplay(timerEl, globalTimeLeft);
    globalTimerInterval = setInterval(() => {
        globalTimeLeft--;
        updateGlobalTimerDisplay(timerEl, globalTimeLeft);
        if (globalTimeLeft <= 0) finishFinalTest(true);
    }, 1000);
}

function updateGlobalTimerDisplay(timerEl, timeLeft) {
    const m = Math.floor(timeLeft / 60);
    const s = timeLeft % 60;
    timerEl.textContent = `⏱️ ${m}:${s.toString().padStart(2, '0')}`;
    timerEl.classList.remove('warning', 'danger');
    if (timeLeft <= 60) timerEl.classList.add('danger');
    else if (timeLeft <= 180) timerEl.classList.add('warning');
}

function stopGlobalTimer() {
    if (globalTimerInterval) { clearInterval(globalTimerInterval); globalTimerInterval = null; }
}

function finishFinalTest(timeIsUp) {
    if (finalTestFinished) return;
    finalTestFinished = true;
    stopGlobalTimer();
    const timerEl = document.getElementById('globalTimer');
    timerEl.classList.remove('warning', 'danger');
    timerEl.classList.add('finished');
    timerEl.textContent = timeIsUp ? '⏱️ Время вышло!' : '✅ Тест завершён!';
    document.querySelectorAll('.final-q').forEach(container => {
        const qId = `final_${Array.from(document.querySelectorAll('.final-q')).indexOf(container)}`;
        if (!answeredQuestions.has(qId)) {
            answeredQuestions.add(qId);
            container.querySelectorAll('.quiz-option').forEach(opt => {
                opt.style.pointerEvents = 'none';
                if (opt.dataset.correct === 'true') opt.classList.add('correct');
            });
        }
    });
    showFinalTestStats(timeIsUp);
    playSound('complete');
}

function showFinalTestStats(timeIsUp) {
    const statsEl = document.getElementById('finalTestStats');
    const timeSpent = 420 - globalTimeLeft;
    const m = Math.floor(timeSpent / 60);
    const s = timeSpent % 60;
    const timeStr = `${m}:${s.toString().padStart(2, '0')}`;
    let percent = Math.round((finalCorrectCount / FINAL_TOTAL) * 100);
    let emoji = '🎯', message = '';
    if (percent === 100) { emoji = '🏆'; message = 'Идеальный результат!'; }
    else if (percent >= 80) { emoji = ''; message = 'Отличный результат!'; }
    else if (percent >= 60) { emoji = '👍'; message = 'Хороший результат!'; }
    else if (percent >= 40) { emoji = '📚'; message = 'Неплохо, но можно лучше!'; }
    else { emoji = '💪'; message = 'Стоит повторить материал!'; }
    statsEl.innerHTML = `<h3>${emoji} ${timeIsUp ? 'Время вышло!' : 'Тест завершён!'}</h3>
        <p style="font-size:1.2em;margin-bottom:10px;">${message}</p>
        <div class="stats-grid">
            <div class="stats-cell"><span class="value">${finalCorrectCount}/${FINAL_TOTAL}</span><span class="label">Правильных</span></div>
            <div class="stats-cell"><span class="value">${percent}%</span><span class="label">Точность</span></div>
            <div class="stats-cell"><span class="value">${timeStr}</span><span class="label">Время</span></div>
        </div>`;
    statsEl.style.display = 'block';
    statsEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function checkAllFinalAnswered() {
    let c = 0;
    document.querySelectorAll('.final-q').forEach((_, i) => { if (answeredQuestions.has(`final_${i}`)) c++; });
    if (c === FINAL_TOTAL) finishFinalTest(false);
}

document.querySelectorAll('.quiz-option').forEach(option => {
    option.addEventListener('click', function() {
        const container = this.closest('.quiz-container');
        const isFinalQ = container.classList.contains('final-q');
        const qId = isFinalQ ? `final_${Array.from(document.querySelectorAll('.final-q')).indexOf(container)}` : Array.from(document.querySelectorAll('.quiz-container')).indexOf(container);
        if (answeredQuestions.has(qId)) return;
        answeredQuestions.add(qId);
        const isCorrect = this.dataset.correct === 'true';
        if (isCorrect) {
            this.classList.add('correct');
            score += 10; correctAnswers++;
            if (isFinalQ) finalCorrectCount++;
            playSound('correct');
            const msg = document.createElement('div');
            msg.className = 'success-message';
            msg.innerHTML = '✅ Правильно! +10 очков';
            container.appendChild(msg);
        } else {
            this.classList.add('incorrect');
            playSound('incorrect');
            const msg = document.createElement('div');
            msg.className = 'success-message error';
            msg.innerHTML = '❌ Неправильно';
            container.appendChild(msg);
            container.querySelectorAll('.quiz-option').forEach(opt => { if (opt.dataset.correct === 'true') opt.classList.add('correct'); });
        }
        container.querySelectorAll('.quiz-option').forEach(opt => { opt.style.pointerEvents = 'none'; });
        updateStats();
        if (isFinalQ && !finalTestFinished) checkAllFinalAnswered();
    });
});

function updateStats() {
    document.getElementById('score').textContent = score;
    document.getElementById('progress').textContent = `${currentSection}/${totalSections}`;
    document.getElementById('correct').textContent = correctAnswers;
    document.getElementById('progressFill').style.width = `${(currentSection / totalSections) * 100}%`;
}

function scrollToSectionTop() {
    const section = document.getElementById(`section${currentSection}`);
    if (section) {
        const h = section.querySelector('h2');
        (h || section).scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
}

function nextSection() {
    if (currentSection < totalSections) {
        document.getElementById(`section${currentSection}`).classList.remove('active');
        currentSection++;
        document.getElementById(`section${currentSection}`).classList.add('active');
        updateStats(); updateNavigation();
        setTimeout(scrollToSectionTop, 50);
        if (currentSection === totalSections) { startGlobalTimer(); showFinalResults(); }
    }
}

function previousSection() {
    if (currentSection > 1) {
        if (currentSection === totalSections) stopGlobalTimer();
        document.getElementById(`section${currentSection}`).classList.remove('active');
        currentSection--;
        document.getElementById(`section${currentSection}`).classList.add('active');
        updateStats(); updateNavigation();
        setTimeout(scrollToSectionTop, 50);
    }
}

function updateNavigation() {
    document.getElementById('prevBtn').disabled = currentSection === 1;
    document.getElementById('nextBtn').disabled = currentSection === totalSections;
}

function showFinalResults() {
    let r = document.getElementById('finalResults');
    if (!r) {
        r = document.createElement('div');
        r.id = 'finalResults';
        r.innerHTML = `<div class="final-score"><h2>Урок завершён!</h2><div class="score-value" id="finalScore">0</div><p>очков набрано</p><div id="achievements"></div></div>
            <div class="success-message"><strong>📝 Что вы изучили:</strong><ul style="margin-left:20px;margin-top:10px;line-height:2;">
            <li>Подключение библиотеки turtle и настройка окна</li><li>Основные команды движения: forward, backward, left, right, setheading</li>
            <li>Рисование фигур: квадрат, треугольник, круг, точка</li><li>Цвета: именованные, RGB, заполнение фигур</li>
            <li>Управление черепашкой: shape, stamp, speed, hideturtle, write</li><li>Создание узоров: звёзды, спирали, цветы</li></ul></div>
            <div style="text-align:center;margin-top:30px;"><a href="index.html" class="btn" style="text-decoration:none;display:inline-block;"> На главную</a>
            <button class="btn" onclick="restartLesson()">🔄 Пройти заново</button></div>`;
        document.getElementById(`section${totalSections}`).appendChild(r);
    }
    document.getElementById('finalScore').textContent = score;
    const a = document.getElementById('achievements');
    a.innerHTML = '';
    if (correctAnswers >= 15) a.innerHTML += '<span class="achievement">🏆 Мастер turtle</span>';
    if (correctAnswers >= 10) a.innerHTML += '<span class="achievement">⭐ Отличник</span>';
    if (score >= 100) a.innerHTML += '<span class="achievement"> Эксперт</span>';
}

function restartLesson() {
    currentSection = 1; score = 0; correctAnswers = 0; finalCorrectCount = 0; finalTestFinished = false;
    answeredQuestions.clear(); stopGlobalTimer();
    document.querySelectorAll('.quiz-option').forEach(o => { o.classList.remove('correct','incorrect'); o.style.pointerEvents = 'auto'; });
    document.querySelectorAll('.success-message').forEach(m => m.remove());
    const t = document.getElementById('globalTimer');
    if (t) { t.classList.remove('warning','danger','finished'); t.textContent = '⏱️ 7:00'; }
    const s = document.getElementById('finalTestStats');
    if (s) { s.style.display = 'none'; s.innerHTML = ''; }
    document.querySelectorAll('.lesson-section').forEach(s => s.classList.remove('active'));
    document.getElementById('section1').classList.add('active');
    const r = document.getElementById('finalResults'); if (r) r.remove();
    updateStats(); updateNavigation(); setTimeout(scrollToSectionTop, 50);
}

updateStats(); updateNavigation();

// === ЧАСТЬ 2: ПЕСОЧНИЦА TURTLE ===

const canvas = document.getElementById('turtleCanvas');
const ctx = canvas.getContext('2d');
let turtle = {
    x: 200,
    y: 200,
    angle: 0,
    penDown: true,
    color: '#667eea',
    penSize: 3,
    filling: false,
    fillPath: []
};

function resetTurtle() {
    turtle = {
        x: 200,
        y: 200,
        angle: 0,
        penDown: true,
        color: '#667eea',
        penSize: 3,
        filling: false,
        fillPath: []
    };
}

function clearCanvas() {
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    resetTurtle();
}

function drawTurtleIcon() {
    ctx.save();
    ctx.translate(turtle.x, turtle.y);
    ctx.rotate(turtle.angle * Math.PI / 180);
    
    ctx.fillStyle = '#22c55e';
    ctx.beginPath();
    ctx.moveTo(12, 0);
    ctx.lineTo(-8, -7);
    ctx.lineTo(-8, 7);
    ctx.closePath();
    ctx.fill();
    
    ctx.restore();
}

function forward(distance, i) {
    let dist = distance;
    if (typeof distance === 'string') {
        dist = eval(distance.replace(/i/g, i !== undefined ? i : 0));
    }
    
    const rad = turtle.angle * Math.PI / 180;
    const newX = turtle.x + dist * Math.cos(rad);
    const newY = turtle.y + dist * Math.sin(rad);
    
    if (turtle.penDown) {
        ctx.strokeStyle = turtle.color;
        ctx.lineWidth = turtle.penSize;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(turtle.x, turtle.y);
        ctx.lineTo(newX, newY);
        ctx.stroke();
    }
    
    if (turtle.filling) {
        turtle.fillPath.push({x: newX, y: newY});
    }
    
    turtle.x = newX;
    turtle.y = newY;
}

function backward(distance) {
    forward(-distance);
}

function left(angle) {
    turtle.angle -= angle;
}

function right(angle) {
    turtle.angle += angle;
}

function setheading(angle) {
    turtle.angle = angle;
}

function penup() {
    turtle.penDown = false;
}

function pendown() {
    turtle.penDown = true;
}

function setColor(col) {
    turtle.color = col;
}

function pensize(size) {
    turtle.penSize = size;
}

function goto(x, y) {
    if (turtle.penDown) {
        ctx.strokeStyle = turtle.color;
        ctx.lineWidth = turtle.penSize;
        ctx.beginPath();
        ctx.moveTo(turtle.x, turtle.y);
        ctx.lineTo(x, y);
        ctx.stroke();
    }
    turtle.x = x;
    turtle.y = y;
}

function home() {
    goto(200, 200);
    turtle.angle = 0;
}

function circle(radius) {
    const steps = 36;
    const stepAngle = 360 / steps;
    const stepLength = 2 * Math.PI * radius / steps;
    
    for (let i = 0; i < steps; i++) {
        forward(stepLength);
        left(stepAngle);
    }
}

function dot(size) {
    ctx.fillStyle = turtle.color;
    ctx.beginPath();
    ctx.arc(turtle.x, turtle.y, size / 2, 0, Math.PI * 2);
    ctx.fill();
}

function begin_fill() {
    turtle.filling = true;
    turtle.fillPath = [{x: turtle.x, y: turtle.y}];
}

function end_fill() {
    if (turtle.filling && turtle.fillPath.length > 0) {
        ctx.fillStyle = turtle.color;
        ctx.globalAlpha = 0.5;
        ctx.beginPath();
        ctx.moveTo(turtle.fillPath[0].x, turtle.fillPath[0].y);
        for (let i = 1; i < turtle.fillPath.length; i++) {
            ctx.lineTo(turtle.fillPath[i].x, turtle.fillPath[i].y);
        }
        ctx.closePath();
        ctx.fill();
        ctx.globalAlpha = 1.0;
    }
    turtle.filling = false;
    turtle.fillPath = [];
}

function executeCommand(cmd, i) {
    cmd = cmd.trim();
    
    if (cmd.startsWith('forward(')) {
        const arg = cmd.match(/forward\(([^)]+)\)/)[1];
        if (arg.includes('i')) {
            forward(arg, i);
        } else {
            forward(parseFloat(arg));
        }
    } else if (cmd.startsWith('backward(')) {
        backward(parseFloat(cmd.match(/backward\(([^)]+)\)/)[1]));
    } else if (cmd.startsWith('left(')) {
        left(parseFloat(cmd.match(/left\(([^)]+)\)/)[1]));
    } else if (cmd.startsWith('right(')) {
        right(parseFloat(cmd.match(/right\(([^)]+)\)/)[1]));
    } else if (cmd.startsWith('setheading(')) {
        setheading(parseFloat(cmd.match(/setheading\(([^)]+)\)/)[1]));
    } else if (cmd === 'penup()') {
        penup();
    } else if (cmd === 'pendown()') {
        pendown();
    } else if (cmd.startsWith('color(')) {
        const col = cmd.match(/color\(['"]([^'"]+)['"]\)/)[1];
        setColor(col);
    } else if (cmd.startsWith('pensize(')) {
        pensize(parseFloat(cmd.match(/pensize\(([^)]+)\)/)[1]));
    } else if (cmd.startsWith('goto(')) {
        const coords = cmd.match(/goto\(([^,]+),\s*([^)]+)\)/);
        goto(parseFloat(coords[1]), parseFloat(coords[2]));
    } else if (cmd === 'home()') {
        home();
    } else if (cmd.startsWith('circle(')) {
        circle(parseFloat(cmd.match(/circle\(([^)]+)\)/)[1]));
    } else if (cmd.startsWith('dot(')) {
        dot(parseFloat(cmd.match(/dot\(([^)]+)\)/)[1]));
    } else if (cmd === 'begin_fill()') {
        begin_fill();
    } else if (cmd === 'end_fill()') {
        end_fill();
    }
}

function runTurtle() {
    clearCanvas();
    const code = document.getElementById('turtleCode').value;
    const lines = code.split('\n');
    let i = 0;
    
    function executeLine() {
        if (i >= lines.length) {
            drawTurtleIcon();
            return;
        }
        
        const line = lines[i];
        const trimmed = line.trim();
        i++;
        
        if (trimmed === '' || trimmed.startsWith('#')) {
            executeLine();
            return;
        }
        
        try {
            if (trimmed.startsWith('for i in range(')) {
                const count = parseInt(trimmed.match(/range\(([^)]+)\)/)[1]);
                const indent = line.match(/^(\s+)/);
                const indentLevel = indent ? indent[1].length : 0;
                const block = [];
                
                while (i < lines.length) {
                    const nextLine = lines[i];
                    const nextTrimmed = nextLine.trim();
                    
                    if (nextTrimmed === '') {
                        i++;
                        continue;
                    }
                    
                    const nextIndent = nextLine.match(/^(\s+)/);
                    const nextIndentLevel = nextIndent ? nextIndent[1].length : 0;
                    
                    if (nextIndentLevel > indentLevel) {
                        block.push(nextTrimmed);
                        i++;
                    } else {
                        break;
                    }
                }
                
                for (let j = 0; j < count; j++) {
                    for (const cmd of block) {
                        executeCommand(cmd, j);
                    }
                }
                
                executeLine();
                return;
            } else {
                executeCommand(trimmed);
            }
        } catch (e) {
            console.error('Error:', e);
        }
        
        setTimeout(executeLine, 5);
    }
    
    executeLine();
}

const examples = {
    square: `# Квадрат
for i in range(4):
    forward(80)
    right(90)`,
    
    triangle: `# Треугольник
for i in range(3):
    forward(100)
    right(120)`,
    
    star: `# Звезда
for i in range(5):
    forward(100)
    right(144)`,
    
    spiral: `# Спираль
for i in range(50):
    forward(i * 3)
    right(61)`,
    
    flower: `# Цветок
for i in range(6):
    circle(40)
    right(60)`
};

function loadExample(name) {
    document.getElementById('turtleCode').value = examples[name];
    runTurtle();
}

function toggleExamples() {
    const panel = document.getElementById('examplesPanel');
    panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
}

// Инициализация
clearCanvas();