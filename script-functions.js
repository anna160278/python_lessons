let currentSection = 1;
const totalSections = 9;
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
    if (percent === 100) { emoji = ''; message = 'Идеальный результат!'; }
    else if (percent >= 80) { emoji = '🌟'; message = 'Отличный результат!'; }
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
    option.addEventListener('click', function () {
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
            <li>Что такое функции и зачем они нужны</li><li>Создание функций через def и обязательность вызова</li>
            <li>Разница между параметрами и аргументами</li><li>Именованные аргументы и значения по умолчанию</li>
            <li>return vs print — возврат значений</li><li>*args и **kwargs</li>
            <li>Lambda-функции и подсказки типов</li><li>Область видимости и ключевое слово global</li>
            <li>Рекурсия на примере факториала</li></ul></div>
            <div style="text-align:center;margin-top:30px;"><a href="index.html" class="btn" style="text-decoration:none;display:inline-block;">🏠 На главную</a>
            <button class="btn" onclick="restartLesson()">🔄 Пройти заново</button></div>`;
        document.getElementById(`section${totalSections}`).appendChild(r);
    }
    document.getElementById('finalScore').textContent = score;
    const a = document.getElementById('achievements');
    a.innerHTML = '';
    if (correctAnswers >= 15) a.innerHTML += '<span class="achievement">🏆 Мастер функций</span>';
    if (correctAnswers >= 10) a.innerHTML += '<span class="achievement">⭐ Отличник</span>';
    if (score >= 100) a.innerHTML += '<span class="achievement">💎 Эксперт</span>';
}

function restartLesson() {
    currentSection = 1; score = 0; correctAnswers = 0; finalCorrectCount = 0; finalTestFinished = false;
    answeredQuestions.clear(); stopGlobalTimer();
    document.querySelectorAll('.quiz-option').forEach(o => { o.classList.remove('correct', 'incorrect'); o.style.pointerEvents = 'auto'; });
    document.querySelectorAll('.success-message').forEach(m => m.remove());
    const t = document.getElementById('globalTimer');
    if (t) { t.classList.remove('warning', 'danger', 'finished'); t.textContent = '⏱️ 7:00'; }
    const s = document.getElementById('finalTestStats');
    if (s) { s.style.display = 'none'; s.innerHTML = ''; }
    document.querySelectorAll('.lesson-section').forEach(s => s.classList.remove('active'));
    document.getElementById('section1').classList.add('active');
    const r = document.getElementById('finalResults'); if (r) r.remove();
    updateStats(); updateNavigation(); setTimeout(scrollToSectionTop, 50);
}

updateStats(); updateNavigation();