const User = require("../Models/User");
const Otp = require('../models/Otp')
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');


const generateOtp = () => Math.floor(100000 + Math.random() * 900000); // 6-digit OTP


// SignUp
const signup = async (req, res) => {

    const { email_or_phone, password ,role } = req.body;

    // Check if email_or_phone and password are provided
    if (!email_or_phone || !password) {
        return res.status(400).json({ message: 'Email/Phone and password are required' });
    }

    try {
        // Check if the user already exists by email or phone
        const existingUser = await User.findOne({
            $or: [
                { email: email_or_phone },
                { phone: email_or_phone }
            ]
        });

        if (existingUser) {
            return res.status(400).json({ message: 'Email or Phone already in use' });
        }

        // Generate OTP and set expiration (5 minutes from now)
        const otpCode = generateOtp();
        const otpExpiresAt = new Date(Date.now() + 5 * 60 * 1000);

        // Save OTP 
        await Otp.create({
            email_or_phone: email_or_phone,
            otp: otpCode,
            expiresAt: otpExpiresAt,
            password:password,
            role:role
        });

        console.log(`OTP for ${email_or_phone}: ${otpCode}`);
        res.status(200).json({ message: 'OTP sent for verification',otpCode });


    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};


// SignIn

const signin = async (req, res) => {
    const { email_or_phone, password } = req.body;

    // Check if email_or_phone and password are provided
    if (!email_or_phone || !password) {
        return res.status(400).json({ message: 'Email/Phone and password are required' });
    }

    try {
        // Find user by email or phone
        const user = await User.findOne({
            $or: [
                { email: email_or_phone },
                { phone: email_or_phone }
            ]
        });

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Compare provided password with hashed password
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(400).json({ message: 'Incorrect password' });
        }

        // Generate access and refresh tokens
        const accessToken = jwt.sign(
            { userId: user._id, email: user.email },
            process.env.ACCESS_TOKEN_SECRET,
            { expiresIn: '1h' }
        );

        const refreshToken = jwt.sign(
            { userId: user._id, email: user.email },
            process.env.REFRESH_TOKEN_SECRET,
            { expiresIn: '30d' }
        );
        // response
        console.log('Access Token:', accessToken);
        res.status(200).json({
            message: 'Signin successful',
            accessToken,
            refreshToken,
            role: user.role
        });

    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// otp verify

const verifyOtp = async (req, res) => {
    const { email_or_phone, otp } = req.body;  

    try {
        const otpRecord = await Otp.findOne({ email_or_phone, otp });

        if (!otpRecord) {
            return res.status(400).json({ message: 'Invalid OTP' });
        }

        if (otpRecord.expiresAt < new Date()) {
            await Otp.deleteOne({ email_or_phone });
            return res.status(400).json({ message: 'OTP expired' });
        }

        // Create the user in the User collection with the email_or_phone and hashed password from OTP record
        const newUser = new User({
            email: email_or_phone.includes('@') ? email_or_phone : undefined,
            phone: email_or_phone.includes('@') ? undefined : email_or_phone,
            password: otpRecord.password ,
            role : otpRecord.role
        });

        await newUser.save();

        // Clean up OTP entry after successful registration
        await Otp.deleteOne({ email_or_phone });

        res.status(201).json({ message: 'User registered successfully' });
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

// otp resend
const resendOtp = async (req, res) => {
    const { email_or_phone } = req.body;

    // Check if email_or_phone is provided
    if (!email_or_phone) {
        return res.status(400).json({ message: 'Email or Phone is required' });
    }

    try {
        // Find the existing OTP record by email or phone
        const otpRecord = await Otp.findOne({ email_or_phone });

        if (!otpRecord) {
            return res.status(404).json({ message: 'User not found for OTP resend' });
        }

        // Generate a new OTP and set a new expiration time
        const newOtpCode = generateOtp();
        const newOtpExpiresAt = new Date(Date.now() + 5 * 60 * 1000);

        // Update the OTP and expiration time in the OTP collection
        otpRecord.otp = newOtpCode;
        otpRecord.expiresAt = newOtpExpiresAt;
        await otpRecord.save();

        console.log(`Resent OTP for ${email_or_phone}: ${newOtpCode}`);
        res.status(200).json({ message: 'New OTP sent for verification' });
        
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

module.exports = {
    signup,
    signin,
    verifyOtp,
    resendOtp
};
