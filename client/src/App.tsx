import { useEffect, useState } from 'react';
import socket from './socket';

function App() {
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState('');

  useEffect(() => {
    socket.on('receive_message', (data) => {
      setMessages(prev => [...prev, data]);
    });

    return () => {
      socket.off('receive_message');
    };
  }, []);

  const sendMessage = (e) => {
    e.preventDefault();
    socket.emit('send_message', { message });
    setMessage('');
  };

  return (
    <div>
      <h1>Chat App</h1>
      <div>
        {messages.map((msg, i) => (
          <p key={i}>{msg.message}</p>
        ))}
      </div>
      <form onSubmit={sendMessage}>
        <input 
          value={message} 
          onChange={(e) => setMessage(e.target.value)} 
        />
        <button type="submit">Send</button>
      </form>
    </div>
  );
}

export default App;