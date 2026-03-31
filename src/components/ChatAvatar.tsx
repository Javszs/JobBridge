import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

interface ChatAvatarProps {
  user: any;
  isMe: boolean;
}

const ChatAvatar: React.FC<ChatAvatarProps> = ({ user, isMe }) => {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    // This only runs if the profile_photo exists and changes
    if (user?.profile_photo) {
      const { data } = supabase.storage.from('avatars').getPublicUrl(user.profile_photo);
      if (data?.publicUrl) {
        setUrl(data.publicUrl);
      }
    }
  }, [user?.profile_photo]);

  if (url) {
    return (
      <img 
        src={url} 
        alt="avatar" 
        style={{ borderRadius: '50%', objectFit: 'cover', width: '100%', height: '100%' }} 
      />
    );
  }

  // Fallback to initial if no photo
  const initial = user?.firstname?.charAt(0) || '?';

  return (
    <div style={{
      background: isMe ? 'var(--ion-color-primary)' : '#78d0e6',
      color: 'white',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: '100%',
      height: '100%',
      borderRadius: '20%',
      fontSize: '20px',
      fontWeight: 'bold'
    }}>
      {initial}
    </div>
  );
};

export default ChatAvatar;