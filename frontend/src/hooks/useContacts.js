import { useState, useEffect, useCallback } from 'react';
import { contactsAPI } from '../api';

export function useContacts() {
  const [contacts,   setContacts]   = useState([]);
  const [stats,      setStats]      = useState({ total: 0, withEmail: 0, withPhone: 0, withLinkedin: 0 });
  const [loading,    setLoading]    = useState(false);
  const [error,      setError]      = useState(null);
  const [pagination, setPagination] = useState({ page: 1, limit: 25, total: 0, totalPages: 0 });

  // Committed filters — what was actually last searched/applied
  const [filters, setFilters] = useState({
    user:        'all',
    search:      '',
    location:    'all',
    contact:     'all',
    preference:  [],
    company:     '',
    designation: '',
  });

  // Draft search text — what user is currently typing (not yet submitted)
  const [searchDraft, setSearchDraft] = useState('');

  const fetchContacts = useCallback(async (overrideFilters, overridePage, overrideLimit) => {
    setLoading(true);
    setError(null);
    try {
      const f     = overrideFilters || filters;
      const page  = overridePage    || 1;
      const limit = overrideLimit   || pagination.limit;

      const params = {
        user:        f.user,
        search:      f.search,
        location:    f.location,
        contact:     f.contact,
        preference:  (f.preference || []).join(','),
        company:     f.company,
        designation: f.designation,
        page,
        limit,
      };

      const [contactsRes, statsRes] = await Promise.all([
        contactsAPI.getAll(params),
        contactsAPI.getStats({ user: f.user }),
      ]);

      setContacts(contactsRes.data.data);
      setPagination({
        page,
        limit,
        total:      contactsRes.data.total,
        totalPages: contactsRes.data.totalPages,
      });
      setStats(statsRes.data);
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    } finally {
      setLoading(false);
    }
  }, [filters, pagination.limit]);

  // Called when user updates non-search filters (dropdowns, checkboxes)
  // These fire immediately on change
  const updateFilters = useCallback((newFilters) => {
    // If search is being updated, only update the draft — don't trigger fetch
    if ('search' in newFilters) {
      setSearchDraft(newFilters.search);
      return;
    }
    // For all other filters, commit and fetch immediately
    const merged = { ...filters, ...newFilters };
    setFilters(merged);
    fetchContacts(merged, 1, pagination.limit);
  }, [filters, fetchContacts, pagination.limit]);

  // Called when user presses Enter or clicks the search button
  const submitSearch = useCallback(() => {
    const merged = { ...filters, search: searchDraft };
    setFilters(merged);
    fetchContacts(merged, 1, pagination.limit);
  }, [filters, searchDraft, fetchContacts, pagination.limit]);

  const goToPage = useCallback((page) => {
    setPagination(prev => ({ ...prev, page }));
    fetchContacts(filters, page, pagination.limit);
  }, [filters, fetchContacts, pagination.limit]);

  const setLimit = useCallback((limit) => {
    fetchContacts(filters, 1, limit);
  }, [filters, fetchContacts]);

  // Initial load
  useEffect(() => {
    fetchContacts();
    // eslint-disable-next-line
  }, []);

  return {
    contacts, stats, loading, error,
    filters,
    searchDraft, setSearchDraft,
    updateFilters, submitSearch,
    pagination, goToPage, setLimit,
    refresh: () => fetchContacts(filters, pagination.page, pagination.limit),
  };
}
