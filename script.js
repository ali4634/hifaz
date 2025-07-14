 document.getElementById('refresh-btn').addEventListener('click', function() {
    if (confirm('کیا آپ صفحہ ریفریش کرنا چاہتے ہیں؟')) {
        location.reload();
    }
});

window.addEventListener('beforeunload', function (e) {
    e.preventDefault();
    e.returnValue = '';
});

const appConfig = {
    name: "hifaz_tracker",
    secret: "cc566846d81dae78bb4fcff49808315c"
};

const currentDateElement = document.getElementById('current-date');
let currentDate = new Date();
let selectedStudentIndex = null;
let currentField = '';

let attendanceData = {
    sections: {
        section1: {
            students: [],
            attendance: {}
        },
        section2: {
            students: [],
            attendance: {}
        },
        section3: {
            students: [],
            attendance: {}
        }
    },
    studentDetails: {}
};

const DATA_KEY = 'attendanceData_v2';
const BACKUP_KEYS = {
    AUTO: 'attendanceAutoBackups_v2',
    MANUAL: 'attendanceManualBackups_v2'
};
const MAX_AUTO_BACKUPS = 5;
const MAX_MANUAL_BACKUPS = 10;

function validateDataStructure(data) {
    try {
        if (!data || typeof data !== 'object') return false;
        if (!data.sections || typeof data.sections !== 'object') return false;
        if (!data.studentDetails || typeof data.studentDetails !== 'object') return false;
        
        const requiredSections = ['section1', 'section2', 'section3'];
        for (const section of requiredSections) {
            if (!data.sections[section] || 
                !Array.isArray(data.sections[section].students) || 
                typeof data.sections[section].attendance !== 'object') {
                return false;
            }
        }
        
        return true;
    } catch (e) {
        console.error('ڈیٹا کی تصدیق میں خرابی:', e);
        return false;
    }
}

function repairData(data) {
    try {
        if (!data.sections) data.sections = {};
        if (!data.studentDetails) data.studentDetails = {};
        
        const requiredSections = ['section1', 'section2', 'section3'];
        for (const section of requiredSections) {
            if (!data.sections[section]) {
                data.sections[section] = {
                    students: [],
                    attendance: {}
                };
            } else {
                if (!Array.isArray(data.sections[section].students)) {
                    data.sections[section].students = [];
                }
                if (typeof data.sections[section].attendance !== 'object') {
                    data.sections[section].attendance = {};
                }
            }
        }
        
        return data;
    } catch (e) {
        console.error('ڈیٹا مرمت میں خرابی:', e);
        return getDefaultDataStructure();
    }
}

function getDefaultDataStructure() {
    return {
        sections: {
            section1: { students: [], attendance: {} },
            section2: { students: [], attendance: {} },
            section3: { students: [], attendance: {} }
        },
        studentDetails: {}
    };
}

function saveData() {
    try {
        if (!validateDataStructure(attendanceData)) {
            console.warn('ڈیٹا کی ساخت درست نہیں، مرمت کی کوشش کی جا رہی ہے');
            attendanceData = repairData(attendanceData);
        }
        
        localStorage.setItem(DATA_KEY, JSON.stringify(attendanceData));
        createAutoBackup();
        return true;
    } catch (e) {
        console.error('ڈیٹا محفوظ کرنے میں خرابی:', e);
        alert('ڈیٹا محفوظ کرنے میں خرابی! کنسول چیک کریں۔');
        return false;
    }
}

function createAutoBackup() {
    try {
        let autoBackups = JSON.parse(localStorage.getItem(BACKUP_KEYS.AUTO)) || [];
        
        autoBackups.unshift({
            timestamp: new Date().toISOString(),
            data: JSON.parse(JSON.stringify(attendanceData))
        });
        
        if (autoBackups.length > MAX_AUTO_BACKUPS) {
            autoBackups = autoBackups.slice(0, MAX_AUTO_BACKUPS);
        }
        
        localStorage.setItem(BACKUP_KEYS.AUTO, JSON.stringify(autoBackups));
        updateAutoBackupList();
        return true;
    } catch (e) {
        console.error('خودکار بیک اپ بنانے میں خرابی:', e);
        return false;
    }
}

function createManualBackup() {
    try {
        let manualBackups = JSON.parse(localStorage.getItem(BACKUP_KEYS.MANUAL)) || [];
        
        manualBackups.unshift({
            timestamp: new Date().toISOString(),
            data: JSON.parse(JSON.stringify(attendanceData))
        });
        
        if (manualBackups.length > MAX_MANUAL_BACKUPS) {
            manualBackups = manualBackups.slice(0, MAX_MANUAL_BACKUPS);
        }
        
        localStorage.setItem(BACKUP_KEYS.MANUAL, JSON.stringify(manualBackups));
        return true;
    } catch (e) {
        console.error('دستی بیک اپ بنانے میں خرابی:', e);
        alert('بیک اپ بنانے میں خرابی!');
        return false;
    }
}

function updateAutoBackupList() {
    const backupList = document.getElementById('auto-backup-list');
    if (!backupList) return;
    backupList.innerHTML = '';
    
    const autoBackups = JSON.parse(localStorage.getItem(BACKUP_KEYS.AUTO)) || [];
    
    if (autoBackups.length === 0) {
        backupList.innerHTML = '<p>کوئی بیک اپ دستیاب نہیں</p>';
        return;
    }
    
    const ul = document.createElement('ul');
    autoBackups.forEach((backup, index) => {
        const li = document.createElement('li');
        const date = new Date(backup.timestamp);
        li.innerHTML = `
            <span>${index + 1}. ${date.toLocaleString('ur-PK')}</span>
            <button class="small-btn view-btn" data-index="${index}">بحال کریں</button>
        `;
        ul.appendChild(li);
        
        li.querySelector('button').addEventListener('click', function() {
            restoreFromBackup(backup.data, 'auto', index);
        });
    });
    
    backupList.appendChild(ul);
}

function showAllBackups() {
    const backupList = document.getElementById('all-backups-list');
    backupList.innerHTML = '';
    
    const autoBackups = JSON.parse(localStorage.getItem(BACKUP_KEYS.AUTO)) || [];
    const manualBackups = JSON.parse(localStorage.getItem(BACKUP_KEYS.MANUAL)) || [];
    
    if (autoBackups.length === 0 && manualBackups.length === 0) {
        backupList.innerHTML = '<p>کوئی بیک اپ دستیاب نہیں</p>';
        return;
    }
    
    if (autoBackups.length > 0) {
        const autoHeader = document.createElement('h4');
        autoHeader.textContent = 'خودکار بیک اپس:';
        backupList.appendChild(autoHeader);
        
        const autoUl = document.createElement('ul');
        autoBackups.forEach((backup, index) => {
            const li = document.createElement('li');
            const date = new Date(backup.timestamp);
            li.innerHTML = `
                <span>${date.toLocaleString('ur-PK')} (خودکار)</span>
                <button class="small-btn view-btn" data-type="auto" data-index="${index}">بحال کریں</button>
            `;
            autoUl.appendChild(li);
            
            li.querySelector('button').addEventListener('click', function() {
                restoreFromBackup(backup.data, 'auto', index);
            });
        });
        backupList.appendChild(autoUl);
    }
    
    if (manualBackups.length > 0) {
        const manualHeader = document.createElement('h4');
        manualHeader.textContent = 'دستی بیک اپس:';
        backupList.appendChild(manualHeader);
        
        const manualUl = document.createElement('ul');
        manualBackups.forEach((backup, index) => {
            const li = document.createElement('li');
            const date = new Date(backup.timestamp);
            li.innerHTML = `
                <span>${date.toLocaleString('ur-PK')} (دستی)</span>
                <button class="small-btn view-btn" data-type="manual" data-index="${index}">بحال کریں</button>
            `;
            manualUl.appendChild(li);
            
            li.querySelector('button').addEventListener('click', function() {
                restoreFromBackup(backup.data, 'manual', index);
            });
        });
        backupList.appendChild(manualUl);
    }
}

