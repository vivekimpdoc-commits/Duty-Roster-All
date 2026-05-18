// ========== ShiftMaster Pro – app.js ==========

const DB_KEY = 'shiftmaster_employees';
const ASSIGN_KEY = 'shiftmaster_assignments';

// ---- UTILS ----
function getEmployees() { return JSON.parse(localStorage.getItem(DB_KEY) || '[]'); }
function saveEmployees(arr) { localStorage.setItem(DB_KEY, JSON.stringify(arr)); }
function getAssignments() { return JSON.parse(localStorage.getItem(ASSIGN_KEY) || '[]'); }
function saveAssignments(arr) { localStorage.setItem(ASSIGN_KEY, JSON.stringify(arr)); }

function showToast(msg, duration = 3000) {
  const t = document.getElementById('toast');
  const m = document.getElementById('toast-msg');
  if (!t || !m) return;
  m.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), duration);
}

function updateNavCount() {
  const el = document.getElementById('nav-user-count');
  if (el) el.textContent = getEmployees().length + ' कर्मचारी';
}

function updateHeroStats() {
  const emps = getEmployees();
  const assigns = getAssignments();
  const sr = document.getElementById('stat-reg');
  const sa = document.getElementById('stat-asgn');
  if (sr) sr.textContent = emps.length;
  if (sa) sa.textContent = assigns.length;
}

// ---- STEP NAVIGATION ----
let currentStep = 1;

function nextStep(from) {
  if (from === 1 && !validateStep1()) {
    showToast('⚠️ कृपया सभी ज़रूरी जानकारी सही-सही भरें!', 'warning');
    return;
  }
  document.getElementById('step-' + from).classList.remove('active');
  document.getElementById('step-' + (from + 1)).classList.add('active');
  document.getElementById('ps-' + from).classList.remove('active');
  document.getElementById('ps-' + from).classList.add('done');
  document.getElementById('ps-' + (from + 1)).classList.add('active');
  currentStep = from + 1;
  window.scrollTo({ top: 300, behavior: 'smooth' });
}

function prevStep(from) {
  document.getElementById('step-' + from).classList.remove('active');
  document.getElementById('step-' + (from - 1)).classList.add('active');
  document.getElementById('ps-' + from).classList.remove('active');
  document.getElementById('ps-' + (from - 1)).classList.remove('done');
  document.getElementById('ps-' + (from - 1)).classList.add('active');
  currentStep = from - 1;
}

// ---- VALIDATION ----
function validateStep1() {
  let ok = true;
  const name = document.getElementById('fullName').value.trim();
  const email = document.getElementById('email').value.trim();
  const phone = document.getElementById('phone').value.trim();
  const setErr = (id, msg) => { document.getElementById(id).textContent = msg; };

  if (!name || name.length < 2) { setErr('err-name', 'कृपया पूरा नाम दर्ज करें'); ok = false; }
  else setErr('err-name', '');

  const emailRx = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRx.test(email)) { setErr('err-email', 'वैध ईमेल दर्ज करें'); ok = false; }
  else {
    const exists = getEmployees().some(e => e.email.toLowerCase() === email.toLowerCase());
    if (exists) { setErr('err-email', '⚠️ यह ईमेल पहले से रजिस्टर्ड है!'); ok = false; }
    else setErr('err-email', '');
  }

  const phoneRx = /^[+]?[\d\s-]{10,13}$/;
  if (!phoneRx.test(phone)) { setErr('err-phone', 'वैध मोबाइल नंबर दर्ज करें'); ok = false; }
  else setErr('err-phone', '');

  return ok;
}

// ---- FORM SUBMIT ----
document.addEventListener('DOMContentLoaded', () => {
  updateNavCount();
  updateHeroStats();

  const form = document.getElementById('registrationForm');
  if (!form) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();

    const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const timeSlots = ['morning', 'afternoon', 'night'];
    const skills = [...document.querySelectorAll('input[name="skills"]:checked')].map(x => x.value);
    const prefShift = document.querySelector('input[name="prefShift"]:checked')?.value || 'any';

    const emp = {
      id: 'EMP-' + Date.now(),
      fullName: document.getElementById('fullName').value.trim(),
      email: document.getElementById('email').value.trim(),
      phone: document.getElementById('phone').value.trim(),
      district: document.getElementById('district')?.value || 'Lucknow',
      department: document.getElementById('subDepartment') && document.getElementById('subDepartment').value ? `${document.getElementById('department').value} (${document.getElementById('subDepartment').value})` : document.getElementById('department').value,
      employeeId: document.getElementById('employeeId').value.trim(),
      experience: parseInt(document.getElementById('experience').value || '0'),
      days,
      timeSlots,
      hoursPerWeek: 48,
      preferredShift: prefShift,
      skills,
      notes: document.getElementById('additionalNotes').value.trim(),
      registeredAt: new Date().toISOString(),
      assignedShifts: 0
    };

    const employees = getEmployees();
    employees.push(emp);
    saveEmployees(employees);

    // Run AI scheduler
    if (window.AIScheduler) {
      const assignments = window.AIScheduler.assign(employees);
      saveAssignments(assignments);
    }

    showToast('✅ रजिस्ट्रेशन सफल! AI शिफ्ट असाइन कर रहा है...');
    showSuccess(emp);
    updateNavCount();
    updateHeroStats();
  });
});

function showSuccess(emp) {
  document.getElementById('registrationForm').style.display = 'none';
  const sm = document.getElementById('successMsg');
  sm.style.display = 'block';
  document.getElementById('successDetails').innerHTML = `
    <p>👤 <strong>नाम:</strong> ${emp.fullName}</p>
    <p>📧 <strong>ईमेल:</strong> ${emp.email}</p>
    <p>🪪 <strong>ID:</strong> ${emp.id}</p>
    <p>📍 <strong>ज़िला:</strong> ${emp.district}</p>
    <p>📅 <strong>उपलब्धता:</strong> ${emp.days.join(', ')}</p>
    <p>⏰ <strong>समय:</strong> ${emp.timeSlots.join(', ')}</p>
    <p>⭐ <strong>पसंदीदा:</strong> ${emp.preferredShift}</p>
    ${emp.skills.length > 0 ? `<p>🎯 <strong>कौशल:</strong> ${emp.skills.join(', ')}</p>` : ''}
  `;
  sm.scrollIntoView({ behavior: 'smooth' });
}

function resetForm() {
  document.getElementById('registrationForm').reset();
  document.getElementById('registrationForm').style.display = 'block';
  document.getElementById('successMsg').style.display = 'none';
  // Reset steps
  document.querySelectorAll('.form-step').forEach(s => s.classList.remove('active'));
  document.getElementById('step-1').classList.add('active');
  document.querySelectorAll('.prog-step').forEach(s => { s.classList.remove('active', 'done'); });
  document.getElementById('ps-1').classList.add('active');
  currentStep = 1;
  window.scrollTo({ top: 300, behavior: 'smooth' });
}
