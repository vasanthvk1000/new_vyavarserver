import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const RegisterEmailOtp = async ({ email, status, orderId}) => {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: `${status}`,
    text: `Hello, your One-Time-Password is ${orderId}`,
    html: `<p>Hello, your order with ID <strong>${orderId}</strong> has been updated to status: <strong>${status}</strong>.</p><p>Thank you for shopping with us!</p>`,
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

export default RegisterEmailOtp;
