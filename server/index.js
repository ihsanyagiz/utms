import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';
import nodemailer from 'nodemailer';
import { db, initDb, syncSequences } from './db.js';
import { uploadDir, backupsDir, ensureRuntimeDirs } from './paths.js';
import { upload, persistUploadedFile } from './storage.js';
import { validateTurkishId, runAutomatedDocChecker, calcRankingScore } from '../src/utils/validators.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS and JSON parsing
app.use(cors());
app.use(express.json());

ensureRuntimeDirs();

// Serve uploaded files statically
app.use('/uploads', express.static(uploadDir));

// Email transporter configuration
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.resend.com',
  port: parseInt(process.env.SMTP_PORT || '2587'),
  secure: false,
  auth: {
    user: process.env.SMTP_USER || 'resend',
    pass: process.env.SMTP_PASSWORD || '' // Resend API Key
  }
});

async function sendVerificationEmail(toEmail) {
  const smtpPassword = process.env.SMTP_PASSWORD;
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  const publicUrl = process.env.PUBLIC_URL || frontendUrl;
  const verifyUrl = `${publicUrl}/api/auth/verify-email?email=${encodeURIComponent(toEmail)}`;

  if (!smtpPassword || smtpPassword.trim() === '') {
    console.log(`[Simüle E-posta] SMTP şifresi eksik. Aktivasyon linki:`);
    console.log(`Link: ${verifyUrl}`);
    return { success: true, simulated: true };
  }

  const fromEmail = process.env.SMTP_FROM || 'UTMS <noreply@example.com>';
  const mailOptions = {
    from: fromEmail,
    to: toEmail,
    subject: 'UTMS Yatay Geçiş Sistemi - E-posta Doğrulama',
    html: `
      <h2>Yatay Geçiş Başvuru Sistemine Hoş Geldiniz</h2>
      <p>Kayıt işleminizi tamamlamak ve hesabınızı aktifleştirmek için lütfen aşağıdaki bağlantıya tıklayınız:</p>
      <p><a href="${verifyUrl}" style="background-color:#A21B24;color:#ffffff;padding:10px 20px;text-decoration:none;border-radius:4px;display:inline-block;font-weight:bold;">Hesabımı Aktifleştir</a></p>
      <br/>
      <p>Bağlantı çalışmıyorsa aşağıdaki linki tarayıcınıza yapıştırabilirsiniz:</p>
      <p>${verifyUrl}</p>
      <hr/>
      <p>İzmir Yüksek Teknoloji Enstitüsü - Öğrenci İşleri Daire Başkanlığı</p>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`[Gerçek E-posta] ${toEmail} adresine aktivasyon e-postası başarıyla gönderildi.`);
    return { success: true, simulated: false };
  } catch (err) {
    console.error(`[E-posta Hatası] Gönderim başarısız:`, err);
    return { success: false, error: err.message };
  }
}

// --- Helper Functions ---
async function getConfig() {
  const rows = await db.all('SELECT * FROM system_config');
  const config = {};
  rows.forEach(r => {
    let val = r.value;
    if (val === 'true') val = true;
    else if (val === 'false') val = false;
    else if (!isNaN(val)) val = Number(val);
    config[r.key] = val;
  });
  return config;
}

// --- Auth Endpoints ---

app.post('/api/auth/login', async (req, res) => {
  const { email, password, role } = req.body;
  try {
    const user = await db.get('SELECT * FROM users WHERE email = ? AND role = ?', [email, role]);
    if (!user) {
      return res.status(400).json({ error: 'Kullanıcı veya rol bulunamadı!' });
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(400).json({ error: 'E-posta veya şifre hatalı!' });
    }

    // V&V Requirement: Check email verification status for applicant
    if (role === 'applicant' && user.isVerified === 0) {
      return res.status(400).json({ error: 'Hesabınız doğrulanmamış. Lütfen e-postanıza gönderilen bağlantı ile hesabınızı etkinleştirin!' });
    }

    const { password: _, ...userWithoutPassword } = user;
    res.json({ user: userWithoutPassword });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/auth/register', async (req, res) => {
  const { email, password, fullName, tcNo, phone } = req.body;
  try {
    if (!email || !password || !fullName || !tcNo) {
      return res.status(400).json({ error: 'Lütfen tüm zorunlu alanları doldurun!' });
    }

    if (!validateTurkishId(tcNo)) {
      return res.status(400).json({ error: 'TC Kimlik No geçersizdir!' });
    }

    if (password.length < 8) {
      return res.status(400).json({ error: 'Şifre en az 8 karakter olmalıdır!' });
    }

    const existing = await db.get('SELECT id FROM users WHERE email = ?', [email]);
    if (existing) {
      return res.status(400).json({ error: 'Bu e-posta adresiyle kayıtlı bir hesap zaten var!' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await db.run(
      'INSERT INTO users (email, password, role, fullName, phone, tcNo, department, isVerified) VALUES (?, ?, ?, ?, ?, ?, ?, 0)',
      [email, hashedPassword, 'applicant', fullName, phone, tcNo, null]
    );

    // Send verification email
    await sendVerificationEmail(email);

    res.json({ success: true, userId: result.lastID });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Verification Link Router (supports GET and POST)
app.get('/api/auth/verify-email', async (req, res) => {
  const { email } = req.query;
  try {
    await db.run('UPDATE users SET isVerified = 1 WHERE email = ?', [email]);
    // Redirect to frontend login view
    const frontendUrl = process.env.FRONTEND_URL || process.env.PUBLIC_URL || 'http://localhost:5173';
    res.redirect(`${frontendUrl}/?verified=true&email=${encodeURIComponent(email)}`);
  } catch (error) {
    res.status(500).send(`Doğrulama hatası: ${error.message}`);
  }
});

app.post('/api/auth/verify-email', async (req, res) => {
  const { email } = req.body;
  try {
    await db.run('UPDATE users SET isVerified = 1 WHERE email = ?', [email]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

async function bootstrapAdminAccount() {
  const email = process.env.BOOTSTRAP_ADMIN_EMAIL;
  const password = process.env.BOOTSTRAP_ADMIN_PASSWORD;
  const fullName = process.env.BOOTSTRAP_ADMIN_NAME || 'Sistem Yoneticisi';

  if (!email || !password) {
    return;
  }

  const existing = await db.get('SELECT id FROM users WHERE email = ? AND role = "admin"', [email]);
  if (existing) {
    return;
  }

  const hashedPassword = bcrypt.hashSync(password, 10);
  await db.run(
    'INSERT INTO users (email, password, role, fullName, phone, tcNo, department, isVerified) VALUES (?, ?, ?, ?, ?, ?, ?, 1)',
    [email, hashedPassword, 'admin', fullName, null, null, null]
  );
  console.log(`Bootstrap admin account created for ${email}.`);
}

app.post('/api/auth/edevlet', async (req, res) => {
  const { tcNo, fullName } = req.body;
  try {
    if (!validateTurkishId(tcNo)) {
      return res.status(400).json({ error: 'Geçersiz TC Kimlik No!' });
    }

    let user = await db.get('SELECT * FROM users WHERE role = "applicant" AND email LIKE ?', [`edevlet.${tcNo}%`]);
    if (!user) {
      const email = `edevlet.${tcNo}@test.com`;
      const hashedPassword = await bcrypt.hash('edevlet-auto-pass', 10);
      const result = await db.run(
        'INSERT INTO users (email, password, role, fullName, phone, tcNo, department, isVerified) VALUES (?, ?, ?, ?, ?, ?, ?, 1)',
        [email, hashedPassword, 'applicant', fullName, '05300000000', tcNo, null]
      );
      user = await db.get('SELECT * FROM users WHERE id = ?', [result.lastID]);
    }

    const { password: _, ...userWithoutPassword } = user;
    res.json({ user: userWithoutPassword });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/auth/forgot-password', async (req, res) => {
  const { email, newPassword } = req.body;
  try {
    const user = await db.get('SELECT id FROM users WHERE email = ?', [email]);
    if (!user) {
      return res.status(404).json({ error: 'Kullanıcı bulunamadı!' });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ error: 'Şifre en az 8 karakter olmalıdır!' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await db.run('UPDATE users SET password = ? WHERE email = ?', [hashedPassword, email]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// --- System Config ---
app.get('/api/config', async (req, res) => {
  try {
    const config = await getConfig();
    res.json(config);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/config', async (req, res) => {
  const newConfig = req.body;
  try {
    for (const [key, value] of Object.entries(newConfig)) {
      await db.run('INSERT OR REPLACE INTO system_config (key, value) VALUES (?, ?)', [key, String(value)]);
    }
    const config = await getConfig();
    res.json(config);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// --- Application Endpoints ---

// Get applications based on user role
app.get('/api/applications', async (req, res) => {
  const { role, department } = req.query;
  try {
    let query = "SELECT * FROM applications WHERE status != 'cancelled'";
    const params = [];

    if (role === 'ygk' && department) {
      query += ' AND forwardedFaculty = ?';
      params.push(department);
    }

    const apps = await db.all(query, params);
    
    // Fetch documents for each application
    for (const appItem of apps) {
      appItem.docCheckerErrors = JSON.parse(appItem.docCheckerErrors || '[]');
      appItem.isCurrentlyEnrolled = appItem.isCurrentlyEnrolled === 1;
      const docs = await db.all('SELECT id, slot, filename, fileSize, uploadDate, filePath FROM documents WHERE applicationId = ?', [appItem.id]);
      appItem.documents = docs;
    }

    res.json(apps);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/applications/my', async (req, res) => {
  const { applicantId } = req.query;
  try {
    const appItem = await db.get("SELECT * FROM applications WHERE applicantId = ? AND status != 'cancelled'", [applicantId]);
    if (!appItem) {
      return res.json(null);
    }

    appItem.docCheckerErrors = JSON.parse(appItem.docCheckerErrors || '[]');
    appItem.isCurrentlyEnrolled = appItem.isCurrentlyEnrolled === 1;
    const docs = await db.all('SELECT id, slot, filename, fileSize, uploadDate, filePath FROM documents WHERE applicationId = ?', [appItem.id]);
    appItem.documents = docs;

    res.json(appItem);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create/Submit application
app.post('/api/applications/submit', upload.any(), async (req, res) => {
  try {
    const config = await getConfig();
    if (!config.systemActive) {
      return res.status(400).json({ error: 'Başvuru sistemi şu anda kapalıdır!' });
    }

    const { applicantId, fullName, idNumber, targetProgram, currentGpa, sourceUniversity, osymPoints, isCurrentlyEnrolled } = req.body;

    const existing = await db.get("SELECT id FROM applications WHERE applicantId = ? AND status != 'cancelled'", [applicantId]);
    if (existing) {
      return res.status(400).json({ error: 'Zaten aktif bir başvurunuz bulunmaktadır!' });
    }

    const dateStr = new Date().toLocaleString('tr-TR');

    const appResult = await db.run(
      `INSERT INTO applications (
        applicantId, fullName, idNumber, targetProgram, targetSemester, 
        currentGpa, sourceUniversity, osymPoints, isCurrentlyEnrolled, status, 
        docCheckerStatus, docCheckerErrors, lastEditedById, lastEditedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        applicantId, fullName, idNumber, targetProgram, config.semester,
        currentGpa, sourceUniversity, osymPoints, isCurrentlyEnrolled === 'true' ? 1 : 0, 'submitted',
        'needs_manual_check', '[]', applicantId, dateStr
      ]
    );

    const appInsertedId = appResult.lastID;

    // Handle files upload
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        // fieldname corresponds to slotId
        const slot = parseInt(file.fieldname);
        const sizeStr = `${(file.size / (1024 * 1024)).toFixed(1)} MB`;
        const storedFilePath = await persistUploadedFile(file);
        await db.run(
          'INSERT INTO documents (applicationId, slot, filename, fileSize, uploadDate, filePath) VALUES (?, ?, ?, ?, ?, ?)',
          [appInsertedId, slot, file.originalname, sizeStr, dateStr, storedFilePath]
        );
      }
    }

    // Run automated checker
    const appRow = await db.get('SELECT * FROM applications WHERE id = ?', [appInsertedId]);
    appRow.isCurrentlyEnrolled = appRow.isCurrentlyEnrolled === 1;
    const docs = await db.all('SELECT * FROM documents WHERE applicationId = ?', [appInsertedId]);
    appRow.documents = docs || [];
    appRow.docCheckerErrors = [];
    const errors = runAutomatedDocChecker(appRow);

    await db.run(
      "UPDATE applications SET docCheckerStatus = 'auto_checked', docCheckerErrors = ? WHERE id = ?",
      [JSON.stringify(errors), appInsertedId]
    );

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update/Resubmit application
app.post('/api/applications/resubmit', upload.any(), async (req, res) => {
  try {
    const { id, applicantId, idNumber, targetProgram, currentGpa, sourceUniversity, osymPoints, isCurrentlyEnrolled } = req.body;
    const dateStr = new Date().toLocaleString('tr-TR');

    await db.run(
      `UPDATE applications SET 
        idNumber = ?, targetProgram = ?, currentGpa = ?, sourceUniversity = ?, 
        osymPoints = ?, isCurrentlyEnrolled = ?, status = 'submitted', 
        docCheckerStatus = 'needs_manual_check', docCheckerErrors = '[]', 
        oidbNotes = NULL, deanNotes = NULL, prepSchoolStatus = NULL, 
        lastEditedById = ?, lastEditedAt = ? 
      WHERE id = ? AND applicantId = ?`,
      [
        idNumber, targetProgram, currentGpa, sourceUniversity,
        osymPoints, isCurrentlyEnrolled === 'true' ? 1 : 0, applicantId, dateStr, id, applicantId
      ]
    );

    // Handle uploaded files updates
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        const slot = parseInt(file.fieldname);
        const sizeStr = `${(file.size / (1024 * 1024)).toFixed(1)} MB`;

        // Delete old file mapping if exists
        await db.run('DELETE FROM documents WHERE applicationId = ? AND slot = ?', [id, slot]);

        // Insert new
        const storedFilePath = await persistUploadedFile(file);
        await db.run(
          'INSERT INTO documents (applicationId, slot, filename, fileSize, uploadDate, filePath) VALUES (?, ?, ?, ?, ?, ?)',
          [id, slot, file.originalname, sizeStr, dateStr, storedFilePath]
        );
      }
    }

    // Run automated checker
    const appRow = await db.get('SELECT * FROM applications WHERE id = ?', [id]);
    appRow.isCurrentlyEnrolled = appRow.isCurrentlyEnrolled === 1;
    const docs = await db.all('SELECT * FROM documents WHERE applicationId = ?', [id]);
    appRow.documents = docs || [];
    appRow.docCheckerErrors = [];
    const errors = runAutomatedDocChecker(appRow);

    await db.run(
      "UPDATE applications SET docCheckerStatus = 'auto_checked', docCheckerErrors = ? WHERE id = ?",
      [JSON.stringify(errors), id]
    );

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Cancel application
app.post('/api/applications/cancel', async (req, res) => {
  const { id, applicantId } = req.body;
  const dateStr = new Date().toLocaleString('tr-TR');
  try {
    await db.run(
      "UPDATE applications SET status = 'cancelled', lastEditedById = ?, lastEditedAt = ? WHERE id = ? AND applicantId = ?",
      [applicantId, dateStr, id, applicantId]
    );
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Manual run checker
app.post('/api/applications/:id/checker', async (req, res) => {
  const { id } = req.params;
  try {
    const appRow = await db.get('SELECT * FROM applications WHERE id = ?', [id]);
    if (!appRow) {
      return res.status(404).json({ error: 'Başvuru bulunamadı!' });
    }

    appRow.isCurrentlyEnrolled = appRow.isCurrentlyEnrolled === 1;
    const docs = await db.all('SELECT * FROM documents WHERE applicationId = ?', [id]);
    appRow.documents = docs || [];
    appRow.docCheckerErrors = [];
    const errors = runAutomatedDocChecker(appRow);

    await db.run(
      "UPDATE applications SET docCheckerStatus = 'auto_checked', docCheckerErrors = ? WHERE id = ?",
      [JSON.stringify(errors), id]
    );

    res.json({ success: true, errors });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Staff actions update application status
app.post('/api/applications/:id/update', async (req, res) => {
  const { id } = req.params;
  const { status, oidbNotes, deanNotes, prepSchoolStatus, forwardedFaculty, lastEditedById, rankingScore } = req.body;
  const dateStr = new Date().toLocaleString('tr-TR');

  try {
    // Build dynamic update query
    let query = 'UPDATE applications SET lastEditedAt = ?, lastEditedById = ?';
    const params = [dateStr, lastEditedById];

    if (status !== undefined) {
      query += ', status = ?';
      params.push(status);
    }
    if (oidbNotes !== undefined) {
      query += ', oidbNotes = ?';
      params.push(oidbNotes);
    }
    if (deanNotes !== undefined) {
      query += ', deanNotes = ?';
      params.push(deanNotes);
    }
    if (prepSchoolStatus !== undefined) {
      query += ', prepSchoolStatus = ?';
      params.push(prepSchoolStatus);
    }
    if (forwardedFaculty !== undefined) {
      query += ', forwardedFaculty = ?';
      params.push(forwardedFaculty);
    }
    if (rankingScore !== undefined) {
      query += ', rankingScore = ?';
      params.push(rankingScore);
    }

    query += ' WHERE id = ?';
    params.push(id);

    await db.run(query, params);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get Intibak Table
app.get('/api/intibak/:applicationId', async (req, res) => {
  const { applicationId } = req.params;
  try {
    const table = await db.get('SELECT * FROM intibak_tables WHERE applicationId = ?', [applicationId]);
    if (!table) {
      return res.json(null);
    }
    table.courses = JSON.parse(table.courses);
    res.json(table);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Save Intibak Table
app.post('/api/applications/:id/intibak', async (req, res) => {
  const { id } = req.params;
  const { courses } = req.body;
  try {
    const appRow = await db.get('SELECT * FROM applications WHERE id = ?', [id]);
    if (!appRow) {
      return res.status(404).json({ error: 'Başvuru bulunamadı!' });
    }

    // Calculation logic
    const gradePoints = {
      'AA': 4.0, 'BA': 3.5, 'BB': 3.0, 'CB': 2.5, 'CC': 2.0, 'DC': 1.5, 'DD': 1.0, 'FD': 0.5, 'FF': 0.0
    };

    const acceptedCourses = courses.filter(c => c.status === 'accepted');
    let estimatedGpa = 3.00;
    if (acceptedCourses.length > 0) {
      let totalPoints = 0;
      let totalCredits = 0;
      acceptedCourses.forEach(c => {
        const gradeVal = gradePoints[c.sourceGrade] || 3.0;
        const credits = parseFloat(c.sourceCredits) || 3;
        totalPoints += gradeVal * credits;
        totalCredits += credits;
      });
      estimatedGpa = totalCredits > 0 ? Number((totalPoints / totalCredits).toFixed(2)) : 3.00;
    }

    const rankingScore = calcRankingScore(appRow.osymPoints, appRow.currentGpa);

    // Save Table
    await db.run(
      'INSERT OR REPLACE INTO intibak_tables (applicationId, estimatedGpa, rankingScore, courses) VALUES (?, ?, ?, ?)',
      [id, estimatedGpa, rankingScore, JSON.stringify(courses)]
    );

    // Update app rankingScore
    const dateStr = new Date().toLocaleString('tr-TR');
    await db.run(
      'UPDATE applications SET rankingScore = ?, lastEditedAt = ? WHERE id = ?',
      [rankingScore, dateStr, id]
    );

    res.json({ success: true, estimatedGpa, rankingScore });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// --- Admin Endpoints ---

app.get('/api/users', async (req, res) => {
  try {
    const users = await db.all('SELECT id, email, role, fullName, phone, tcNo, department FROM users');
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/users/role', async (req, res) => {
  const { userId, role } = req.body;
  try {
    await db.run('UPDATE users SET role = ? WHERE id = ?', [role, userId]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/users/staff', async (req, res) => {
  const { email, password, role, department, fullName } = req.body;
  try {
    const existing = await db.get('SELECT id FROM users WHERE email = ?', [email]);
    if (existing) {
      return res.status(400).json({ error: 'Bu e-posta adresiyle bir hesap zaten var!' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    await db.run(
      'INSERT INTO users (email, password, role, department, fullName) VALUES (?, ?, ?, ?, ?)',
      [email, hashedPassword, role, department || null, fullName]
    );
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// --- Backup & Restore Endpoints ---

app.get('/api/backups', async (req, res) => {
  try {
    const files = fs.readdirSync(backupsDir);
    const backups = files
      .filter(f => f.endsWith('.json'))
      .map(f => {
        const filePath = path.join(backupsDir, f);
        const stats = fs.statSync(filePath);
        return {
          filename: f,
          date: new Date(stats.mtime).toLocaleString('tr-TR'),
          size: `${(stats.size / 1024).toFixed(1)} KB`
        };
      })
      .sort((a, b) => b.filename.localeCompare(a.filename));
    res.json(backups);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/backups/trigger', async (req, res) => {
  try {
    // Read all table data to build a JSON dump
    const users = await db.all('SELECT * FROM users');
    const applications = await db.all('SELECT * FROM applications');
    const documents = await db.all('SELECT * FROM documents');
    const intibakTables = await db.all('SELECT * FROM intibak_tables');
    const systemConfig = await db.all('SELECT * FROM system_config');

    const backupData = {
      users,
      applications,
      documents,
      intibakTables,
      systemConfig
    };

    const date = new Date();
    const filename = `backup_${date.getFullYear()}${(date.getMonth() + 1).toString().padStart(2, '0')}${date.getDate().toString().padStart(2, '0')}_${date.getHours().toString().padStart(2, '0')}${date.getMinutes().toString().padStart(2, '0')}${date.getSeconds().toString().padStart(2, '0')}.json`;
    
    fs.writeFileSync(path.join(backupsDir, filename), JSON.stringify(backupData, null, 2));
    res.json({ success: true, filename });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/backups/restore', async (req, res) => {
  const { filename } = req.body;
  try {
    const filePath = path.join(backupsDir, filename);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'Yedek dosyası bulunamadı!' });
    }

    const rawData = fs.readFileSync(filePath, 'utf8');
    const data = JSON.parse(rawData);

    // Truncate tables
    await db.run('DELETE FROM users');
    await db.run('DELETE FROM applications');
    await db.run('DELETE FROM documents');
    await db.run('DELETE FROM intibak_tables');
    await db.run('DELETE FROM system_config');

    // Restore users
    for (const u of data.users || []) {
      await db.run(
        'INSERT INTO users (id, email, password, role, fullName, phone, tcNo, department) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [u.id, u.email, u.password, u.role, u.fullName, u.phone, u.tcNo, u.department]
      );
    }

    // Restore applications
    for (const a of data.applications || []) {
      await db.run(
        `INSERT INTO applications (
          id, applicantId, fullName, idNumber, targetProgram, targetSemester, 
          currentGpa, sourceUniversity, osymPoints, isCurrentlyEnrolled, status, 
          docCheckerStatus, docCheckerErrors, oidbNotes, deanNotes, 
          prepSchoolStatus, forwardedFaculty, lastEditedById, lastEditedAt, rankingScore
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          a.id, a.applicantId, a.fullName, a.idNumber, a.targetProgram, a.targetSemester,
          a.currentGpa, a.sourceUniversity, a.osymPoints, a.isCurrentlyEnrolled, a.status,
          a.docCheckerStatus, a.docCheckerErrors, a.oidbNotes, a.deanNotes,
          a.prepSchoolStatus, a.forwardedFaculty, a.lastEditedById, a.lastEditedAt, a.rankingScore
        ]
      );
    }

    // Restore documents
    for (const d of data.documents || []) {
      await db.run(
        'INSERT INTO documents (id, applicationId, slot, filename, fileSize, uploadDate, filePath) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [d.id, d.applicationId, d.slot, d.filename, d.fileSize, d.uploadDate, d.filePath]
      );
    }

    // Restore intibak tables
    for (const t of data.intibakTables || []) {
      await db.run(
        'INSERT INTO intibak_tables (applicationId, estimatedGpa, rankingScore, courses) VALUES (?, ?, ?, ?)',
        [t.applicationId, t.estimatedGpa, t.rankingScore, typeof t.courses === 'string' ? t.courses : JSON.stringify(t.courses)]
      );
    }

    // Restore system config
    for (const c of data.systemConfig || []) {
      await db.run('INSERT INTO system_config (key, value) VALUES (?, ?)', [c.key, c.value]);
    }

    await syncSequences();

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Serve frontend assets in production
const distPath = path.join(__dirname, '../dist');
if (!process.env.VERCEL && fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  app.get('*', (req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

async function prepareApp() {
  await initDb();
  await bootstrapAdminAccount();
}

try {
  await prepareApp();
  if (!process.env.VERCEL) {
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  }
} catch (error) {
  console.error('Failed to start server:', error);
  if (!process.env.VERCEL) {
    process.exit(1);
  }
}

export default app;
