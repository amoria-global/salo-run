import React from 'react';
import Image from 'next/image';
import { Unlock } from 'lucide-react';

interface Album {
  id: string | number;
  thumbnail: string;
  title: string;
  photoCount: number;
  category: string;
  photographer: string;
  photographerAvatar: string;
  favoriteCount: number;
  downloadedCount: number;
  images: any[]; // You can replace 'any' with a more specific type if you have one
  receivedDate: string;
  date: string;
  isArchived?: boolean;
  payment?: {
    amountDue: number;
    status: string;
    eventName: string;
    photographerName: string;
  };
}

interface AlbumCardProps {
  album: Album;
  viewMode: 'grid' | 'list';
  colors: {
    bgCard: string;
    bgTertiary: string;
    borderPrimary: string;
    textPrimary: string;
    textSecondary: string;
    shadowCard?: string;
  };
  onCardClick: (album: Album) => void;
  onBrowseClick: (album: Album) => void;
  hideActionButton?: boolean;
}

const EyeIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
    <circle cx="12" cy="12" r="3"></circle>
  </svg>
);

const LockIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
    <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
  </svg>
);

const ImageIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
    <circle cx="8.5" cy="8.5" r="1.5"></circle>
    <polyline points="21 15 16 10 5 21"></polyline>
  </svg>
);

