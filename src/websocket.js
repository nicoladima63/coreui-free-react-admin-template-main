// websocket.js
//const WebSocket = require('ws');

let socket;

export const connectWebSocket = (url, handleNewNotification) => {
  socket = new WebSocket(url);

  socket.onopen = () => {
    console.log('WebSocket connesso');
  };

  socket.onmessage = (event) => {
    const data = JSON.parse(event.data);
    console.log('Messaggio ricevuto:', data.message);
    // Usa la funzione di gestione delle notifiche qui
    handleNewNotification(data); // Passa l'intero oggetto, se necessario
  };

  socket.onclose = () => {
    console.log('WebSocket chiuso');
  };

  socket.onerror = (error) => {
    console.error('Errore WebSocket:', error);
  };
};

export const sendNotification = (message) => {
  if (socket && socket.readyState === WebSocket.OPEN) {
    socket.send(JSON.stringify({ message }));
  } else {
    console.error('WebSocket non è aperto');
  }
};
