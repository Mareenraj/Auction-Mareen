import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { setToken } from '@/lib/redux/slices/authSlice';

const useAuthToken = () => {
  const dispatch = useDispatch();
  const { token } = useSelector((state: any) => state.auth);

  useEffect(() => {
    const cookieToken = document.cookie
      .split('; ')
      .find(row => row.startsWith('token='))
      ?.split('=')[1];
    if (cookieToken && !token) {
      dispatch(setToken(cookieToken));
    }
  }, [dispatch, token]);

  const setCookieToken = (newToken: string) => {
    document.cookie = `token=${newToken}; Path=/; Secure; SameSite=Strict`;
    dispatch(setToken(newToken));
  };

  const clearToken = () => {
    document.cookie = `token=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;`;
    dispatch(setToken(null));
  };

  return { token, setCookieToken, clearToken };
};

export default useAuthToken;