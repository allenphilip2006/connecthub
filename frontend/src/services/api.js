import axios from 'axios';
import { API_URL } from '../lib/config';

const api = axios.create({
    baseURL: API_URL,
});

// Request interceptor for API calls
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor for API calls
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        if (error.response?.status === 401) {
            localStorage.removeItem('token');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

export const authService = {
    login: async (email, password, code = null) => {
        const response = await api.post('/users/login', { email, password, code });
        if (response.data.token) {
            localStorage.setItem('token', response.data.token);
            localStorage.setItem('userEmail', response.data.email);
        }
        return response.data;
    },
    register: async (username, email, password) => {
        const response = await api.post('/users/register', { username, email, password });
        return response.data;
    },
    logout: () => {
        localStorage.removeItem('token');
        localStorage.removeItem('userEmail');
        window.location.href = '/login';
    },
    forgotPassword: async (email) => {
        const response = await api.post('/users/forgot-password', { email });
        return response.data;
    },
    resetPassword: async (email, newPassword) => {
        const response = await api.post('/users/reset-password', { email, newPassword });
        return response.data;
    },
    recover2FA: async (email) => {
        const response = await api.post('/users/recover-2fa', { email });
        return response.data;
    }
};

export const postService = {
    getFeed: async (page = 0, size = 10) => {
        const response = await api.get('/feed', { params: { page, size } });
        return response.data;
    },
    getPersonalPosts: async (page = 0, size = 10) => {
        const response = await api.get('/posts/me', { params: { page, size } });
        return response.data;
    },
    getUserPosts: async (userId, page = 0, size = 10) => {
        const response = await api.get(`/posts/user/${userId}`, { params: { page, size } });
        return response.data;
    },
    getPostById: async (postId) => {
        try {
            const response = await api.get(`/posts/${postId}`);
            return response.data;
        } catch (error) {
            if (error.response?.status === 404) return null;
            throw error;
        }
    },
    createPost: async (formData) => {
        const response = await api.post('/posts', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            }
        });
        return response.data;
    },
    toggleLike: async (postId) => {
        const response = await api.post(`/posts/${postId}/like`);
        return response.data;
    },
    deletePost: async (postId) => {
        const response = await api.delete(`/posts/${postId}`);
        return response.data;
    },
    updatePost: async (postId, content) => {
        const response = await api.put(`/posts/${postId}`, { content });
        return response.data;
    },
    updatePostSettings: async (postId, payload) => {
        const response = await api.put(`/posts/${postId}/settings`, payload);
        return response.data;
    },
    archivePost: async (postId) => {
        const response = await api.post(`/posts/${postId}/archive`);
        return response.data;
    },
    repost: async (postId, caption = null) => {
        const response = await api.post(`/posts/${postId}/repost`, { caption });
        return response.data;
    },
    savePost: async (postId) => {
        const response = await api.post(`/posts/${postId}/save`);
        return response.data;
    },
    unsavePost: async (postId) => {
        const response = await api.delete(`/posts/${postId}/save`);
        return response.data;
    },
    getSaved: async () => {
        const response = await api.get('/posts/saved');
        return response.data;
    },
    getComments: async (postId) => {
        const response = await api.get(`/posts/${postId}/comments`);
        return response.data;
    },
    addComment: async (postId, text) => {
        const response = await api.post(`/posts/${postId}/comment`, { text });
        return response.data;
    },
    deleteComment: async (commentId) => {
        const response = await api.delete(`/posts/comments/${commentId}`);
        return response.data;
    },
    replyToComment: async (postId, parentCommentId, text) => {
        const response = await api.post(`/posts/${postId}/comments/${parentCommentId}/reply`, { text });
        return response.data;
    },
    likeComment: async (commentId) => {
        const response = await api.post(`/posts/comments/${commentId}/like`);
        return response.data;
    },
    unlikeComment: async (commentId) => {
        const response = await api.post(`/posts/comments/${commentId}/unlike`);
        return response.data;
    }
};