const AlbumCard: React.FC<AlbumCardProps> = ({
  album,
  viewMode,
  colors,
  onCardClick,
  onBrowseClick,
  hideActionButton
}) => {
  const isArchived = album.isArchived || false;

  if (viewMode === 'grid') {
    return (
      <div
        style={{ position: 'relative', height: '450px', borderRadius: '1.5rem', overflow: 'hidden', transition: 'transform 0.3s ease', willChange: 'transform' }}
        onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.03)'; }}
        onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
      >
        {/* Blurred cover = glow effect */}
        <img src={album.thumbnail || '/coverr.jpg'} alt="" style={{ position: 'absolute', inset: '-10px', width: 'calc(100% + 20px)', height: 'calc(100% + 20px)', objectFit: 'cover', filter: 'blur(14px) brightness(0.7)', pointerEvents: 'none' }} />
        {/* Inner card. clickable */}
        <div
          onClick={(e) => { if (!hideActionButton) { e.stopPropagation(); onCardClick(album); } }}
          style={{ position: 'absolute', inset: '7px', borderRadius: '1.05rem', overflow: 'hidden', backgroundColor: '#000', cursor: 'pointer', transition: 'filter 0.2s' }}
          onMouseEnter={(e) => { e.currentTarget.style.filter = 'brightness(1.15)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.filter = 'brightness(1)'; }}
        >
          {/* Full-bleed cover image */}
          <img src={album.thumbnail || '/coverr.jpg'} alt={album.title} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
          {/* Gradient overlay */}
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(0,0,0,0.05) 0%, rgba(0,0,0,0) 35%, rgba(0,0,0,0.2) 60%, rgba(0,0,0,0.55) 100%)', pointerEvents: 'none' }} />

          {/* TOP: category/locked + photo count */}
          <div style={{ position: 'absolute', top: '0.6rem', left: '0.6rem', right: '0.6rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', pointerEvents: 'none', zIndex: 3 }}>
            <div style={{ backgroundColor: isArchived ? '#DC2626' : '#083A85', backdropFilter: 'blur(8px)', color: 'white', padding: '0.25rem 0.7rem', borderRadius: '1rem', fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.02em' }}>
              {isArchived ? 'Locked' : album.category}
            </div>
            <div style={{ backgroundColor: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(8px)', color: 'white', padding: '0.25rem 0.7rem', borderRadius: '1rem', fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.02em', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <ImageIcon /> {album.photoCount}
            </div>
          </div>

          {/* MIDDLE-BOTTOM: album title */}
          <div style={{ position: 'absolute', bottom: '6.2rem', left: 0, right: 0, padding: '0 0.8rem', zIndex: 3 }}>
            <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.7)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: '0.15rem' }}>Received: {album.receivedDate}</div>
            <div style={{ fontSize: '1.05rem', fontWeight: 800, color: 'white', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', letterSpacing: '0.03em', textTransform: 'uppercase', lineHeight: 1.3 }}>
              {album.title}
            </div>
          </div>

          {/* FOOTER BAR: frosted glass */}
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: 'rgba(0,0,0,0.35)', backdropFilter: 'blur(7px)', WebkitBackdropFilter: 'blur(7px)', padding: '0.6rem 0.8rem', borderTop: '1px solid rgba(255,255,255,0.1)', borderRadius: '0 0 1.05rem 1.05rem' }}>
            {/* Photographer avatar + name */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', minWidth: 0 }}>
              {album.photographerAvatar ? (
                <img src={album.photographerAvatar} alt={album.photographer} style={{ width: '36px', height: '36px', borderRadius: '50%', border: '2px solid rgba(255,255,255,0.3)', objectFit: 'cover', flexShrink: 0 }} onError={(e) => { e.currentTarget.style.display = 'none'; (e.currentTarget.nextElementSibling as HTMLElement)?.style.setProperty('display', 'flex'); }} />
              ) : null}
              <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'linear-gradient(135deg, #083A85, #3B82F6)', border: '2px solid rgba(255,255,255,0.3)', display: album.photographerAvatar ? 'none' : 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '0.75rem', fontWeight: 700, flexShrink: 0 }}>
                {album.photographer.charAt(0).toUpperCase()}
              </div>
              <span style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.9)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{album.photographer}</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // List View
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '80px 1fr 150px 120px 100px 150px',
        gap: '1rem',
        padding: '0.75rem 1rem',
        borderBottom: `2px solid ${colors.borderPrimary}`,
        alignItems: 'center',
        transition: 'background-color 0.2s',
        backgroundColor: colors.bgCard,
        cursor: 'pointer',
      }}
      onMouseEnter={(e) => {
        if (!isArchived) {
          e.currentTarget.style.backgroundColor = colors.bgTertiary;
        }
      }}
      onMouseLeave={(e) => {
        if (!isArchived) {
          e.currentTarget.style.backgroundColor = colors.bgCard;
        }
      }}
    >
      {/* Thumbnail */}
      <div style={{ position: 'relative', width: '80px', height: '50px', borderRadius: '0.375rem', overflow: 'hidden' }}>
        <Image 
          src={album.thumbnail} 
          alt={album.title} 
          fill 
          style={{ 
            objectFit: 'cover',
            filter: isArchived ? 'blur(8px)' : 'none'
          }} 
        />
        {isArchived && (
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'rgba(0, 0, 0, 0.4)'
          }}>
            <div style={{ transform: 'scale(0.6)', color: 'white' }}>
              <LockIcon />
            </div>
          </div>
        )}
      </div>

      {/* Album Title */}
      <div>
        <div style={{ fontSize: '0.9rem', fontWeight: '600', color: colors.textPrimary }}>
          {album.title}
          {isArchived && (
            <span style={{
              marginLeft: '0.5rem',
              fontSize: '0.65rem',
              padding: '0.15rem 0.4rem',
              backgroundColor: '#DC2626',
              color: 'white',
              borderRadius: '0.25rem',
              fontWeight: '700'
            }}>
              Locked
            </span>
          )}
        </div>
        <div style={{ fontSize: '0.8rem', color: '#9CA3AF' }}>
          <p>Received: {album.receivedDate}</p> 
        </div>
      </div>

      {/* Photographer */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <div style={{ position: 'relative', width: '24px', height: '24px', borderRadius: '50%', overflow: 'hidden' }}>
          <Image src={album.photographerAvatar} alt={album.photographer} fill style={{ objectFit: 'cover' }} />
        </div>
        <span style={{ fontSize: '0.85rem', color: colors.textPrimary }}>{album.photographer}</span>
      </div>

      {/* Photos Count */}
      <div style={{ fontSize: '0.9rem', color: colors.textPrimary }}>{album.photoCount} photos</div>

      {/* Category */}
      <span style={{
        display: 'inline-block',
        padding: isArchived ? '0.15rem 0.4rem' : '0.25rem 0.5rem',
        backgroundColor: isArchived ? '#DC2626' : '#DBEAFE',
        color: isArchived ? 'white' : '#1E40AF',
        borderRadius: '0.25rem',
        fontSize: isArchived ? '0.65rem' : '0.75rem',
        fontWeight: isArchived ? '700' : '500'
      }}>
        {isArchived ? 'Locked' : album.category}
      </span>

      {/* Actions */}
      {!hideActionButton && (
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            onClick={(e) => {
              e.stopPropagation(); // Prevent parent div click
              onCardClick(album);
            }}
            onMouseEnter={(e) => {
              if (!isArchived) {
                e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(0, 0, 0, 0.1)';
                e.currentTarget.style.transform = 'translateY(-2px)';
              }
            }}
            onMouseLeave={(e) => {
              if (!isArchived) {
                e.currentTarget.style.boxShadow = 'none';
                e.currentTarget.style.transform = 'translateY(0)';
              }
            }}
            style={{
              padding: '0.375rem 0.75rem',
              cursor: 'pointer',
              borderRadius: '0.375rem',
              border: `2px solid '#083A85'`,
              backgroundColor: '#083A85',
              color: 'white',
              fontSize: '0.8rem',
              fontWeight: '500',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.25rem',
              transition: 'all 0.2s',
            }}
          >
            <LockIcon /> <span>{isArchived ? 'Unlock' : 'Browse'}</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default AlbumCard;