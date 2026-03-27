/* ============================================================
   MiniTest K7 – script.js
   Senior Fullstack EdTech Solution
   Kahoot/Quizizz-style Interactive Quiz Engine
   ============================================================ */

// ─── CONFIG ──────────────────────────────────────────────────
const CONFIG = {
  QUESTION_LIMIT: 10,      // Số câu mỗi bài
  TIMER_SECONDS: 30,        // Giây mỗi câu
  POINTS_CORRECT: 100,      // Điểm mỗi câu đúng
  POINTS_STREAK: 20,        // Thưởng combo
  STORAGE_KEY: 'minitest_k7',
  LEADERBOARD_KEY: 'minitest_leaderboard',

  // Google Sheets JSON URL template
  // Khi publish Google Sheet → File → Share → Publish to web
  // URL dạng: https://docs.google.com/spreadsheets/d/[SHEET_ID]/gviz/tq?tqx=out:json
  SHEET_URLS: {
    1: localStorage.getItem('sheet_url_1') || 'https://docs.google.com/spreadsheets/d/1zgI0VgRRF2LNELXk_6YaVEp7pl2tjHda-bYsY2JiOFQ/gviz/tq?tqx=out:json',
    2: localStorage.getItem('sheet_url_2') || 'https://docs.google.com/spreadsheets/d/18H4rMnsNA3qziZEDf6GfXNZWVLhDu3ZYzc-JRAkQues/gviz/tq?tqx=out:json',
    3: localStorage.getItem('sheet_url_3') || 'https://docs.google.com/spreadsheets/d/1mT3VVtbLgtCBovIxMoCboeVqbfvAEX3-h8AVxj8N-ls/gviz/tq?tqx=out:json',
    4: localStorage.getItem('sheet_url_4') || 'https://docs.google.com/spreadsheets/d/1B0qTMeym2qZhq36iiaAgXtDIILmOMeK7CF0dK7r5WdA/gviz/tq?tqx=out:json',
  }
};

// ─── DEMO DATA (dùng khi chưa có Google Sheets URL) ─────────
const DEMO_QUESTIONS = [
  {
    id:1, type:'mcq',
    question:'Phương trình 2x + 6 = 0 có nghiệm là?',
    options:['x = 3','x = -3','x = 6','x = -6'],
    answer:'x = -3', image:null
  },
  {
    id:2, type:'mcq',
    question:'Hệ số góc của đường thẳng y = 3x – 5 là?',
    options:['3','–5','5','–3'],
    answer:'3', image:null
  },
  {
    id:3, type:'fill',
    question:'Điền kết quả: 7² = ?',
    options:[], answer:'49', image:null
  },
  {
    id:4, type:'mcq',
    question:'Diện tích hình chữ nhật có chiều dài 8cm, chiều rộng 5cm là?',
    options:['13 cm²','40 cm²','26 cm²','20 cm²'],
    answer:'40 cm²', image:null
  },
  {
    id:5, type:'mcq',
    question:'Số nào sau đây là số nguyên tố?',
    options:['9','15','17','21'],
    answer:'17', image:null
  },
  {
    id:6, type:'fill',
    question:'Căn bậc hai của 144 là?',
    options:[], answer:'12', image:null
  },
  {
    id:7, type:'mcq',
    question:'Tam giác có 3 cạnh bằng nhau gọi là tam giác gì?',
    options:['Vuông','Cân','Đều','Nhọn'],
    answer:'Đều', image:null
  },
  {
    id:8, type:'mcq',
    question:'1 giờ = ? phút',
    options:['30','45','60','90'],
    answer:'60', image:null
  },
  {
    id:9, type:'mcq',
    question:'Giá trị của biểu thức |–8| + |3| là?',
    options:['5','–5','11','–11'],
    answer:'11', image:null
  },
  {
    id:10, type:'mcq',
    question:'Chu vi hình vuông cạnh 7cm là?',
    options:['14 cm','21 cm','28 cm','49 cm'],
    answer:'28 cm', image:null
  },
  {
    id:11, type:'mcq',
    question:'Tập hợp số tự nhiên ký hiệu là?',
    options:['ℤ','ℝ','ℕ','ℚ'],
    answer:'ℕ', image:null
  },
  {
    id:12, type:'fill',
    question:'3 × (4 + 6) – 5 = ?',
    options:[], answer:'25', image:null
  },
  {
    id:13, type:'mcq',
    question:'Hai đường thẳng song song thì?',
    options:['Cắt nhau tại một điểm','Không có điểm chung','Trùng nhau','Vuông góc'],
    answer:'Không có điểm chung', image:null
  },
  {
    id:14, type:'mcq',
    question:'Phần trăm của 30 trong 120 là?',
    options:['20%','25%','30%','40%'],
    answer:'25%', image:null
  },
  {
    id:15, type:'mcq',
    question:'Tổng các góc trong tam giác bằng?',
    options:['90°','180°','270°','360°'],
    answer:'180°', image:null
  },
];

