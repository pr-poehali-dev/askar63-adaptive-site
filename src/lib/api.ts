const API_URLS = {
  auth: 'https://functions.poehali.dev/4abe9838-bb82-4574-865e-7095e9f444f6',
  posts: 'https://functions.poehali.dev/c76c489e-f6b9-4177-8b8c-1e7292c2ec3d',
  messages: 'https://functions.poehali.dev/8cc20955-2c5b-4009-953c-da4e712288f1',
  admin: 'https://functions.poehali.dev/c4451148-4e87-4201-a0f5-4e28d8a2bd95',
  notifications: 'https://functions.poehali.dev/7480a3ac-6265-4404-ab86-d0b2b1ec9979',
};

export const api = {
  async register(phone: string, password: string, full_name: string) {
    const response = await fetch(API_URLS.auth, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'register', phone, password, full_name }),
    });
    return response.json();
  },

  async login(phone: string, password: string) {
    const response = await fetch(API_URLS.auth, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'login', phone, password }),
    });
    return response.json();
  },

  async getUser(user_id: number) {
    const response = await fetch(`${API_URLS.auth}?user_id=${user_id}`);
    return response.json();
  },

  async updateProfile(user_id: number, data: { full_name?: string; bio?: string; avatar_url?: string }) {
    const response = await fetch(API_URLS.auth, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id, ...data }),
    });
    return response.json();
  },

  async getFeed() {
    const response = await fetch(`${API_URLS.posts}?action=feed`);
    return response.json();
  },

  async getUserPosts(user_id: number) {
    const response = await fetch(`${API_URLS.posts}?action=user_posts&user_id=${user_id}`);
    return response.json();
  },

  async createPost(user_id: number, content: string) {
    const response = await fetch(API_URLS.posts, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.dumps({ action: 'create', user_id, content }),
    });
    return response.json();
  },

  async likePost(user_id: number, post_id: number) {
    const response = await fetch(API_URLS.posts, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.dumps({ action: 'like', user_id, post_id }),
    });
    return response.json();
  },

  async commentPost(user_id: number, post_id: number, content: string) {
    const response = await fetch(API_URLS.posts, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.dumps({ action: 'comment', user_id, post_id, content }),
    });
    return response.json();
  },

  async getChats(user_id: number) {
    const response = await fetch(`${API_URLS.messages}?action=chats&user_id=${user_id}`);
    return response.json();
  },

  async getMessages(chat_id: number, user_id: number) {
    const response = await fetch(`${API_URLS.messages}?action=messages&chat_id=${chat_id}&user_id=${user_id}`);
    return response.json();
  },

  async sendMessage(user_id: number, chat_id: number, content: string) {
    const response = await fetch(API_URLS.messages, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.dumps({ action: 'send', user_id, chat_id, content }),
    });
    return response.json();
  },

  async getNotifications(user_id: number) {
    const response = await fetch(`${API_URLS.notifications}?user_id=${user_id}`);
    return response.json();
  },

  async markNotificationRead(notification_id: number) {
    const response = await fetch(API_URLS.notifications, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.dumps({ action: 'mark_read', notification_id }),
    });
    return response.json();
  },

  async adminLogin(phone: string, password: string) {
    const result = await this.login(phone, password);
    if (result.success && result.user.is_admin) {
      return result;
    }
    return { success: false, error: 'Доступ запрещён. Требуются права администратора.' };
  },

  async adminGetStats() {
    const response = await fetch(`${API_URLS.admin}?action=stats`);
    return response.json();
  },

  async adminGetUsers() {
    const response = await fetch(`${API_URLS.admin}?action=users`);
    return response.json();
  },

  async adminBanUser(admin_id: number, user_id: number) {
    const response = await fetch(API_URLS.admin, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.dumps({ action: 'ban', admin_id, user_id }),
    });
    return response.json();
  },

  async adminUnbanUser(admin_id: number, user_id: number) {
    const response = await fetch(API_URLS.admin, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.dumps({ action: 'unban', admin_id, user_id }),
    });
    return response.json();
  },

  async adminUpdateUser(admin_id: number, user_id: number, full_name?: string, username?: string) {
    const response = await fetch(API_URLS.admin, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.dumps({ action: 'update_user', admin_id, user_id, full_name, username }),
    });
    return response.json();
  },

  async adminGrantAdmin(admin_id: number, user_id: number) {
    const response = await fetch(API_URLS.admin, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.dumps({ action: 'grant_admin', admin_id, user_id }),
    });
    return response.json();
  },
};
