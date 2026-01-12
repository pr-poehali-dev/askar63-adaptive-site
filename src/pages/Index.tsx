import { useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import Icon from "@/components/ui/icon";

type View = 'home' | 'messages' | 'profile' | 'notifications' | 'admin';

interface Post {
  id: number;
  author: string;
  username: string;
  avatar: string;
  content: string;
  likes: number;
  comments: number;
  time: string;
}

interface Chat {
  id: number;
  name: string;
  username: string;
  avatar: string;
  lastMessage: string;
  time: string;
  unread: number;
}

interface Notification {
  id: number;
  type: 'like' | 'comment' | 'message';
  user: string;
  content: string;
  time: string;
}

const Index = () => {
  const [currentView, setCurrentView] = useState<View>('home');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedChat, setSelectedChat] = useState<number | null>(null);

  const mockPosts: Post[] = [
    {
      id: 1,
      author: "Алия Смирнова",
      username: "@aliya_smirnova",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Aliya",
      content: "Сегодня прекрасный день для новых начинаний! ✨",
      likes: 234,
      comments: 45,
      time: "2 часа назад"
    },
    {
      id: 2,
      author: "Марат Ибрагимов",
      username: "@marat_ibragimov",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Marat",
      content: "Запустил новый проект! Кто хочет присоединиться? 🚀",
      likes: 567,
      comments: 89,
      time: "5 часов назад"
    },
    {
      id: 3,
      author: "Камила Нуриева",
      username: "@kamila_nurieva",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Kamila",
      content: "Делюсь своими впечатлениями от путешествия! 🌍",
      likes: 892,
      comments: 156,
      time: "1 день назад"
    }
  ];

  const mockChats: Chat[] = [
    {
      id: 1,
      name: "Алия Смирнова",
      username: "@aliya_smirnova",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Aliya",
      lastMessage: "Привет! Как дела?",
      time: "2 мин",
      unread: 3
    },
    {
      id: 2,
      name: "Марат Ибрагимов",
      username: "@marat_ibragimov",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Marat",
      lastMessage: "Отлично, созвонимся завтра",
      time: "15 мин",
      unread: 0
    },
    {
      id: 3,
      name: "Камила Нуриева",
      username: "@kamila_nurieva",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Kamila",
      lastMessage: "Спасибо за помощь! 💜",
      time: "1 час",
      unread: 1
    }
  ];

  const mockNotifications: Notification[] = [
    {
      id: 1,
      type: 'like',
      user: 'Алия Смирнова',
      content: 'лайкнул(а) ваш пост',
      time: '5 мин назад'
    },
    {
      id: 2,
      type: 'comment',
      user: 'Марат Ибрагимов',
      content: 'прокомментировал ваш пост',
      time: '1 час назад'
    },
    {
      id: 3,
      type: 'message',
      user: 'Камила Нуриева',
      content: 'отправил(а) вам сообщение',
      time: '3 часа назад'
    }
  ];

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
          {mockChats.reduce((acc, chat) => acc + chat.unread, 0) > 0 && (
            <Badge className="ml-auto animate-pulse-glow">
              {mockChats.reduce((acc, chat) => acc + chat.unread, 0)}
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
          {mockNotifications.length > 0 && (
            <Badge className="ml-auto animate-pulse-glow">{mockNotifications.length}</Badge>
          )}
        </Button>
        
        <Separator className="my-4" />
        
        <Button
          variant={currentView === 'admin' ? 'default' : 'ghost'}
          className="w-full justify-start"
          onClick={() => { setCurrentView('admin'); setSidebarOpen(false); }}
        >
          <Icon name="Shield" className="mr-2" size={20} />
          Админ-панель
        </Button>
      </nav>
    </div>
  );

  const renderHome = () => (
    <div className="max-w-2xl mx-auto p-6 space-y-6 animate-fade-in">
      {mockPosts.map((post) => (
        <Card key={post.id} className="p-6 blur-card hover:scale-[1.02] transition-transform">
          <div className="flex items-start gap-4">
            <Avatar className="w-12 h-12">
              <AvatarImage src={post.avatar} />
              <AvatarFallback>{post.author[0]}</AvatarFallback>
            </Avatar>
            
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold">{post.author}</h3>
                <span className="text-sm text-muted-foreground">{post.username}</span>
              </div>
              <p className="text-sm text-muted-foreground">{post.time}</p>
              
              <p className="mt-3 text-foreground">{post.content}</p>
              
              <div className="flex items-center gap-6 mt-4">
                <Button variant="ghost" size="sm" className="gap-2">
                  <Icon name="Heart" size={18} />
                  {post.likes}
                </Button>
                <Button variant="ghost" size="sm" className="gap-2">
                  <Icon name="MessageCircle" size={18} />
                  {post.comments}
                </Button>
                <Button variant="ghost" size="sm" className="gap-2">
                  <Icon name="Share2" size={18} />
                </Button>
              </div>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );

  const renderMessages = () => (
    <div className="flex h-[calc(100vh-80px)] animate-fade-in">
      <div className="w-80 border-r border-border">
        <div className="p-4">
          <Input placeholder="Поиск чатов..." className="w-full" />
        </div>
        
        <ScrollArea className="h-[calc(100%-80px)]">
          {mockChats.map((chat) => (
            <div
              key={chat.id}
              onClick={() => setSelectedChat(chat.id)}
              className={`p-4 cursor-pointer hover:bg-accent transition-colors ${
                selectedChat === chat.id ? 'bg-accent' : ''
              }`}
            >
              <div className="flex items-center gap-3">
                <Avatar>
                  <AvatarImage src={chat.avatar} />
                  <AvatarFallback>{chat.name[0]}</AvatarFallback>
                </Avatar>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold truncate">{chat.name}</h4>
                    <span className="text-xs text-muted-foreground">{chat.time}</span>
                  </div>
                  <p className="text-sm text-muted-foreground truncate">{chat.lastMessage}</p>
                </div>
                
                {chat.unread > 0 && (
                  <Badge className="animate-pulse-glow">{chat.unread}</Badge>
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
                <AvatarImage src={mockChats.find(c => c.id === selectedChat)?.avatar} />
                <AvatarFallback>{mockChats.find(c => c.id === selectedChat)?.name[0]}</AvatarFallback>
              </Avatar>
              <div>
                <h3 className="font-semibold">{mockChats.find(c => c.id === selectedChat)?.name}</h3>
                <p className="text-sm text-muted-foreground">
                  {mockChats.find(c => c.id === selectedChat)?.username}
                </p>
              </div>
            </div>
            
            <ScrollArea className="flex-1 p-6">
              <div className="space-y-4">
                <div className="flex justify-start">
                  <div className="bg-muted rounded-2xl rounded-tl-sm px-4 py-2 max-w-xs animate-scale-in">
                    <p>Привет! Как дела?</p>
                  </div>
                </div>
                
                <div className="flex justify-end">
                  <div className="gradient-primary rounded-2xl rounded-tr-sm px-4 py-2 max-w-xs animate-scale-in">
                    <p className="text-white">Отлично! А у тебя как?</p>
                  </div>
                </div>
              </div>
            </ScrollArea>
            
            <div className="p-4 border-t border-border">
              <div className="flex gap-2">
                <Input placeholder="Напишите сообщение..." className="flex-1" />
                <Button className="gradient-primary">
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
            <AvatarImage src="https://api.dicebear.com/7.x/avataaars/svg?seed=User" />
            <AvatarFallback>АС</AvatarFallback>
          </Avatar>
          
          <div className="flex-1">
            <h2 className="text-2xl font-bold">Аскар Сулейманов</h2>
            <p className="text-muted-foreground">@askar_suleymanov</p>
            <p className="mt-4">Разработчик | Энтузиаст технологий | Создатель Askar63</p>
            
            <div className="flex gap-4 mt-4">
              <div>
                <span className="font-bold">256</span>
                <span className="text-muted-foreground ml-1">подписчиков</span>
              </div>
              <div>
                <span className="font-bold">124</span>
                <span className="text-muted-foreground ml-1">подписок</span>
              </div>
            </div>
            
            <Button className="mt-4 gradient-primary">Редактировать профиль</Button>
          </div>
        </div>
      </Card>
      
      <h3 className="text-xl font-bold mb-4">Мои посты</h3>
      <div className="space-y-6">
        {mockPosts.slice(0, 2).map((post) => (
          <Card key={post.id} className="p-6 blur-card hover:scale-[1.02] transition-transform">
            <p className="text-foreground mb-4">{post.content}</p>
            <div className="flex items-center gap-6">
              <Button variant="ghost" size="sm" className="gap-2">
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
      </div>
    </div>
  );

  const renderNotifications = () => (
    <div className="max-w-2xl mx-auto p-6 animate-fade-in">
      <h2 className="text-2xl font-bold mb-6">Уведомления</h2>
      
      <div className="space-y-4">
        {mockNotifications.map((notif) => (
          <Card key={notif.id} className="p-4 blur-card hover:bg-accent transition-colors cursor-pointer">
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
                  <span className="font-semibold">{notif.user}</span>{' '}
                  {notif.content}
                </p>
                <p className="text-sm text-muted-foreground">{notif.time}</p>
              </div>
            </div>
          </Card>
        ))}
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
              <p className="text-2xl font-bold">1,234</p>
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
              <p className="text-2xl font-bold">5,678</p>
            </div>
          </div>
        </Card>
        
        <Card className="p-6 blur-card">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full gradient-primary flex items-center justify-center">
              <Icon name="AlertCircle" size={24} className="text-white" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Жалобы</p>
              <p className="text-2xl font-bold">12</p>
            </div>
          </div>
        </Card>
      </div>
      
      <Card className="p-6 blur-card">
        <h3 className="text-xl font-bold mb-4">Управление пользователями</h3>
        
        <div className="space-y-4">
          {mockChats.map((user) => (
            <div key={user.id} className="flex items-center justify-between p-4 rounded-lg bg-muted">
              <div className="flex items-center gap-4">
                <Avatar>
                  <AvatarImage src={user.avatar} />
                  <AvatarFallback>{user.name[0]}</AvatarFallback>
                </Avatar>
                <div>
                  <h4 className="font-semibold">{user.name}</h4>
                  <p className="text-sm text-muted-foreground">{user.username}</p>
                </div>
              </div>
              
              <div className="flex gap-2">
                <Button variant="outline" size="sm">
                  <Icon name="Edit" size={16} className="mr-1" />
                  Изменить
                </Button>
                <Button variant="destructive" size="sm">
                  <Icon name="Ban" size={16} className="mr-1" />
                  Забанить
                </Button>
                <Button variant="secondary" size="sm">
                  <Icon name="Shield" size={16} className="mr-1" />
                  Админ
                </Button>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );

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
            <AvatarImage src="https://api.dicebear.com/7.x/avataaars/svg?seed=User" />
            <AvatarFallback>АС</AvatarFallback>
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
    </div>
  );
};

export default Index;