// ─── STATE ───────────────────────────────────────────────────
let state = {
  student: null,
  questions: [],
  current: 0,
  score: 0,
  streak: 0,
  maxStreak: 0,
  answers: [],
  startTime: null,
  timer: null,
  timerValue: CONFIG.TIMER_SECONDS,
  answered: false,
  selectedTest: 1,
  dragState: { dragging: null },
  matchState: { selected: null, pairs: {} },
};

// ─── INIT ─────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  initParticles();
  loadSavedStudent();
  loadSavedUrls();
  initTestSelector();
});

function initParticles() {
  const container = document.getElementById('particles');
  const colors = ['#a78bfa','#f59e0b','#10b981','#3b82f6','#ec4899'];
  for (let i = 0; i < 25; i++) {
    const p = document.createElement('div');
    p.className = 'particle';
    const size = Math.random() * 20 + 8;
    p.style.cssText = `
      width:${size}px; height:${size}px;
      left:${Math.random()*100}%;
      background:${colors[Math.floor(Math.random()*colors.length)]};
      animation-duration:${Math.random()*15+10}s;
      animation-delay:${Math.random()*10}s;
    `;
    container.appendChild(p);
  }
}

function initTestSelector() {
  document.querySelectorAll('.test-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.test-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      state.selectedTest = parseInt(btn.dataset.test);
    });
  });
}

function loadSavedStudent() {
  const saved = localStorage.getItem(CONFIG.STORAGE_KEY);
  if (saved) {
    const data = JSON.parse(saved);
    if (data.name) document.getElementById('inp-name').value = data.name;
    if (data.class) document.getElementById('inp-class').value = data.class;
    if (data.id) document.getElementById('inp-id').value = data.id;
  }
}

function loadSavedUrls() {
  for (let i = 1; i <= 4; i++) {
    const url = localStorage.getItem(`sheet_url_${i}`);
    const el = document.getElementById(`url-${i}`);
    if (url && el) el.value = url;
  }
}

function saveUrls() {
  for (let i = 1; i <= 4; i++) {
    const url = document.getElementById(`url-${i}`)?.value?.trim();
    if (url) {
      localStorage.setItem(`sheet_url_${i}`, url);
      CONFIG.SHEET_URLS[i] = url;
    }
  }
  showToast('✅ Đã lưu cấu hình URL!');
}

// ─── START GAME ───────────────────────────────────────────────
async function startGame() {
  const name = document.getElementById('inp-name').value.trim();
  const cls = document.getElementById('inp-class').value.trim();
  const id = document.getElementById('inp-id').value.trim();

  if (!name || !cls || !id) {
    showToast('⚠️ Vui lòng điền đầy đủ thông tin!');
    return;
  }

  state.student = { name, class: cls, id };
  localStorage.setItem(CONFIG.STORAGE_KEY, JSON.stringify(state.student));

  showScreen('loading');
  animateLoading();

  try {
    const questions = await fetchQuestions(state.selectedTest);
    state.questions = shuffleArray(questions).slice(0, CONFIG.QUESTION_LIMIT);
    state.current = 0;
    state.score = 0;
    state.streak = 0;
    state.maxStreak = 0;
    state.answers = [];
    state.startTime = Date.now();

    setTimeout(() => {
      setupQuizUI();
      showScreen('quiz');
      renderQuestion();
    }, 1600);
  } catch (err) {
    console.error(err);
    showToast('⚠️ Dùng dữ liệu demo (chưa có Google Sheets URL)');
    state.questions = shuffleArray([...DEMO_QUESTIONS]).slice(0, CONFIG.QUESTION_LIMIT);
    state.current = 0;
    state.score = 0;
    state.streak = 0;
    state.maxStreak = 0;
    state.answers = [];
    state.startTime = Date.now();
    setTimeout(() => {
      setupQuizUI();
      showScreen('quiz');
      renderQuestion();
    }, 1600);
  }
}

function animateLoading() {
  const fill = document.getElementById('loading-fill');
  let w = 0;
  const iv = setInterval(() => {
    w += Math.random() * 12 + 3;
    if (w >= 95) { clearInterval(iv); w = 95; }
    fill.style.width = w + '%';
  }, 120);
}

