// ==========================
// CONSTANTS & INITIAL STATE
// ==========================
const profileOverlay = document.getElementById('profileOverlay');
const profileModal = document.querySelector('.profile-modal');
const cardOverlay = document.getElementById('cardOverlay');
const playerName = document.getElementById('playerName');
const rank = document.getElementById('rank');
const xpFill = document.getElementById('xpFill');
const xpText = document.getElementById('xpText');
const streak = document.getElementById('streak');
const quests = document.getElementById('quests');
const history = document.getElementById('history');
const overlayName = document.getElementById('overlayName');
const overlayBio = document.getElementById('overlayBio');
const overlayGoal = document.getElementById('overlayGoal');
const cardAvatar = document.getElementById('cardAvatar');
const nameInput = document.getElementById('nameInput');
const bioInput = document.getElementById('bioInput');
const goalInput = document.getElementById('goalInput');
const avatarInput = document.getElementById('avatarInput');
const avatarPreview = document.getElementById('avatarPreview'); // optional, for showing the selected image
avatarInput.addEventListener('change', loadAvatar);

const RANK_BENCHMARKS = [
  { pushups: 10, squats: 20, pullups: 1, situps: 10 },      // Beginner
  { pushups: 20, squats: 50, pullups: 3, situps: 30 },      // Striker
  { pushups: 40, squats: 100, pullups: 6, situps: 60 },     // Warrior
  { pushups: 60, squats: 150, pullups: 9, situps: 90 },     // Gladiator
  { pushups: 75, squats: 200, pullups: 12, situps: 100 },   // Vanguard
  { pushups: 90, squats: 250, pullups: 15, situps: 130 },   // Titan
  { pushups: 110, squats: 300, pullups: 18, situps: 160 },  // Phantom
  { pushups: 130, squats: 400, pullups: 21, situps: 200 },  // Beast
  { pushups: 150, squats: 500, pullups: 25, situps: 250 },  // Immortal
  { pushups: 175, squats: 600, pullups: 30, situps: 300 },  // Demon Mode
  { pushups: 200, squats: 750, pullups: 35, situps: 400 },  // Ascendant
];

const XP_GAINS={pushups:{xp:5,points:1},squats:{xp:5,points:1},situps:{xp:5,points:1}};
const RANKS=["Beginner","Striker","Warrior","Gladiator","Vanguard","Titan","Phantom","Beast","Immortal","Demon Mode","Ascendant"];
const RANK_POINTS=[0,200,700,1100,2000,5000,8000,10000,30000,40000,50000];
const RANK_TIERS=['F','E','D','C','B','A','AA','S','SS','SSS','SSS+'];
const QUEST_POOL = [
  {id: 'pushups_50', type: 'reps', activity: 'pushups', target: 50, reward_xp: 30, reward_points: 5, label: 'Do 50 Pushups'},
  {id: 'squats_75', type: 'reps', activity: 'squats', target: 75, reward_xp: 40, reward_points: 7, label: 'Do 75 Squats'},
  {id: 'situps_30', type: 'reps', activity: 'situps', target: 30, reward_xp: 20, reward_points: 3, label: 'Do 30 Situps'},
  {id: 'any_reps_100', type: 'reps', activity: 'any_workout', target: 100, reward_xp: 50, reward_points: 10, label: 'Complete 100 Reps (Any Workout)'},
  {id: 'xp_gain_100', type: 'xp_gain', activity: 'any', target: 100, reward_xp: 20, reward_points: 5, label: 'Gain 100 XP'},
  {id: 'log_3_workouts', type: 'log_count', activity: 'any', target: 3, reward_xp: 25, reward_points: 4, label: 'Log 3 Workouts'},
  {id: 'streak_3_days', type: 'streak', activity: 'any', target: 3, reward_xp: 30, reward_points: 5, label: 'Maintain a 3-day Streak'},
];

let state=JSON.parse(localStorage.getItem('fitquest_final'))||{
  xp:0,
  points:0,
  name:'Adventurer',
  bio:'',
  goal:'',
  streak:0,
  lastWorkoutDate:null,
  avatar:'',
  quest: {},
  history:[]
};
const todayStr = new Date().toDateString();

