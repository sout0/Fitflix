/**
 * FITFLIX — script.js
 * Refatorado para Supabase como banco de dados na nuvem.
 *
 * Tabelas esperadas no Supabase:
 *
 * usuarios (
 *   id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 *   nome          text NOT NULL,
 *   cor_preferida text DEFAULT '#E50914',
 *   meta_muscle   int  DEFAULT 3,
 *   meta_cardio   int  DEFAULT 2
 * )
 *
 * treinos (
 *   id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 *   usuario_id  uuid REFERENCES usuarios(id),
 *   tipo        text NOT NULL,   -- 'musculacao' | 'cardio'
 *   data        date NOT NULL,
 *   pontos      int  DEFAULT 5,
 *   created_at  timestamptz DEFAULT now()
 * )
 *
 * conquistas (
 *   id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 *   usuario_id  uuid REFERENCES usuarios(id),
 *   conquista_id text NOT NULL
 * )
 */

// =============================================
//  SUPABASE — inicialização
// =============================================

const SUPABASE_URL = 'https://cukybwacmquyznvnvcyj.supabase.co';
const SUPABASE_KEY = 'sb_publishable_07NMVTFnnpa-t-xMw7sFfw_k31UaiIg';
const db = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// =============================================
//  CONFIGURAÇÕES GLOBAIS
// =============================================

/** Usuários fixos do app — mapeados para os registros da tabela `usuarios` */
const USERS = [
  { localId: 'bryan',   name: 'Bryan',   emoji: '💪', color: '#E50914', bg: 'linear-gradient(135deg,#1a0000,#3d0000)' },
  { localId: 'marlon',  name: 'Marlon',  emoji: '🏋️', color: '#F59E0B', bg: 'linear-gradient(135deg,#1a1000,#3d2800)' },
  { localId: 'ihanael', name: 'Ihanael', emoji: '⚡', color: '#10B981', bg: 'linear-gradient(135deg,#001a0e,#003d20)' },
  { localId: 'vitoria', name: 'Vitória', emoji: '🌟', color: '#EC4899', bg: 'linear-gradient(135deg,#1a0010,#3d0028)' },
];

const COLORS = [
  { name: 'Netflix Red', hex: '#E50914' },
  { name: 'Amber',       hex: '#F59E0B' },
  { name: 'Emerald',     hex: '#10B981' },
  { name: 'Pink',        hex: '#EC4899' },
  { name: 'Sky Blue',    hex: '#3B82F6' },
  { name: 'Purple',      hex: '#8B5CF6' },
  { name: 'Orange',      hex: '#F97316' },
  { name: 'Cyan',        hex: '#06B6D4' },
  { name: 'Rose',        hex: '#F43F5E' },
  { name: 'Lime',        hex: '#84CC16' },
];

const ACHIEVEMENTS = {
  geral: [
    { id: 'first_workout',   name: 'Primeiro Treino',  icon: 'fa-baby',          desc: 'Registrou o primeiro treino',         check: (s) => s.totalWorkouts >= 1 },
    { id: 'ten_workouts',    name: '10 Treinos',        icon: 'fa-medal',         desc: '10 treinos registrados no total',     check: (s) => s.totalWorkouts >= 10 },
    { id: 'thirty_workouts', name: '30 Treinos',        icon: 'fa-trophy',        desc: '30 treinos registrados no total',     check: (s) => s.totalWorkouts >= 30 },
    { id: 'week_warrior',    name: 'Guerreiro Semanal', icon: 'fa-shield-halved', desc: 'Completou a meta semanal',            check: (s) => s.goalWeekCompleted >= 1 },
    { id: '50_points',       name: '50 Halteres',       icon: 'fa-star',          desc: 'Acumulou 50 halteres no mês',         check: (s) => s.monthPoints >= 50 },
    { id: '100_points',      name: '100 Halteres',      icon: 'fa-crown',         desc: 'Acumulou 100 halteres no mês',        check: (s) => s.monthPoints >= 100 },
  ],
  muscle: [
    { id: 'muscle_5',  name: '5x Musculação',   icon: 'fa-dumbbell', desc: '5 treinos de musculação no mês',  check: (s) => s.monthMuscle >= 5 },
    { id: 'muscle_10', name: '10x Musculação',  icon: 'fa-dumbbell', desc: '10 treinos de musculação no mês', check: (s) => s.monthMuscle >= 10 },
    { id: 'muscle_20', name: 'Monstro do Ferro',icon: 'fa-bolt',     desc: '20 treinos de musculação no mês', check: (s) => s.monthMuscle >= 20 },
  ],
  cardio: [
    { id: 'cardio_5',      name: '5x Cardio',  icon: 'fa-person-running', desc: '5 treinos de cardio no mês',  check: (s) => s.monthCardio >= 5 },
    { id: 'cardio_10',     name: '10x Cardio', icon: 'fa-person-running', desc: '10 treinos de cardio no mês', check: (s) => s.monthCardio >= 10 },
    { id: 'cardio_sprint', name: 'Velocista',  icon: 'fa-wind',           desc: '15 treinos de cardio no mês', check: (s) => s.monthCardio >= 15 },
  ],
};

