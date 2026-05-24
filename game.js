const WORD_BANK = Array.isArray(window.WORD_GARDEN_WORDS)
  ? window.WORD_GARDEN_WORDS.filter((word) => /^[A-Z]{3,8}$/.test(word))
  : [];
const ANSWER_WORD_BANK = Array.isArray(window.WORD_GARDEN_ANSWER_WORDS)
  ? window.WORD_GARDEN_ANSWER_WORDS.filter((word) => /^[A-Z]{3,8}$/.test(word))
  : WORD_BANK;
const GENERATED_CHINESE_MEANINGS = window.WORD_GARDEN_MEANINGS || {};
const TOTAL_PUZZLES = WORD_BANK.length || 100000;
const generatedAnswerCache = new Map();
const crosswordLayoutCache = new Map();
const MAX_WORDS_PER_PUZZLE = 9;
const STARTING_COINS = 1000000;
const GAME_STATE_KEY = "wordGardenGameState";
const LEGACY_COMPLETED_PUZZLES_KEY = "wordGardenCompletedPuzzles";

const puzzleTemplates = [
  { letters: "PLANT", words: ["ANT", "LAP", "PAN", "TAN", "PLAN", "PLANT"] },
  { letters: "STONE", words: ["NET", "ONE", "SET", "TEN", "TOE", "TON", "NOTE", "STONE"] },
  { letters: "BRIGHT", words: ["BIG", "BIT", "RIB", "HIT", "GIRT", "BIRTH", "BRIGHT"] },
  { letters: "GARDEN", words: ["AGE", "AND", "ARE", "DEN", "EAR", "RAN", "DARN", "RANGE", "GARDEN"] },
  { letters: "CANDLE", words: ["ACE", "AND", "CAN", "DEN", "LAD", "LAND", "DEAL", "CLEAN", "CANDLE"] },
  { letters: "MARKET", words: ["ARK", "ARM", "ART", "EAT", "MAT", "MET", "TEA", "TEAM", "MAKER", "MARKET"] },
  { letters: "FOREST", words: ["FOR", "FOE", "SET", "TOE", "ORE", "ROSE", "REST", "SORT", "STORE", "FOREST"] },
  { letters: "PLANET", words: ["ANT", "ATE", "EAT", "LAP", "PAN", "PEN", "TAN", "PLAN", "PLANE", "PLANET"] },
  { letters: "STREAM", words: ["ARE", "ARM", "ART", "ATE", "EAT", "SEA", "TEA", "TEAM", "MASTER", "STREAM"] },
  { letters: "BRANCH", words: ["ARC", "BAN", "BAR", "CAN", "CAR", "RAN", "BARN", "CHAR", "RANCH", "BRANCH"] },
  { letters: "SILVER", words: ["IRE", "LIE", "SIR", "VIE", "RISE", "LIVE", "VEIL", "EVIL", "LIVER", "SILVER"] },
  { letters: "ORANGE", words: ["AGE", "ARE", "EAR", "EON", "NOR", "ONE", "RAN", "RANGE", "ORGAN", "ORANGE"] },
  { letters: "CASTLE", words: ["ACE", "ACT", "ATE", "EAT", "SEA", "SET", "TEA", "LAST", "TALES", "CASTLE"] },
  { letters: "FLOWER", words: ["FEW", "FOE", "FOR", "LOW", "ORE", "OWL", "ROW", "FLOE", "LOWER", "FLOWER"] },
  { letters: "SUMMER", words: ["EMS", "MUM", "RUE", "RUM", "SUE", "USE", "MUSE", "USER", "SERUM", "SUMMER"] },
  { letters: "WINTER", words: ["IRE", "NEW", "NET", "TEN", "TIE", "WIN", "WIRE", "TWIN", "WRITE", "WINTER"] },
  { letters: "SPRING", words: ["GIN", "PIN", "RIG", "SIN", "SIP", "SIR", "RING", "SIGN", "GRIN", "SPRING"] },
  { letters: "DESERT", words: ["DEER", "REST", "SEED", "TREE", "SEE", "SET", "RED", "TEE", "STEER", "DESERT"] },
  { letters: "MEADOW", words: ["ADO", "AWE", "DEW", "DOE", "MAD", "MEW", "MOW", "OWE", "MEAD", "MEADOW"] },
  { letters: "BREEZEV", words: ["BEE", "ERE", "EVE", "ZEE", "BEER", "EVER", "BREE", "REEVE", "BREEZE"] }
];