function restoreFromBackup(backupData, backupType, backupIndex) {
    if (!confirm(`کیا آپ واقعی اس بیک اپ سے ڈیٹا بحال کرنا چاہتے ہیں؟\nتاریخ: ${new Date(backupData.timestamp || Date.now()).toLocaleString('ur-PK')}\nقسم: ${backupType === 'auto' ? 'خودکار' : 'دستی'}`)) {
        return;
    }
    
    try {
        if (!validateDataStructure(backupData)) {
            alert('بیک اپ ڈیٹا کی ساخت درست نہیں۔ بحالی ممکن نہیں۔');
            return;
        }
        
        attendanceData = repairData(backupData);
        saveData();
        initApp();
        alert('ڈیٹا کامیابی سے بحال ہو گیا!');
        
        const backupModal = document.getElementById('backup-modal');
        if (backupModal) backupModal.style.display = 'none';
    } catch (e) {
        console.error('بحالی میں خرابی:', e);
        alert('بحالی میں خرابی! کنسول چیک کریں۔');
    }
}

function deleteOldBackups() {
    try {
        let autoBackups = JSON.parse(localStorage.getItem(BACKUP_KEYS.AUTO)) || [];
        let manualBackups = JSON.parse(localStorage.getItem(BACKUP_KEYS.MANUAL)) || [];
        
        if (autoBackups.length <= MAX_AUTO_BACKUPS && manualBackups.length <= MAX_MANUAL_BACKUPS) {
            alert('کوئی پرانی بیک اپس موجود نہیں ہیں۔');
            return;
        }
        
        if (confirm(`کیا آپ واقعی پرانی بیک اپس حذف کرنا چاہتے ہیں؟\nخودکار بیک اپس: ${Math.max(0, autoBackups.length - MAX_AUTO_BACKUPS)} حذف ہوں گی\nدستی بیک اپس: ${Math.max(0, manualBackups.length - MAX_MANUAL_BACKUPS)} حذف ہوں گی`)) {
            if (autoBackups.length > MAX_AUTO_BACKUPS) {
                autoBackups = autoBackups.slice(0, MAX_AUTO_BACKUPS);
                localStorage.setItem(BACKUP_KEYS.AUTO, JSON.stringify(autoBackups));
            }
            
            if (manualBackups.length > MAX_MANUAL_BACKUPS) {
                manualBackups = manualBackups.slice(0, MAX_MANUAL_BACKUPS);
                localStorage.setItem(BACKUP_KEYS.MANUAL, JSON.stringify(manualBackups));
            }
            
            alert('پرانی بیک اپس کامیابی سے حذف ہو گئیں!');
            showAllBackups();
        }
    } catch (e) {
        console.error('بیک اپس حذف کرنے میں خرابی:', e);
        alert('خرابی! کنسول چیک کریں۔');
    }
}

function verifyDataIntegrity() {
    try {
        const resultDiv = document.getElementById('data-verification-result');
        resultDiv.innerHTML = '';
        
        const primaryData = localStorage.getItem(DATA_KEY);
        if (!primaryData) {
            resultDiv.innerHTML = '<div style="color: var(--danger-color);">خرابی: کوئی پرائمری ڈیٹا موجود نہیں</div>';
            return;
        }
        
        let parsedData;
        try {
            parsedData = JSON.parse(primaryData);
        } catch (e) {
            resultDiv.innerHTML = '<div style="color: var(--danger-color);">خرابی: پرائمری ڈیٹا کا تجزیہ نہیں ہو سکا</div>';
            return;
        }
        
        if (!validateDataStructure(parsedData)) {
            resultDiv.innerHTML = '<div style="color: var(--danger-color);">خرابی: پرائمری ڈیٹا کی ساخت درست نہیں</div>';
            return;
        }
        
        const autoBackups = JSON.parse(localStorage.getItem(BACKUP_KEYS.AUTO)) || [];
        const manualBackups = JSON.parse(localStorage.getItem(BACKUP_KEYS.MANUAL)) || [];
        
        let autoBackupErrors = 0;
        let manualBackupErrors = 0;
        
        autoBackups.forEach(backup => {
            try {
                if (!validateDataStructure(backup.data)) autoBackupErrors++;
            } catch (e) { autoBackupErrors++; }
        });
        
        manualBackups.forEach(backup => {
            try {
                if (!validateDataStructure(backup.data)) manualBackupErrors++;
            } catch (e) { manualBackupErrors++; }
        });
        
        resultDiv.innerHTML = `
            <div style="color: var(--success-color); margin-bottom: 8px;">پرائمری ڈیٹا: درست</div>
            <div style="margin-bottom: 8px;">خودکار بیک اپس: ${autoBackups.length} (${autoBackupErrors} خراب)</div>
            <div>دستی بیک اپس: ${manualBackups.length} (${manualBackupErrors} خراب)</div>
        `;
        
        if (autoBackupErrors > 0 || manualBackupErrors > 0) {
            const suggestion = document.createElement('div');
            suggestion.style.marginTop = '10px';
            suggestion.style.color = 'var(--warning-color)';
            suggestion.innerHTML = '<strong>تجویز:</strong> خراب بیک اپس کو حذف کرنے کے لیے "پرانی بیک اپس حذف کریں" بٹن استعمال کریں۔';
            resultDiv.appendChild(suggestion);
        }
        
        return true;
    } catch (e) {
        console.error('تصدیق میں خرابی:', e);
        document.getElementById('data-verification-result').innerHTML = '<div style="color: var(--danger-color);">تصدیق کے عمل میں خرابی</div>';
        return false;
    }
}

function clearAllData() {
    if (!confirm('کیا آپ واقعی تمام ڈیٹا صاف کرنا چاہتے ہیں؟ یہ عمل واپس نہیں ہو سکتا۔')) {
        return;
    }
    
    try {
        localStorage.removeItem(DATA_KEY);
        localStorage.removeItem(BACKUP_KEYS.AUTO);
        localStorage.removeItem(BACKUP_KEYS.MANUAL);
        
        attendanceData = getDefaultDataStructure();
        initApp();
        alert('تمام ڈیٹا کامیابی سے صاف ہو گیا!');
    } catch (e) {
        console.error('ڈیٹا صاف کرنے میں خرابی:', e);
        alert('خرابی! کنسول چیک کریں۔');
    }
}

function initApp() {
    try {
        const savedData = localStorage.getItem(DATA_KEY);
        
        if (savedData) {
            try {
                attendanceData = JSON.parse(savedData);
                if (!validateDataStructure(attendanceData)) {
                    console.warn('ڈیٹا کی ساخت درست نہیں، مرمت کی کوشش کی جا رہی ہے');
                    attendanceData = repairData(attendanceData);
                    saveData();
                }
            } catch (e) {
                console.error("ڈیٹا لوڈ کرنے میں خرابی:", e);
                if (tryRecoverFromBackup()) return;
                attendanceData = getDefaultDataStructure();
            }
        } else {
            attendanceData = getDefaultDataStructure();
        }
        
        updateDateDisplay();
        loadAttendanceData();
        renderStudentList();
        initializeRecordTab();
        updateAutoBackupList();
    } catch (e) {
        console.error('ایپ شروع کرنے میں خرابی:', e);
        alert('ایپ شروع کرنے میں خرابی! کنسول چیک کریں۔');
    }
}

