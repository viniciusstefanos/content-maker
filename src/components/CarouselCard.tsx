
import React from 'react';
import { ProfileInfo, Slide, CarouselConfig } from '../../types';
import { MessageSquare, Repeat2, Heart, Share, BadgeCheck } from 'lucide-react';

interface Props {
  slide: Slide;
  profile: ProfileInfo;
  config: CarouselConfig;
  onContentChange: (content: string) => void;
}

const CarouselCard: React.FC<Props> = ({ slide, profile, config, onContentChange }) => {
  const isDark = config.theme === 'dark';

  return (
    <div
      style={{
        width: '1080px',
        height: '1350px',
        backgroundColor: isDark ? '#001a1f' : '#ffffff',
        color: isDark ? '#ffffff' : '#001a1f',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        overflow: 'hidden',
        boxSizing: 'border-box',
        fontFamily: "'Jost', sans-serif"
      }}
    >
      <style>{`
        mark {
          background-color: ${config.highlightColor};
          color: inherit;
          padding: 0 4px;
          border-radius: 4px;
        }
        .bricolage {
          font-family: 'Bricolage Grotesque', sans-serif;
        }
      `}</style>

      {/* Decorative Elements */}
      <div className="absolute top-0 left-0 w-full h-2 bg-teal opacity-10" />
      <div className="absolute bottom-0 left-0 w-full h-2 bg-teal opacity-10" />

      {/* 1080x1080 Safe Content Zone */}
      <div
        style={{
          width: '1080px',
          height: '1080px',
          marginTop: '135px',
          marginBottom: '135px',
          padding: '120px 100px 100px 100px',
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
          boxSizing: 'border-box'
        }}
      >
        {/* Profile Header - Elegant & Minimal */}
        <div 
          className="absolute top-12 left-[100px] right-[100px] flex items-center justify-between pointer-events-none"
          style={{ boxSizing: 'border-box' }}
        >
          <div className="flex items-center gap-5">
            <div 
              className="w-20 h-20 rounded-full border-2 overflow-hidden shrink-0"
              style={{ borderColor: isDark ? '#007185' : '#e8eaeb' }}
            >
              <img
                src={profile.avatar}
                alt="Avatar"
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.currentTarget.src = 'https://api.dicebear.com/7.x/initials/svg?seed=' + profile.name;
                }}
              />
            </div>
            <div className="flex flex-col overflow-hidden">
              <span className="text-[32px] font-bold leading-none tracking-tight truncate max-w-[600px] bricolage">{profile.name}</span>
              <span className={`text-[24px] ${isDark ? 'text-teal-mid' : 'text-teal'} font-medium tracking-tight mt-1 opacity-80`}>{profile.handle}</span>
            </div>
          </div>
          
          <div className="w-12 h-12 flex items-center justify-center opacity-20">
            <svg width="40" height="40" viewBox="0 0 80 80" fill="none">
              <rect x="12" y="10" width="22" height="28" rx="5" stroke="currentColor" stroke-width="2.5" fill="none"/>
              <line x1="24" y1="38" x2="56" y2="42" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            </svg>
          </div>
        </div>

        {/* Dynamic Content */}
        <div className="flex-1 flex flex-col justify-center gap-10">
          <div
            contentEditable
            suppressContentEditableWarning
            onBlur={(e) => onContentChange(e.currentTarget.innerHTML)}
            style={{
              fontSize: `${config.fontSize}px`,
              lineHeight: '1.3',
              whiteSpace: 'pre-wrap',
              textAlign: 'left',
              width: '100%',
              outline: 'none',
              color: 'inherit'
            }}
            className="font-medium tracking-tight cursor-text bricolage"
            dangerouslySetInnerHTML={{ __html: slide.content }}
          />
          
          {slide.image && (
            <div 
              className="w-full rounded-[24px] overflow-hidden border border-border shadow-sm bg-off"
              style={{ 
                aspectRatio: '16 / 9',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <img 
                src={slide.image} 
                alt="Slide media" 
                className="w-full h-full object-cover" 
                style={{ display: 'block' }}
              />
            </div>
          )}
        </div>

        {/* Footer - Branded */}
        <div
          className={`absolute bottom-10 left-[100px] right-[100px] flex justify-between items-center border-t border-border pt-8`}
        >
          <div className="flex gap-12 items-center opacity-40">
             <div className="flex items-center gap-3">
                <MessageSquare className="w-10 h-10" strokeWidth={1.5} />
             </div>
             <div className="flex items-center gap-3">
                <Repeat2 className="w-10 h-10" strokeWidth={1.5} />
             </div>
             <div className="flex items-center gap-3">
                <Heart className="w-10 h-10" strokeWidth={1.5} />
             </div>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="text-[18px] font-bold tracking-[0.2em] uppercase text-teal opacity-60 bricolage">Saltear</div>
            <div className="w-1.5 h-1.5 rounded-full bg-teal opacity-40" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default CarouselCard;
