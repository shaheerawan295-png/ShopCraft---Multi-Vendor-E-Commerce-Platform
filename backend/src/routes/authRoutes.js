import express from "express";
import { registerUser,loginUser,forgotPassword,resetPassword,sendLoginOTP,verifyLoginOTP,getMe,googleLogin, logoutUser} from "../controllers/authController.js";
import { protect } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.post("/register",registerUser);
router.post("/login",loginUser);
router.post("/forgot-password",forgotPassword);
router.post("/reset-password", resetPassword);
router.post("/send-login-otp", sendLoginOTP);
router.post("/verify-login-otp", verifyLoginOTP);
router.post("/google",googleLogin);
router.post("/logout",logoutUser)


// this is protected route.. just for loggedIn user with JWT token..
router.get("/me", protect, getMe);

export default router;