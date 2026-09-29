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

// ===== ЗВУКИ =====
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

// ===== НАВИГАЦИЯ =====
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

// ===== ОБРАБОТКА ТЕСТОВ =====
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

// ===== ИТОГОВЫЙ ТЕСТ =====
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

function showFinalResults() {
    let r = document.getElementById('finalResults');
    if (!r) {
        r = document.createElement('div');
        r.id = 'finalResults';
        r.innerHTML = `<div class="final-score"><h2>Урок завершён!</h2><div class="score-value" id="finalScore">0</div><p>очков набрано</p><div id="achievements"></div></div>
            <div class="success-message"><strong>📝 Что вы изучили:</strong><ul style="margin-left:20px;margin-top:10px;line-height:2;">
            <li>Классы и объекты (чертёж vs дом)</li><li>Атрибуты и методы</li>
            <li>Конструктор __init__ и self</li><li>Создание нескольких объектов</li>
            <li>Инкапсуляция и приватные атрибуты</li></ul></div>
            <div style="text-align:center;margin-top:30px;"><a href="index.html" class="btn" style="text-decoration:none;display:inline-block;">🏠 На главную</a>
            <button class="btn" onclick="restartLesson()"> Пройти заново</button></div>`;
        document.getElementById(`section${totalSections}`).appendChild(r);
    }
    document.getElementById('finalScore').textContent = score;
    const a = document.getElementById('achievements');
    a.innerHTML = '';
    if (correctAnswers >= 20) a.innerHTML += '<span class="achievement">🏆 Мастер ООП</span>';
    if (correctAnswers >= 15) a.innerHTML += '<span class="achievement">⭐ Отличник</span>';
    if (score >= 150) a.innerHTML += '<span class="achievement">💎 Эксперт</span>';
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
    resetDnd(); resetFill();
    updateStats(); updateNavigation(); setTimeout(scrollToSectionTop, 50);
}


// ===== DRAG & DROP ЗАДАНИЕ (Исправленная версия) =====

// Строки кода С ОТСТУПАМИ (пробелы сохранятся благодаря white-space: pre в CSS)
const dndCorrectOrder = [
    'class Dog:',
    '    def __init__(self, name):',
    '        self.name = name',
    '    def bark(self):',
    '        print(f"{self.name} says: Woof!")'
];

let dndChecked = false;
let draggedItem = null;

function initDnd() {
    const bank = document.getElementById('dnd-bank');
    const editor = document.getElementById('dnd-editor');
    
    // Очищаем
    bank.innerHTML = '';
    editor.innerHTML = '<div class="empty-state">Перетащи сюда первую строку кода...</div>';
    document.getElementById('dndResult').innerHTML = '';
    dndChecked = false;

    // Перемешиваем строки
    const shuffled = [...dndCorrectOrder].sort(() => Math.random() - 0.5);

    // Создаем блоки в банке
    shuffled.forEach((line, index) => {
        const block = createCodeBlock(line, index);
        bank.appendChild(block);
    });

    setupDropZones();
}

function createCodeBlock(text, id) {
    const div = document.createElement('div');
    div.className = 'code-block-item';
    div.draggable = true;
    div.dataset.id = `block-${id}-${Math.random().toString(36).substr(2, 9)}`;
    div.dataset.code = text; // оригинальный текст для проверки
    
    // Определяем уровень вложенности
    const indentMatch = text.match(/^( *)/);
    const indentLevel = indentMatch ? Math.floor(indentMatch[1].length / 4) : 0;
    div.dataset.indent = indentLevel;
    
    // Создаём <pre> внутри — он ГАРАНТИРОВАННО показывает пробелы
    const pre = document.createElement('pre');
    pre.textContent = text; // textContent сохраняет пробелы внутри <pre>
    div.appendChild(pre);

    // События перетаскивания
    div.addEventListener('dragstart', handleDragStart);
    div.addEventListener('dragend', handleDragEnd);
    
    return div;
}

