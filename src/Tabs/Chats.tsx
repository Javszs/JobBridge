import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent, 
  IonList, IonItem, IonAvatar, IonLabel, IonNote, IonRefresher, 
  IonSpinner, IonRefresherContent, useIonViewWillEnter, IonAlert
} from '@ionic/react';
import { supabase } from '../supabaseClient';
import './Chats.css';

const Messages: React.FC = () => {
  const [conversations, setConversations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [archiveAlert, setArchiveAlert] = useState<{ isOpen: boolean; chatId: string }>({ isOpen: false, chatId: '' });
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);

  const fetchConversations = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

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
        .eq('archived', false)
        .order('created_at', { ascending: false });

      if (error) {
        console.error("Fetch error:", error);
        return;
      }

      const grouped = data?.reduce((acc: any, msg: any) => {
        if (!acc[msg.chat_id]) {
          const isMeSender = msg.sender_id === user.id;
          const otherUser = isMeSender ? msg.receiver : msg.sender;
          const otherId = isMeSender ? msg.receiver_id : msg.sender_id;
          
          let profilePhotoUrl = '';
          if (otherUser?.profile_photo) {
            const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(otherUser.profile_photo);
            profilePhotoUrl = urlData.publicUrl;
          }

          acc[msg.chat_id] = {
            chat_id: msg.chat_id,
            otherUserId: otherId,
            name: otherUser ? `${otherUser.firstname} ${otherUser.lastname}`.trim() : 'Unknown User',
            profilePhotoUrl,
            lastMsg: "[Encrypted Message]", 
            date: new Date(msg.created_at).toLocaleDateString(),
            jobPosition: null
          };
        }
        return acc;
      }, {});

      let convList = Object.values(grouped || {});

      // Add job position
      if (convList.length > 0) {
        const chatIds = convList.map((c: any) => c.chat_id);
        const { data: jobsData } = await supabase
          .from('jobs')
          .select('job_id, position')
          .in('job_id', chatIds);

        convList = convList.map((conv: any) => ({
          ...conv,
          jobPosition: jobsData?.find((j: any) => j.job_id === conv.chat_id)?.position || null
        }));
      }

      setConversations(convList);
    } catch (err) {
      console.error("Selection Error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useIonViewWillEnter(() => {
    fetchConversations();
  });

  const handleRefresh = async (event: CustomEvent) => {
    await fetchConversations();
    event.detail.complete();
  };

    // Archive entire chat
  const archiveChat = async (chatId: string) => {
    try {
      console.log(`Attempting to archive chat: ${chatId}`);

      const { error } = await supabase
        .from('messages')
        .update({ archived: true })
        .eq('chat_id', chatId);

      if (error) {
        console.error("Archive Error:", error);
        return;
      }

      await fetchConversations();  
      setArchiveAlert({ isOpen: false, chatId: '' });

    } catch (err) {
      console.error("Unexpected Archive Error:", err);
    }
  };

  const handleTouchStart = (chatId: string) => {
    longPressTimer.current = setTimeout(() => {
      setArchiveAlert({ isOpen: true, chatId });
    }, 600);
  };

  const handleTouchEnd = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
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
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
            <IonSpinner name="crescent" />
          </div>
        ) : conversations.length === 0 ? (
          <div style={{ 
            textAlign: 'center', 
            marginTop: '50px', 
            color: '#010101', 
            fontSize: '1.2rem' 
          }}>
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
                onTouchStart={() => handleTouchStart(conv.chat_id)}
                onTouchEnd={handleTouchEnd}
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
                <IonLabel className='Chats-label'>
                  <h2>{conv.name}</h2>

                  {conv.jobPosition && (
                    <p style={{ 
                      color: '#3168b9', 
                      fontWeight: 600, 
                      margin: '2px 0 4px',
                      fontSize: '0.95rem'
                    }}>
                      For Position: {conv.jobPosition}
                    </p>
                  )}

                  <p style={{ color: '#666' }}>{conv.lastMsg}</p>
                </IonLabel>
                <IonNote slot="end" style={{ fontSize: '0.8rem' }}>{conv.date}</IonNote>
              </IonItem>
            ))}
          </IonList>
        )}
      </IonContent>

      <IonAlert
        isOpen={archiveAlert.isOpen}
        onDidDismiss={() => setArchiveAlert({ isOpen: false, chatId: '' })}
        header="Archive Chat"
        message="Do you want to archive this conversation? It will be hidden from both yours and other's chat list."
        buttons={[
          { text: 'Cancel', role: 'cancel' },
          { 
            text: 'Archive', 
            handler: () => archiveChat(archiveAlert.chatId),
          },
        ]}
      />
    </IonPage>
  );
};

export default Messages;