// ==========================
// HELPER FUNCTIONS
// ==========================
function getProgressionDetails() {
  const level = Math.floor(state.xp / 100) + 1;
  let rankIndex = state.rankIndex ?? 0;

  for (let i = rankIndex; i < RANKS.length; i++) {
    const benchmarks = RANK_BENCHMARKS[i];
    const meetsBenchmarks = Object.keys(benchmarks).every(key => (state[key] || 0) >= benchmarks[key]);
    if (state.points >= RANK_POINTS[i] && meetsBenchmarks) {
      rankIndex = i;
    } else {
      break;
    }
  }

  const rankName = RANKS[rankIndex];
  const nextRankIndex = rankIndex < RANKS.length - 1 ? rankIndex + 1 : null;
  const nextRank = nextRankIndex !== null ? RANKS[nextRankIndex] : null;
  const nextRankBenchmarks = nextRankIndex !== null ? RANK_BENCHMARKS[nextRankIndex] : {};

  return {
    level,
    rankName,
    rankIndex,
    xpProgress: state.xp % 100,
    xpToNextLevel: (level * 100) - state.xp,
    points: state.points,
    pointsToNextRank: nextRankIndex !== null ? Math.max(0, RANK_POINTS[nextRankIndex] - state.points) : 0,
    nextRank,
    nextRankBenchmarks
  };
}


function placeByBenchmark(pushups, squats, pullups, situps) {
  let rankIndex = 0;

  for (let i = 0; i < RANK_BENCHMARKS.length; i++) {
    const b = RANK_BENCHMARKS[i];
    const meetsBenchmarks = 
      pushups >= b.pushups &&
      squats >= b.squats &&
      pullups >= b.pullups &&
      situps >= b.situps;

    if (meetsBenchmarks) {
      rankIndex = i; // keep the highest rank for which benchmarks are met
    } else {
      break; // stop at the first rank you don't meet
    }
  }

  state.rankIndex = rankIndex;
  state.rankName = RANKS[rankIndex];
  state.pushups = pushups;
  state.squats = squats;
  state.pullups = pullups;
  state.situps = situps;

  render();
  localStorage.setItem('fitquest_final', JSON.stringify(state));
  alert(`Benchmark completed! You are placed as ${RANKS[rankIndex]}`);
}



// ==========================
// RENDER FUNCTION
// ==========================
function render() {
  const progression = getProgressionDetails();

  // Update main UI
  playerName.textContent = state.name;
  rank.textContent = progression.rankName;
  xpFill.style.width = progression.xpProgress + '%';
  xpText.textContent = state.xp + ' XP (Level ' + progression.level + ' - ' + progression.xpProgress + '/100)';
  streak.textContent = state.streak;

  // Update profile avatar
  const btn = document.getElementById('profileBtn');
  if (state.avatar) {
    btn.classList.add('avatar');
    btn.style.backgroundImage = `url(${state.avatar})`;
    btn.textContent = 'Profile';
  } else {
    btn.classList.remove('avatar');
    btn.style.backgroundImage = '';
    btn.textContent = 'Profile';
  }

  // Render quests
  quests.innerHTML = '';
  QUEST_POOL.forEach(q => {
    const d = document.createElement('div');
    d.className = 'quest' + (state.quests[q.id] ? ' complete' : '');
    d.innerHTML = `
      <div>${q.label}</div>
      ${state.quests[q.id] ? '✔' : `<button onclick="complete('${q.id}', ${q.reward_xp})">Complete</button>`}
    `;
    quests.appendChild(d);
  });

  // Render history
  history.innerHTML = state.history.map(h => `<div>${h.date}: ${h.text}</div>`).join('');

  // Save state
  localStorage.setItem('fitquest_final', JSON.stringify(state));
}

