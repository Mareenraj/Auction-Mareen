import { useTheme } from "next-themes";

export function useThemeClasses() {
  const { theme } = useTheme();

  const getThemeClasses = (darkClass: string, lightClass: string): string => {
    return theme === "dark" ? darkClass : lightClass;
  };

  return getThemeClasses;
}