function tryRecoverFromBackup() {
    try {
        const autoBackups = JSON.parse(localStorage.getItem(BACKUP_KEYS.AUTO)) || [];
        if (autoBackups.length > 0) {
            if (confirm('پرائمری ڈیٹا خراب ہے۔ کیا آپ تازہ ترین بیک اپ سے بحال کرنا چاہیں گے؟')) {
                attendanceData = repairData(autoBackups[0].data);
                saveData();
                return true;
            }
        }
        
        const manualBackups = JSON.parse(localStorage.getItem(BACKUP_KEYS.MANUAL)) || [];
        if (manualBackups.length > 0) {
            if (confirm('پرائمری ڈیٹا خراب ہے۔ کیا آپ تازہ ترین دستی بیک اپ سے بحال کرنا چاہیں گے؟')) {
                attendanceData = repairData(manualBackups[0].data);
                saveData();
                return true;
            }
        }
        
        return false;
    } catch (e) {
        console.error('بحالی کی کوشش میں خرابی:', e);
        return false;
    }
}

function updateDateDisplay() {
    const datePicker = document.getElementById('date-picker');
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    
    // Adjust for timezone to avoid date shifting
    const timezoneOffset = currentDate.getTimezoneOffset() * 60000;
    const adjustedDate = new Date(currentDate.getTime() - timezoneOffset);
    datePicker.value = adjustedDate.toISOString().split('T')[0];
    
    currentDateElement.textContent = currentDate.toLocaleDateString('ur-PK', options);
}

function loadAttendanceData() {
    const dateStr = currentDate.toISOString().split('T')[0];
    const section = document.getElementById('section-selector').value;
    
    if (!attendanceData.sections[section].attendance[dateStr]) {
        const newAttendance = attendanceData.sections[section].students.map(() => ({
            present: false, lesson: false, homework: false, milestone: false, comment: '',
            lessonQuantity: "", homeworkQuantity: "", milestoneQuantity: ""
        }));
        attendanceData.sections[section].attendance[dateStr] = newAttendance;
    }
    
    renderAttendanceTable();
    updateStats();
}

function renderAttendanceTable() {
    const dateStr = currentDate.toISOString().split('T')[0];
    const section = document.getElementById('section-selector').value;
    const tableBody = document.querySelector('#attendance-table tbody');
    tableBody.innerHTML = '';
    
    const students = attendanceData.sections[section].students;
    const attendanceRecords = attendanceData.sections[section].attendance[dateStr] || [];
    
    students.forEach((student, index) => {
        const record = attendanceRecords[index] || {
            present: false, lesson: false, homework: false, milestone: false, comment: '',
            lessonQuantity: "", homeworkQuantity: "", milestoneQuantity: ""
        };
        
        const row = document.createElement('tr');
        row.classList.add(record.present ? 'present-row' : 'absent-row');
        
        const studentDetail = attendanceData.studentDetails[student] || {};
        const phoneNumber = studentDetail.phone || 'فون نمبر نہیں';
        const whatsappLink = phoneNumber.match(/\d/) ? 
            `<a href="https://wa.me/${phoneNumber.replace(/\D/g, '')}" class="whatsapp-link" target="_blank"><i class="fab fa-whatsapp"></i></a>` : '';
        
        row.innerHTML = `
            <td>
                <span class="edit-name" data-student="${student}">✏️</span>
                ${student}
                <br>
                <span class="phone-number">
                    <span class="edit-phone" data-student="${student}">✏️</span>
                    ${phoneNumber} ${whatsappLink}
                </span>
            </td>
            <td><input type="checkbox" class="attendance-check" ${record.present ? 'checked' : ''} data-field="present" data-index="${index}"></td>
            <td>
                <input type="checkbox" class="attendance-check" ${record.lesson ? 'checked' : ''} ${record.present ? '' : 'disabled'} data-field="lesson" data-index="${index}" data-type="lesson">
                ${record.lesson && record.lessonQuantity ? `<span class="quantity-info">${record.lessonQuantity}</span>` : ''}
            </td>
            <td>
                <input type="checkbox" class="attendance-check" ${record.homework ? 'checked' : ''} ${record.present ? '' : 'disabled'} data-field="homework" data-index="${index}" data-type="homework">
                ${record.homework && record.homeworkQuantity ? `<span class="quantity-info">${record.homeworkQuantity}</span>` : ''}
            </td>
            <td>
                <input type="checkbox" class="attendance-check" ${record.milestone ? 'checked' : ''} ${record.present ? '' : 'disabled'} data-field="milestone" data-index="${index}" data-type="milestone">
                ${record.milestone && record.milestoneQuantity ? `<span class="quantity-info">${record.milestoneQuantity}</span>` : ''}
            </td>
            <td><span class="comment-icon" data-index="${index}">💬</span> ${record.comment ? '✔' : ''}</td>
            <td>
                <button class="small-btn view-btn" data-student="${student}">رپورٹ</button>
            </td>
        `;
        
        tableBody.appendChild(row);
    });
    
    addEventListeners();
}

function renderStudentList() {
    const section = document.getElementById('section-selector').value;
    const studentList = document.getElementById('student-list');
    studentList.innerHTML = '';
    
    attendanceData.sections[section].students.forEach((student, index) => {
        const studentItem = document.createElement('div');
        studentItem.className = 'student-item';
        
        const studentDetail = attendanceData.studentDetails[student] || {};
        
        studentItem.innerHTML = `
            <span>${student} <small>${studentDetail.phone ? '('+studentDetail.phone+')' : ''}</small></span>
            <div>
                <button class="small-btn delete-btn" data-index="${index}">حذف</button>
            </div>
        `;
        studentList.appendChild(studentItem);
    });
    
    document.querySelectorAll('#student-list .delete-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const index = this.dataset.index;
            const section = document.getElementById('section-selector').value;
            const studentName = attendanceData.sections[section].students[index];
            
            if (confirm(`کیا آپ واقعی ${studentName} کو حذف کرنا چاہتے ہیں؟`)) {
                attendanceData.sections[section].students.splice(index, 1);
                
                for (const date in attendanceData.sections[section].attendance) {
                    if (attendanceData.sections[section].attendance[date] && attendanceData.sections[section].attendance[date][index]) {
                        attendanceData.sections[section].attendance[date].splice(index, 1);
                    }
                }
                
                renderStudentList();
                saveData();
                loadAttendanceData();
                updateStudentSelector();
            }
        });
    });
}

function updateStats() {
    const dateStr = currentDate.toISOString().split('T')[0];
    const section = document.getElementById('section-selector').value;
    
    const students = attendanceData.sections[section].students;
    const attendanceRecords = attendanceData.sections[section].attendance[dateStr] || [];
    
    const total = students.length;
    const present = attendanceRecords.filter(r => r?.present).length;
    const absent = total - present;
    const lesson = attendanceRecords.filter(r => r?.lesson).length;
    const homework = attendanceRecords.filter(r => r?.homework).length;
    const milestone = attendanceRecords.filter(r => r?.milestone).length;
    
    let totalLessonQuantity = 0;
    let totalHomeworkQuantity = 0;
    let totalMilestoneQuantity = 0;
    
    let presentNames = [], absentNames = [], lessonNames = [], homeworkNames = [], milestoneNames = [];
    
    attendanceRecords.forEach((record, index) => {
        const studentName = students[index];
        if (record?.present) {
            presentNames.push(studentName);
            if (record?.lesson) lessonNames.push(studentName);
            if (record?.homework) homeworkNames.push(studentName);
            if (record?.milestone) milestoneNames.push(studentName);
        } else {
            absentNames.push(studentName);
        }
        
        if (record?.lesson && record.lessonQuantity) {
            const match = String(record.lessonQuantity).match(/\d+/);
            if (match) totalLessonQuantity += parseInt(match[0], 10);
        }
        if (record?.homework && record.homeworkQuantity) {
            const match = String(record.homeworkQuantity).match(/\d+/);
            if (match) totalHomeworkQuantity += parseInt(match[0], 10);
        }
        if (record?.milestone && record.milestoneQuantity) {
            const match = String(record.milestoneQuantity).match(/\d+/);
            if (match) totalMilestoneQuantity += parseInt(match[0], 10);
        }
    });
    
    document.getElementById('total-students').textContent = total;
    document.getElementById('present-count').textContent = present;
    document.getElementById('absent-count').textContent = absent;
    document.getElementById('lesson-count').textContent = lesson;
    document.getElementById('homework-count').textContent = homework;
    document.getElementById('milestone-count').textContent = milestone;
    
    document.getElementById('present-names').textContent = presentNames.join(', ');
    document.getElementById('absent-names').textContent = absentNames.join(', ');
    document.getElementById('lesson-names').textContent = lessonNames.join(', ');
    document.getElementById('homework-names').textContent = homeworkNames.join(', ');
    document.getElementById('milestone-names').textContent = milestoneNames.join(', ');
    
    const statsDetails = document.getElementById('stats-details');
    statsDetails.innerHTML = '';
    
    const categories = [
        { name: 'حاضری', value: present, total, quantity: '' },
        { name: 'سبق', value: lesson, total: present, quantity: totalLessonQuantity > 0 ? `کل مقدار: ${totalLessonQuantity}` : '' },
        { name: 'سبقی', value: homework, total: present, quantity: totalHomeworkQuantity > 0 ? `کل مقدار: ${totalHomeworkQuantity}` : '' },
        { name: 'منزل', value: milestone, total: present, quantity: totalMilestoneQuantity > 0 ? `کل مقدار: ${totalMilestoneQuantity}` : '' }
    ];
    
    categories.forEach(cat => {
        const row = document.createElement('tr');
        const percentage = cat.total > 0 ? Math.round((cat.value / cat.total) * 100) : 0;
        row.innerHTML = `<td>${cat.name}</td><td>${cat.value}/${cat.total}</td><td>${percentage}%</td><td>${cat.quantity}</td>`;
        statsDetails.appendChild(row);
    });
}

