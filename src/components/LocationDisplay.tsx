import { useUserContext } from '../context/UserContext';
import { Public as GlobeAltIcon } from '@mui/icons-material';

export const LocationDisplay = () => {
  const { currentUser } = useUserContext();

  if (!currentUser?.location_info) {
    return null;
  }

  const { country_name } = currentUser.location_info;

  return (
    <div className="fixed bottom-4 left-4 z-50">
      <div className="bg-gray-800/80 backdrop-blur-sm text-gray-300 px-3 py-2 rounded-lg shadow-lg border border-gray-700/50 text-xs">
        <div className="flex items-center gap-1.5">
          <GlobeAltIcon sx={{ width: 14, height: 14, color: 'rgb(156 163 175)' }} />
          <span>{country_name}</span>
        </div>
      </div>
    </div>
  );
};
