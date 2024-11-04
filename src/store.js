import { legacy_createStore as createStore } from 'redux'

const initialState = {
  sidebarShow: true,
  theme: 'light',
  auth: {
    user: JSON.parse(localStorage.getItem('user')) || null,
    isAuthenticated: !!localStorage.getItem('user')
  }
}

const changeState = (state = initialState, { type, ...rest }) => {
  switch (type) {
    case 'set':
      return { ...state, ...rest }
    case 'LOGIN_SUCCESS':
      const newAuthState = {
        ...state,
        auth: {
          user: rest.user,
          isAuthenticated: true
        }
      }
      localStorage.setItem('user', JSON.stringify(rest.user))
      return newAuthState
    case 'LOGOUT':
      localStorage.removeItem('user')
      return {
        ...state,
        auth: {
          user: null,
          isAuthenticated: false
        }
      }
    default:
      return state
  }
}

const store = createStore(changeState)
export default store
