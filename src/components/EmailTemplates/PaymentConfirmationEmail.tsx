import React from 'react';

interface PaymentConfirmationEmailProps {
  data: {
    amount: number;
    currency: string;
    planName: string;
    transactionId: string;
    date: string;
  };
}

const PaymentConfirmationEmail: React.FC<PaymentConfirmationEmailProps> = ({ data }) => {
  return (
    <div style={{ fontFamily: 'Arial, sans-serif', maxWidth: '600px', margin: '0 auto' }}>
      <div style={{ textAlign: 'center', padding: '20px 0' }}>
        <h1 style={{ color: '#4f46e5', margin: 0 }}>Payment Confirmed!</h1>
      </div>

      <div style={{ padding: '20px', backgroundColor: '#f8fafc', borderRadius: '8px' }}>
        <p>Hello,</p>
        <p>Thank you for your payment. Your Kiri HR subscription has been successfully activated.</p>

        <div style={{ margin: '20px 0' }}>
          <h2 style={{ color: '#334155', marginBottom: '10px' }}>Payment Details</h2>
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
              <td style={{ padding: '8px', fontWeight: 'bold' }}>Transaction ID:</td>
              <td style={{ padding: '8px', textAlign: 'right' }}>{data.transactionId}</td>
            </tr>
            <tr>
              <td style={{ padding: '8px', fontWeight: 'bold' }}>Date:</td>
              <td style={{ padding: '8px', textAlign: 'right' }}>{data.date}</td>
            </tr>
          </table>
        </div>

        <p>Your workspace is now active and you can start using all Kiri HR features.</p>

        <div style={{ textAlign: 'center', margin: '30px 0' }}>
          <a href="https://kirihr.com/login"
             style={{
               backgroundColor: '#4f46e5',
               color: 'white',
               padding: '12px 24px',
               textDecoration: 'none',
               borderRadius: '6px',
               fontWeight: 'bold'
             }}>
            Login to Your Workspace
          </a>
        </div>

        <p style={{ color: '#64748b', fontSize: '14px' }}>
          If you have any questions, please don't hesitate to contact our support team.
        </p>
      </div>

      <div style={{ textAlign: 'center', color: '#94a3b8', fontSize: '12px', padding: '20px' }}>
        © {new Date().getFullYear()} Kiri HR. All rights reserved.
      </div>
    </div>
  );
};

export default PaymentConfirmationEmail;