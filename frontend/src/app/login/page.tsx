"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import CircularProgress from "@mui/material/CircularProgress";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { ApiError } from "@/lib/api";
import { useAuth } from "@/lib/AuthContext";
import { roleHomePath } from "@/lib/navigation";

export default function LoginPage() {
  const router = useRouter();
  const { status, user, login, verifyOtp } = useAuth();

  const [step, setStep] = useState<"credentials" | "otp">("credentials");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mfaToken, setMfaToken] = useState<string | null>(null);
  const [otp, setOtp] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Already have a valid session (e.g. revisiting /login directly) -- skip
  // straight to that role's dashboard instead of showing the form again.
  useEffect(() => {
    if (status === "authenticated" && user) {
      router.replace(roleHomePath(user.role));
    }
  }, [status, user, router]);

  async function handleCredentialsSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const result = await login(email, password);
      if (result.mfaRequired) {
        setMfaToken(result.mfaToken);
        setStep("otp");
      } else {
        router.push(roleHomePath(result.user.role));
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleOtpSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!mfaToken) return;
    setError(null);
    setSubmitting(true);
    try {
      const authUser = await verifyOtp(mfaToken, otp);
      router.push(roleHomePath(authUser.role));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        bgcolor: "background.default",
        p: 2,
      }}
    >
      <Card sx={{ width: 400 }} elevation={3}>
        <CardContent>
          <Typography variant="h5" component="h1" gutterBottom>
            Digital Exam Evaluation
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            {step === "credentials"
              ? "Sign in to continue"
              : "Enter the 6-digit code from your authenticator app"}
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
              {error}
            </Alert>
          )}

          {step === "credentials" ? (
            <Box component="form" onSubmit={handleCredentialsSubmit}>
              <Stack spacing={2}>
                <TextField
                  label="Email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  fullWidth
                  autoFocus
                />
                <TextField
                  label="Password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  fullWidth
                />
                <Button
                  type="submit"
                  variant="contained"
                  size="large"
                  disabled={submitting}
                >
                  {submitting ? <CircularProgress size={24} /> : "Continue"}
                </Button>
              </Stack>
            </Box>
          ) : (
            <Box component="form" onSubmit={handleOtpSubmit}>
              <Stack spacing={2}>
                <TextField
                  label="One-time code"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  slotProps={{ htmlInput: { maxLength: 6 } }}
                  required
                  fullWidth
                  autoFocus
                />
                <Button
                  type="submit"
                  variant="contained"
                  size="large"
                  disabled={submitting}
                >
                  {submitting ? <CircularProgress size={24} /> : "Verify & Sign In"}
                </Button>
                <Button
                  variant="text"
                  onClick={() => {
                    setStep("credentials");
                    setError(null);
                  }}
                >
                  Back
                </Button>
              </Stack>
            </Box>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}
