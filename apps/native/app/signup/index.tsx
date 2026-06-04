import { Redirect } from 'expo-router';

/** Legacy route — unified OTP auth lives at `/login`. */
export default function SignupRedirect() {
  return <Redirect href="/login" />;
}