function initializeRecordTab() {
    const yearSelect = document.getElementById('year-selector');
    const currentYear = new Date().getFullYear();
    yearSelect.innerHTML = '<option value="">-- سال منتخب کریں --</option>';
    for (let year = 2020; year <= currentYear + 5; year++) {
        const option = document.createElement('option');
        option.value = year; option.textContent = year;
        yearSelect.appendChild(option);
    }
    
    const monthSelect = document.getElementById('month-selector');
    const months = ['جنوری', 'فروری', 'مارچ', 'اپریل', 'مئی', 'جون', 'جولائی', 'اگست', 'ستمبر', 'اکتوبر', 'نومبر', 'دسمبر'];
    monthSelect.innerHTML = '<option value="">-- مہینہ منتخب کریں --</option>';
    months.forEach((month, index) => {
        const option = document.createElement('option');
        option.value = index + 1; option.textContent = month;
        monthSelect.appendChild(option);
    });
    
    updateStudentSelector();
}

function updateStudentSelector() {
    const studentSelect = document.getElementById('student-selector');
    const section = document.getElementById('section-selector').value;
    studentSelect.innerHTML = '<option value="">-- طالب علم منتخب کریں --</option>';
    if(attendanceData && attendanceData.sections && attendanceData.sections[section]){
        attendanceData.sections[section].students.forEach(student => {
            const option = document.createElement('option');
            option.value = student; option.textContent = student;
            studentSelect.appendChild(option);
        });
    }
}

document.getElementById('load-record').addEventListener('click', function() {
    const year = document.getElementById('year-selector').value;
    const month = document.getElementById('month-selector').value;
    const student = document.getElementById('student-selector').value;
    const date = document.getElementById('record-date-picker').value;
    const section = document.getElementById('section-selector').value;
    
    if (!student) {
        alert('براہ کرم طالب علم منتخب کریں');
        return;
    }
    loadStudentRecord(year, month, student, section, date);
});

function loadStudentRecord(year, month, studentName, section, specificDate) {
    const recordData = document.getElementById('record-data');
    recordData.innerHTML = '';
    
    let totalPresent = 0, totalLesson = 0, totalHomework = 0, totalMilestone = 0, totalDays = 0;
    let totalLessonQuantity = 0, totalHomeworkQuantity = 0, totalMilestoneQuantity = 0;
    
    for (const date in attendanceData.sections[section].attendance) {
        const dateObj = new Date(date);
        const recordYear = dateObj.getUTCFullYear();
        const recordMonth = dateObj.getUTCMonth() + 1;
        const recordDate = dateObj.toISOString().split('T')[0];
        
        if ((!year || recordYear == year) && (!month || recordMonth == month) && (!specificDate || recordDate == specificDate)) {
            const studentIndex = attendanceData.sections[section].students.indexOf(studentName);
            if (studentIndex !== -1) {
                const record = attendanceData.sections[section].attendance[date][studentIndex];
                if (record) {
                    totalDays++;
                    if (record.present) totalPresent++;
                    if (record.lesson) {
                        totalLesson++;
                        if (record.lessonQuantity) {
                            const match = String(record.lessonQuantity).match(/\d+/);
                            if (match) totalLessonQuantity += parseInt(match[0], 10);
                        }
                    }
                    if (record.homework) {
                        totalHomework++;
                        if (record.homeworkQuantity) {
                            const match = String(record.homeworkQuantity).match(/\d+/);
                            if (match) totalHomeworkQuantity += parseInt(match[0], 10);
                        }
                    }
                    if (record.milestone) {
                        totalMilestone++;
                        if (record.milestoneQuantity) {
                            const match = String(record.milestoneQuantity).match(/\d+/);
                            if (match) totalMilestoneQuantity += parseInt(match[0], 10);
                        }
                    }
                    
                    const row = document.createElement('tr');
                    row.innerHTML = `
                        <td>${studentName}</td>
                        <td>${dateObj.toLocaleDateString('ur-PK')}</td>
                        <td>${record.present ? '✔' : '✘'}</td>
                        <td>${record.lesson ? '✔' : '✘'}</td>
                        <td>${record.homework ? '✔' : '✘'}</td>
                        <td>${record.milestone ? '✔' : '✘'}</td>
                        <td>${record.comment || '-'}</td>
                        <td>${record.lesson ? (record.lessonQuantity || '-') : '-'}</td>
                        <td>${record.homework ? (record.homeworkQuantity || '-') : '-'}</td>
                        <td>${record.milestone ? (record.milestoneQuantity || '-') : '-'}</td>
                    `;
                    recordData.appendChild(row);
                }
            }
        }
    }
    
    const summaryStats = document.getElementById('summary-stats');
    let title = `${studentName} کا خلاصہ`;
    if (specificDate) {
        title += ` (${new Date(specificDate).toLocaleDateString('ur-PK')})`;
    } else if (year) {
        title += ` (${year}${month ? ' - ' + document.getElementById('month-selector').selectedOptions[0].text : ''})`;
    }
    
    summaryStats.innerHTML = `
        <h4>${title}</h4>
        <div class="summary-cards">
            <div class="summary-card"><h5>کل دن</h5><div class="stat-value">${totalDays}</div></div>
            <div class="summary-card"><h5>حاضری</h5><div class="stat-value">${totalPresent} (${totalDays > 0 ? Math.round((totalPresent/totalDays)*100) : 0}%)</div></div>
            <div class="summary-card"><h5>سبق</h5><div class="stat-value">${totalLesson} (${totalPresent > 0 ? Math.round((totalLesson/totalPresent)*100) : 0}%)</div>${totalLessonQuantity > 0 ? `<div class="quantity-info">کل مقدار: ${totalLessonQuantity}</div>` : ''}</div>
            <div class="summary-card"><h5>سبقی</h5><div class="stat-value">${totalHomework} (${totalPresent > 0 ? Math.round((totalHomework/totalPresent)*100) : 0}%)</div>${totalHomeworkQuantity > 0 ? `<div class="quantity-info">کل مقدار: ${totalHomeworkQuantity}</div>` : ''}</div>
            <div class="summary-card"><h5>منزل</h5><div class="stat-value">${totalMilestone} (${totalPresent > 0 ? Math.round((totalMilestone/totalPresent)*100) : 0}%)</div>${totalMilestoneQuantity > 0 ? `<div class="quantity-info">کل مقدار: ${totalMilestoneQuantity}</div>` : ''}</div>
        </div>
    `;
    
    document.getElementById('full-record-result').style.display = 'block';
}

function exportToPDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    const section = document.getElementById('section-selector').value;
    const studentName = document.getElementById('student-selector').value;
    const year = document.getElementById('year-selector').value;
    const month = document.getElementById('month-selector').value;
    const date = document.getElementById('record-date-picker').value;
    
    if (!studentName) {
        alert('Please select a student first');
        return;
    }
    
    let title = `${studentName}'s Report`;
    if (date) {
        title += ` (${new Date(date).toLocaleDateString('en-PK')})`;
    } else if (year) {
        const monthName = month ? document.querySelector(`#month-selector option[value='${month}']`).textContent : '';
        title += ` (${year}${month ? ' - ' + monthName : ''})`;
    }
    
    doc.setFontSize(18);
    doc.text(title, 105, 15, { align: 'center' });
    
    const headers = ['Date', 'Attendance', 'Lesson', 'Homework', 'Milestone', 'Comment', 'Lesson Qty', 'Homework Qty', 'Milestone Qty'];
    const data = [];
    let totalPresent = 0, totalLesson = 0, totalHomework = 0, totalMilestone = 0, totalDays = 0;
    let totalLessonQuantity = 0, totalHomeworkQuantity = 0, totalMilestoneQuantity = 0;
    const studentIndex = attendanceData.sections[section].students.indexOf(studentName);
    
    for (const dateStr in attendanceData.sections[section].attendance) {
        const dateObj = new Date(dateStr);
        const recordYear = dateObj.getUTCFullYear();
        const recordMonth = dateObj.getUTCMonth() + 1;
        
        if ((!year || recordYear == year) && (!month || recordMonth == month) && (!date || dateStr == date)) {
            const record = attendanceData.sections[section].attendance[dateStr][studentIndex];
            if (record) {
                totalDays++;
                if (record.present) totalPresent++;
                if (record.lesson) {
                    totalLesson++;
                    if (record.lessonQuantity) {
                        const match = String(record.lessonQuantity).match(/\d+/);
                        if (match) totalLessonQuantity += parseInt(match[0], 10);
                    }
                }
                if (record.homework) {
                    totalHomework++;
                    if (record.homeworkQuantity) {
                        const match = String(record.homeworkQuantity).match(/\d+/);
                        if (match) totalHomeworkQuantity += parseInt(match[0], 10);
                    }
                }
                if (record.milestone) {
                    totalMilestone++;
                    if (record.milestoneQuantity) {
                        const match = String(record.milestoneQuantity).match(/\d+/);
                        if (match) totalMilestoneQuantity += parseInt(match[0], 10);
                    }
                }
                data.push([
                    dateObj.toLocaleDateString('en-PK'), record.present ? 'Present' : 'Absent',
                    record.lesson ? 'Yes' : 'No', record.homework ? 'Yes' : 'No',
                    record.milestone ? 'Yes' : 'No', record.comment || '-',
                    record.lessonQuantity || '-', record.homeworkQuantity || '-', record.milestoneQuantity || '-'
                ]);
            }
        }
    }
    
    doc.autoTable({
        head: [headers], body: data, startY: 25,
        styles: { font: 'helvetica', fontStyle: 'normal', textColor: [0, 0, 0], halign: 'center' },
        headStyles: { fillColor: [52, 152, 219], textColor: [255, 255, 255], fontStyle: 'bold' },
        alternateRowStyles: { fillColor: [240, 240, 240] }
    });
    
    let summaryY = doc.lastAutoTable.finalY + 15;
    doc.setFontSize(14);
    doc.text('Summary:', 105, summaryY, { align: 'center' });
    summaryY += 10;
    
    const summaryData = [
        `Total Days: ${totalDays}`, `Attendance: ${totalPresent} (${totalDays > 0 ? Math.round((totalPresent/totalDays)*100) : 0}%)`,
        `Lessons: ${totalLesson} (${totalPresent > 0 ? Math.round((totalLesson/totalPresent)*100) : 0}%)`,
        totalLessonQuantity > 0 ? `Total Lesson Quantity: ${totalLessonQuantity}` : '',
        `Homework: ${totalHomework} (${totalPresent > 0 ? Math.round((totalHomework/totalPresent)*100) : 0}%)`,
        totalHomeworkQuantity > 0 ? `Total Homework Quantity: ${totalHomeworkQuantity}` : '',
        `Milestones: ${totalMilestone} (${totalPresent > 0 ? Math.round((totalMilestone/totalPresent)*100) : 0}%)`,
        totalMilestoneQuantity > 0 ? `Total Milestone Quantity: ${totalMilestoneQuantity}` : ''
    ];
    
    doc.setFontSize(12);
    summaryData.forEach(line => {
        if (line) {
            doc.text(line, 105, summaryY, { align: 'center' });
            summaryY += 7;
        }
    });
    
    const exportName = `${studentName}_Record_${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(exportName);
}

function exportData() {
    const dataStr = JSON.stringify(attendanceData);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    const currentDate = new Date().toISOString().split('T')[0];
    const section = document.getElementById('section-selector').value;
    const exportName = prompt('براہ کرم ایکسپورٹ فائل کا نام درج کریں:', `حاضری_ڈیٹا_${section}_${currentDate}.json`);
    
    if (exportName) {
        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportName.endsWith('.json') ? exportName : exportName + '.json');
        linkElement.click();
    }
}

function importData(event) {
    const file = event.target.files[0];
    const reader = new FileReader();
    
    reader.onload = function(e) {
        try {
            const contents = e.target.result;
            const importedData = JSON.parse(contents);
            
            if (importedData.sections && importedData.studentDetails) {
                if (!validateDataStructure(importedData)) {
                    alert('درآمد شدہ ڈیٹا کی ساخت درست نہیں۔ مرمت کی کوشش کی جا رہی ہے۔');
                    attendanceData = repairData(importedData);
                } else {
                    attendanceData = importedData;
                }
                saveData();
                initApp();
                alert('ڈیٹا کامیابی سے لوڈ ہو گیا!');
            } else {
                alert('غلط ڈیٹا فائل۔ براہ کرم درست JSON فائل منتخب کریں۔');
            }
        } catch (error) {
            console.error('درآمد میں خرابی:', error);
            alert('فائل پڑھنے میں خرابی۔ براہ کرم دوبارہ کوشش کریں۔');
        }
    };
    reader.readAsText(file);
}

function exportToCSV() {
    const section = document.getElementById('section-selector').value;
    const currentDate = new Date().toISOString().split('T')[0];
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "نام,تاریخ,حاضری,سبق,سبقی,منزل,تبصرہ,سبق مقدار,سبقی مقدار,منزل مقدار\n";
    
    for (const date in attendanceData.sections[section].attendance) {
        const dateObj = new Date(date);
        const formattedDate = dateObj.toLocaleDateString('ur-PK');
        
        attendanceData.sections[section].attendance[date].forEach((record, index) => {
            const studentName = attendanceData.sections[section].students[index];
            if (studentName) {
                const row = [
                    `"${studentName}"`, `"${formattedDate}"`,
                    record.present ? 'حاضر' : 'غیر حاضر', record.lesson ? 'ہاں' : 'نہیں',
                    record.homework ? 'ہاں' : 'نہیں', record.milestone ? 'ہاں' : 'نہیں',
                    `"${(record.comment || '').replace(/"/g, '""')}"`, `"${record.lessonQuantity || ''}"`,
                    `"${record.homeworkQuantity || ''}"`, `"${record.milestoneQuantity || ''}"`
                ];
                csvContent += row.join(',') + "\n";
            }
        });
    }
    
    const exportName = prompt('براہ کرم CSV فائل کا نام درج کریں:', `حاضری_ڈیٹا_${section}_${currentDate}.csv`);
    if (exportName) {
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", exportName.endsWith('.csv') ? exportName : exportName + '.csv');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
}

