import { geminiService } from './geminiService';

export interface IssueCategorization {
  category: string;
  confidence: number;
  reasoning: string;
}

export const categorizeIssueWithAI = async (
  description: string,
  imageBase64?: string
): Promise<IssueCategorization> => {
  try {
    const prompt = `
    Analyze this civic issue and categorize it into one of these categories:
    - Potholes
    - Waste Management
    - Drainage Issues
    - Traffic Issues
    - Street Lighting
    - Water Supply
    - Public Safety
    - Noise Pollution
    - Air Pollution
    - Other

    Description: "${description}"
    ${imageBase64 ? 'An image has been provided for additional context.' : ''}

    Respond with a JSON object in this format:
    {
      "category": "category_name",
      "confidence": 0.85,
      "reasoning": "Brief explanation of why this category was chosen"
    }
    `;

    const response = await geminiService.getGeneralResponse(prompt);
    
    try {
      // Try to parse JSON response
      const parsed = JSON.parse(response.content);
      return {
        category: parsed.category || 'Other',
        confidence: parsed.confidence || 0.7,
        reasoning: parsed.reasoning || 'Automated categorization'
      };
    } catch (parseError) {
      // Fallback: extract category from text response
      const categoryMatch = response.content.match(/category['":\s]*([^'",\n]+)/i);
      return {
        category: categoryMatch ? categoryMatch[1].trim() : 'Other',
        confidence: 0.6,
        reasoning: 'Automated categorization based on description'
      };
    }
  } catch (error) {
    console.error('AI categorization error:', error);
    return {
      category: 'Other',
      confidence: 0.5,
      reasoning: 'Could not categorize automatically'
    };
  }
};

export const enhanceIssueDescription = async (description: string): Promise<string> => {
  try {
    const prompt = `
    Enhance this civic issue description to be clearer and more detailed while keeping it concise:
    
    Original: "${description}"
    
    Improve the description by:
    - Making it more specific and actionable
    - Adding relevant context if missing
    - Keeping the original meaning intact
    - Making it professional but accessible
    - Limit to 2-3 sentences max
    
    Return only the enhanced description:
    `;

    const response = await geminiService.getGeneralResponse(prompt);
    return response.content.trim().replace(/^["']|["']$/g, ''); // Remove quotes if present
  } catch (error) {
    console.error('Description enhancement error:', error);
    return description; // Return original if enhancement fails
  }
};