export const storyService = {
    create: async (formData) => {
        const response = await api.post('/stories', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        return response.data;
    },
    myStories: async () => {
        const response = await api.get('/stories/me');
        return response.data;
    },
    feed: async (page = 0, size = 20) => {
        const response = await api.get('/stories/feed', { params: { page, size } });
        return response.data;
    },
    getById: async (id) => {
        const response = await api.get(`/stories/${id}`);
        return response.data;
    },
    update: async (id, payload) => {
        const response = await api.put(`/stories/${id}`, payload);
        return response.data;
    },
    delete: async (id) => {
        const response = await api.delete(`/stories/${id}`);
        return response.data;
    },
    recordView: async (id) => {
        const response = await api.post(`/stories/${id}/view`);
        return response.data;
    },
    recordSlideView: async (id, slideId) => {
        const response = await api.post(`/stories/${id}/slide-view`, null, { params: { slideId } });
        return response.data;
    },
    likeStory: async (id) => {
        const response = await api.post(`/stories/${id}/like`);
        return response.data;
    },
    unlikeStory: async (id) => {
        const response = await api.post(`/stories/${id}/unlike`);
        return response.data;
    },
    addComment: async (id, content) => {
        const response = await api.post(`/stories/${id}/comment`, { content });
        return response.data;
    },
    deleteComment: async (commentId) => {
        const response = await api.delete(`/stories/comment/${commentId}`);
        return response.data;
    }
};

export const userService = {
    getProfile: async () => {
        const response = await api.get('/users/profile');
        return response.data;
    },
    getUserProfile: async (id) => {
        const response = await api.get(`/users/${id}`);
        return response.data;
    },
    searchUsers: async (query) => {
        const response = await api.get('/users/search', { params: { query } });
        return response.data;
    },
    getRecentSearches: async () => {
        const response = await api.get('/users/search/recent');
        return response.data;
    },
    logSearchHistory: async (id) => {
        const response = await api.post(`/users/search/history/${id}`);
        return response.data;
    },
    deleteRecentSearch: async (id) => {
        const response = await api.delete(`/users/search/history/${id}`);
        return response.data;
    },
    clearRecentSearches: async () => {
        const response = await api.delete('/users/search/history');
        return response.data;
    },
    getAllUsers: async () => {
        const response = await api.get('/users');
        return response.data;
    },
    getAvatar: async (email) => {
        const response = await api.get('/users/avatar', { params: { email } });
        return response.data;
    },
    updateProfile: async (formData) => {
        const response = await api.put('/users/profile', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            }
        });
        return response.data;
    },
    updatePrivacy: async (isPrivate) => {
        const response = await api.put('/users/privacy', { isPrivate });
        return response.data;
    },
    updateNotifications: async (enabled) => {
        const response = await api.put('/users/settings/notifications', { enabled });
        return response.data;
    },
    updateFcmToken: async (token) => {
        const response = await api.put('/users/settings/fcm-token', { token });
        return response.data;
    },
    updateTheme: async (theme) => {
        const response = await api.put('/users/settings/theme', { theme });
        return response.data;
    },
    updateLanguage: async (language) => {
        const response = await api.put('/users/settings/language', { language });
        return response.data;
    },
    updateTwoFactor: async (enabled) => {
        const response = await api.put('/users/settings/2fa', { enabled });
        return response.data;
    },
    deleteAccount: async () => {
        const response = await api.delete('/users/delete');
        return response.data;
    },
    followUser: async (id) => {
        const response = await api.post(`/users/follow/${id}`);
        return response.data;
    },
    unfollowUser: async (id) => {
        const response = await api.post(`/users/unfollow/${id}`);
        return response.data;
    },
    getFollowing: async () => {
        const response = await api.get('/users/following');
        return response.data;
    },
    getFollowers: async () => {
        const response = await api.get('/users/followers');
        return response.data;
    },
    getPendingRequests: async () => {
        const response = await api.get('/users/requests/pending');
        return response.data;
    },
    acceptFollowRequest: async (followerId) => {
        const response = await api.post(`/users/requests/accept/${followerId}`);
        return response.data;
    },
    rejectFollowRequest: async (followerId) => {
        const response = await api.post(`/users/requests/reject/${followerId}`);
        return response.data;
    },
    getChatHistory: async (friendEmail) => {
        const response = await api.get(`/chat/history/${friendEmail}`);
        return response.data;
    }
};

