import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const ResetEmailOtp = async ({ email, status, orderId,otp }) => {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: `${status}`,
    text: `Hello, your One-Time-Password is ${orderId}`,
    html: `<p>Hello, your One-Time-Password is ${orderId}</strong> <p>Click the link below to reset your password:</p>
    <a href="http://localhost:3000/resetPassword?email=${email}&otp=${otp}">Reset Password</a>`,
  };
  console.log("Sending email to:", email);
  console.log("Email options:", mailOptions);
  console.log("Status:", status);
  console.log("Transporter:", transporter);
  try {
    const info = await transporter.sendMail(mailOptions);
    console.log("Email sent:", info.response);
  } catch (error) {
    console.error("Email send failed:", error);
  }
};

export default ResetEmailOtp;
