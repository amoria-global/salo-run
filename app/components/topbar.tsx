"use client";

import Image from "next/image";

export default function Topbar() {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingLeft: '1.2rem',
      paddingRight: '1.2rem',
      paddingTop: '0.4rem',
      paddingBottom: '0.4rem',
      backgroundColor: 'white',
      borderRadius: '9999px',
      marginLeft: '1.5rem',
      marginRight: '1.5rem',
      marginTop: '0.75rem',
      marginBottom: '0.75rem',
      border: '1px solid #E5E7EB',
      boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)'
    }}>
      {/* Left side - Dashboard title */}
      <h1 style={{
        fontSize: '1.35rem',
        lineHeight: '1.75rem',
        color: '#4B5563'
      }}>Dashboard</h1>

      {/* Right side - Notification, Bonus, and Profile */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '1rem'
      }}>
        {/* Notification Bell */}
        <div style={{
          position: 'relative',
          cursor: 'pointer'
        }}>
          <i style={{
            fontSize: '1.35rem',
            lineHeight: '1.75rem',
            color: '#374151'
          }} className="bi bi-bell"></i>
          <span style={{
            position: 'absolute',
            top: '-0.55rem',
            right: '-0.45rem',
            backgroundColor: '#EC4899',
            color: 'white',
            fontSize: '15px',
            fontWeight: 'bold',
            borderRadius: '9999px',
            width: '1.3rem',
            height: '1.2rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            9+
          </span>
        </div>

        {/* Bonus */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          <span style={{
            fontSize: '1.12rem',
            lineHeight: '1.5rem',
            fontWeight: '600',
            color: '#111827'
          }}>Bonus:</span>
          <span style={{
            fontSize: '1.15rem',
            lineHeight: '1.5rem',
            fontWeight: '600',
            color: '#083A85'
          }}>$3.00</span>
        </div>

        {/* Profile */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          cursor: 'pointer'
        }}>
          <Image
            src="https://randomuser.me/api/portraits/women/65.jpg"
            alt="Profile"
            width={40}
            height={40}
            style={{
              borderRadius: '9999px',
              objectFit: 'cover',
              width: '2.5rem',
              height: '2.5rem'
            }}
          />
          <div style={{
            display: 'flex',
            flexDirection: 'column'
          }}>
            <span style={{
              fontSize: '1.12rem',
              lineHeight: '1.5rem',
              fontWeight: '700',
              color: '#083A85'
            }}>Diane Mary</span>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <span style={{
                fontSize: '1rem',
                lineHeight: '1.5rem',
                fontWeight: '600',
                color: '#111827'
              }}>$0.00</span>
              <i style={{
                fontSize: '0.75rem',
                lineHeight: '1rem',
                color: '#374151'
              }} className="bi bi-chevron-down"></i>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