const puzzleThemes = [
  "plant",
  "stone",
  "bright",
  "garden",
  "candle",
  "market",
  "forest",
  "planet",
  "stream",
  "branch",
  "silver",
  "orange",
  "castle",
  "flower",
  "summer",
  "winter",
  "spring",
  "desert",
  "meadow",
  "breeze"
];

const chineseMeanings = {
  ACE: "高手",
  ACT: "行动",
  ADO: "忙乱",
  AGE: "年龄",
  AND: "和",
  ANT: "蚂蚁",
  ARC: "弧",
  ARE: "是",
  ARK: "方舟",
  ARM: "手臂",
  ART: "艺术",
  ATE: "吃了",
  AWE: "敬畏",
  BAN: "禁止",
  BAR: "酒吧",
  BARN: "谷仓",
  BEE: "蜜蜂",
  BEER: "啤酒",
  BIG: "大",
  BIRTH: "出生",
  BIT: "一点",
  BRANCH: "树枝",
  BREE: "肉汤",
  BREEZE: "微风",
  BRIGHT: "明亮",
  CAN: "能",
  CANDLE: "蜡烛",
  CAR: "车",
  CASTLE: "城堡",
  CHAR: "烧焦",
  CLEAN: "干净",
  DARN: "织补",
  DEAL: "交易",
  DEER: "鹿",
  DEN: "兽穴",
  DESERT: "沙漠",
  DEW: "露水",
  DOE: "母鹿",
  EAR: "耳朵",
  EAT: "吃",
  EMS: "字母M",
  EON: "永世",
  ERE: "之前",
  EVE: "前夕",
  EVER: "曾经",
  EVIL: "邪恶",
  FEW: "少数",
  FLOE: "浮冰",
  FLOWER: "花",
  FOE: "敌人",
  FOR: "为了",
  FOREST: "森林",
  GARDEN: "花园",
  GIN: "杜松子酒",
  GIRT: "围绕",
  GRIN: "咧嘴笑",
  HIT: "击打",
  IRE: "愤怒",
  LAD: "男孩",
  LAND: "土地",
  LAP: "膝",
  LAST: "最后",
  LIE: "谎言",
  LIVE: "生活",
  LIVER: "肝",
  LOW: "低",
  LOWER: "降低",
  MAD: "生气",
  MAKER: "制造者",
  MARKET: "市场",
  MASTER: "大师",
  MAT: "垫子",
  MEAD: "蜂蜜酒",
  MEADOW: "草地",
  MET: "遇见",
  MEW: "猫叫",
  MOW: "割草",
  MUM: "妈妈",
  MUSE: "沉思",
  NET: "网",
  NEW: "新的",
  NOR: "也不",
  NOTE: "笔记",
  ONE: "一",
  ORANGE: "橙子",
  ORE: "矿石",
  ORGAN: "器官",
  OWE: "欠",
  OWL: "猫头鹰",
  PAN: "平底锅",
  PEN: "笔",
  PIN: "别针",
  PLAN: "计划",
  PLANE: "飞机",
  PLANET: "行星",
  PLANT: "植物",
  RAN: "跑了",
  RANCH: "牧场",
  RANGE: "范围",
  RED: "红色",
  REST: "休息",
  REEVE: "长官",
  RIB: "肋骨",
  RIG: "装置",
  RING: "戒指",
  RISE: "上升",
  ROSE: "玫瑰",
  ROW: "排",
  RUE: "懊悔",
  RUM: "朗姆酒",
  SEA: "海",
  SEE: "看见",
  SEED: "种子",
  SERUM: "血清",
  SET: "设置",
  SIGN: "标志",
  SILVER: "银",
  SIN: "罪",
  SIP: "小口喝",
  SIR: "先生",
  SORT: "分类",
  SPRING: "春天",
  STEER: "引导",
  STONE: "石头",
  STORE: "商店",
  STREAM: "溪流",
  SUE: "起诉",
  SUMMER: "夏天",
  TAN: "棕褐色",
  TALES: "故事",
  TEA: "茶",
  TEAM: "团队",
  TEE: "球座",
  TEN: "十",
  TIE: "领带",
  TOE: "脚趾",
  TON: "吨",
  TREE: "树",
  TWIN: "双胞胎",
  USE: "使用",
  USER: "用户",
  VEIL: "面纱",
  VIE: "竞争",
  WIN: "赢",
  WINTER: "冬天",
  WIRE: "电线",
  WRITE: "写",
  ZEE: "字母Z"
};

