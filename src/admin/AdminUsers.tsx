import React, { useState, useEffect } from 'react';
import { useHistory } from 'react-router';
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonList,
  IonItem,
  IonLabel,
  IonButton,
  IonIcon,
  IonSpinner,
  IonAlert,
} from '@ionic/react';
import { trashOutline, banOutline, arrowBack } from 'ionicons/icons';
import { supabase } from '../supabaseClient';

const AdminUsers: React.FC = () => {
  const history = useHistory();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  // Protection
  useEffect(() => {
    const checkAdmin = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return history.replace('/login');

      const { data } = await supabase.from('users').select('role').eq('id', user.id).single();
      if (data?.role?.toLowerCase() !== 'admin') {
        history.replace('/tabs/home');
      }
    };
    checkAdmin();
    fetchUsers();
  }, [history]);

  const fetchUsers = async () => {
    const { data, error } = await supabase
      .from('users')
      .select('id, firstname, lastname, email, role, created_at')
      .order('created_at', { ascending: false });

    if (error) console.error(error);
    else setUsers(data || []);
    setLoading(false);
  };

  const deleteUser = async () => {
    if (!selectedUserId) return;

    // Delete from auth.users (Supabase handles this via trigger or manually)
    const { error } = await supabase.auth.admin.deleteUser(selectedUserId);
    if (error) {
      alert('Failed to delete user');
      return;
    }

    // Also delete from public.users
    await supabase.from('users').delete().eq('id', selectedUserId);
    setShowDeleteAlert(false);
    fetchUsers();
  };

  const banUser = async (userId: string) => {
    // You can add a 'banned' boolean column in users table if you want soft ban
    alert(`User ${userId} banned (implement soft ban if needed)`);
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar color="primary">
          <IonButton slot="start" fill="clear" onClick={() => history.push('/admin-dashboard')}>
            <IonIcon icon={arrowBack} />
          </IonButton>
          <IonTitle>Manage Users</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent fullscreen className="ion-padding">
        {loading ? (
          <IonSpinner />
        ) : (
          <IonList>
            {users.map((user) => (
              <IonItem key={user.id}>
                <IonLabel>
                  <h2>{user.firstname} {user.lastname}</h2>
                  <p>{user.email}</p>
                  <p>Role: <strong>{user.role || 'seeker'}</strong></p>
                </IonLabel>
                <IonButton color="danger" fill="outline" onClick={() => banUser(user.id)}>
                  <IonIcon icon={banOutline} />
                </IonButton>
                <IonButton color="danger" onClick={() => {
                  setSelectedUserId(user.id);
                  setShowDeleteAlert(true);
                }}>
                  <IonIcon icon={trashOutline} />
                </IonButton>
              </IonItem>
            ))}
          </IonList>
        )}

        <IonAlert
          isOpen={showDeleteAlert}
          onDidDismiss={() => setShowDeleteAlert(false)}
          header="Delete User"
          message="This action cannot be undone. Delete this account permanently?"
          buttons={[
            { text: 'Cancel', role: 'cancel' },
            { text: 'Delete', role: 'destructive', handler: deleteUser },
          ]}
        />
      </IonContent>
    </IonPage>
  );
};

export default AdminUsers;