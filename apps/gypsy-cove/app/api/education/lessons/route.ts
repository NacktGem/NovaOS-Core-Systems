import { NextRequest, NextResponse } from 'next/server';

interface LessonGenerationRequest {
  subject: string;
  gradeLevel: string;
  topic: string;
  duration?: number; // minutes
  learningObjectives?: string[];
  safetyLevel?: 'all-ages' | 'supervision-recommended' | 'teen-plus';
}

interface LessonStep {
  id: string;
  title: string;
  type: 'reading' | 'activity' | 'quiz' | 'creative';
  content: string;
  completed: boolean;
  timeEstimate: number;
}

interface GeneratedLesson {
  id: string;
  title: string;
  subject: string;
  gradeLevel: string;
  description: string;
  steps: LessonStep[];
  totalTime: number;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  safetyRating: 'all-ages' | 'supervision-recommended' | 'teen-plus';
}

export async function POST(request: NextRequest) {
  try {
    const body: LessonGenerationRequest = await request.json();
    const {
      subject,
      gradeLevel,
      topic,
      duration = 30,
      learningObjectives = [],
      safetyLevel = 'all-ages',
    } = body;

    // Prepare Lyra agent payload for lesson generation
    const lyraPayload = {
      command: 'generate_lesson',
      args: {
        subject,
        grade_level: gradeLevel,
        topic,
        duration_minutes: duration,
        learning_objectives: learningObjectives,
        safety_level: safetyLevel,
        family_friendly: true,
        interactive: true,
      },
    };

    // Call Lyra agent for lesson generation
    const lyraResponse = await fetch(`${process.env.CORE_API_URL}/api/agents/lyra`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        AGENT_SHARED_TOKEN: process.env.AGENT_SHARED_TOKEN || '',
        INTERNAL_TOKEN: process.env.INTERNAL_TOKEN || '',
      },
      body: JSON.stringify(lyraPayload),
    });

    if (!lyraResponse.ok) {
      throw new Error('Failed to generate lesson content');
    }

    const lyraResult = await lyraResponse.json();

    if (!lyraResult.success) {
      throw new Error(lyraResult.error || 'Lesson generation failed');
    }

    // Transform Lyra's response into our lesson format
    const lessonData = lyraResult.output;
    const lessonId = `lesson_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Create lesson steps based on Lyra's content
    const steps: LessonStep[] = [];

    // Introduction step
    steps.push({
      id: `${lessonId}_intro`,
      title: `Introduction to ${topic}`,
      type: 'reading',
      content:
        lessonData.introduction ||
        `Welcome to our lesson on ${topic}! Today we'll explore this fascinating subject together.`,
      completed: false,
      timeEstimate: Math.ceil(duration * 0.15), // 15% of total time
    });

    // Main content steps
    if (lessonData.activities && Array.isArray(lessonData.activities)) {
      lessonData.activities.forEach(
        (
          activity: { title?: string; type?: string; content?: string; description?: string },
          index: number
        ) => {
          steps.push({
            id: `${lessonId}_step_${index + 1}`,
            title: activity.title || `Activity ${index + 1}`,
            type:
              activity.type === 'reading' ||
              activity.type === 'quiz' ||
              activity.type === 'creative'
                ? (activity.type as 'reading' | 'activity' | 'quiz' | 'creative')
                : 'activity',
            content: activity.content || activity.description || 'Complete this learning activity.',
            completed: false,
            timeEstimate: Math.ceil((duration * 0.7) / lessonData.activities.length), // 70% split across activities
          });
        }
      );
    } else {
      // Fallback: create structured steps from content
      const mainContent = lessonData.content || lessonData.lesson_content || '';
      const contentChunks = mainContent.split('\n\n').filter((chunk: string) => chunk.trim());

      contentChunks.forEach((chunk: string, index: number) => {
        if (chunk.trim()) {
          steps.push({
            id: `${lessonId}_content_${index + 1}`,
            title: `Learning Step ${index + 1}`,
            type: index % 2 === 0 ? 'reading' : 'activity',
            content: chunk.trim(),
            completed: false,
            timeEstimate: Math.ceil((duration * 0.7) / contentChunks.length),
          });
        }
      });
    }

    // Assessment/Review step
    steps.push({
      id: `${lessonId}_review`,
      title: 'Review & Assessment',
      type: 'quiz',
      content:
        lessonData.assessment ||
        `Let's review what we learned about ${topic}. Can you explain the key concepts in your own words?`,
      completed: false,
      timeEstimate: Math.ceil(duration * 0.15), // 15% of total time
    });

    // Determine difficulty based on grade level
    const getDifficulty = (grade: string): 'beginner' | 'intermediate' | 'advanced' => {
      const gradeNum = parseInt(grade.replace(/\D/g, ''));
      if (gradeNum <= 3) return 'beginner';
      if (gradeNum <= 8) return 'intermediate';
      return 'advanced';
    };

    const generatedLesson: GeneratedLesson = {
      id: lessonId,
      title: lessonData.title || `${topic} - ${gradeLevel} Level`,
      subject,
      gradeLevel,
      description:
        lessonData.description ||
        `An engaging lesson about ${topic} designed for ${gradeLevel} students.`,
      steps,
      totalTime: duration,
      difficulty: getDifficulty(gradeLevel),
      safetyRating: safetyLevel,
    };

    return NextResponse.json({
      success: true,
      lesson: generatedLesson,
      metadata: {
        generatedAt: new Date().toISOString(),
        lyraVersion: lyraResult.agent_version || '1.0',
        safetyChecked: true,
      },
    });
  } catch (error) {
    console.error('Lesson generation error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to generate lesson',
        fallback: {
          // Provide a basic fallback lesson structure
          id: `fallback_${Date.now()}`,
          title: 'Basic Learning Activity',
          subject: 'General',
          gradeLevel: 'All Ages',
          description: 'A simple learning activity to get started.',
          steps: [
            {
              id: 'fallback_intro',
              title: 'Getting Started',
              type: 'reading' as const,
              content: "Welcome! Let's begin our learning journey together.",
              completed: false,
              timeEstimate: 5,
            },
            {
              id: 'fallback_activity',
              title: 'Main Activity',
              type: 'activity' as const,
              content: 'Try this hands-on activity to explore the topic.',
              completed: false,
              timeEstimate: 20,
            },
            {
              id: 'fallback_review',
              title: 'Review',
              type: 'quiz' as const,
              content: "Let's review what we learned!",
              completed: false,
              timeEstimate: 5,
            },
          ],
          totalTime: 30,
          difficulty: 'beginner' as const,
          safetyRating: 'all-ages' as const,
        },
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  // Return available lesson templates or recent lessons
  const searchParams = request.nextUrl.searchParams;
  const grade = searchParams.get('grade');
  const subject = searchParams.get('subject');

  try {
    // Define popular lesson templates
    const templates = [
      {
        id: 'creative_writing_basics',
        title: 'Creative Writing Adventure',
        subject: 'Language Arts',
        gradeLevel: 'K-5',
        description: "Learn to write exciting stories with Lyra's guidance",
        estimatedTime: 45,
        difficulty: 'beginner',
        safetyRating: 'all-ages',
        tags: ['creative', 'writing', 'storytelling'],
      },
      {
        id: 'herb_garden_science',
        title: 'Herb Garden Science',
        subject: 'Science',
        gradeLevel: '3-8',
        description: 'Explore the science of plants through herbalism',
        estimatedTime: 60,
        difficulty: 'intermediate',
        safetyRating: 'supervision-recommended',
        tags: ['science', 'nature', 'herbalism'],
      },
      {
        id: 'family_history_project',
        title: 'Family History Detective',
        subject: 'Social Studies',
        gradeLevel: 'K-12',
        description: 'Create a family tree and explore your heritage',
        estimatedTime: 90,
        difficulty: 'beginner',
        safetyRating: 'all-ages',
        tags: ['history', 'family', 'research'],
      },
      {
        id: 'nature_art_exploration',
        title: 'Nature Art & Creativity',
        subject: 'Art',
        gradeLevel: 'K-8',
        description: 'Create beautiful art inspired by nature',
        estimatedTime: 40,
        difficulty: 'beginner',
        safetyRating: 'all-ages',
        tags: ['art', 'nature', 'creativity'],
      },
    ];

    // Filter templates based on query parameters
    let filteredTemplates = templates;

    if (subject) {
      filteredTemplates = filteredTemplates.filter((t) =>
        t.subject.toLowerCase().includes(subject.toLowerCase())
      );
    }

    if (grade) {
      // Simple grade level matching
      filteredTemplates = filteredTemplates.filter(
        (t) => t.gradeLevel.includes(grade) || t.gradeLevel === 'K-12'
      );
    }

    return NextResponse.json({
      success: true,
      templates: filteredTemplates,
      totalCount: filteredTemplates.length,
    });
  } catch (error) {
    console.error('Failed to fetch lesson templates:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch lesson templates',
      },
      { status: 500 }
    );
  }
}