const savedState = loadGameState();
let currentPuzzleId = savedState.currentPuzzleId;
let currentLetters = savedState.currentLetters;
let coins = savedState.coins;
let selected = [];
let found = new Set(savedState.foundWords);
let revealed = objectToRevealedSets(savedState.revealedLetters);
let isGameComplete = savedState.isGameComplete;

const board = document.querySelector("#word-board");
const shell = document.querySelector(".game-shell");
const topBar = document.querySelector(".top-bar");
const boardWrap = document.querySelector(".board-wrap");
const entryPanel = document.querySelector(".entry-panel");
const wheelWrap = document.querySelector(".wheel-wrap");
const controls = document.querySelector(".controls");
const exitScreen = document.querySelector("#exit-screen");
const wheel = document.querySelector("#letter-wheel");
const currentWord = document.querySelector("#current-word");
const message = document.querySelector("#message");
const levelNumber = document.querySelector("#level-number");
const coinsDisplay = document.querySelector("#coins");

document.querySelector("#clear-btn").addEventListener("click", clearSelection);
document.querySelector("#shuffle-btn").addEventListener("click", shuffleLetters);
document.querySelector("#submit-btn").addEventListener("click", submitWord);
document.querySelector("#hint-btn").addEventListener("click", useHint);
document.querySelector("#exit-btn").addEventListener("click", exitGame);

document.addEventListener("keydown", (event) => {
  const key = event.key.toUpperCase();
  if (key === "ENTER") submitWord();
  if (key === "BACKSPACE" || key === "ESCAPE") clearSelection();
  if (/^[A-Z]$/.test(key)) selectFirstAvailableLetter(key);
});

window.addEventListener("resize", layoutGame);

startPuzzle(true);

function startPuzzle(preserveProgress = false) {
  const puzzle = currentPuzzle();
  if (!puzzle) {
    endGame();
    return;
  }

  applyPuzzleTheme(puzzle.theme);
  isGameComplete = false;
  selected = [];
  if (!preserveProgress) {
    found = new Set();
    revealed = {};
    currentLetters = createPuzzle(currentPuzzleId).letters;
  }
  levelNumber.textContent = currentPuzzleId + 1;
  coinsDisplay.textContent = coins;
  renderBoard();
  renderWheel();
  updateCurrentWord();
  setMessage("Select letters to make a word.");
  layoutGame();
}

function renderBoard() {
  board.innerHTML = "";
  const puzzle = currentPuzzle();
  if (!puzzle) return;

  const layout = crosswordLayoutForWords(puzzle.words);
  board.style.setProperty("--grid-cols", layout.cols);
  board.style.setProperty("--grid-rows", layout.rows);
  const grid = document.createElement("div");
  grid.className = "crossword-grid";
  grid.style.setProperty("--grid-cols", layout.cols);
  grid.style.setProperty("--grid-rows", layout.rows);

  layout.cells.forEach((cellData) => {
    const cell = document.createElement("div");
    cell.className = "cell crossword-cell";
    cell.style.gridColumn = `${cellData.col + 1}`;
    cell.style.gridRow = `${cellData.row + 1}`;
    cell.setAttribute("aria-label", "Hidden letter");

    const visibleEntry = cellData.entries.find((entry) => found.has(entry.word) || revealed[entry.word]?.has(entry.index));
    if (visibleEntry) {
      cell.textContent = cellData.letter;
      cell.classList.add("revealed");
      cell.setAttribute("aria-label", cellData.letter);
    }
    const spokenEntry = cellData.entries.find((entry) => found.has(entry.word));
    if (spokenEntry) {
      makeSpeakable(cell, spokenEntry.word, "en-US", `Say ${spokenEntry.word}`, simpleSentenceForWord(spokenEntry.word));
    }
    if (cellData.entries.length > 1) {
      cell.classList.add("shared");
    }
    grid.appendChild(cell);
  });

  const meanings = document.createElement("div");
  meanings.className = "meaning-panel";
  meanings.setAttribute("aria-label", "Found word meanings");

  puzzle.words.forEach((word) => {
    if (!found.has(word)) return;
    const meaning = document.createElement("span");
    meaning.className = "meaning-chip";
    const meaningText = meaningForWord(word);
    if (!meaningText) return;
    meaning.textContent = meaningText;
    makeSpeakable(meaning, meaningText, "zh-CN", `Say ${meaningText}`, simpleSentenceForMeaning(meaningText));
    meanings.appendChild(meaning);
  });

  board.appendChild(grid);
  board.appendChild(meanings);

  layoutGame();
}

