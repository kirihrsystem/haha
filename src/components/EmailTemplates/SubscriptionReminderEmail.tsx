import React from 'react';

interface SubscriptionReminderEmailProps {
  data: {
    daysUntilExpiry: number;
    planName: string;
  };
}

const SubscriptionReminderEmail: React.FC<SubscriptionReminderEmailProps> = ({ data }) => {
  const { daysUntilExpiry, planName } = data;

  return (
    <div style={{ fontFamily: 'Arial, sans-serif', maxWidth: '600px', margin: '0 auto' }}>
      <div style={{ textAlign: 'center', padding: '20px 0' }}>
        <h1 style={{ color: '#f97316', margin: 0 }}>Subscription Renewal Reminder</h1>
      </div>

      <div style={{ padding: '20px', backgroundColor: '#fffbeb', borderRadius: '8px' }}>
        <p>Hello,</p>
        <p>This is a friendly reminder that your Kiri HR subscription will expire in {daysUntilExpiry} {daysUntilExpiry === 1 ? 'day' : 'days'} on {new Date(Date.now() + daysUntilExpiry * 24 * 60 * 60 * 1000).toLocaleDateString()}.</p>

        <div style={{ margin: '20px 0' }}>
          <h2 style={{ color: '#92400e', marginBottom: '10px' }}>Current Plan</h2>
          <p style={{ fontSize: '18px', fontWeight: 'bold', color: '#92400e' }}>{planName}</p>
        </div>

        <p>To avoid any interruption in service, please renew your subscription before the expiration date.</p>

        <div style={{ textAlign: 'center', margin: '30px 0' }}>
          <a href="https://kirihr.com/#pricing"
             style={{
               backgroundColor: '#f97316',
               color: 'white',
               padding: '12px 24px',
               textDecoration: 'none',
               borderRadius: '6px',
               fontWeight: 'bold'
             }}>
            Renew Subscription
          </a>
        </div>

        <p style={{ color: '#64748b', fontSize: '14px' }}>
          If you've already renewed your subscription, please disregard this email.
        </p>
      </div>

      <div style={{ textAlign: 'center', color: '#94a3b8', fontSize: '12px', padding: '20px' }}>
        © {new Date().getFullYear()} Kiri HR. All rights reserved.
      </div>
    </div>
  );
};

export default SubscriptionReminderEmail;