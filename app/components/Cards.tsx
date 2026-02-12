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

const AlbumCard: React.FC<AlbumCardProps> = ({
  album,
  viewMode,
  colors,
  onCardClick,
  onBrowseClick
}) => {
  const isArchived = album.isArchived || false;

  if (viewMode === 'grid') {
    return (
      <div
        style={{
          backgroundColor: colors.bgCard,
          borderRadius: '0.75rem',
          overflow: 'hidden',
          border: `2px solid ${colors.borderPrimary}`,
          boxShadow: colors.shadowCard || 'none',
          transition: 'all 0.2s',
        }}
        onMouseEnter={(e) => {
          if (!isArchived) {
            e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(0, 0, 0, 0.1)';
            e.currentTarget.style.transform = 'translateY(-2px)';
          }
        }}
        onMouseLeave={(e) => {
          if (!isArchived) {
            e.currentTarget.style.boxShadow = colors.shadowCard || 'none';
            e.currentTarget.style.transform = 'translateY(0)';
          }
        }}
      >
        {/* Album Thumbnail */}
        <div style={{ position: 'relative', height: '180px', overflow: 'hidden' }}>
          <Image
            src={album.thumbnail}
            alt={album.title}
            fill
            style={{ 
              objectFit: 'cover',
              filter: isArchived ? 'blur(2px)' : 'none'
            }}
          />
          
          {/* Lock Icon Overlay for Archived */}
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
              backgroundColor: 'rgba(0, 0, 0, 0.4)',
              zIndex: 2
            }}>
              <svg width="40" height="40" viewBox="0 0 24 24" fill="rgba(255,255,255,0.85)" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ filter: 'drop-shadow(0 2px 6px rgba(0,0,0,0.5))' }}>
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                <path d="M7 11V7a5 5 0 0 1 10 0v4" fill="none"></path>
              </svg>
            </div>
          )}

          <div style={{
            position: 'absolute',
            top: '0.5rem',
            right: '0.5rem',
            backgroundColor: 'rgba(0, 0, 0, 0.6)',
            color: 'white',
            padding: '0.25rem 0.5rem',
            borderRadius: '0.25rem',
            fontSize: '0.75rem',
            fontWeight: '500',
            zIndex: 1
          }}>
            {album.photoCount} photos
          </div>
          {!isArchived && (
            <div style={{
              position: 'absolute',
              bottom: '0.5rem',
              left: '0.5rem',
              backgroundColor: '#083A85',
              color: 'white',
              padding: '0.25rem 0.5rem',
              borderRadius: '0.25rem',
              fontSize: '0.7rem',
              fontWeight: '500',
              zIndex: 1
            }}>
              {album.category}
            </div>
          )}
        </div>

        {/* Album Info */}
        <div style={{ padding: '1rem' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: '600', display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: colors.textPrimary, margin: 0, marginBottom: '0.5rem', textAlign:'left' }}>
            <span>{album.title}</span>
            {isArchived && (
              <span style={{ color: 'white', backgroundColor: '#DC2626', padding: '0.15rem 0.4rem', borderRadius: '0.25rem', fontSize: '0.75rem', fontWeight: '700' }}>Locked</span>
            )}
          </h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
            <div style={{ position: 'relative', width: '24px', height: '24px', borderRadius: '50%', overflow: 'hidden' }}>
              <Image src={album.photographerAvatar} alt={album.photographer} fill style={{ objectFit: 'cover' }} />
            </div>
            <span style={{ fontSize: '0.85rem', color: colors.textSecondary }}>{album.photographer}</span>
          </div>
          <div style={{ fontSize: '0.8rem', color: '#9CA3AF', marginBottom: '0.75rem' }}>
            <p style={{textAlign:'left'}}>Received: {album.receivedDate}</p> 
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              onClick={(e) => {
                e.stopPropagation(); // Prevent event bubbling
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
                cursor: 'pointer',
                flex: 1,
                padding: '0.5rem',
                borderRadius: '0.375rem',
                border: '2px solid #062a63',
                backgroundColor: '#083A85',
                color: 'white',
                fontSize: '0.8rem',
                fontWeight: '600',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.25rem',
                transition: 'all 0.2s',
              }}
            >
              {isArchived ? <LockIcon /> : <EyeIcon />}
              {isArchived ? 'Click to Unlock' : 'Browse'}
            </button>
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
    </div>
  );
};

export default AlbumCard;