import React, { useRef } from 'react';
import HCaptcha from '@hcaptcha/react-hcaptcha';

interface HCaptchaProps {
  siteKey: string;
  onTokenChange: (token: string | null) => void;
  onErrorChange?: (message: string | null) => void;
}

const HCaptchaComponent: React.FC<HCaptchaProps> = ({
  siteKey,
  onTokenChange,
  onErrorChange,
}) => {
  const captchaRef = useRef<HCaptcha | null>(null);

  return (
    <div
      style={{
        margin: '16px 0',
        display: 'flex',
        justifyContent: 'center',
      }}
    >
      <HCaptcha
        ref={captchaRef as any}
        sitekey={siteKey}
        onVerify={(token) => {
          onTokenChange(token);
          onErrorChange && onErrorChange(null);
        }}
        onExpire={() => {
          onTokenChange(null);
          onErrorChange &&
            onErrorChange('El captcha expiró, por favor vuelve a marcarlo.');
        }}
        onError={(err) => {
          console.error('[hCaptcha] error:', err);
          onTokenChange(null);
          onErrorChange &&
            onErrorChange('Error al cargar el captcha. Intenta de nuevo.');
        }}
      />
    </div>
  );
};

export default HCaptchaComponent;