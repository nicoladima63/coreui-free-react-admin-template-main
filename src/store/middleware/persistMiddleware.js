export const persistMiddleware = store => next => action => {
  const result = next(action);

  if (action.type === 'auth/loginSuccess') {
    const { user, token } = action.payload;
    if (user && token) {
      localStorage.setItem('user', JSON.stringify(user));
      localStorage.setItem('token', token);
    }
  }

  return result;
};
