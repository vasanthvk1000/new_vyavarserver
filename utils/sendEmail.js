import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const sendEmail = async ({ email, status, orderId }) => {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: `Your Order ${orderId} is now ${status}`,
    text: `Hello, your order with ID ${orderId} has been updated to status: ${status}.`,
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

export default sendEmail;
