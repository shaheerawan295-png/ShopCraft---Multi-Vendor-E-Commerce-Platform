import User from "../models/userModel.js";
import generateToken from "../utils/generateToken.js";
import OTP from "../models/otpModel.js";
import sendEmail from "../utils/sendEmail.js";
import sendTokenResponse from "../utils/sendTokenResponse.js";
import { OAuth2Client } from "google-auth-library";

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

export const googleLogin = async (req, res) => {
  try {
    const idToken = req.body.idToken || req.body.token || req.body.credential;
    const requestedRole = req.body.role;
    const role =
      requestedRole === "vendor" || requestedRole === "customer"
        ? requestedRole
        : "customer";
    if (!idToken) {
      return res.status(400).json({ message: "Google ID Token is required" });
    }
    const ticket = await client.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const { name, email, picture } = ticket.getPayload();
    let user = await User.findOne({ email });
    if (!user) {
      const randomPassword = Math.random().toString(36).slice(-8) + "A1!";

      user = await User.create({
        name,
        email,
        password: randomPassword,
        role,
      });
    }
    sendTokenResponse(user, 200, res);
  } catch (error) {
    res
      .status(400)
      .json({ message: "Google Authentication failed: " + error.message });
  }
};

export const registerUser = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    if (!name || !email || !password) {
      return res
        .status(400)
        .json({ message: "Please provide all required fields.." });
    }
const userExits = await User.findOne({ email });
    if (userExits) {
      return res
        .status(400)
        .json({ message: "User already exists with this email.." });
    }
    const safeRole =
      role === "vendor" || role === "customer" ? role : "customer";
    const user = await User.create({
      name,
      email,
      password,
      role: safeRole,
    });
    if (user) {
      sendTokenResponse(user, 201, res);
    } else {
      res.status(400).json({ message: "Invalid user data received.." });
    }
  } catch (error) {
    const statusCode = error.name === "ValidationError" ? 400 : 500;
    res.status(statusCode).json({ message: error.message });
  }
};

export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Please provide email and password" });
    }
    const user = await User.findOne({ email }).select("+password");
    if (user && (await user.matchPassword(password))) {
      sendTokenResponse(user, 200, res);
    } else {
      res.status(401).json({ message: "Invalid email and password" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({
        message: "Please provide an email",
      });
    }
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({
        message: "No user found with this email",
      });
    }
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    await OTP.deleteMany({ email });
    await OTP.create({ email, otp });
    const message = `Your password reset OTP is: ${otp}\n\nThis code is valid for 10 minutes.`;

    await sendEmail({
      email: user.email,
      subject: "Password Reset OTP - MultiVendor Store",
      message,
    });
    res.status(200).json({
      success: true,
      message: `OTP sent successfully to ${user.email}`,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;
    if (!email || !otp || !newPassword) {
      return res
        .status(400)
        .json({ message: "Please provide email, OTP, and new password" });
    }
    const otpRecord = await OTP.findOne({ email, otp });
    if (!otpRecord) {
      return res.status(400).json({
        message: "Invalid or expired OTP",
      });
    }
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    user.password = newPassword;
    await user.save();
    await OTP.deleteMany({ email });
    res.status(200).json({
      success: true,
      message:
        "Password reset successfully. You can now log in with your new password",
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const sendLoginOTP = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ message: "Please provide an email" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res
        .status(404)
        .json({ message: "User not found with this email" });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    await OTP.deleteMany({ email });
    await OTP.create({ email, otp });

    const message = `Your One-Time Password (OTP) for login is: ${otp}\n\nThis code is valid for 10 minutes.`;

    await sendEmail({
      email: user.email,
      subject: "Login OTP - MultiVendor Store",
      message,
    });

    res.status(200).json({
      success: true,
      message: `OTP sent successfully to ${user.email}`,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const verifyLoginOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) {
      return res
        .status(400)
        .json({ message: "Please provide both email and OTP" });
    }

    const otpRecord = await OTP.findOne({ email, otp });
    if (!otpRecord) {
      return res.status(400).json({ message: "Invalid or expired OTP" });
    }
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    await OTP.deleteMany({ email });

    sendTokenResponse(user, 200, res);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.status(200).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      isApproved: user.isApproved,
      address: user.address,
      createdAt: user.createdAt,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const logoutUser = async (req, res) => {
  try {
    res.clearCookie("token");
    res.status(200).json({ success: true, message: "Logged out successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
