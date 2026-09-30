import React from 'react';

interface FailedPaymentEmailProps {
  data: {
    amount: number;
    currency: string;
    planName: string;
    errorMessage: string;
  };
}

const FailedPaymentEmail: React.FC<FailedPaymentEmailProps> = ({ data }) => {
  return (
    <div style={{ fontFamily: 'Arial, sans-serif', maxWidth: '600px', margin: '0 auto' }}>
      <div style={{ textAlign: 'center', padding: '20px 0' }}>
        <h1 style={{ color: '#ef4444', margin: 0 }}>Payment Failed</h1>
      </div>

      <div style={{ padding: '20px', backgroundColor: '#fef2f2', borderRadius: '8px' }}>
        <p>Hello,</p>
        <p>We encountered an issue processing your payment for the Kiri HR subscription.</p>

        <div style={{ margin: '20px 0' }}>
          <h2 style={{ color: '#991b1b', marginBottom: '10px' }}>Payment Details</h2>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <tr>
              <td style={{ padding: '8px', fontWeight: 'bold', width: '30%' }}>Amount:</td>
              <td style={{ padding: '8px', textAlign: 'right' }}>${data.amount.toFixed(2)} {data.currency}</td>
            </tr>
            <tr>
              <td style={{ padding: '8px', fontWeight: 'bold' }}>Plan:</td>
              <td style={{ padding: '8px', textAlign: 'right' }}>{data.planName}</td>
            </tr>
            <tr>
              <td style={{ padding: '8px', fontWeight: 'bold' }}>Error:</td>
              <td style={{ padding: '8px', textAlign: 'right' }}>{data.errorMessage}</td>
            </tr>
          </table>
        </div>

        <p>To avoid interruption of service, please update your payment method and try again.</p>

        <div style={{ textAlign: 'center', margin: '30px 0' }}>
          <a href="https://kirihr.com/#pricing"
             style={{
               backgroundColor: '#ef4444',
               color: 'white',
               padding: '12px 24px',
               textDecoration: 'none',
               borderRadius: '6px',
               fontWeight: 'bold'
             }}>
            Update Payment Method
          </a>
        </div>

        <p style={{ color: '#64748b', fontSize: '14px' }}>
          If you believe this is an error or need assistance, please contact our support team.
        </p>
      </div>

      <div style={{ textAlign: 'center', color: '#94a3b8', fontSize: '12px', padding: '20px' }}>
        © {new Date().getFullYear()} Kiri HR. All rights reserved.
      </div>
    </div>
  );
};

export default FailedPaymentEmail;