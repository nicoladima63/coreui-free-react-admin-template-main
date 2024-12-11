import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { QUERY_KEYS } from '../../../constants/queryKeys';
import { useToast } from '../../../hooks/useToast';

export const useWebSocketHandlers = (socket, userId) => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { showInfo } = useToast();

  useEffect(() => {
    if (!userId) {
      navigate('/login');
      return;
    }

    if (socket) {
      socket.on('newMessage', (message) => {
        if (message.recipientId === userId) {
          showInfo(`Nuovo messaggio da ${message.senderName}`);
          queryClient.invalidateQueries([QUERY_KEYS.MESSAGES]);
        }
      });

      socket.on('messageRead', () => {
        queryClient.invalidateQueries([QUERY_KEYS.MESSAGES]);
      });

      return () => {
        socket.off('newMessage');
        socket.off('messageRead');
      };
    }
  }, [socket, userId, queryClient, showInfo, navigate]);
};
