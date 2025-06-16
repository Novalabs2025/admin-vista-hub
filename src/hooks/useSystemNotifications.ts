
import { useAgentNotifications } from './useAgentNotifications';
import { usePropertyNotifications } from './usePropertyNotifications';
import { useNotifications } from './useNotifications';

export const useSystemNotifications = () => {
  // Set up all notification listeners
  useAgentNotifications();
  usePropertyNotifications();
  
  // Return the main notifications data
  return useNotifications();
};
