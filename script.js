/**
 * GYMTRACK — script.js
 * App de registro de treinos estilo Netflix
 * 4 usuários: Bryan, Marlon, Ihanael, Vitória
 */

// =============================================
//  CONFIGURAÇÕES GLOBAIS
// =============================================

/** Usuários do app */
const USERS = [
  { id: 'bryan',   name: 'Bryan',   emoji: '💪', gender: 'male',   color: '#E50914', bg: 'linear-gradient(135deg,#1a0000,#3d0000)' },
  { id: 'marlon',  name: 'Marlon',  emoji: '🏋️', gender: 'male',   color: '#F59E0B', bg: 'linear-gradient(135deg,#1a1000,#3d2800)' },
  { id: 'ihanael', name: 'Ihanael', emoji: '⚡', gender: 'male',   color: '#10B981', bg: 'linear-gradient(135deg,#001a0e,#003d20)' },
  { id: 'vitoria', name: 'Vitória', emoji: '🌟', gender: 'female', color: '#EC4899', bg: 'linear-gradient(135deg,#1a0010,#3d0028)' },
];

/** Paleta de cores disponíveis */
const COLORS = [
  { name: 'Netflix Red',    hex: '#E50914' },
  { name: 'Amber',          hex: '#F59E0B' },
  { name: 'Emerald',        hex: '#10B981' },
  { name: 'Pink',           hex: '#EC4899' },
  { name: 'Sky Blue',       hex: '#3B82F6' },
  { name: 'Purple',         hex: '#8B5CF6' },
  { name: 'Orange',         hex: '#F97316' },
  { name: 'Cyan',           hex: '#06B6D4' },
  { name: 'Rose',           hex: '#F43F5E' },
  { name: 'Lime',           hex: '#84CC16' },
];

/** Definição de todas as conquistas */
const ACHIEVEMENTS = {
  geral: [
    { id: 'first_workout',  name: 'Primeiro Treino',   icon: 'fa-baby',          desc: 'Registrou o primeiro treino',           check: (s) => s.totalWorkouts >= 1 },
    { id: 'ten_workouts',   name: '10 Treinos',         icon: 'fa-medal',         desc: '10 treinos registrados no total',        check: (s) => s.totalWorkouts >= 10 },
    { id: 'thirty_workouts',name: '30 Treinos',         icon: 'fa-trophy',        desc: '30 treinos registrados no total',        check: (s) => s.totalWorkouts >= 30 },
    { id: 'week_warrior',   name: 'Guerreiro Semanal',  icon: 'fa-shield-halved', desc: 'Completou a meta semanal',               check: (s) => s.goalWeekCompleted >= 1 },
    { id: '50_points',      name: '50 Halteres',        icon: 'fa-star',          desc: 'Acumulou 50 halteres no mês',            check: (s) => s.monthPoints >= 50 },
    { id: '100_points',     name: '100 Halteres',       icon: 'fa-crown',         desc: 'Acumulou 100 halteres no mês',           check: (s) => s.monthPoints >= 100 },
  ],
  muscle: [
    { id: 'muscle_5',       name: '5x Musculação',     icon: 'fa-dumbbell',      desc: '5 treinos de musculação no mês',         check: (s) => s.monthMuscle >= 5 },
    { id: 'muscle_10',      name: '10x Musculação',    icon: 'fa-dumbbell',      desc: '10 treinos de musculação no mês',        check: (s) => s.monthMuscle >= 10 },
    { id: 'muscle_20',      name: 'Monstro do Ferro',  icon: 'fa-bolt',          desc: '20 treinos de musculação no mês',        check: (s) => s.monthMuscle >= 20 },
  ],
  cardio: [
    { id: 'cardio_5',       name: '5x Cardio',         icon: 'fa-person-running','desc': '5 treinos de cardio no mês',           check: (s) => s.monthCardio >= 5 },
    { id: 'cardio_10',      name: '10x Cardio',        icon: 'fa-person-running','desc': '10 treinos de cardio no mês',          check: (s) => s.monthCardio >= 10 },
    { id: 'cardio_sprint',  name: 'Velocista',         icon: 'fa-wind',          desc: '15 treinos de cardio no mês',            check: (s) => s.monthCardio >= 15 },
  ],
};

// =============================================
//  UTILITÁRIOS DE DATA
// =============================================

/** Retorna a data de hoje no formato YYYY-MM-DD */
function today() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

