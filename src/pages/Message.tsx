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
  useIonViewWillEnter
} from '@ionic/react';
import { send } from 'ionicons/icons';
import { supabase } from '../supabaseClient';
import { useHistory } from 'react-router';
import CryptoJS from 'crypto-js';

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

  // 1. Single Fetch Function (Removed setLoading(true) from here to stop loops)
  const fetchMessages = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    setCurrentUserId(user.id);

    // Get recipient from URL if it exists
    const params = new URLSearchParams(window.location.search);
    const recipientFromUrl = params.get('recipient');
    if (recipientFromUrl) setOtherUserId(recipientFromUrl);

    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('chat_id', chatId)
      .order('created_at', { ascending: true });

    if (data && data.length > 0) {
      const firstMsg = data[0];
      const other = firstMsg.sender_id === user.id ? firstMsg.receiver_id : firstMsg.sender_id;
      setOtherUserId(other);

      const decrypted = data.map(msg => ({
        ...msg,
        message_text: decryptMessage(msg.encrypted_message, msg.sender_id, msg.receiver_id)
      }));
      setMessages(decrypted);
      scrollToBottom(0);
    }
    setLoading(false);
  }, [chatId, decryptMessage, scrollToBottom]);

  // 2. Lifecycle: Runs ONLY when the page is entered
  useIonViewWillEnter(() => {
    fetchMessages();
  });

  // 3. Real-time Subscription: Runs ONCE on mount
  useEffect(() => {
    const channel = supabase
      .channel(`chat_${chatId}`)
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `chat_id=eq.${chatId}` }, 
        (payload) => {
          const newMsg = payload.new as any;
          setMessages(prev => {
            // Prevent duplicate messages if Realtime and Fetch overlap
            if (prev.find(m => m.id === newMsg.id)) return prev;
            
            const decrypted = {
              ...newMsg,
              message_text: decryptMessage(newMsg.encrypted_message, newMsg.sender_id, newMsg.receiver_id)
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

  const sendMessage = async () => {
    if (!newMessage.trim() || !currentUserId || !otherUserId) {
      setToast({ message: "Recipient unknown. Try re-opening chat from the job page.", color: "danger" });
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
              <IonBackButton defaultHref="/tabs/Chats" />
            </IonButtons>
            <IonTitle>Chat</IonTitle>
          </IonToolbar>
        </IonHeader>
        <IonContent fullscreen className="ion-padding">
          <IonRefresher slot="fixed" onIonRefresh={handleRefresh}>
            <IonRefresherContent></IonRefresherContent>
          </IonRefresher>
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
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
                <IonBackButton defaultHref="/tabs/Chats" />
            </IonButtons>
            <IonTitle>Chat</IonTitle>
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
              <div key={msg.id} style={{ alignSelf: isMe ? 'flex-end' : 'flex-start', maxWidth: '80%' }}>
                <div style={{
                  background: isMe ? 'var(--ion-color-primary)' : '#f0f0f0',
                  color: isMe ? 'white' : 'black',
                  padding: '10px 16px',
                  borderRadius: isMe ? '18px 18px 2px 18px' : '18px 18px 18px 2px',
                  fontSize: '14px'
                }}>
                  {msg.message_text}
                </div>
                <div style={{ fontSize: '10px', color: '#999', textAlign: isMe ? 'right' : 'left', marginTop: '4px' }}>
                  {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            );
          })}
        </div>
      </IonContent>

      <IonFooter>
        <div style={{ padding: '8px', background: 'white', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <IonInput
            value={newMessage}
            onIonInput={e => setNewMessage(e.detail.value!)}
            placeholder="Type a message..."
            style={{ 
              '--background': '#f4f4f4', 
              '--padding-start': '15px', 
              'border-radius': '20px',
              'margin-left': '8px'
            }}
          />
          <IonButton fill="clear" onClick={sendMessage}>
            <IonIcon icon={send} slot="icon-only" />
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