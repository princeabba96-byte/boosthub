import React, { useState } from 'react';
import { getInitials } from '../utils/format';

interface AvatarProps {
  src?: string | null;
  name?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  hasStory?: boolean;
  storyViewed?: boolean;
  isOnline?: boolean;
  onClick?: () => void;
}

const SIZE_CLASSES = {
  xs: 'w-7 h-7 text-xs',
  sm: 'w-9 h-9 text-xs',
  md: 'w-11 h-11 text-sm',
  lg: 'w-14 h-14 text-base',
  xl: 'w-20 h-20 text-xl',
};

export const Avatar: React.FC<AvatarProps> = ({
  src,
  name = 'BoostHub',
  size = 'md',
  hasStory = false,
  storyViewed = false,
  isOnline = false,
  onClick,
}) => {
  const [imgError, setImgError] = useState(false);
  const showImage = Boolean(src && src.trim().length > 0 && !imgError);

  return (
    <div
      onClick={onClick}
      className={`relative inline-flex items-center justify-center shrink-0 select-none ${
        onClick ? 'cursor-pointer' : ''
      }`}
    >
      <div
        className={`rounded-full p-[2px] ${
          hasStory
            ? storyViewed
              ? 'bg-slate-700'
              : 'bg-gradient-to-tr from-blue-500 via-purple-500 to-pink-500'
            : 'bg-transparent'
        }`}
      >
        <div
          className={`${SIZE_CLASSES[size]} rounded-full overflow-hidden bg-gradient-to-br from-blue-600/30 via-purple-600/30 to-pink-600/30 border border-white/10 flex items-center justify-center font-semibold text-white`}
        >
          {showImage ? (
            <img
              src={src!}
              alt={name}
              referrerPolicy="no-referrer"
              onError={() => setImgError(true)}
              className="w-full h-full object-cover"
            />
          ) : (
            <span>{getInitials(name)}</span>
          )}
        </div>
      </div>
      {isOnline && (
        <span
          title="Online"
          className="absolute bottom-0.5 right-0.5 w-3 h-3 rounded-full bg-emerald-500 ring-2 ring-[#060813]"
        />
      )}
    </div>
  );
};
