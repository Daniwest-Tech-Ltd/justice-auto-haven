import { Progress } from "@/components/ui/progress";
import { CheckCircle2, XCircle } from "lucide-react";
import { calculatePasswordStrength, checkPasswordRequirements, getStrengthColor } from "@/lib/passwordStrength";

interface PasswordStrengthMeterProps {
  password: string;
}

export const PasswordStrengthMeter = ({ password }: PasswordStrengthMeterProps) => {
  const strength = calculatePasswordStrength(password);
  const requirements = checkPasswordRequirements(password);

  if (!password) return null;

  return (
    <div className="space-y-3">
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Password strength</span>
          <span className="font-medium capitalize" style={{ color: getStrengthColor(strength.level) }}>
            {strength.level}
          </span>
        </div>
        <Progress 
          value={strength.score} 
          className="h-2"
          style={{
            ['--progress-background' as any]: getStrengthColor(strength.level)
          }}
        />
      </div>

      <div className="space-y-1">
        {requirements.map((req, index) => (
          <div key={index} className="flex items-center gap-2 text-sm">
            {req.met ? (
              <CheckCircle2 className="h-4 w-4 text-success" />
            ) : (
              <XCircle className="h-4 w-4 text-muted-foreground" />
            )}
            <span className={req.met ? "text-success" : "text-muted-foreground"}>
              {req.label}
            </span>
          </div>
        ))}
      </div>

      {strength.feedback.length > 0 && !strength.meetsMinimum && (
        <div className="text-xs text-muted-foreground space-y-1 pt-1">
          {strength.feedback.slice(0, 3).map((msg, i) => (
            <div key={i}>• {msg}</div>
          ))}
        </div>
      )}
    </div>
  );
};
