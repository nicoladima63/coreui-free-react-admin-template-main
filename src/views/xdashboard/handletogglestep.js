const handleToggleStep = useCallback(async (stepId, completed) => {
  try {
    // Aggiorna localmente lo stato dello step
    const updatedSteps = localTask.steps.map(s =>
      s.id === stepId ? { ...s, completed } : s
    );
    setLocalTask(prev => ({ ...prev, steps: updatedSteps }));

    // Invia la modifica al backend
    await updateStepMutation.mutateAsync({ stepId, completed });

    if (completed) {
      const completedStep = localTask.steps.find(s => s.id === stepId);
      const nextStep = localTask.steps.find(s => s.order === completedStep.order + 1);

      if (nextStep) {
        const message = `La fase "${completedStep.name}" è stata completata. Puoi procedere con "${nextStep.name}"`;

        try {
          if (nextStep.user.name === 'tutti') {
            // Recupera dinamicamente gli utenti dal server
            const allUsers = await UserService.getUsers(); // Supponendo che esista questa API
            const filteredUsers = allUsers.filter(user => user.name !== 'tutti');

            // Invia notifiche a tutti gli utenti nella lista filtrata
            await Promise.all(filteredUsers.map(async user => {
              await TodoService.createTodo({
                recipientId: user.id, // Utilizza l'ID dell'utente
                subject: 'Fase precedente completata',
                message,
                priority: 'high',
                type: 'step_notification',
                relatedTaskId: task.id,
                relatedStepId: nextStep.id,
                status: 'pending'
              });
            }));

            showInfo(`Notifica inviata a: ${filteredUsers.map(u => u.name).join(', ')}`);
          } else {
            // Crea notifica per il singolo destinatario
            await TodoService.createTodo({
              recipientId: nextStep.user.id,
              subject: 'Fase precedente completata',
              message,
              priority: 'high',
              type: 'step_notification',
              relatedTaskId: task.id,
              relatedStepId: nextStep.id,
              status: 'pending'
            });

            showInfo(`Notifica inviata a ${nextStep.user.name}`);
          }
        } catch (error) {
          console.error('Error sending notification:', error);
          showError('Errore nell\'invio della notifica');
        }
      }
    }

    // Verifica se tutti gli step saranno completati
    const willAllBeCompleted = updatedSteps.every(s =>
      s.id === stepId ? completed : s.completed
    );

    if (willAllBeCompleted) {
      // Mostra dialogo di archiviazione
      const shouldArchive = await showConfirmDialog({
        title: 'Task Completato',
        message: 'Tutte le fasi sono state completate. Vuoi archiviare questo task?',
        confirmText: 'Archivia',
        cancelText: 'Non ancora',
        confirmColor: 'success'
      });

      if (shouldArchive) {
        await completeTaskMutation.mutateAsync(task.id);
      }
    } else {
      showSuccess('Fase aggiornata');
    }
  } catch (error) {
    // Rollback in caso di errore
    setLocalTask(task);
    console.error('Error toggling step:', error);
    showError('Errore nell\'aggiornamento della fase');
  }
}, [updateStepMutation, completeTaskMutation, localTask, task, showSuccess, showInfo, showError, showConfirmDialog]);
