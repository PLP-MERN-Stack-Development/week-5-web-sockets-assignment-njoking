import { useState } from 'react';
import socket from '../socket';

function RoomSelection() {
  const [currentRoom, setCurrentRoom] = useState(null);
  const [rooms, setRooms] = useState(['general', 'random', 'help']);

  const joinRoom = (room) => {
    if (currentRoom) {
      socket.emit('leave_room', currentRoom);
    }
    socket.emit('join_room', room);
    setCurrentRoom(room);
  };

  return (
    <div className="room-selection">
      <h3>Available Rooms</h3>
      <ul>
        {rooms.map(room => (
          <li key={room}>
            <button onClick={() => joinRoom(room)}>
              {room} {currentRoom === room && '(active)'}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}