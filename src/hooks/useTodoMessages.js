// hooks/useTodoMessages.js
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import axios from 'axios';

export const useTodoMessages = () => {
  const queryClient = useQueryClient();

  // Query per i todo ricevuti
  const useReceivedTodos = () => {
    return useQuery('receivedTodos', async () => {
      const { data } = await axios.get('/api/todo/received');
      return data;
    });
  };

  // Query per i todo inviati
  const useSentTodos = () => {
    return useQuery('sentTodos', async () => {
      const { data } = await axios.get('/api/todo/sent');
      return data;
    });
  };

  // Mutation per creare un nuovo todo
  const useCreateTodo = () => {
    return useMutation(
      async (todoData) => {
        const { data } = await axios.post('/api/todo', todoData);
        return data;
      },
      {
        onSuccess: () => {
          queryClient.invalidateQueries('sentTodos');
        }
      }
    );
  };

  // Mutation per aggiornare lo stato
  const useUpdateTodoStatus = () => {
    return useMutation(
      async ({ id, status }) => {
        const { data } = await axios.patch(`/api/todo/${id}/status`, { status });
        return data;
      },
      {
        onSuccess: () => {
          queryClient.invalidateQueries('receivedTodos');
        }
      }
    );
  };

  // Mutation per segnare come letto
  const useMarkTodoAsRead = () => {
    return useMutation(
      async (id) => {
        const { data } = await axios.patch(`/api/todo/${id}/read`);
        return data;
      },
      {
        onSuccess: () => {
          queryClient.invalidateQueries('receivedTodos');
        }
      }
    );
  };

  // Mutation per eliminare
  const useDeleteTodo = () => {
    return useMutation(
      async (id) => {
        await axios.delete(`/api/todo/${id}`);
      },
      {
        onSuccess: () => {
          queryClient.invalidateQueries(['sentTodos', 'receivedTodos']);
        }
      }
    );
  };

  return {
    useReceivedTodos,
    useSentTodos,
    useCreateTodo,
    useUpdateTodoStatus,
    useMarkTodoAsRead,
    useDeleteTodo
  };
};
