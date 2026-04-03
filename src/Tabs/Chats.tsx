import React, { useState, useCallback, useRef } from 'react';
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
  const [archiveAlert, setArchiveAlert] = useState<{ isOpen: boolean; chatId: string; otherUserId: string }>({ isOpen: false, chatId: '', otherUserId: '' });
  const [longPressActivated, setLongPressActivated] = useState(false);
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
        const isMeSender = msg.sender_id === user.id;
        const otherUser = isMeSender ? msg.receiver : msg.sender;
        const otherId = isMeSender ? msg.receiver_id : msg.sender_id;
        
        // Group by both otherUserId and chat_id to allow multiple chats with same user for different jobs
        const groupKey = `${otherId}-${msg.chat_id}`;
        
        if (!acc[groupKey]) {
          let profilePhotoUrl = '';
          if (otherUser?.profile_photo) {
            const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(otherUser.profile_photo);
            profilePhotoUrl = urlData.publicUrl;
          }

          acc[groupKey] = {
            chat_id: msg.chat_id, // the actual chat_id from messages table
            message_chat_id: msg.chat_id, // the actual chat_id from messages table
            job_id: msg.chat_id, // the job_id from the message
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
        const jobIds = convList.map((c: any) => c.job_id);
        const { data: jobsData } = await supabase
          .from('jobs')
          .select('job_id, position')
          .in('job_id', jobIds);

        convList = convList.map((conv: any) => ({
          ...conv,
          jobPosition: jobsData?.find((j: any) => j.job_id === conv.job_id)?.position || null
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

    // Archive entire chat by chat_id
  const archiveChat = async (chatId: string, otherUserId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('messages')
        .update({ archived: true })
        .eq('chat_id', chatId)
        .or(`and(sender_id.eq.${user.id},receiver_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},receiver_id.eq.${user.id})`);

      if (error) {
        console.error("Archive Error:", error);
        return;
      }

      await fetchConversations();  
      setArchiveAlert({ isOpen: false, chatId: '', otherUserId: '' });
      setLongPressActivated(false);

    } catch (err) {
      console.error("Unexpected Archive Error:", err);
    }
  };

  const handleTouchStart = (chatId: string, otherUserId: string) => {
    longPressTimer.current = setTimeout(() => {
      setLongPressActivated(true);
      setArchiveAlert({ isOpen: true, chatId, otherUserId });
    }, 600);
  };

  const handleTouchEnd = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
    // Reset long press state if it wasn't activated
    if (!longPressActivated) {
      setLongPressActivated(false);
    }
  };

  const handleItemClick = (conv: any) => {
    if (longPressActivated) {
      // Long press was activated, don't navigate
      setLongPressActivated(false);
      return;
    }
    // Navigate to message page
    window.location.href = `/message/${conv.otherUserId}?chat_id=${conv.chat_id}`;
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
            <p style={{color: 'white', fontSize: '1.3rem', marginTop: '100px'}}>No conversations yet.</p>
          </div>
        ) : (
          <IonList className='Chats-List'>
            {conversations.map((conv) => (
              <IonItem 
                key={`${conv.otherUserId}-${conv.chat_id}`}
                button
                detail={true}
                className='Chat-Item'
                lines='none'
                onClick={() => handleItemClick(conv)}
                onTouchStart={() => handleTouchStart(conv.chat_id, conv.otherUserId)}
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
                      color: '#3168b9 !important', 
                      fontWeight: '600 !important', 
                      margin: '2px 0 4px !important',
                      fontSize: '0.95rem !important'
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
        onDidDismiss={() => {
          setArchiveAlert({ isOpen: false, chatId: '', otherUserId: '' });
          setLongPressActivated(false);
        }}
        header="Archive Chat"
        message="Do you want to archive this conversation? It will be hidden from both yours and other's chat list."
        buttons={[
          { text: 'Cancel', role: 'cancel' },
          { 
            text: 'Archive', 
            handler: () => archiveChat(archiveAlert.chatId, archiveAlert.otherUserId),
          },
        ]}
      />
    </IonPage>
  );
};

export default Messages;