// ==========================
// QUEST FUNCTIONS
// ==========================
function complete(id, xp) {
  const oldProgression = getProgressionDetails();
  state.quests[id] = true;
  const questObj = QUEST_POOL.find(q => q.id === id);
  const points = questObj ? questObj.reward_points : Math.floor(xp/2);
  state.xp += xp;
  state.points += points;

  const newProgression = getProgressionDetails();
  if (newProgression.level > oldProgression.level) showRankUp('LEVEL UP!');
  if (newProgression.rankIndex > oldProgression.rankIndex) showRankUp('RANK UP!');
  showXPGain(xp);
  render();
}

  // Streak logic
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  if (state.lastWorkoutDate === yesterday.toDateString()) state.streak += 1;
  else state.streak = 1;

  state.lastWorkoutDate = todayStr;

  state.history.push({ date: todayStr, text: `${t} x${c} (+${xpGained} XP, +${pointsGained} Points)` });
  workoutCount.value = '';

  state[t] = (state[t] || 0) + c;

  const newProgression = getProgressionDetails();
  if (newProgression.level > oldProgression.level) showRankUp('LEVEL UP!');
  if (newProgression.rankIndex > oldProgression.rankIndex) showRankUp('RANK UP!');
  showXPGain(xpGained);
  render();

// ==========================
// CHARACTER CARD OVERLAY FUNCTIONS
// ==========================
function showCard() {
  const cardOverlay = document.getElementById('cardOverlay');
  cardOverlay.classList.add('active');

  const progression = getProgressionDetails();

  const rankTierEl = document.querySelector('.char-rank-s');
  if (rankTierEl) rankTierEl.textContent = RANK_TIERS[progression.rankIndex] || '';

  if (overlayName) overlayName.textContent = state.name;
  if (overlayBio) {
    overlayBio.textContent = state.bio || 'A lone adventurer forging strength through discipline.';
    overlayBio.classList.remove("expanded");
    overlayBio.onclick = () => overlayBio.classList.toggle("expanded");
  }
  if (overlayGoal) overlayGoal.textContent = 'Goal: ' + (state.goal || 'Become unstoppable');
  if (cardAvatar) cardAvatar.src = state.avatar || '';

  const nextRankContainer = document.getElementById('nextRankContainer');
  if (nextRankContainer) {
    nextRankContainer.innerHTML = '';
    if (progression.nextRank && Object.keys(progression.nextRankBenchmarks).length > 0) {
      const title = document.createElement('h3');
      title.textContent = `NEXT RANK: ${progression.nextRank}`;
      nextRankContainer.appendChild(title);

      const list = document.createElement('ul');
      for (let exercise in progression.nextRankBenchmarks) {
        const userVal = state[exercise] || 0;
        const reqVal = progression.nextRankBenchmarks[exercise];
        const li = document.createElement('li');
        li.setAttribute('data-status', userVal >= reqVal ? 'met' : 'unmet');
        li.textContent = `${exercise}: ${userVal} / ${reqVal}`;
        list.appendChild(li);
      }
      nextRankContainer.appendChild(list);
    }
  }
}

function closeOverlay() {
  cardOverlay.classList.remove('active');
  profileOverlay.classList.remove('active');
}

// ==========================
// PROFILE EDIT FUNCTIONS
// ==========================
function openProfile() {
  profileOverlay.classList.add('active');
  profileModal.classList.add('active');
  nameInput.value = state.name;
  bioInput.value = state.bio;
  goalInput.value = state.goal;
}

function closeProfile() {
  profileOverlay.classList.remove('active');
  profileModal.classList.remove('active');
}


function saveProfile() {
  state.name = nameInput.value || state.name;
  state.bio = bioInput.value;
  state.goal = goalInput.value;
  localStorage.setItem('fitquest_final', JSON.stringify(state));
  closeProfile();   // closes just the profile overlay
  render();
}


function loadAvatar(e) {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = () => { 
    state.avatar = reader.result; 
    render(); 
    // show preview in modal
    avatarPreview.innerHTML = `<img src="${state.avatar}" style="width:100px; height:100px; border-radius:50%;" />`;
  };
  reader.readAsDataURL(file);
}


