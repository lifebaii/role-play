const LOCAL_USER_NAME_KEY = 'role_play_local_user_name'

const ANONYMOUS_USER_ID_KEY = 'role_play_anonymous_user_id'
const ANONYMOUS_USER_NAME_KEY = 'role_play_anonymous_user_name'

localStorage.removeItem(ANONYMOUS_USER_ID_KEY)
localStorage.removeItem(ANONYMOUS_USER_NAME_KEY)

export function isAnonymousUser(): boolean {
  const userToken = localStorage.getItem('user_token')
  return !userToken
}

export function getLocalUserName(): string | null {
  return localStorage.getItem(LOCAL_USER_NAME_KEY)
}

export function setLocalUserName(name: string): void {
  localStorage.setItem(LOCAL_USER_NAME_KEY, name)
}

export function hasLocalUserName(): boolean {
  return !!localStorage.getItem(LOCAL_USER_NAME_KEY)
}
