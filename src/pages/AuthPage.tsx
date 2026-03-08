import { Activity } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import driveDocLogo from '@/assets/drivedoc-logo.png';

const AuthPage = () => {
  const handleGoogleLogin = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin,
      },
    });
    if (error) {
      toast.error('Login failed. Please try again.');
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="animate-fade-in flex flex-col items-center gap-8 px-6">
        <div className="flex items-center gap-4">
          <img src={driveDocLogo} alt="DriveDoc" className="h-14 w-14 rounded-xl" />
          <div>
            <h1 className="font-display text-3xl font-bold tracking-wider text-primary uppercase">DriveDoc</h1>
            <p className="text-sm text-muted-foreground">Vehicle Diagnostics</p>
          </div>
        </div>

        <div className="glass-card neon-border w-full max-w-sm p-8">
          <div className="mb-6 text-center">
            <Activity className="mx-auto mb-3 h-10 w-10 text-primary" />
            <h2 className="text-xl font-semibold text-foreground">Welcome Back</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Sign in to access your diagnostics
            </p>
          </div>

          <Button
            onClick={handleGoogleLogin}
            className="w-full gap-3 gradient-cyan text-primary-foreground font-semibold h-12 text-base hover:opacity-90 transition-opacity"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24">
              <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
              <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continue with Google
          </Button>
        </div>

        <p className="max-w-xs text-center font-mono text-xs text-muted-foreground">
          AI-powered vehicle diagnostics. Track service history, monitor component health, and scan bills instantly.
        </p>
      </div>
    </div>
  );
};

export default AuthPage;
