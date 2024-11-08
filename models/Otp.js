const mongoose = require('mongoose');

const otpSchema = new mongoose.Schema({
    email_or_phone: {
        type: String,
        required: true,
    },
    otp: {
        type: Number,
        required: true
    },
    expiresAt: {
        type: Date,
        required: true
    },
    password: {
        type: String,
        required: true
    }
});

const Otp = mongoose.model('Otp', otpSchema);
module.exports = Otp;
