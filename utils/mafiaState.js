const activeGames = new Map(); // channelId => gameData
const playerSelections = new Map(); // لحفظ اختيارات اللاعبين المؤقتة

const ROLES = {
  MAFIA: "مافيا",
  CITIZEN: "مواطن",
  DOCTOR: "طبيب",
  SHERIFF: "شيرف",
};

const ROLE_DESCRIPTIONS = {
  [ROLES.MAFIA]: `🔴 **أنت مافيا!**
  
🎯 **هدفك:** القضاء على جميع المواطنين
🔪 **قدرتك:** قتل شخص واحد كل ليلة
🎭 **استراتيجيتك:** أخفِ هويتك نهاراً وصوت ضد المواطنين`,

  [ROLES.CITIZEN]: `🔵 **أنت مواطن!**
  
🎯 **هدفك:** كشف والتخلص من جميع أعضاء المافيا
🗳️ **قدرتك:** التصويت نهاراً ضد المشتبه بهم
🕵️ **استراتيجيتك:** راقب سلوك الآخرين وابحث عن الأدلة`,

  [ROLES.DOCTOR]: `⚕️ **أنت الطبيب!**
  
🎯 **هدفك:** حماية المواطنين من المافيا
🛡️ **قدرتك:** حماية شخص واحد كل ليلة (بما فيهم نفسك)
💡 **ملاحظة:** لا يمكنك حماية نفس الشخص ليلتين متتاليتين
🕵️ **استراتيجيتك:** حاول تخمين من ستستهدفه المافيا`,

  [ROLES.SHERIFF]: `🕵️ **أنت الشيرف!**
  
🎯 **هدفك:** كشف هوية أعضاء المافيا
🔍 **قدرتك:** التحقيق مع شخص واحد كل ليلة لمعرفة إذا كان مافيا أم لا
📋 **النتيجة:** ستحصل على "مافيا" أو "بريء"
🕵️ **استراتيجيتك:** استخدم المعلومات بذكاء لتوجيه التصويت نهاراً`,
};

// إعدادات اللعبة
const GAME_SETTINGS = {
  MIN_PLAYERS: 5,
  MAX_PLAYERS: 15,
  NIGHT_TIME_LIMIT: 60000, // 60 ثانية لكل دور ليلي
  DAY_TIME_LIMIT: 60000, // 3 دقائق للتصويت
  ROLE_REVEAL_DELAY: 3000, // تأخير بين إرسال الأدوار
  PHASE_TRANSITION_DELAY: 2000, // تأخير بين المراحل
};

// قالب إنشاء لعبة جديدة
function createGameData(channelId) {
  return {
    // معلومات أساسية
    channelId,
    phase: "lobby", // lobby | night | day | voting | ended
    round: 0,

    // اللاعبين
    players: [], // جميع اللاعبين
    alivePlayers: [], // الأحياء فقط
    deadPlayers: [], // الموتى فقط

    // الأدوار والإجراءات
    roles: new Map(), // playerId => role
    nightActions: new Map(), // actionType => targetId
    votes: new Map(), // voterId => targetId

    // تايمرز
    phaseTimer: null,
    actionTimers: new Map(), // playerId => timerId

    // إحصائيات
    mafiaKills: 0,
    citizenExecutions: 0,
    doctorSaves: 0,
    sheriffInvestigations: 0,
  };
}

// دالة حساب عدد المافيا المطلوب
function calculateMafiaCount(totalPlayers) {
  if (totalPlayers < 5) return 0;
  if (totalPlayers <= 6) return 1;
  if (totalPlayers <= 9) return 2;
  if (totalPlayers <= 12) return 3;
  return 4; // للألعاب الكبيرة جداً
}

// دالة توزيع الأدوار المتوازنة
function generateBalancedRoles(playerCount) {
  const roles = [];
  const mafiaCount = calculateMafiaCount(playerCount);

  // إضافة المافيا
  for (let i = 0; i < mafiaCount; i++) {
    roles.push(ROLES.MAFIA);
  }

  // إضافة الأدوار الخاصة (دائماً شيرف وطبيب واحد)
  roles.push(ROLES.SHERIFF);
  roles.push(ROLES.DOCTOR);

  // ملء الباقي بمواطنين
  while (roles.length < playerCount) {
    roles.push(ROLES.CITIZEN);
  }

  return roles;
}

// دالة خلط متقدمة (Fisher-Yates)
function fisherYatesShuffle(array) {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
}

