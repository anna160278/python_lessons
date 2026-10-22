let currentSection = 1;
const totalSections = 5;
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
            <div class="success-message"><strong> Что вы изучили:</strong><ul style="margin-left:20px;margin-top:10px;line-height:2;">
            <li>Словари (dict) — пары ключ:значение</li><li>Создание, получение, добавление и изменение данных</li>
            <li>Методы словарей: get, keys, values, items, update, pop, del</li><li>Перебор словарей циклом for</li>
            <li>Практические паттерны: счётчик элементов, кортежи как ключи</li></ul></div>
            <div style="text-align:center;margin-top:30px;">
            <button class="btn" onclick="openSendModal()" style="margin-right:10px;">📧 Отправить результат</button>
            <a href="index.html" class="btn" style="text-decoration:none;display:inline-block;">🏠 На главную</a>
            <button class="btn" onclick="restartLesson()">🔄 Пройти заново</button></div>`;
        document.getElementById(`section${totalSections}`).appendChild(r);
    }
    document.getElementById('finalScore').textContent = score;
    const a = document.getElementById('achievements');
    a.innerHTML = '';
    if (correctAnswers >= 15) a.innerHTML += '<span class="achievement">🏆 Мастер словарей</span>';
    if (correctAnswers >= 10) a.innerHTML += '<span class="achievement">⭐ Отличник</span>';
    if (score >= 100) a.innerHTML += '<span class="achievement"> Эксперт</span>';
}

function restartLesson() {
    currentSection = 1; score = 0; correctAnswers = 0; finalCorrectCount = 0; finalTestFinished = false;
    closeSendModal(); // <-- ДОБАВИТЬ ЭТУ СТРОКУ
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

// ===== МОДАЛЬНОЕ ОКНО ОТПРАВКИ РЕЗУЛЬТАТА =====
function openSendModal() {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay active';
    modal.id = 'sendModal';
    modal.innerHTML = `
        <div class="modal">
            <h3>📧 Отправить результат преподавателю</h3>
            <p style="color:#999;margin-bottom:15px;">Введи своё имя и email, чтобы мы знали, кто прошёл тест:</p>
            <input type="text" id="studentName" placeholder="Твоё имя" autocomplete="off" style="margin-bottom:10px;">
            <input type="email" id="studentEmail" placeholder="Твой email (необязательно)" autocomplete="email">
            <div class="modal-buttons">
                <button class="btn btn-secondary" onclick="closeSendModal()">Отмена</button>
                <button class="btn" onclick="sendResult()">📤 Отправить</button>
            </div>
            <div class="send-status" id="sendStatus"></div>
        </div>
    `;
    document.body.appendChild(modal);
    
    setTimeout(() => document.getElementById('studentName').focus(), 100);
}

function closeSendModal() {
    const modal = document.getElementById('sendModal');
    if (modal) modal.remove();
}

function sendResult() {
    const name = document.getElementById('studentName').value.trim();
    const email = document.getElementById('studentEmail').value.trim();
    const statusEl = document.getElementById('sendStatus');
    const sendBtn = document.querySelector('.modal-buttons .btn:not(.btn-secondary)');
    
    if (!name) {
        statusEl.className = 'send-status error';
        statusEl.textContent = '❌ Пожалуйста, введи своё имя!';
        return;
    }
    
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        statusEl.className = 'send-status error';
        statusEl.textContent = '❌ Некорректный email. Проверь формат!';
        return;
    }
    
    // Блокируем кнопку
    sendBtn.disabled = true;
    sendBtn.innerHTML = '⏳ Отправка...';
    statusEl.className = 'send-status';
    statusEl.style.display = 'block';
    statusEl.textContent = '⏳ Отправляем результат...';
    
    const wrongAnswers = [];
    const correctAnswers = [];
    
    // АБСОЛЮТНО НАДЁЖНАЯ функция извлечения текста с сохранением ВСЕХ пробелов
    function getFullQuestionText(container) {
    let text = container.querySelector('.quiz-question').textContent.trim();
    text = text.replace(/^\d+[\.\)]\s*/, '');
    
    const codeBlock = container.querySelector('.quiz-code');
    if (codeBlock) {
        let codeText = "";
        
        function walk(node) {
            if (node.nodeType === Node.TEXT_NODE) {
                codeText += node.nodeValue;
            } else if (node.nodeType === Node.ELEMENT_NODE) {
                if (node.tagName === 'BR') {
                    codeText += '\n';
                } else {
                    for (let child of node.childNodes) {
                        walk(child);
                    }
                }
            }
        }
        walk(codeBlock);
        
        codeText = codeText.replace(/\u00A0/g, ' ');
        
        let lines = codeText.split('\n');
        while (lines.length > 0 && lines[0].trim() === '') lines.shift();
        while (lines.length > 0 && lines[lines.length - 1].trim() === '') lines.pop();
        
        //  ГЛАВНОЕ ИСПРАВЛЕНИЕ: заменяем пробелы в начале строк на видимые маркеры
        let formattedLines = lines.map(line => {
            // Считаем количество ведущих пробелов
            let leadingSpaces = line.match(/^(\s*)/)[1].length;
            // Заменяем каждый пробел на символ "·" (средняя точка) или "›"
            let visibleIndent = '`'.repeat(leadingSpaces);
            let content = line.trimStart();
            return visibleIndent + content;
        });
        
        let finalCode = formattedLines.join('\n');
        
        text += '\n\n┌─── КОД ───\n' + finalCode + '\n└───────────';
    }
    return text;
}

    // Анализируем каждый вопрос
    document.querySelectorAll('.final-q').forEach((container) => {
        const wrongOption = container.querySelector('.quiz-option.incorrect');
        const correctOption = container.querySelector('.quiz-option[data-correct="true"]');
        
        if (wrongOption) {
            const qText = getFullQuestionText(container);
            const selectedText = wrongOption.textContent.trim();
            const correctText = correctOption ? correctOption.textContent.trim() : 'Неизвестно';
            
            wrongAnswers.push(
                `❌ ВОПРОС:\n${qText}\n` +
                `   👉 Ученик выбрал: ${selectedText}\n` +
                `   ✅ Правильный ответ: ${correctText}`
            );
        } else {
            const qText = getFullQuestionText(container);
            correctAnswers.push(`✅ ${qText}`);
        }
    });
    
    // Подсчёт
    const totalQuestions = typeof FINAL_TOTAL !== 'undefined' ? FINAL_TOTAL : (correctAnswers.length + wrongAnswers.length);
    const actualCorrectCount = typeof finalCorrectCount !== 'undefined' ? finalCorrectCount : correctAnswers.length;
    const accuracy = totalQuestions > 0 ? Math.round((actualCorrectCount / totalQuestions) * 100) : 0;
    
    // Время
    const timerEl = document.getElementById('globalTimer');
    let timeSpent = 'Неизвестно';
    if (timerEl) {
        const timerText = timerEl.textContent.trim();
        if (timerText.includes('Время вышло')) {
            timeSpent = '7:00 (время вышло)';
        } else if (timerText.includes('Тест завершён')) {
            if (typeof globalTimeLeft !== 'undefined') {
                const spent = 420 - globalTimeLeft;
                const m = Math.floor(spent / 60);
                const s = spent % 60;
                timeSpent = `${m}:${s.toString().padStart(2, '0')}`;
            } else {
                timeSpent = '7:00 (приблизительно)';
            }
        } else {
            const timeMatch = timerText.match(/(\d+:\d+)/);
            if (timeMatch) timeSpent = timeMatch[1];
        }
    }
    
    const emailDisplay = email ? email : 'Не указан';
    const lessonTopic = 'Словари'; // <-- Не забудь поменять название урока здесь!
    
    const message = `📊 РЕЗУЛЬТАТ ТЕСТА

👤 Ученик: ${name}
📧 Email: ${emailDisplay}
📚 Тема: ${lessonTopic}
🏆 Очки: ${typeof score !== 'undefined' ? score : 'N/A'}
✅ Правильных ответов: ${actualCorrectCount} из ${totalQuestions}
📈 Точность: ${accuracy}%
⏱️ Время прохождения: ${timeSpent}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✅ ПРАВИЛЬНЫЕ ОТВЕТЫ (${correctAnswers.length}):
${correctAnswers.length > 0 ? correctAnswers.join('\n\n') : 'Нет'}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

❌ ОШИБКИ (${wrongAnswers.length}):
${wrongAnswers.length > 0 ? wrongAnswers.join('\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n') : 'Нет'}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Отправлено автоматически из системы обучения`;
    
    const accessKey = '97a78ea1-7447-43c9-bdfd-655d10e9e4c8'; // Твой ключ
    
    const formData = {
        access_key: accessKey,
        name: name,
        email: email || 'no-reply@lesson.ru',
        subject: `Результат теста: ${lessonTopic} - ${name}`,
        message: message
    };
    
    fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        },
        body: JSON.stringify(formData)
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            statusEl.className = 'send-status success';
            statusEl.textContent = '✅ Результат успешно отправлен!';
            sendBtn.innerHTML = '✅ Отправлено';
            setTimeout(() => {
                closeSendModal();
                sendBtn.disabled = false;
                sendBtn.innerHTML = '📤 Отправить';
            }, 2000);
        } else {
            throw new Error(data.message || 'Ошибка отправки');
        }
    })
    .catch(error => {
        console.error('Ошибка:', error);
        statusEl.className = 'send-status error';
        statusEl.textContent = '❌ Не удалось отправить. Попробуй ещё раз.';
        sendBtn.disabled = false;
        sendBtn.innerHTML = '📤 Отправить';
    });
}


// Закрытие модального окна по клику на фон
document.addEventListener('click', function(e) {
    if (e.target.classList.contains('modal-overlay')) {
        closeSendModal();
    }
});

updateStats(); 
updateNavigation();