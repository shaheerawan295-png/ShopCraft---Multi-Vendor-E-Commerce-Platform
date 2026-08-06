import mongoose from "mongoose";
const otpSchema = new mongoose.Schema({
    email : {
        type : String,
        required : true,
        lowercase : true,
    },
    otp : {
        type : String,
        required : true,
    },
    createdAt : {
        type:Date,
        default : Date.now,
        expires : 600,

    }
});
const OTP = mongoose.model("OTP",otpSchema);
export default OTP;