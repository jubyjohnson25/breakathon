import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Alert, AlertDescription } from './ui/alert';
import { CheckCircle, XCircle, Upload, FileText, Lock } from 'lucide-react';
import { fetchParticipants, addParticipant, submitTask } from '../lib/api';

// Define the structure of your treasure hunt
const QUESTS = {
  quest1: {
    id: 'quest1',
    name: 'Quest 1: The Beginning',
    description: 'Start your journey with these initial challenges.',
    tasks: [
      {
        id: 1,
        name: 'Team Photo Challenge',
        description: 'Take a creative team photo at the starting point.',
        acceptedFiles: 'image/*',
        hint: 'Make sure everyone in your team is visible and looking their best!'
      },
      {
        id: 2,
        name: 'Location Puzzle',
        description: 'Find the hidden QR code and submit a screenshot of what you discover.',
        acceptedFiles: 'image/*',
        hint: 'Look for unusual patterns or markings in the area'
      },
      {
        id: 3,
        name: 'Riddle Solution',
        description: 'Solve the provided riddle and submit your answer with explanation.',
        acceptedFiles: '.pdf,.doc,.docx',
        hint: 'The answer might be hiding in plain sight'
      }
    ]
  },
  quest2: {
    id: 'quest2',
    name: 'Quest 2: The Advanced Challenge',
    description: 'More challenging tasks await those who completed Quest 1.',
    tasks: [
      {
        id: 4,
        name: 'Video Challenge',
        description: 'Create a 30-second video completing the specified task.',
        acceptedFiles: 'video/*',
        hint: 'Be creative but keep it brief!'
      },
      {
        id: 5,
        name: 'Mystery Box',
        description: 'Document what you find in the mystery box and explain its significance.',
        acceptedFiles: '.pdf,.doc,.docx',
        hint: 'Every item in the box might be important'
      },
      {
        id: 6,
        name: 'Final Presentation',
        description: 'Compile all your findings into a final presentation.',
        acceptedFiles: '.pdf,.ppt,.pptx',
        hint: 'Connect the dots between all previous tasks'
      }
    ]
  }
};

export default function TreasureHuntTracker() {
  const [participants, setParticipants] = useState([]);
  const [newParticipantName, setNewParticipantName] = useState('');
  const [activeQuest, setActiveQuest] = useState('quest1');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load participants when component mounts
  useEffect(() => {
    loadParticipants();
  }, []);

  async function loadParticipants() {
    try {
      setLoading(true);
      const data = await fetchParticipants();
      setParticipants(data);
      setError(null);
    } catch (err) {
      setError('Failed to load participants. Please refresh the page.');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleAddParticipant() {
    if (!newParticipantName.trim()) return;

    try {
      await addParticipant(newParticipantName.trim());
      setNewParticipantName('');
      loadParticipants(); // Refresh the list
    } catch (err) {
      setError('Failed to add participant. Please try again.');
      console.error('Error:', err);
    }
  }

  async function handleFileSubmission(participantId, questId, taskId, file) {
    try {
      await submitTask(file, participantId, questId, taskId);
      loadParticipants(); // Refresh the list
    } catch (err) {
      setError('Failed to submit task. Please try again.');
      console.error('Error:', err);
    }
  }

  function calculateQuestProgress(participant, questId) {
    const questTasks = QUESTS[questId].tasks;
    const completedTasks = questTasks.filter(task => 
      participant.submissions?.some(s => s.task_id === task.id)
    ).length;
    return Math.round((completedTasks / questTasks.length) * 100);
  }

  function isQuestLocked(participant, questId) {
    if (questId === 'quest1') return false;
    const quest1Progress = calculateQuestProgress(participant, 'quest1');
    return quest1Progress < 100;
  }

  return (
    <div className="w-full max-w-4xl mx-auto p-4 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Treasure Hunt Progress Tracker</CardTitle>
          <CardDescription>Complete tasks, submit evidence, and track your progress!</CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Participant registration section */}
          <div className="flex gap-4 mb-6">
            <Input
              type="text"
              placeholder="Enter participant name"
              value={newParticipantName}
              onChange={(e) => setNewParticipantName(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleAddParticipant()}
              className="flex-grow"
            />
            <Button onClick={handleAddParticipant}>Join Hunt</Button>
          </div>

          {/* Quest selection buttons */}
          <div className="flex gap-4 mb-6">
            {Object.values(QUESTS).map(quest => (
              <Button
                key={quest.id}
                variant={activeQuest === quest.id ? "default" : "outline"}
                onClick={() => setActiveQuest(quest.id)}
                className="flex-1"
              >
                {quest.name}
              </Button>
            ))}
          </div>

          {/* Loading state */}
          {loading ? (
            <div className="text-center py-4">Loading participants...</div>
          ) : (
            /* Participant cards section */
            <div className="space-y-6">
              {participants.map(participant => (
                <Card key={participant.id} className="p-4">
                  {/* Participant header with name and progress */}
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold">{participant.name}</h3>
                      <p className="text-sm text-gray-500">
                        Joined: {new Date(participant.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <Badge variant="secondary">
                      Quest Progress: {calculateQuestProgress(participant, activeQuest)}%
                    </Badge>
                  </div>

                  {/* Quest locked message or tasks list */}
                  {isQuestLocked(participant, activeQuest) ? (
                    <Alert className="mb-4">
                      <Lock className="w-4 h-4 mr-2" />
                      <AlertDescription>
                        Complete Quest 1 to unlock this quest!
                      </AlertDescription>
                    </Alert>
                  ) : (
                    <div className="space-y-4">
                      {QUESTS[activeQuest].tasks.map(task => (
                        <div key={task.id} className="border rounded-lg p-4">
                          {/* Task header with name and status */}
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <h4 className="font-medium">{task.name}</h4>
                              <p className="text-sm text-gray-600">{task.description}</p>
                              <p className="text-sm text-gray-500 mt-1">💡 Hint: {task.hint}</p>
                            </div>
                            <Badge 
                              variant={participant.submissions?.some(s => s.task_id === task.id) ? "success" : "secondary"}
                              className="flex items-center gap-2"
                            >
                              {participant.submissions?.some(s => s.task_id === task.id) ? (
                                <>
                                  <CheckCircle className="w-4 h-4" />
                                  Completed
                                </>
                              ) : (
                                <>
                                  <XCircle className="w-4 h-4" />
                                  Pending
                                </>
                              )}
                            </Badge>
                          </div>
                          
                          {/* File submission section */}
                          <div className="mt-2">
                            {participant.submissions?.some(s => s.task_id === task.id) ? (
                              <div className="flex items-center gap-2 text-sm text-gray-600">
                                <FileText className="w-4 h-4" />
                                {
                                  participant.submissions.find(s => s.task_id === task.id).file_name
                                }
                                <span className="text-xs">
                                  ({new Date(participant.submissions.find(s => s.task_id === task.id).submitted_at).toLocaleString()})
                                </span>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2">
                                <Input
                                  type="file"
                                  accept={task.acceptedFiles}
                                  onChange={(e) => handleFileSubmission(
                                    participant.id,
                                    activeQuest,
                                    task.id,
                                    e.target.files[0]
                                  )}
                                  className="hidden"
                                  id={`file-${participant.id}-${task.id}`}
                                />
                                <Button
                                  variant="outline"
                                  onClick={() => document.getElementById(`file-${participant.id}-${task.id}`).click()}
                                  className="w-full"
                                >
                                  <Upload className="w-4 h-4 mr-2" />
                                  Upload Submission
                                </Button>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}