import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// Guard localStorage globally and purge old mock users/records cache once so Supabase is 100% authoritative
if (typeof window !== 'undefined' && window.Storage) {
  try {
    const purgeKey = 'websynx_supabase_pure_v1';
    if (!window.localStorage.getItem(purgeKey)) {
      window.localStorage.removeItem('websynx_admin_users');
      window.localStorage.removeItem('seox_admin_users');
      window.localStorage.removeItem('websynx_records');
      window.localStorage.removeItem('seox_records');
      window.localStorage.removeItem('websynx_tasks');
      window.localStorage.removeItem('seox_tasks');
      window.localStorage.removeItem('websynx_persistent_db_v2');
      window.localStorage.removeItem('websynx_persistent_db');
      window.localStorage.setItem(purgeKey, 'true');
    }
  } catch (e) {}

  try {
    const rawRecs = window.localStorage.getItem('websynx_records');
    if (rawRecs && rawRecs.length > 200000) {
      window.localStorage.removeItem('websynx_records');
    }
    const rawDb = window.localStorage.getItem('websynx_persistent_db_v2');
    if (rawDb && rawDb.length > 500000) {
      window.localStorage.removeItem('websynx_persistent_db_v2');
    }
  } catch (e) {}

  const nativeSetItem = window.Storage.prototype.setItem;
  window.Storage.prototype.setItem = function (key, value) {
    try {
      nativeSetItem.call(this, key, value);
    } catch (err) {
      try {
        this.removeItem('websynx_records');
        this.removeItem('seox_records');
        this.removeItem('websynx_persistent_db_v2');
        if (key !== 'websynx_records' && key !== 'websynx_persistent_db_v2') {
          nativeSetItem.call(this, key, value);
        }
      } catch (retryErr) {
        // Never allow QuotaExceededError to crash React
      }
    }
  };
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
