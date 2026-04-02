import React, { useState } from 'react';
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonList,
  IonItem,
  IonAvatar,
  IonLabel,
  IonSpinner,
  IonRefresher,
  IonRefresherContent,
  useIonViewWillEnter,
  IonNote,
  IonButtons,
  IonBackButton
} from '@ionic/react';
import { useHistory } from 'react-router';
import { supabase } from '../supabaseClient';
import './Notifications.css';

const Notification: React.FC = () => {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const history = useHistory();

  useIonViewWillEnter(() => {
    fetchNotifications();
  });

  const fetchNotifications = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get latest message per chat where user is receiver and chat is not archived
      const { data, error } = await supabase
        .from('messages')
        .select(`
          chat_id,
          created_at,
          sender_id,
          receiver_id,
          encrypted_message,
          sender:users!messages_sender_id_fkey (firstname, lastname, profile_photo)
        `)
        .eq('receiver_id', user.id)
        .eq('archived', false)
        .eq('is_read', false)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Group by sender_id and chat_id to allow multiple notifications per chat_id from different senders
      const grouped = data?.reduce((acc: any, msg: any) => {
        const groupKey = `${msg.sender_id}-${msg.chat_id}`;
        let profilePhotoUrl = '';
          if (msg.sender?.profile_photo) {
            const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(msg.sender.profile_photo);
            profilePhotoUrl = urlData.publicUrl;
          }

          acc[groupKey] = {
            chat_id: msg.chat_id,
            senderName: `${msg.sender.firstname} ${msg.sender.lastname}`.trim(),
            senderId: msg.sender_id,
            profilePhotoUrl,
            timestamp: msg.created_at,
            jobPosition: null
          };
        return acc;
      }, {});

      let notifList = Object.values(grouped || {});

      // Add job position
      if (notifList.length > 0) {
        const jobIds = notifList.map((n: any) => n.chat_id);
        const { data: jobsData } = await supabase
          .from('jobs')
          .select('job_id, position')
          .in('job_id', jobIds);

        notifList = notifList.map((notif: any) => ({
          ...notif,
          jobPosition: jobsData?.find((j: any) => j.job_id === notif.chat_id)?.position || null
        }));
      }

      setNotifications(notifList);
    } catch (err) {
      console.error("Error fetching notifications:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleNotificationClick = async (chatId: string, senderId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Try to mark messages as read by setting a read flag if present
      const { error } = await supabase
        .from('messages')
        .update({ is_read: true })
        .eq('chat_id', chatId)
        .eq('receiver_id', user.id)
        .eq('sender_id', senderId);

      // remove from notification list immediately (UI feedback)
      setNotifications(prev => prev.filter(n => !(n.senderId === senderId && n.chat_id === chatId)));

      // open full chat same way Chats.tsx does
      history.push(`/message/${senderId}?chat_id=${chatId}`);
    } catch (err) {
      console.error('Error handling notification click:', err);
    }
  };

  const handleRefresh = async (event: CustomEvent) => {
    await fetchNotifications();
    event.detail.complete();
  };

  if (loading) {
    return (
      <IonPage>
        <IonHeader>
          <IonToolbar color="primary">
            <IonButtons slot="start" style={{'color': 'white'}}>
              <IonBackButton defaultHref="/tabs/home" />
              </IonButtons>
            <IonTitle style={{'color': 'white'}}>Notifications</IonTitle>
          </IonToolbar>
        </IonHeader>

        <IonContent fullscreen className="ion-padding">
          <div style={{ display: 'flex', justifyContent: 'center', marginTop: '100px' }}>
            <IonSpinner name="crescent" />
          </div>
        </IonContent>
      </IonPage>
    );
  }

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar color="primary">
          <IonButtons slot="start" style={{'color': 'white'}}>
            <IonBackButton defaultHref="/tabs/home" />
            </IonButtons>
          <IonTitle style={{'color': 'white'}}>Notifications</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent fullscreen>
        <IonRefresher slot="fixed" onIonRefresh={handleRefresh}>
          <IonRefresherContent />
        </IonRefresher>

        {notifications.length === 0 ? (
          <div style={{ textAlign: 'center', marginTop: '100px', color: '#64748b' }}>
            <p>No new notifications</p>
          </div>
        ) : (
          <IonList className='Chats-List'>
            {notifications.map((notif: any) => (
              <IonItem
                key={`${notif.senderId}-${notif.chat_id}`}
                button
                onClick={() => handleNotificationClick(notif.chat_id, notif.senderId)}
                className='Chat-Item'
              >
                <IonAvatar slot="start">
                    {notif.profilePhotoUrl ? (
                      <img src={notif.profilePhotoUrl} alt={notif.senderName} className="avatar-placeholder"/>
                    ) : (
                      <div className="avatar-placeholder">
                        {notif.senderName.charAt(0)}
                      </div>
                    )}
                </IonAvatar>
                <IonLabel className='Chats-label'>
                  <h2>New message from </h2>
                  <h2>{notif.senderName}</h2>
                  <p style={{ fontSize: '0.85rem', color: '#6a717d' }}>Tap to open chat</p>
                </IonLabel>
                <IonNote slot="end" style={{ fontSize: '0.75rem' }}>
                  {new Date(notif.timestamp).toLocaleDateString()}
                </IonNote>
              </IonItem>
            ))}
          </IonList>
        )}
      </IonContent>
    </IonPage>
  );
};

export default Notification;