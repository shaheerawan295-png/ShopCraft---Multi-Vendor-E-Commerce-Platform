import generateToken from "./generateToken.js";
const sendTokenResponse = (user,statusCode,res) => {
    const token = generateToken(user._id);


const cookieOptions ={
        expires : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        httpOnly:true,
        secure : process.env.NODE_ENV === "production",
        sameSite: 'lax'
    } ;
    user.password = undefined;
    res.status(statusCode).cookie('token',token,cookieOptions).json({success:true,
        user: {
            _id : user._id,
            name : user.name,
            email : user.email, 
            role: user.role,
        },
    });
}
export default sendTokenResponse;