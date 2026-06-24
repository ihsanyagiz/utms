// UTMS Core Business Logic Validators & Formula Calculators (V&V Support)

export const validateTurkishId = (id) => {
  if (!id || id.length !== 11 || !/^\d+$/.test(id)) return false;
  if (id[0] === '0') return false;
  
  const digits = id.split('').map(Number);
  const sum1 = digits[0] + digits[2] + digits[4] + digits[6] + digits[8];
  const sum2 = digits[1] + digits[3] + digits[5] + digits[7];
  
  const d10 = (sum1 * 7 - sum2) % 10;
  if (digits[9] !== d10) return false;
  
  const d11 = (digits.slice(0, 10).reduce((a, b) => a + b, 0)) % 10;
  if (digits[10] !== d11) return false;
  
  // Ends with an even number
  if (digits[10] % 2 !== 0) return false;

  return true;
};

export const calcRankingScore = (osymPoints, currentGpa) => {
  const osym = parseFloat(osymPoints);
  const gpa = parseFloat(currentGpa);
  if (isNaN(osym) || isNaN(gpa)) return null;
  return Number(((osym / 560) * 90 + (gpa / 4.0) * 10).toFixed(4));
};

export const runAutomatedDocChecker = (app) => {
  const errors = [];
  
  // 1. GPA check
  const gpa = parseFloat(app.currentGpa);
  if (isNaN(gpa) || gpa < 0 || gpa > 4.0) {
    errors.push({ type: 'field', field: 'current_gpa', reason: 'GPA geçerli bir aralıkta olmalıdır (0.00 - 4.00).' });
  } else if (gpa < 2.00) {
    errors.push({ type: 'field', field: 'current_gpa', reason: `GPA ${gpa.toFixed(2)} minimum şart olan 2.00 değerinin altındadır.` });
  }

  // 2. ID checksum check
  if (!validateTurkishId(app.idNumber)) {
    errors.push({ type: 'field', field: 'id_number', reason: 'TC Kimlik numarası formatı veya algoritması geçersizdir.' });
  }

  // 3. Document Check
  // Required slots: 1 (Student Cert), 2 (Transcript), 3 (OSYM Score)
  const uploadedSlots = app.documents.map(d => d.slot);
  if (!uploadedSlots.includes(1)) {
    errors.push({ type: 'document', slot: 1, reason: 'Öğrenci Belgesi eksiktir.' });
  }
  if (!uploadedSlots.includes(2)) {
    errors.push({ type: 'document', slot: 2, reason: 'Transkript (Not Dökümü) eksiktir.' });
  }
  if (!uploadedSlots.includes(3)) {
    errors.push({ type: 'document', slot: 3, reason: 'ÖSYM Sonuç Belgesi eksiktir.' });
  }

  // English Prof. Check (İYTE is a fully English-medium institution - all programs require English proficiency)
  if (!uploadedSlots.includes(4)) {
    errors.push({ type: 'document', slot: 4, reason: 'İngilizce Hazırlık Muafiyet Belgesi yüklenmemiştir (İYTE tüm programlarda İngilizce eğitim verir).' });
  }

  return errors;
};
