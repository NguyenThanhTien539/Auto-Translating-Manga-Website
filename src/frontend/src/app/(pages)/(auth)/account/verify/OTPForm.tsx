// src/app/(pages)/(auth)/account/OTP/OTPForm.tsx
"use client";

import {
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
} from "./input-otp"
import { REGEXP_ONLY_DIGITS } from "input-otp";
import { cn } from "@/lib/utils";
import { useState } from "react";

type OTPFormProps = {
  className?: string;
  onChange?: (value: string) => void;
  value?: string;
};

function OTPForm({ className, onChange, value }: OTPFormProps) {
  const isControlled = value !== undefined;
  const [internalOtp, setInternalOtp] = useState("");

  const currentValue = isControlled ? value ?? "" : internalOtp;

  const handleChange = (val: string) => {
    if (!isControlled) {
      setInternalOtp(val);
    }
    onChange?.(val);
  };

  return (
    <div className={cn(className)}>
      <InputOTP
        maxLength={6}
        className="m-2 w-full hover:cursor-pointer"
        pattern={REGEXP_ONLY_DIGITS}
        value={currentValue}
        onChange={handleChange}
      >
        <InputOTPGroup>
          <InputOTPSlot index={0} className="bg-gray-300/50 border-black/50" />
          <InputOTPSlot index={1} className="bg-gray-300/50 border-black/50" />
          <InputOTPSlot index={2} className="bg-gray-300/50 border-black/50" />
        </InputOTPGroup>
        <InputOTPSeparator />
        <InputOTPGroup>
          <InputOTPSlot index={3} className="bg-gray-300/50 border-black/50" />
          <InputOTPSlot index={4} className="bg-gray-300/50 border-black/50" />
          <InputOTPSlot index={5} className="bg-gray-300/50 border-black/50" />
        </InputOTPGroup>
      </InputOTP>
    </div>
  );
}

export default OTPForm;