function importFromCSV(event) {
    const file = event.target.files[0];
    const reader = new FileReader();
    const section = document.getElementById('section-selector').value;
    
    reader.onload = function(e) {
        try {
            const contents = e.target.result;
            const lines = contents.split('\n');
            const tempData = { students: [], attendance: {} };
            
            for (let i = 1; i < lines.length; i++) {
                if (lines[i].trim() === '') continue;
                
                const values = lines[i].split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
                const studentName = values[0].replace(/"/g, '');
                const date = values[1].replace(/"/g, '');
                
                if (!tempData.students.includes(studentName)) {
                    tempData.students.push(studentName);
                }
                if (!tempData.attendance[date]) {
                    tempData.attendance[date] = [];
                }
                
                const studentIndex = tempData.students.indexOf(studentName);
                while (tempData.attendance[date].length <= studentIndex) {
                    tempData.attendance[date].push({ present: false, lesson: false, homework: false, milestone: false, comment: '', lessonQuantity: "", homeworkQuantity: "", milestoneQuantity: "" });
                }
                
                tempData.attendance[date][studentIndex] = {
                    present: values[2].trim() === 'حاضر',
                    lesson: values[3].trim() === 'ہاں',
                    homework: values[4].trim() === 'ہاں',
                    milestone: values[5].trim() === 'ہاں',
                    comment: values[6].replace(/"/g, ''),
                    lessonQuantity: values[7].replace(/"/g, ''),
                    homeworkQuantity: values[8].replace(/"/g, ''),
                    milestoneQuantity: values[9].replace(/"/g, '')
                };
            }
            
            attendanceData.sections[section] = tempData;
            saveData();
            initApp();
            alert('CSV ڈیٹا کامیابی سے درآمد ہو گیا!');
        } catch (error) {
            console.error('CSV درآمد میں خرابی:', error);
            alert('CSV فائل پڑھنے میں خرابی۔ براہ کرم دوبارہ کوشش کریں۔');
        }
    };
    reader.readAsText(file);
}

function exportStudents() {
    const section = document.getElementById('section-selector').value;
    const currentDate = new Date().toISOString().split('T')[0];
    const dataToExport = {
        students: attendanceData.sections[section].students,
        studentDetails: attendanceData.studentDetails
    };
    const dataStr = JSON.stringify(dataToExport, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    const exportName = prompt('براہ کرم ایکسپورٹ فائل کا نام درج کریں:', `طلباء_فہرست_${section}_${currentDate}.json`);
    
    if (exportName) {
        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportName.endsWith('.json') ? exportName : exportName + '.json');
        linkElement.click();
    }
}

function importStudents(event) {
    const file = event.target.files[0];
    const reader = new FileReader();
    const section = document.getElementById('section-selector').value;
    
    reader.onload = function(e) {
        try {
            const contents = e.target.result;
            const importedData = JSON.parse(contents);
            
            if (Array.isArray(importedData.students) && typeof importedData.studentDetails === 'object') {
                if (confirm('کیا آپ موجودہ طلباء کی فہرست کو اس فائل سے تبدیل کرنا چاہتے ہیں؟')) {
                    attendanceData.sections[section].students = importedData.students;
                    Object.assign(attendanceData.studentDetails, importedData.studentDetails);
                    saveData();
                    renderStudentList();
                    loadAttendanceData();
                    updateStudentSelector();
                    alert('طلباء کی فہرست کامیابی سے درآمد ہو گئی!');
                }
            } else {
                alert('غلط ڈیٹا فائل۔ براہ کرم درست JSON فائل منتخب کریں۔');
            }
        } catch (error) {
            console.error('درآمد میں خرابی:', error);
            alert('فائل پڑھنے میں خرابی۔ براہ کرم دوبارہ کوشش کریں۔');
        }
    };
    reader.readAsText(file);
}

function addEventListeners() {
    document.querySelectorAll('.attendance-check').forEach(checkbox => {
        checkbox.addEventListener('change', function() {
            const dateStr = currentDate.toISOString().split('T')[0];
            const section = document.getElementById('section-selector').value;
            const index = this.dataset.index;
            const field = this.dataset.field;
            
            attendanceData.sections[section].attendance[dateStr][index][field] = this.checked;
            
            if (field === 'present') {
                const row = this.closest('tr');
                const checks = row.querySelectorAll('[data-field="lesson"], [data-field="homework"], [data-field="milestone"]');
                checks.forEach(c => c.disabled = !this.checked);
                
                if (!this.checked) {
                    checks.forEach(c => c.checked = false);
                    attendanceData.sections[section].attendance[dateStr][index].lesson = false;
                    attendanceData.sections[section].attendance[dateStr][index].homework = false;
                    attendanceData.sections[section].attendance[dateStr][index].milestone = false;
                }
                row.classList.toggle('present-row', this.checked);
                row.classList.toggle('absent-row', !this.checked);
            }
            
            if (this.checked && (field === 'lesson' || field === 'homework' || field === 'milestone')) {
                selectedStudentIndex = index;
                const type = this.dataset.type;
                const studentName = attendanceData.sections[section].students[index];
                const quantity = attendanceData.sections[section].attendance[dateStr][index][`${type}Quantity`] || '';
                
                const fieldNameUrdu = field === 'lesson' ? 'سبق' : (field === 'homework' ? 'سبقی' : 'منزل');
                document.getElementById(`${type}-quantity-title`).textContent = `${studentName} کی ${fieldNameUrdu} مقدار`;
                document.getElementById(`${type}-quantity-input`).value = quantity;
                document.getElementById(`${type}-quantity-modal`).style.display = 'block';
            }
            
            saveData();
            updateStats();
        });
    });
    
    document.querySelectorAll('.comment-icon').forEach(icon => {
        icon.addEventListener('click', function() {
            const dateStr = currentDate.toISOString().split('T')[0];
            const section = document.getElementById('section-selector').value;
            selectedStudentIndex = this.dataset.index;
            const studentName = attendanceData.sections[section].students[selectedStudentIndex];
            const comment = attendanceData.sections[section].attendance[dateStr][selectedStudentIndex].comment || '';
            document.getElementById('comment-title').textContent = `${studentName} کا تبصرہ`;
            document.getElementById('comment-text').value = comment;
            document.getElementById('comment-modal').style.display = 'block';
        });
    });
    
    document.querySelectorAll('.edit-phone').forEach(btn => {
        btn.addEventListener('click', function() {
            const studentName = this.dataset.student;
            const phone = attendanceData.studentDetails[studentName]?.phone || '';
            selectedStudentIndex = attendanceData.sections[document.getElementById('section-selector').value].students.indexOf(studentName);
            document.getElementById('phone-title').textContent = `${studentName} کا فون نمبر`;
            document.getElementById('phone-number').value = phone;
            document.getElementById('phone-modal').style.display = 'block';
        });
    });
    
    document.querySelectorAll('.edit-name').forEach(btn => {
        btn.addEventListener('click', function() {
            const studentName = this.dataset.student;
            selectedStudentIndex = attendanceData.sections[document.getElementById('section-selector').value].students.indexOf(studentName);
            document.getElementById('name-title').textContent = 'طالب علم کا نام تبدیل کریں';
            document.getElementById('student-name').value = studentName;
            document.getElementById('name-modal').style.display = 'block';
        });
    });
    
    document.querySelectorAll('#attendance-table .view-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const studentName = this.dataset.student;
            const section = document.getElementById('section-selector').value;
            document.getElementById('report-title').textContent = `${studentName} کی رپورٹ`;
            
            let totalDays = 0, presentDays = 0, lessonDays = 0, homeworkDays = 0, milestoneDays = 0;
            let totalLessonQuantity = 0, totalHomeworkQuantity = 0, totalMilestoneQuantity = 0;
            let lastComment = '';
            
            const studentIndex = attendanceData.sections[section].students.indexOf(studentName);
            if (studentIndex !== -1) {
                for (const date in attendanceData.sections[section].attendance) {
                    const record = attendanceData.sections[section].attendance[date][studentIndex];
                    if (record) {
                        totalDays++;
                        if (record.present) presentDays++;
                        if (record.lesson) {
                            lessonDays++;
                            if (record.lessonQuantity) {
                                const match = String(record.lessonQuantity).match(/\d+/);
                                if (match) totalLessonQuantity += parseInt(match[0], 10);
                            }
                        }
                        if (record.homework) {
                            homeworkDays++;
                            if (record.homeworkQuantity) {
                                const match = String(record.homeworkQuantity).match(/\d+/);
                                if (match) totalHomeworkQuantity += parseInt(match[0], 10);
                            }
                        }
                        if (record.milestone) {
                            milestoneDays++;
                            if (record.milestoneQuantity) {
                                const match = String(record.milestoneQuantity).match(/\d+/);
                                if (match) totalMilestoneQuantity += parseInt(match[0], 10);
                            }
                        }
                        if (record.comment) lastComment = record.comment;
                    }
                }
            }
            
            const reportContent = document.querySelector('#report-content table');
            reportContent.innerHTML = `
                <tr><th>کل دن</th><td>${totalDays}</td></tr>
                <tr><th>حاضری</th><td>${presentDays} (${totalDays > 0 ? Math.round((presentDays/totalDays)*100) : 0}%)</td></tr>
                <tr><th>سبق</th><td>${lessonDays} (${presentDays > 0 ? Math.round((lessonDays/presentDays)*100) : 0}%)</td></tr>
                <tr><th>سبق کی کل مقدار</th><td>${totalLessonQuantity > 0 ? totalLessonQuantity : "-"}</td></tr>
                <tr><th>سبقی</th><td>${homeworkDays} (${presentDays > 0 ? Math.round((homeworkDays/presentDays)*100) : 0}%)</td></tr>
                <tr><th>سبقی کی کل مقدار</th><td>${totalHomeworkQuantity > 0 ? totalHomeworkQuantity : "-"}</td></tr>
                <tr><th>منزل</th><td>${milestoneDays} (${presentDays > 0 ? Math.round((milestoneDays/presentDays)*100) : 0}%)</td></tr>
                <tr><th>منزل کی کل مقدار</th><td>${totalMilestoneQuantity > 0 ? totalMilestoneQuantity : "-"}</td></tr>
                <tr><th>آخری تبصرہ</th><td>${lastComment || 'کوئی تبصرہ نہیں'}</td></tr>
            `;
            document.getElementById('report-modal').style.display = 'block';
        });
    });
}

// All Modal Event Listeners
document.querySelectorAll('.close').forEach(btn => btn.addEventListener('click', function() { this.closest('.modal').style.display = 'none'; }));

document.getElementById('save-comment').addEventListener('click', function() {
    if (selectedStudentIndex !== null) {
        const dateStr = currentDate.toISOString().split('T')[0];
        const section = document.getElementById('section-selector').value;
        attendanceData.sections[section].attendance[dateStr][selectedStudentIndex].comment = document.getElementById('comment-text').value;
        saveData();
        renderAttendanceTable();
        document.getElementById('comment-modal').style.display = 'none';
    }
});

document.getElementById('save-phone').addEventListener('click', function() {
    if (selectedStudentIndex !== null) {
        const section = document.getElementById('section-selector').value;
        const studentName = attendanceData.sections[section].students[selectedStudentIndex];
        const phone = document.getElementById('phone-number').value;
        if (!attendanceData.studentDetails[studentName]) attendanceData.studentDetails[studentName] = {};
        attendanceData.studentDetails[studentName].phone = phone;
        saveData();
        renderAttendanceTable();
        renderStudentList();
        document.getElementById('phone-modal').style.display = 'none';
    }
});

document.getElementById('save-name').addEventListener('click', function() {
    if (selectedStudentIndex !== null) {
        const section = document.getElementById('section-selector').value;
        const oldName = attendanceData.sections[section].students[selectedStudentIndex];
        const newName = document.getElementById('student-name').value.trim();
        if (newName && newName !== oldName) {
            attendanceData.sections[section].students[selectedStudentIndex] = newName;
            if (attendanceData.studentDetails[oldName]) {
                attendanceData.studentDetails[newName] = attendanceData.studentDetails[oldName];
                delete attendanceData.studentDetails[oldName];
            }
            saveData();
            renderAttendanceTable();
            renderStudentList();
            updateStudentSelector();
            document.getElementById('name-modal').style.display = 'none';
        } else { alert('براہ کرم ایک درست نام درج کریں'); }
    }
});

document.getElementById('save-lesson-quantity').addEventListener('click', function() {
    if (selectedStudentIndex !== null) {
        const dateStr = currentDate.toISOString().split('T')[0];
        const section = document.getElementById('section-selector').value;
        attendanceData.sections[section].attendance[dateStr][selectedStudentIndex].lessonQuantity = document.getElementById('lesson-quantity-input').value;
        saveData();
        renderAttendanceTable();
        updateStats();
        document.getElementById('lesson-quantity-modal').style.display = 'none';
    }
});

document.getElementById('save-homework-quantity').addEventListener('click', function() {
    if (selectedStudentIndex !== null) {
        const dateStr = currentDate.toISOString().split('T')[0];
        const section = document.getElementById('section-selector').value;
        attendanceData.sections[section].attendance[dateStr][selectedStudentIndex].homeworkQuantity = document.getElementById('homework-quantity-input').value;
        saveData();
        renderAttendanceTable();
        updateStats();
        document.getElementById('homework-quantity-modal').style.display = 'none';
    }
});

document.getElementById('save-milestone-quantity').addEventListener('click', function() {
    if (selectedStudentIndex !== null) {
        const dateStr = currentDate.toISOString().split('T')[0];
        const section = document.getElementById('section-selector').value;
        attendanceData.sections[section].attendance[dateStr][selectedStudentIndex].milestoneQuantity = document.getElementById('milestone-quantity-input').value;
        saveData();
        renderAttendanceTable();
        updateStats();
        document.getElementById('milestone-quantity-modal').style.display = 'none';
    }
});

document.getElementById('add-student-btn').addEventListener('click', function() {
    const name = document.getElementById('new-student-name').value.trim();
    const phone = document.getElementById('new-student-phone').value.trim();
    if (name) {
        const section = document.getElementById('section-selector').value;
        if (!attendanceData.sections[section].students.includes(name)) {
            attendanceData.sections[section].students.push(name);
            if (phone) {
                if (!attendanceData.studentDetails[name]) attendanceData.studentDetails[name] = {};
                attendanceData.studentDetails[name].phone = phone;
            }
            
            const dateStr = currentDate.toISOString().split('T')[0];
            const defaultRecord = { present: false, lesson: false, homework: false, milestone: false, comment: '', lessonQuantity: "", homeworkQuantity: "", milestoneQuantity: "" };
            
            for (const date in attendanceData.sections[section].attendance) {
                attendanceData.sections[section].attendance[date].push(JSON.parse(JSON.stringify(defaultRecord)));
            }
            if(!attendanceData.sections[section].attendance[dateStr]){
                 loadAttendanceData();
            }

            document.getElementById('new-student-name').value = '';
            document.getElementById('new-student-phone').value = '';
            renderStudentList();
            saveData();
            loadAttendanceData();
            updateStudentSelector();
        } else { alert('یہ طالب علم پہلے سے موجود ہے'); }
    } else { alert('براہ کرم طالب علم کا نام درج کریں'); }
});

document.getElementById('clear-students-btn').addEventListener('click', function() {
    const section = document.getElementById('section-selector').value;
    if (confirm('کیا آپ واقعی تمام طلباء حذف کرنا چاہتے ہیں؟ تمام حاضری کا ڈیٹا بھی حذف ہو جائے گا۔')) {
        attendanceData.sections[section].students = [];
        attendanceData.sections[section].attendance = {};
        renderStudentList();
        saveData();
        loadAttendanceData();
        updateStudentSelector();
    }
});

// Main Button Event Listeners
document.getElementById('export-students-btn').addEventListener('click', exportStudents);
document.getElementById('import-students-btn').addEventListener('change', importStudents);

document.getElementById('date-picker').addEventListener('change', function() {
    const selectedDate = new Date(this.value);
    if (!isNaN(selectedDate.getTime())) {
        currentDate = new Date(selectedDate.getUTCFullYear(), selectedDate.getUTCMonth(), selectedDate.getUTCDate());
        updateDateDisplay();
        loadAttendanceData();
    }
});

document.getElementById('next-day-btn').addEventListener('click', function() {
    currentDate.setDate(currentDate.getDate() + 1);
    updateDateDisplay();
    loadAttendanceData();
});

document.getElementById('section-selector').addEventListener('change', function() {
    renderStudentList();
    loadAttendanceData();
    updateStudentSelector();
    initializeRecordTab();
});

document.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', function() {
        const tabId = this.dataset.tab;
        document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
        this.classList.add('active');
        document.getElementById(`${tabId}-tab`).classList.add('active');
        if (tabId === 'full-record') initializeRecordTab();
        if (tabId === 'backup') updateAutoBackupList();
    });
});