/** Retorna chave YYYY-MM do mês atual */
function currentMonth() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
}

/** Retorna chave YYYY-MM do mês anterior */
function prevMonth() {
  const d = new Date();
  d.setMonth(d.getMonth() - 1);
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
}

/** Número da semana ISO do ano */
function isoWeek(dateStr) {
  const d = new Date(dateStr + 'T00:00:00');
  d.setHours(0,0,0,0);
  d.setDate(d.getDate() + 3 - (d.getDay()+6)%7);
  const week1 = new Date(d.getFullYear(), 0, 4);
  return 1 + Math.round(((d - week1) / 86400000 - 3 + (week1.getDay()+6)%7) / 7);
}

/** Chave da semana atual: YYYY-Wnn */
function currentWeekKey() {
  const t = today();
  return `${t.substring(0,4)}-W${String(isoWeek(t)).padStart(2,'0')}`;
}

/** Saudação baseada no horário */
function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Bom dia';
  if (h < 18) return 'Boa tarde';
  return 'Boa noite';
}

/** Nome dos meses em pt-BR */
const MONTHS_PT = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];

// =============================================
//  GERENCIAMENTO DE DADOS (localStorage)
// =============================================

const Storage = {
  get(key, fallback = null) {
    try {
      const v = localStorage.getItem(key);
      return v !== null ? JSON.parse(v) : fallback;
    } catch { return fallback; }
  },
  set(key, val) {
    try { localStorage.setItem(key, JSON.stringify(val)); } catch {}
  },

  /** Retorna dados do usuário */
  getUserData(uid) {
    return this.get(`gymtrack_user_${uid}`, {
      color: USERS.find(u => u.id === uid)?.color || '#E50914',
      goal: { muscle: 3, cardio: 2 },
      records: {},         // { 'YYYY-MM-DD': { muscle: bool, cardio: bool } }
      achievements: [],    // array de IDs desbloqueados
      goalWeekCompleted: 0,
      totalWorkouts: 0,
    });
  },

  saveUserData(uid, data) {
    this.set(`gymtrack_user_${uid}`, data);
  },
};

// =============================================
//  APLICAÇÃO PRINCIPAL
// =============================================

