import { USER_NAME } from '../constants/app.constants';
import { getDailyGreeting, getMessageOfDay } from '../services/chat/chatService';

export function useGreeting() {
  return {
    greeting: getDailyGreeting(USER_NAME),
    messageOfDay: getMessageOfDay(),
    userName: USER_NAME,
  };
}