function crosswordLayoutForWords(words) {
  const key = words.slice().sort().join("|");
  if (crosswordLayoutCache.has(key)) return crosswordLayoutCache.get(key);

  const sortedWords = words.slice().sort((a, b) => b.length - a.length || a.localeCompare(b));
  const placed = [];
  const occupied = new Map();

  placeWord(sortedWords[0], 0, 0, "across", placed, occupied);

  sortedWords.slice(1).forEach((word) => {
    const candidate = bestCrosswordCandidate(word, placed, occupied);
    if (candidate) {
      placeWord(word, candidate.row, candidate.col, candidate.direction, placed, occupied);
      return;
    }
    const bounds = boundsForPlaced(placed);
    placeWord(word, bounds.maxRow + 2, bounds.minCol, "across", placed, occupied);
  });

  const bounds = boundsForPlaced(placed);
  const normalizedCells = new Map();
  placed.forEach((entry) => {
    for (let index = 0; index < entry.word.length; index += 1) {
      const row = entry.row + (entry.direction === "down" ? index : 0) - bounds.minRow;
      const col = entry.col + (entry.direction === "across" ? index : 0) - bounds.minCol;
      const keyForCell = `${row},${col}`;
      const cell = normalizedCells.get(keyForCell) || {
        row,
        col,
        letter: entry.word[index],
        entries: []
      };
      cell.entries.push({ word: entry.word, index });
      normalizedCells.set(keyForCell, cell);
    }
  });

  const layout = {
    rows: bounds.maxRow - bounds.minRow + 1,
    cols: bounds.maxCol - bounds.minCol + 1,
    cells: [...normalizedCells.values()].sort((a, b) => a.row - b.row || a.col - b.col)
  };
  crosswordLayoutCache.set(key, layout);
  return layout;
}

function bestCrosswordCandidate(word, placed, occupied) {
  let best = null;
  placed.forEach((entry) => {
    for (let placedIndex = 0; placedIndex < entry.word.length; placedIndex += 1) {
      for (let wordIndex = 0; wordIndex < word.length; wordIndex += 1) {
        if (word[wordIndex] !== entry.word[placedIndex]) continue;
        const direction = entry.direction === "across" ? "down" : "across";
        const row = entry.row + (entry.direction === "down" ? placedIndex : 0) - (direction === "down" ? wordIndex : 0);
        const col = entry.col + (entry.direction === "across" ? placedIndex : 0) - (direction === "across" ? wordIndex : 0);
        if (!canPlaceWord(word, row, col, direction, occupied)) continue;
        const score = crosswordCandidateScore(word, row, col, direction, occupied);
        if (!best || score > best.score) {
          best = { row, col, direction, score };
        }
      }
    }
  });
  return best;
}

function canPlaceWord(word, row, col, direction, occupied) {
  let overlaps = 0;
  for (let index = 0; index < word.length; index += 1) {
    const cellRow = row + (direction === "down" ? index : 0);
    const cellCol = col + (direction === "across" ? index : 0);
    const cell = occupied.get(`${cellRow},${cellCol}`);
    if (cell && cell.letter !== word[index]) return false;
    if (cell) overlaps += 1;
  }
  return overlaps > 0;
}

function crosswordCandidateScore(word, row, col, direction, occupied) {
  let overlaps = 0;
  const rows = [];
  const cols = [];
  for (let index = 0; index < word.length; index += 1) {
    const cellRow = row + (direction === "down" ? index : 0);
    const cellCol = col + (direction === "across" ? index : 0);
    rows.push(cellRow);
    cols.push(cellCol);
    if (occupied.has(`${cellRow},${cellCol}`)) overlaps += 1;
  }
  const width = Math.max(...cols) - Math.min(...cols) + 1;
  const height = Math.max(...rows) - Math.min(...rows) + 1;
  return overlaps * 100 - width - height;
}

function placeWord(word, row, col, direction, placed, occupied) {
  placed.push({ word, row, col, direction });
  for (let index = 0; index < word.length; index += 1) {
    const cellRow = row + (direction === "down" ? index : 0);
    const cellCol = col + (direction === "across" ? index : 0);
    const key = `${cellRow},${cellCol}`;
    const cell = occupied.get(key) || { letter: word[index], entries: [] };
    cell.entries.push({ word, index });
    occupied.set(key, cell);
  }
}

function boundsForPlaced(placed) {
  const rows = [];
  const cols = [];
  placed.forEach((entry) => {
    for (let index = 0; index < entry.word.length; index += 1) {
      rows.push(entry.row + (entry.direction === "down" ? index : 0));
      cols.push(entry.col + (entry.direction === "across" ? index : 0));
    }
  });
  return {
    minRow: Math.min(...rows),
    maxRow: Math.max(...rows),
    minCol: Math.min(...cols),
    maxCol: Math.max(...cols)
  };
}

