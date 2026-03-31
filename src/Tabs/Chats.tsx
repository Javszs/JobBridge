import React, { useState, useEffect, useCallback } from 'react';
import { 
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent, 
  IonList, IonItem, IonAvatar, IonLabel, IonNote, IonRefresher, 
  IonSpinner, IonRefresherContent, useIonViewWillEnter 
} from '@ionic/react';
import { supabase } from '../supabaseClient';
import './Chats.css';

const Messages: React.FC = () => {
  const [conversations, setConversations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchConversations = useCallback(async () => {
    try {
      // 1. Get Logged in User
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // 2. Fetch messages where user is sender OR receiver
      const { data, error } = await supabase
        .from('messages')
        .select(`
          chat_id,
          created_at,
          encrypted_message,
          sender_id,
          receiver_id,
          sender:users!messages_sender_id_fkey (firstname, lastname, profile_photo),
          receiver:users!messages_receiver_id_fkey (firstname, lastname, profile_photo)
        `)
        .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // 3. Group messages by chat_id to get only the LATEST message per conversation
      const grouped = data?.reduce((acc: any, msg: any) => {
        if (!acc[msg.chat_id]) {
          const isMeSender = msg.sender_id === user.id;
          const otherUser = isMeSender ? msg.receiver : msg.sender;
          const otherId = isMeSender ? msg.receiver_id : msg.sender_id;
          
          // Get profile photo URL
          let profilePhotoUrl = '';
          if (otherUser?.profile_photo) {
            const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(otherUser.profile_photo);
            profilePhotoUrl = urlData.publicUrl;
          }

          acc[msg.chat_id] = {
            chat_id: msg.chat_id,
            otherUserId: otherId,
            name: otherUser ? `${otherUser.firstname} ${otherUser.lastname}` : 'Unknown User',
            profilePhotoUrl: profilePhotoUrl,
            lastMsg: "[Encrypted Message]", 
            date: new Date(msg.created_at).toLocaleDateString()
          };
        }
        return acc;
      }, {});

      setConversations(Object.values(grouped || {}));
    } catch (err) {
      console.error("Selection Error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Use Ionic lifecycle hook to refresh list every time the tab is clicked
  useIonViewWillEnter(() => {
    fetchConversations();
  });

  const handleRefresh = async (event: CustomEvent) => {
    await fetchConversations();
    event.detail.complete();
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar color="primary">
          <IonTitle className='Chat-Title'>Messages</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent>
        <IonRefresher slot="fixed" onIonRefresh={handleRefresh}>
          <IonRefresherContent />
        </IonRefresher>

        {loading ? (
          <div style={{ textAlign: 'center', marginTop: '20px' }}>
            <IonSpinner name="crescent" />
          </div>
        ) : conversations.length === 0 ? (
          <div style={{ 
            textAlign: 'center', 
          marginTop: '50px', 
          color: '#010101', 
          fontSize: '1.2rem' }}>
            <p>No conversations yet.</p>
          </div>
        ) : (
          <IonList className='Chats-List'>
            {conversations.map((conv) => (
              <IonItem 
                key={conv.chat_id} 
                routerLink={`/message/${conv.chat_id}?recipient=${conv.otherUserId}`}
                button
                detail={true}
                className='Chat-Item'
                lines='none'
              >
                <IonAvatar slot="start">
                  {conv.profilePhotoUrl ? (
                    <img src={conv.profilePhotoUrl} alt={conv.name} className='avatar-placeholder'/>
                  ) : (
                    <div className="avatar-placeholder">
                      {conv.name.charAt(0)}
                    </div>
                  )}
                </IonAvatar>
                <IonLabel class='Chats-label'>
                  <h2>{conv.name}</h2>
                  <p style={{ color: '#666' }}>{conv.lastMsg}</p>
                </IonLabel>
                <IonNote slot="end" style={{ fontSize: '0.8rem' }}>{conv.date}</IonNote>
              </IonItem>
            ))}
          </IonList>
        )}
      </IonContent>
    </IonPage>
  );
};

export default Messages;