let currentSection = 1;
const totalSections = 8;
let score = 0;
let correctAnswers = 0;
let answeredQuestions = new Set();
let globalTimerInterval = null;
let globalTimeLeft = 600; // 10 minutes in seconds
const FINAL_TOTAL = 15;
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
    globalTimeLeft = 600;
    finalTestFinished = false;
    
    updateGlobalTimerDisplay(timerEl, globalTimeLeft);
    
    globalTimerInterval = setInterval(() => {
        globalTimeLeft--;
        updateGlobalTimerDisplay(timerEl, globalTimeLeft);
        
        if (globalTimeLeft <= 0) {
            finishFinalTest(true);
        }
    }, 1000);
}

function updateGlobalTimerDisplay(timerEl, timeLeft) {
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    timerEl.textContent = `⏱️ ${minutes}:${seconds.toString().padStart(2, '0')}`;
    
    timerEl.classList.remove('warning', 'danger');
    if (timeLeft <= 60) {
        timerEl.classList.add('danger');
    } else if (timeLeft <= 180) {
        timerEl.classList.add('warning');
    }
}

function stopGlobalTimer() {
    if (globalTimerInterval) {
        clearInterval(globalTimerInterval);
        globalTimerInterval = null;
    }
}

function finishFinalTest(timeIsUp) {
    if (finalTestFinished) return;
    finalTestFinished = true;
    stopGlobalTimer();

    const timerEl = document.getElementById('globalTimer');
    timerEl.classList.remove('warning', 'danger');
    timerEl.classList.add('finished');
    timerEl.textContent = timeIsUp ? '⏱️ Время вышло!' : '✅ Тест завершён!';

    // Disable all unanswered questions
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
    const timeSpent = 600 - globalTimeLeft;
    const minutes = Math.floor(timeSpent / 60);
    const seconds = timeSpent % 60;
    const timeStr = `${minutes}:${seconds.toString().padStart(2, '0')}`;
    
    let percent = Math.round((finalCorrectCount / FINAL_TOTAL) * 100);
    let emoji = '🎯';
    let message = '';
    if (percent === 100) { emoji = '🏆'; message = 'Идеальный результат!'; }
    else if (percent >= 80) { emoji = '🌟'; message = 'Отличный результат!'; }
    else if (percent >= 60) { emoji = '👍'; message = 'Хороший результат!'; }
    else if (percent >= 40) { emoji = '📚'; message = 'Неплохо, но можно лучше!'; }
    else { emoji = '💪'; message = 'Стоит повторить материал!'; }

    statsEl.innerHTML = `
        <h3>${emoji} ${timeIsUp ? 'Время вышло!' : 'Тест завершён!'}</h3>
        <p style="font-size: 1.2em; margin-bottom: 10px;">${message}</p>
        <div class="stats-grid">
            <div class="stats-cell">
                <span class="value">${finalCorrectCount}/${FINAL_TOTAL}</span>
                <span class="label">Правильных ответов</span>
            </div>
            <div class="stats-cell">
                <span class="value">${percent}%</span>
                <span class="label">Точность</span>
            </div>
            <div class="stats-cell">
                <span class="value">${timeStr}</span>
                <span class="label">Время прохождения</span>
            </div>
        </div>
    `;
    statsEl.style.display = 'block';
    statsEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function checkAllFinalAnswered() {
    const finalQs = document.querySelectorAll('.final-q');
    let answeredCount = 0;
    finalQs.forEach((container, idx) => {
        if (answeredQuestions.has(`final_${idx}`)) answeredCount++;
    });
    if (answeredCount === FINAL_TOTAL) {
        finishFinalTest(false);
    }
}

// Обработка кликов по вариантам ответов
document.querySelectorAll('.quiz-option').forEach(option => {
    option.addEventListener('click', function() {
        const container = this.closest('.quiz-container');
        const isFinalQ = container.classList.contains('final-q');
        const qId = isFinalQ ? 
            `final_${Array.from(document.querySelectorAll('.final-q')).indexOf(container)}` :
            Array.from(document.querySelectorAll('.quiz-container')).indexOf(container);
        
        if (answeredQuestions.has(qId)) return;
        answeredQuestions.add(qId);

        const isCorrect = this.dataset.correct === 'true';

        if (isCorrect) {
            this.classList.add('correct');
            score += 10;
            correctAnswers++;
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
            
            container.querySelectorAll('.quiz-option').forEach(opt => {
                if (opt.dataset.correct === 'true') opt.classList.add('correct');
            });
        }

        container.querySelectorAll('.quiz-option').forEach(opt => {
            opt.style.pointerEvents = 'none';
        });

        updateStats();

        if (isFinalQ && !finalTestFinished) {
            checkAllFinalAnswered();
        }
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
        const heading = section.querySelector('h2');
        const target = heading || section;
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
}

function nextSection() {
    if (currentSection < totalSections) {
        document.getElementById(`section${currentSection}`).classList.remove('active');
        currentSection++;
        document.getElementById(`section${currentSection}`).classList.add('active');
        updateStats();
        updateNavigation();
        
        setTimeout(scrollToSectionTop, 50);
        
        if (currentSection === totalSections) {
            startGlobalTimer();
            showFinalResults();
        }
    }
}

function previousSection() {
    if (currentSection > 1) {
        if (currentSection === totalSections) {
            stopGlobalTimer();
        }
        document.getElementById(`section${currentSection}`).classList.remove('active');
        currentSection--;
        document.getElementById(`section${currentSection}`).classList.add('active');
        updateStats();
        updateNavigation();
        
        setTimeout(scrollToSectionTop, 50);
    }
}

function updateNavigation() {
    document.getElementById('prevBtn').disabled = currentSection === 1;
    document.getElementById('nextBtn').disabled = currentSection === totalSections;
}

function showFinalResults() {
    let resultsDiv = document.getElementById('finalResults');
    if (!resultsDiv) {
        resultsDiv = document.createElement('div');
        resultsDiv.id = 'finalResults';
        resultsDiv.innerHTML = `
            <div class="final-score">
                <h2>Урок завершён!</h2>
                <div class="score-value" id="finalScore">0</div>
                <p>очков набрано</p>
                <div id="achievements"></div>
            </div>
            <div class="success-message">
                <strong>📝 Что вы изучили:</strong>
                <ul style="margin-left: 20px; margin-top: 10px; line-height: 2;">
                    <li>Создание и операции со строками</li>
                    <li>Индексацию, срезы и шаг среза</li>
                    <li>Методы: upper, lower, capitalize, strip, count, find, replace, split, join</li>
                    <li>Форматирование с помощью f-строк</li>
                </ul>
            </div>
            <div style="text-align:center;margin-top:30px;"><a href="index.html" class="btn" style="text-decoration:none;display:inline-block;">🏠Главная</a>
                <button class="btn" onclick="restartLesson()">🔄 Пройти урок заново</button>
            </div>
        `;
        document.getElementById('section8').appendChild(resultsDiv);
    }
    
    document.getElementById('finalScore').textContent = score;
    
    const achievementsDiv = document.getElementById('achievements');
    achievementsDiv.innerHTML = '';
    
    if (correctAnswers >= 30) achievementsDiv.innerHTML += '<span class="achievement">🏆 Мастер строк</span>';
    if (correctAnswers >= 20) achievementsDiv.innerHTML += '<span class="achievement">⭐ Отличник</span>';
    if (score >= 200) achievementsDiv.innerHTML += '<span class="achievement">💎 Эксперт</span>';
}

function restartLesson() {
    currentSection = 1;
    score = 0;
    correctAnswers = 0;
    finalCorrectCount = 0;
    finalTestFinished = false;
    answeredQuestions.clear();
    stopGlobalTimer();

    document.querySelectorAll('.quiz-option').forEach(opt => {
        opt.classList.remove('correct', 'incorrect');
        opt.style.pointerEvents = 'auto';
    });

    document.querySelectorAll('.success-message').forEach(msg => msg.remove());

    const timerEl = document.getElementById('globalTimer');
    if (timerEl) {
        timerEl.classList.remove('warning', 'danger', 'finished');
        timerEl.textContent = '⏱️ 10:00';
    }

    const statsEl = document.getElementById('finalTestStats');
    if (statsEl) {
        statsEl.style.display = 'none';
        statsEl.innerHTML = '';
    }

    document.querySelectorAll('.lesson-section').forEach(section => {
        section.classList.remove('active');
    });
    document.getElementById('section1').classList.add('active');

    const res = document.getElementById('finalResults');
    if (res) res.remove();

    updateStats();
    updateNavigation();
    
    setTimeout(scrollToSectionTop, 50);
}

updateStats();
updateNavigation();