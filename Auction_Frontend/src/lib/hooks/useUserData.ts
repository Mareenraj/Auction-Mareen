import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { setUser } from '@/lib/redux/slices/authSlice'; // Updated import

interface UserData {
  userId: number | null;
  userEmail: string | null;
  userRole: string | null;
}

const useUserData = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((state: any) => state.auth || { user: null });
  const { userId, userEmail, userRole } = user || { userId: null, userEmail: null, userRole: null };

  useEffect(() => {
    // Sync user data from cookies to Redux state on mount
    const cookies = document.cookie.split('; ').reduce((acc, row) => {
      const [name, value] = row.split('=');
      acc[name] = value;
      return acc;
    }, {} as Record<string, string>);

    const newUserData: UserData = {
      userId: cookies.userId ? parseInt(cookies.userId, 10) : null,
      userEmail: cookies.userEmail || null,
      userRole: cookies.userRole || null,
    };

    const hasChanges = 
      userId !== newUserData.userId ||
      userEmail !== newUserData.userEmail ||
      userRole !== newUserData.userRole;

    if (hasChanges && (newUserData.userId || newUserData.userEmail || newUserRole)) {
      dispatch(setUser(newUserData));
    }
  }, [dispatch, userId, userEmail, userRole]);

  const setUserDataCookie = (data: Partial<UserData>) => {
    const updatedUserData: UserData = {
      userId: data.userId || userId,
      userEmail: data.userEmail || userEmail,
      userRole: data.userRole || userRole,
    };

    if (data.userId) {
      document.cookie = `userId=${data.userId}; Path=/; Secure; SameSite=Strict`;
    }
    if (data.userEmail) {
      document.cookie = `userEmail=${data.userEmail}; Path=/; Secure; SameSite=Strict`;
    }
    if (data.userRole) {
      document.cookie = `userRole=${data.userRole}; Path=/; Secure; SameSite=Strict`;
    }
    dispatch(setUser(updatedUserData));
  };

  const clearUserData = () => {
    document.cookie = `userId=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;`;
    document.cookie = `userEmail=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;`;
    document.cookie = `userRole=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;`;
    dispatch(setUser(null));
  };

  return { userId, userEmail, userRole, setUserDataCookie, clearUserData };
};

export default useUserData;