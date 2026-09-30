import webpush from 'web-push';
import type { Plugin } from 'vite';

const publicVapidKey = 'BPyBaHpb5_pAvx6E7kz8kdUpb7M9jGgEgiV1nc4_wUdXpAncANcERtnsAQnBFADYi0HKFLjpGZN-4qHXv5ztXrc';
const privateVapidKey = '_Ob9V0W0JZ8qhp1S9cuJIkzvCWVOdy1qqDdfQEIYpa8';

webpush.setVapidDetails(
  'mailto:kirihrsystem@gmail.com',
  publicVapidKey,
  privateVapidKey
);

export function pushNotificationPlugin(): Plugin {
  return {
    name: 'push-notification',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (req.url === '/api/send-push' && req.method === 'POST') {
          let body = '';
          req.on('data', chunk => {
            body += chunk.toString();
          });
          req.on('end', async () => {
            try {
              const { subscription, payload } = JSON.parse(body);
              await webpush.sendNotification(subscription, JSON.stringify(payload));
              res.statusCode = 201;
              res.end(JSON.stringify({ success: true }));
            } catch (err) {
              console.error('Error sending push:', err);
              res.statusCode = 500;
              res.end(JSON.stringify({ error: err.message || 'Failed' }));
            }
          });
        } else {
          next();
        }
      });
    },
  };
}
