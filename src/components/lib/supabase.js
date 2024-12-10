// Handle API requests to Supabase
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Function to fetch participants
export async function fetchParticipants() {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/participants?select=*,submissions(*)`, {
    headers: {
      'apikey': SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
    }
  });
  
  if (!response.ok) throw new Error('Failed to fetch participants');
  return response.json();
}

// Function to add a new participant
export async function addParticipant(name) {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/participants`, {
    method: 'POST',
    headers: {
      'apikey': SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=minimal'
    },
    body: JSON.stringify({ name })
  });
  
  if (!response.ok) throw new Error('Failed to add participant');
  return response.json();
}

// Function to handle file uploads
export async function uploadSubmission(file, participantId, taskId, questId) {
  // First, upload the file to storage
  const fileName = `${participantId}/${questId}/${taskId}/${file.name}`;
  const formData = new FormData();
  formData.append('file', file);
  
  const uploadResponse = await fetch(
    `${SUPABASE_URL}/storage/v1/object/submissions/${fileName}`,
    {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
      },
      body: formData
    }
  );

  if (!uploadResponse.ok) throw new Error('Failed to upload file');

  // Then create the submission record
  const fileUrl = `${SUPABASE_URL}/storage/v1/object/public/submissions/${fileName}`;
  
  const submissionResponse = await fetch(`${SUPABASE_URL}/rest/v1/submissions`, {
    method: 'POST',
    headers: {
      'apikey': SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=minimal'
    },
    body: JSON.stringify({
      participant_id: participantId,
      task_id: taskId,
      quest_id: questId,
      file_name: file.name,
      file_url: fileUrl
    })
  });

  if (!submissionResponse.ok) throw new Error('Failed to record submission');
  return submissionResponse.json();
}