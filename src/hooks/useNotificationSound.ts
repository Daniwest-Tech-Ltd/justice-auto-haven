// Notification sound utility hook
const notificationSound = new Audio('/sounds/notification.mp3');
notificationSound.volume = 0.5;

export const playNotificationSound = () => {
  try {
    notificationSound.currentTime = 0;
    notificationSound.play().catch(() => {
      // Audio play failed - user hasn't interacted with page yet
      console.log('Audio autoplay blocked');
    });
  } catch (error) {
    console.log('Error playing notification sound:', error);
  }
};

export const useNotificationSound = () => {
  return { playNotificationSound };
};
