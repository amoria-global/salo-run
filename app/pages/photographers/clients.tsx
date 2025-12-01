"use client";

import { useState } from 'react';
import Sidebar from '../../components/sidebar';
import Topbar from '../../components/topbar';
import Image from 'next/image';
import Link from 'next/link';

interface Client {
  id: string;
  name: string;
  email: string;
  avatar: string;
  totalProjects: number;
  activeProjects: number;
  totalSpent: number;
  joinDate: string;
  lastActive: string;
  status: 'active' | 'inactive';
  phone?: string;
  location?: string;
}

type FilterType = 'all' | 'active' | 'inactive' | 'recent';
type ViewMode = 'grid' | 'list';

export default function Clients() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [showClientModal, setShowClientModal] = useState(false);

  // Sample clients data
  const [clients] = useState<Client[]>([
    {
      id: '1',
      name: 'Sarah Johnson',
      email: 'sarah.j@email.com',
      avatar: '/avatars/avatar1.jpg',
      totalProjects: 12,
      activeProjects: 3,
      totalSpent: 5400,
      joinDate: '2024-01-15',
      lastActive: '2 hours ago',
      status: 'active',
      phone: '+1 234 567 8900',
      location: 'New York, NY'
    },
    {
      id: '2',
      name: 'Michael Chen',
      email: 'mchen@email.com',
      avatar: '/avatars/avatar2.jpg',
      totalProjects: 8,
      activeProjects: 1,
      totalSpent: 3200,
      joinDate: '2024-02-20',
      lastActive: '1 day ago',
      status: 'active',
      phone: '+1 234 567 8901',
      location: 'San Francisco, CA'
    },
    {
      id: '3',
      name: 'Emily Rodriguez',
      email: 'emily.r@email.com',
      avatar: '/avatars/avatar3.jpg',
      totalProjects: 15,
      activeProjects: 0,
      totalSpent: 7800,
      joinDate: '2023-11-10',
      lastActive: '2 weeks ago',
      status: 'inactive',
      phone: '+1 234 567 8902',
      location: 'Miami, FL'
    },
    {
      id: '4',
      name: 'David Park',
      email: 'dpark@email.com',
      avatar: '/avatars/avatar4.jpg',
      totalProjects: 6,
      activeProjects: 2,
      totalSpent: 2100,
      joinDate: '2024-03-05',
      lastActive: '5 hours ago',
      status: 'active',
      phone: '+1 234 567 8903',
      location: 'Seattle, WA'
    },
    {
      id: '5',
      name: 'Lisa Thompson',
      email: 'lisa.t@email.com',
      avatar: '/avatars/avatar5.jpg',
      totalProjects: 20,
      activeProjects: 4,
      totalSpent: 12500,
      joinDate: '2023-09-01',
      lastActive: '30 mins ago',
      status: 'active',
      phone: '+1 234 567 8904',
      location: 'Austin, TX'
    },
    {
      id: '6',
      name: 'James Wilson',
      email: 'jwilson@email.com',
      avatar: '/avatars/avatar6.jpg',
      totalProjects: 4,
      activeProjects: 0,
      totalSpent: 1800,
      joinDate: '2024-04-12',
      lastActive: '1 month ago',
      status: 'inactive',
      phone: '+1 234 567 8905',
      location: 'Boston, MA'
    }
  ]);

  // Filter clients based on search query and active filter
  const filteredClients = clients.filter(client => {
    const matchesSearch = client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         client.email.toLowerCase().includes(searchQuery.toLowerCase());

    if (activeFilter === 'all') return matchesSearch;
    if (activeFilter === 'active') return matchesSearch && client.status === 'active';
    if (activeFilter === 'inactive') return matchesSearch && client.status === 'inactive';
    if (activeFilter === 'recent') {
      const recentKeywords = ['hours ago', 'mins ago', 'minutes ago'];
      return matchesSearch && recentKeywords.some(keyword => client.lastActive.includes(keyword));
    }

    return matchesSearch;
  });

  const handleClientClick = (client: Client) => {
    setSelectedClient(client);
    setShowClientModal(true);
  };

  const handleCloseModal = () => {
    setShowClientModal(false);
    setSelectedClient(null);
  };

  return (
    <div style={{ display: 'flex', height: '100vh', backgroundColor: '#F9FAFB' }}>
      <Sidebar />

      {/* Main Content */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
      }}>
        <Topbar />

        <main style={{ flex: 1, overflowY: 'auto', padding: '0' }}>
          {/* Header */}
          <div style={{
            padding: '1rem 1.5rem',
            backgroundColor: 'white',
            borderBottom: '1px solid #E5E7EB'
          }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '1rem'
          }}>
            <div>
              <h1 style={{
                fontSize: '1.25rem',
                fontWeight: '700',
                color: '#111827',
                margin: 0,
                marginBottom: '0.25rem'
              }}>Clients</h1>
              <p style={{
                fontSize: '0.75rem',
                color: '#6B7280',
                margin: 0
              }}>Manage your client relationships</p>
            </div>

            {/* View Mode Toggle */}
            <div style={{
              display: 'flex',
              gap: '0.375rem',
              backgroundColor: '#F3F4F6',
              padding: '0.25rem',
              borderRadius: '0.5rem'
            }}>
              <button
                onClick={() => setViewMode('grid')}
                style={{
                  padding: '0.375rem 0.625rem',
                  borderRadius: '0.375rem',
                  border: 'none',
                  backgroundColor: viewMode === 'grid' ? 'white' : 'transparent',
                  color: viewMode === 'grid' ? '#083A85' : '#6B7280',
                  fontSize: '0.75rem',
                  fontWeight: '500',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.375rem'
                }}
              >
                <i className="bi bi-grid-3x3-gap" style={{ fontSize: '0.875rem' }}></i>
                Grid
              </button>
              <button
                onClick={() => setViewMode('list')}
                style={{
                  padding: '0.375rem 0.625rem',
                  borderRadius: '0.375rem',
                  border: 'none',
                  backgroundColor: viewMode === 'list' ? 'white' : 'transparent',
                  color: viewMode === 'list' ? '#083A85' : '#6B7280',
                  fontSize: '0.75rem',
                  fontWeight: '500',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.375rem'
                }}
              >
                <i className="bi bi-list-ul" style={{ fontSize: '0.875rem' }}></i>
                List
              </button>
            </div>
          </div>

          {/* Search Bar */}
          <div style={{ position: 'relative', display: 'flex', gap: '0.5rem', marginBottom: '0.75rem' }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <i className="bi bi-search" style={{
                position: 'absolute',
                left: '1rem',
                top: '50%',
                transform: 'translateY(-50%)',
                color: '#6B7280',
                fontSize: '1rem'
              }}></i>
              <input
                type="text"
                placeholder="Search clients by name or email"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.625rem 0.875rem 0.625rem 2.5rem',
                  border: '2px solid #D1D5DB',
                  borderRadius: '0.5rem',
                  fontSize: '0.875rem',
                  outline: 'none',
                  transition: 'all 0.2s',
                  backgroundColor: 'white',
                  color: '#111827',
                  fontWeight: '400'
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = '#083A85';
                  e.currentTarget.style.boxShadow = '0 0 0 3px rgba(8, 58, 133, 0.1)';
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = '#D1D5DB';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              />
            </div>
            <button style={{
              width: '42px',
              height: '42px',
              borderRadius: '0.5rem',
              border: '2px solid #D1D5DB',
              backgroundColor: 'white',
              color: '#6B7280',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#F3F4F6';
              e.currentTarget.style.color = '#111827';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'white';
              e.currentTarget.style.color = '#6B7280';
            }}>
              <i className="bi bi-sliders" style={{ fontSize: '1.125rem' }}></i>
            </button>
          </div>

          {/* Filter Buttons */}
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            {(['all', 'active', 'inactive', 'recent'] as FilterType[]).map((filter) => (
              <button
                key={filter}
                onClick={() => setActiveFilter(filter)}
                style={{
                  padding: '0.375rem 0.75rem',
                  borderRadius: '0.5rem',
                  border: `1px solid ${activeFilter === filter ? '#083A85' : '#D1D5DB'}`,
                  backgroundColor: activeFilter === filter ? '#083A85' : 'white',
                  color: activeFilter === filter ? 'white' : '#6B7280',
                  fontSize: '0.75rem',
                  fontWeight: '500',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  textTransform: 'capitalize'
                }}
                onMouseEnter={(e) => {
                  if (activeFilter !== filter) {
                    e.currentTarget.style.backgroundColor = '#F3F4F6';
                  }
                }}
                onMouseLeave={(e) => {
                  if (activeFilter !== filter) {
                    e.currentTarget.style.backgroundColor = 'white';
                  }
                }}
              >
                {filter === 'all' ? 'All Clients' : filter}
              </button>
            ))}
          </div>
        </div>

        {/* Clients Grid/List */}
        <div style={{
          flex: 1,
          overflow: 'auto',
          padding: '1.5rem',
          backgroundColor: '#F9FAFB'
        }}>
          {viewMode === 'grid' ? (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
              gap: '1rem'
            }}>
              {filteredClients.map((client) => (
                <div
                  key={client.id}
                  onClick={() => handleClientClick(client)}
                  style={{
                    backgroundColor: 'white',
                    borderRadius: '0.75rem',
                    padding: '1rem',
                    border: '1px solid #E5E7EB',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)';
                    e.currentTarget.style.borderColor = '#083A85';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.boxShadow = 'none';
                    e.currentTarget.style.borderColor = '#E5E7EB';
                  }}
                >
                  {/* Client Header */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
                    <div style={{
                      width: '48px',
                      height: '48px',
                      borderRadius: '50%',
                      backgroundColor: '#083A85',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                      fontSize: '1rem',
                      fontWeight: '600'
                    }}>
                      {client.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <h3 style={{
                        fontSize: '0.875rem',
                        fontWeight: '600',
                        color: '#111827',
                        margin: 0,
                        marginBottom: '0.125rem',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}>{client.name}</h3>
                      <p style={{
                        fontSize: '0.6875rem',
                        color: '#6B7280',
                        margin: 0,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}>{client.email}</p>
                    </div>
                    <div style={{
                      padding: '0.25rem 0.5rem',
                      borderRadius: '0.375rem',
                      backgroundColor: client.status === 'active' ? '#D1FAE5' : '#FEE2E2',
                      fontSize: '0.625rem',
                      fontWeight: '600',
                      color: client.status === 'active' ? '#065F46' : '#991B1B',
                      textTransform: 'capitalize'
                    }}>
                      {client.status}
                    </div>
                  </div>

                  {/* Stats */}
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(2, 1fr)',
                    gap: '0.5rem',
                    marginBottom: '0.75rem'
                  }}>
                    <div style={{
                      backgroundColor: '#F9FAFB',
                      padding: '0.5rem',
                      borderRadius: '0.5rem'
                    }}>
                      <p style={{
                        fontSize: '0.625rem',
                        color: '#6B7280',
                        margin: 0,
                        marginBottom: '0.125rem'
                      }}>Total Projects</p>
                      <p style={{
                        fontSize: '0.875rem',
                        fontWeight: '700',
                        color: '#111827',
                        margin: 0
                      }}>{client.totalProjects}</p>
                    </div>
                    <div style={{
                      backgroundColor: '#F9FAFB',
                      padding: '0.5rem',
                      borderRadius: '0.5rem'
                    }}>
                      <p style={{
                        fontSize: '0.625rem',
                        color: '#6B7280',
                        margin: 0,
                        marginBottom: '0.125rem'
                      }}>Active</p>
                      <p style={{
                        fontSize: '0.875rem',
                        fontWeight: '700',
                        color: '#083A85',
                        margin: 0
                      }}>{client.activeProjects}</p>
                    </div>
                  </div>

                  {/* Total Spent */}
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '0.75rem'
                  }}>
                    <span style={{
                      fontSize: '0.625rem',
                      color: '#6B7280'
                    }}>Total Spent</span>
                    <span style={{
                      fontSize: '0.875rem',
                      fontWeight: '700',
                      color: '#111827'
                    }}>${client.totalSpent.toLocaleString()}</span>
                  </div>

                  {/* Last Active */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.375rem',
                    marginBottom: '0.75rem'
                  }}>
                    <i className="bi bi-clock" style={{ fontSize: '0.75rem', color: '#6B7280' }}></i>
                    <span style={{
                      fontSize: '0.6875rem',
                      color: '#6B7280'
                    }}>Last active {client.lastActive}</span>
                  </div>

                  {/* Action Buttons */}
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <Link
                      href={`/user/photographers/inbox?client=${encodeURIComponent(client.name)}`}
                      onClick={(e) => {
                        e.stopPropagation();
                      }}
                      style={{
                        flex: 1,
                        padding: '0.5rem',
                        borderRadius: '0.5rem',
                        border: '1px solid #083A85',
                        backgroundColor: '#083A85',
                        color: 'white',
                        fontSize: '0.75rem',
                        fontWeight: '500',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.375rem',
                        textDecoration: 'none'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#062D6B';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = '#083A85';
                      }}
                    >
                      <i className="bi bi-chat-dots" style={{ fontSize: '0.875rem' }}></i>
                      Message
                    </Link>
                    <Link
                      href="/user/photographers/gallery"
                      onClick={(e) => {
                        e.stopPropagation();
                      }}
                      style={{
                        flex: 1,
                        padding: '0.5rem',
                        borderRadius: '0.5rem',
                        border: '1px solid #D1D5DB',
                        backgroundColor: 'white',
                        color: '#6B7280',
                        fontSize: '0.75rem',
                        fontWeight: '500',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.375rem',
                        textDecoration: 'none'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#F3F4F6';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'white';
                      }}
                    >
                      <i className="bi bi-image" style={{ fontSize: '0.875rem' }}></i>
                      Gallery
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* List View */
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {filteredClients.map((client) => (
                <div
                  key={client.id}
                  onClick={() => handleClientClick(client)}
                  style={{
                    backgroundColor: 'white',
                    borderRadius: '0.5rem',
                    padding: '0.875rem 1rem',
                    border: '1px solid #E5E7EB',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1rem'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#F9FAFB';
                    e.currentTarget.style.borderColor = '#083A85';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'white';
                    e.currentTarget.style.borderColor = '#E5E7EB';
                  }}
                >
                  {/* Avatar */}
                  <div style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    backgroundColor: '#083A85',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    flexShrink: 0
                  }}>
                    {client.name.split(' ').map(n => n[0]).join('')}
                  </div>

                  {/* Name & Email */}
                  <div style={{ flex: '1 1 200px', minWidth: 0 }}>
                    <h3 style={{
                      fontSize: '0.875rem',
                      fontWeight: '600',
                      color: '#111827',
                      margin: 0,
                      marginBottom: '0.125rem',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}>{client.name}</h3>
                    <p style={{
                      fontSize: '0.6875rem',
                      color: '#6B7280',
                      margin: 0,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}>{client.email}</p>
                  </div>

                  {/* Stats */}
                  <div style={{ flex: '0 0 100px', textAlign: 'center' }}>
                    <p style={{
                      fontSize: '0.75rem',
                      fontWeight: '700',
                      color: '#111827',
                      margin: 0,
                      marginBottom: '0.125rem'
                    }}>{client.totalProjects}</p>
                    <p style={{
                      fontSize: '0.625rem',
                      color: '#6B7280',
                      margin: 0
                    }}>Projects</p>
                  </div>

                  <div style={{ flex: '0 0 100px', textAlign: 'center' }}>
                    <p style={{
                      fontSize: '0.75rem',
                      fontWeight: '700',
                      color: '#083A85',
                      margin: 0,
                      marginBottom: '0.125rem'
                    }}>{client.activeProjects}</p>
                    <p style={{
                      fontSize: '0.625rem',
                      color: '#6B7280',
                      margin: 0
                    }}>Active</p>
                  </div>

                  <div style={{ flex: '0 0 120px', textAlign: 'center' }}>
                    <p style={{
                      fontSize: '0.75rem',
                      fontWeight: '700',
                      color: '#111827',
                      margin: 0,
                      marginBottom: '0.125rem'
                    }}>${client.totalSpent.toLocaleString()}</p>
                    <p style={{
                      fontSize: '0.625rem',
                      color: '#6B7280',
                      margin: 0
                    }}>Total Spent</p>
                  </div>

                  {/* Status */}
                  <div style={{ flex: '0 0 80px', textAlign: 'center' }}>
                    <div style={{
                      display: 'inline-block',
                      padding: '0.25rem 0.5rem',
                      borderRadius: '0.375rem',
                      backgroundColor: client.status === 'active' ? '#D1FAE5' : '#FEE2E2',
                      fontSize: '0.625rem',
                      fontWeight: '600',
                      color: client.status === 'active' ? '#065F46' : '#991B1B',
                      textTransform: 'capitalize'
                    }}>
                      {client.status}
                    </div>
                  </div>

                  {/* Actions */}
                  <div style={{ flex: '0 0 auto', display: 'flex', gap: '0.375rem' }}>
                    <Link
                      href={`/user/photographers/inbox?client=${encodeURIComponent(client.name)}`}
                      onClick={(e) => {
                        e.stopPropagation();
                      }}
                      style={{
                        padding: '0.375rem 0.625rem',
                        borderRadius: '0.375rem',
                        border: '1px solid #083A85',
                        backgroundColor: '#083A85',
                        color: 'white',
                        fontSize: '0.75rem',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        textDecoration: 'none',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#062D6B';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = '#083A85';
                      }}
                    >
                      <i className="bi bi-chat-dots"></i>
                    </Link>
                    <Link
                      href="/user/photographers/gallery"
                      onClick={(e) => {
                        e.stopPropagation();
                      }}
                      style={{
                        padding: '0.375rem 0.625rem',
                        borderRadius: '0.375rem',
                        border: '1px solid #D1D5DB',
                        backgroundColor: 'white',
                        color: '#6B7280',
                        fontSize: '0.75rem',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        textDecoration: 'none',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#F3F4F6';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'white';
                      }}
                    >
                      <i className="bi bi-image"></i>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Empty State */}
          {filteredClients.length === 0 && (
            <div style={{
              textAlign: 'center',
              padding: '3rem 1rem',
              color: '#6B7280'
            }}>
              <i className="bi bi-people" style={{ fontSize: '3rem', marginBottom: '1rem', display: 'block' }}></i>
              <h3 style={{
                fontSize: '1rem',
                fontWeight: '600',
                color: '#111827',
                marginBottom: '0.5rem'
              }}>No clients found</h3>
              <p style={{ fontSize: '0.875rem' }}>
                {searchQuery ? 'Try adjusting your search query' : 'Your clients will appear here'}
              </p>
            </div>
          )}
        </div>
        </main>
      </div>

      {/* Client Detail Modal */}
      {showClientModal && selectedClient && (
        <div
          onClick={handleCloseModal}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '1rem'
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundColor: 'white',
              borderRadius: '0.75rem',
              width: '100%',
              maxWidth: '500px',
              maxHeight: '90vh',
              overflow: 'auto'
            }}
          >
            {/* Modal Header */}
            <div style={{
              padding: '1.25rem',
              borderBottom: '1px solid #E5E7EB',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <h2 style={{
                fontSize: '1.125rem',
                fontWeight: '700',
                color: '#111827',
                margin: 0
              }}>Client Details</h2>
              <button
                onClick={handleCloseModal}
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '0.375rem',
                  border: 'none',
                  backgroundColor: 'transparent',
                  color: '#6B7280',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#F3F4F6';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                <i className="bi bi-x-lg" style={{ fontSize: '1rem' }}></i>
              </button>
            </div>

            {/* Modal Content */}
            <div style={{ padding: '1.25rem' }}>
              {/* Client Info */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '1rem',
                marginBottom: '1.5rem'
              }}>
                <div style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '50%',
                  backgroundColor: '#083A85',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontSize: '1.5rem',
                  fontWeight: '600',
                  flexShrink: 0
                }}>
                  {selectedClient.name.split(' ').map(n => n[0]).join('')}
                </div>
                <div style={{ flex: 1 }}>
                  <h3 style={{
                    fontSize: '1.125rem',
                    fontWeight: '700',
                    color: '#111827',
                    margin: 0,
                    marginBottom: '0.25rem'
                  }}>{selectedClient.name}</h3>
                  <p style={{
                    fontSize: '0.875rem',
                    color: '#6B7280',
                    margin: 0,
                    marginBottom: '0.375rem'
                  }}>{selectedClient.email}</p>
                  <div style={{
                    display: 'inline-block',
                    padding: '0.25rem 0.625rem',
                    borderRadius: '0.375rem',
                    backgroundColor: selectedClient.status === 'active' ? '#D1FAE5' : '#FEE2E2',
                    fontSize: '0.6875rem',
                    fontWeight: '600',
                    color: selectedClient.status === 'active' ? '#065F46' : '#991B1B',
                    textTransform: 'capitalize'
                  }}>
                    {selectedClient.status}
                  </div>
                </div>
              </div>

              {/* Contact Info */}
              <div style={{ marginBottom: '1.5rem' }}>
                <h4 style={{
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  color: '#111827',
                  marginBottom: '0.75rem'
                }}>Contact Information</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                    <i className="bi bi-telephone" style={{ fontSize: '0.875rem', color: '#6B7280', width: '1rem' }}></i>
                    <span style={{ fontSize: '0.8125rem', color: '#374151' }}>{selectedClient.phone || 'Not provided'}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                    <i className="bi bi-geo-alt" style={{ fontSize: '0.875rem', color: '#6B7280', width: '1rem' }}></i>
                    <span style={{ fontSize: '0.8125rem', color: '#374151' }}>{selectedClient.location || 'Not provided'}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                    <i className="bi bi-calendar" style={{ fontSize: '0.875rem', color: '#6B7280', width: '1rem' }}></i>
                    <span style={{ fontSize: '0.8125rem', color: '#374151' }}>Joined {new Date(selectedClient.joinDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                    <i className="bi bi-clock" style={{ fontSize: '0.875rem', color: '#6B7280', width: '1rem' }}></i>
                    <span style={{ fontSize: '0.8125rem', color: '#374151' }}>Last active {selectedClient.lastActive}</span>
                  </div>
                </div>
              </div>

              {/* Stats Grid */}
              <div style={{ marginBottom: '1.5rem' }}>
                <h4 style={{
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  color: '#111827',
                  marginBottom: '0.75rem'
                }}>Statistics</h4>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, 1fr)',
                  gap: '0.75rem'
                }}>
                  <div style={{
                    backgroundColor: '#F9FAFB',
                    padding: '0.75rem',
                    borderRadius: '0.5rem',
                    textAlign: 'center'
                  }}>
                    <p style={{
                      fontSize: '1.25rem',
                      fontWeight: '700',
                      color: '#111827',
                      margin: 0,
                      marginBottom: '0.25rem'
                    }}>{selectedClient.totalProjects}</p>
                    <p style={{
                      fontSize: '0.6875rem',
                      color: '#6B7280',
                      margin: 0
                    }}>Total Projects</p>
                  </div>
                  <div style={{
                    backgroundColor: '#DBEAFE',
                    padding: '0.75rem',
                    borderRadius: '0.5rem',
                    textAlign: 'center'
                  }}>
                    <p style={{
                      fontSize: '1.25rem',
                      fontWeight: '700',
                      color: '#083A85',
                      margin: 0,
                      marginBottom: '0.25rem'
                    }}>{selectedClient.activeProjects}</p>
                    <p style={{
                      fontSize: '0.6875rem',
                      color: '#1E40AF',
                      margin: 0
                    }}>Active</p>
                  </div>
                  <div style={{
                    backgroundColor: '#F9FAFB',
                    padding: '0.75rem',
                    borderRadius: '0.5rem',
                    textAlign: 'center'
                  }}>
                    <p style={{
                      fontSize: '1rem',
                      fontWeight: '700',
                      color: '#111827',
                      margin: 0,
                      marginBottom: '0.25rem'
                    }}>${selectedClient.totalSpent.toLocaleString()}</p>
                    <p style={{
                      fontSize: '0.6875rem',
                      color: '#6B7280',
                      margin: 0
                    }}>Total Spent</p>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <Link
                  href={`/user/photographers/inbox?client=${encodeURIComponent(selectedClient.name)}`}
                  style={{
                    flex: 1,
                    padding: '0.625rem',
                    borderRadius: '0.5rem',
                    border: 'none',
                    backgroundColor: '#083A85',
                    color: 'white',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                    textDecoration: 'none'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#062D6B';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#083A85';
                  }}
                >
                  <i className="bi bi-chat-dots" style={{ fontSize: '1rem' }}></i>
                  Send Message
                </Link>
                <Link
                  href="/user/photographers/gallery"
                  style={{
                    flex: 1,
                    padding: '0.625rem',
                    borderRadius: '0.5rem',
                    border: '1px solid #D1D5DB',
                    backgroundColor: 'white',
                    color: '#374151',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                    textDecoration: 'none'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#F3F4F6';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'white';
                  }}
                >
                  <i className="bi bi-image" style={{ fontSize: '1rem' }}></i>
                  View Gallery
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
