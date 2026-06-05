const yesButton = document.querySelector("#yes-button");
const noButton = document.querySelector("#no-button");
const decisionZone = document.querySelector("#decision-zone");
const introPanel = document.querySelector(".intro-panel");
const datePanel = document.querySelector("#date-panel");
const noPanel = document.querySelector("#no-panel");
const thanksPanel = document.querySelector("#thanks-panel");
const dateForm = document.querySelector("#date-form");
const noForm = document.querySelector("#no-form");
const backButton = document.querySelector("#back-button");
const tryAgainButton = document.querySelector("#try-again-button");
const thanksKicker = document.querySelector("#thanks-kicker");
const thanksTitle = document.querySelector("#thanks-title");
const thanksCopy = document.querySelector("#thanks-copy");
const choicePopup = document.querySelector("#choice-popup");
const noCounter = document.querySelector("#no-counter");
const noCount = document.querySelector("#no-count");
const allowedDateValues = new Set([
  "2026-06-07",
  "2026-06-08",
  "2026-06-09",
  "2026-06-11",
]);
const finePointerQuery = window.matchMedia("(hover: hover) and (pointer: fine)");
const requiredNoPresses = 3;

let choicePopupTimer;
let noPressCount = 0;
const noMotion = {
  x: 120,
  y: 22,
  vx: 0,
  vy: 0,
  pointerX: 0,
  pointerY: 0,
  hasPointer: false,
  driftPhase: Math.random() * Math.PI * 2,
};

function showPanel(panel) {
  [introPanel, datePanel, noPanel, thanksPanel].forEach((item) => {
    item.hidden = item !== panel;
  });

  if (panel === introPanel) {
    resetNoButton();
    resetNoPresses();
  } else if (choicePopup) {
    choicePopup.hidden = true;
  }

  panel.scrollIntoView({ behavior: "smooth", block: "center" });
}

function resetNoButton() {
  noButton.classList.remove("catchable");
  noMotion.vx = 0;
  noMotion.vy = 0;

  const position = getDefaultNoPosition();
  setNoButtonPosition(position.x, position.y);
}

function resetNoPresses() {
  noPressCount = 0;
  noCount.textContent = "0";
  noCounter.hidden = true;
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function getNoBounds() {
  const zoneRect = decisionZone.getBoundingClientRect();
  const buttonRect = noButton.getBoundingClientRect();

  return {
    zoneRect,
    buttonRect,
    maxLeft: Math.max(0, zoneRect.width - buttonRect.width),
    maxTop: Math.max(0, zoneRect.height - buttonRect.height),
  };
}

function getDefaultNoPosition() {
  const { maxLeft, maxTop } = getNoBounds();

  return {
    x: clamp(128, 0, maxLeft),
    y: clamp(22, 0, maxTop),
  };
}

function setNoButtonPosition(x, y) {
  noMotion.x = x;
  noMotion.y = y;
  noButton.style.transform = `translate3d(${x}px, ${y}px, 0)`;
}

function updateNoPointer(event) {
  if (event.pointerType !== "mouse" && event.pointerType !== "pen") {
    return;
  }

  noMotion.pointerX = event.clientX;
  noMotion.pointerY = event.clientY;
  noMotion.hasPointer = true;
}

function easeNoButtonHome(maxLeft, maxTop) {
  const home = getDefaultNoPosition();
  const targetX = clamp(home.x, 0, maxLeft);
  const targetY = clamp(home.y, 0, maxTop);

  noMotion.vx += (targetX - noMotion.x) * 0.06;
  noMotion.vy += (targetY - noMotion.y) * 0.06;
}

function repelNoButton(zoneRect, buttonRect, maxLeft, maxTop) {
  const centerX = zoneRect.left + noMotion.x + buttonRect.width / 2;
  const centerY = zoneRect.top + noMotion.y + buttonRect.height / 2;
  const deltaX = centerX - noMotion.pointerX;
  const deltaY = centerY - noMotion.pointerY;
  const distance = Math.max(1, Math.hypot(deltaX, deltaY));
  const screenReach = Math.max(window.innerWidth, window.innerHeight) * 0.72;
  const strength = clamp(1 - distance / screenReach, 0.06, 1);
  const closeBoost = distance < 105 ? 1.45 : 1;
  const push = (8 + strength * strength * 48) * closeBoost;
  const targetX = clamp(noMotion.x + (deltaX / distance) * push, 0, maxLeft);
  const targetY = clamp(noMotion.y + (deltaY / distance) * push, 0, maxTop);

  noMotion.vx += (targetX - noMotion.x) * 0.15;
  noMotion.vy += (targetY - noMotion.y) * 0.15;
}

function shouldDriftNoButton() {
  return !finePointerQuery.matches && !noMotion.hasPointer;
}

function driftNoButton(maxLeft, maxTop) {
  const now = performance.now() / 1000;
  const minX = Math.min(122, maxLeft);
  const usableWidth = Math.max(0, maxLeft - minX);
  const targetX =
    minX + usableWidth * (0.5 + 0.47 * Math.sin(now * 0.95 + noMotion.driftPhase));
  const targetY =
    maxTop * (0.5 + 0.44 * Math.sin(now * 1.28 + noMotion.driftPhase + 1.7));

  noMotion.vx += (targetX - noMotion.x) * 0.018;
  noMotion.vy += (targetY - noMotion.y) * 0.02;
}

function animateNoButton() {
  if (!introPanel.hidden) {
    const { zoneRect, buttonRect, maxLeft, maxTop } = getNoBounds();
    const isDrifting = shouldDriftNoButton();

    if (noMotion.hasPointer) {
      repelNoButton(zoneRect, buttonRect, maxLeft, maxTop);
    } else if (isDrifting) {
      driftNoButton(maxLeft, maxTop);
    } else {
      easeNoButtonHome(maxLeft, maxTop);
    }

    noMotion.vx *= 0.74;
    noMotion.vy *= 0.74;

    const speed = Math.hypot(noMotion.vx, noMotion.vy);
    const maxSpeed = isDrifting ? 2.7 : 5.8;

    if (speed > maxSpeed) {
      noMotion.vx = (noMotion.vx / speed) * maxSpeed;
      noMotion.vy = (noMotion.vy / speed) * maxSpeed;
    }

    setNoButtonPosition(
      clamp(noMotion.x + noMotion.vx, 0, maxLeft),
      clamp(noMotion.y + noMotion.vy, 0, maxTop)
    );
  }

  window.requestAnimationFrame(animateNoButton);
}

window.addEventListener("pointermove", updateNoPointer);
window.addEventListener("pointerleave", () => {
  noMotion.hasPointer = false;
});
window.addEventListener("blur", () => {
  noMotion.hasPointer = false;
});
window.addEventListener("resize", resetNoButton);

resetNoButton();
animateNoButton();

yesButton.addEventListener("click", () => {
  const firstOption = document.querySelector("input[name='datePlan']:not(:disabled)");
  if (firstOption && !document.querySelector("input[name='datePlan']:checked")) {
    firstOption.checked = true;
  }
  showPanel(datePanel);
});

noButton.addEventListener("click", () => {
  noPressCount += 1;
  noCount.textContent = String(noPressCount);
  noCounter.hidden = false;

  if (noPressCount >= requiredNoPresses) {
    showPanel(noPanel);
    return;
  }

  noMotion.vx += 2.3;
  noMotion.vy += noPressCount % 2 === 0 ? -1.8 : 1.8;
});

backButton.addEventListener("click", () => {
  showPanel(introPanel);
});

tryAgainButton.addEventListener("click", () => {
  showPanel(introPanel);
});

function makePlainText(submission) {
  const lines = [
    `Decision: ${submission.decision}`,
  ];

  if (submission.datePlan) lines.push(`Date idea: ${submission.datePlan}`);
  if (submission.date) lines.push(`Date: ${submission.date}`);
  if (submission.time) lines.push(`Time: ${submission.time}`);
  if (submission.note) lines.push(`Note: ${submission.note}`);

  return lines.join("\n");
}

async function sendDecision(submission) {
  const response = await fetch("/api/decision", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(submission),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || "The email could not be sent.");
  }

  return response.json();
}

