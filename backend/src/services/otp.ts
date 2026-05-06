import axios from 'axios';
import redis, { CACHE_TTL } from '../config/redis';

const OTP_PREFIX = 'otp:';
const OTP_ATTEMPTS_PREFIX = 'otp_attempts:';

// In-memory fallback for development when Redis is unavailable
const devOtpStore = new Map<string, { otp: string; expires: number }>();

const generateOTP = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

const isDev = () => process.env.NODE_ENV === 'development';

export const sendOTP = async (mobile: string): Promise<{ success: boolean; message: string }> => {
  const otp = generateOTP();

  if (isDev()) {
    devOtpStore.set(mobile, { otp, expires: Date.now() + 5 * 60 * 1000 });
    console.log(`[DEV] OTP for ${mobile}: ${otp}`);
    return { success: true, message: 'OTP sent successfully' };
  }

  try {
    const attemptsKey = `${OTP_ATTEMPTS_PREFIX}${mobile}`;
    const attempts = await redis.get<number>(attemptsKey);

    if (attempts && attempts >= 5) {
      return { success: false, message: 'Too many OTP requests. Please try after 10 minutes.' };
    }

    const otpKey = `${OTP_PREFIX}${mobile}`;
    await redis.set(otpKey, otp, { ex: CACHE_TTL.OTP });
    await redis.set(attemptsKey, (attempts || 0) + 1, { ex: 600 });

    const message = `Your Odisha Dhamaka OTP is ${otp}. Valid for 5 minutes. Do not share with anyone.`;
    const response = await axios.get('https://www.fast2sms.com/dev/bulkV2', {
      params: {
        authorization: process.env.FAST2SMS_API_KEY,
        message,
        language: 'english',
        route: 'q',
        numbers: mobile,
      },
    });
    console.log('Fast2SMS response:', JSON.stringify(response.data));
    return { success: true, message: 'OTP sent successfully' };
  } catch (err: unknown) {
    const axiosErr = err as { response?: { status: number; data: unknown } };
    if (axiosErr.response) {
      console.error('Fast2SMS error:', axiosErr.response.status, JSON.stringify(axiosErr.response.data));
    } else {
      console.error('Fast2SMS error:', err);
    }
    return { success: false, message: 'Failed to send OTP. Please try again.' };
  }
};

export const verifyOTP = async (mobile: string, otp: string): Promise<boolean> => {
  if (isDev()) {
    const entry = devOtpStore.get(mobile);
    console.log(`[DEV] Verify attempt — mobile: ${mobile}, entered: "${otp}", stored: "${entry?.otp}", expired: ${entry ? Date.now() > entry.expires : 'no entry'}`);
    if (!entry) return false;
    if (Date.now() > entry.expires) { devOtpStore.delete(mobile); return false; }
    if (entry.otp !== otp) return false;
    devOtpStore.delete(mobile);
    return true;
  }

  const otpKey = `${OTP_PREFIX}${mobile}`;
  const storedOTP = await redis.get<string>(otpKey);
  if (!storedOTP || String(storedOTP) !== String(otp)) return false;
  await redis.del(otpKey);
  return true;
};