document.getElementById('save-btn').addEventListener('click', () => { if(saveData()) alert('ڈیٹا کامیابی سے محفوظ ہو گیا!'); });
document.getElementById('export-btn').addEventListener('click', exportData);
document.getElementById('import-btn').addEventListener('change', importData);
document.getElementById('export-csv-btn').addEventListener('click', exportToCSV);
document.getElementById('import-csv-btn').addEventListener('change', importFromCSV);
document.getElementById('export-pdf').addEventListener('click', exportToPDF);
document.getElementById('add-year-btn').addEventListener('click', () => document.getElementById('year-modal').style.display = 'block');

document.getElementById('save-year').addEventListener('click', function() {
    const newYear = parseInt(document.getElementById('new-year').value);
    const yearSelect = document.getElementById('year-selector');
    if (newYear && !isNaN(newYear) && newYear >= 2023 && newYear <= 2100) {
        let yearExists = Array.from(yearSelect.options).some(opt => parseInt(opt.value) === newYear);
        if (!yearExists) {
            const option = document.createElement('option');
            option.value = newYear; option.textContent = newYear;
            yearSelect.appendChild(option);
            // Sort options
            Array.from(yearSelect.options)
              .sort((a, b) => parseInt(a.value) - parseInt(b.value))
              .forEach(option => yearSelect.add(option));
            option.selected = true;
            alert(`سال ${newYear} کامیابی سے شامل کر دیا گیا ہے`);
        } else { alert('یہ سال پہلے سے موجود ہے'); }
        document.getElementById('year-modal').style.display = 'none';
        document.getElementById('new-year').value = '';
    } else { alert('براہ کرم 2023 سے 2100 کے درمیان ایک درست سال درج کریں'); }
});

