const nextBtn = document.querySelector("#next-btn");
const quizBox = document.querySelector("#quiz-box");
const choicesContainer = document.querySelector("#choice-container");
const arrayOfChoiceContainer = document.querySelectorAll(".choice-button");
const timeDisplay = document.querySelector("#time-left");
const loader = document.querySelector(".loader");
const highScoreContainer = document.querySelector("#high-score-container");
const highScoreList = document.querySelector(".high-score-list");
const playAgainBtn = document.querySelector("#play-again-btn");
const questionText = document.querySelector("#question-text");
const questionNumber = document.querySelector("#question-number");

const TRIVIA_BASE_URL =
  "https://opentdb.com/api.php?amount=10&difficulty=medium";

const PANTRY_API_URL =
  "https://proxy-api-git-main-eyobs-projects-744eeb5a.vercel.app/quiz-scores";

let currentQuestionIndex = 9;
let questions = [];
let timer;
let totalTime = 10000;
let timerinterval;
let toatalScore = 0;
let highScores = [];
let startTime;

async function fetchQuestions() {
  try {
    const response = await fetch(TRIVIA_BASE_URL);
    const data = await response.json();
    questions = data.results;
    loadQuestion();
  } catch (err) {
    console.error(err);
    questionText.textContent = "Failed to load questions, please try again!";
  }
}

function loadQuestion() {
  if (currentQuestionIndex >= questions.length) {
    endGame();
    return;
  }
  const question = questions[currentQuestionIndex];
  questionNumber.textContent = `Question ${currentQuestionIndex + 1}`;
  questionText.textContent = decodeHTML(question.question);
  const choices = [...question.incorrect_answers, question.correct_answer];
  const shuffledChoice = shuffleArray(choices);
  nextBtn.disabled = true;

  shuffledChoice.forEach((choice) => {
    choice = choice.trim();
    const choiceElement = document.createElement("button");
    choiceElement.classList.add("choice-button");
    choiceElement.textContent = decodeHTML(choice);

    choicesContainer.appendChild(choiceElement);
    choiceElement.addEventListener("click", () =>
      selectAnswer(choice, question.correct_answer.trim())
    );
  });
  resetTimer();
  startTimer();
}

function shuffleArray(choices) {
  for (let i = choices.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [choices[i], choices[j]] = [choices[j], choices[i]];
  }

  return choices;
}

nextBtn.addEventListener("click", () => {
  currentQuestionIndex++;

  choicesContainer.innerHTML = "";
  loadQuestion();
});

function selectAnswer(selectedAnswer, correctAnswer) {
  disableButtons();
  clearInterval(timerinterval);

  nextBtn.disabled = false;
  const choices = document.querySelectorAll(".choice-button");
  choices.forEach((choice) => {
    if (choice.innerText === decodeHTML(correctAnswer)) {
      choice.classList.add("correct");
    } else {
      choice.classList.add("incorrect");
    }
    choice.disabled = true;
  });

  if (selectedAnswer === correctAnswer) {
    const elapsedTime = Date.now() - startTime;
    const timeLeft = totalTime - elapsedTime;
    const calculatedScore = Math.floor((timeLeft / totalTime) * 1000);
    toatalScore += calculatedScore;

    console.log("Score: ", toatalScore, calculatedScore);
  }
}

function decodeHTML(html) {
  const txt = document.createElement("div");
  txt.innerHTML = html;
  return txt.textContent;
}

function startTimer() {
  startTime = Date.now();
  let timeLeft = totalTime;
  updateTimerDislay(timeLeft);

  timerinterval = setInterval(() => {
    const elapsedTime = Date.now() - startTime;
    timeLeft = totalTime - elapsedTime;

    if (timeLeft <= 0) {
      clearInterval(timerinterval);
      updateTimerDislay(0);
      disableButtons();
      highlightCorectAnswer(questions[currentQuestionIndex].correct_answer);

      nextBtn.disabled = false;
    } else {
      updateTimerDislay(timeLeft);
    }
  }, 50);
}

function updateTimerDislay(timeLeft) {
  const seconds = (timeLeft / 1000).toFixed(2);
  timeDisplay.innerText = seconds;
}

function resetTimer() {
  clearInterval(timerinterval);
}

function disableButtons() {
  const choices = document.querySelectorAll(".choice-button");
  choices.forEach((choice) => {
    choice.disabled = true;
  });
}

function highlightCorectAnswer(correctAnswer) {
  const choices = document.querySelectorAll(".choice-button");
  choices.forEach((choice) => {
    if (choice.innerText === decodeHTML(correctAnswer)) {
      choice.classList.add("correct");
    }
  });
}

function endGame() {
  quizBox.classList.add("hidden");
  saveHighScore();
}

async function saveHighScore() {
  const name = prompt("Enter your name for high score!");
  const date = new Date().toLocaleDateString();
  loader.classList.remove("hidden");
  let createdAt = new Date().getTime();
  const newScore = {
    createdAt: createdAt,
    name,
    score: toatalScore,
    date,
  };

  try {
    const response = await fetch(PANTRY_API_URL);
    const data = await response.json();
    highScores = data.highScores || [];
  } catch (err) {
    console.log("Failed to fetch high scores", err.message);
    highScores = [];
  }

  highScores.push(newScore);

  highScores.sort((a, b) => b.score - a.score);
  highScores = highScores.slice(0, 10);

  try {
    const response = await fetch(PANTRY_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ highScores }),
    });
    const data = await response.json();
    loader.classList.add("hidden");
    highScoreContainer.style.display = "block flex";
  } catch (err) {
    console.log("Failed to save high score", err.message);
  }

  displayHighScores(newScore);
}

displayHighScores = (newScore) => {
  highScoreList.innerHTML = "";
  highScores.forEach((score, index) => {
    const row = document.createElement("tr");
    const nameCell = document.createElement("td");
    const scoreCell = document.createElement("td");
    const dateCell = document.createElement("td");
    nameCell.textContent = score.name;
    scoreCell.textContent = score.score;
    dateCell.textContent = score.date;

    row.appendChild(nameCell);
    row.appendChild(scoreCell);
    row.appendChild(dateCell);

    if (score.createdAt === newScore.createdAt) {
      row.classList.add("highlight");
    }
    highScoreList.appendChild(row);
  });
};

fetchQuestions();