const App = {
  currentUser: null,  // objeto USERS
  userData: null,     // dados do localStorage

  // ---- INICIALIZAÇÃO ----
  init() {
    this.renderLoginScreen();
    this.checkMonthReset();
  },

  /** Verifica se deve resetar pontos mensais */
  checkMonthReset() {
    const month = currentMonth();
    const lastMonth = Storage.get('gymtrack_last_month', '');
    if (lastMonth && lastMonth !== month) {
      // Salvar fechamento do mês anterior para todos os usuários
      USERS.forEach(u => {
        const data = Storage.getUserData(u.id);
        this.saveMonthClose(u.id, data, lastMonth);
      });
    }
    Storage.set('gymtrack_last_month', month);
  },

  /** Salva histórico do mês que fechou */
  saveMonthClose(uid, data, monthKey) {
    const history = Storage.get(`gymtrack_history_${uid}`, {});
    const records = data.records || {};
    let muscle = 0, cardio = 0;
    Object.entries(records).forEach(([date, v]) => {
      if (date.startsWith(monthKey)) {
        if (v.muscle) muscle++;
        if (v.cardio) cardio++;
      }
    });
    history[monthKey] = { muscle, cardio, points: (muscle + cardio) * 5 };
    Storage.set(`gymtrack_history_${uid}`, history);
  },

  // ---- TELA LOGIN ----
  renderLoginScreen() {
    const grid = document.querySelector('.profiles-grid');
    grid.innerHTML = '';
    USERS.forEach(user => {
      const userData = Storage.getUserData(user.id);
      const color = userData.color || user.color;
      const card = document.createElement('div');
      card.className = 'profile-card';
      card.dataset.userId = user.id;
      card.onclick = () => this.selectUser(user, card);
      card.innerHTML = `
        <div class="profile-avatar-ring" style="border-color:${color}30" data-ring>
          <div class="profile-avatar-inner" style="background:${user.bg}">${user.emoji}</div>
        </div>
        <span class="profile-card-name">${user.name}</span>
      `;
      grid.appendChild(card);
    });
  },

  // ---- SELECIONAR USUÁRIO (transição por fade) ----
  selectUser(user, cardEl) {
    if (this._transitioning) return;
    this._transitioning = true;

    this.currentUser = user;
    this.userData = Storage.getUserData(user.id);
    const color = this.userData.color || user.color;
    this.applyAccentColor(color);

    // Pré-renderiza o dashboard (invisível ainda)
    this.renderDashboard();

    const loginScreen = document.getElementById('screen-login');
    const dashScreen  = document.getElementById('screen-dashboard');

    // Fade-out da tela de login
    loginScreen.classList.add('fading-out');

    setTimeout(() => {
      loginScreen.classList.remove('active', 'fading-out');
      dashScreen.classList.add('active', 'entering');

      dashScreen.addEventListener('animationend', () => {
        dashScreen.classList.remove('entering');
        this._transitioning = false;
      }, { once: true });
    }, 350);
  },

  /** Aplica cor de destaque via CSS variable */
  applyAccentColor(hex) {
    document.documentElement.style.setProperty('--accent', hex);
    // Gerar versão mais escura para hover
    document.documentElement.style.setProperty('--accent-dark', this.darkenColor(hex, 20));
    document.documentElement.style.setProperty('--accent-glow', this.hexToRgba(hex, 0.35));
  },

  darkenColor(hex, pct) {
    let r = parseInt(hex.slice(1,3),16), g = parseInt(hex.slice(3,5),16), b = parseInt(hex.slice(5,7),16);
    r = Math.max(0, Math.floor(r*(1-pct/100)));
    g = Math.max(0, Math.floor(g*(1-pct/100)));
    b = Math.max(0, Math.floor(b*(1-pct/100)));
    return `#${r.toString(16).padStart(2,'0')}${g.toString(16).padStart(2,'0')}${b.toString(16).padStart(2,'0')}`;
  },

  hexToRgba(hex, a) {
    const r = parseInt(hex.slice(1,3),16), g = parseInt(hex.slice(3,5),16), b = parseInt(hex.slice(5,7),16);
    return `rgba(${r},${g},${b},${a})`;
  },

  // ---- DASHBOARD ----
  renderDashboard() {
    const u = this.currentUser;
    const d = this.userData;
    const todayKey = today();

    // Header
    document.getElementById('header-avatar').textContent = u.emoji;
    document.getElementById('header-greeting').textContent = `${greeting()},`;
    document.getElementById('header-username').textContent = u.name;
    document.getElementById('header-points').textContent = this.getMonthPoints();

    // Data label
    const dateLabel = new Date(todayKey + 'T00:00:00');
    const options = { weekday: 'long', day: 'numeric', month: 'long' };
    document.getElementById('today-date-label').textContent =
      dateLabel.toLocaleDateString('pt-BR', options).replace(',','');

    // Botões de registro
    this.updateRegisterButtons();
    // Semana
    this.updateWeekStats();
    // Calendário
    this.renderCalendar();
    // Conquistas
    this.renderAchievementsBadges();
  },

  /** Pontos do mês atual */
  getMonthPoints() {
    const month = currentMonth();
    const records = this.userData.records || {};
    let pts = 0;
    Object.entries(records).forEach(([date, v]) => {
      if (date.startsWith(month)) {
        if (v.muscle) pts += 5;
        if (v.cardio) pts += 5;
      }
    });
    return pts;
  },

  /** Atualiza visual dos botões de registro */
  updateRegisterButtons() {
    const todayKey = today();
    const rec = (this.userData.records || {})[todayKey] || {};

    ['muscle', 'cardio'].forEach(type => {
      const done = rec[type] === true;
      const btn = document.getElementById(`btn-${type}`);
      const status = document.getElementById(`status-${type}`);
      const check = document.getElementById(`check-${type}`);

      if (done) {
        btn.classList.add('done');
        btn.disabled = true;
        status.textContent = 'Registrado hoje ✓';
        check.style.opacity = '1';
        check.style.transform = 'scale(1)';
      } else {
        btn.classList.remove('done');
        btn.disabled = false;
        status.textContent = 'Disponível hoje';
        check.style.opacity = '0';
        check.style.transform = 'scale(0.5)';
      }
    });
  },

  /** Atualiza estatísticas semanais */
  updateWeekStats() {
    const weekKey = currentWeekKey();
    const records = this.userData.records || {};
    let muscle = 0, cardio = 0;

    Object.entries(records).forEach(([date, v]) => {
      const wk = `${date.substring(0,4)}-W${String(isoWeek(date)).padStart(2,'0')}`;
      if (wk === weekKey) {
        if (v.muscle) muscle++;
        if (v.cardio) cardio++;
      }
    });

    const points = (muscle + cardio) * 5;
    document.getElementById('week-muscle').textContent = muscle;
    document.getElementById('week-cardio').textContent = cardio;
    document.getElementById('week-points').textContent = points;

    // Meta progress
    const goal = this.userData.goal || { muscle: 3, cardio: 2 };
    const totalGoal = goal.muscle + goal.cardio;
    const totalDone = muscle + cardio;
    const pct = totalGoal > 0 ? Math.min(100, Math.round((totalDone / totalGoal) * 100)) : 0;
    document.getElementById('goal-progress-text').textContent = `${totalDone} / ${totalGoal} treinos`;
    document.getElementById('progress-bar-fill').style.width = `${pct}%`;

    // Verifica se completou meta semanal
    if (totalDone >= totalGoal && totalGoal > 0) {
      const weekGoalKey = `gymtrack_weekgoal_${this.currentUser.id}_${weekKey}`;
      if (!Storage.get(weekGoalKey, false)) {
        Storage.set(weekGoalKey, true);
        this.userData.goalWeekCompleted = (this.userData.goalWeekCompleted || 0) + 1;
        Storage.saveUserData(this.currentUser.id, this.userData);
        this.showToast('🏆 Meta semanal concluída!', 'info');
      }
    }
  },

  /** Renderiza calendário do mês */
  renderCalendar() {
    const cal = document.getElementById('month-calendar');
    const records = this.userData.records || {};
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDay = new Date(year, month, 1).getDay(); // 0=Dom
    const todayNum = now.getDate();

    // Header dos dias
    const weekdays = ['D','S','T','Q','Q','S','S'];
    let html = '<div class="cal-header">';
    weekdays.forEach(d => { html += `<div class="cal-weekday">${d}</div>`; });
    html += '</div><div class="cal-days">';

    // Células vazias antes do dia 1
    for (let i = 0; i < firstDay; i++) {
      html += '<div class="cal-day empty"></div>';
    }

    // Dias do mês
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${year}-${String(month+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
      const rec = records[dateStr] || {};
      let cls = 'cal-day';
      if (day === todayNum) cls += ' today';
      if (rec.muscle && rec.cardio) cls += ' has-both';
      else if (rec.muscle) cls += ' has-muscle';
      else if (rec.cardio) cls += ' has-cardio';

      let dots = '';
      if (rec.muscle || rec.cardio) {
        dots = '<div class="cal-day-dots">';
        if (rec.muscle) dots += '<div class="dot dot-muscle"></div>';
        if (rec.cardio) dots += '<div class="dot dot-cardio"></div>';
        dots += '</div>';
      }
      html += `<div class="${cls}">${day}${dots}</div>`;
    }

    html += '</div>';
    cal.innerHTML = html;
  },

  /** Renderiza badges de conquistas no dashboard */
  renderAchievementsBadges() {
    const container = document.getElementById('achievements-list');
    const unlocked = this.userData.achievements || [];
    const allAch = [...ACHIEVEMENTS.geral, ...ACHIEVEMENTS.muscle, ...ACHIEVEMENTS.cardio];
    const unlockedList = allAch.filter(a => unlocked.includes(a.id));

    if (unlockedList.length === 0) {
      container.innerHTML = '<span class="no-achievements">Nenhuma conquista ainda. Comece a treinar! 💪</span>';
      return;
    }
    container.innerHTML = unlockedList.map(a => `
      <div class="achievement-badge unlocked">
        <i class="fa-solid ${a.icon} ach-icon"></i>
        <span>${a.name}</span>
      </div>
    `).join('');
  },

  // ---- REGISTRAR TREINO ----
  registerWorkout(type) {
    const todayKey = today();
    const records = this.userData.records || {};
    if (!records[todayKey]) records[todayKey] = {};

    if (records[todayKey][type]) {
      this.showToast('Já registrado hoje!', 'error');
      return;
    }

    records[todayKey][type] = true;
    this.userData.records = records;

    // Incrementa total
    this.userData.totalWorkouts = (this.userData.totalWorkouts || 0) + 1;

    // Salvar
    Storage.saveUserData(this.currentUser.id, this.userData);

    // Verificar conquistas
    this.checkAchievements();

    // Atualizar UI
    this.updateRegisterButtons();
    this.updateWeekStats();
    this.renderCalendar();
    this.renderAchievementsBadges();

    // Atualizar pontos no header
    document.getElementById('header-points').textContent = this.getMonthPoints();

    // Animação de pontos
    this.animatePoints();

    const typeLabel = type === 'muscle' ? 'Musculação' : 'Cardio';
    this.showToast(`+5 Halteres! ${typeLabel} registrado! 🎉`, 'success');
  },

  /** Animação de pulsação dos pontos no header */
  animatePoints() {
    const badge = document.getElementById('header-points-badge');
    badge.style.transform = 'scale(1.2)';
    badge.style.transition = 'transform 0.2s';
    setTimeout(() => {
      badge.style.transform = 'scale(1)';
    }, 200);
  },

  // ---- CONQUISTAS ----
  checkAchievements() {
    const d = this.userData;
    const month = currentMonth();
    const records = d.records || {};
    const unlocked = new Set(d.achievements || []);

    // Calcular stats
    let monthMuscle = 0, monthCardio = 0;
    Object.entries(records).forEach(([date, v]) => {
      if (date.startsWith(month)) {
        if (v.muscle) monthMuscle++;
        if (v.cardio) monthCardio++;
      }
    });
    const monthPoints = (monthMuscle + monthCardio) * 5;

    const stats = {
      totalWorkouts: d.totalWorkouts || 0,
      monthMuscle,
      monthCardio,
      monthPoints,
      goalWeekCompleted: d.goalWeekCompleted || 0,
    };

    const allAch = [...ACHIEVEMENTS.geral, ...ACHIEVEMENTS.muscle, ...ACHIEVEMENTS.cardio];
    let newOnes = [];

    allAch.forEach(a => {
      if (!unlocked.has(a.id) && a.check(stats)) {
        unlocked.add(a.id);
        newOnes.push(a);
      }
    });

    if (newOnes.length > 0) {
      this.userData.achievements = Array.from(unlocked);
      Storage.saveUserData(this.currentUser.id, this.userData);
      // Notificar conquistas novas (uma por uma com delay)
      newOnes.forEach((a, i) => {
        setTimeout(() => {
          this.showToast(`🏆 Conquista desbloqueada: ${a.name}!`, 'info');
        }, i * 1800);
      });
    }
  },

  // ---- LOGOUT (volta ao login com fade) ----
  logout() {
    const dashScreen  = document.getElementById('screen-dashboard');
    const loginScreen = document.getElementById('screen-login');

    // Fade out do dashboard
    dashScreen.style.transition = 'opacity 0.3s ease';
    dashScreen.style.opacity = '0';

    setTimeout(() => {
      dashScreen.style.transition = '';
      dashScreen.style.opacity = '';
      dashScreen.classList.remove('active');

      // Restaura tela de login
      this._resetLoginScreen();
      loginScreen.classList.add('active');
      loginScreen.style.animation = 'fadeIn 0.35s ease';

      this.currentUser = null;
      this.userData = null;
      this.applyAccentColor('#E50914');
      window.scrollTo(0, 0);
    }, 300);
  },

  /** Restaura todos os elementos do login ao estado original */
  _resetLoginScreen() {
    const loginLogo  = document.getElementById('login-logo');
    const loginTitle = document.getElementById('login-title');

    // Remove estilos inline aplicados na animação de saída
    loginLogo.removeAttribute('style');
    loginTitle.removeAttribute('style');

    // Re-renderiza os cards limpos
    this.renderLoginScreen();
  },

  // ---- PERFIL ----
  goToProfile() {
    const u = this.currentUser;
    const d = this.userData;
    const month = currentMonth();
    const records = d.records || {};

    // Avatar e nome
    document.getElementById('profile-avatar-big').textContent = u.emoji;
    document.getElementById('profile-name-big').textContent = u.name;

    const goal = d.goal || { muscle: 3, cardio: 2 };
    document.getElementById('profile-meta-summary').textContent =
      `Meta: ${goal.muscle}x Musculação + ${goal.cardio}x Cardio por semana`;

    // Totais do mês
    let monthMuscle = 0, monthCardio = 0;
    Object.entries(records).forEach(([date, v]) => {
      if (date.startsWith(month)) {
        if (v.muscle) monthMuscle++;
        if (v.cardio) monthCardio++;
      }
    });
    const monthTotal = monthMuscle + monthCardio;
    document.getElementById('profile-total-points').textContent = this.getMonthPoints();
    document.getElementById('profile-total-workouts').textContent = monthTotal;

    // Renderizar conquistas por categoria
    this.renderAchievementsCategory('ach-geral', ACHIEVEMENTS.geral);
    this.renderAchievementsCategory('ach-muscle', ACHIEVEMENTS.muscle);
    this.renderAchievementsCategory('ach-cardio', ACHIEVEMENTS.cardio);

    this.showScreen('profile');
  },

  renderAchievementsCategory(containerId, achList) {
    const container = document.getElementById(containerId);
    const unlocked = new Set(this.userData.achievements || []);
    container.innerHTML = achList.map(a => `
      <div class="ach-card ${unlocked.has(a.id) ? 'unlocked' : 'locked'}" title="${a.desc}">
        <i class="fa-solid ${a.icon} ach-card-icon"></i>
        <span class="ach-card-name">${a.name}</span>
      </div>
    `).join('');
  },

  closeProfile() { this.showScreen('dashboard'); },

  // ---- CONFIGURAÇÕES ----
  openSettings() {
    const d = this.userData;
    const goal = d.goal || { muscle: 3, cardio: 2 };
    document.getElementById('goal-muscle-val').textContent = goal.muscle;
    document.getElementById('goal-cardio-val').textContent = goal.cardio;
    this.renderColorPicker();
    this.showScreen('settings');
  },

  closeSettings() { this.showScreen('dashboard'); },

  toggleSettingsGroup(name) {
    const body = document.getElementById(`group-${name}`);
    const chevron = document.getElementById(`chevron-${name}`);
    body.classList.toggle('open');
    chevron.classList.toggle('open');
  },

  changeGoal(type, delta) {
    const el = document.getElementById(`goal-${type}-val`);
    let val = parseInt(el.textContent) + delta;
    val = Math.max(0, Math.min(7, val));
    el.textContent = val;
  },

  saveGoal() {
    const muscle = parseInt(document.getElementById('goal-muscle-val').textContent);
    const cardio = parseInt(document.getElementById('goal-cardio-val').textContent);
    this.userData.goal = { muscle, cardio };
    Storage.saveUserData(this.currentUser.id, this.userData);
    this.showToast('Meta salva com sucesso!', 'success');
    this.updateWeekStats();
  },

  renderColorPicker() {
    const grid = document.getElementById('color-picker-grid');
    const currentColor = this.userData.color || this.currentUser.color;
    grid.innerHTML = COLORS.map(c => `
      <div class="color-swatch ${c.hex === currentColor ? 'selected' : ''}"
           style="background:${c.hex}"
           title="${c.name}"
           onclick="App.selectColor('${c.hex}')">
      </div>
    `).join('');
  },

  selectColor(hex) {
    this.userData.color = hex;
    Storage.saveUserData(this.currentUser.id, this.userData);
    this.applyAccentColor(hex);
    this.renderColorPicker();
    this.showToast('Cor do perfil atualizada!', 'success');
  },

  confirmResetData() {
    if (confirm(`Tem certeza que deseja resetar TODOS os dados de ${this.currentUser.name}? Esta ação não pode ser desfeita.`)) {
      localStorage.removeItem(`gymtrack_user_${this.currentUser.id}`);
      this.userData = Storage.getUserData(this.currentUser.id);
      this.applyAccentColor(this.currentUser.color);
      this.showToast('Dados resetados.', 'info');
      this.closeSettings();
      this.renderDashboard();
    }
  },

  // ---- FECHAMENTO DO MÊS ----
  openMonthClose() {
    const pMonth = prevMonth();
    const history = Storage.get(`gymtrack_history_${this.currentUser.id}`, {});
    const monthData = history[pMonth];

    const content = document.getElementById('modal-month-content');

    if (!monthData) {
      content.innerHTML = `<p class="modal-empty">Sem dados do mês anterior ainda.<br>Continue treinando este mês! 🎯</p>`;
    } else {
      const [year, m] = pMonth.split('-');
      const monthName = MONTHS_PT[parseInt(m) - 1];

      // Calcular semanas do mês anterior para o mini gráfico
      const records = this.userData.records || {};
      const weekData = {};
      Object.entries(records).forEach(([date, v]) => {
        if (date.startsWith(pMonth)) {
          const wk = isoWeek(date);
          if (!weekData[wk]) weekData[wk] = { muscle: 0, cardio: 0 };
          if (v.muscle) weekData[wk].muscle++;
          if (v.cardio) weekData[wk].cardio++;
        }
      });
      const maxVal = Math.max(...Object.values(weekData).flatMap(w => [w.muscle, w.cardio]), 1);

      let weekBars = Object.entries(weekData).map(([wk, v]) => `
        <div class="bar-row">
          <span class="bar-label">S${wk}</span>
          <div style="flex:1;display:flex;flex-direction:column;gap:4px">
            <div class="bar-track"><div class="bar-fill muscle" style="width:${Math.round((v.muscle/maxVal)*100)}%"></div></div>
            <div class="bar-track"><div class="bar-fill cardio" style="width:${Math.round((v.cardio/maxVal)*100)}%"></div></div>
          </div>
          <span class="bar-val">${v.muscle+v.cardio}</span>
        </div>
      `).join('') || '<p class="modal-empty">Sem dados por semana.</p>';

      content.innerHTML = `
        <h4 style="color:var(--text-secondary);font-size:0.85rem;font-weight:500;">${monthName} ${year}</h4>
        <div class="month-stats-row">
          <div class="month-stat-box">
            <div class="month-stat-num">${monthData.muscle}</div>
            <div class="month-stat-label"><i class="fa-solid fa-dumbbell"></i> Musculação</div>
          </div>
          <div class="month-stat-box">
            <div class="month-stat-num">${monthData.cardio}</div>
            <div class="month-stat-label"><i class="fa-solid fa-person-running"></i> Cardio</div>
          </div>
          <div class="month-stat-box">
            <div class="month-stat-num" style="color:var(--accent)">${monthData.points}</div>
            <div class="month-stat-label"><i class="fa-solid fa-dumbbell"></i> Halteres</div>
          </div>
        </div>
        <div>
          <p style="font-size:0.8rem;color:var(--text-secondary);margin-bottom:12px;display:flex;gap:16px;align-items:center;">
            <span><span style="display:inline-block;width:10px;height:10px;border-radius:2px;background:var(--accent);margin-right:4px"></span>Musculação</span>
            <span><span style="display:inline-block;width:10px;height:10px;border-radius:2px;background:#3b82f6;margin-right:4px"></span>Cardio</span>
          </p>
          <div class="bar-chart">${weekBars}</div>
        </div>
      `;
    }

    document.getElementById('modal-month-close').classList.add('active');
  },

  closeMonthClose() {
    document.getElementById('modal-month-close').classList.remove('active');
  },

  // ---- NAVEGAÇÃO ENTRE TELAS (sub-telas internas) ----
  showScreen(name) {
    // login e dashboard têm transições próprias; este método serve para as sub-telas
    const targets = ['profile', 'settings'];
    document.querySelectorAll('.screen').forEach(s => {
      const id = s.id.replace('screen-', '');
      if (targets.includes(id)) s.classList.remove('active');
    });

    if (name === 'dashboard') {
      // Voltar ao dashboard a partir de sub-telas
      document.getElementById('screen-profile')?.classList.remove('active');
      document.getElementById('screen-settings')?.classList.remove('active');
      document.getElementById('screen-dashboard').classList.add('active');
    } else if (name === 'profile' || name === 'settings') {
      document.getElementById('screen-dashboard').classList.remove('active');
      document.getElementById(`screen-${name}`).classList.add('active');
    }
    window.scrollTo(0, 0);
  },

  // ---- TOAST ----
  showToast(message, type = 'info') {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.className = `toast ${type}`;
    // Forçar reflow para reiniciar animação
    void toast.offsetWidth;
    toast.classList.add('show');
    clearTimeout(this._toastTimer);
    this._toastTimer = setTimeout(() => {
      toast.classList.remove('show');
    }, 2800);
  },
};

// =============================================
//  FECHAR MODAL CLICANDO NO OVERLAY
// =============================================
document.getElementById('modal-month-close').addEventListener('click', function(e) {
  if (e.target === this) App.closeMonthClose();
});

// =============================================
//  INICIALIZAR APP
// =============================================
document.addEventListener('DOMContentLoaded', () => App.init());