function renderWheel() {
  wheel.innerHTML = "";
  const puzzle = currentPuzzle();
  if (!puzzle) return;

  const letters = puzzle.letters.split("");
  const radius = 38;

  letters.forEach((letter, index) => {
    const angle = (index / letters.length) * Math.PI * 2 - Math.PI / 2;
    const button = document.createElement("button");
    button.type = "button";
    button.className = "letter";
    button.textContent = letter;
    button.dataset.index = index;
    button.dataset.letter = letter;
    button.style.left = `${50 + Math.cos(angle) * radius}%`;
    button.style.top = `${50 + Math.sin(angle) * radius}%`;
    button.style.transform = "translate(-50%, -50%)";
    button.addEventListener("click", () => toggleLetter(index, letter));
    wheel.appendChild(button);
  });

  layoutGame();
}

function toggleLetter(index, letter) {
  if (isGameComplete) return;

  const selectedIndex = selected.findIndex((item) => item.index === index);
  if (selectedIndex >= 0) {
    selected.splice(selectedIndex, 1);
  } else {
    selected.push({ index, letter });
  }
  updateCurrentWord();
}

function selectFirstAvailableLetter(letter) {
  if (isGameComplete) return;

  const buttons = [...document.querySelectorAll(".letter")];
  const match = buttons.find((button) => {
    const index = Number(button.dataset.index);
    return button.dataset.letter === letter && !selected.some((item) => item.index === index);
  });

  if (match) {
    toggleLetter(Number(match.dataset.index), match.dataset.letter);
  }
}

function updateCurrentWord() {
  currentWord.textContent = selected.map((item) => item.letter).join("");
  document.querySelectorAll(".letter").forEach((button) => {
    const index = Number(button.dataset.index);
    button.classList.toggle("selected", selected.some((item) => item.index === index));
  });
}

function submitWord() {
  if (isGameComplete) return;

  const word = selected.map((item) => item.letter).join("");
  const puzzle = currentPuzzle();
  if (!puzzle) return;

  if (word.length < 3) {
    setMessage("Words need at least three letters.");
    return;
  }

  if (!puzzle.words.includes(word)) {
    setMessage(`${word} is not on this board.`);
    clearSelection(false);
    return;
  }

  if (found.has(word)) {
    setMessage(`${word} is already found.`);
    clearSelection(false);
    return;
  }

  found.add(word);
  coins += word.length;
  coinsDisplay.textContent = coins;
  clearSelection(false);
  renderBoard();
  saveGameState();

  if (found.size === puzzle.words.length) {
    setMessage("Puzzle complete. Loading the next board...");
    setTimeout(nextPuzzle, 900);
  } else {
    setMessage(`Nice: ${word}!`);
  }
}

function clearSelection(showMessage = true) {
  selected = [];
  updateCurrentWord();
  if (showMessage) setMessage("Selection cleared.");
}

function shuffleLetters() {
  if (isGameComplete) return;

  const puzzle = currentPuzzle();
  if (!puzzle) return;

  const letters = puzzle.letters.split("");
  for (let i = letters.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [letters[i], letters[j]] = [letters[j], letters[i]];
  }
  currentLetters = letters.join("");
  clearSelection(false);
  renderWheel();
  setMessage("Letters shuffled.");
  saveGameState();
}

function useHint() {
  if (isGameComplete) return;

  if (coins < 10) {
    setMessage("You need 10 coins for a hint.");
    return;
  }

  const puzzle = currentPuzzle();
  if (!puzzle) return;

  const hiddenWord = puzzle.words.find((word) => !found.has(word));
  if (!hiddenWord) return;

  const hiddenIndexes = [...hiddenWord].map((_, index) => index).filter((index) => {
    return !revealed[hiddenWord]?.has(index);
  });

  if (hiddenIndexes.length === 0) {
    setMessage("That word already has all hint letters.");
    return;
  }

  coins -= 10;
  revealed[hiddenWord] ||= new Set();
  revealed[hiddenWord].add(hiddenIndexes[0]);
  coinsDisplay.textContent = coins;
  renderBoard();
  setMessage("Hint revealed.");
  saveGameState();
}

function nextPuzzle() {
  currentPuzzleId += 1;
  found = new Set();
  revealed = {};
  currentLetters = createInitialLetters(currentPuzzleId);
  saveGameState();

  if (currentPuzzleId >= TOTAL_PUZZLES) {
    endGame();
    return;
  }

  startPuzzle();
}

