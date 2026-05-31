import { useState, useEffect, useCallback, useRef } from 'react';
import { contactsAPI } from '../api';

export function useContacts() {
  const [contacts,   setContacts]   = useState([]);
  const [stats,      setStats]      = useState({ total: 0, withEmail: 0, withPhone: 0, withLinkedin: 0 });
  const [loading,    setLoading]    = useState(false);
  const [error,      setError]      = useState(null);
  const [pagination, setPagination] = useState({ page: 1, limit: 25, total: 0, totalPages: 0 });

  const [filters, setFilters] = useState({
    user:        'all',
    search:      '',
    location:    'all',
    contact:     'all',
    preference:  [],
    company:     '',
    designation: '',
  });

  const debounceRef = useRef(null);

  const fetchContacts = useCallback(async (overrideFilters, overridePage) => {
    setLoading(true);
    setError(null);
    try {
      const f    = overrideFilters || filters;
      const page = overridePage    || pagination.page;

      const params = {
        user:        f.user,
        search:      f.search,
        location:    f.location,
        contact:     f.contact,
        preference:  (f.preference || []).join(','),
        company:     f.company,
        designation: f.designation,
        page,
        limit:       pagination.limit,
      };

      const [contactsRes, statsRes] = await Promise.all([
        contactsAPI.getAll(params),
        contactsAPI.getStats({ user: f.user }),
      ]);

      setContacts(contactsRes.data.data);
      setPagination(prev => ({
        ...prev,
        total:      contactsRes.data.total,
        totalPages: contactsRes.data.totalPages,
        page,
      }));
      setStats(statsRes.data);
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    } finally {
      setLoading(false);
    }
  }, [filters, pagination.page, pagination.limit]);

  // Debounced search
  const updateFilters = useCallback((newFilters) => {
    const merged = { ...filters, ...newFilters };
    setFilters(merged);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      fetchContacts(merged, 1);
      setPagination(prev => ({ ...prev, page: 1 }));
    }, 350);
  }, [filters, fetchContacts]);

  const goToPage = useCallback((page) => {
    setPagination(prev => ({ ...prev, page }));
    fetchContacts(filters, page);
  }, [filters, fetchContacts]);

  const setLimit = useCallback((limit) => {
    setPagination(prev => ({ ...prev, limit, page: 1 }));
    setTimeout(() => fetchContacts(filters, 1), 0);
  }, [filters, fetchContacts]);

  // Initial load
  useEffect(() => {
    fetchContacts();
    // eslint-disable-next-line
  }, []);

  return {
    contacts, stats, loading, error,
    filters, updateFilters,
    pagination, goToPage, setLimit,
    refresh: () => fetchContacts(filters, pagination.page),
  };
}
