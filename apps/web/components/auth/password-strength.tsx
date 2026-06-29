"use client";

interface PasswordStrengthBarProps {
  password: string;
}

export default function PasswordStrengthBar({ password }: PasswordStrengthBarProps) {
  const getStrength = (pwd: string) => {
    let score = 0;
    if (pwd.length >= 8) score++;
    if (/[A-Z]/.test(pwd)) score++;
    if (/[0-9]/.test(pwd)) score++;
    if (/[^A-Za-z0-9]/.test(pwd)) score++;
    return score;
  };

  const strength = getStrength(password);
  if (!password) return null;

  const levels = [
    { label: "Weak", color: "bg-danger" },
    { label: "Fair", color: "bg-warning" },
    { label: "Good", color: "bg-info" },
    { label: "Strong", color: "bg-accent" },
  ];
  const current = levels[Math.min(strength - 1, 3)] ?? levels[0]!;

  return (
    <div className="mt-2 space-y-1.5">
      <div className="flex gap-1">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className={`h-1 flex-1 rounded-full transition-all duration-300 ${
              i <= strength ? current.color : "bg-bg-tertiary"
            }`}
          />
        ))}
      </div>
      <p className={`text-xs ${strength <= 1 ? "text-danger" : strength === 2 ? "text-warning" : strength === 3 ? "text-info" : "text-accent"}`}>
        {current.label} password
      </p>
    </div>
  );
}