function exitGame() {
  clearSelection(false);
  saveGameState();
  if ("speechSynthesis" in window) {
    window.speechSynthesis.cancel();
  }

  window.close();
  setTimeout(showExitScreen, 120);
}

function showExitScreen() {
  shell.hidden = true;
  exitScreen.hidden = false;
}

function setMessage(text) {
  message.textContent = text;
  layoutGame();
}

function makeSpeakable(element, text, language, label, sentence) {
  element.classList.add("speakable");
  element.setAttribute("role", "button");
  element.setAttribute("tabindex", "0");
  element.setAttribute("aria-label", `${label}. Double click for a simple sentence.`);
  element.title = `${label}. Double click for a simple sentence.`;
  element.addEventListener("click", () => speakText(text, language));
  element.addEventListener("dblclick", (event) => {
    event.preventDefault();
    showSimpleSentence(sentence, language);
  });
  element.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      speakText(text, language);
    }
    if (event.key.toLowerCase() === "s") {
      event.preventDefault();
      showSimpleSentence(sentence, language);
    }
  });
}

function showSimpleSentence(sentence, language) {
  setMessage(sentence);
  speakText(sentence, language, false);
}

function speakText(text, language, showStatus = true) {
  if (!("speechSynthesis" in window) || !("SpeechSynthesisUtterance" in window)) {
    setMessage("Pronunciation is not available in this browser.");
    return;
  }

  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = language;
  utterance.rate = language === "zh-CN" ? 0.82 : 0.9;
  window.speechSynthesis.speak(utterance);
  if (showStatus) {
    setMessage(`Pronouncing ${text}.`);
  }
}

function simpleSentenceForWord(word) {
  return `I know the word ${word.toLowerCase()}.`;
}

function simpleSentenceForMeaning(meaning) {
  return `\u6211\u77e5\u9053\u201c${meaning}\u201d\u8fd9\u4e2a\u8bcd\u3002`;
}

function meaningForWord(word) {
  return GENERATED_CHINESE_MEANINGS[word] || decodeMojibake(chineseMeanings[word]) || "";
}

function decodeMojibake(value) {
  if (!value) return "";

  try {
    return decodeURIComponent(escape(value));
  } catch {
    return value;
  }
}

function layoutGame() {
  requestAnimationFrame(() => {
    const puzzle = currentPuzzle();
    if (!puzzle) return;

    const layout = crosswordLayoutForWords(puzzle.words);
    const shellStyles = getComputedStyle(shell);
    const gap = parseFloat(shellStyles.gap) || 6;
    const usableHeight = Math.max(120, shell.clientHeight
      - topBar.offsetHeight
      - entryPanel.offsetHeight
      - controls.offsetHeight
      - gap * 4);
    const usableWidth = boardWrap.clientWidth;
    const boardGap = 5;
    const cellGap = 3;
    const isPhone = window.innerWidth <= 520;
    const meaningHeight = found.size ? (isPhone ? 26 : 30) : 0;
    const wheelHeightShare = isPhone ? 0.3 : 0.35;
    const wheelWidthShare = isPhone ? 0.47 : 0.52;
    const maxCell = isPhone ? 40 : 46;
    const maxWheel = isPhone ? 190 : 230;
    const maxLetter = isPhone ? 44 : 52;

    const maxWheelSize = Math.max(58, Math.min(maxWheel, usableWidth * wheelWidthShare, usableHeight * 0.48));
    let wheelSize = clamp(Math.floor(usableHeight * wheelHeightShare), 58, maxWheelSize);
    let boardHeight = Math.max(70, usableHeight - wheelSize);
    let cellSize = Math.floor(Math.min(
      maxCell,
      (usableWidth - (layout.cols - 1) * cellGap) / layout.cols,
      (boardHeight - meaningHeight - (layout.rows - 1) * cellGap) / layout.rows
    ));

    cellSize = clamp(cellSize, 14, maxCell);

    let neededBoardHeight = layout.rows * cellSize + (layout.rows - 1) * cellGap + meaningHeight;
    if (neededBoardHeight + wheelSize > usableHeight) {
      wheelSize = clamp(usableHeight - neededBoardHeight, 52, wheelSize);
    }

    if (neededBoardHeight + wheelSize > usableHeight) {
      boardHeight = Math.max(44, usableHeight - wheelSize);
      cellSize = Math.floor((boardHeight - meaningHeight - (layout.rows - 1) * cellGap) / layout.rows);
      cellSize = clamp(cellSize, 11, maxCell);
    }

    shell.style.setProperty("--board-gap", `${boardGap}px`);
    shell.style.setProperty("--cell-gap", `${cellGap}px`);
    shell.style.setProperty("--cell-size", `${cellSize}px`);
    shell.style.setProperty("--wheel-size", `${Math.max(64, Math.floor(wheelSize))}px`);
    shell.style.setProperty("--letter-size", `${clamp(Math.floor(wheelSize * 0.22), 23, maxLetter)}px`);
  });
}

