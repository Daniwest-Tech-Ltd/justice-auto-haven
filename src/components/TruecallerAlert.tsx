import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const triggerTruecallerAlert = (phone: string, amount: string, messageBody: string, subject: string) => {
  window.dispatchEvent(
    new CustomEvent('truecaller-alert', { detail: { phone, amount, messageBody, subject } })
  );
};

const TruecallerAlert = () => {
  const [truecallerPopupVisible, setTruecallerPopupVisible] = useState(false);
  const [truecallerFormattedAmount, setTruecallerFormattedAmount] = useState('');
  const [truecallerMessageBody, setTruecallerMessageBody] = useState('');
  const [truecallerSubject, setTruecallerSubject] = useState('');
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

    const handleTrigger = async (event: CustomEvent<{ phone: string; amount: string; messageBody: string; subject: string }>) => {
      processAlert(event.detail.phone, event.detail.amount, event.detail.messageBody, event.detail.subject);
    };

    const processAlert = async (targetPhone: string, amount: string, messageBody: string, subject: string) => {
      // Clean up phone numbers to ensure a match (e.g. +2547... vs 07... vs 2547...)
      const normalizePhone = (p: string) => p ? p.replace(/\D/g, '').slice(-9) : '';
      const normalizedTarget = normalizePhone(targetPhone);

      // Get the currently logged in user
      const { data: authData } = await supabase.auth.getUser();
      const currentUserId = authData.user?.id;

      // If user is logged in, check if their phone matches the broadcast.
      // IF NO USER is logged in, OR we want to force the simulator on the admin's device,
      // we need a bypass. We'll show the popup if the phone matches the logged in user,
      // OR if the current URL is the simulator (for testing).

      let shouldShowAlert = false;

      if (window.location.pathname.includes('/truecaller-simulator')) {
         shouldShowAlert = true; // Always show on the simulator page to test!
      } else if (currentUserId) {
        // Fetch current user's profile to check phone
        const { data } = await supabase
          .from('profiles')
          .select('phone')
          .eq('id', currentUserId)
          .maybeSingle();

        if (data && normalizePhone(data.phone || '') === normalizedTarget) {
          shouldShowAlert = true;
        }
      }

      if (shouldShowAlert) {
        let formattedAmt = '';
        if (amount) {
           formattedAmt = Number(amount).toLocaleString('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
          });
        }

        const randTxId = Math.random().toString(36).substring(2, 8).toUpperCase() +
                         Math.floor(1000 + Math.random() * 9000);

        setTruecallerFormattedAmount(formattedAmt);
        setTruecallerMessageBody(messageBody || '');
        setTruecallerSubject(subject || '');
        setTruecallerTxId(randTxId);

        setTimeout(() => {
          playTruecallerChime();
          setTruecallerPopupVisible(true);
        }, 6000); // 6-second delay before playing sound and showing popup
      }
    };

    window.addEventListener('truecaller-alert', handleTrigger as EventListener);

    // Subscribe to realtime broadcast events
    const channel = supabase.channel('truecaller-channel')
      .on(
        'broadcast',
        { event: 'trigger-alert' },
        (payload) => {
          processAlert(payload.payload.phone, payload.payload.amount, payload.payload.messageBody, payload.payload.subject);
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
      <div className={`tc-popup ${truecallerPopupVisible ? 'show' : ''}`} style={{ fontFamily: 'sans-serif' }}>
        <div className="tc-popup-header" style={{ background: '#0080ff', padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'white', borderTopLeftRadius: '12px', borderTopRightRadius: '12px' }}>
          <div style={{ fontWeight: 800, fontSize: '18px', fontStyle: 'italic', letterSpacing: '-0.5px' }}>truecaller</div>
          <div style={{ fontSize: '12px', opacity: 0.9 }}>SMS • Just now</div>
          <button
            onClick={() => setTruecallerPopupVisible(false)}
            style={{ background: 'transparent', border: 'none', color: 'white', fontSize: '24px', cursor: 'pointer', lineHeight: 1, padding: 0 }}
          >×</button>
        </div>

        <div className="tc-popup-body" style={{ background: 'white', padding: '20px', borderBottomLeftRadius: '12px', borderBottomRightRadius: '12px' }}>
          {truecallerFormattedAmount ? (
            <>
              <div className="tc-mpesa-brand" style={{ display: 'flex', alignItems: 'center', marginBottom: '16px' }}>
                <span style={{ color: '#4ade80', fontWeight: 900, fontStyle: 'italic', fontSize: '18px' }}>M</span>
                <span style={{ color: '#ef4444', fontWeight: 900, fontStyle: 'italic', fontSize: '18px', marginLeft: '-4px' }}>PESA</span>
                <span style={{ marginLeft: '8px', fontSize: '15px', color: '#555', fontWeight: 500 }}>MPESA</span>
              </div>

              <div className="tc-amount" style={{ fontSize: '28px', fontWeight: 800, color: '#22c55e', marginBottom: '8px' }}>
                + KSH {truecallerFormattedAmount}
              </div>
            </>
          ) : (
             <div style={{ fontSize: '15px', color: '#333', marginBottom: '16px', lineHeight: 1.5, fontWeight: 500 }}>
               {truecallerSubject && (
                 <div style={{ fontSize: '18px', fontWeight: 800, color: '#111', marginBottom: '8px' }}>
                   {truecallerSubject}
                 </div>
               )}
               <div dangerouslySetInnerHTML={{
                 // Simple regex to convert URLs to clickable tags
                 __html: truecallerMessageBody.replace(
                   /(https?:\/\/[^\s]+)/g,
                   '<a href="$1" target="_blank" rel="noopener noreferrer" style="color: #0080ff; text-decoration: none;">$1</a>'
                 )
               }} />
             </div>
          )}

          <div className="tc-sender" style={{ fontSize: '14px', color: '#666', marginBottom: '24px' }}>
            Received from JUSTICE ULTIMATE AUTOMOBILES
          </div>

          <div className="tc-actions" style={{ display: 'flex', borderTop: '1px solid #eee', margin: '0 -20px -20px -20px' }}>
            <button
              onClick={() => setTruecallerPopupVisible(false)}
              style={{ flex: 1, padding: '16px', background: 'transparent', border: 'none', borderRight: '1px solid #eee', color: '#0080ff', fontWeight: 600, fontSize: '14px', cursor: 'pointer' }}
            >
              Mark as read
            </button>
            <button
              onClick={() => {
                setTruecallerPopupVisible(false);
                window.open('https://justiceultimateautomobiles.com', '_blank');
              }}
              style={{ flex: 1, padding: '16px', background: 'transparent', border: 'none', color: '#0080ff', fontWeight: 600, fontSize: '14px', cursor: 'pointer' }}
            >
              View profile
            </button>
          </div>
        </div>
      </div>
      <audio ref={truecallerAudioRef} src="/truecaller.mp3" preload="auto" />
    </>
  );
};

export default TruecallerAlert;
