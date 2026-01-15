import { useMemo } from "react";

/**
 * Hook to determine which seasonal effects should be active based on current date.
 * Christmas season: November 1 - January 5 (inclusive)
 * Regular season: January 6 onwards until October 31
 */
export const useSeasonalEffects = () => {
  const seasonalState = useMemo(() => {
    const now = new Date();
    const month = now.getMonth(); // 0-indexed (0 = January, 10 = November, 11 = December)
    const day = now.getDate();

    // Christmas season: November 1 (month 10) to January 5 (month 0, day <= 5)
    const isChristmasSeason = 
      month === 10 || // November
      month === 11 || // December
      (month === 0 && day <= 5); // January 1-5

    return {
      isChristmasSeason,
      showSnow: isChristmasSeason,
      showChristmasHat: isChristmasSeason,
      showSunEffect: !isChristmasSeason,
    };
  }, []);

  return seasonalState;
};

/**
 * Non-hook version for use in useEffect or outside React components
 */
export const getSeasonalState = () => {
  const now = new Date();
  const month = now.getMonth();
  const day = now.getDate();

  const isChristmasSeason = 
    month === 10 || // November
    month === 11 || // December
    (month === 0 && day <= 5); // January 1-5

  return {
    isChristmasSeason,
    showSnow: isChristmasSeason,
    showChristmasHat: isChristmasSeason,
    showSunEffect: !isChristmasSeason,
  };
};

export default useSeasonalEffects;