function currentPuzzle() {
  return createPuzzle(currentPuzzleId);
}

function createPuzzle(id) {
  if (id < 0 || id >= TOTAL_PUZZLES) return null;
  if (WORD_BANK.length) return createWordBankPuzzle(id);

  const template = puzzleTemplates[id % puzzleTemplates.length];
  const letters = id === currentPuzzleId && currentLetters
    ? currentLetters
    : shuffleWithSeed(template.letters, id + 1);

  return {
    id,
    letters,
    theme: puzzleThemes[id % puzzleThemes.length],
    words: rotateWords(limitPuzzleWords(template.words, template.letters), id)
  };
}

function createWordBankPuzzle(id) {
  const sourceWord = WORD_BANK[id % WORD_BANK.length];
  const answers = wordsForSource(sourceWord);
  const letters = id === currentPuzzleId && currentLetters && sameLetters(currentLetters, sourceWord)
    ? currentLetters
    : shuffleWithSeed(sourceWord, id + 1);

  return {
    id,
    letters,
    theme: puzzleThemes[id % puzzleThemes.length],
    words: rotateWords(answers, id)
  };
}

function wordsForSource(sourceWord) {
  if (generatedAnswerCache.has(sourceWord)) return generatedAnswerCache.get(sourceWord);

  const sourceCounts = letterCounts(sourceWord);
  const matchingWords = ANSWER_WORD_BANK.filter((word) => {
    return word.length >= 3 && word.length <= sourceWord.length && canBuildWord(word, sourceCounts);
  });
  const shortWords = matchingWords
    .filter((word) => word !== sourceWord)
    .sort((a, b) => a.length - b.length || a.localeCompare(b))
    .slice(0, MAX_WORDS_PER_PUZZLE - 1);

  const answers = limitPuzzleWords([...shortWords, sourceWord], sourceWord);
  generatedAnswerCache.set(sourceWord, answers);
  return answers;
}

function limitPuzzleWords(words, sourceWord) {
  const uniqueWords = [...new Set(words)];
  const source = uniqueWords.includes(sourceWord) ? sourceWord : uniqueWords[uniqueWords.length - 1];
  const smallerWords = uniqueWords
    .filter((word) => word !== source)
    .sort((a, b) => a.length - b.length || a.localeCompare(b))
    .slice(0, MAX_WORDS_PER_PUZZLE - 1);

  return [...smallerWords, source]
    .sort((a, b) => a.length - b.length || a.localeCompare(b));
}

function canBuildWord(word, sourceCounts) {
  const counts = letterCounts(word);
  return Object.entries(counts).every(([letter, count]) => count <= (sourceCounts[letter] || 0));
}

function letterCounts(word) {
  return [...word].reduce((counts, letter) => {
    counts[letter] = (counts[letter] || 0) + 1;
    return counts;
  }, {});
}

function applyPuzzleTheme(theme) {
  document.body.dataset.theme = theme || "plant";
}

function rotateWords(words, id) {
  const offset = id % words.length;
  return words.slice(offset).concat(words.slice(0, offset));
}

function shuffleWithSeed(value, seed) {
  const letters = value.split("");
  const random = seededRandom(seed);
  for (let i = letters.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1));
    [letters[i], letters[j]] = [letters[j], letters[i]];
  }
  return letters.join("");
}

