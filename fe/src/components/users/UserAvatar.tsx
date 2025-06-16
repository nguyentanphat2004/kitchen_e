interface UserAvatarProps {
    name: string;
    size?: 'sm' | 'md' | 'lg';
    src?: string;
  }
  
  export const UserAvatar: React.FC<UserAvatarProps> = ({ 
    name, 
    size = 'md', 
    src 
  }) => {
    const sizeClasses = {
      sm: 'h-8 w-8 text-xs',
      md: 'h-10 w-10 text-sm',
      lg: 'h-12 w-12 text-base'
    };
  
    const getInitials = (fullName: string) => {
      return fullName
        .split(' ')
        .map(word => word[0])
        .join('')
        .substr(0, 2)
        .toUpperCase();
    };
  
    if (src) {
      return (
        <img
          src={src}
          alt={name}
          className={`${sizeClasses[size]} rounded-full object-cover`}
        />
      );
    }
  
    return (
      <div 
        className={`${sizeClasses[size]} rounded-full bg-gray-200 flex items-center justify-center`}
      >
        <span className="text-gray-500 font-medium">
          {getInitials(name)}
        </span>
      </div>
    );
  };