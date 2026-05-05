import axios from 'axios';
import redis, { CACHE_TTL } from '../config/redis';

const OTP_PREFIX = 'otp:';
const OTP_ATTEMPTS_PREFIX = 'otp_attempts:';

const generateOTP = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

export const sendOTP = async (mobile: string): Promise<{ success: boolean; message: string }> => {
  const attemptsKey = `${OTP_ATTEMPTS_PREFIX}${mobile}`;
  const attempts = await redis.get<number>(attemptsKey);

  if (attempts && attempts >= 5) {
    return { success: false, message: 'Too many OTP requests. Please try after 10 minutes.' };
  }

  const otp = generateOTP();
  const otpKey = `${OTP_PREFIX}${mobile}`;

  await redis.set(otpKey, otp, { ex: CACHE_TTL.OTP });
  await redis.set(attemptsKey, (attempts || 0) + 1, { ex: 600 });

  if (process.env.NODE_ENV === 'development') {
    console.log(`[DEV] OTP for ${mobile}: ${otp}`);
    return { success: true, message: 'OTP sent successfully' };
  }

  try {
    await axios.get('https://www.fast2sms.com/dev/bulkV2', {
      params: {
        authorization: process.env.FAST2SMS_API_KEY,
        variables_values: otp,
        route: 'otp',
        numbers: mobile,
      },
    });
    return { success: true, message: 'OTP sent successfully' };
  } catch (err) {
    console.error('Fast2SMS error:', err);
    return { success: false, message: 'Failed to send OTP. Please try again.' };
  }
};

export const verifyOTP = async (mobile: string, otp: string): Promise<boolean> => {
  const otpKey = `${OTP_PREFIX}${mobile}`;
  const storedOTP = await redis.get<string>(otpKey);

  if (!storedOTP || storedOTP !== otp) return false;

  await redis.del(otpKey);
  return true;
};
