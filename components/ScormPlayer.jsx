'use client';

export default function ScormPlayer({ storagePath, launchFile }) {
  // URL publique du SCORM dans Supabase Storage
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const scormUrl = `${supabaseUrl}/storage/v1/object/public/scorm/${storagePath}/${launchFile}`;

  return (
    <div style={{ width: '100%', height: '80vh' }}>
      <iframe
        src={scormUrl}
        width="100%"
        height="100%"
        style={{ border: 'none' }}
        allow="fullscreen"
        title="SCORM Player"
      />
    </div>
  );
}