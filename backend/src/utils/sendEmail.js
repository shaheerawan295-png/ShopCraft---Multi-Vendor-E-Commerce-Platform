import nodemailer from "nodemailer";

const sendEmail = async (options)=>{
    console.log("Email User Check:", process.env.EMAIL_USER); // just for debugging.....
    const transporter = nodemailer.createTransport({
        service : "Gmail",
        auth : {
            user : process.env.EMAIL_USER,
            pass : process.env.EMAIL_PASS,
        },
    });

    const mailOptions = {
        from : `"MultiVendor Support" <${process.env.EMAIL_USER}>`,
        to : options.email,
        subject : options.subject,
        text : options.message,
        html : options.html,
    };

    await transporter.sendMail(mailOptions);
}

export default sendEmail;