export const initSecurity = () => {
  // Prevent Right Click
  document.addEventListener('contextmenu', (e) => e.preventDefault());

  // Prevent F12, Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+U
  document.addEventListener('keydown', (e) => {
    if (
      e.keyCode === 123 || // F12
      (e.ctrlKey && e.shiftKey && (e.keyCode === 73 || e.keyCode === 74)) || // Ctrl+Shift+I / J
      (e.ctrlKey && e.keyCode === 85) // Ctrl+U
    ) {
      e.preventDefault();
    }
  });

  // Console Warning
  console.clear();
  console.log(
    '%cStop!',
    'color: red; font-size: 50px; font-weight: bold; text-shadow: 2px 2px 0px black;'
  );
  console.log(
    '%cThis is a browser feature intended for developers. If someone told you to copy-paste something here to enable a feature or "hack" someone\'s account, it is a scam and will give them access to your account.',
    'color: white; background: red; font-size: 16px; padding: 10px; border-radius: 5px;'
  );
  
  // Prevent Copy/Cut (except in input/textarea)
  document.addEventListener('copy', (e) => {
    if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
    e.preventDefault();
  });
  document.addEventListener('cut', (e) => {
    if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
    e.preventDefault();
  });
};
