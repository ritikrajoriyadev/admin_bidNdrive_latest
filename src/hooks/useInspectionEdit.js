import { useState, useCallback } from 'react';
import axios from 'axios';

const API = import.meta.env.VITE_API_URL;
const authHeader = () => ({ Authorization: `Bearer ${ localStorage.getItem('adminToken')}` });

/**
 * Central hook for all inspection section edits.
 * Returns per-section { saving, error, save } helpers.
 */
export function useInspectionEdit(enquiryId, onSuccess) {
  const [saving, setSaving] = useState({});
  const [errors, setErrors] = useState({});

  const saveSection = useCallback(async (section, formData) => {
    setSaving(prev => ({ ...prev, [section]: true }));
    setErrors(prev => ({ ...prev, [section]: null }));
    try {
      const endpoint = {
        'car-details':                `${API}/api/cj/assigned-enquiries/${enquiryId}/car-details`,
        'exterior-tyres':             `${API}/api/cj/assigned-enquiries/${enquiryId}/exterior-tyres`,
        'electricals-interior':       `${API}/api/cj/assigned-enquiries/${enquiryId}/electricals-interior`,
        'engine-transmission':        `${API}/api/cj/assigned-enquiries/${enquiryId}/engine-transmission`,
        'steering-suspension-brakes': `${API}/api/cj/assigned-enquiries/${enquiryId}/steering-suspension-brakes`,
        'air-conditioning':           `${API}/api/cj/assigned-enquiries/${enquiryId}/air-conditioning`,
      }[section];

      if (!endpoint) throw new Error(`Unknown section: ${section}`);

      await axios.put(endpoint, formData, {
        headers: {
          ...authHeader(),
          'Content-Type': 'multipart/form-data',
        },
      });
      onSuccess?.(section);
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Save failed';
      setErrors(prev => ({ ...prev, [section]: msg }));
      throw err;
    } finally {
      setSaving(prev => ({ ...prev, [section]: false }));
    }
  }, [enquiryId, onSuccess]);

  return { saving, errors, saveSection };
}

/** Build a FormData from a plain object (supports nested objects via JSON stringify for non-file keys) */
export function buildFormData(obj, files = {}) {
  const fd = new FormData();

  const appendVal = (key, val) => {
    if (val === undefined || val === null) return;
    if (typeof val === 'boolean') { fd.append(key, String(val)); return; }
    if (typeof val === 'object' && !Array.isArray(val)) {
      fd.append(key, JSON.stringify(val)); return;
    }
    if (Array.isArray(val)) {
      val.forEach(v => fd.append(`${key}[]`, typeof v === 'object' ? JSON.stringify(v) : v));
      return;
    }
    fd.append(key, val);
  };

  Object.entries(obj).forEach(([k, v]) => appendVal(k, v));

  // Attach file inputs
  Object.entries(files).forEach(([fieldName, fileList]) => {
    if (!fileList) return;
    const list = Array.isArray(fileList) ? fileList : Array.from(fileList);
    list.forEach(f => fd.append(fieldName, f));
  });

  return fd;
}