// ─── FETCH FROM GOOGLE SHEETS ─────────────────────────────────
async function fetchQuestions(testNum) {
  const url = CONFIG.SHEET_URLS[testNum];
  if (!url) throw new Error('No URL configured');

  // Handle Google Sheets gviz/tq format
  const res = await fetch(url);
  const text = await res.text();

  // gviz returns: google.visualization.Query.setResponse({...})
  let json;
  if (text.includes('google.visualization')) {
    const match = text.match(/google\.visualization\.Query\.setResponse\(([\s\S]+)\);?\s*$/);
    if (!match) throw new Error('Invalid gviz response');
    json = JSON.parse(match[1]);
    return parseGvizData(json);
  }

  // Pure JSON (published as JSON)
  json = JSON.parse(text);
  return parseSheetJSON(json);
}

function parseGvizData(json) {
  const rows = json.table.rows;
  const cols = json.table.cols.map(c => c.label.toLowerCase().trim());

  return rows.map((row, i) => {
    const get = (key) => {
      const idx = cols.findIndex(c => c.includes(key));
      return idx >= 0 ? (row.c[idx]?.v || '') : '';
    };
    const question = get('question') || get('câu hỏi') || get('question');
    const type = (get('type') || get('loại') || 'mcq').toLowerCase().trim();
    const optRaw = get('options') || get('đáp án') || get('options');
    const options = optRaw ? optRaw.split('|').map(s => s.trim()).filter(Boolean) : [];
    const answer = get('correct') || get('answer') || get('đúng') || '';
    const image = get('image') || get('hình') || null;

    return { id: i+1, type, question, options, answer: answer.trim(), image: image || null };
  }).filter(q => q.question);
}

function parseSheetJSON(json) {
  // Handle various export formats
  const values = json.values || json;
  if (!Array.isArray(values) || values.length < 2) throw new Error('Empty sheet');

  const headers = values[0].map(h => (h||'').toLowerCase().trim());
  return values.slice(1).map((row, i) => {
    const get = (key) => {
      const idx = headers.findIndex(h => h.includes(key));
      return idx >= 0 ? (row[idx] || '') : '';
    };
    const question = get('question') || get('câu');
    const type = (get('type') || get('loại') || 'mcq').toLowerCase().trim();
    const optRaw = get('options') || get('đáp án');
    const options = optRaw ? optRaw.split('|').map(s => s.trim()) : [];
    const answer = get('correct') || get('answer') || get('đúng') || '';
    const image = get('image') || null;
    return { id:i+1, type, question, options, answer:answer.trim(), image:image||null };
  }).filter(q => q.question);
}

// ─── QUIZ UI SETUP ────────────────────────────────────────────
function setupQuizUI() {
  document.getElementById('q-name').textContent = state.student.name;
  document.getElementById('q-class').textContent = state.student.class;
  const avatars = ['🧑','👧','🧒','👦','🙋','🎓'];
  document.getElementById('q-avatar').textContent = avatars[Math.floor(Math.random()*avatars.length)];
}

function renderQuestion() {
  if (state.current >= state.questions.length) { endGame(); return; }

  const q = state.questions[state.current];
  state.answered = false;

  // Update header
  const pct = (state.current / state.questions.length) * 100;
  document.getElementById('progress-fill').style.width = pct + '%';
  document.getElementById('progress-text').textContent = `${state.current+1} / ${state.questions.length}`;
  document.getElementById('question-number').textContent = `Câu ${state.current+1}`;

  // Type badge
  const typeName = { mcq:'Trắc nghiệm', fill:'Điền từ', dragdrop:'Kéo thả', matching:'Nối cột', image:'Chọn hình' };
  document.getElementById('question-type-badge').textContent = typeName[q.type] || 'Câu hỏi';

  // Question text
  document.getElementById('question-text').textContent = q.question;

  // Image
  const imgWrap = document.getElementById('question-image-wrap');
  if (q.image) {
    document.getElementById('question-image').src = q.image;
    imgWrap.style.display = 'block';
  } else {
    imgWrap.style.display = 'none';
  }

  // Feedback overlay reset
  const overlay = document.getElementById('feedback-overlay');
  overlay.className = 'feedback-overlay';
  overlay.textContent = '';

  // Hide next btn
  document.getElementById('btn-next').style.display = 'none';
  document.getElementById('streak-display').style.display = 'none';

  // Render by type
  const wrap = document.getElementById('answers-wrap');
  wrap.innerHTML = '';

  switch(q.type) {
    case 'fill': renderFill(q, wrap); break;
    case 'dragdrop': renderDragDrop(q, wrap); break;
    case 'matching': renderMatching(q, wrap); break;
    default: renderMCQ(q, wrap);
  }

  // Start timer
  startTimer();
}