function openMailFallback(submission) {
  const subject = encodeURIComponent(`Second date answer: ${submission.decision}`);
  const body = encodeURIComponent(makePlainText(submission));
  window.location.href = `mailto:mitch1.alley@gmail.com?subject=${subject}&body=${body}`;
}

function setSubmitting(form, isSubmitting) {
  const buttons = form.querySelectorAll("button");
  buttons.forEach((button) => {
    button.disabled = isSubmitting;
  });
}

function showChoicePopup() {
  if (!choicePopup) {
    return;
  }

  window.clearTimeout(choicePopupTimer);
  choicePopup.hidden = true;

  window.requestAnimationFrame(() => {
    choicePopup.hidden = false;
    choicePopupTimer = window.setTimeout(() => {
      choicePopup.hidden = true;
    }, 3200);
  });
}

async function handleSubmission(form, submission) {
  setSubmitting(form, true);

  try {
    const result = await sendDecision(submission);
    const previewMode = result.mode === "preview";

    thanksKicker.textContent = previewMode ? "Saved locally" : "Sent";
    thanksTitle.textContent =
      submission.decision === "Yes" ? "Second date secured." : "Answer received.";
    thanksCopy.textContent = previewMode
      ? "Email settings are not configured yet, so the server logged the response instead."
      : "The response has been emailed.";

    showPanel(thanksPanel);
    if (submission.decision === "Yes") {
      showChoicePopup();
    }
  } catch (error) {
    console.warn(error);
    openMailFallback(submission);
    thanksKicker.textContent = "Draft opened";
    thanksTitle.textContent = "One last tap.";
    thanksCopy.textContent =
      "Your mail app should be ready with the response. Send that draft to finish.";
    showPanel(thanksPanel);
    if (submission.decision === "Yes") {
      showChoicePopup();
    }
  } finally {
    setSubmitting(form, false);
  }
}

dateForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const selectedPlan = document.querySelector("input[name='datePlan']:checked");
  const selectedDate = document.querySelector("#date-input").value;

  if (!selectedPlan || !allowedDateValues.has(selectedDate)) {
    return;
  }

  handleSubmission(dateForm, {
    decision: "Yes",
    datePlan: selectedPlan.value,
    date: selectedDate,
    time: document.querySelector("#time-input").value,
    note: document.querySelector("#note-input").value.trim(),
    submittedAt: new Date().toISOString(),
  });
});

noForm.addEventListener("submit", (event) => {
  event.preventDefault();

  handleSubmission(noForm, {
    decision: "No",
    note: document.querySelector("#no-note").value.trim(),
    submittedAt: new Date().toISOString(),
  });
});
