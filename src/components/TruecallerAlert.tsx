import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const triggerTruecallerAlert = (phone: string, amount: number) => {
  window.dispatchEvent(
    new CustomEvent('truecaller-alert', { detail: { phone, amount } })
  );
};

const TruecallerAlert = () => {
  const [truecallerPopupVisible, setTruecallerPopupVisible] = useState(false);
  const [truecallerFormattedAmount, setTruecallerFormattedAmount] = useState('');
  const [truecallerTxId, setTruecallerTxId] = useState('');
  const truecallerAudioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    const playTruecallerChime = () => {
      try {
        const audio1 = new Audio('/truecaller.mp3');
        audio1.volume = 1.0;
        void audio1.play().catch(() => {});

        setTimeout(() => {
          try {
            const audio2 = new Audio('/truecaller.mp3');
            audio2.volume = 1.0;
            void audio2.play().catch(() => {});
          } catch {}
        }, 700);
      } catch {}
    };

    const handleTrigger = async (event: CustomEvent<{ phone: string; amount: number }>) => {
      processAlert(event.detail.phone, event.detail.amount);
    };

    const processAlert = async (targetPhone: string, amount: number) => {
      // Get the currently logged in user
      const { data: authData } = await supabase.auth.getUser();
      const currentUserId = authData.user?.id;

      if (!currentUserId) return;

      // Fetch current user's profile to check phone and if truecaller alert is enabled
      const { data } = await supabase
        .from('profiles')
        .select('phone, truecaller_alert_enabled')
        .eq('id', currentUserId)
        .maybeSingle();

      if (!data) return;

      // Clean up phone numbers to ensure a match (e.g. +2547... vs 07... vs 2547...)
      const normalizePhone = (p: string) => p.replace(/\D/g, '').slice(-9);
      const isPhoneMatch = normalizePhone(data.phone || '') === normalizePhone(targetPhone || '');

      // Show alert if phone matches and alerts are enabled, or if targetPhone is a special bypass token
      if (isPhoneMatch && (data as any).truecaller_alert_enabled) {
        const formattedAmt = (amount * 130).toLocaleString('en-US', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2
        });
        const randTxId = Math.random().toString(36).substring(2, 8).toUpperCase() +
                         Math.floor(1000 + Math.random() * 9000);

        setTruecallerFormattedAmount(formattedAmt);
        setTruecallerTxId(randTxId);

        setTimeout(() => {
          playTruecallerChime();
          setTruecallerPopupVisible(true);
        }, 6000);
      }
    };

    window.addEventListener('truecaller-alert', handleTrigger as EventListener);

    // Subscribe to realtime broadcast events
    const channel = supabase.channel('truecaller-channel')
      .on(
        'broadcast',
        { event: 'trigger-alert' },
        (payload) => {
          processAlert(payload.payload.phone, payload.payload.amount);
        }
      )
      .subscribe();

    return () => {
      window.removeEventListener('truecaller-alert', handleTrigger as EventListener);
      supabase.removeChannel(channel);
    };
  }, []);

  return (
    <>
      <div className={`tc-popup ${truecallerPopupVisible ? 'show' : ''}`}>
        <div className="tc-popup-header">
          <div style={{ fontWeight: 800, fontSize: '18px', fontStyle: 'italic', letterSpacing: '-0.5px' }}>truecaller</div>
          <div style={{ fontSize: '12px', opacity: 0.9 }}>SMS • Just now</div>
          <button
            onClick={() => setTruecallerPopupVisible(false)}
            style={{ background: 'transparent', border: 'none', color: 'white', fontSize: '24px', cursor: 'pointer', lineHeight: 1 }}
          >×</button>
        </div>

        <div className="tc-popup-body">
          <div className="tc-mpesa-brand">
            <span style={{ color: '#4ade80', fontWeight: 900, fontStyle: 'italic', fontSize: '16px' }}>M</span>
            <span style={{ color: '#ef4444', fontWeight: 900, fontStyle: 'italic', fontSize: '16px', marginLeft: '-4px' }}>PESA</span>
            <span style={{ marginLeft: '4px', fontSize: '14px', color: '#555' }}>MPESA</span>
          </div>

          <div className="tc-amount">
            + KSH {truecallerFormattedAmount}
          </div>

          <div className="tc-sender">
            Received from JUSTICE ULTIMATE AUTOMOBILES
          </div>

          <div className="tc-actions">
            <button onClick={() => setTruecallerPopupVisible(false)}>Mark as read</button>
            <button onClick={() => setTruecallerPopupVisible(false)}>View profile</button>
          </div>
        </div>
      </div>
      <audio ref={truecallerAudioRef} src="/truecaller.mp3" preload="auto" />
    </>
  );
};

export default TruecallerAlert;
