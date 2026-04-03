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
  IonToast,
  IonAlert,
  IonButtons,
  IonBackButton,
  IonBadge,
  IonRefresher,
  IonRefresherContent,
  RefresherEventDetail,
} from '@ionic/react';
import { trashOutline, banOutline, arrowBack } from 'ionicons/icons';
import { supabase } from '../supabaseClient';

const AdminUsers: React.FC = () => {
  const history = useHistory();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ message: string; color: 'success' | 'danger' } | null>(null);

  const [showBanAlert, setShowBanAlert] = useState(false);
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [selectedAction, setSelectedAction] = useState<'ban' | 'unban' | 'delete' | null>(null);

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
    const { data } = await supabase
      .from('users')
      .select('id, firstname, lastname, email, role, banned, created_at')
      .order('created_at', { ascending: false });

    setUsers(data || []);
    setLoading(false);
  };

  // Toggle Ban / Unban
  const toggleBan = async () => {
    if (!selectedUserId) return;

    const currentUser = users.find(u => u.id === selectedUserId);
    const newBannedState = !currentUser?.banned;

    const { error } = await supabase
      .from('users')
      .update({ banned: newBannedState })
      .eq('id', selectedUserId);

    if (error) {
      setToast({ message: 'Failed to update ban status', color: 'danger' });
    } else {
      setToast({ 
        message: newBannedState ? 'User has been banned' : 'User has been unbanned', 
        color: 'success' 
      });
      fetchUsers();
    }

    setShowBanAlert(false);
    setSelectedUserId(null);
  };

  // Hard Delete User
  const deleteUser = async () => {
    if (!selectedUserId) return;

    try {
      await supabase.auth.admin.deleteUser(selectedUserId);
      await supabase.from('users').delete().eq('id', selectedUserId);

      setToast({ message: 'User permanently deleted', color: 'success' });
      fetchUsers();
    } catch (err) {
      console.error(err);
      setToast({ message: 'Failed to delete user', color: 'danger' });
    }

    setShowDeleteAlert(false);
    setSelectedUserId(null);
  };

  const openAction = (userId: string, action: 'ban' | 'delete') => {
    setSelectedUserId(userId);
    if (action === 'ban') {
      setShowBanAlert(true);
    } else {
      setShowDeleteAlert(true);
    }
  };
  
  const handleRefresh = async (event: CustomEvent<RefresherEventDetail>) => {
        await fetchUsers();
        event.detail.complete();
      };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar color="primary">
          <IonButtons slot="start" style={{color: 'white'}}>
            <IonBackButton defaultHref="/admin-dashboard" />
          </IonButtons>
          <IonTitle style={{color: 'white'}}>Manage Users</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent fullscreen className="ion-padding">
        <h2 style={{ margin: '10px 0 20px', color: '#ffffff', textAlign: 'center', fontSize: '1.8rem' }}>
          All Users
        </h2>
        <IonRefresher slot="fixed" onIonRefresh={handleRefresh}>
            <IonRefresherContent />
        </IonRefresher>
        {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', marginTop: '50px' }}>
                <IonSpinner />
            </div>
        ) : (
          <IonList className="Chats-List">
            {users.map((user) => (
              <IonItem key={user.id} className="Chat-Item">
                <IonLabel className="Chats-label">
                  <h2>{user.firstname} {user.lastname}</h2>
                  <p>{user.email}</p>
                  <p>
                    Role: <strong>{user.role || 'seeker'}</strong>
                    {user.banned && (
                      <IonBadge color="danger" style={{ marginLeft: '8px' }}>BANNED</IonBadge>
                    )}
                  </p>
                </IonLabel>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <IonButton 
                    color={user.banned ? "success" : "warning"} 
                    size="small"
                    onClick={() => openAction(user.id, 'ban')}
                  >
                    <IonIcon icon={banOutline} />
                  </IonButton>

                  <IonButton 
                    color="danger" 
                    size="small"
                    onClick={() => openAction(user.id, 'delete')}
                  >
                    <IonIcon icon={trashOutline} />
                  </IonButton>
                </div>
              </IonItem>
            ))}
          </IonList>
        )}

        {/* Ban / Unban Alert */}
        <IonAlert
          isOpen={showBanAlert}
          onDidDismiss={() => setShowBanAlert(false)}
          header={users.find(u => u.id === selectedUserId)?.banned ? "Unban User" : "Ban User"}
          message={users.find(u => u.id === selectedUserId)?.banned 
            ? "Allow this user to log in again?" 
            : "Prevent this user from logging in?"}
          buttons={[
            { text: 'Cancel', role: 'cancel' },
            { 
              text: users.find(u => u.id === selectedUserId)?.banned ? "Unban" : "Ban", 
              role: 'destructive', 
              handler: toggleBan 
            },
          ]}
        />

        {/* Delete Alert */}
        <IonAlert
          isOpen={showDeleteAlert}
          onDidDismiss={() => setShowDeleteAlert(false)}
          header="Delete User"
          message="This action cannot be undone. Permanently delete this account?"
          buttons={[
            { text: 'Cancel', role: 'cancel' },
            { text: 'Delete Permanently', role: 'destructive', handler: deleteUser },
          ]}
        />

        <IonToast
          isOpen={!!toast}
          message={toast?.message}
          color={toast?.color}
          duration={2800}
          position="bottom"
          onDidDismiss={() => setToast(null)}
        />
      </IonContent>
    </IonPage>
  );
};

export default AdminUsers;