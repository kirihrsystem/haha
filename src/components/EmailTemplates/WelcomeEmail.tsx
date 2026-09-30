import React from 'react';

interface WelcomeEmailProps {
  data: {
    userName: string;
    companyName: string;
  };
}

const WelcomeEmail: React.FC<WelcomeEmailProps> = ({ data }) => {
  const { userName, companyName } = data;

  return (
    <div style={{ fontFamily: 'Arial, sans-serif', maxWidth: '600px', margin: '0 auto' }}>
      <div style={{ textAlign: 'center', padding: '20px 0' }}>
        <h1 style={{ color: '#10b981', margin: 0 }}>Welcome to Kiri HR!</h1>
      </div>

      <div style={{ padding: '20px', backgroundColor: '#ecfdf5', borderRadius: '8px' }}>
        <p>Hello {userName},</p>
        <p>Welcome to Kiri HR - the modern HR system designed for businesses in Cambodia!</p>

        <p>We're excited to have {companyName} join our community of growing teams. Here's how to get started:</p>

        <ol style={{ paddingLeft: '20px' }}>
          <li>Log in to your workspace at <a href="https://kirihr.com/login" style={{ color: '#10b981', textDecoration: 'underline' }}>kirihr.com/login</a></li>
          <li>Set up your company profile and add your team members</li>
          <li>Configure your work locations for GPS-based attendance tracking</li>
          <li>Connect with Telegram to receive real-time notifications</li>
          <li>Start tracking attendance and managing payroll</li>
        </ol>

        <div style={{ margin: '20px 0' }}>
          <h2 style={{ color: '#059669', marginBottom: '10px' }}>Need Help?</h2>
          <p>Our support team is here to help you succeed:</p>
          <ul style={{ paddingLeft: '20px' }}>
            <li>Telegram Support: <a href="https://t.me/kiri_hr_support_bot" style={{ color: '#10b981', textDecoration: 'underline' }}>@kiri_hr_support_bot</a></li>
            <li>Email: <a href="mailto:kirihrsystem@gmail.com" style={{ color: '#10b981', textDecoration: 'underline' }}>kirihrsystem@gmail.com</a></li>
            <li>Phone: <a href="tel:+85593988991" style={{ color: '#10b981', textDecoration: 'underline' }}>+855 93 988 991</a></li>
          </ul>
        </div>

        <div style={{ textAlign: 'center', margin: '30px 0' }}>
          <a href="https://kirihr.com/login"
             style={{
               backgroundColor: '#10b981',
               color: 'white',
               padding: '12px 24px',
               textDecoration: 'none',
               borderRadius: '6px',
               fontWeight: 'bold'
             }}>
            Get Started Now
          </a>
        </div>

        <p style={{ color: '#64748b', fontSize: '14px' }}>
          Welcome aboard! We're thrilled to be part of your HR journey.
        </p>
      </div>

      <div style={{ textAlign: 'center', color: '#94a3b8', fontSize: '12px', padding: '20px' }}>
        © {new Date().getFullYear()} Kiri HR. All rights reserved.
      </div>
    </div>
  );
};

export default WelcomeEmail;