'use client'
import { ChatWidget } from '../../../shared/components/chat'

export default function WsTest() {
  // Load rooms client-side for this test page
  const chatRooms = [
    { id: "family_room", name: "Family Room", description: "Family chat and coordination", private: false },
    { id: "tutor_room", name: "Tutor Room", description: "Educational discussions and learning support", private: false },
  ];

  return (
    <div className="min-h-screen">
      <ChatWidget
        variant="novaOS"
        rooms={chatRooms}
        initialRoomId="family_room"
        initialMessages={[]}
        title="GypsyCove Chat"
      />
    </div>
  );
}