function setupDropZones() {
    const zones = document.querySelectorAll('.dnd-list');
    
    zones.forEach(zone => {
        zone.addEventListener('dragover', (e) => {
            e.preventDefault(); // Разрешаем сброс
            if (zone.classList.contains('dropzone')) {
                zone.classList.add('drag-over');
            }
        });

        zone.addEventListener('dragleave', () => {
            zone.classList.remove('drag-over');
        });

        zone.addEventListener('drop', (e) => {
            e.preventDefault();
            zone.classList.remove('drag-over');
            
            if (draggedItem) {
                // Если бросаем в редактор, убираем надпись "пусто"
                if (zone.id === 'dnd-editor') {
                    const emptyState = zone.querySelector('.empty-state');
                    if (emptyState) emptyState.remove();
                }
                
                // Если бросаем обратно в банк, и банк пуст, можно вернуть надпись (опционально)
                
                zone.appendChild(draggedItem);
                draggedItem = null;
            }
        });
    });
}

function handleDragStart(e) {
    draggedItem = this;
    setTimeout(() => this.classList.add('dragging'), 0);
    e.dataTransfer.effectAllowed = 'move';
}

function handleDragEnd() {
    this.classList.remove('dragging');
    draggedItem = null;
    
    // Проверка на пустой редактор
    const editor = document.getElementById('dnd-editor');
    if (editor.children.length === 0) {
        editor.innerHTML = '<div class="empty-state">Перетащи сюда первую строку кода...</div>';
    }
}

function checkDnd() {
    if (dndChecked) return;
    
    const editor = document.getElementById('dnd-editor');
    const blocks = Array.from(editor.querySelectorAll('.code-block-item'));
    
    // Собираем код из редактора
    const userCode = blocks.map(b => b.dataset.code);

    if (userCode.length < dndCorrectOrder.length) {
        showDndResult(false, `Ты перетащил только ${userCode.length} строк из ${dndCorrectOrder.length}. Нужно собрать весь класс!`);
        return;
    }

    // Проверяем порядок
    const isCorrect = userCode.every((line, idx) => line === dndCorrectOrder[idx]);
    dndChecked = true;

    if (isCorrect) {
        score += 15;
        correctAnswers++;
        playSound('correct');
        showDndResult(true, 'Отлично! Класс собран верно, отступы на месте! +15 очков');
    } else {
        playSound('incorrect');
        showDndResult(false, 'Порядок строк неверный. Посмотри на правильный вариант ниже.');
        
        // Показываем правильный код
        const correctEl = document.createElement('div');
        correctEl.className = 'dnd-correct';
        correctEl.innerHTML = '<strong>Правильный код:</strong><pre style="margin-top:10px; font-family:monospace; color:#bbf7d0;">' + dndCorrectOrder.join('\n') + '</pre>';
        document.getElementById('dndResult').appendChild(correctEl);
    }
    updateStats();
}

function showDndResult(success, message) {
    const resultEl = document.getElementById('dndResult');
    const msg = document.createElement('div');
    msg.className = `success-message ${success ? '' : 'error'}`;
    msg.innerHTML = (success ? '✅ ' : '❌ ') + message;
    resultEl.appendChild(msg);
}

function resetDnd() {
    initDnd();
}

function showDndHint() {
    if (score >= 5) {
        score -= 5;
        updateStats();
    }
    const hint = document.createElement('div');
    hint.className = 'success-message';
    hint.style.background = '#332b00';
    hint.style.borderLeftColor = '#fbbf24';
    hint.innerHTML = '💡 <strong>Подсказка:</strong> Сначала объявляем <code>class</code> (без отступа). Потом методы <code>def</code> (4 пробела). А внутри методов — код (8 пробелов).';
    document.getElementById('dndResult').appendChild(hint);
}

// Не забудь вызвать initDnd() в самом конце скрипта при загрузке!

// ===== ЗАПОЛНЕНИЕ ПРОПУСКОВ =====
const fillCode = `class Book:
    def ___1___(self, title, author):
        self.___2___ = title
        self.___3___ = author
    
    def ___4___(self):
        return f"{self.title} by {self.author}"`;

const fillAnswers = {
    1: '__init__',
    2: 'title',
    3: 'author',
    4: '__str__'
};

const fillWords = ['__init__', 'title', 'author', '__str__', 'self', 'class', 'def'];
let selectedWord = null;
let fillChecked = false;

