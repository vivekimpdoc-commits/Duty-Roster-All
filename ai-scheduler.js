// ========== AI Scheduler – ai-scheduler.js ==========
window.AIScheduler = (function () {
  const SHIFTS = [
    { id: 'morning', label: 'Morning Shift', icon: '🌅', time: '6AM–2PM', requiredSkills: [] },
    { id: 'afternoon', label: 'Afternoon Shift', icon: '☀️', time: '2PM–10PM', requiredSkills: [] },
    { id: 'night', label: 'Night Shift', icon: '🌙', time: '10PM–6AM', requiredSkills: ['security'] }
  ];
  const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
  const UP_DISTRICTS = ["Agra","Aligarh","Allahabad","Ambedkar Nagar","Amethi","Amroha","Auraiya","Azamgarh","Baghpat","Bahraich","Ballia","Balrampur","Banda","Barabanki","Bareilly","Basti","Bhadohi","Bijnor","Budaun","Bulandshahr","Chandauli","Chitrakoot","Deoria","Etah","Etawah","Faizabad","Farrukhabad","Fatehpur","Firozabad","Gautam Buddha Nagar","Ghaziabad","Ghazipur","Gonda","Gorakhpur","Hamirpur","Hapur","Hardoi","Hathras","Jalaun","Jaunpur","Jhansi","Kannauj","Kanpur Dehat","Kanpur Nagar","Kasganj","Kaushambi","Kheri","Kushinagar","Lalitpur","Lucknow","Maharajganj","Mahoba","Mainpuri","Mathura","Mau","Meerut","Mirzapur","Moradabad","Muzaffarnagar","Pilibhit","Pratapgarh","Raebareli","Rampur","Saharanpur","Sambhal","Sant Kabir Nagar","Shahjahanpur","Shamli","Shravasti","Siddharthnagar","Sitapur","Sonbhadra","Sultanpur","Unnao","Varanasi"];
  const SPOTS = ["Checkpost 1", "Checkpost 2", "Main Chauraha", "Station Road", "Bus Stand", "Highway Toll", "City Square", "Market Area", "Sector 1", "Sector 2", "VIP Road", "Mall Road", "Civil Lines", "Cantt Area", "University Gate", "Hospital Road", "Industrial Area", "Border Post", "Cyber Cell", "Control Room"];

  function scoreEmployee(emp, shift, day, currentLoad) {
    let score = 0;
    if (!emp.days.includes(day)) return -1;
    if (!emp.timeSlots.includes(shift.id)) return -1;

    // Preference bonus
    if (emp.preferredShift === shift.id) score += 30;
    if (emp.preferredShift === 'any') score += 10;

    // Skill match
    if (shift.requiredSkills.length > 0) {
      const hasSkill = shift.requiredSkills.some(s => emp.skills.includes(s));
      if (hasSkill) score += 20;
    }

    // Fairness – prefer employees with fewer assigned shifts
    score -= (currentLoad[emp.id] || 0) * 5;

    // Experience bonus
    score += Math.min(emp.experience || 0, 5);

    return score;
  }

  function assign(employees) {
    const assignments = [];
    const load = {};
    employees.forEach(e => (load[e.id] = 0));

    const today = new Date();

    DAYS.forEach((day, dayIdx) => {
      const date = new Date(today);
      date.setDate(today.getDate() + dayIdx);

      SHIFTS.forEach(shift => {
        const eligible = employees
          .map(emp => ({ emp, score: scoreEmployee(emp, shift, day, load) }))
          .filter(x => x.score >= 0)
          .sort((a, b) => b.score - a.score);

        const needed = Math.min(2, eligible.length);
        const selected = eligible.slice(0, needed);

        selected.forEach(({ emp }) => {
          load[emp.id] = (load[emp.id] || 0) + 1;
          const dist = UP_DISTRICTS[Math.floor(Math.random() * UP_DISTRICTS.length)];
          const spot = SPOTS[Math.floor(Math.random() * SPOTS.length)];
          assignments.push({
            id: 'ASGN-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5),
            employeeId: emp.id,
            employeeName: emp.fullName,
            shift: shift.id,
            shiftLabel: shift.label,
            shiftIcon: shift.icon,
            shiftTime: shift.time,
            day: day,
            date: date.toISOString().split('T')[0],
            location: `${dist} – ${spot}`,
            aiScore: eligible.find(x => x.emp.id === emp.id)?.score || 0,
            status: 'assigned',
            manualOverride: false
          });
        });

        // Alert if no one available
        if (eligible.length === 0) {
          assignments.push({
            id: 'ALERT-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5),
            employeeId: null,
            employeeName: '⚠️ खाली',
            shift: shift.id,
            shiftLabel: shift.label,
            shiftIcon: shift.icon,
            shiftTime: shift.time,
            day: day,
            date: date.toISOString().split('T')[0],
            location: 'Unassigned',
            aiScore: 0,
            status: 'unassigned',
            manualOverride: false,
            alert: 'कोई कर्मचारी उपलब्ध नहीं'
          });
        }
      });
    });

    return assignments;
  }

  function detectImbalances(employees, assignments) {
    const alerts = [];
    const load = {};
    employees.forEach(e => (load[e.id] = 0));
    assignments.filter(a => a.status === 'assigned').forEach(a => {
      if (a.employeeId) load[a.employeeId] = (load[a.employeeId] || 0) + 1;
    });

    const vals = Object.values(load);
    const avg = vals.reduce((a, b) => a + b, 0) / (vals.length || 1);
    const max = Math.max(...vals);
    const min = Math.min(...vals);

    if (max - min > 5) alerts.push({ type: 'warning', msg: `⚠️ असंतुलन: अधिकतम ${max} – न्यूनतम ${min} शिफ्ट। वितरण असमान है।` });

    const unassigned = assignments.filter(a => a.status === 'unassigned');
    if (unassigned.length > 0) alerts.push({ type: 'danger', msg: `🚨 ${unassigned.length} शिफ्ट्स में कोई कर्मचारी उपलब्ध नहीं!` });

    if (employees.length < 3) alerts.push({ type: 'warning', msg: '⚠️ बहुत कम कर्मचारी! कम से कम 3 की आवश्यकता है।' });

    return alerts;
  }

  return { assign, detectImbalances, SHIFTS, DAYS };
})();
