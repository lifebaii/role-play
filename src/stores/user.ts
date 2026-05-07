import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { setLocalUserName, getLocalUserName } from '@/utils/anonymousUser';
import { getLocalFriends, addLocalFriend, addOnlineFriendFromBlob, removeLocalFriend, clearFriendsCache, type LocalFriend, sortFriendsByMeta } from '@/utils/localFriendStorage';
import { userApi, charactersApi } from '@/api';
import { eventBus } from '@/utils/eventBus';

export interface User {
  id: string;
  login: string;
  name: string;
  avatarUrl: string;
  quota: number;
  totalChats: number;
  lastSigninDate: string | null;
  userName: string;
}

export const useUserStore = defineStore('user', () => {
  const user = ref<User | null>(null);
  const token = ref<string | null>(localStorage.getItem('user_token') || null);
  const isAuthenticating = ref(false);
  const signinMessage = ref('');
  const friendCharacters = ref<LocalFriend[]>([]);
  const isLoadingFriends = ref(false);
  const showLoginModal = ref(false);
  const localUserName = ref<string | null>(null);
  
  if (typeof localStorage !== 'undefined') {
    const savedUserData = localStorage.getItem('user_data');
    if (savedUserData) {
      try {
        user.value = JSON.parse(savedUserData);
      } catch {
      }
    }
    localUserName.value = getLocalUserName();
  }

  // 监听用户登录过期事件
  let isLogoutListenerInitialized = false;
  
  const handleUserLogout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('role_play_unique_models');
  };

  const handleFriendOrderChanged = () => {
    const sortedFriends = sortFriendsByMeta([...friendCharacters.value]);
    friendCharacters.value = sortedFriends;
  };

  const initEventListeners = () => {
    if (isLogoutListenerInitialized) return;
    isLogoutListenerInitialized = true;
    eventBus.on('user-logout', handleUserLogout);
    eventBus.on('friend-order-changed', handleFriendOrderChanged);
  };

  // 确保 store 初始化时注册监听器
  initEventListeners();

  const loadLocalFriends = async () => {
    clearFriendsCache();
    const localFriends = await getLocalFriends();
    const sortedFriends = sortFriendsByMeta(localFriends);
    friendCharacters.value = [...sortedFriends];
  };

  if (typeof localStorage !== 'undefined') {
    loadLocalFriends();
  }

  const isLoggedIn = () => {
    return !!token.value && !!user.value;
  };
  
  const isLoggedInValue = computed(() => {
    return !!token.value && !!user.value;
  });

  const isAnonymous = computed(() => {
    return !token.value || !user.value;
  });

  const hasQuota = () => {
    return user.value?.quota ?? 0 > 0;
  };

  const effectiveUserName = computed(() => {
    if (user.value?.userName) {
      return user.value.userName;
    }
    if (user.value?.name) {
      return user.value.name;
    }
    if (localUserName.value) {
      return localUserName.value;
    }
    return '游客';
  });

  const setToken = (newToken: string | null) => {
    token.value = newToken;
    if (newToken) {
      localStorage.setItem('user_token', newToken);
    } else {
      localStorage.removeItem('user_token');
    }
  };

  const setUser = (newUser: User | null) => {
    user.value = newUser;
    if (newUser) {
      localStorage.setItem('user_data', JSON.stringify(newUser));
    } else {
      localStorage.removeItem('user_data');
    }
  };

  const clearSigninMessage = () => {
    signinMessage.value = '';
  };

  const loginWithToken = async (newToken: string) => {
    try {
      isAuthenticating.value = true;
      setToken(newToken);
      const result = await userApi.verify();
      setUser(result.user);
      return result;
    } catch (error) {
      setToken(null);
      setUser(null);
      throw error;
    } finally {
      isAuthenticating.value = false;
    }
  };

  const verify = async () => {
    if (!token.value) {
      return { user: null };
    }
    
    if (user.value) {
      userApi.verify()
        .then(result => {
          setUser(result.user);
        })
        .catch(error => {
          // 检查错误处理逻辑和 API 层已经处理了 401 的情况
          // 这里不需要再清除 token，因为 API 层已经处理了
          console.log('[UserStore] verify failed:', error.message);
        });
      return { user: user.value };
    }
    
    try {
      isAuthenticating.value = true;
      const result = await userApi.verify();
      setUser(result.user);
      return result;
    } catch (error) {
      // 错误处理逻辑和 API 层已经处理了 401 的情况
      // 其他错误不清除 token
      console.log('[UserStore] verify failed:', error);
      isAuthenticating.value = false;
      throw error;
    } finally {
      isAuthenticating.value = false;
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    signinMessage.value = '';
    localStorage.removeItem('role_play_unique_models');
  };

  const requireLogin = () => {
    showLoginModal.value = true;
  };

  const closeLoginModal = () => {
    showLoginModal.value = false;
  };

  const signin = async () => {
    try {
      const result = await userApi.signin();
      setUser(result.user);
      signinMessage.value = `签到成功！获得 ${result.bonusQuota} 次对话额度`;
      setTimeout(() => {
        signinMessage.value = '';
      }, 3000);
      return result;
    } catch (error: any) {
      signinMessage.value = error.message;
      setTimeout(() => {
        signinMessage.value = '';
      }, 3000);
      throw error;
    }
  };

  const canSigninToday = () => {
    if (!user.value?.lastSigninDate) {
      return true;
    }
    const today = new Date().toISOString().split('T')[0];
    return user.value.lastSigninDate !== today;
  };

  const addFriend = async (character: any) => {
    const newFriend = await addLocalFriend(character);
    const exists = friendCharacters.value.some(f => 
      f.role_play?.id === newFriend.role_play?.id || 
      (f.role_play?.originalId && f.role_play.originalId === newFriend.role_play?.originalId)
    );
    if (!exists) {
      friendCharacters.value.unshift(newFriend);
    }
    return newFriend;
  };

  const addOnlineFriendCharacter = async (characterId: string, sourceUrl?: string) => {
    try {
      // 先调用后端接口添加好友（检查限额）
      if (isLoggedIn()) {
        await userApi.addFriend(characterId);
      }
      
      let blob: Blob;
      let contentType: string;
      
      if (sourceUrl) {
        // 添加时间戳禁用缓存
        const url = new URL(sourceUrl, window.location.origin)
        url.searchParams.set('t', Date.now().toString())
        
        const response = await fetch(url.toString(), { cache: 'no-store' });
        if (!response.ok) {
          throw new Error('获取角色数据失败');
        }
        blob = await response.blob();
        contentType = response.headers.get('Content-Type') || 'application/octet-stream';
      } else {
        const result = await charactersApi.getRaw(characterId);
        blob = result.blob;
        contentType = result.contentType;
      }
      
      const newFriend = await addOnlineFriendFromBlob(blob, contentType, characterId, characterId);
      
      const exists = friendCharacters.value.some(f => 
        f.role_play?.id === newFriend.role_play?.id
      );
      if (!exists) {
        friendCharacters.value.unshift(newFriend);
      }
      
      console.log(`[UserStore] Added online friend: ${characterId}`);
      return newFriend;
    } catch (error) {
      console.error('[UserStore] Failed to add online friend:', error);
      throw error;
    }
  };

  const addLocalFriendCharacter = async (character: any) => {
    const newFriend = await addLocalFriend(character);
    const exists = friendCharacters.value.some(f => 
      f.role_play?.id === newFriend.role_play?.id || 
      (f.role_play?.originalId && f.role_play.originalId === newFriend.role_play?.originalId)
    );
    if (!exists) {
      friendCharacters.value.unshift(newFriend);
    }
    return newFriend;
  };

  const removeFriend = async (characterId: string) => {
    await removeLocalFriend(characterId);
    friendCharacters.value = friendCharacters.value.filter(f => f.role_play?.id !== characterId);
    
    if (isLoggedIn()) {
      try {
        await userApi.removeFriend(characterId);
      } catch (error) {
        console.error('[UserStore] Failed to delete character from server:', error);
      }
    }
    
    return { user: user.value };
  };

  const updateUserName = async (userName: string) => {
    setLocalUserName(userName);
    localUserName.value = userName;
    
    if (isLoggedIn()) {
      try {
        const result = await userApi.updateUserName(userName);
        if (result.user) {
          setUser(result.user);
        }
        return { user: user.value };
      } catch (error) {
        console.error('Failed to update userName on server:', error);
        return { user: user.value };
      }
    }
    
    return { user: user.value };
  };

  const loadFriends = async () => {
    const localFriends = await getLocalFriends();
    friendCharacters.value = localFriends;
  };

  return {
    user,
    token,
    isAuthenticating,
    signinMessage,
    friendCharacters,
    isLoadingFriends,
    showLoginModal,
    isAnonymous,
    effectiveUserName,
    isLoggedIn,
    hasQuota,
    setToken,
    setUser,
    clearSigninMessage,
    loginWithToken,
    verify,
    logout,
    requireLogin,
    closeLoginModal,
    signin,
    canSigninToday,
    addFriend,
    addOnlineFriendCharacter,
    addLocalFriendCharacter,
    removeFriend,
    updateUserName,
    loadFriends,
    loadLocalFriends
  };
});