// دالة فحص صحة اللعبة
function validateGame(game) {
  const errors = [];

  if (!game.channelId) errors.push("معرف القناة مفقود");
  if (game.players.length < GAME_SETTINGS.MIN_PLAYERS) {
    errors.push(
      `عدد اللاعبين قليل جداً (${game.players.length}/${GAME_SETTINGS.MIN_PLAYERS})`
    );
  }
  if (game.players.length > GAME_SETTINGS.MAX_PLAYERS) {
    errors.push(
      `عدد اللاعبين كثير جداً (${game.players.length}/${GAME_SETTINGS.MAX_PLAYERS})`
    );
  }

  // فحص الأدوار إذا بدأت اللعبة
  if (game.phase !== "lobby") {
    const mafiaCount = [...game.roles.values()].filter(
      (role) => role === ROLES.MAFIA
    ).length;
    const expectedMafiaCount = calculateMafiaCount(game.players.length);
    if (mafiaCount !== expectedMafiaCount) {
      errors.push(`عدد المافيا غير صحيح (${mafiaCount}/${expectedMafiaCount})`);
    }
  }

  return errors;
}

// دالة الحصول على إحصائيات اللعبة
function getGameStats(game) {
  const totalPlayers = game.players.length;
  const alivePlayers = game.alivePlayers.length;
  const deadPlayers = game.deadPlayers.length;

  const roles = {
    mafia: 0,
    citizens: 0,
    sheriff: 0,
    doctor: 0,
  };

  const aliveRoles = {
    mafia: 0,
    citizens: 0,
    sheriff: 0,
    doctor: 0,
  };

  // حساب الأدوار
  for (const [playerId, role] of game.roles) {
    switch (role) {
      case ROLES.MAFIA:
        roles.mafia++;
        if (game.alivePlayers.includes(playerId)) aliveRoles.mafia++;
        break;
      case ROLES.SHERIFF:
        roles.sheriff++;
        if (game.alivePlayers.includes(playerId)) aliveRoles.sheriff++;
        break;
      case ROLES.DOCTOR:
        roles.doctor++;
        if (game.alivePlayers.includes(playerId)) aliveRoles.doctor++;
        break;
      case ROLES.CITIZEN:
        roles.citizens++;
        if (game.alivePlayers.includes(playerId)) aliveRoles.citizens++;
        break;
    }
  }

  return {
    totalPlayers,
    alivePlayers,
    deadPlayers,
    roles,
    aliveRoles,
    round: game.round,
    phase: game.phase,
    actions: {
      mafiaKills: game.mafiaKills || 0,
      citizenExecutions: game.citizenExecutions || 0,
      doctorSaves: game.doctorSaves || 0,
      sheriffInvestigations: game.sheriffInvestigations || 0,
    },
  };
}

// دالة تنظيف اللعبة
function cleanupGame(channelId) {
  const game = activeGames.get(channelId);
  if (!game) return false;

  // إلغاء جميع التايمرز
  if (game.phaseTimer) clearTimeout(game.phaseTimer);
  for (const [playerId, timerId] of game.actionTimers) {
    clearTimeout(timerId);
  }

  // تنظيف البيانات
  activeGames.delete(channelId);

  // تنظيف اختيارات اللاعبين المرتبطة بهذه اللعبة
  for (const [key, value] of playerSelections) {
    if (key.startsWith(channelId)) {
      playerSelections.delete(key);
    }
  }

  return true;
}

// دالة الحصول على معلومات اللاعب
function getPlayerInfo(game, playerId) {
  if (!game.players.includes(playerId)) {
    return { exists: false };
  }

  return {
    exists: true,
    role: game.roles.get(playerId),
    isAlive: game.alivePlayers.includes(playerId),
    isDead: game.deadPlayers.includes(playerId),
    hasVoted: game.votes.has(playerId),
    votedFor: game.votes.get(playerId),
  };
}

// دالة فحص انتهاء اللعبة
function checkGameEnd(game) {
  const aliveMafia = game.alivePlayers.filter(
    (id) => game.roles.get(id) === ROLES.MAFIA
  ).length;

  const aliveCitizens = game.alivePlayers.filter(
    (id) => game.roles.get(id) !== ROLES.MAFIA
  ).length;

  if (aliveMafia === 0) {
    return {
      ended: true,
      winner: "citizens",
      reason: "تم القضاء على جميع المافيا",
    };
  }

  if (aliveMafia >= aliveCitizens) {
    return {
      ended: true,
      winner: "mafia",
      reason: "المافيا تساوي أو تفوق المواطنين",
    };
  }

  return { ended: false };
}

module.exports = {
  // البيانات الأساسية
  activeGames,
  playerSelections,
  ROLES,
  ROLE_DESCRIPTIONS,
  GAME_SETTINGS,

  // الدوال المساعدة
  createGameData,
  calculateMafiaCount,
  generateBalancedRoles,
  fisherYatesShuffle,
  validateGame,
  getGameStats,
  cleanupGame,
  getPlayerInfo,
  checkGameEnd,
};