// ─── MCQ ──────────────────────────────────────────────────────
function renderMCQ(q, wrap) {
  const letters = ['A','B','C','D','E','F'];
  wrap.className = `answers-wrap ${q.options.length > 4 ? 'grid-2' : 'grid-2'}`;
  const shuffled = shuffleArray([...q.options]);

  shuffled.forEach((opt, i) => {
    const btn = document.createElement('button');
    btn.className = 'answer-btn';
    btn.dataset.idx = i;
    btn.dataset.value = opt;
    btn.innerHTML = `
      <span class="opt-letter">${letters[i]}</span>
      <span class="opt-text">${opt}</span>
    `;
    btn.addEventListener('click', () => handleMCQAnswer(opt, q.answer));
    wrap.appendChild(btn);
  });
}

function handleMCQAnswer(selected, correct) {
  if (state.answered) return;
  state.answered = true;
  clearTimer();

  const isCorrect = selected.trim().toLowerCase() === correct.trim().toLowerCase();
  const timeBonus = Math.floor((state.timerValue / CONFIG.TIMER_SECONDS) * 50);

  processAnswer(isCorrect, selected, correct, timeBonus);
  highlightMCQButtons(selected, correct);
  showFeedback(isCorrect);
  showNextBtn();
}

function highlightMCQButtons(selected, correct) {
  document.querySelectorAll('.answer-btn').forEach(btn => {
    btn.disabled = true;
    const val = btn.dataset.value;
    if (val.trim().toLowerCase() === correct.trim().toLowerCase()) {
      btn.classList.add('correct');
    } else if (val.trim().toLowerCase() === selected.trim().toLowerCase()) {
      btn.classList.add('wrong');
    }
  });
}

// ─── FILL BLANK ───────────────────────────────────────────────
function renderFill(q, wrap) {
  wrap.className = 'answers-wrap grid-1';
  wrap.innerHTML = `
    <div class="fill-wrap">
      <input type="text" class="fill-input" id="fill-input" placeholder="Nhập câu trả lời..." autocomplete="off">
      <button class="btn-submit-fill" id="btn-submit-fill">✅ Xác nhận</button>
    </div>
  `;
  const input = document.getElementById('fill-input');
  const btn = document.getElementById('btn-submit-fill');
  input.focus();
  input.addEventListener('keypress', (e) => { if (e.key === 'Enter') submitFill(q); });
  btn.addEventListener('click', () => submitFill(q));
}

function submitFill(q) {
  if (state.answered) return;
  const val = document.getElementById('fill-input')?.value?.trim();
  if (!val) return;
  state.answered = true;
  clearTimer();

  const isCorrect = val.toLowerCase() === q.answer.toLowerCase();
  processAnswer(isCorrect, val, q.answer, 0);
  document.getElementById('fill-input').disabled = true;
  document.getElementById('btn-submit-fill').disabled = true;
  document.getElementById('fill-input').style.borderColor = isCorrect ? '#2ecc71' : '#e74c3c';
  if (!isCorrect) {
    const hint = document.createElement('div');
    hint.style.cssText = 'color:#2ecc71;font-weight:700;text-align:center;margin-top:8px;';
    hint.textContent = `✅ Đáp án đúng: ${q.answer}`;
    document.querySelector('.fill-wrap').appendChild(hint);
  }
  showFeedback(isCorrect);
  showNextBtn();
}

// ─── DRAG & DROP ──────────────────────────────────────────────
function renderDragDrop(q, wrap) {
  // q.options = items to drag, q.answer = JSON {item: target}
  wrap.className = 'answers-wrap grid-1';
  let mapping = {};
  try { mapping = JSON.parse(q.answer); } catch(e) {
    // Fallback: treat as MCQ
    renderMCQ(q, wrap); return;
  }

  const items = Object.keys(mapping);
  const zones = Object.values(mapping);
  const shuffledItems = shuffleArray([...items]);

  wrap.innerHTML = `
    <div class="dragdrop-wrap">
      <p style="text-align:center;color:var(--text-muted);font-size:0.85rem;margin-bottom:8px;">Kéo các mục vào vị trí đúng</p>
      <div class="drag-items-row" id="drag-source">${shuffledItems.map(i => `<div class="drag-item" draggable="true" data-item="${i}">${i}</div>`).join('')}</div>
      <div class="drop-zones" id="drop-zones">
        ${[...new Set(zones)].map(z => `
          <div class="drop-row">
            <div class="drop-label">${z}</div>
            <div class="drop-zone" data-zone="${z}"><span style="color:var(--text-muted);font-size:0.8rem">Kéo vào đây</span></div>
          </div>`).join('')}
      </div>
      <button class="btn-submit-fill" id="btn-submit-drag" style="margin-top:12px;">✅ Kiểm tra</button>
    </div>
  `;

  setupDragEvents();
  document.getElementById('btn-submit-drag').addEventListener('click', () => checkDragDrop(mapping));
}

