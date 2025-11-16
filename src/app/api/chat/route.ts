// src/app/api/chat/route.ts
import { NextResponse } from 'next/server';
import Groq from 'groq-sdk';

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

// Function to call your friends' ML model (when ready)
async function getMLPredictions(building?: string, time?: string, date?: string, preferences?: string[]) {
  try {
    // Replace with your friends' actual ML API endpoint when ready
    const ML_API_URL = process.env.ML_API_URL || 'http://localhost:5000/predict-rooms';
    
    const response = await fetch(ML_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        building,
        time,
        date,
        preferences,
      }),
    });

    if (!response.ok) {
      throw new Error('ML API error');
    }

    return await response.json();
  } catch (error) {
    console.error('ML API error:', error);
    return null;
  }
}

export async function POST(req: Request) {
  try {
    const { messages, rooms, selectedDate, selectedTime } = await req.json();

    // Prepare room context from database
    const roomContext = rooms && rooms.length > 0 
      ? `\n\nCURRENT AVAILABLE ROOMS:\n${rooms.map((r: any) => 
          `- ${r.name} in ${r.building}:
  • Sustainability Score: ${r.sustainabilityScore}/10
  • Cleanliness Score: ${r.cleanlinessScore}/10
  • Energy Efficiency: ${r.energyEfficiency}
  • Features: ${r.features.join(', ')}
  • Available slots: ${r.availableSlots?.join(', ') || 'Check room details'}
  • Current occupancy: ${r.occupancy}`
        ).join('\n\n')}`
      : '';

    // Check if user is asking for room recommendations
    const lastUserMessage = messages[messages.length - 1]?.content?.toLowerCase() || '';
    const isAskingForRooms = 
      lastUserMessage.includes('find') ||
      lastUserMessage.includes('recommend') ||
      lastUserMessage.includes('show') ||
      lastUserMessage.includes('available') ||
      lastUserMessage.includes('need a room') ||
      lastUserMessage.includes('looking for') ||
      lastUserMessage.includes('sustainable') ||
      lastUserMessage.includes('clean') ||
      lastUserMessage.includes('cheap');

    // Try to get ML predictions if user is asking for rooms
    let mlData = null;
    if (isAskingForRooms && selectedDate && selectedTime) {
      // Extract preferences from user message
      const preferences = [];
      if (lastUserMessage.includes('sustainable') || lastUserMessage.includes('green') || lastUserMessage.includes('eco')) {
        preferences.push('sustainable');
      }
      if (lastUserMessage.includes('clean')) {
        preferences.push('clean');
      }
      if (lastUserMessage.includes('cheap') || lastUserMessage.includes('affordable')) {
        preferences.push('cheap');
      }

      // Extract building if mentioned
      let building = undefined;
      if (lastUserMessage.includes('science')) building = 'Science Center';
      if (lastUserMessage.includes('library')) building = 'Library';
      if (lastUserMessage.includes('tech')) building = 'Tech Hub';
      if (lastUserMessage.includes('music')) building = 'Music Building';
      if (lastUserMessage.includes('art')) building = 'Arts Building';

      mlData = await getMLPredictions(building, selectedTime, selectedDate, preferences);
    }

    const systemPrompt = `You are EcoRoom Assistant, an AI helper for Lake Forest College's smart room booking system.

CURRENT BOOKING CONTEXT:
- Selected Date: ${selectedDate || 'NOT SELECTED - Ask user to select a date'}
- Selected Time: ${selectedTime || 'NOT SELECTED - Ask user to select a time'}
${mlData ? `\n\nML MODEL PREDICTIONS:\n${JSON.stringify(mlData, null, 2)}` : ''}
${roomContext}

YOUR ROLE:
You help students find the most sustainable, clean, and energy-efficient rooms on campus. Our ML model predicts room sustainability scores based on:
- Energy efficiency (LED lighting, smart thermostats, solar panels)
- Cleanliness predictions
- Cost efficiency
- Real-time occupancy data

RESPONSE GUIDELINES:

1. **If Date/Time Missing:**
   - Politely ask user to select date and time first
   - Example: "I'd love to help! First, please select a date and time above so I can check which rooms are available."

2. **When Recommending Rooms:**
   - ALWAYS recommend the TOP 2-3 most sustainable options first
   - Explain WHY they're sustainable (mention specific features)
   - Include sustainability score, cleanliness score, and energy rating
   - Mention available time slots
   - Example: "**TECH 150** in the Tech Hub is your best bet! 🌱
     • Sustainability: 9.8/10
     • Features: Smart thermostat, air quality monitor, energy dashboard
     • Available: 9 AM, 11 AM, 1 PM, 3 PM, 5 PM"

3. **Building-Specific Requests:**
   - If user mentions a building, focus on rooms in that building
   - Compare rooms within that building

4. **Features to Highlight:**
   - Solar panels = top sustainability
   - Smart thermostats = energy efficient
   - LED lighting = low energy usage
   - Motion sensors = prevents energy waste
   - Air quality monitors = healthy environment

5. **Tone:**
   - Friendly and encouraging about sustainability
   - Concise (2-4 sentences unless explaining details)
   - Use occasional emojis: 🌱 for sustainability, ✅ for available, ⚡ for energy
   - Be enthusiastic about eco-friendly choices

6. **Key Facts:**
   - TECH 150 (9.8/10) = Most sustainable, newest building
   - LIB 104 (9.5/10) = Has solar panels
   - Science Center rooms = Smart thermostats + LED lighting
   - Music Building (6.5/10) = Older, less efficient

REMEMBER:
- Always prioritize sustainability unless user specifically asks otherwise
- If ML predictions available, use those scores
- Otherwise, use the database scores provided
- Keep responses under 150 words unless user asks for details`;

    const completion = await groq.chat.completions.create({
      model: 'llama-3.1-70b-versatile', // FREE and fast!
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages.map((msg: any) => ({
          role: msg.role,
          content: msg.content
        }))
      ],
      temperature: 0.7,
      max_tokens: 400,
    });

    return NextResponse.json({
      message: completion.choices[0].message.content
    });

  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json(
      { message: 'Sorry, I encountered an error. Please try again! In the meantime, you can browse available rooms on the left.' },
      { status: 500 }
    );
  }
}