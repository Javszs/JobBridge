import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonInput,
  IonButton,
  IonIcon,
  IonToast,
  IonButtons,
  IonBackButton,
  IonFooter,
  IonSpinner,
  IonRefresher,
  IonRefresherContent,
  RefresherEventDetail,
  useIonViewWillEnter,
  IonAvatar,
} from '@ionic/react';
import { send, informationCircle} from 'ionicons/icons';
import { supabase } from '../supabaseClient';
import { useHistory } from 'react-router';
import CryptoJS from 'crypto-js';
import ChatAvatar from '../components/ChatAvatar';

const Message: React.FC = () => {
  const history = useHistory();
  const chatId = window.location.pathname.split('/').pop() || '';
  const urlParams = new URLSearchParams(window.location.search);
  const recipient = urlParams.get('recipient');

  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [toast, setToast] = useState<{ message: string; color: 'success' | 'danger' } | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string>('');
  const [otherUserId, setOtherUserId] = useState<string>('');
  const [otherUserName, setOtherUserName] = useState<string>('Chat'); // ← New
  const [loading, setLoading] = useState(true);

  const contentRef = useRef<HTMLIonContentElement>(null);
  const profilesRef = useRef<{ [key: string]: any }>({});

  const getSharedKey = (idA: string, idB: string) => {
    if (!idA || !idB) return '';
    const sortedIds = [idA, idB].sort().join('');
    return CryptoJS.SHA256(sortedIds).toString(CryptoJS.enc.Hex).substring(0, 32);
  };

  const decryptMessage = useCallback((encrypted: string, sID: string, rID: string) => {
    try {
      const key = getSharedKey(sID, rID);
      const bytes = CryptoJS.AES.decrypt(encrypted, key);
      return bytes.toString(CryptoJS.enc.Utf8) || '[Decryption Error]';
    } catch { return '[Encrypted message]'; }
  }, []);

  const scrollToBottom = useCallback((duration = 300) => {
    setTimeout(() => {
      contentRef.current?.scrollToBottom(duration);
    }, 100);
  }, []);

  const fetchMessages = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setCurrentUserId(user.id);

      const { data, error } = await supabase
        .from('messages')
        .select(`
          *,
          sender:users!messages_sender_id_fkey (firstname, lastname, profile_photo),
          receiver:users!messages_receiver_id_fkey (firstname, lastname, profile_photo)
        `)
        .eq('chat_id', chatId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      if (data && data.length > 0) {
        const firstMsg = data[0];
        const isMeSender = firstMsg.sender_id === user.id;
        const other = isMeSender ? firstMsg.receiver : firstMsg.sender;
        const otherId = isMeSender ? firstMsg.receiver_id : firstMsg.sender_id;

        setOtherUserId(otherId);
        setOtherUserName(other ? `${other.firstname} ${other.lastname}`.trim() : 'Chat');

        // Cache profiles
        profilesRef.current[firstMsg.sender_id] = firstMsg.sender;
        profilesRef.current[firstMsg.receiver_id] = firstMsg.receiver;
      } else if (recipient) {
        setOtherUserId(recipient);
        const { data: userData } = await supabase
          .from('users')
          .select('firstname, lastname')
          .eq('id', recipient)
          .single();
        if (userData) {
          setOtherUserName(`${userData.firstname} ${userData.lastname}`.trim());
        }
      } else if (recipient) {
        setOtherUserId(recipient);
        const { data: userData } = await supabase
          .from('users')
          .select('firstname, lastname')
          .eq('id', recipient)
          .single();
        if (userData) {
          setOtherUserName(`${userData.firstname} ${userData.lastname}`.trim());
        }
      }

      const decrypted = data?.map(msg => ({
        ...msg,
        message_text: decryptMessage(msg.encrypted_message, msg.sender_id, msg.receiver_id)
      })) || [];

      setMessages(decrypted);
      scrollToBottom(0);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [chatId, decryptMessage, scrollToBottom]);

  useIonViewWillEnter(() => {
    fetchMessages();
  });

  // Real-time listener
  useEffect(() => {
    const channel = supabase
      .channel(`chat_${chatId}`)
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `chat_id=eq.${chatId}` }, 
        (payload) => {
          const newMsg = payload.new as any;
          const decrypted = {
            ...newMsg,
            message_text: decryptMessage(newMsg.encrypted_message, newMsg.sender_id, newMsg.receiver_id),
          };
          setMessages(prev => [...prev, decrypted]);
          scrollToBottom();
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [chatId, decryptMessage, scrollToBottom]);

  const sendMessage = async () => {
    if (!newMessage.trim() || !currentUserId || !otherUserId) {
      setToast({ message: "Recipient unknown. Try re-opening chat.", color: "danger" });
      return;
    }

    const encrypted = CryptoJS.AES.encrypt(newMessage, getSharedKey(currentUserId, otherUserId)).toString();

    const { error } = await supabase.from('messages').insert({
      chat_id: chatId,
      sender_id: currentUserId,
      receiver_id: otherUserId,
      encrypted_message: encrypted,
      archived: false,
    });

    if (error) {
      setToast({ message: error.message, color: 'danger' });
    } else {
      setNewMessage('');
    }
  };

  const getAvatar = (user: any) => {
    if (user?.profile_photo) {
      return supabase.storage.from('avatars').getPublicUrl(user.profile_photo).data.publicUrl;
    }
    return null;
  };

  const handleRefresh = async (event: CustomEvent<RefresherEventDetail>) => {
    await fetchMessages();
    event.detail.complete();
  };

  // Navigate to specific job page (chat_id is usually job_id)
  const goToJob = () => {
    history.push(`/job/${chatId}`);
  };

  if (loading) {
    return (
      <IonPage>
        <IonHeader>
          <IonToolbar color="primary">
            <IonButtons slot="start">
              <IonBackButton defaultHref="/tabs/Chats" style={{ color: 'white' }} />
            </IonButtons>
            <IonTitle style={{ color: 'white' }}>Chat</IonTitle>
          </IonToolbar>
        </IonHeader>
        <IonContent fullscreen className="ion-padding">
          <div className="chat-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
            <IonSpinner />
          </div>
        </IonContent>
      </IonPage>
    );
  }

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar color="primary">
          <IonButtons slot="start">
            <IonBackButton defaultHref="/tabs/Chats" style={{ color: 'white' }} />
          </IonButtons>

          <IonTitle style={{ color: 'white' }}>Chat: {otherUserName}</IonTitle>

          {/* Info icon → goes to Job.tsx */}
          <IonButtons slot="end">
            <IonButton onClick={goToJob}>
              <IonIcon icon={informationCircle} style={{ color: 'white', fontSize: '2rem', marginRight: '8px' }} />
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>

      <IonContent ref={contentRef}>
        <IonRefresher slot="fixed" onIonRefresh={handleRefresh}>
          <IonRefresherContent />
        </IonRefresher>

        <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {messages.map((msg) => {
            const isMe = msg.sender_id === currentUserId;

            return (
              <div
                key={msg.id}
                style={{
                  display: 'flex',
                  alignItems: 'flex-end',
                  justifyContent: isMe ? 'flex-end' : 'flex-start',
                  marginBottom: '12px',
                  gap: '8px',
                }}
              >
                {!isMe && (
                  <IonAvatar style={{ width: '60px', height: '60px', flexShrink: 0, marginRight: '8px' }}>
                    <ChatAvatar user={msg.sender} isMe={false} />
                  </IonAvatar>
                )}

                <div style={{ maxWidth: '70%' }}>
                  <div
                    style={{
                      background: isMe ? 'var(--ion-color-primary)' : '#f0f0f0',
                      color: isMe ? 'white' : 'black',
                      padding: '10px 16px',
                      borderRadius: isMe ? '12px 12px 2px 12px' : '12px 12px 12px 2px',
                      fontSize: '20px',
                    }}
                  >
                    {msg.message_text}
                  </div>
                  <div
                    style={{
                      fontSize: '10px',
                      color: '#d5eaeb',
                      textAlign: isMe ? 'right' : 'left',
                      marginTop: '4px',
                    }}
                  >
                    {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>

                {isMe && (
                  <IonAvatar style={{ width: '60px', height: '60px', flexShrink: 0, marginLeft: '8px' }}>
                    <ChatAvatar user={msg.sender} isMe={true} />
                  </IonAvatar>
                )}
              </div>
            );
          })}
        </div>
      </IonContent>

      <IonFooter>
        <div
          style={{
            padding: '8px',
            background: 'white',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            backgroundColor: '#4685fb',
          }}
        >
          <IonInput
            value={newMessage}
            onIonInput={(e) => setNewMessage(e.detail.value!)}
            placeholder="Type a message..."
            style={{
              '--background': '#e8e6e6',
              '--padding-start': '15px',
              '--border-radius': '15px',
              marginLeft: '8px',
              color: '#000000',
            }}
          />
          <IonButton fill="clear" onClick={sendMessage}>
            <IonIcon icon={send} slot="icon-only" style={{ color: 'white' }} />
          </IonButton>
        </div>
      </IonFooter>

      <IonToast
        isOpen={!!toast}
        message={toast?.message}
        color={toast?.color}
        duration={3000}
        onDidDismiss={() => setToast(null)}
      />
    </IonPage>
  );
};

export default Message;