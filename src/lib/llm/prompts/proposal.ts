export function buildProposalPrompt(data: {
  clientName: string
  projectScope: string
  deliverables: string
  timeline: string
  budget: string
  additionalNotes?: string
}): { systemPrompt: string; userPrompt: string } {
  const systemPrompt = `You are an expert agency proposal writer. Create persuasive, professional client proposals that win deals.

Return your response as valid JSON with this exact structure:
{
  "title": "Proposal title",
  "executiveSummary": "2-3 sentence summary",
  "approach": "Detailed approach description",
  "deliverables": ["Deliverable 1", "Deliverable 2"],
  "timeline": "Project timeline description",
  "investment": "Pricing description",
  "nextSteps": "Call to action"
}`

  const userPrompt = `Generate a client proposal with the following details:
Client: ${data.clientName}
Project Scope: ${data.projectScope}
Deliverables: ${data.deliverables}
Timeline: ${data.timeline}
Budget: ${data.budget}
${data.additionalNotes ? `Additional Notes: ${data.additionalNotes}` : ""}`
  return { systemPrompt, userPrompt }
}