function setupDragEvents() {
  const items = document.querySelectorAll('.drag-item');
  const zones = document.querySelectorAll('.drop-zone');

  items.forEach(item => {
    item.addEventListener('dragstart', (e) => {
      state.dragState.dragging = item;
      item.classList.add('dragging');
      e.dataTransfer.effectAllowed = 'move';
    });
    item.addEventListener('dragend', () => {
      item.classList.remove('dragging');
      state.dragState.dragging = null;
    });
    // Touch support
    item.addEventListener('touchstart', touchStart, {passive:true});
    item.addEventListener('touchmove', touchMove, {passive:false});
    item.addEventListener('touchend', touchEnd);
  });

  zones.forEach(zone => {
    zone.addEventListener('dragover', (e) => { e.preventDefault(); zone.classList.add('drag-over'); });
    zone.addEventListener('dragleave', () => zone.classList.remove('drag-over'));
    zone.addEventListener('drop', (e) => {
      e.preventDefault();
      zone.classList.remove('drag-over');
      if (state.dragState.dragging) {
        const inner = zone.querySelector('span');
        if (inner) inner.remove();
        zone.appendChild(state.dragState.dragging);
      }
    });
  });
}

// Touch drag helpers
let touchItem = null, touchClone = null;
function touchStart(e) {
  touchItem = e.currentTarget;
  touchClone = touchItem.cloneNode(true);
  touchClone.style.cssText = 'position:fixed;opacity:0.7;pointer-events:none;z-index:9999;';
  document.body.appendChild(touchClone);
}
function touchMove(e) {
  e.preventDefault();
  const t = e.touches[0];
  if (touchClone) { touchClone.style.left = t.clientX - 30 + 'px'; touchClone.style.top = t.clientY - 20 + 'px'; }
}
function touchEnd(e) {
  if (touchClone) { touchClone.remove(); touchClone = null; }
  const t = e.changedTouches[0];
  const el = document.elementFromPoint(t.clientX, t.clientY);
  const zone = el?.closest?.('.drop-zone');
  if (zone && touchItem) {
    const inner = zone.querySelector('span');
    if (inner) inner.remove();
    zone.appendChild(touchItem);
  }
  touchItem = null;
}

function checkDragDrop(mapping) {
  if (state.answered) return;
  state.answered = true;
  clearTimer();

  let correct = 0, total = Object.keys(mapping).length;
  document.querySelectorAll('.drop-zone').forEach(zone => {
    const zoneName = zone.dataset.zone;
    const item = zone.querySelector('.drag-item');
    if (item) {
      const expected = mapping[item.dataset.item];
      if (expected === zoneName) {
        correct++;
        item.style.background = 'linear-gradient(135deg,#1e8449,#2ecc71)';
      } else {
        item.style.background = 'linear-gradient(135deg,#922b21,#e74c3c)';
      }
    }
  });

  const isFullCorrect = correct === total;
  processAnswer(isFullCorrect, `${correct}/${total}`, `${total}/${total}`, 0);
  showFeedback(isFullCorrect);
  showNextBtn();
}

// ─── MATCHING ─────────────────────────────────────────────────
function renderMatching(q, wrap) {
  wrap.className = 'answers-wrap grid-1';
  let pairs = {};
  try { pairs = JSON.parse(q.answer); } catch(e) { renderMCQ(q, wrap); return; }

  const lefts = Object.keys(pairs);
  const rights = shuffleArray(Object.values(pairs));
  state.matchState = { selected: null, selectedSide: null, pairs: {}, correct: pairs };

  wrap.innerHTML = `
    <div class="matching-wrap">
      <p style="text-align:center;color:var(--text-muted);font-size:0.85rem;margin-bottom:12px;">Bấm vào 2 mục tương ứng để nối</p>
      <div class="matching-grid">
        <div class="match-col" id="match-left">
          ${lefts.map(l => `<div class="match-item" data-side="left" data-val="${l}">${l}</div>`).join('')}
        </div>
        <div class="match-col" id="match-right">
          ${rights.map(r => `<div class="match-item" data-side="right" data-val="${r}">${r}</div>`).join('')}
        </div>
      </div>
      <button class="btn-submit-fill" id="btn-check-match" style="margin-top:14px;display:none;">✅ Kiểm tra</button>
    </div>
  `;

  document.querySelectorAll('.match-item').forEach(item => {
    item.addEventListener('click', () => handleMatchClick(item, lefts));
  });
}