// =============================================
//  UTILITÁRIOS DE DATA
// =============================================

function today() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

function currentMonth() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
}

function prevMonth() {
  const d = new Date();
  d.setMonth(d.getMonth() - 1);
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
}

function isoWeek(dateStr) {
  const d = new Date(dateStr + 'T00:00:00');
  d.setHours(0,0,0,0);
  d.setDate(d.getDate() + 3 - (d.getDay()+6)%7);
  const week1 = new Date(d.getFullYear(), 0, 4);
  return 1 + Math.round(((d - week1) / 86400000 - 3 + (week1.getDay()+6)%7) / 7);
}

function currentWeekKey() {
  const t = today();
  return `${t.substring(0,4)}-W${String(isoWeek(t)).padStart(2,'0')}`;
}

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Bom dia';
  if (h < 18) return 'Boa tarde';
  return 'Boa noite';
}

const MONTHS_PT = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];

// =============================================
//  CACHE LOCAL (sessão) — evita múltiplas
//  consultas ao Supabase a cada render
// =============================================

const Cache = {
  // Lista de treinos do mês atual do usuário
  // [{ tipo, data, pontos }]
  workouts: [],

  // Conquistas já desbloqueadas
  // Set<string>
  achievements: new Set(),

  // Meta da semana já registrada (evitar toast duplo)
  weekGoalNotified: false,

  clear() {
    this.workouts = [];
    this.achievements = new Set();
    this.weekGoalNotified = false;
  },
};

// =============================================
//  APLICAÇÃO PRINCIPAL
// =============================================

