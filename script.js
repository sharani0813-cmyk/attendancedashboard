import { firebaseConfig } from "./firebase-config.js";
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  deleteDoc,
  getDoc,
  onSnapshot,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// ---------- Firebase ----------
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const attendanceCol = collection(db, "attendance");

// ---------- State ----------
let entries = [];
let liveError = false;

// ---------- Elements ----------
const form         = document.getElementById("attendanceForm");
const reportBody   = document.getElementById("reportBody");
const emptyState   = document.getElementById("emptyState");
const statCount    = document.getElementById("statCount");
const statAvg      = document.getElementById("statAvg");
const todayDateEl  = document.getElementById("todayDate");
const liveDot      = document.getElementById("liveDot");
const liveLabel    = document.getElementById("liveLabel");
const submitBtn    = document.getElementById("submitBtn");

const fields = {
  empId:       document.getElementById("empId"),
  empName:     document.getElementById("empName"),
  department:  document.getElementById("department"),
  workingDays: document.getElementById("workingDays"),
  presentDays: document.getElementById("presentDays"),
  leaveDays:   document.getElementById("leaveDays"),
};

// ---------- Init ----------
todayDateEl.textContent = new Date().toLocaleDateString(undefined, {
  weekday: "short", year: "numeric", month: "short", day: "numeric"
});

// Seed sample rows once, only if the collection is empty (first-ever run).
async function seedIfEmpty() {
  const sample = [
    { id: "101", name: "Rahul", department: "Engineering", working: 25, present: 23, leave: 2 },
    { id: "102", name: "Priya", department: "Marketing",   working: 25, present: 19, leave: 4 },
  ];
  for (const entry of sample) {
    const ref = doc(db, "attendance", entry.id);
    const snap = await getDoc(ref);
    if (!snap.exists()) {
      await setDoc(ref, { ...entry, createdAt: Date.now() });
    }
  }
}

// ---------- Live sync ----------
onSnapshot(
  attendanceCol,
  (snapshot) => {
    setLiveStatus(true);
    entries = snapshot.docs
      .map((d) => d.data())
      .sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));
    renderTable();
  },
  (error) => {
    console.error("Firestore sync error:", error);
    setLiveStatus(false);
  }
);

seedIfEmpty().catch((e) => console.error("Seed failed:", e));

function setLiveStatus(connected) {
  liveError = !connected;
  if (connected) {
    liveDot.classList.remove("dot-off");
    liveLabel.textContent = "Live";
  } else {
    liveDot.classList.add("dot-off");
    liveLabel.textContent = "Offline — check firebase-config.js";
  }
}

// ---------- Validation ----------
function setError(key, message) {
  const errEl = document.getElementById("err-" + key);
  const inputEl = fields[key];
  if (message) {
    errEl.textContent = message;
    inputEl.classList.add("invalid");
  } else {
    errEl.textContent = "";
    inputEl.classList.remove("invalid");
  }
}

function clearErrors() {
  Object.keys(fields).forEach((key) => setError(key, ""));
}

function validate() {
  clearErrors();
  let valid = true;

  const empId = fields.empId.value.trim();
  const empName = fields.empName.value.trim();
  const department = fields.department.value;
  const working = fields.workingDays.value;
  const present = fields.presentDays.value;
  const leave = fields.leaveDays.value;

  if (!empId) { setError("empId", "Employee ID is required."); valid = false; }
  if (!empName) { setError("empName", "Employee name is required."); valid = false; }
  if (!department) { setError("department", "Please select a department."); valid = false; }

  if (working === "" || Number(working) <= 0) {
    setError("workingDays", "Enter working days greater than 0.");
    valid = false;
  }
  if (present === "") {
    setError("presentDays", "Present days is required.");
    valid = false;
  }
  if (leave === "") {
    setError("leaveDays", "Leave days is required.");
    valid = false;
  }

  const workingNum = Number(working);
  const presentNum = Number(present);
  const leaveNum = Number(leave);

  if (valid) {
    if (presentNum > workingNum) {
      setError("presentDays", "Present days can't exceed working days.");
      valid = false;
    }
    if (leaveNum > workingNum) {
      setError("leaveDays", "Leave days can't exceed working days.");
      valid = false;
    }
    if (presentNum + leaveNum > workingNum) {
      setError("presentDays", "Present + Leave can't exceed working days.");
      valid = false;
    }
  }

  if (entries.some((e) => e.id === empId)) {
    setError("empId", "This Employee ID already has an entry. Remove it first to re-add.");
    valid = false;
  }

  return { valid, empId, empName, department, workingNum, presentNum, leaveNum };
}

// ---------- Calculation helpers ----------
function attendancePercent(present, working) {
  if (!working) return 0;
  return Math.round((present / working) * 1000) / 10; // one decimal place
}

function statusFor(pct) {
  if (pct >= 90) return { label: "Excellent", cls: "badge-excellent" };
  if (pct >= 75) return { label: "Good", cls: "badge-good" };
  if (pct >= 50) return { label: "Average", cls: "badge-average" };
  return { label: "Poor", cls: "badge-poor" };
}

// ---------- Render ----------
function renderTable() {
  reportBody.innerHTML = "";
  emptyState.hidden = entries.length !== 0;

  let totalPct = 0;

  entries.forEach((entry) => {
    const pct = attendancePercent(entry.present, entry.working);
    const status = statusFor(pct);
    totalPct += pct;

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td class="mono">${escapeHtml(entry.id)}</td>
      <td>${escapeHtml(entry.name)}</td>
      <td>${escapeHtml(entry.department)}</td>
      <td class="mono">${entry.working}</td>
      <td class="mono">${entry.present}</td>
      <td class="mono">${entry.leave}</td>
      <td class="pct">${pct}%</td>
      <td><span class="badge ${status.cls}">${status.label}</span></td>
      <td><button class="row-delete" title="Remove entry" data-id="${escapeHtml(entry.id)}">✕</button></td>
    `;
    reportBody.appendChild(tr);
  });

  statCount.textContent = entries.length;
  statAvg.textContent = entries.length ? Math.round((totalPct / entries.length) * 10) / 10 + "%" : "0%";
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

// ---------- Events ----------
form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const { valid, empId, empName, department, workingNum, presentNum, leaveNum } = validate();
  if (!valid) return;

  submitBtn.disabled = true;
  submitBtn.textContent = "Saving…";

  try {
    await setDoc(doc(db, "attendance", empId), {
      id: empId,
      name: empName,
      department,
      working: workingNum,
      present: presentNum,
      leave: leaveNum,
      createdAt: Date.now(),
    });
    form.reset();
    fields.empId.focus();
  } catch (err) {
    console.error("Save failed:", err);
    setError("empId", "Could not save — check your connection.");
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = "Add Entry";
  }
});

reportBody.addEventListener("click", async (e) => {
  const btn = e.target.closest(".row-delete");
  if (!btn) return;
  const id = btn.dataset.id;
  btn.disabled = true;
  try {
    await deleteDoc(doc(db, "attendance", id));
  } catch (err) {
    console.error("Delete failed:", err);
    btn.disabled = false;
  }
});