function handleMatchClick(item, lefts) {
  if (item.classList.contains('matched')) return;
  const side = item.dataset.side;
  const val = item.dataset.val;

  if (!state.matchState.selected) {
    state.matchState.selected = val;
    state.matchState.selectedSide = side;
    item.classList.add('selected');
  } else {
    if (state.matchState.selectedSide === side) {
      document.querySelectorAll('.match-item.selected').forEach(el => el.classList.remove('selected'));
      item.classList.add('selected');
      state.matchState.selected = val;
      state.matchState.selectedSide = side;
      return;
    }
    const prev = document.querySelector(`.match-item[data-val="${state.matchState.selected}"]`);
    if (prev) prev.classList.remove('selected');
    item.classList.remove('selected');

    let leftVal = side === 'left' ? val : state.matchState.selected;
    let rightVal = side === 'right' ? val : state.matchState.selected;

    state.matchState.pairs[leftVal] = rightVal;
    if (prev) prev.classList.add('matched');
    item.classList.add('matched');
    state.matchState.selected = null;

    if (Object.keys(state.matchState.pairs).length >= lefts.length) {
      document.getElementById('btn-check-match').style.display = 'block';
      document.getElementById('btn-check-match').addEventListener('click', checkMatching);
    }
  }
}

function checkMatching() {
  if (state.answered) return;
  state.answered = true;
  clearTimer();

  const { pairs, correct } = state.matchState;
  let ok = 0, total = Object.keys(correct).length;
  Object.keys(correct).forEach(k => { if (pairs[k] === correct[k]) ok++; });

  processAnswer(ok === total, JSON.stringify(pairs), JSON.stringify(correct), 0);
  showFeedback(ok === total);
  showNextBtn();
}

// ─── ANSWER PROCESSING ────────────────────────────────────────
function processAnswer(isCorrect, userAnswer, correctAnswer, bonus) {
  let pts = 0;
  if (isCorrect) {
    state.streak++;
    state.maxStreak = Math.max(state.maxStreak, state.streak);
    pts = CONFIG.POINTS_CORRECT + bonus + (state.streak > 1 ? CONFIG.POINTS_STREAK * (state.streak - 1) : 0);
    state.score += pts;
    playSound('correct');
  } else {
    state.streak = 0;
    playSound('wrong');
  }

  state.answers.push({
    q: state.questions[state.current],
    userAnswer,
    correctAnswer,
    isCorrect,
    points: pts
  });

  updateScoreDisplay();
  updateStreakDisplay();
}

function updateScoreDisplay() {
  const el = document.getElementById('score-display');
  el.textContent = state.score;
  el.classList.remove('pop');
  void el.offsetWidth;
  el.classList.add('pop');
}

function updateStreakDisplay() {
  const el = document.getElementById('streak-display');
  if (state.streak > 1) {
    el.style.display = 'block';
    document.getElementById('streak-val').textContent = state.streak;
  } else {
    el.style.display = 'none';
  }
}

function showFeedback(isCorrect) {
  const overlay = document.getElementById('feedback-overlay');
  overlay.textContent = isCorrect ? '✅' : '❌';
  overlay.classList.add('show');
  setTimeout(() => overlay.classList.remove('show'), 700);
}

function showNextBtn() {
  document.getElementById('btn-next').style.display = 'block';
}

// ─── TIMER ────────────────────────────────────────────────────
function startTimer() {
  clearTimer();
  state.timerValue = CONFIG.TIMER_SECONDS;
  const display = document.getElementById('timer-display');
  const val = document.getElementById('timer-val');
  display.classList.remove('urgent');
  val.textContent = state.timerValue;

  state.timer = setInterval(() => {
    state.timerValue--;
    val.textContent = state.timerValue;
    if (state.timerValue <= 10) display.classList.add('urgent');
    if (state.timerValue <= 0) {
      clearTimer();
      if (!state.answered) {
        state.answered = true;
        processAnswer(false, '(Hết giờ)', state.questions[state.current].answer, 0);
        showFeedback(false);
        showNextBtn();
        document.querySelectorAll('.answer-btn').forEach(btn => {
          btn.disabled = true;
          if (btn.dataset.value?.trim().toLowerCase() === state.questions[state.current].answer.trim().toLowerCase()) {
            btn.classList.add('correct');
          }
        });
      }
    }
  }, 1000);
}

function clearTimer() {
  if (state.timer) { clearInterval(state.timer); state.timer = null; }
}

