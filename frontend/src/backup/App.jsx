import React, { useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import Header              from './components/Header.jsx';
import Filters             from './components/Filters.jsx';
import StatsBar            from './components/StatsBar.jsx';
import ContactCard         from './components/ContactCard.jsx';
import ContactDetailModal  from './components/ContactDetailModal.jsx';
import EditContactModal     from './components/EditContactModal.jsx';
import AddContactModal      from './components/AddContactModal.jsx';
import AddBrandModal        from './components/AddBrandModal.jsx';
import Pagination           from './components/Pagination.jsx';
import { useContacts }      from './hooks/useContacts.js';
import { contactsAPI }      from './api/index.js';

export default function App() {
  const {
    contacts, stats, loading, error,
    filters, updateFilters,
    pagination, goToPage, setLimit,
    refresh,
  } = useContacts();

  const [viewContact,  setViewContact]  = useState(null);
  const [editContact,  setEditContact]  = useState(null);
  const [showAddContact, setShowAddContact] = useState(false);
  const [showAddBrand,   setShowAddBrand]   = useState(false);

  const handleUpload = useCallback(async (file) => {
    const table = filters.user === 'garima' ? 'garima' : filters.user === 'lms' ? 'lms' : 'garima';
    const formData = new FormData();
    formData.append('file', file);
    formData.append('table', table);
    const tid = toast.loading(`Uploading CSV to "${table}" table...`);
    try {
      const res = await contactsAPI.upload(formData);
      toast.success(`✅ ${res.data.inserted} contacts imported!`, { id: tid });
      refresh();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Upload failed', { id: tid });
    }
  }, [filters.user, refresh]);

  return (
    <div style={{ minHeight: '100vh', background: '#F3F2EF' }}>
      <Header
        filters={filters}
        onFilterChange={updateFilters}
        onAddContact={() => setShowAddContact(true)}
        onAddBrand={() => setShowAddBrand(true)}
        onUpload={handleUpload}
      />

      <Filters filters={filters} onFilterChange={updateFilters} />

      <main style={{ maxWidth: 1200, margin: '0 auto', padding: '0 16px 32px' }}>

        <StatsBar stats={stats} loading={loading} />

        {/* Contact grid */}
        {error ? (
          <div style={{
            textAlign: 'center', padding: '60px 20px',
            background: '#fff', borderRadius: 10, border: '1px solid #E0DFDC',
          }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>⚠️</div>
            <p style={{ color: '#CC1016', fontWeight: 600, marginBottom: 8 }}>Connection Error</p>
            <p style={{ color: '#666', fontSize: 13 }}>{error}</p>
            <button onClick={refresh} className="btn btn-primary" style={{ marginTop: 16 }}>
              Retry
            </button>
          </div>
        ) : loading ? (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(460px, 1fr))',
            gap: 10, marginBottom: 12,
          }}>
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="card" style={{ padding: '16px 18px', height: 100, opacity: 0.5 }}>
                <div style={{ display: 'flex', gap: 14 }}>
                  <div style={{ width: 48, height: 48, borderRadius: '50%', background: '#E0DFDC' }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ height: 14, background: '#E0DFDC', borderRadius: 4, width: '60%', marginBottom: 8 }} />
                    <div style={{ height: 12, background: '#E0DFDC', borderRadius: 4, width: '40%' }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : contacts.length === 0 ? (
          <div style={{
            textAlign: 'center', padding: '80px 20px',
            background: '#fff', borderRadius: 10, border: '1px solid #E0DFDC',
          }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>🔍</div>
            <p style={{ fontWeight: 700, fontSize: 16, marginBottom: 6 }}>No contacts found</p>
            <p style={{ color: '#666', fontSize: 13 }}>Try adjusting your search or filters</p>
          </div>
        ) : (
          <>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(460px, 1fr))',
              gap: 10,
              marginBottom: 12,
            }}>
              {contacts.map(c => (
                <ContactCard
                  key={`${c.source_user}-${c.id}`}
                  contact={c}
                  onView={setViewContact}
                  onEdit={setEditContact}
                />
              ))}
            </div>

            <Pagination
              pagination={pagination}
              onPageChange={goToPage}
              onLimitChange={setLimit}
            />
          </>
        )}
      </main>

      {/* Modals */}
      {viewContact  && <ContactDetailModal contact={viewContact} onClose={() => setViewContact(null)} />}
      {editContact  && <EditContactModal   contact={editContact} onClose={() => setEditContact(null)} onSaved={refresh} />}
      {showAddContact && <AddContactModal  onClose={() => setShowAddContact(false)} onSaved={refresh} />}
      {showAddBrand   && <AddBrandModal    onClose={() => setShowAddBrand(false)} />}
    </div>
  );
}
