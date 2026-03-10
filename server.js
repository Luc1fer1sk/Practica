const express = require('express');
const sql = require('mssql');
const path = require('path');

const app = express();
const PORT = 3000;

// Настройки подключения к ВАШЕЙ базе
const dbConfig = {
    server: 'localhost\\MSSQLSERVER01',
    database: 'MedicalDatabase',
    options: {
        trustedConnection: true, // Windows-аутентификация
        trustServerCertificate: true,
        encrypt: false
    }
};

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

// Раздаем статические файлы из папки public
app.use('/', express.static(path.join(__dirname, 'public')));

// API: Получить всех врачей
app.get('/api/doctors', async (req, res) => {
    try {
        const pool = await sql.connect(dbConfig);
        const result = await pool.request().query('SELECT * FROM dbo.Врач');
        res.json(result.recordset);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Ошибка базы данных' });
    }
});

// API: Получить записи пациента по телефону
app.post('/api/patient-appointments', async (req, res) => {
    try {
        const { phone } = req.body;
        const pool = await sql.connect(dbConfig);
        const result = await pool.request()
            .input('phone', sql.VarChar, phone)
            .query(`SELECT * FROM dbo.Пациент WHERE Телефон = @phone`);
        res.json(result.recordset);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Ошибка поиска' });
    }
});

// API: Создать новую запись на приём
app.post('/api/appointment', async (req, res) => {
    try {
        const { patientId, doctorId, date, complaint } = req.body;
        const pool = await sql.connect(dbConfig);
        await pool.request()
            .input('patientId', sql.Int, patientId)
            .input('doctorId', sql.Int, doctorId)
            .input('date', sql.DateTime, date)
            .input('complaint', sql.NVarChar, complaint)
            .query(`INSERT INTO dbo.Назначение (ПациентID, ВрачID, Дата, Жалобы) VALUES (@patientId, @doctorId, @date, @complaint)`);
        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Ошибка записи' });
    }
});

app.listen(PORT, () => {
    console.log(`✅ Сервер запущен! Откройте в браузере: http://localhost:${PORT}`);
});