// ==========================
// OTHER UI FUNCTIONS
// ==========================
function showStatus() {
  const mainInfo = document.querySelector('.char-info-main');
  const statusInfo = document.querySelector('.char-info-status');

  mainInfo.classList.add('fade-out');
  setTimeout(() => {
    mainInfo.classList.remove('view-active');
    mainInfo.classList.add('view-hidden');
    mainInfo.classList.remove('fade-out');

    statusInfo.classList.remove('view-hidden');
    statusInfo.classList.add('view-active');
    statusInfo.classList.add('fade-in');
  }, 500);

  const progression = getProgressionDetails();
  document.getElementById('statXP3').textContent = state.xp;
  document.getElementById('statLevel3').textContent = progression.level;
  document.getElementById('statRank3').textContent = progression.rankName;
  document.getElementById('statPoints3').textContent = state.points;
  document.getElementById('statStreak3').textContent = state.streak + ' days';
  
  statusList.addEventListener('wheel', (e) => {
  e.preventDefault();       // prevent page from scrolling
  statusList.scrollTop += e.deltaY;  // scroll the ul
});

}

function showMainInfo() {
  const mainInfo = document.querySelector('.char-info-main');
  const statusInfo = document.querySelector('.char-info-status');

  statusInfo.classList.add('fade-out');
  setTimeout(() => {
    statusInfo.classList.remove('view-active');
    statusInfo.classList.add('view-hidden');
    statusInfo.classList.remove('fade-out');

    mainInfo.classList.remove('view-hidden');
    mainInfo.classList.add('view-active');
    mainInfo.classList.add('fade-in');
  }, 500);
}

function showSkills() { alert('Skill tree coming soon!'); }

function toggleAboutView() {
  const statusInfo = document.querySelector('.char-info-status');
  if(statusInfo.classList.contains('view-active')) showMainInfo();
}

function showXPGain(amount) {
  const xpGainEl = document.createElement('div');
  xpGainEl.className = 'xp-gain-notification';
  xpGainEl.textContent = `+${amount} XP`;
  document.body.appendChild(xpGainEl);
  setTimeout(() => xpGainEl.remove(), 2000);
}

function showRankUp(message) {
  const rankUpEl = document.createElement('div');
  rankUpEl.className = 'rank-up-notification';
  rankUpEl.textContent = message;
  document.body.appendChild(rankUpEl);
  setTimeout(() => rankUpEl.remove(), 3000);
}

function setActive(el) {
  document.querySelectorAll('.char-right span').forEach(s => s.classList.remove('active'));
  el.classList.add('active');
}



function openBenchmark() {
    // close profile overlay if open
    profileOverlay.classList.remove('active');
  document.getElementById('benchmarkOverlay').classList.add('active');
    
// Example for benchmark overlay
const benchmarkOverlay = document.getElementById('benchmarkOverlay');
benchmarkOverlay.addEventListener('click', function(e) {
  if (e.target === benchmarkOverlay) {
    benchmarkOverlay.classList.remove('active');
  }
});
}


function submitBenchmark() {
  const pushups = Number(document.getElementById('benchPushups').value || 0);
  const squats = Number(document.getElementById('benchSquats').value || 0);
  const pullups = Number(document.getElementById('benchPullups').value || 0);
  const situps = Number(document.getElementById('benchSitups').value || 0);

  // Save to state
  state.pushups = pushups;
  state.squats = squats;
  state.pullups = pullups;
  state.situps = situps;

  // Determine initial rank
  determineInitialRank();

// Sync rankIndex and rankName with the calculated initial rank
state.rankIndex = state.initialRankIndex;
state.rankName = RANKS[state.rankIndex];

// Optional: set points to at least the minimum for that rank so getProgressionDetails respects it
state.points = Math.max(state.points, RANK_POINTS[state.rankIndex]);


  // Hide benchmark modal
  document.getElementById('benchmarkOverlay').classList.remove('active');

  // Save state
  localStorage.setItem('fitquest_final', JSON.stringify(state));

  // Render everything
  render();
}


function determineInitialRank() {
  for (let i = RANKS.length - 1; i >= 0; i--) {
    const benchmarks = RANK_BENCHMARKS[i];
    const meetsBenchmarks = Object.keys(benchmarks).every(
      key => (state[key] || 0) >= benchmarks[key]
    );
    if (meetsBenchmarks) {
      state.initialRankIndex = i;
      return;
    }
  }
  state.initialRankIndex = 0; // default Beginner
}

if (!localStorage.getItem('fitquest_final')) {
  document.getElementById('benchmarkOverlay').classList.add('active');
} else {
  render();
}



// ==========================
// INITIAL RENDER
// ==========================
render();
