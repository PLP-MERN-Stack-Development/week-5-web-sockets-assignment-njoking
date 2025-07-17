import RoomSelection from '../components/RoomSelection/RoomSelection';
import ChatWindow from '../components/Chat/ChatWindow';

function ChatPage() {
  return (
    <div className="chat-container">
      <RoomSelection />
      <ChatWindow />
    </div>
  );
}