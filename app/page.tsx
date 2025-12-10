"use client";

import { useRouter } from 'next/navigation';
import Image from 'next/image';

// Icons
const PhotographerIcon = () => (
  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="2" y="5" width="20" height="14" rx="2" stroke="currentColor" strokeWidth="1.5"/>
    <circle cx="12" cy="12" r="3.5" stroke="currentColor" strokeWidth="1.5"/>
    <circle cx="12" cy="12" r="1.5" fill="currentColor"/>
    <circle cx="17" cy="8" r="1" fill="currentColor"/>
    <path d="M7 5V4C7 3.44772 7.44772 3 8 3H16C16.5523 3 17 3.44772 17 4V5" stroke="currentColor" strokeWidth="1.5"/>
  </svg>
);

const ClientIcon = () => (
  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="1.5"/>
    <path d="M4 20C4 16.6863 7.58172 14 12 14C16.4183 14 20 16.6863 20 20" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    <path d="M15 8L17 10L21 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const FreelancerIcon = () => (
  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="7" r="3.5" stroke="currentColor" strokeWidth="1.5"/>
    <path d="M5 20C5 16.134 8.13401 13 12 13C15.866 13 19 16.134 19 20" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    <path d="M12 13V17M12 17L9 15M12 17L15 15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <rect x="8" y="19" width="8" height="2" rx="0.5" stroke="currentColor" strokeWidth="1.5"/>
  </svg>
);

const ArrowRightIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M5 12H19M19 12L12 5M19 12L12 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export default function Home() {
  const router = useRouter();

  const handleRoleSelect = (role: 'photographer' | 'client' | 'freelancer') => {
    if (role === 'photographer') {
      router.push('/user/photographers/dashboard');
    } else if (role === 'freelancer') {
      router.push('/user/freelancer/dashboard');
    } else {
      router.push('/user/client/home');
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #F8FAFC 0%, #EFF6FF 50%, #F0F9FF 100%)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Background Decorations */}
      <div style={{
        position: 'absolute',
        top: '-10%',
        right: '-5%',
        width: '400px',
        height: '400px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(8, 58, 133, 0.08) 0%, transparent 70%)',
        pointerEvents: 'none'
      }} />
      <div style={{
        position: 'absolute',
        bottom: '-15%',
        left: '-10%',
        width: '500px',
        height: '500px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(242, 12, 143, 0.06) 0%, transparent 70%)',
        pointerEvents: 'none'
      }} />

      {/* Main Content */}
      <div style={{
        textAlign: 'center',
        maxWidth: '800px',
        width: '100%',
        position: 'relative',
        zIndex: 1
      }}>
        {/* Logo and Brand */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '2rem'
        }}>
          <span style={{
            fontSize: '1.75rem',
            fontWeight: '700',
            color: '#111827',
            lineHeight: '1'
          }}>
            Amoria
          </span>
          <Image
            src="/logo.png"
            alt="Amoria Logo"
            width={56}
            height={69}
            style={{ marginLeft: '-0.75rem' }}
          />
        </div>

        {/* Heading */}
        <h1 style={{
          fontSize: '2.5rem',
          fontWeight: '700',
          color: '#111827',
          marginBottom: '0.75rem',
          letterSpacing: '-0.02em',
          lineHeight: '1.2'
        }}>
          Welcome to Amoria
        </h1>
        <p style={{
          fontSize: '1.1rem',
          color: '#6B7280',
          marginBottom: '3rem',
          maxWidth: '500px',
          margin: '0 auto 3rem auto',
          lineHeight: '1.6'
        }}>
          Select your role to access your personalized dashboard experience
        </p>

        {/* Role Selection Cards */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '1.5rem',
          maxWidth: '1000px',
          margin: '0 auto'
        }}>
          {/* Photographer Card */}
          <div
            onClick={() => handleRoleSelect('photographer')}
            style={{
              backgroundColor: 'white',
              borderRadius: '1.25rem',
              padding: '2rem',
              cursor: 'pointer',
              border: '2px solid #E5E7EB',
              transition: 'all 0.3s ease',
              position: 'relative',
              overflow: 'hidden'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = '#083A85';
              e.currentTarget.style.transform = 'translateY(-4px)';
              e.currentTarget.style.boxShadow = '0 20px 40px -12px rgba(8, 58, 133, 0.2)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = '#E5E7EB';
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            {/* Decorative gradient */}
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '4px',
              background: 'linear-gradient(90deg, #083A85, #3B82F6)',
              opacity: 0,
              transition: 'opacity 0.3s ease'
            }} className="card-gradient" />

            <div style={{
              width: '80px',
              height: '80px',
              borderRadius: '1rem',
              background: 'linear-gradient(135deg, #EFF6FF 0%, #DBEAFE 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1.5rem auto',
              color: '#083A85'
            }}>
              <PhotographerIcon />
            </div>

            <h2 style={{
              fontSize: '1.5rem',
              fontWeight: '700',
              color: '#111827',
              marginBottom: '0.5rem'
            }}>
              Photographer
            </h2>
            <p style={{
              fontSize: '0.95rem',
              color: '#6B7280',
              marginBottom: '1.5rem',
              lineHeight: '1.5'
            }}>
              Company employed photographer managing bookings and clients
            </p>

            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              color: '#083A85',
              fontWeight: '600',
              fontSize: '0.95rem'
            }}>
              <span>Enter Dashboard</span>
              <ArrowRightIcon />
            </div>
          </div>

          {/* Client Card */}
          <div
            onClick={() => handleRoleSelect('client')}
            style={{
              backgroundColor: 'white',
              borderRadius: '1.25rem',
              padding: '2rem',
              cursor: 'pointer',
              border: '2px solid #E5E7EB',
              transition: 'all 0.3s ease',
              position: 'relative',
              overflow: 'hidden'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = '#F20C8F';
              e.currentTarget.style.transform = 'translateY(-4px)';
              e.currentTarget.style.boxShadow = '0 20px 40px -12px rgba(242, 12, 143, 0.2)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = '#E5E7EB';
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            <div style={{
              width: '80px',
              height: '80px',
              borderRadius: '1rem',
              background: 'linear-gradient(135deg, #FDF2F8 0%, #FCE7F3 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1.5rem auto',
              color: '#F20C8F'
            }}>
              <ClientIcon />
            </div>

            <h2 style={{
              fontSize: '1.5rem',
              fontWeight: '700',
              color: '#111827',
              marginBottom: '0.5rem'
            }}>
              Client
            </h2>
            <p style={{
              fontSize: '0.95rem',
              color: '#6B7280',
              marginBottom: '1.5rem',
              lineHeight: '1.5'
            }}>
              Find photographers, book sessions, and manage your events
            </p>

            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              color: '#F20C8F',
              fontWeight: '600',
              fontSize: '0.95rem'
            }}>
              <span>Enter Dashboard</span>
              <ArrowRightIcon />
            </div>
          </div>

          {/* Freelancer Card */}
          <div
            onClick={() => handleRoleSelect('freelancer')}
            style={{
              backgroundColor: 'white',
              borderRadius: '1.25rem',
              padding: '2rem',
              cursor: 'pointer',
              border: '2px solid #E5E7EB',
              transition: 'all 0.3s ease',
              position: 'relative',
              overflow: 'hidden'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = '#10B981';
              e.currentTarget.style.transform = 'translateY(-4px)';
              e.currentTarget.style.boxShadow = '0 20px 40px -12px rgba(16, 185, 129, 0.2)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = '#E5E7EB';
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            <div style={{
              width: '80px',
              height: '80px',
              borderRadius: '1rem',
              background: 'linear-gradient(135deg, #ECFDF5 0%, #D1FAE5 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1.5rem auto',
              color: '#10B981'
            }}>
              <FreelancerIcon />
            </div>

            <h2 style={{
              fontSize: '1.5rem',
              fontWeight: '700',
              color: '#111827',
              marginBottom: '0.5rem'
            }}>
              Freelancer
            </h2>
            <p style={{
              fontSize: '0.95rem',
              color: '#6B7280',
              marginBottom: '1.5rem',
              lineHeight: '1.5'
            }}>
              Self-employed photographer managing your own bookings and clients
            </p>

            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              color: '#10B981',
              fontWeight: '600',
              fontSize: '0.95rem'
            }}>
              <span>Enter Dashboard</span>
              <ArrowRightIcon />
            </div>
          </div>
        </div>

        {/* Footer Text */}
        <p style={{
          marginTop: '3rem',
          fontSize: '0.85rem',
          color: '#9CA3AF'
        }}>
          Connect with the best photography professionals on Amoria
        </p>
      </div>
    </div>
  );
}