function seededRandom(seed) {
  let state = seed >>> 0;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

function endGame() {
  applyPuzzleTheme("complete");
  isGameComplete = true;
  selected = [];
  found = new Set();
  revealed = {};
  board.innerHTML = "";
  wheel.innerHTML = "";
  currentWord.textContent = "Done";
  levelNumber.textContent = TOTAL_PUZZLES;
  setMessage(`All ${TOTAL_PUZZLES} puzzles complete. Great job!`);
  saveGameState();
}

function loadGameState() {
  const legacyCompletedIds = loadLegacyCompletedPuzzleIds();
  const fallbackCurrentId = clamp(legacyCompletedIds.size, 0, TOTAL_PUZZLES);
  const fallback = {
    currentPuzzleId: fallbackCurrentId,
    currentLetters: createInitialLetters(fallbackCurrentId),
    coins: STARTING_COINS,
    foundWords: [],
    revealedLetters: {},
    isGameComplete: fallbackCurrentId >= TOTAL_PUZZLES
  };

  try {
    const parsed = JSON.parse(localStorage.getItem(GAME_STATE_KEY) || "null");
    if (!parsed) return fallback;

    const currentId = Number.isInteger(parsed.currentPuzzleId)
      ? clamp(parsed.currentPuzzleId, 0, TOTAL_PUZZLES)
      : migrateLegacyCurrentId(parsed, fallbackCurrentId);
    const puzzle = createPuzzleForValidation(currentId);
    const letters = puzzle && sameLetters(parsed.currentLetters, puzzle.letters)
      ? parsed.currentLetters
      : createInitialLetters(currentId);

    return {
      currentPuzzleId: currentId,
      currentLetters: letters,
      coins: Number.isInteger(parsed.coins) ? Math.max(parsed.coins, STARTING_COINS) : STARTING_COINS,
      foundWords: validWordsForPuzzle(parsed.foundWords, puzzle),
      revealedLetters: validRevealedLetters(parsed.revealedLetters, puzzle),
      isGameComplete: currentId >= TOTAL_PUZZLES
    };
  } catch {
    return fallback;
  }
}

function saveGameState() {
  localStorage.setItem(GAME_STATE_KEY, JSON.stringify({
    currentPuzzleId,
    currentLetters,
    coins,
    foundWords: [...found],
    revealedLetters: revealedSetsToObject(),
    isGameComplete
  }));
  localStorage.setItem(LEGACY_COMPLETED_PUZZLES_KEY, JSON.stringify([...Array(Math.min(currentPuzzleId, TOTAL_PUZZLES)).keys()]));
}

function createPuzzleForValidation(id) {
  if (id < 0 || id >= TOTAL_PUZZLES) return null;
  if (WORD_BANK.length) {
    const sourceWord = WORD_BANK[id % WORD_BANK.length];
    return {
      letters: sourceWord,
      words: rotateWords(wordsForSource(sourceWord), id)
    };
  }

  const template = puzzleTemplates[id % puzzleTemplates.length];
  return {
    letters: template.letters,
    words: rotateWords(limitPuzzleWords(template.words, template.letters), id)
  };
}

function createInitialLetters(id) {
  return createPuzzleForValidation(id)
    ? shuffleWithSeed(createPuzzleForValidation(id).letters, id + 1)
    : "";
}

function migrateLegacyCurrentId(parsed, fallbackId) {
  if (!Array.isArray(parsed.remainingPuzzles) || !parsed.remainingPuzzles[0]) return fallbackId;
  return Number.isInteger(parsed.remainingPuzzles[0].id)
    ? clamp(parsed.remainingPuzzles[0].id, 0, TOTAL_PUZZLES)
    : fallbackId;
}

function loadLegacyCompletedPuzzleIds() {
  try {
    const savedIds = JSON.parse(localStorage.getItem(LEGACY_COMPLETED_PUZZLES_KEY) || "[]");
    if (!Array.isArray(savedIds)) return new Set();
    return new Set(savedIds.filter((id) => Number.isInteger(id) && id >= 0 && id < TOTAL_PUZZLES));
  } catch {
    return new Set();
  }
}

function validWordsForPuzzle(words, puzzle) {
  if (!Array.isArray(words) || !puzzle) return [];
  return words.filter((word) => puzzle.words.includes(word));
}

function validRevealedLetters(savedRevealed, puzzle) {
  if (!savedRevealed || typeof savedRevealed !== "object" || !puzzle) return {};

  return Object.fromEntries(Object.entries(savedRevealed)
    .filter(([word]) => puzzle.words.includes(word))
    .map(([word, indexes]) => [
      word,
      Array.isArray(indexes)
        ? indexes.filter((index) => Number.isInteger(index) && index >= 0 && index < word.length)
        : []
    ]));
}

function objectToRevealedSets(savedRevealed) {
  return Object.fromEntries(Object.entries(savedRevealed || {})
    .map(([word, indexes]) => [word, new Set(indexes)]));
}

function revealedSetsToObject() {
  return Object.fromEntries(Object.entries(revealed)
    .map(([word, indexes]) => [word, [...indexes]]));
}

function sameLetters(value, original) {
  if (typeof value !== "string" || value.length !== original.length) return false;
  return value.split("").sort().join("") === original.split("").sort().join("");
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}
