import { useState, useEffect } from 'react';

export function useCollection(collectionUrl = '/data/manifests/collection.json') {
  const [collection, setCollection] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch(collectionUrl)
      .then(res => {
        if (!res.ok) throw new Error(`Failed to fetch collection: ${res.status}`);
        return res.json();
      })
      .then(data => {
        setCollection(data);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, [collectionUrl]);

  return { collection, loading, error };
}