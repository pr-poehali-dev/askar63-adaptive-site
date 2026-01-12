import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import Icon from "@/components/ui/icon";
import { useToast } from "@/hooks/use-toast";

type View = 'home' | 'messages' | 'profile' | 'notifications' | 'admin';

interface Post {
  id: number;
  content: string;
  created_at: string;
  author: {
    id: number;
    full_name: string;
    username: string;
    avatar_url: string | null;
  };
  likes: number;
  comments: number;
}

interface Chat {
  id: number;
  name: string;
  username: string;
  avatar: string | null;
  last_message: string;
  last_message_time: string;
  unread_count: number;
}

interface Notification {
  id: number;
  type: string;
  content: string;
  created_at: string;
  is_read: boolean;
  related_user: {
    full_name: string;
  } | null;
}

interface Message {
  id: number;
  content: string;
  created_at: string;
  sender_id: number;
}

interface AdminUser {
  id: number;
  full_name: string;
  username: string;
  avatar_url: string | null;
  is_banned: boolean;
  is_admin: boolean;
}

const Index = () => {
  const { user, isAuthenticated, login, register, logout, updateUser } = useAuth();
  const { toast } = useToast();
  const [currentView, setCurrentView] = useState<View>('home');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  const [showAuthDialog, setShowAuthDialog] = useState(!isAuthenticated);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [authPhone, setAuthPhone] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authFullName, setAuthFullName] = useState('');
  
  const [posts, setPosts] = useState<Post[]>([]);
  const [userPosts, setUserPosts] = useState<Post[]>([]);
  const [chats, setChats] = useState<Chat[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [selectedChat, setSelectedChat] = useState<number | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageInput, setMessageInput] = useState('');
  const [newPostContent, setNewPostContent] = useState('');
  
  const [showAdminAuth, setShowAdminAuth] = useState(false);
  const [adminAuthPhone, setAdminAuthPhone] = useState('');
  const [adminAuthPassword, setAdminAuthPassword] = useState('');
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [adminStats, setAdminStats] = useState({ users_count: 0, posts_count: 0, banned_count: 0 });
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([]);
  
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [editFullName, setEditFullName] = useState('');
  const [editBio, setEditBio] = useState('');
  const [editAvatarUrl, setEditAvatarUrl] = useState('');
  
  const [userProfile, setUserProfile] = useState<any>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      setShowAuthDialog(true);
    } else {
      setShowAuthDialog(false);
      loadFeed();
      loadChats();
      loadNotifications();
      loadUserProfile();
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (currentView === 'profile' && user) {
      loadUserPosts();
      loadUserProfile();
    }
  }, [currentView, user]);

  useEffect(() => {
    if (selectedChat && user) {
      loadMessages(selectedChat);
    }
  }, [selectedChat]);

  const loadUserProfile = async () => {
    if (!user) return;
    try {
      const data = await api.getUser(user.id);
      setUserProfile(data);
      updateUser(data);
    } catch (error) {
      console.error('Error loading profile:', error);
    }
  };

  const loadFeed = async () => {
    try {
      const data = await api.getFeed();
      setPosts(data.posts || []);
    } catch (error) {
      console.error('Error loading feed:', error);
    }
  };

  const loadUserPosts = async () => {
    if (!user) return;
    try {
      const data = await api.getUserPosts(user.id);
      setUserPosts(data.posts || []);
    } catch (error) {
      console.error('Error loading user posts:', error);
    }
  };

  const loadChats = async () => {
    if (!user) return;
    try {
      const data = await api.getChats(user.id);
      setChats(data.chats || []);
    } catch (error) {
      console.error('Error loading chats:', error);
    }
  };

  const loadNotifications = async () => {
    if (!user) return;
    try {
      const data = await api.getNotifications(user.id);
      setNotifications(data.notifications || []);
    } catch (error) {
      console.error('Error loading notifications:', error);
    }
  };

  const loadMessages = async (chatId: number) => {
    if (!user) return;
    try {
      const data = await api.getMessages(chatId, user.id);
      setMessages(data.messages || []);
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  const handleAuth = async () => {
    if (authMode === 'login') {
      const result = await login(authPhone, authPassword);
      if (result.success) {
        setShowAuthDialog(false);
        toast({ title: 'Добро пожаловать!', description: 'Вы успешно вошли в систему' });
      } else {
        toast({ title: 'Ошибка', description: result.error, variant: 'destructive' });
      }
    } else {
      const result = await register(authPhone, authPassword, authFullName);
      if (result.success) {
        setShowAuthDialog(false);
        toast({ title: 'Регистрация завершена', description: 'Добро пожаловать в Askar63!' });
      } else {
        toast({ title: 'Ошибка', description: result.error, variant: 'destructive' });
      }
    }
  };

  const handleAdminAuth = async () => {
    const result = await api.adminLogin(adminAuthPhone, adminAuthPassword);
    if (result.success && result.user.is_admin) {
      setIsAdminAuthenticated(true);
      setShowAdminAuth(false);
      setCurrentView('admin');
      loadAdminData();
      toast({ title: 'Доступ разрешён', description: 'Вы вошли в админ-панель' });
    } else {
      toast({ title: 'Доступ запрещён', description: 'Неверный логин или пароль администратора', variant: 'destructive' });
    }
  };

  const loadAdminData = async () => {
    try {
      const [stats, users] = await Promise.all([
        api.adminGetStats(),
        api.adminGetUsers()
      ]);
      setAdminStats(stats);
      setAdminUsers(users.users || []);
    } catch (error) {
      console.error('Error loading admin data:', error);
    }
  };

  const handleBanUser = async (userId: number) => {
    if (!user) return;
    try {
      await api.adminBanUser(user.id, userId);
      loadAdminData();
      toast({ title: 'Пользователь заблокирован' });
    } catch (error) {
      toast({ title: 'Ошибка', description: 'Не удалось заблокировать пользователя', variant: 'destructive' });
    }
  };

  const handleUnbanUser = async (userId: number) => {
    if (!user) return;
    try {
      await api.adminUnbanUser(user.id, userId);
      loadAdminData();
      toast({ title: 'Пользователь разблокирован' });
    } catch (error) {
      toast({ title: 'Ошибка', description: 'Не удалось разблокировать пользователя', variant: 'destructive' });
    }
  };

  const handleGrantAdmin = async (userId: number) => {
    if (!user) return;
    try {
      await api.adminGrantAdmin(user.id, userId);
      loadAdminData();
      toast({ title: 'Права администратора выданы' });
    } catch (error) {
      toast({ title: 'Ошибка', description: 'Не удалось выдать права', variant: 'destructive' });
    }
  };

  const handleCreatePost = async () => {
    if (!user || !newPostContent.trim()) return;
    try {
      await api.createPost(user.id, newPostContent);
      setNewPostContent('');
      loadFeed();
      toast({ title: 'Пост опубликован' });
    } catch (error) {
      toast({ title: 'Ошибка', description: 'Не удалось создать пост', variant: 'destructive' });
    }
  };

  const handleLikePost = async (postId: number) => {
    if (!user) return;
    try {
      await api.likePost(user.id, postId);
      loadFeed();
      if (currentView === 'profile') loadUserPosts();
    } catch (error) {
      console.error('Error liking post:', error);
    }
  };

  const handleSendMessage = async () => {
    if (!user || !selectedChat || !messageInput.trim()) return;
    try {
      await api.sendMessage(user.id, selectedChat, messageInput);
      setMessageInput('');
      loadMessages(selectedChat);
      loadChats();
    } catch (error) {
      toast({ title: 'Ошибка', description: 'Не удалось отправить сообщение', variant: 'destructive' });
    }
  };

  const handleUpdateProfile = async () => {
    if (!user) return;
    try {
      await api.updateProfile(user.id, {
        full_name: editFullName || undefined,
        bio: editBio || undefined,
        avatar_url: editAvatarUrl || undefined
      });
      setShowEditProfile(false);
      loadUserProfile();
      toast({ title: 'Профиль обновлён' });
    } catch (error) {
      toast({ title: 'Ошибка', description: 'Не удалось обновить профиль', variant: 'destructive' });
    }
  };

  const openEditProfile = () => {
    setEditFullName(user?.full_name || '');
    setEditBio(userProfile?.bio || '');
    setEditAvatarUrl(userProfile?.avatar_url || '');
    setShowEditProfile(true);
  };

  const renderSidebar = () => (
    <div className="w-64 bg-sidebar border-r border-sidebar-border h-screen fixed left-0 top-0 z-40 animate-slide-in">
      <div className="p-6">
        <h1 className="text-2xl font-bold gradient-text">Askar63</h1>
      </div>
      
      <nav className="space-y-2 px-4">
        <Button
          variant={currentView === 'home' ? 'default' : 'ghost'}
          className="w-full justify-start"
          onClick={() => { setCurrentView('home'); setSidebarOpen(false); }}
        >
          <Icon name="Home" className="mr-2" size={20} />
          Главная
        </Button>
        
        <Button
          variant={currentView === 'messages' ? 'default' : 'ghost'}
          className="w-full justify-start"
          onClick={() => { setCurrentView('messages'); setSidebarOpen(false); }}
        >
          <Icon name="MessageCircle" className="mr-2" size={20} />
          Сообщения
          {chats.reduce((acc, chat) => acc + chat.unread_count, 0) > 0 && (
            <Badge className="ml-auto animate-pulse-glow">
              {chats.reduce((acc, chat) => acc + chat.unread_count, 0)}
            </Badge>
          )}
        </Button>
        
        <Button
          variant={currentView === 'profile' ? 'default' : 'ghost'}
          className="w-full justify-start"
          onClick={() => { setCurrentView('profile'); setSidebarOpen(false); }}
        >
          <Icon name="User" className="mr-2" size={20} />
          Профиль
        </Button>
        
        <Button
          variant={currentView === 'notifications' ? 'default' : 'ghost'}
          className="w-full justify-start"
          onClick={() => { setCurrentView('notifications'); setSidebarOpen(false); }}
        >
          <Icon name="Bell" className="mr-2" size={20} />
          Уведомления
          {notifications.filter(n => !n.is_read).length > 0 && (
            <Badge className="ml-auto animate-pulse-glow">
              {notifications.filter(n => !n.is_read).length}
            </Badge>
          )}
        </Button>
        
        <Separator className="my-4" />
        
        <Button
          variant={currentView === 'admin' ? 'default' : 'ghost'}
          className="w-full justify-start"
          onClick={() => {
            if (!isAdminAuthenticated) {
              setShowAdminAuth(true);
            } else {
              setCurrentView('admin');
            }
            setSidebarOpen(false);
          }}
        >
          <Icon name="Shield" className="mr-2" size={20} />
          Админ-панель
        </Button>
        
        <Separator className="my-4" />
        
        <Button
          variant="ghost"
          className="w-full justify-start text-red-500"
          onClick={() => {
            logout();
            setIsAdminAuthenticated(false);
          }}
        >
          <Icon name="LogOut" className="mr-2" size={20} />
          Выход
        </Button>
      </nav>
    </div>
  );

  const renderHome = () => (
    <div className="max-w-2xl mx-auto p-6 space-y-6 animate-fade-in">
      <Card className="p-6 blur-card">
        <Textarea
          placeholder="Что нового?"
          value={newPostContent}
          onChange={(e) => setNewPostContent(e.target.value)}
          className="mb-4"
        />
        <Button onClick={handleCreatePost} className="gradient-primary w-full">
          Опубликовать
        </Button>
      </Card>
      
      {posts.map((post) => (
        <Card key={post.id} className="p-6 blur-card hover:scale-[1.02] transition-transform">
          <div className="flex items-start gap-4">
            <Avatar className="w-12 h-12">
              <AvatarImage src={post.author.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${post.author.username}`} />
              <AvatarFallback>{post.author.full_name[0]}</AvatarFallback>
            </Avatar>
            
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold">{post.author.full_name}</h3>
                <span className="text-sm text-muted-foreground">@{post.author.username}</span>
              </div>
              <p className="text-sm text-muted-foreground">
                {new Date(post.created_at).toLocaleString('ru-RU')}
              </p>
              
              <p className="mt-3 text-foreground">{post.content}</p>
              
              <div className="flex items-center gap-6 mt-4">
                <Button variant="ghost" size="sm" className="gap-2" onClick={() => handleLikePost(post.id)}>
                  <Icon name="Heart" size={18} />
                  {post.likes}
                </Button>
                <Button variant="ghost" size="sm" className="gap-2">
                  <Icon name="MessageCircle" size={18} />
                  {post.comments}
                </Button>
              </div>
            </div>
          </div>
        </Card>
      ))}
      
      {posts.length === 0 && (
        <div className="text-center text-muted-foreground py-12">
          <Icon name="FileText" size={48} className="mx-auto mb-4 opacity-50" />
          <p>Пока нет постов. Будьте первым!</p>
        </div>
      )}
    </div>
  );

  const renderMessages = () => (
    <div className="flex h-[calc(100vh-80px)] animate-fade-in">
      <div className="w-80 border-r border-border">
        <div className="p-4">
          <Input placeholder="Поиск чатов..." className="w-full" />
        </div>
        
        <ScrollArea className="h-[calc(100%-80px)]">
          {chats.map((chat) => (
            <div
              key={chat.id}
              onClick={() => setSelectedChat(chat.id)}
              className={`p-4 cursor-pointer hover:bg-accent transition-colors ${
                selectedChat === chat.id ? 'bg-accent' : ''
              }`}
            >
              <div className="flex items-center gap-3">
                <Avatar>
                  <AvatarImage src={chat.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${chat.username}`} />
                  <AvatarFallback>{chat.name[0]}</AvatarFallback>
                </Avatar>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold truncate">{chat.name}</h4>
                    <span className="text-xs text-muted-foreground">
                      {new Date(chat.last_message_time).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground truncate">{chat.last_message}</p>
                </div>
                
                {chat.unread_count > 0 && (
                  <Badge className="animate-pulse-glow">{chat.unread_count}</Badge>
                )}
              </div>
            </div>
          ))}
        </ScrollArea>
      </div>
      
      <div className="flex-1 flex flex-col">
        {selectedChat ? (
          <>
            <div className="p-4 border-b border-border flex items-center gap-3">
              <Avatar>
                <AvatarImage src={chats.find(c => c.id === selectedChat)?.avatar || ''} />
                <AvatarFallback>{chats.find(c => c.id === selectedChat)?.name[0]}</AvatarFallback>
              </Avatar>
              <div>
                <h3 className="font-semibold">{chats.find(c => c.id === selectedChat)?.name}</h3>
                <p className="text-sm text-muted-foreground">
                  @{chats.find(c => c.id === selectedChat)?.username}
                </p>
              </div>
            </div>
            
            <ScrollArea className="flex-1 p-6">
              <div className="space-y-4">
                {messages.map((msg) => (
                  <div key={msg.id} className={`flex ${msg.sender_id === user?.id ? 'justify-end' : 'justify-start'}`}>
                    <div className={`${msg.sender_id === user?.id ? 'gradient-primary' : 'bg-muted'} rounded-2xl ${msg.sender_id === user?.id ? 'rounded-tr-sm' : 'rounded-tl-sm'} px-4 py-2 max-w-xs animate-scale-in`}>
                      <p className={msg.sender_id === user?.id ? 'text-white' : ''}>{msg.content}</p>
                      <p className={`text-xs mt-1 ${msg.sender_id === user?.id ? 'text-white/70' : 'text-muted-foreground'}`}>
                        {new Date(msg.created_at).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
            
            <div className="p-4 border-t border-border">
              <div className="flex gap-2">
                <Input
                  placeholder="Напишите сообщение..."
                  className="flex-1"
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                />
                <Button className="gradient-primary" onClick={handleSendMessage}>
                  <Icon name="Send" size={20} />
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-muted-foreground">
            <div className="text-center">
              <Icon name="MessageCircle" size={64} className="mx-auto mb-4 opacity-50" />
              <p>Выберите чат, чтобы начать общение</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  const renderProfile = () => (
    <div className="max-w-4xl mx-auto p-6 animate-fade-in">
      <Card className="p-6 blur-card mb-6">
        <div className="flex items-start gap-6">
          <Avatar className="w-24 h-24">
            <AvatarImage src={userProfile?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.username}`} />
            <AvatarFallback>{user?.full_name[0]}</AvatarFallback>
          </Avatar>
          
          <div className="flex-1">
            <h2 className="text-2xl font-bold">{user?.full_name}</h2>
            <p className="text-muted-foreground">@{user?.username}</p>
            <p className="mt-4">{userProfile?.bio || 'Нет описания'}</p>
            
            <div className="flex gap-4 mt-4">
              <div>
                <span className="font-bold">{userProfile?.followers_count || 0}</span>
                <span className="text-muted-foreground ml-1">подписчиков</span>
              </div>
              <div>
                <span className="font-bold">{userProfile?.following_count || 0}</span>
                <span className="text-muted-foreground ml-1">подписок</span>
              </div>
            </div>
            
            <Button className="mt-4 gradient-primary" onClick={openEditProfile}>
              Редактировать профиль
            </Button>
          </div>
        </div>
      </Card>
      
      <h3 className="text-xl font-bold mb-4">Мои посты</h3>
      <div className="space-y-6">
        {userPosts.map((post) => (
          <Card key={post.id} className="p-6 blur-card hover:scale-[1.02] transition-transform">
            <p className="text-foreground mb-4">{post.content}</p>
            <p className="text-sm text-muted-foreground mb-4">
              {new Date(post.created_at).toLocaleString('ru-RU')}
            </p>
            <div className="flex items-center gap-6">
              <Button variant="ghost" size="sm" className="gap-2" onClick={() => handleLikePost(post.id)}>
                <Icon name="Heart" size={18} />
                {post.likes}
              </Button>
              <Button variant="ghost" size="sm" className="gap-2">
                <Icon name="MessageCircle" size={18} />
                {post.comments}
              </Button>
            </div>
          </Card>
        ))}
        
        {userPosts.length === 0 && (
          <div className="text-center text-muted-foreground py-12">
            <Icon name="FileText" size={48} className="mx-auto mb-4 opacity-50" />
            <p>У вас пока нет постов</p>
          </div>
        )}
      </div>
    </div>
  );

  const renderNotifications = () => (
    <div className="max-w-2xl mx-auto p-6 animate-fade-in">
      <h2 className="text-2xl font-bold mb-6">Уведомления</h2>
      
      <div className="space-y-4">
        {notifications.map((notif) => (
          <Card
            key={notif.id}
            className={`p-4 blur-card hover:bg-accent transition-colors cursor-pointer ${!notif.is_read ? 'border-primary' : ''}`}
            onClick={() => api.markNotificationRead(notif.id)}
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full gradient-primary flex items-center justify-center">
                <Icon
                  name={notif.type === 'like' ? 'Heart' : notif.type === 'comment' ? 'MessageCircle' : 'Mail'}
                  size={20}
                  className="text-white"
                />
              </div>
              
              <div className="flex-1">
                <p>
                  <span className="font-semibold">{notif.related_user?.full_name || 'Пользователь'}</span>{' '}
                  {notif.content}
                </p>
                <p className="text-sm text-muted-foreground">
                  {new Date(notif.created_at).toLocaleString('ru-RU')}
                </p>
              </div>
            </div>
          </Card>
        ))}
        
        {notifications.length === 0 && (
          <div className="text-center text-muted-foreground py-12">
            <Icon name="Bell" size={48} className="mx-auto mb-4 opacity-50" />
            <p>У вас пока нет уведомлений</p>
          </div>
        )}
      </div>
    </div>
  );

  const renderAdmin = () => (
    <div className="max-w-6xl mx-auto p-6 animate-fade-in">
      <h2 className="text-2xl font-bold mb-6">Админ-панель</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <Card className="p-6 blur-card">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full gradient-primary flex items-center justify-center">
              <Icon name="Users" size={24} className="text-white" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Всего пользователей</p>
              <p className="text-2xl font-bold">{adminStats.users_count}</p>
            </div>
          </div>
        </Card>
        
        <Card className="p-6 blur-card">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full gradient-primary flex items-center justify-center">
              <Icon name="FileText" size={24} className="text-white" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Всего постов</p>
              <p className="text-2xl font-bold">{adminStats.posts_count}</p>
            </div>
          </div>
        </Card>
        
        <Card className="p-6 blur-card">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full gradient-primary flex items-center justify-center">
              <Icon name="AlertCircle" size={24} className="text-white" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Заблокировано</p>
              <p className="text-2xl font-bold">{adminStats.banned_count}</p>
            </div>
          </div>
        </Card>
      </div>
      
      <Card className="p-6 blur-card">
        <h3 className="text-xl font-bold mb-4">Управление пользователями</h3>
        
        <div className="space-y-4">
          {adminUsers.map((adminUser) => (
            <div key={adminUser.id} className="flex items-center justify-between p-4 rounded-lg bg-muted">
              <div className="flex items-center gap-4">
                <Avatar>
                  <AvatarImage src={adminUser.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${adminUser.username}`} />
                  <AvatarFallback>{adminUser.full_name[0]}</AvatarFallback>
                </Avatar>
                <div>
                  <h4 className="font-semibold">{adminUser.full_name}</h4>
                  <p className="text-sm text-muted-foreground">@{adminUser.username}</p>
                  {adminUser.is_banned && (
                    <Badge variant="destructive" className="mt-1">Заблокирован</Badge>
                  )}
                  {adminUser.is_admin && (
                    <Badge variant="secondary" className="mt-1 ml-1">Админ</Badge>
                  )}
                </div>
              </div>
              
              <div className="flex gap-2">
                {adminUser.is_banned ? (
                  <Button variant="outline" size="sm" onClick={() => handleUnbanUser(adminUser.id)}>
                    <Icon name="CheckCircle" size={16} className="mr-1" />
                    Разбанить
                  </Button>
                ) : (
                  <Button variant="destructive" size="sm" onClick={() => handleBanUser(adminUser.id)}>
                    <Icon name="Ban" size={16} className="mr-1" />
                    Забанить
                  </Button>
                )}
                {!adminUser.is_admin && (
                  <Button variant="secondary" size="sm" onClick={() => handleGrantAdmin(adminUser.id)}>
                    <Icon name="Shield" size={16} className="mr-1" />
                    Выдать админку
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );

  if (!isAuthenticated) {
    return (
      <Dialog open={showAuthDialog} onOpenChange={setShowAuthDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center gradient-text text-2xl">
              {authMode === 'login' ? 'Вход в Askar63' : 'Регистрация в Askar63'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {authMode === 'register' && (
              <div>
                <Label htmlFor="fullname">Полное имя</Label>
                <Input
                  id="fullname"
                  placeholder="Иван Иванов"
                  value={authFullName}
                  onChange={(e) => setAuthFullName(e.target.value)}
                />
              </div>
            )}
            <div>
              <Label htmlFor="phone">Номер телефона</Label>
              <Input
                id="phone"
                placeholder="+7 900 000 00 00"
                value={authPhone}
                onChange={(e) => setAuthPhone(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="password">Пароль</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={authPassword}
                onChange={(e) => setAuthPassword(e.target.value)}
              />
            </div>
            <Button className="w-full gradient-primary" onClick={handleAuth}>
              {authMode === 'login' ? 'Войти' : 'Зарегистрироваться'}
            </Button>
            <Button
              variant="ghost"
              className="w-full"
              onClick={() => setAuthMode(authMode === 'login' ? 'register' : 'login')}
            >
              {authMode === 'login' ? 'Нет аккаунта? Зарегистрируйтесь' : 'Уже есть аккаунт? Войти'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      
      <div className={`${sidebarOpen ? 'block' : 'hidden'} md:block`}>
        {renderSidebar()}
      </div>
      
      <div className="md:ml-64">
        <header className="h-16 border-b border-border flex items-center justify-between px-6 sticky top-0 bg-background/80 backdrop-blur-lg z-20">
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            <Icon name="Menu" size={24} />
          </Button>
          
          <div className="flex-1 max-w-md mx-4">
            <Input placeholder="Поиск..." className="w-full" />
          </div>
          
          <Avatar className="cursor-pointer">
            <AvatarImage src={user?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.username}`} />
            <AvatarFallback>{user?.full_name[0]}</AvatarFallback>
          </Avatar>
        </header>
        
        <main className="min-h-[calc(100vh-64px)]">
          {currentView === 'home' && renderHome()}
          {currentView === 'messages' && renderMessages()}
          {currentView === 'profile' && renderProfile()}
          {currentView === 'notifications' && renderNotifications()}
          {currentView === 'admin' && renderAdmin()}
        </main>
      </div>
      
      <Dialog open={showAdminAuth} onOpenChange={setShowAdminAuth}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center">Вход в админ-панель</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="admin-phone">Логин (телефон)</Label>
              <Input
                id="admin-phone"
                placeholder="admin"
                value={adminAuthPhone}
                onChange={(e) => setAdminAuthPhone(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="admin-password">Пароль</Label>
              <Input
                id="admin-password"
                type="password"
                placeholder="admin"
                value={adminAuthPassword}
                onChange={(e) => setAdminAuthPassword(e.target.value)}
              />
            </div>
            <Button className="w-full gradient-primary" onClick={handleAdminAuth}>
              Войти
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      
      <Dialog open={showEditProfile} onOpenChange={setShowEditProfile}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Редактировать профиль</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-fullname">Полное имя</Label>
              <Input
                id="edit-fullname"
                value={editFullName}
                onChange={(e) => setEditFullName(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="edit-bio">Описание</Label>
              <Textarea
                id="edit-bio"
                value={editBio}
                onChange={(e) => setEditBio(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="edit-avatar">URL аватара</Label>
              <Input
                id="edit-avatar"
                value={editAvatarUrl}
                onChange={(e) => setEditAvatarUrl(e.target.value)}
                placeholder="https://..."
              />
            </div>
            <Button className="w-full gradient-primary" onClick={handleUpdateProfile}>
              Сохранить
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Index;
