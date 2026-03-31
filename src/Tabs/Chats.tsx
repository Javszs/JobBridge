import React, { useState, useEffect, useCallback } from 'react';
import { 
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent, 
  IonList, IonItem, IonAvatar, IonLabel, IonNote, IonRefresher, 
  IonSpinner, IonRefresherContent 
} from '@ionic/react';
import { supabase } from '../supabaseClient';

const Messages: React.FC = () => {
  const [conversations, setConversations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchConversations = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  // We query the messages, but we tell Supabase exactly which FK to follow
  const { data, error } = await supabase
    .from('messages')
    .select(`
      chat_id,
      created_at,
      encrypted_message,
      sender_id,
      receiver_id,
      sender:users!messages_sender_id_fkey (firstname, lastname),
      receiver:users!messages_receiver_id_fkey (firstname, lastname)
    `)
    .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
    .order('created_at', { ascending: false });

  if (error) {
    console.error("Selection Error:", error);
    return;
  }

  // Grouping logic to ensure one card per chat_id
  const grouped = data?.reduce((acc: any, msg: any) => {
    if (!acc[msg.chat_id]) {
      // Determine if the 'Other User' is the sender or receiver
      const isMeSender = msg.sender_id === user.id;
      const otherUser = isMeSender ? msg.receiver : msg.sender;
      const otherId = isMeSender ? msg.receiver_id : msg.sender_id;

      acc[msg.chat_id] = {
        chat_id: msg.chat_id,
        otherUserId: otherId,
        name: `${otherUser?.firstname || 'User'} ${otherUser?.lastname || ''}`,
        lastMsg: "[Encrypted Message]", // Since it's AES, we show a placeholder
        date: new Date(msg.created_at).toLocaleDateString()
      };
    }
    return acc;
  }, {});

  setConversations(Object.values(grouped || {}));
};

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  const handleRefresh = async (event: CustomEvent) => {
    await fetchConversations();
    event.detail.complete();
  };

  

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar color="primary">
          <IonTitle>Messages</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent>
        <IonRefresher slot="fixed" onIonRefresh={handleRefresh}>
          <IonRefresherContent />
        </IonRefresher>

        {conversations.length === 0 && !loading && (
          <div style={{ textAlign: 'center', marginTop: '50px', color: '#888' }}>
            <p>No conversations yet.</p>
          </div>
        )}

        <IonList>
          {conversations.map((conv) => (
            <IonItem 
              key={conv.chat_id} 
              // This sends the ID to your working Message.tsx and tells it who the recipient is
              routerLink={`/message/${conv.chat_id}?recipient=${conv.otherUserId}`}
              button
              detail={true}
            >
              <IonAvatar slot="start">
                <div style={{ 
                  background: '#3880ff', 
                  color: 'white', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  height: '100%' 
                }}>
                  {conv.name.charAt(0)}
                </div>
              </IonAvatar>
              <IonLabel>
                <h2>{conv.name}</h2>
                <p>{conv.lastMsg}</p>
              </IonLabel>
              <IonNote slot="end">{conv.date}</IonNote>
            </IonItem>
          ))}
        </IonList>
      </IonContent>
    </IonPage>
  );
};

export default Messages;