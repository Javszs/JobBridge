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
  IonAvatar
} from '@ionic/react';
import { send } from 'ionicons/icons';
import { supabase } from '../supabaseClient';
import { useHistory } from 'react-router';
import CryptoJS from 'crypto-js';
import ChatAvatar from '../components/ChatAvatar';

const Message: React.FC = () => {
  const history = useHistory();
  const chatId = window.location.pathname.split('/').pop() || '';
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [toast, setToast] = useState<{ message: string; color: 'success' | 'danger' } | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string>('');
  const [otherUserId, setOtherUserId] = useState<string>(''); 
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

      // Get recipient from URL safely
      const params = new URLSearchParams(window.location.search);
      const recipientFromUrl = params.get('recipient');
      if (recipientFromUrl) setOtherUserId(recipientFromUrl);

      const { data, error } = await supabase
        .from('messages')
        .select(`
          *,
          sender:users!messages_sender_id_fkey (firstname, lastname, profile_photo),
          receiver:users!messages_receiver_id_fkey (firstname, lastname, profile_photo)
        `)
        .eq('chat_id', chatId)
        .order('created_at', { ascending: true });

      if (data) {
        if (data.length > 0) {
          const firstMsg = data[0];
          const other = firstMsg.sender_id === user.id ? firstMsg.receiver_id : firstMsg.sender_id;
          setOtherUserId(other);
          
          // Cache profiles in ref to use for real-time updates
          profilesRef.current[data[0].sender_id] = data[0].sender;
          profilesRef.current[data[0].receiver_id] = data[0].receiver;
        }

        const decrypted = data.map(msg => ({
          ...msg,
          message_text: decryptMessage(msg.encrypted_message, msg.sender_id, msg.receiver_id)
        }));
        setMessages(decrypted);
        scrollToBottom(0);
      }
    } finally {
      setLoading(false);
    }
  }, [chatId, decryptMessage, scrollToBottom]);

  useIonViewWillEnter(() => {
    fetchMessages();
  });

  useEffect(() => {
    const channel = supabase
      .channel(`chat_${chatId}`)
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `chat_id=eq.${chatId}` }, 
        (payload) => {
          const newMsg = payload.new as any;
          
          setMessages(prev => {
            if (prev.find(m => m.id === newMsg.id)) return prev;
            
            const decrypted = {
              ...newMsg,
              message_text: decryptMessage(newMsg.encrypted_message, newMsg.sender_id, newMsg.receiver_id),
              // Use cached profiles instead of re-fetching
              sender: profilesRef.current[newMsg.sender_id],
              receiver: profilesRef.current[newMsg.receiver_id]
            };
            return [...prev, decrypted];
          });
          scrollToBottom();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [chatId, decryptMessage, scrollToBottom]);

  // sendMessage function remains similar but ensure otherUserId is set
  const sendMessage = async () => {
    if (!newMessage.trim() || !currentUserId || !otherUserId) {
      setToast({ message: "Recipient unknown. Try re-opening chat.", color: "danger" });
      return;
    }

    const key = getSharedKey(currentUserId, otherUserId);
    const encrypted = CryptoJS.AES.encrypt(newMessage, key).toString();

    const { error } = await supabase.from('messages').insert({
      chat_id: chatId,
      sender_id: currentUserId,
      receiver_id: otherUserId,
      encrypted_message: encrypted,
    });

    if (error) {
      setToast({ message: error.message, color: 'danger' });
    } else {
      setNewMessage('');
    }
  };

  // ... (UI logic remains similar, but use a simpler avatar helper)
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

  if (loading) {
    return (
      <IonPage>
        <IonHeader>
          <IonToolbar color="primary">
            <IonButtons slot="start">
              <IonBackButton defaultHref="/tabs/Chats" style={{'color': 'white'}}/>
            </IonButtons>
            <IonTitle style={{'color': 'white'}}>Chat</IonTitle>
          </IonToolbar>
        </IonHeader>
        <IonContent fullscreen className="ion-padding">
          <IonRefresher slot="fixed" onIonRefresh={handleRefresh}>
            <IonRefresherContent></IonRefresherContent>
          </IonRefresher>
          <div className='chat-container' style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
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
                <IonBackButton defaultHref="/tabs/Chats" style={{'color': 'white'}}/>
            </IonButtons>
            <IonTitle style={{'color': 'white'}}>Chat</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent ref={contentRef}>
        <IonRefresher slot="fixed" onIonRefresh={handleRefresh}>
          <IonRefresherContent></IonRefresherContent>
        </IonRefresher>
        <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {messages.map((msg) => {
            const isMe = msg.sender_id === currentUserId;
  
            return (
              <div key={msg.id} style={{ 
                display: 'flex', 
                  alignItems: 'flex-end', 
                  justifyContent: isMe ? 'flex-end' : 'flex-start',
                  marginBottom: '12px',
                  gap: '8px'
                }}>
                  {/* LEFT AVATAR (Other person) */}
                  {!isMe && (
                    <IonAvatar style={{ width: '60px', height: '60px', flexShrink: 0, marginRight: '8px' }}>
                      <ChatAvatar user={msg.sender} isMe={false} />
                    </IonAvatar>
                  )}
                  
                  <div style={{ maxWidth: '70%' }}>
                    {/* Message Bubble */}
                    <div style={{
                      background: isMe ? 'var(--ion-color-primary)' : '#f0f0f0',
                      color: isMe ? 'white' : 'black',
                      padding: '10px 16px',
                      borderRadius: isMe ? '12px 12px 2px 12px' : '12px 12px 12px 2px',
                      fontSize: '20px'
                    }}>
                      {msg.message_text}
                    </div>
                    {/* Timestamp */}
                    <div 
                    style={{ 
                        fontSize: '10px', 
                        color: '#d5eaeb', 
                        textAlign: isMe ? 'right' : 'left', 
                        marginTop: '4px' }}>
                      {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>

                  {/* RIGHT AVATAR (You) */}
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
        <div style={{ 
            padding: '8px', 
            background: 'white', 
            display: 'flex', 
            alignItems: 'center', 
            gap: '8px',
            backgroundColor: '#4685fb'
            }}>
          <IonInput
            value={newMessage}
            onIonInput={e => setNewMessage(e.detail.value!)}
            placeholder="Type a message..."
            style={{ 
              '--background': '#e8e6e6', 
              '--padding-start': '15px', 
              '--border-radius': '15px',
              'margin-left': '8px',
              'color': '#000000', 
            }}
          />
          <IonButton fill="clear" onClick={sendMessage}>
            <IonIcon icon={send} slot="icon-only" 
            style={{
                'color': 'white'
            }}/>
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