// ─── NEXT QUESTION ────────────────────────────────────────────
function nextQuestion() {
  state.current++;
  document.getElementById('btn-next').style.display = 'none';
  renderQuestion();
}

// ─── END GAME ─────────────────────────────────────────────────
function endGame() {
  clearTimer();
  const elapsed = Math.floor((Date.now() - state.startTime) / 1000);
  const correct = state.answers.filter(a => a.isCorrect).length;
  const wrong = state.answers.length - correct;
  const accuracy = state.answers.length > 0 ? Math.round((correct / state.answers.length) * 100) : 0;
  const finalScore = state.questions.length > 0 ? Math.round((correct / state.questions.length) * 10 * 10) / 10 : 0;

  // Save to leaderboard
  saveToLeaderboard({ ...state.student, score: state.score, correct, time: elapsed, testNum: state.selectedTest });

  // Confetti if good score
  if (accuracy >= 70) launchConfetti();

  showScreen('result');
  renderResult(finalScore, correct, wrong, elapsed, accuracy);
}

function renderResult(score, correct, wrong, elapsed, accuracy) {
  // Trophy & title
  let trophy = '🏆', title = 'Xuất sắc!';
  if (accuracy < 50) { trophy = '😅'; title = 'Cố lên!'; }
  else if (accuracy < 70) { trophy = '🥉'; title = 'Khá tốt!'; }
  else if (accuracy < 90) { trophy = '🥈'; title = 'Giỏi lắm!'; }

  document.getElementById('result-trophy').textContent = trophy;
  document.getElementById('result-title').textContent = title;
  document.getElementById('result-score-big').textContent = score.toFixed(1);
  document.getElementById('stat-correct').textContent = correct;
  document.getElementById('stat-wrong').textContent = wrong;
  document.getElementById('stat-time').textContent = formatTime(elapsed);
  document.getElementById('stat-accuracy').textContent = accuracy + '%';

  // Badges
  const badges = [];
  if (accuracy === 100) badges.push('🎯 Hoàn hảo!');
  if (state.maxStreak >= 5) badges.push(`🔥 Chuỗi ${state.maxStreak}`);
  if (elapsed < 120) badges.push('⚡ Siêu nhanh');
  if (state.score > 1200) badges.push('💎 Điểm cao');
  const badgesEl = document.getElementById('badges-row');
  badgesEl.innerHTML = badges.map(b => `<div class="badge-item">${b}</div>`).join('');

  // Review table
  const tbody = document.getElementById('review-tbody');
  tbody.innerHTML = state.answers.map((a, i) => `
    <tr class="${a.isCorrect ? 'row-correct' : 'row-wrong'}">
      <td>${i+1}</td>
      <td>${a.q.question.substring(0,50)}${a.q.question.length>50?'...':''}</td>
      <td>${a.userAnswer}</td>
      <td>${a.correctAnswer}</td>
      <td><span class="result-icon">${a.isCorrect ? '✅' : '❌'}</span></td>
    </tr>
  `).join('');

  // Leaderboard
  renderLeaderboard();
}

// ─── LEADERBOARD ──────────────────────────────────────────────
function saveToLeaderboard(entry) {
  let board = JSON.parse(localStorage.getItem(CONFIG.LEADERBOARD_KEY) || '[]');
  board.push({ ...entry, date: new Date().toLocaleDateString('vi-VN') });
  board = board.sort((a,b) => b.score - a.score).slice(0, 20);
  localStorage.setItem(CONFIG.LEADERBOARD_KEY, JSON.stringify(board));
}

function renderLeaderboard() {
  const board = JSON.parse(localStorage.getItem(CONFIG.LEADERBOARD_KEY) || '[]');
  const medals = ['🥇','🥈','🥉'];
  const el = document.getElementById('leaderboard-list');
  el.innerHTML = board.slice(0,10).map((row, i) => `
    <div class="lb-row ${i<3?'lb-top':''}">
      <span class="lb-rank">${medals[i] || (i+1)}</span>
      <span class="lb-name">${row.name}</span>
      <span class="lb-class">${row.class}</span>
      <span class="lb-score">${row.score}</span>
    </div>
  `).join('') || '<p style="color:var(--text-muted);text-align:center;padding:16px;">Chưa có kết quả</p>';
}

