const fs = require('fs');
const bcrypt = require('bcryptjs');
const file = './data/store.json';
const data = JSON.parse(fs.readFileSync(file, 'utf8'));

const demoCreds = {
    'admin@hospital.com': 'AdminDemo$2026',
    'doctor@hospital.com': 'DoctorDemo$2026',
    'student@campus.edu': 'StudentDemo$2026'
};

data.users.forEach(u => {
    if (demoCreds[u.email]) {
        u.password = bcrypt.hashSync(demoCreds[u.email], 10);
    }
});

fs.writeFileSync(file, JSON.stringify(data, null, 2));
console.log('Passwords updated');
