import { useUserContext } from '../context/UserContext';
import { MapPinIcon, GlobeAltIcon } from '@heroicons/react/24/outline';

export const LocationDisplay = () => {
  const { currentUser } = useUserContext();

  if (!currentUser?.location_info) {
    return null;
  }

  const { city, region, country_name, currency, language } = currentUser.location_info;

  return (
    <div className="fixed bottom-4 left-4 z-50">
      <div className="bg-gray-800/80 backdrop-blur-sm text-gray-400 px-3 py-2 rounded-lg shadow-lg border border-gray-700/50 text-xs">
        <div className="flex items-center gap-2">
          {/* Location Icon & Text */}
          <div className="flex items-center gap-1.5">
            <MapPinIcon className="w-3.5 h-3.5 text-gray-500" />
            <span className="text-gray-300">
              {city && region ? `${city}, ${region}` : city || region}
            </span>
          </div>

          {/* Separator */}
          <span className="text-gray-600">•</span>

          {/* Country */}
          <div className="flex items-center gap-1.5">
            <GlobeAltIcon className="w-3.5 h-3.5 text-gray-500" />
            <span>{country_name}</span>
          </div>

          {/* Currency */}
          {currency && (
            <>
              <span className="text-gray-600">•</span>
              <span title={currency.name}>
                {currency.symbol} {currency.code}
              </span>
            </>
          )}

          {/* Language */}
          {language && (
            <>
              <span className="text-gray-600">•</span>
              <span title={`Language: ${language.name}`}>
                {language.code.toUpperCase()}
              </span>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
