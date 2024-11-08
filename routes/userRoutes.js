const express = require('express')
const userController = require('../controllers/userController')


const router = express.Router();

// signup routes
router.post('/signup',userController.signup)
router.post('/signin',userController.signin)
router.post('/otp-verify',userController.verifyOtp)
router.post('/resend-otp', userController.resendOtp);


module.exports = router;