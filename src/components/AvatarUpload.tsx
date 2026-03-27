import React, { useState } from 'react';
import { IonButton, IonSpinner, IonToast } from '@ionic/react';
import { camera } from 'ionicons/icons';
import { supabase } from '../supabaseClient';

interface AvatarUploadProps {
  url?: string;
  onUpload: (filePath: string) => void;
}

const AvatarUpload: React.FC<AvatarUploadProps> = ({ url, onUpload }) => {
  const [uploading, setUploading] = useState(false);

  const uploadAvatar = async () => {
    try {
      setUploading(true);

      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.onchange = async (e: any) => {
        const file = e.target.files[0];
        if (!file) return;

        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}.${fileExt}`;

        const { error } = await supabase.storage
          .from('avatars')
          .upload(fileName, file, {
            cacheControl: '3600',
            upsert: false,
          });

        if (error) throw error;

        onUpload(fileName);
      };
      input.click();
    } catch (error: any) {
      alert('Error uploading image: ' + error.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div style={{ textAlign: 'center', marginBottom: '20px' }}>
      <IonButton onClick={uploadAvatar} disabled={uploading}>
        {uploading ? <IonSpinner /> : 'Upload Profile Photo'}
      </IonButton>
    </div>
  );
};

export default AvatarUpload;