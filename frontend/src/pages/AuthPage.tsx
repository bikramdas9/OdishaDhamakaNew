import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Phone, KeyRound, UserPlus } from 'lucide-react';
import api from '../lib/api';
import { useAuthStore } from '../store/authStore';
import toast from 'react-hot-toast';

type Step = 'mobile' | 'otp' | 'register';

export default function AuthPage() {
  const [step, setStep] = useState<Step>('mobile');
  const [mobile, setMobile] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [otpTimer, setOtpTimer] = useState(0);
  const [form, setForm] = useState({ name: '', address_line: '', city: '', state: '', pincode: '' });
  const { setAuth } = useAuthStore();
  const navigate = useNavigate();

  const startTimer = () => {
    setOtpTimer(30);
    const interval = setInterval(() => {
      setOtpTimer((t) => {
        if (t <= 1) { clearInterval(interval); return 0; }
        return t - 1;
      });
    }, 1000);
  };

  const handleSendOTP = async () => {
    if (!/^[6-9]\d{9}$/.test(mobile)) {
      toast.error('Enter a valid 10-digit Indian mobile number');
      return;
    }
    setLoading(true);
    try {
      await api.post('/auth/send-otp', { mobile });
      toast.success('OTP sent to your mobile');
      setStep('otp');
      startTimer();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to send OTP';
      toast.error((err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (otp.length !== 6) { toast.error('Enter 6-digit OTP'); return; }
    setLoading(true);
    try {
      const res = await api.post('/auth/verify-otp', { mobile, otp });
      setAuth(res.data.user, res.data.token);
      toast.success(`Welcome back, ${res.data.user.name}!`);
      navigate(res.data.user.role === 'admin' ? '/admin' : '/');
    } catch (err: unknown) {
      const apiErr = err as { response?: { data?: { message?: string; needsRegister?: boolean } } };
      if (apiErr?.response?.data?.needsRegister) {
        toast.success('Mobile verified! Complete your profile.');
        setStep('register');
      } else {
        toast.error(apiErr?.response?.data?.message ?? 'Invalid OTP');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    if (!form.name.trim() || !form.address_line.trim() || !form.city.trim() || !form.state.trim() || !form.pincode.trim()) {
      toast.error('Please fill all fields');
      return;
    }
    if (!/^\d{6}$/.test(form.pincode)) {
      toast.error('Enter a valid 6-digit pincode');
      return;
    }
    setLoading(true);
    try {
      const res = await api.post('/auth/register', { mobile, ...form });
      setAuth(res.data.user, res.data.token);
      toast.success('Account created! Welcome to Odisha Dhamaka!');
      navigate('/');
    } catch (err: unknown) {
      const apiErr = err as { response?: { data?: { message?: string } } };
      toast.error(apiErr?.response?.data?.message ?? 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="card p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <span className="text-4xl">🍛</span>
            <h1 className="text-2xl font-bold text-gray-900 mt-2">Odisha Dhamaka</h1>
            <p className="text-sm text-gray-500 mt-1">
              {step === 'mobile' && 'Enter your mobile to continue'}
              {step === 'otp' && `OTP sent to +91 ${mobile}`}
              {step === 'register' && 'Create your account'}
            </p>
          </div>

          {/* Step: Mobile */}
          {step === 'mobile' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Mobile Number</label>
                <div className="flex">
                  <span className="inline-flex items-center px-3 rounded-l-xl border border-r-0 border-gray-200 bg-gray-50 text-gray-500 text-sm">+91</span>
                  <input
                    type="tel"
                    maxLength={10}
                    value={mobile}
                    onChange={(e) => setMobile(e.target.value.replace(/\D/g, ''))}
                    onKeyDown={(e) => e.key === 'Enter' && handleSendOTP()}
                    placeholder="9876543210"
                    className="input rounded-l-none"
                  />
                </div>
              </div>
              <button onClick={handleSendOTP} disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2">
                <Phone size={16} />
                {loading ? 'Sending...' : 'Send OTP'}
              </button>
            </div>
          )}

          {/* Step: OTP */}
          {step === 'otp' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Enter OTP</label>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                  onKeyDown={(e) => e.key === 'Enter' && handleVerifyOTP()}
                  placeholder="• • • • • •"
                  className="input text-center text-2xl tracking-[1rem] font-bold"
                />
              </div>
              <button onClick={handleVerifyOTP} disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2">
                <KeyRound size={16} />
                {loading ? 'Verifying...' : 'Verify OTP'}
              </button>
              <div className="text-center">
                {otpTimer > 0 ? (
                  <span className="text-sm text-gray-400">Resend in {otpTimer}s</span>
                ) : (
                  <button
                    onClick={() => { setOtp(''); handleSendOTP(); }}
                    className="text-sm text-brand-500 hover:text-brand-600 font-medium"
                  >
                    Resend OTP
                  </button>
                )}
              </div>
              <button onClick={() => setStep('mobile')} className="flex items-center gap-1 text-sm text-gray-400 hover:text-gray-600 mx-auto">
                <ArrowLeft size={14} /> Change number
              </button>
            </div>
          )}

          {/* Step: Register */}
          {step === 'register' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Full Name</label>
                <input className="input" placeholder="Bibhuti Bhushan Das" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Address</label>
                <input className="input" placeholder="House / Flat / Street" value={form.address_line} onChange={(e) => setForm({ ...form, address_line: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">City</label>
                  <input className="input" placeholder="Hyderabad" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">State</label>
                  <input className="input" placeholder="Telangana" value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Pincode</label>
                <input className="input" placeholder="500049" maxLength={6} value={form.pincode} onChange={(e) => setForm({ ...form, pincode: e.target.value.replace(/\D/g, '') })} />
              </div>
              <button onClick={handleRegister} disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2">
                <UserPlus size={16} />
                {loading ? 'Creating Account...' : 'Create Account'}
              </button>
            </div>
          )}
        </div>

        <p className="text-center text-xs text-gray-400 mt-4">
          By continuing, you agree to our Terms of Service & Privacy Policy
        </p>
      </div>
    </div>
  );
}