const App = {
  currentUser: null,   // objeto USERS enriquecido com { dbId, cor_preferida, meta_muscle, meta_cardio }
  _transitioning: false,

  // ---- INICIALIZAÇÃO ----
  init() {
    this.renderLoginScreen();
    document.getElementById('modal-month-close')
      .addEventListener('click', function(e) {
        if (e.target === this) App.closeMonthClose();
      });
  },

  // ---- TELA DE LOGIN ----
  renderLoginScreen() {
    const grid = document.getElementById('profiles-grid');
    grid.innerHTML = '';
    USERS.forEach(user => {
      const card = document.createElement('div');
      card.className = 'profile-card';
      card.onclick = () => this.selectUser(user, card);
      card.innerHTML = `
        <div class="profile-avatar-ring" style="border-color:${user.color}30">
          <div class="profile-avatar-inner" style="background:${user.bg}">${user.emoji}</div>
        </div>
        <span class="profile-card-name">${user.name}</span>
      `;
      grid.appendChild(card);
    });
  },

  // ---- SELECIONAR USUÁRIO ----
  async selectUser(userLocal, cardEl) {
    if (this._transitioning) return;
    this._transitioning = true;

    // Feedback visual imediato no card
    cardEl.style.opacity = '0.6';
    cardEl.style.pointerEvents = 'none';

    try {
      // Busca o registro do usuário no Supabase
      const { data, error } = await db
        .from('usuarios')
        .select('id, nome, cor_preferida, meta_muscle, meta_cardio')
        .ilike('nome', userLocal.name)
        .single();

      if (error || !data) {
        throw new Error(error?.message || 'Usuário não encontrado na tabela `usuarios`.');
      }

      // Monta o objeto completo do usuário atual
      this.currentUser = {
        ...userLocal,
        dbId:          data.id,
        cor_preferida: data.cor_preferida || userLocal.color,
        meta_muscle:   data.meta_muscle   ?? 3,
        meta_cardio:   data.meta_cardio   ?? 2,
      };

      this.applyAccentColor(this.currentUser.cor_preferida);

      // Limpa cache e carrega dados do Supabase
      Cache.clear();
      await this.loadWorkoutsFromDB();
      await this.loadAchievementsFromDB();

      // Renderiza o dashboard com os dados carregados
      this.renderDashboard();

      // Transição: fade-out login → fade-in dashboard
      const loginScreen = document.getElementById('screen-login');
      const dashScreen  = document.getElementById('screen-dashboard');

      loginScreen.style.transition = 'opacity 0.35s ease';
      loginScreen.style.opacity    = '0';
      loginScreen.style.pointerEvents = 'none';

      setTimeout(() => {
        loginScreen.style.transition    = '';
        loginScreen.style.opacity       = '';
        loginScreen.style.pointerEvents = '';
        loginScreen.classList.remove('active');

        dashScreen.style.opacity = '0';
        dashScreen.scrollTop = 0;
        dashScreen.classList.add('active');
        void dashScreen.offsetHeight;
        dashScreen.style.transition = 'opacity 0.4s ease';
        dashScreen.style.opacity    = '1';

        setTimeout(() => {
          dashScreen.style.transition = '';
          this._transitioning = false;
        }, 420);
      }, 360);

    } catch (err) {
      console.error('Erro ao carregar usuário:', err);
      this.showToast('Erro ao conectar. Verifique o console.', 'error');
      cardEl.style.opacity = '';
      cardEl.style.pointerEvents = '';
      this._transitioning = false;
    }
  },

  // ---- CARGA DE DADOS DO SUPABASE ----

  /** Carrega todos os treinos do usuário (sem limite de data) para o cache */
  async loadWorkoutsFromDB() {
    const { data, error } = await db
      .from('treinos')
      .select('tipo, data, pontos')
      .eq('usuario_id', this.currentUser.dbId)
      .order('data', { ascending: false });

    if (error) {
      console.error('Erro ao carregar treinos:', error);
      Cache.workouts = [];
    } else {
      Cache.workouts = data || [];
    }
  },

  /** Carrega conquistas desbloqueadas do usuário */
  async loadAchievementsFromDB() {
    const { data, error } = await db
      .from('conquistas')
      .select('conquista_id')
      .eq('usuario_id', this.currentUser.dbId);

    if (error) {
      console.error('Erro ao carregar conquistas:', error);
    } else {
      Cache.achievements = new Set((data || []).map(r => r.conquista_id));
    }
  },

  // ---- HELPERS DE DADOS (a partir do cache) ----

  /** Retorna treinos do mês indicado (YYYY-MM) */
  _workoutsOfMonth(monthKey) {
    return Cache.workouts.filter(w => w.data.startsWith(monthKey));
  },

  /** Retorna treinos de hoje */
  _workoutsOfToday() {
    return Cache.workouts.filter(w => w.data === today());
  },

  /** Conta musculação e cardio num array de treinos */
  _countTypes(list) {
    const muscle = list.filter(w => w.tipo === 'musculacao').length;
    const cardio  = list.filter(w => w.tipo === 'cardio').length;
    return { muscle, cardio };
  },

  /** Pontos do mês atual */
  getMonthPoints() {
    return this._workoutsOfMonth(currentMonth())
      .reduce((sum, w) => sum + (w.pontos || 5), 0);
  },

  // ---- DASHBOARD ----
  renderDashboard() {
    const u = this.currentUser;

    document.getElementById('header-avatar').textContent  = u.emoji;
    document.getElementById('header-greeting').textContent = `${greeting()},`;
    document.getElementById('header-username').textContent = u.name;
    document.getElementById('header-points').textContent   = this.getMonthPoints();

    const dateLabel = new Date(today() + 'T00:00:00');
    document.getElementById('today-date-label').textContent =
      dateLabel.toLocaleDateString('pt-BR', { weekday:'long', day:'numeric', month:'long' }).replace(',','');

    this.updateRegisterButtons();
    this.updateWeekStats();
    this.renderCalendar();
    this.renderAchievementsBadges();
  },

  /** Atualiza visual dos botões de registro com base no cache */
  updateRegisterButtons() {
    const todayWorkouts = this._workoutsOfToday();
    const hasMuscle = todayWorkouts.some(w => w.tipo === 'musculacao');
    const hasCardio  = todayWorkouts.some(w => w.tipo === 'cardio');

    const map = { musculacao: { key: 'muscle', done: hasMuscle }, cardio: { key: 'cardio', done: hasCardio } };

    Object.values(map).forEach(({ key, done }) => {
      const btn    = document.getElementById(`btn-${key}`);
      const status = document.getElementById(`status-${key}`);
      const check  = document.getElementById(`check-${key}`);
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

  /** Atualiza estatísticas da semana atual */
  updateWeekStats() {
    const weekKey = currentWeekKey();
    const weekWorkouts = Cache.workouts.filter(w => {
      const wk = `${w.data.substring(0,4)}-W${String(isoWeek(w.data)).padStart(2,'0')}`;
      return wk === weekKey;
    });

    const { muscle, cardio } = this._countTypes(weekWorkouts);
    const points = (muscle + cardio) * 5;

    document.getElementById('week-muscle').textContent = muscle;
    document.getElementById('week-cardio').textContent = cardio;
    document.getElementById('week-points').textContent = points;

    const goal      = { muscle: this.currentUser.meta_muscle, cardio: this.currentUser.meta_cardio };
    const totalGoal = goal.muscle + goal.cardio;
    const totalDone = muscle + cardio;
    const pct       = totalGoal > 0 ? Math.min(100, Math.round((totalDone / totalGoal) * 100)) : 0;

    document.getElementById('goal-progress-text').textContent = `${totalDone} / ${totalGoal} treinos`;
    document.getElementById('progress-bar-fill').style.width  = `${pct}%`;

    // Notifica uma vez por sessão quando meta é atingida
    if (totalDone >= totalGoal && totalGoal > 0 && !Cache.weekGoalNotified) {
      Cache.weekGoalNotified = true;
      this.showToast('🏆 Meta semanal concluída!', 'info');
    }
  },

  /** Renderiza o calendário do mês com os treinos do cache */
  renderCalendar() {
    const cal = document.getElementById('month-calendar');
    const now  = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDay    = new Date(year, month, 1).getDay();
    const todayNum    = now.getDate();

    // Monta mapa de data → { muscle, cardio }
    const dayMap = {};
    this._workoutsOfMonth(currentMonth()).forEach(w => {
      if (!dayMap[w.data]) dayMap[w.data] = { muscle: false, cardio: false };
      if (w.tipo === 'musculacao') dayMap[w.data].muscle = true;
      if (w.tipo === 'cardio')     dayMap[w.data].cardio = true;
    });

    const weekdays = ['D','S','T','Q','Q','S','S'];
    let html = '<div class="cal-header">';
    weekdays.forEach(d => { html += `<div class="cal-weekday">${d}</div>`; });
    html += '</div><div class="cal-days">';

    for (let i = 0; i < firstDay; i++) html += '<div class="cal-day empty"></div>';

    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${year}-${String(month+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
      const rec = dayMap[dateStr] || {};
      let cls = 'cal-day';
      if (day === todayNum)         cls += ' today';
      if (rec.muscle && rec.cardio) cls += ' has-both';
      else if (rec.muscle)          cls += ' has-muscle';
      else if (rec.cardio)          cls += ' has-cardio';

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
    const allAch = [...ACHIEVEMENTS.geral, ...ACHIEVEMENTS.muscle, ...ACHIEVEMENTS.cardio];
    const unlockedList = allAch.filter(a => Cache.achievements.has(a.id));

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
  async registerWorkout(tipo) {
    const todayStr = today();
    const todayWorkouts = this._workoutsOfToday();

    // Validação local (rápida)
    if (todayWorkouts.some(w => w.tipo === tipo)) {
      this.showToast('Você já registrou este treino hoje!', 'error');
      return;
    }

    // Validação no banco (fonte da verdade)
    const { data: existing, error: checkError } = await db
      .from('treinos')
      .select('id')
      .eq('usuario_id', this.currentUser.dbId)
      .eq('tipo', tipo)
      .eq('data', todayStr);

    if (checkError) {
      this.showToast('Erro ao verificar treino. Tente novamente.', 'error');
      return;
    }
    if (existing && existing.length > 0) {
      // Sincroniza o cache e atualiza a UI
      if (!todayWorkouts.some(w => w.tipo === tipo)) {
        Cache.workouts.unshift({ tipo, data: todayStr, pontos: 5 });
      }
      this.updateRegisterButtons();
      this.showToast('Você já registrou este treino hoje!', 'error');
      return;
    }

    // Insere no Supabase
    const { error: insertError } = await db
      .from('treinos')
      .insert({
        usuario_id: this.currentUser.dbId,
        tipo,
        data:   todayStr,
        pontos: 5,
      });

    if (insertError) {
      console.error('Erro ao registrar treino:', insertError);
      this.showToast('Erro ao salvar treino. Tente novamente.', 'error');
      return;
    }

    // Atualiza o cache local
    Cache.workouts.unshift({ tipo, data: todayStr, pontos: 5 });

    // Verifica e salva conquistas
    await this.checkAchievements();

    // Atualiza a UI
    this.updateRegisterButtons();
    this.updateWeekStats();
    this.renderCalendar();
    this.renderAchievementsBadges();
    document.getElementById('header-points').textContent = this.getMonthPoints();
    this.animatePoints();

    const typeLabel = tipo === 'musculacao' ? 'Musculação' : 'Cardio';
    this.showToast(`+5 Halteres! ${typeLabel} registrado! 🎉`, 'success');
  },

  animatePoints() {
    const badge = document.getElementById('header-points-badge');
    badge.style.transform  = 'scale(1.2)';
    badge.style.transition = 'transform 0.2s';
    setTimeout(() => { badge.style.transform = 'scale(1)'; }, 200);
  },

  // ---- CONQUISTAS ----
  async checkAchievements() {
    const month   = currentMonth();
    const monthly = this._workoutsOfMonth(month);
    const { muscle: monthMuscle, cardio: monthCardio } = this._countTypes(monthly);
    const monthPoints = (monthMuscle + monthCardio) * 5;
    const totalWorkouts = Cache.workouts.length;

    // Verifica se alguma semana passou da meta para goalWeekCompleted
    const weekKey     = currentWeekKey();
    const weekDone    = Cache.workouts.filter(w => {
      const wk = `${w.data.substring(0,4)}-W${String(isoWeek(w.data)).padStart(2,'0')}`;
      return wk === weekKey;
    }).length;
    const goalTotal   = this.currentUser.meta_muscle + this.currentUser.meta_cardio;
    const goalWeekCompleted = (weekDone >= goalTotal && goalTotal > 0) ? 1 : 0;

    const stats = { totalWorkouts, monthMuscle, monthCardio, monthPoints, goalWeekCompleted };
    const allAch = [...ACHIEVEMENTS.geral, ...ACHIEVEMENTS.muscle, ...ACHIEVEMENTS.cardio];
    const newOnes = [];

    for (const a of allAch) {
      if (!Cache.achievements.has(a.id) && a.check(stats)) {
        // Salva no Supabase
        const { error } = await db
          .from('conquistas')
          .insert({ usuario_id: this.currentUser.dbId, conquista_id: a.id });

        if (!error) {
          Cache.achievements.add(a.id);
          newOnes.push(a);
        }
      }
    }

    newOnes.forEach((a, i) => {
      setTimeout(() => {
        this.showToast(`🏆 Conquista desbloqueada: ${a.name}!`, 'info');
      }, i * 1800);
    });
  },

  // ---- LOGOUT ----
  logout() {
    const dashScreen  = document.getElementById('screen-dashboard');
    const loginScreen = document.getElementById('screen-login');

    dashScreen.style.transition    = 'opacity 0.35s ease';
    dashScreen.style.opacity       = '0';
    dashScreen.style.pointerEvents = 'none';

    setTimeout(() => {
      dashScreen.style.transition    = '';
      dashScreen.style.opacity       = '';
      dashScreen.style.pointerEvents = '';
      dashScreen.classList.remove('active');

      this.currentUser = null;
      Cache.clear();
      this.applyAccentColor('#E50914');
      this.renderLoginScreen();

      loginScreen.style.opacity = '0';
      loginScreen.scrollTop     = 0;
      loginScreen.classList.add('active');
      void loginScreen.offsetHeight;
      loginScreen.style.transition = 'opacity 0.4s ease';
      loginScreen.style.opacity    = '1';

      setTimeout(() => { loginScreen.style.transition = ''; }, 420);
    }, 360);
  },

  // ---- PERFIL ----
  async goToProfile() {
    const u = this.currentUser;
    const month   = currentMonth();
    const monthly = this._workoutsOfMonth(month);
    const { muscle: monthMuscle, cardio: monthCardio } = this._countTypes(monthly);
    const monthTotal  = monthMuscle + monthCardio;

    document.getElementById('profile-avatar-big').textContent = u.emoji;
    document.getElementById('profile-name-big').textContent   = u.name;
    document.getElementById('profile-meta-summary').textContent =
      `Meta: ${u.meta_muscle}x Musculação + ${u.meta_cardio}x Cardio por semana`;
    document.getElementById('profile-total-points').textContent   = this.getMonthPoints();
    document.getElementById('profile-total-workouts').textContent = monthTotal;

    this.renderAchievementsCategory('ach-geral',   ACHIEVEMENTS.geral);
    this.renderAchievementsCategory('ach-muscle',  ACHIEVEMENTS.muscle);
    this.renderAchievementsCategory('ach-cardio',  ACHIEVEMENTS.cardio);

    this.showScreen('profile');
  },

  renderAchievementsCategory(containerId, achList) {
    const container = document.getElementById(containerId);
    container.innerHTML = achList.map(a => `
      <div class="ach-card ${Cache.achievements.has(a.id) ? 'unlocked' : 'locked'}" title="${a.desc}">
        <i class="fa-solid ${a.icon} ach-card-icon"></i>
        <span class="ach-card-name">${a.name}</span>
      </div>
    `).join('');
  },

  closeProfile() { this.showScreen('dashboard'); },

  // ---- CONFIGURAÇÕES ----
  openSettings() {
    document.getElementById('goal-muscle-val').textContent = this.currentUser.meta_muscle;
    document.getElementById('goal-cardio-val').textContent = this.currentUser.meta_cardio;
    this.renderColorPicker();
    this.showScreen('settings');
  },

  closeSettings() { this.showScreen('dashboard'); },

  toggleSettingsGroup(name) {
    document.getElementById(`group-${name}`).classList.toggle('open');
    document.getElementById(`chevron-${name}`).classList.toggle('open');
  },

  changeGoal(type, delta) {
    const el  = document.getElementById(`goal-${type}-val`);
    let val   = parseInt(el.textContent) + delta;
    val       = Math.max(0, Math.min(7, val));
    el.textContent = val;
  },

  async saveGoal() {
    const muscle = parseInt(document.getElementById('goal-muscle-val').textContent);
    const cardio  = parseInt(document.getElementById('goal-cardio-val').textContent);

    const { error } = await db
      .from('usuarios')
      .update({ meta_muscle: muscle, meta_cardio: cardio })
      .eq('id', this.currentUser.dbId);

    if (error) {
      this.showToast('Erro ao salvar meta.', 'error');
      return;
    }

    this.currentUser.meta_muscle = muscle;
    this.currentUser.meta_cardio = cardio;
    this.showToast('Meta salva com sucesso!', 'success');
    this.updateWeekStats();
  },

  renderColorPicker() {
    const grid         = document.getElementById('color-picker-grid');
    const currentColor = this.currentUser.cor_preferida;
    grid.innerHTML = COLORS.map(c => `
      <div class="color-swatch ${c.hex === currentColor ? 'selected' : ''}"
           style="background:${c.hex}" title="${c.name}"
           onclick="App.selectColor('${c.hex}')"></div>
    `).join('');
  },

  async selectColor(hex) {
    const { error } = await db
      .from('usuarios')
      .update({ cor_preferida: hex })
      .eq('id', this.currentUser.dbId);

    if (error) {
      this.showToast('Erro ao salvar cor.', 'error');
      return;
    }

    this.currentUser.cor_preferida = hex;
    this.applyAccentColor(hex);
    this.renderColorPicker();
    this.showToast('Cor do perfil atualizada!', 'success');
  },

  async confirmResetData() {
    if (!confirm(`Tem certeza que deseja resetar TODOS os dados de ${this.currentUser.name}? Esta ação não pode ser desfeita.`)) return;

    // Remove treinos e conquistas do banco
    await db.from('treinos').delete().eq('usuario_id', this.currentUser.dbId);
    await db.from('conquistas').delete().eq('usuario_id', this.currentUser.dbId);

    // Limpa o cache
    Cache.clear();

    this.applyAccentColor(this.currentUser.color);
    this.showToast('Dados resetados.', 'info');
    this.closeSettings();
    this.renderDashboard();
  },

  // ---- FECHAMENTO DO MÊS ----
  async openMonthClose() {
    const pMonth  = prevMonth();
    const content = document.getElementById('modal-month-content');
    content.innerHTML = '<p class="modal-empty">Carregando...</p>';
    document.getElementById('modal-month-close').classList.add('active');

    // Busca os treinos do mês anterior no banco
    const { data, error } = await db
      .from('treinos')
      .select('tipo, data, pontos')
      .eq('usuario_id', this.currentUser.dbId)
      .gte('data', `${pMonth}-01`)
      .lte('data', `${pMonth}-31`);

    if (error || !data || data.length === 0) {
      content.innerHTML = `<p class="modal-empty">Sem dados do mês anterior ainda.<br>Continue treinando este mês! 🎯</p>`;
      return;
    }

    const [year, m] = pMonth.split('-');
    const monthName = MONTHS_PT[parseInt(m) - 1];
    const muscle = data.filter(w => w.tipo === 'musculacao').length;
    const cardio  = data.filter(w => w.tipo === 'cardio').length;
    const points  = data.reduce((sum, w) => sum + (w.pontos || 5), 0);

    // Agrupa por semana para o mini gráfico
    const weekData = {};
    data.forEach(w => {
      const wk = isoWeek(w.data);
      if (!weekData[wk]) weekData[wk] = { muscle: 0, cardio: 0 };
      if (w.tipo === 'musculacao') weekData[wk].muscle++;
      if (w.tipo === 'cardio')     weekData[wk].cardio++;
    });
    const maxVal = Math.max(...Object.values(weekData).flatMap(w => [w.muscle, w.cardio]), 1);

    const weekBars = Object.entries(weekData).map(([wk, v]) => `
      <div class="bar-row">
        <span class="bar-label">S${wk}</span>
        <div style="flex:1;display:flex;flex-direction:column;gap:4px">
          <div class="bar-track"><div class="bar-fill muscle" style="width:${Math.round((v.muscle/maxVal)*100)}%"></div></div>
          <div class="bar-track"><div class="bar-fill cardio" style="width:${Math.round((v.cardio/maxVal)*100)}%"></div></div>
        </div>
        <span class="bar-val">${v.muscle + v.cardio}</span>
      </div>
    `).join('');

    content.innerHTML = `
      <h4 style="color:var(--text-secondary);font-size:0.85rem;font-weight:500;">${monthName} ${year}</h4>
      <div class="month-stats-row">
        <div class="month-stat-box">
          <div class="month-stat-num">${muscle}</div>
          <div class="month-stat-label"><i class="fa-solid fa-dumbbell"></i> Musculação</div>
        </div>
        <div class="month-stat-box">
          <div class="month-stat-num">${cardio}</div>
          <div class="month-stat-label"><i class="fa-solid fa-person-running"></i> Cardio</div>
        </div>
        <div class="month-stat-box">
          <div class="month-stat-num" style="color:var(--accent)">${points}</div>
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
  },

  closeMonthClose() {
    document.getElementById('modal-month-close').classList.remove('active');
  },

  // ---- NAVEGAÇÃO ENTRE TELAS ----
  showScreen(name) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    const target = document.getElementById(`screen-${name}`);
    target.classList.add('active');
    target.scrollTop = 0;
  },

  // ---- CORES ----
  applyAccentColor(hex) {
    document.documentElement.style.setProperty('--accent',      hex);
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

  // ---- TOAST ----
  showToast(message, type = 'info') {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.className   = `toast ${type}`;
    void toast.offsetWidth;
    toast.classList.add('show');
    clearTimeout(this._toastTimer);
    this._toastTimer = setTimeout(() => toast.classList.remove('show'), 2800);
  },
};

// =============================================
//  INICIALIZAR APP
// =============================================
document.addEventListener('DOMContentLoaded', () => App.init());
