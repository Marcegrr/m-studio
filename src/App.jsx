import React, { useEffect } from 'react';
import MStudioClientApp from './components/MStudioClient.jsx';

export default function App() {
  useEffect(() => {
    console.log('App mounted ✅');
  }, []);

  return (
    <div>
      {/* debug banner removed */}
      <MStudioClientApp />
    </div>
  );
}