export const searchService = {
    searchHashtags: async (q) => {
        const response = await api.get('/search/hashtags', { params: { q } });
        return response.data;
    },
    postsByHashtag: async (name) => {
        const response = await api.get(`/search/hashtags/${name.replace('#','')}`);
        return response.data;
    }
};

export const chatService = {
    getHistory: async (otherUserEmail) => {
        const response = await api.get('/chat/history', { params: { otherUserEmail } });
        return response.data;
    },
    sendMessage: async ({ receiverEmail, content, file }) => {
        const formData = new FormData();
        formData.append('receiverEmail', receiverEmail);
        if (content) formData.append('content', content);
        if (file) formData.append('file', file);
        const response = await api.post('/chat/send', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        return response.data;
    }
};

export const orbitService = {
    upload: async (file) => {
        const fd = new FormData();
        fd.append('file', file);
        const response = await api.post('/orbit/upload', fd, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        return response.data;
    },
    createMessage: async ({ roomId, senderEmail, text, mediaUrl }) => {
        const response = await api.post('/orbit/messages', { roomId, senderEmail, text, mediaUrl });
        return response.data;
    },
    getMessages: async (roomId, page = 0, size = 50) => {
        const response = await api.get('/orbit/messages', { params: { roomId, page, size } });
        return response.data;
    },
    createPoll: async ({ roomId, question, options }) => {
        const response = await api.post('/orbit/polls', { roomId, question, options });
        return response.data;
    },
    votePoll: async (id, { email, option }) => {
        const response = await api.post(`/orbit/polls/${id}/vote`, { email, option });
        return response.data;
    },
    getPolls: async (roomId, page = 0, size = 10) => {
        const response = await api.get('/orbit/polls', { params: { roomId, page, size } });
        return response.data;
    },
    getWhiteboard: async (roomId) => {
        const response = await api.get('/orbit/whiteboard', { params: { roomId } });
        return response.data;
    },
    saveWhiteboard: async (roomId, strokesJson) => {
        // Aligned with Java entity field name 'strokesJson'
        const response = await api.put('/orbit/whiteboard', { strokesJson }, { params: { roomId } });
        return response.data;
    },
    // Room persistence endpoints
    createRoom: async ({ id, name, hostEmail, duration, maxParticipants }) => {
        const response = await api.post('/orbit/rooms', { id, name, hostEmail, duration, maxParticipants });
        return response.data;
    },
    getRoom: async (id) => {
        const response = await api.get(`/orbit/rooms/${id}`);
        return response.data;
    },
    updateRoom: async (id, payload) => {
        const response = await api.put(`/orbit/rooms/${id}`, payload);
        return response.data;
    },
    listRooms: async () => {
        const response = await api.get('/orbit/rooms');
        return response.data;
    },
    joinRoom: async (id, { email, username, avatar }) => {
        const response = await api.post(`/orbit/rooms/${id}/join`, { email, username, avatar });
        return response.data;
    },
    leaveRoom: async (id, email) => {
        const response = await api.delete(`/orbit/rooms/${id}/leave`, { params: { email } });
        return response.data;
    },
    setSpotlight: async (id, userId) => {
        const response = await api.put(`/orbit/rooms/${id}/spotlight`, null, { params: { userId } });
        return response.data;
    }
};

export default api;