document.getElementById('share-whatsapp').addEventListener('click', function() {
    const studentName = document.getElementById('student-selector').value;
    if (!studentName) { alert('براہ کرم پہلے طالب علم منتخب کریں'); return; }
    
    const year = document.getElementById('year-selector').value;
    const month = document.getElementById('month-selector').value;
    const date = document.getElementById('record-date-picker').value;
    const section = document.getElementById('section-selector').value;
    
    let totalDays = 0, presentDays = 0, lessonDays = 0, homeworkDays = 0, milestoneDays = 0;
    let totalLessonQuantity = 0, totalHomeworkQuantity = 0, totalMilestoneQuantity = 0;
    const studentIndex = attendanceData.sections[section].students.indexOf(studentName);
    
    if (studentIndex !== -1) {
        for (const dateStr in attendanceData.sections[section].attendance) {
            const dateObj = new Date(dateStr);
            if ((!year || dateObj.getUTCFullYear() == year) && 
                (!month || (dateObj.getUTCMonth() + 1) == month) && 
                (!date || dateStr == date)) {
                
                const record = attendanceData.sections[section].attendance[dateStr][studentIndex];
                if (record) {
                    totalDays++;
                    if (record.present) presentDays++;
                    if (record.lesson) {
                        lessonDays++;
                        if (record.lessonQuantity) {
                            const match = String(record.lessonQuantity).match(/\d+/);
                            if (match) totalLessonQuantity += parseInt(match[0], 10);
                        }
                    }
                    if (record.homework) {
                        homeworkDays++;
                        if (record.homeworkQuantity) {
                            const match = String(record.homeworkQuantity).match(/\d+/);
                            if (match) totalHomeworkQuantity += parseInt(match[0], 10);
                        }
                    }
                    if (record.milestone) {
                        milestoneDays++;
                        if (record.milestoneQuantity) {
                            const match = String(record.milestoneQuantity).match(/\d+/);
                            if (match) totalMilestoneQuantity += parseInt(match[0], 10);
                        }
                    }
                }
            }
        }
    }
    
    let title = `*${studentName} کی رپورٹ*`;
    if (date) {
        title += ` (${new Date(date).toLocaleDateString('ur-PK')})`;
    } else if (year) {
        const monthName = month ? document.querySelector(`#month-selector option[value='${month}']`).textContent : '';
        title += ` (${year}${month ? ' - ' + monthName : ''})`;
    }

    const summaryText = `
${title}

📅 کل دن: ${totalDays}
✅ حاضری: ${presentDays} (${totalDays > 0 ? Math.round((presentDays/totalDays)*100) : 0}%)
📖 سبق: ${lessonDays} (${presentDays > 0 ? Math.round((lessonDays/presentDays)*100) : 0}%)
${totalLessonQuantity > 0 ? `📏 کل سبق مقدار: ${totalLessonQuantity}\n` : ''}
📚 سبقی: ${homeworkDays} (${presentDays > 0 ? Math.round((homeworkDays/presentDays)*100) : 0}%)
${totalHomeworkQuantity > 0 ? `📏 کل سبقی مقدار: ${totalHomeworkQuantity}\n` : ''}
🎯 منزل: ${milestoneDays} (${presentDays > 0 ? Math.round((milestoneDays/presentDays)*100) : 0}%)
${totalMilestoneQuantity > 0 ? `📏 کل منزل مقدار: ${totalMilestoneQuantity}\n` : ''}
`.trim().replace(/\n+/g, '\n');

    const encodedText = encodeURIComponent(summaryText);
    window.open(`https://api.whatsapp.com/send?text=${encodedText}`, '_blank');
});

// Backup Tab Listeners
document.getElementById('create-backup-btn').addEventListener('click', function() {
    if (createManualBackup()) {
        alert('دستی بیک اپ کامیابی سے بن گئی!');
        updateAutoBackupList();
    }
});

document.getElementById('view-all-backups-btn').addEventListener('click', function() {
    showAllBackups();
    document.getElementById('backup-modal').style.display = 'block';
});

document.getElementById('restore-latest-btn').addEventListener('click', function() {
    const autoBackups = JSON.parse(localStorage.getItem(BACKUP_KEYS.AUTO)) || [];
    if (autoBackups.length > 0) {
        restoreFromBackup(autoBackups[0].data, 'auto', 0);
    } else {
        alert('کوئی بیک اپ دستیاب نہیں ہے');
    }
});

document.getElementById('clear-all-data-btn').addEventListener('click', clearAllData);
document.getElementById('delete-old-backups-btn').addEventListener('click', deleteOldBackups);
document.getElementById('verify-data-btn').addEventListener('click', verifyDataIntegrity);

// Close modal on outside click
window.addEventListener('click', function(event) {
    if (event.target.classList.contains('modal')) {
        event.target.style.display = 'none';
    }
});

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    initApp();
});