function initFill() {
    const codeEl = document.getElementById('fillCode');
    codeEl.innerHTML = '';
    
    const parts = fillCode.split(/___(\d+)___/);
    let html = '<pre>';
    for (let i = 0; i < parts.length; i++) {
        if (i % 2 === 1) {
            html += `<span class="fill-blank" data-num="${parts[i]}" data-filled=""></span>`;
        } else {
            html += `<span class="fill-text">${parts[i]}</span>`;
        }
    }
    html += '</pre>';
    codeEl.innerHTML = html;
    
    codeEl.querySelectorAll('.fill-blank').forEach(blank => {
        blank.addEventListener('click', () => handleBlankClick(blank));
    });
    
    renderFillBank();
}

function renderFillBank() {
    const bankEl = document.getElementById('fillWords');
    bankEl.innerHTML = '';
    fillWords.forEach(word => {
        const el = document.createElement('span');
        el.className = 'fill-word';
        el.textContent = word;
        el.dataset.word = word;
        el.addEventListener('click', () => handleWordClick(el));
        bankEl.appendChild(el);
    });
}

function handleWordClick(el) {
    if (fillChecked) return;
    if (selectedWord === el) {
        el.classList.remove('selected');
        selectedWord = null;
        return;
    }
    if (selectedWord) selectedWord.classList.remove('selected');
    selectedWord = el;
    el.classList.add('selected');
}

function handleBlankClick(blank) {
    if (fillChecked) return;
    
    if (selectedWord) {
        blank.textContent = selectedWord.dataset.word;
        blank.dataset.filled = selectedWord.dataset.word;
        selectedWord.classList.add('used');
        selectedWord.classList.remove('selected');
        selectedWord = null;
    } else if (blank.dataset.filled) {
        const word = blank.dataset.filled;
        blank.textContent = '';
        blank.dataset.filled = '';
        const wordEl = Array.from(document.querySelectorAll('.fill-word')).find(el => el.dataset.word === word && el.classList.contains('used'));
        if (wordEl) wordEl.classList.remove('used');
    }
}

function checkFill() {
    if (fillChecked) return;
    const blanks = document.querySelectorAll('.fill-blank');
    let allCorrect = true;
    let allFilled = true;
    
    blanks.forEach(blank => {
        if (!blank.dataset.filled) {
            allFilled = false;
        } else if (blank.dataset.filled !== fillAnswers[blank.dataset.num]) {
            allCorrect = false;
            blank.classList.add('wrong');
        } else {
            blank.classList.add('right');
        }
    });
    
    if (!allFilled) {
        showFillResult(false, 'Заполни все пропуски!');
        return;
    }
    
    fillChecked = true;
    if (allCorrect) {
        score += 15;
        correctAnswers++;
        playSound('correct');
        showFillResult(true, 'Все пропуски заполнены верно! +15 очков');
    } else {
        playSound('incorrect');
        showFillResult(false, 'Есть ошибки. Правильные ответы выделены зелёным.');
    }
    updateStats();
}

function showFillResult(success, message) {
    const resultEl = document.getElementById('fillResult');
    const msg = document.createElement('div');
    msg.className = `success-message ${success ? '' : 'error'}`;
    msg.innerHTML = (success ? '✅ ' : '❌ ') + message;
    resultEl.appendChild(msg);
}

function resetFill() {
    fillChecked = false;
    selectedWord = null;
    document.getElementById('fillResult').innerHTML = '';
    initFill();
}

function showFillHint() {
    if (score >= 5) {
        score -= 5;
        updateStats();
    }
    const hint = document.createElement('div');
    hint.className = 'success-message';
    hint.style.background = '#332b00';
    hint.style.borderLeftColor = '#fbbf24';
    hint.innerHTML = '💡 <strong>Подсказка:</strong> 1 — конструктор, 2 и 3 — имена параметров, 4 — магический метод для print()';
    document.getElementById('fillResult').appendChild(hint);
}

// ===== ИНИЦИАЛИЗАЦИЯ =====
updateStats();
updateNavigation();
initDnd();
initFill();