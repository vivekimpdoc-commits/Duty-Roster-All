// ========== AI Scheduler – ai-scheduler.js ==========
window.AIScheduler = (function () {
  const SHIFTS = [
    { id: 'morning', label: 'Morning Shift', icon: '🌅', time: '6AM–2PM', preferredSkills: ['traffic_control', 'driving'] },
    { id: 'afternoon', label: 'Afternoon Shift', icon: '☀️', time: '2PM–10PM', preferredSkills: ['vip_security', 'riot_control'] },
    { id: 'night', label: 'Night Shift', icon: '🌙', time: '10PM–6AM', preferredSkills: ['marksman', 'riot_control', 'first_aid'] }
  ];
  const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
  const UP_DISTRICTS = ["Agra","Aligarh","Allahabad","Ambedkar Nagar","Amethi","Amroha","Auraiya","Azamgarh","Baghpat","Bahraich","Ballia","Balrampur","Banda","Barabanki","Bareilly","Basti","Bhadohi","Bijnor","Budaun","Bulandshahr","Chandauli","Chitrakoot","Deoria","Etah","Etawah","Faizabad","Farrukhabad","Fatehpur","Firozabad","Gautam Buddha Nagar","Ghaziabad","Ghazipur","Gonda","Gorakhpur","Hamirpur","Hapur","Hardoi","Hathras","Jalaun","Jaunpur","Jhansi","Kannauj","Kanpur Dehat","Kanpur Nagar","Kasganj","Kaushambi","Kheri","Kushinagar","Lalitpur","Lucknow","Maharajganj","Mahoba","Mainpuri","Mathura","Mau","Meerut","Mirzapur","Moradabad","Muzaffarnagar","Pilibhit","Pratapgarh","Raebareli","Rampur","Saharanpur","Sambhal","Sant Kabir Nagar","Shahjahanpur","Shamli","Shravasti","Siddharthnagar","Sitapur","Sonbhadra","Sultanpur","Unnao","Varanasi"];
  
  const DEPARTMENT_SPOTS = {
    civil: ['बीट गश्त (Beat Patrol)', 'थाना सुरक्षा (Station Security)', 'पिकेट ड्यूटी (Picket Duty)', 'बाज़ार गश्त (Market Patrol)', 'चेकपोस्ट सुरक्षा (Checkpost Security)'],
    patrol: ['गश्त ड्यूटी (General Patrol)', 'हाइवे गश्त (Highway Patrol)', 'रात की गश्त (Night Patrol)', 'पिकेट सुरक्षा (Picket Security)'],
    traffic: ['मुख्य चौराहा (Main Chauraha)', 'हाईवे टोल प्लाज़ा (Highway Toll Plaza)', 'यातायात नियंत्रण (Traffic Control Point)', 'फ्लाईओवर पॉइंट (Flyover Point)'],
    investigation: ['साइबर सेल (Cyber Cell)', 'जांच ब्यूरो (Investigation Bureau)', 'फॉरेंसिक लैब (Forensic Lab)', 'खुफिया विंग (Intelligence Bureau)'],
    armed: ['दंगा नियंत्रण वाहिनी (Riot Control Unit)', 'PAC बैरक (PAC Barracks)', 'अति-संवेदनशील क्षेत्र (Hypersensitive Area)', 'वीआईपी सुरक्षा (VIP Security)'],
    emergency: ['UP-112 PRV गश्त (PRV Patrol)', 'आपातकालीन सहायता (Emergency Assistance)', 'त्वरित प्रतिक्रिया टीम (Quick Response Team)', '112 कंट्रोल पॉइंट (112 Control Point)'],
    admin: ['कंट्रोल रूम ऑपरेटर (Control Room Operator)', 'वायरलेस कम्युनिकेशन (Wireless)', 'मुख्यालय रिकॉर्ड (HQ Records)', 'पासपोर्ट सत्यापन डेस्क (Passport Desk)'],
    control: ['कंट्रोल रूम (Control Room)', 'वायरलेस स्टेशन (Wireless Station)', 'सीसीटीएनएस सेल (CCTNS Cell)']
  };

  const GENERAL_SPOTS = ["चेकपोस्ट-1", "चेकपोस्ट-2", "मुख्य चौराहा", "स्टेशन रोड", "बस स्टैंड", "हाईवे टोल", "सिटी स्क्वायर", "बाज़ार क्षेत्र", "वीआईपी रोड", "सिविल लाइंस", "विश्वविद्यालय गेट", "कंट्रोल रूम"];

  function getSpotForDepartment(deptString) {
    if (!deptString) return GENERAL_SPOTS[Math.floor(Math.random() * GENERAL_SPOTS.length)];
    const dept = deptString.toLowerCase();
    
    for (const key in DEPARTMENT_SPOTS) {
      if (dept.includes(key)) {
        const spots = DEPARTMENT_SPOTS[key];
        return spots[Math.floor(Math.random() * spots.length)];
      }
    }
    return GENERAL_SPOTS[Math.floor(Math.random() * GENERAL_SPOTS.length)];
  }

  function scoreEmployee(emp, shift, day, currentLoad) {
    let score = 0;
    if (!emp.days.includes(day)) return -1;
    if (!emp.timeSlots.includes(shift.id)) return -1;

    // Preference bonus
    if (emp.preferredShift === shift.id) score += 30;
    if (emp.preferredShift === 'any') score += 10;

    // Skill match
    if (shift.preferredSkills && shift.preferredSkills.length > 0) {
      const matchedSkills = shift.preferredSkills.filter(s => emp.skills.includes(s));
      score += matchedSkills.length * 15; // 15 points per matching skill!
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
      
      // Track employees who already got a shift assigned today
      const assignedToday = new Set();

      SHIFTS.forEach(shift => {
        const eligible = employees
          .filter(emp => !assignedToday.has(emp.id)) // Enforce unique date assignment
          .map(emp => ({ emp, score: scoreEmployee(emp, shift, day, load) }))
          .filter(x => x.score >= 0)
          .sort((a, b) => b.score - a.score);

        const needed = Math.min(2, eligible.length);
        const selected = eligible.slice(0, needed);

        selected.forEach(({ emp }) => {
          load[emp.id] = (load[emp.id] || 0) + 1;
          assignedToday.add(emp.id); // Mark employee as busy today
          const dist = emp.district && emp.district !== '' ? emp.district : UP_DISTRICTS[Math.floor(Math.random() * UP_DISTRICTS.length)];
          const spot = getSpotForDepartment(emp.department);
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