// ─── EXPORT EXCEL ─────────────────────────────────────────────
function exportExcel() {
  if (typeof XLSX === 'undefined') { showToast('⚠️ SheetJS chưa tải!'); return; }

  const correct = state.answers.filter(a => a.isCorrect).length;
  const elapsed = Math.floor((Date.now() - state.startTime) / 1000);
  const accuracy = state.answers.length > 0 ? Math.round((correct / state.answers.length) * 100) : 0;

  // Sheet 1: Thông tin học sinh + tổng kết
  const infoData = [
    ['📋 KẾT QUẢ KIỂM TRA'],
    [],
    ['Họ tên:', state.student.name],
    ['Lớp:', state.student.class],
    ['Mã HS:', state.student.id],
    ['Bài kiểm tra:', `Test ${state.selectedTest}_K7`],
    ['Ngày làm:', new Date().toLocaleString('vi-VN')],
    [],
    ['TỔNG KẾT'],
    ['Điểm (10):', Math.round((correct/state.questions.length)*10*10)/10],
    ['Điểm thưởng:', state.score],
    ['Câu đúng:', correct],
    ['Câu sai:', state.answers.length - correct],
    ['Độ chính xác:', accuracy + '%'],
    ['Thời gian:', formatTime(elapsed)],
    ['Chuỗi đúng cao nhất:', state.maxStreak],
  ];

  // Sheet 2: Chi tiết từng câu
  const detailHeader = ['STT','Câu hỏi','Loại','Đáp án học sinh','Đáp án đúng','Kết quả','Điểm'];
  const detailRows = state.answers.map((a, i) => [
    i+1, a.q.question, a.q.type, a.userAnswer, a.correctAnswer,
    a.isCorrect ? '✅ Đúng' : '❌ Sai', a.points
  ]);

  const wb = XLSX.utils.book_new();

  const ws1 = XLSX.utils.aoa_to_sheet(infoData);
  ws1['!cols'] = [{wch:20},{wch:30}];
  XLSX.utils.book_append_sheet(wb, ws1, 'Kết quả');

  const ws2 = XLSX.utils.aoa_to_sheet([detailHeader, ...detailRows]);
  ws2['!cols'] = [{wch:5},{wch:50},{wch:12},{wch:20},{wch:20},{wch:10},{wch:8}];
  XLSX.utils.book_append_sheet(wb, ws2, 'Chi tiết');

  XLSX.writeFile(wb, `KetQua_${state.student.name}_${state.student.class}_Test${state.selectedTest}.xlsx`);
  showToast('✅ Đã xuất file Excel thành công!');
}

// ─── SOUNDS ──────────────────────────────────────────────────
function playSound(type) {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain); gain.connect(ctx.destination);

    if (type === 'correct') {
      osc.frequency.setValueAtTime(523.25, ctx.currentTime);
      osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.1);
      osc.frequency.setValueAtTime(783.99, ctx.currentTime + 0.2);
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.5);
    } else {
      osc.frequency.setValueAtTime(200, ctx.currentTime);
      osc.frequency.setValueAtTime(150, ctx.currentTime + 0.15);
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.35);
    }
  } catch(e) { /* silent fail */ }
}

// ─── CONFETTI ────────────────────────────────────────────────
function launchConfetti() {
  const colors = ['#a78bfa','#f59e0b','#10b981','#3b82f6','#ec4899','#f87171'];
  for (let i = 0; i < 60; i++) {
    setTimeout(() => {
      const el = document.createElement('div');
      el.className = 'confetti-piece';
      el.style.cssText = `
        left:${Math.random()*100}vw;
        top: -20px;
        background:${colors[Math.floor(Math.random()*colors.length)]};
        border-radius:${Math.random()>0.5?'50%':'2px'};
        width:${Math.random()*10+6}px;
        height:${Math.random()*12+6}px;
        animation-delay:0s;
        animation-duration:${Math.random()*1.5+1.5}s;
      `;
      document.body.appendChild(el);
      setTimeout(() => el.remove(), 3000);
    }, i * 40);
  }
}

// ─── UTILS ───────────────────────────────────────────────────
function showScreen(name) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(`screen-${name}`).classList.add('active');
}

function shuffleArray(arr) {
  const a = [...arr];
  for (let i = a.length-1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i+1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function formatTime(s) {
  const m = Math.floor(s/60), sec = s%60;
  return m > 0 ? `${m}p ${sec}s` : `${sec}s`;
}

function showToast(msg) {
  const existing = document.querySelector('.toast');
  if (existing) existing.remove();
  const el = document.createElement('div');
  el.className = 'toast';
  el.textContent = msg;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 3000);
}

function retryTest() {
  state.questions = shuffleArray([...state.questions]);
  state.current = 0;
  state.score = 0;
  state.streak = 0;
  state.maxStreak = 0;
  state.answers = [];
  state.startTime = Date.now();
  showScreen('quiz');
  renderQuestion();
}

function goHome() {
  clearTimer();
  showScreen('welcome');
}