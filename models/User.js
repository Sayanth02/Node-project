const mongoose = require('mongoose')
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    email: {
        type: String,
        required: false,
        unique: true,
        sparse: true
    },
    phone: {
        type: String,
        required: false,
        unique: true,
        sparse: true
    },
    password: {
        type: String,
        required: function() {
            return !this.googleId;  
        },
        minlength: 6,
    },
    googleId: {
        type: String,
        required: false,  
    },
    role: {
        type: String,
        enum: ['user', 'admin', 'service_provider'], 
        default: 'user'
    }
})


userSchema.pre('save', async function (next) {
    if (this.isModified('password')) {
        this.password = await bcrypt.hash(this.password, 10);
    }
    next();
});

const User = mongoose.model('User', userSchema)

module.exports = User;