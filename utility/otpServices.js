const otpStore = new Map();

export const generateOTP = (phone) => {
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  otpStore.set(phone, otp);
  return otp;
};

export const verifyOTP = (phone, otp) => {
  const validOtp = otpStore.get(phone);
  return validOtp === otp;
};