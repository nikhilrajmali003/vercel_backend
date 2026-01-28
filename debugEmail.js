const nodemailer = require('nodemailer');
const dns = require('dns');
require('dotenv').config();

console.log('🔍 Starting Email Debug Script...');
console.log('--------------------------------');

// 1. Check Environment Variables
console.log('1️⃣  Checking Environment Variables:');
console.log('SMTP_USER:', process.env.SMTP_USER ? '✅ Defined' : '❌ Missing');
console.log('SMTP_PASS:', process.env.SMTP_PASS ? '✅ Defined' : '❌ Missing');
console.log('SMTP_PORT:', process.env.SMTP_PORT || '(Not set, defaulting based on service)');
console.log('--------------------------------');

if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.error('❌ Missing critical keys. Aborting.');
    process.exit(1);
}

// 2. DNS Lookup
console.log('2️⃣  Checking DNS Resolution for smtp.gmail.com:');
dns.lookup('smtp.gmail.com', (err, address, family) => {
    if (err) {
        console.error('❌ DNS Lookup failed:', err.message);
    } else {
        console.log(`✅ Resolved smtp.gmail.com to ${address} (IPv${family})`);
    }
    console.log('--------------------------------');

    testConnection();
});

async function testConnection() {
    console.log('3️⃣  Testing SMTP Connection...');

    // Configuration A: Default 'gmail' service (Port 465)
    console.log('   👉 Attempt 1: Using "service: gmail" (Port 465)');
    try {
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS
            },
            connectionTimeout: 10000, // 10s timeout
            logger: true,
            debug: false
        });

        await transporter.verify();
        console.log('   ✅ Attempt 1 SUCCESS! Port 465 is working.');
        return;
    } catch (error) {
        console.log(`   ❌ Attempt 1 Failed: ${error.code} - ${error.message}`);
    }

    console.log('--------------------------------');

    // Configuration B: Explicit Host + Port 587 (STARTTLS)
    console.log('   👉 Attempt 2: Using "smtp.gmail.com" on Port 587 (STARTTLS)');
    try {
        const transporter = nodemailer.createTransport({
            host: 'smtp.gmail.com',
            port: 587,
            secure: false, // true for 465, false for other ports
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS
            },
            connectionTimeout: 10000
        });

        await transporter.verify();
        console.log('   ✅ Attempt 2 SUCCESS! Port 587 is working.');
    } catch (error) {
        console.log(`   ❌ Attempt 2 Failed: ${error.code} - ${error.message}`);
    }
}
